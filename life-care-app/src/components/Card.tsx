import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <View 
      className={`bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-700 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
