import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../src/store/authStore';

export default function Header() {
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation<any>();
  const { logout } = useAuthStore();

  const handleNavigate = (path: string) => {
    setMenuVisible(false);
    let screenName = 'Dashboard';
    if (path.includes('profile')) {
      screenName = 'Profile';
    } else if (path.includes('medications')) {
      screenName = 'Medications';
    } else if (path.includes('add-contact')) {
      screenName = 'AddCompanionPatient';
    }
    navigation.navigate(screenName);
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
  };

  return (
    <View className="bg-white border-b border-slate-200 p-4 flex-row-reverse items-center justify-between">
      <Text className="text-2xl font-bold text-slate-900">Life Care</Text>
      <TouchableOpacity onPress={() => setMenuVisible(true)} className="p-2">
        <Ionicons name="menu" size={28} color="#2563EB" />
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setMenuVisible(false)}>
          <View className="absolute top-12 right-4 w-56 bg-white rounded-lg shadow-lg">
            {/* Profile */}
            <TouchableOpacity onPress={() => handleNavigate('/(app)/profile')} className="flex-row items-center p-3 border-b border-slate-100">
              <Ionicons name="person" size={20} color="#2563EB" className="mr-2" />
              <Text className="text-slate-800">Profile</Text>
            </TouchableOpacity>
            {/* Change Language */}
            <TouchableOpacity onPress={() => handleNavigate('/(app)/profile')} className="flex-row items-center p-3 border-b border-slate-100">
              <Ionicons name="globe" size={20} color="#64748B" className="mr-2" />
              <Text className="text-slate-800">Change Language</Text>
            </TouchableOpacity>
            {/* Add Medication */}
            <TouchableOpacity onPress={() => handleNavigate('/(app)/medications')} className="flex-row items-center p-3 border-b border-slate-100">
              <Ionicons name="add" size={20} color="#10B981" className="mr-2" />
              <Text className="text-slate-800">Add Medication</Text>
            </TouchableOpacity>
            {/* Add Companion/Doctor */}
            <TouchableOpacity onPress={() => handleNavigate('/(app)/add-contact')} className="flex-row items-center p-3 border-b border-slate-100">
              <Ionicons name="people" size={20} color="#F59E0B" className="mr-2" />
              <Text className="text-slate-800">Add Companion/Doctor</Text>
            </TouchableOpacity>
            {/* Logout */}
            <TouchableOpacity onPress={handleLogout} className="flex-row items-center p-3">
              <Ionicons name="log-out" size={20} color="#EF4444" className="mr-2" />
              <Text className="text-slate-800">Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
