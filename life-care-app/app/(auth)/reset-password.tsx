import React, { useState } from 'react';
import { View, Text, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/Button';
import { apiClient } from '../../src/api/client';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleResetPassword = async () => {
    if (!code || !newPassword || !confirmPassword) {
      Alert.alert('تنبيه', 'يرجى إكمال جميع الحقول الفارغة.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('خطأ', 'كلمات المرور غير متطابقة.');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post(`/auth/reset-password/${code}`, { newPassword });
      Alert.alert('تم بنجاح!', 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.');
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('خطأ', 'رمز الاستعادة غير صحيح أو منتهي الصلاحية.');
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
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="key" size={40} color="#10B981" />
          </View>
          <Text className="text-3xl font-extrabold text-slate-900 mb-2">تعيين كلمة مرور جديدة</Text>
          <Text className="text-center text-slate-500 leading-6">
            أدخل الرمز الذي أرسلناه إلى بريدك الإلكتروني، ثم قم بتعيين كلمة المرور الجديدة.
          </Text>
        </View>

        <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-14 mb-4 shadow-sm">
          <Ionicons name="shield-checkmark-outline" size={20} color="#94A3B8" className="mr-3" />
          <TextInput
            className="flex-1 text-base text-right ml-2 text-slate-800 tracking-widest"
            placeholder="رمز الاستعادة (Code)"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
          />
        </View>

        <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-14 mb-4 shadow-sm">
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="mr-3">
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
          </TouchableOpacity>
          <TextInput
            className="flex-1 text-base text-right ml-2 text-slate-800"
            placeholder="كلمة المرور الجديدة"
            secureTextEntry={!showPassword}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" className="ml-3" />
        </View>

        <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-14 mb-8 shadow-sm">
          <TextInput
            className="flex-1 text-base text-right mr-2 text-slate-800"
            placeholder="تأكيد كلمة المرور"
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" className="ml-3" />
        </View>

        <Button 
          title="حفظ وتسجيل الدخول" 
          onPress={handleResetPassword} 
          isLoading={isLoading} 
          className="py-4 bg-green-600 border-green-600"
        />
        
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
