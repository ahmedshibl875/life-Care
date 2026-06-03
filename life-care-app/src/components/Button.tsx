import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ 
  title, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  icon,
  className = '', 
  ...props 
}: ButtonProps) {
  
  const baseStyles = 'rounded-2xl items-center justify-center flex-row';
  
  const variantStyles = {
    primary: 'bg-blue-600 dark:bg-blue-500 shadow-lg shadow-blue-500/30',
    secondary: 'bg-slate-100 dark:bg-slate-800',
    outline: 'bg-transparent border-2 border-slate-200 dark:border-slate-700',
    danger: 'bg-red-500 dark:bg-red-600',
  };

  const textStyles = {
    primary: 'text-white font-bold',
    secondary: 'text-slate-900 dark:text-white font-semibold',
    outline: 'text-slate-700 dark:text-slate-300 font-bold',
    danger: 'text-white font-bold',
  };

  const sizeStyles = {
    sm: 'h-10 px-4',
    md: 'h-14 px-6',
    lg: 'h-16 px-8',
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${isLoading ? 'opacity-70' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? '#2563eb' : '#ffffff'} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`${textStyles[variant]} text-lg`}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
