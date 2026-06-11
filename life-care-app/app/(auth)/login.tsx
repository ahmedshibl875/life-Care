import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LoginSchema, LoginFormData } from '../../src/types/auth';
import { useAuthStore } from '../../src/store/authStore';
import { apiClient } from '../../src/api/client';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log('[DEBUG] Login submitted with:', { email: data.email.toLowerCase() });
    setIsLoading(true);
    try {
      // API call using Axios instance
      const response = await apiClient.post('/auth/login', {
        email: data.email.toLowerCase(),
        password: data.password,
      });

      console.log('[DEBUG] Login response received:', { status: response.status, hasToken: !!response.data?.token });

      if (response.data.token) {
        console.log('[DEBUG] Saving user session and redirecting...');
        // Save using Zustand + SecureStore
        await login(response.data.token, response.data.user || { id: '0', name: 'Patient', email: data.email, role: 'patient' });
      } else {
        console.warn('[DEBUG] No token received in response:', response.data);
        Alert.alert('خطأ في تسجيل الدخول', 'لم يتم استلام رمز المصادقة من الخادم.');
      }
    } catch (error: any) {
      console.error('[DEBUG] Login failed with error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      const serverErrorMessage = error.response?.data?.error || error.response?.data?.message || 'عذراً، تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
      Alert.alert('فشل تسجيل الدخول', serverErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-20">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mb-6">
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <View className="items-center mb-6">
          <Image 
            source={require('../../assets/images/icon.png')} 
            style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 12 }} 
            resizeMode="contain" 
          />
          <Text className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back 👋</Text>
          <Text className="text-base text-slate-500 text-center leading-6 px-4">Sign in to access your health dashboard and connected devices.</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-2 ml-1">Email Address</Text>
            <View className={`flex-row items-center bg-slate-50 border rounded-2xl h-14 px-4 ${errors.email ? 'border-red-500' : 'border-slate-200'}`}>
              <Ionicons name="mail-outline" size={20} color="#64748B" className="mr-3" />
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="flex-1 h-full text-base text-slate-900"
                    placeholder="name@example.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
            {errors.email && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</Text>}
          </View>

          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-2 ml-1">Password</Text>
            <View className={`flex-row items-center bg-slate-50 border rounded-2xl h-14 px-4 ${errors.password ? 'border-red-500' : 'border-slate-200'}`}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748B" className="mr-3" />
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="flex-1 h-full text-base text-slate-900"
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            {errors.password && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</Text>}
          </View>

          <TouchableOpacity className="self-end mt-2">
            <Text className="text-blue-600 text-sm font-semibold">Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            className={`h-14 rounded-2xl items-center justify-center mt-6 shadow-lg shadow-blue-500/30 ${isLoading ? 'bg-blue-300' : 'bg-blue-600'}`}
          >
            {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white text-lg font-bold">Sign In</Text>}
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center items-center mt-auto mb-10">
          <Text className="text-slate-500 text-base">Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text className="text-blue-600 text-base font-bold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
