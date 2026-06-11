import React, { useState } from 'react';
import Header from '../../src/components/Header';
import * as ImagePicker from 'react-native-image-picker';
import { Image } from 'react-native';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<any>();
  const [isRtl, setIsRtl] = useState(false); // Can be linked to global language state later

  const handleLogout = () => {
    Alert.alert(
      isRtl ? 'تسجيل الخروج' : 'Logout',
      isRtl ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to log out?',
      [
        { text: isRtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { 
          text: isRtl ? 'خروج' : 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            // App automatically redirects to login because of _layout.tsx auth listener
          }
        }
      ]
    );
  };

  const toggleLanguage = () => {
    setIsRtl(!isRtl);
    Alert.alert(
      'Language Updated', 
      isRtl ? 'تم تغيير اللغة إلى الإنجليزية (Note: Full RTL requires reloading the app)' : 'Language changed to Arabic (Note: Full RTL requires reloading the app)'
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: Platform.OS === 'android' ? 50 : 20 }}>
        
        {/* Profile Header */}
        <View className="items-center mb-8 mt-4">
        <Header />
          <TouchableOpacity onPress={async () => {
              const result = await ImagePicker.launchImageLibrary({
                mediaType: 'photo',
                includeBase64: false,
                maxHeight: 800,
                maxWidth: 800,
                selectionLimit: 1,
              });
              if (result.didCancel) {
                // cancelled
              } else if (result.assets && result.assets.length > 0) {
                setAvatarUri(result.assets[0].uri);
              }
            }} className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-white shadow-sm">
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} className="w-full h-full" />
            ) : (
              <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center">
                <Ionicons name="person" size={48} color="#2563EB" />
              </View>
            )}
          </TouchableOpacity>
            <Ionicons name="person" size={48} color="#2563EB" />
          </View>
          <Text className="text-2xl font-bold text-slate-800">{user?.name || 'User Name'}</Text>
          <Text className="text-sm font-semibold text-slate-500 uppercase mt-1 tracking-widest">{user?.role || 'Guest'}</Text>
          <Text className="text-base text-slate-500 mt-1">{user?.email || 'email@example.com'}</Text>
        </View>

        {/* Medical Management Menu */}
        <Text className="text-lg font-bold text-slate-800 mb-3">{isRtl ? 'إدارة العناية الطبية' : 'Medical Management'}</Text>
        
        <Card className="p-0 mb-6 overflow-hidden border border-slate-100">
          <TouchableOpacity onPress={() => router.push('/(app)/medications')} className="flex-row items-center p-4 border-b border-slate-100">
            <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center mr-3">
              <Ionicons name="medical" size={20} color="#10B981" />
            </View>
            <Text className="flex-1 text-base text-slate-700 font-semibold">{isRtl ? 'مواعيد الأدوية' : 'Medications'}</Text>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.push('/(app)/caregivers')} className="flex-row items-center p-4 border-b border-slate-100">
            <View className="w-10 h-10 bg-amber-50 rounded-full items-center justify-center mr-3">
              <Ionicons name="people" size={20} color="#F59E0B" />
            </View>
            <Text className="flex-1 text-base text-slate-700 font-semibold">{isRtl ? 'المرافقين والعائلة' : 'Caregivers & Family'}</Text>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(app)/reports')} className="flex-row items-center p-4 border-b border-slate-100">
            <View className="w-10 h-10 bg-indigo-50 rounded-full items-center justify-center mr-3">
              <Ionicons name="document-text" size={20} color="#6366F1" />
            </View>
            <Text className="flex-1 text-base text-slate-700 font-semibold">{isRtl ? 'التقارير والتحاليل' : 'Medical Reports'}</Text>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </Card>

        {/* Account Settings */}
        <Text className="text-lg font-bold text-slate-800 mb-3">{isRtl ? 'إعدادات الحساب' : 'Account Settings'}</Text>
        
        <Card className="p-0 mb-6 overflow-hidden border border-slate-100">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-slate-100">
            <View className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center mr-3">
              <Ionicons name="person-outline" size={20} color="#64748B" />
            </View>
            <Text className="flex-1 text-base text-slate-700 font-semibold">{isRtl ? 'تعديل الملف الشخصي' : 'Edit Profile'}</Text>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={toggleLanguage} className="flex-row items-center p-4">
            <View className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center mr-3">
              <Ionicons name="globe-outline" size={20} color="#64748B" />
            </View>
            <Text className="flex-1 text-base text-slate-700 font-semibold">{isRtl ? 'تغيير اللغة (English)' : 'Change Language (العربية)'}</Text>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </Card>

        {/* Support & Legal */}
        <Text className="text-lg font-bold text-slate-800 mb-3">{isRtl ? 'الدعم الفني والقانوني' : 'Support & Legal'}</Text>
        
        <Card className="p-0 mb-8 overflow-hidden border border-slate-100">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-slate-100">
            <View className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center mr-3">
              <Ionicons name="help-circle-outline" size={20} color="#64748B" />
            </View>
            <Text className="flex-1 text-base text-slate-700 font-semibold">{isRtl ? 'مركز المساعدة' : 'Help Center'}</Text>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4">
            <View className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center mr-3">
              <Ionicons name="document-text-outline" size={20} color="#64748B" />
            </View>
            <Text className="flex-1 text-base text-slate-700 font-semibold">{isRtl ? 'سياسة الخصوصية' : 'Privacy Policy'}</Text>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </Card>

        {/* Logout Button */}
        <Button 
          title={isRtl ? 'تسجيل الخروج' : 'Log Out'} 
          variant="outline" 
          onPress={handleLogout}
          className="border-red-200 bg-red-50 py-4"
        />
        
        <Text className="text-center text-xs text-slate-400 mt-6 mb-10">Life Care App v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}
