import React from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export function Input({ 
  label, 
  error, 
  icon, 
  isPassword, 
  className = '', 
  ...props 
}: InputProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <View className={`mb-4 ${className}`}>
      {label && <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">{label}</Text>}
      
      <View className={`flex-row items-center bg-slate-50 dark:bg-slate-900 border rounded-2xl h-14 px-4 
        ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`}>
        
        {icon && <Ionicons name={icon} size={20} color={error ? "#EF4444" : "#64748B"} className="mr-3" />}
        
        <TextInput
          className="flex-1 h-full text-base text-slate-900 dark:text-white"
          placeholderTextColor="#94A3B8"
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2" activeOpacity={0.7}>
            <Ionicons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color="#64748B" 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
}
