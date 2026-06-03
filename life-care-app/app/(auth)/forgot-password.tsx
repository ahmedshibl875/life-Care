import React, { useState } from 'react';
import { View, Text, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/Button';
import { apiClient } from '../../src/api/client';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetCode = async () => {
    if (!email) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني الخاص بك');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      Alert.alert('تم الإرسال!', 'تم إرسال رمز استعادة كلمة المرور إلى بريدك الإلكتروني.');
      router.push('/(auth)/reset-password');
    } catch (error) {
      Alert.alert('خطأ', 'البريد الإلكتروني غير مسجل لدينا أو حدث خطأ في الخادم.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="lock-closed" size={40} color="#2563EB" />
          </View>
          <Text className="text-3xl font-extrabold text-slate-900 mb-2">نسيت كلمة المرور؟</Text>
          <Text className="text-center text-slate-500 leading-6">
            لا تقلق! أدخل بريدك الإلكتروني المسجل لدينا وسنقوم بإرسال رمز الاستعادة إليك فوراً.
          </Text>
        </View>

        <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-14 mb-8 shadow-sm">
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

        <Button 
          title="إرسال رمز الاستعادة" 
          onPress={handleSendResetCode} 
          isLoading={isLoading} 
          className="py-4"
        />
        
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
