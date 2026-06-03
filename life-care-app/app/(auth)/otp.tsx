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
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      // Clean phone number (backend requires ^[0-9]+$)
      const cleanPhone = (params.phone as string || '').replace(/[^0-9]/g, '');
      const email = (params.email as string || '').toLowerCase();

      // Format disease and fallback if invalid
      const validDiseases = ['السكري', 'ضغط الدم', 'أمراض القلب', 'الربو', 'لا يوجد', 'أخرى'];
      const rawDisease = params.medicalConditions as string;
      const disease = validDiseases.includes(rawDisease) ? rawDisease : 'لا يوجد';

      // 1. Call register first since the frontend didn't call it in register.tsx
      try {
        await apiClient.post('/auth/register', {
          name: params.name,
          email: email,
          phone: cleanPhone || '0000000000',
          companion_phone: cleanPhone || '0000000000', // fallback to same phone
          password: params.password,
          date_of_birth: params.dob || '2000-01-01', // fallback valid date
          disease: disease,
          role: params.role || 'patient',
        });
      } catch (regError: any) {
        // If the error is that the email already exists, we can proceed to verify OTP
        const errMsg = regError.response?.data?.error || '';
        const errList = regError.response?.data?.errors || [];
        if (!errMsg.includes('مسجل بالفعل') && !errMsg.includes('already exists')) {
            throw regError; // rethrow if it's a different error
        }
      }

      // 2. Verify OTP
      const verifyResponse = await apiClient.post('/auth/verify-otp', {
        email: email,
        otp: otp
      });

      Alert.alert('Success', 'Account verified successfully! You can now login.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
      
    } catch (error: any) {
      console.log('Error data:', error.response?.data);
      const serverError = error.response?.data?.error;
      const serverErrors = error.response?.data?.errors;
      const errorMessage = serverError || (serverErrors && serverErrors.join('\n')) || error.message || 'Server error. Please try again later.';
      Alert.alert('Verification Failed', errorMessage);
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
          
          <TouchableOpacity className="items-center mt-4">
            <Text className="text-blue-600 font-semibold">Resend Code</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}
