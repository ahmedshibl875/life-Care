import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { apiClient } from '../../src/api/client';

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login } = useAuthStore();
  
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length < 6) {
      Alert.alert('خطأ', 'الرجاء إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    console.log('[DEBUG] OTP Verification started with:', { email: params.email, otp });
    setIsLoading(true);
    try {
      const cleanPhone = (params.phone as string || '').replace(/[^0-9]/g, '');
      const email = (params.email as string || '').toLowerCase();

      const validDiseases = ['السكري', 'ضغط الدم', 'أمراض القلب', 'الربو', 'لا يوجد', 'أخرى'];
      const rawDisease = params.medicalConditions as string;
      const disease = validDiseases.includes(rawDisease) ? rawDisease : 'لا يوجد';

      // 1. Call register first since the frontend didn't call it in register.tsx
      console.log('[DEBUG] Registering user in backend first...');
      try {
        const regRes = await apiClient.post('/auth/register', {
          name: params.name,
          email: email,
          phone: cleanPhone || '0000000000',
          companion_phone: cleanPhone || '0000000000',
          password: params.password,
          date_of_birth: params.dob || '2000-01-01',
          disease: disease,
          role: params.role || 'patient',
        });
        console.log('[DEBUG] Registration response received:', regRes.data);
      } catch (regError: any) {
        console.warn('[DEBUG] Registration call encountered error:', {
          status: regError.response?.status,
          data: regError.response?.data,
        });
        const errMsg = regError.response?.data?.error || '';
        const errList = regError.response?.data?.errors || [];
        const isAlreadyRegistered = errMsg.includes('مسجل بالفعل') || errMsg.includes('already exists') || errList.some((e: string) => e.includes('already exists') || e.includes('مسجل بالفعل'));
        
        if (!isAlreadyRegistered) {
          throw regError; // rethrow if it is a validation or connection error
        }
        console.log('[DEBUG] User is already registered, continuing to OTP verification.');
      }

      // 2. Verify OTP
      console.log('[DEBUG] Verifying OTP...');
      const verifyResponse = await apiClient.post('/auth/verify-otp', {
        email: email,
        otp: otp
      });
      console.log('[DEBUG] OTP verification response received:', verifyResponse.data);

      Alert.alert('تم بنجاح', 'تم تأكيد الحساب بنجاح! يمكنك الآن تسجيل الدخول.', [
        { text: 'موافق', onPress: () => router.replace('/(auth)/login') }
      ]);
      
    } catch (error: any) {
      console.error('[DEBUG] Verification failed with error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      const serverError = error.response?.data?.error;
      const serverErrors = error.response?.data?.errors;
      const errorMessage = serverError || (serverErrors && serverErrors.join('\n')) || error.message || 'عذراً، فشل التحقق من الرمز.';
      Alert.alert('فشل التأكيد', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const email = (params.email as string || '').toLowerCase();
    console.log('[DEBUG] Requesting resend verification code for:', email);
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/resend-verification', { email });
      console.log('[DEBUG] Resend verification code response:', response.data);
      Alert.alert('تم الإرسال', response.data.message || 'تم إعادة إرسال رمز التحقق بنجاح.');
    } catch (error: any) {
      console.error('[DEBUG] Resending code failed with error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
      const serverError = error.response?.data?.error || 'تعذر إعادة إرسال الرمز.';
      Alert.alert('فشل إعادة الإرسال', serverError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-20">
        
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mb-6">
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text className="text-3xl font-extrabold text-slate-900 mb-2">Verify Phone 📱</Text>
        <Text className="text-base text-slate-500 mb-8 leading-6">
          We've sent a 6-digit verification code to {params.phone || 'your phone'}. Enter it below to activate your account.
        </Text>

        <View className="space-y-6">
          <View className="bg-slate-50 border border-slate-200 rounded-2xl h-16 px-4 justify-center">
            <TextInput
              className="text-center text-2xl tracking-[0.5em] font-bold text-slate-900"
              placeholder="000000"
              placeholderTextColor="#CBD5E1"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
          </View>

          <TouchableOpacity
            onPress={handleVerify}
            disabled={isLoading || otp.length < 6}
            className={`h-14 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/30 ${(isLoading || otp.length < 6) ? 'bg-blue-300' : 'bg-blue-600'}`}
          >
            {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white text-lg font-bold">Verify & Create Account</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleResend} disabled={isLoading} className="items-center mt-4">
            <Text className="text-blue-600 font-semibold">Resend Code</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}
