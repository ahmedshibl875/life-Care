import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RegisterSchema, RegisterFormData } from '../../src/types/auth';

const DISEASES = ['السكري', 'ضغط الدم', 'أمراض القلب', 'الربو', 'لا يوجد', 'أخرى'];

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: '',
      dob: '',
      medicalConditions: 'لا يوجد',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'patient',
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Navigate to OTP screen and pass the registration data
      router.push({
        pathname: '/(auth)/otp',
        params: {
          name: data.name,
          dob: data.dob,
          medicalConditions: data.medicalConditions,
          phone: data.phone,
          email: data.email.toLowerCase(),
          password: data.password,
          role: data.role,
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to process registration form');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }} className="flex-1 px-6 pt-20">
        
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mb-6">
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <View className="items-center mb-6">
          <Image 
            source={require('../../assets/images/icon.png')} 
            style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 12 }} 
            resizeMode="contain" 
          />
          <Text className="text-3xl font-extrabold text-slate-900 mb-2">Create Account ✨</Text>
          <Text className="text-base text-slate-500 text-center leading-6 px-4">Join Life Care to track your health and connect with top doctors easily.</Text>
        </View>

        <View className="space-y-4">

          {/* Account Type (Role) */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-slate-700 mb-3 ml-1">I am a...</Text>
            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    onPress={() => onChange('patient')}
                    className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${value === 'patient' ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <Ionicons name="body" size={20} color={value === 'patient' ? '#2563EB' : '#64748B'} />
                    <Text className={`ml-2 font-semibold ${value === 'patient' ? 'text-blue-600' : 'text-slate-500'}`}>Patient</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onChange('companion')}
                    className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${value === 'companion' ? 'bg-emerald-50 border-emerald-600' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <Ionicons name="people" size={20} color={value === 'companion' ? '#059669' : '#64748B'} />
                    <Text className={`ml-2 font-semibold ${value === 'companion' ? 'text-emerald-600' : 'text-slate-500'}`}>Companion</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onChange('doctor')}
                    className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${value === 'doctor' ? 'bg-purple-50 border-purple-600' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <Ionicons name="medkit" size={20} color={value === 'doctor' ? '#9333EA' : '#64748B'} />
                    <Text className={`ml-2 font-semibold ${value === 'doctor' ? 'text-purple-600' : 'text-slate-500'}`}>Doctor</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
          
          {/* Full Name */}
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-2 ml-1">Full Name</Text>
            <View className={`flex-row items-center bg-slate-50 border rounded-2xl h-14 px-4 ${errors.name ? 'border-red-500' : 'border-slate-200'}`}>
              <Ionicons name="person-outline" size={20} color="#64748B" className="mr-3" />
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="flex-1 h-full text-base text-slate-900"
                    placeholder="John Doe"
                    placeholderTextColor="#94A3B8"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
            {errors.name && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.name.message}</Text>}
          </View>

          {/* Conditional Fields for Patient */}
          {selectedRole === 'patient' && (
            <>
              {/* Date of Birth */}
              <View>
                <Text className="text-sm font-semibold text-slate-700 mb-2 ml-1">Date of Birth</Text>
                <View className={`flex-row items-center bg-slate-50 border rounded-2xl h-14 px-4 ${errors.dob ? 'border-red-500' : 'border-slate-200'}`}>
                  <Ionicons name="calendar-outline" size={20} color="#64748B" className="mr-3" />
                  <Controller
                    control={control}
                    name="dob"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className="flex-1 h-full text-base text-slate-900"
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#94A3B8"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                </View>
                {errors.dob && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.dob.message}</Text>}
              </View>

              {/* Medical Conditions */}
              <View>
                <Text className="text-sm font-semibold text-slate-700 mb-2 ml-1">Medical Condition</Text>
                <Controller
                  control={control}
                  name="medicalConditions"
                  render={({ field: { onChange, value } }) => (
                    <View className="flex-row flex-wrap gap-2">
                      {DISEASES.map((disease) => (
                        <TouchableOpacity
                          key={disease}
                          onPress={() => onChange(disease)}
                          className={`px-4 py-2 rounded-full border ${value === disease ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <Text className={`${value === disease ? 'text-white font-bold' : 'text-slate-600'}`}>{disease}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
              </View>
            </>
          )}

          {/* Phone Number */}
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-2 ml-1">Phone Number</Text>
            <View className={`flex-row items-center bg-slate-50 border rounded-2xl h-14 px-4 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}>
              <Ionicons name="call-outline" size={20} color="#64748B" className="mr-3" />
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="flex-1 h-full text-base text-slate-900"
                    placeholder="01123456789"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
            {errors.phone && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.phone.message}</Text>}
          </View>

          {/* Email Address */}
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

          {/* Password */}
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
                    placeholder="Create a strong password"
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

          {/* Confirm Password */}
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-2 ml-1">Confirm Password</Text>
            <View className={`flex-row items-center bg-slate-50 border rounded-2xl h-14 px-4 ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'}`}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748B" className="mr-3" />
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="flex-1 h-full text-base text-slate-900"
                    placeholder="Confirm your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showConfirmPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-2">
                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword.message}</Text>}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            className={`h-14 rounded-2xl items-center justify-center mt-6 shadow-lg shadow-blue-500/30 ${isLoading ? 'bg-blue-300' : 'bg-blue-600'}`}
          >
            {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white text-lg font-bold">Continue</Text>}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="flex-row justify-center items-center mt-10 pb-10">
          <Text className="text-slate-500 text-base">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text className="text-blue-600 text-base font-bold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
