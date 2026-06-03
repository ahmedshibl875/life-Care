import React, { useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Platform } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';

// Types based on the Web app responses
interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  hospital: string;
}

interface ConnectedDoctor {
  id: string;
  connId: string;
  name: string;
  special: string;
  status: 'pending' | 'approved';
}

export default function DoctorsScreen() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorIdInput, setDoctorIdInput] = useState('');
  const [isMutating, setIsMutating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch connected doctors
  const { data: connectedDoctors = [], refetch: refetchConnected, isLoading: isLoadingConnected } = useQuery({
    queryKey: ['connectedDoctors', user?.id],
    queryFn: async () => {
      const res = await apiClient.get('/connections/get_patient_doctors');
      if (res.data?.data) {
        return res.data.data.map((conn: any) => ({
          id: conn.doctor_id?._id,
          connId: conn._id,
          name: conn.doctor_id?.name || 'Unknown',
          special: conn.doctor_id?.specialty || 'Specialist',
          status: conn.status
        })) as ConnectedDoctor[];
      }
      return [];
    }
  });

  // 2. Fetch all platform doctors
  const { data: allDoctors = [], refetch: refetchAll } = useQuery({
    queryKey: ['allDoctors'],
    queryFn: async () => {
      const res = await apiClient.get('/patient/doctors-list');
      return (res.data?.data || []) as Doctor[];
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchConnected(), refetchAll()]);
    setRefreshing(false);
  };

  const sendFollowRequest = async (doctorId: string) => {
    if (!doctorId) return;
    setIsMutating(true);
    try {
      const res = await apiClient.post('/connections/send_follow_request', { doctor_id: doctorId });
      Alert.alert('Success', 'Follow request sent successfully!');
      setDoctorIdInput('');
      refetchConnected();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Could not send request.');
    } finally {
      setIsMutating(false);
    }
  };

  const verifyAndSendRequest = async () => {
    if (!doctorIdInput.trim()) return;
    setIsMutating(true);
    try {
      // First verify
      const verifyRes = await apiClient.get(`/connections/verify_doctor/${doctorIdInput.toUpperCase()}`);
      if (verifyRes.data?.doctor) {
        // Automatically send request if found
        await sendFollowRequest(verifyRes.data.doctor._id);
      } else {
        Alert.alert('Not Found', 'Doctor not found with this ID.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Doctor not found with this ID.');
    } finally {
      setIsMutating(false);
    }
  };

  const endFollowUp = (connId: string) => {
    Alert.alert(
      'End Follow-up',
      'Are you sure you want to end follow-up with this doctor?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.put(`/connections/end_follow_up/${connId}`);
              refetchConnected();
            } catch (error) {
              Alert.alert('Error', 'Could not end follow-up');
            }
          }
        }
      ]
    );
  };

  const renderConnectedDoctor = ({ item }: { item: ConnectedDoctor }) => (
    <Card className={`mb-4 border-l-4 ${item.status === 'approved' ? 'border-l-green-500' : 'border-l-amber-500'}`}>
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3">
            <Ionicons name="person" size={24} color="#2563EB" />
          </View>
          <View className="flex-1 pr-2">
            <Text className="text-lg font-bold text-slate-800">{item.name}</Text>
            <View className="flex-row items-center mt-1">
              <Ionicons 
                name={item.status === 'pending' ? 'time-outline' : 'checkmark-circle'} 
                size={14} 
                color={item.status === 'pending' ? '#F59E0B' : '#10B981'} 
                className="mr-1"
              />
              <Text className={`text-sm ${item.status === 'pending' ? 'text-amber-500' : 'text-green-600'}`}>
                {item.status === 'pending' ? 'Pending Approval...' : item.special}
              </Text>
            </View>
          </View>
        </View>

        {item.status === 'approved' && (
          <TouchableOpacity 
            onPress={() => endFollowUp(item.connId)}
            className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50"
          >
            <Text className="text-red-500 text-xs font-bold">End</Text>
          </TouchableOpacity>
        )}
      </View>

      {item.status === 'approved' && (
        <View className="flex-row gap-2 mt-2">
          <Button 
            title="Call" 
            variant="secondary" 
            size="sm" 
            className="flex-1 bg-green-50" 
            icon={<Ionicons name="call" size={16} color="#10B981" />} 
          />
          <Button 
            title="Book" 
            variant="primary" 
            size="sm" 
            className="flex-1" 
            icon={<Ionicons name="calendar" size={16} color="#ffffff" />} 
          />
        </View>
      )}
    </Card>
  );

  const HeaderComponent = () => (
    <View className="pb-4">
      <Text className="text-2xl font-extrabold text-slate-900 mb-1">Your Care Team</Text>
      <Text className="text-sm text-slate-500 mb-6">Manage your connected doctors and send new follow-up requests.</Text>

      {/* Manual ID Add */}
      <Card className="mb-6 bg-blue-50 border-blue-100">
        <Text className="text-lg font-bold text-slate-800 mb-1">Add by Doctor ID</Text>
        <Text className="text-sm text-slate-500 mb-4">Enter Doctor ID to verify and start follow-up.</Text>
        <View className="flex-row gap-2">
          <View className="flex-1 bg-white border border-slate-200 rounded-xl px-4 h-12 justify-center">
            <TextInput
              placeholder="DOC12345..."
              value={doctorIdInput}
              onChangeText={text => setDoctorIdInput(text.toUpperCase())}
              autoCapitalize="characters"
              className="flex-1 font-bold text-slate-700"
            />
          </View>
          <Button 
            title="Add" 
            size="sm" 
            isLoading={isMutating}
            onPress={verifyAndSendRequest}
            disabled={!doctorIdInput.trim()}
          />
        </View>
      </Card>

      <Text className="text-xl font-bold text-slate-800 mb-4">Connected Doctors</Text>
      
      {isLoadingConnected && !refreshing && (
        <ActivityIndicator size="small" color="#2563EB" className="mb-4" />
      )}
      
      {!isLoadingConnected && connectedDoctors.length === 0 && (
        <Text className="text-slate-500 text-center py-4 bg-slate-100 rounded-2xl mb-4">No doctors following your case yet.</Text>
      )}
    </View>
  );

  // We only use FlatList for connected doctors to optimize rendering.
  // The 'Browse All Doctors' can be in a modal or separate screen for better mobile UX, 
  // but for now, we'll keep it simple focusing on the care team.

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <FlatList
        data={connectedDoctors}
        keyExtractor={(item) => item.connId}
        renderItem={renderConnectedDoctor}
        ListHeaderComponent={HeaderComponent}
        contentContainerStyle={{ padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" colors={['#2563EB']} />
        }
      />
    </SafeAreaView>
  );
}
