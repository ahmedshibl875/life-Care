import React, { useState } from 'react';
import { View, Text, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from '../../src/components/Button';
import { apiClient } from '../../src/api/client';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyEmail = async () => {
    if (!email || !code) {
      Alert.alert('تنبيه', 'يرجى إدخال البريد الإلكتروني ورمز التفعيل.');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/verify-otp', { email: email.trim().toLowerCase(), otp: code });
      Alert.alert('تم التأكيد!', 'تم تأكيد حسابك بنجاح. يمكنك الآن تسجيل الدخول.');
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('خطأ', 'رمز التفعيل غير صحيح أو منتهي الصلاحية.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await apiClient.post('/auth/resend-verification');
      Alert.alert('تم', 'تم إرسال رمز تفعيل جديد إلى بريدك الإلكتروني.');
    } catch (error) {
      Alert.alert('خطأ', 'تعذر إرسال الرمز. حاول مجدداً لاحقاً.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1 px-8 justify-center"
      >
        <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-6 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
          <Ionicons name="arrow-back" size={24} color="#64748B" />
        </TouchableOpacity>

        <View className="items-center mb-8 mt-12">
          <View className="w-20 h-20 bg-indigo-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="mail-open" size={40} color="#4F46E5" />
          </View>
          <Text className="text-3xl font-extrabold text-slate-900 mb-2">تأكيد البريد الإلكتروني</Text>
          <Text className="text-center text-slate-500 leading-6">
            أدخل بريدك الإلكتروني والرمز المكون من 6 أرقام لتفعيل حسابك.
          </Text>
        </View>

        <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-14 mb-4 shadow-sm">
          <Ionicons name="mail-outline" size={20} color="#94A3B8" className="mr-3" />
          <TextInput
            className="flex-1 text-base text-right ml-2 text-slate-800"
            placeholder="البريد الإلكتروني"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-16 mb-6 shadow-sm">
          <TextInput
            className="flex-1 text-2xl font-bold text-center text-slate-800 tracking-[10px]"
            placeholder="------"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
        </View>

        <Button 
          title="تأكيد الحساب" 
          onPress={handleVerifyEmail} 
          isLoading={isLoading} 
          className="py-4 bg-indigo-600 border-indigo-600 mb-4"
        />

        <View className="flex-row justify-center items-center">
          <Text className="text-slate-500">لم يصلك الرمز؟ </Text>
          <TouchableOpacity onPress={handleResendCode}>
            <Text className="text-indigo-600 font-bold">إعادة الإرسال</Text>
          </TouchableOpacity>
        </View>
        
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
