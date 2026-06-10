import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';

interface Patient {
  _id: string;
  connId: string;
  name: string;
  age: number;
  condition: string;
  status: 'critical' | 'stable' | 'warning';
  lastUpdate: string;
  vitals: {
    hr: number;
    bp: string;
    bg: number;
    temp: number;
    spo2: number;
  };
}

interface PendingRequest {
  connId: string;
  name: string;
}

export default function PatientsScreen() {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  
  // Modal State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'patient', text: 'Hello Doctor, I feel a bit tired today.', time: '10:00 AM' },
    { id: 2, sender: 'doctor', text: 'Welcome. Did you stick to the prescribed medication schedule?', time: '10:05 AM' }
  ]);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['doctorPatients', user?.id],
    queryFn: async () => {
      const res = await apiClient.get('/connections/get_doctor_patients');
      if (res.data?.data) {
        const approved = res.data.data.filter((c: any) => c.status === 'approved').map((c: any) => ({
          _id: c.patient_id?._id,
          connId: c._id,
          name: c.patient_id?.name || 'Unknown',
          age: 45, // Mock age
          condition: 'Under Observation',
          status: 'stable',
          vitals: { hr: 75, bp: '120/80', bg: 95, temp: 36.8, spo2: 98 },
          lastUpdate: 'Just now'
        })) as Patient[];

        const pending = res.data.data.filter((c: any) => c.status === 'pending').map((c: any) => ({
          connId: c._id,
          name: c.patient_id?.name || 'Unknown Patient'
        })) as PendingRequest[];

        return { approved, pending };
      }
      return { approved: [], pending: [] };
    }
  });

  const handleAction = useCallback(async (connId: string, action: 'approve' | 'reject') => {
    setIsMutating(true);
    try {
      await apiClient.put(`/connections/${action}_follow_request/${connId}`);
      Alert.alert('Success', `Request ${action}d successfully`);
      refetch();
    } catch (error) {
      Alert.alert('Error', `Could not ${action} request`);
    } finally {
      setIsMutating(false);
    }
  }, [refetch]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'doctor',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setChatInput('');
  };

  const getStatusIndicator = (key: string, v: any) => {
    let text = 'Normal';
    let color = '#10B981'; // success
    const setLow = () => { text = 'Low'; color = '#F59E0B'; }; // warning
    const setHigh = () => { text = 'High'; color = '#EF4444'; }; // danger

    if (key === 'hr') {
      if (v < 60) setLow(); else if (v > 100) setHigh();
    } else if (key === 'temp') {
      if (v < 36.1) setLow(); else if (v > 37.5) setHigh();
    } else if (key === 'spo2') {
      if (v < 95) setLow();
    } else if (key === 'bg') {
      if (v < 70) setLow(); else if (v > 140) setHigh();
    } else if (key === 'bp') {
      const parts = String(v).split('/');
      if (parts.length === 2) {
        const sys = Number(parts[0]); const dia = Number(parts[1]);
        if (sys < 90 || dia < 60) setLow(); else if (sys > 120 || dia > 80) setHigh();
      }
    }
    return { text, color };
  };

  const renderPending = useCallback(({ item }: { item: PendingRequest }) => (
    <Card className="mb-3 border-l-4 border-l-amber-500 py-3">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center flex-1">
          <Ionicons name="person-circle" size={32} color="#F59E0B" />
          <Text className="text-base font-bold ml-2 text-slate-800">{item.name}</Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={() => handleAction(item.connId, 'approve')} disabled={isMutating} className="bg-green-100 px-3 py-2 rounded-lg">
            <Text className="text-green-700 font-bold text-xs">Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleAction(item.connId, 'reject')} disabled={isMutating} className="bg-red-100 px-3 py-2 rounded-lg">
            <Text className="text-red-700 font-bold text-xs">Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  ), [handleAction, isMutating]);

  const renderPatient = useCallback(({ item }: { item: Patient }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={() => setSelectedPatient(item)}>
      <Card className={`mb-3 border-l-4 ${item.status === 'critical' ? 'border-l-red-500' : 'border-l-green-500'}`}>
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center">
            <View className="bg-slate-100 p-2 rounded-full mr-3">
              <Ionicons name="person" size={24} color="#64748B" />
            </View>
            <View>
              <Text className="text-lg font-bold text-slate-800">{item.name}</Text>
              <Text className="text-sm text-slate-500">{item.age} yrs • {item.condition}</Text>
            </View>
          </View>
          <Ionicons name="pulse" size={24} color={item.status === 'critical' ? '#EF4444' : '#10B981'} />
        </View>
        <View className="pt-3 border-t border-slate-100 mt-2">
          <Text className="text-xs text-slate-400">Last data sync: {item.lastUpdate}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  ), []);

  const ListHeader = useCallback(() => (
    <View className="pb-2">
      <Text className="text-2xl font-extrabold text-slate-900 mb-1">Patients & Requests</Text>
      <Text className="text-sm text-slate-500 mb-6">Manage your active patients and handle new requests.</Text>

      {data?.pending && data.pending.length > 0 && (
        <View className="mb-6">
          <Text className="text-lg font-bold text-amber-600 mb-3">Pending Requests</Text>
          {data.pending.map(req => <React.Fragment key={req.connId}>{renderPending({item: req})}</React.Fragment>)}
        </View>
      )}

      <Text className="text-lg font-bold text-slate-800 mb-3">Active Patients</Text>
      {data?.approved.length === 0 && (
        <Text className="text-slate-500 text-center py-6 bg-slate-100 rounded-2xl">No active patients to follow up on.</Text>
      )}
    </View>
  ), [data?.pending, data?.approved.length, renderPending]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      
      {isLoading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList 
          data={data?.approved || []}
          keyExtractor={(item) => item.connId}
          renderItem={renderPatient}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refetch()} tintColor="#2563EB" colors={['#2563EB']} />}
        />
      )}

      {/* Patient Details Modal */}
      <Modal visible={!!selectedPatient} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedPatient(null)}>
        {selectedPatient && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-slate-50">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center p-4 bg-white border-b border-slate-200">
              <View className="flex-row items-center">
                <View className="bg-blue-600 p-2 rounded-full mr-3">
                  <Ionicons name="person" size={20} color="white" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-slate-800">{selectedPatient.name}</Text>
                  <Text className="text-xs text-slate-500">{selectedPatient.condition}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedPatient(null)}>
                <Ionicons name="close" size={28} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
              {/* Vitals Grid */}
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-base font-bold text-slate-800">Latest Vitals</Text>
                <Button title="Report" size="sm" variant="outline" className="h-8 px-3" />
              </View>
              
              <View className="flex-row flex-wrap justify-between">
                {[
                  { key: 'hr', icon: 'heart', color: '#EF4444', label: 'Heart Rate', val: selectedPatient.vitals.hr, unit: 'bpm' },
                  { key: 'bp', icon: 'water', color: '#F59E0B', label: 'Blood Pressure', val: selectedPatient.vitals.bp, unit: '' },
                  { key: 'spo2', icon: 'leaf', color: '#10B981', label: 'SpO2', val: selectedPatient.vitals.spo2, unit: '%' },
                  { key: 'bg', icon: 'water-outline', color: '#3B82F6', label: 'Glucose', val: selectedPatient.vitals.bg, unit: 'mg/dL' },
                ].map((item, i) => {
                  const stat = getStatusIndicator(item.key, item.val);
                  return (
                    <Card key={i} className="w-[48%] mb-3 p-3">
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                      <Text className="text-xs text-slate-500 mt-2">{item.label}</Text>
                      <Text className="text-lg font-bold text-slate-800">{item.val} <Text className="text-xs font-normal">{item.unit}</Text></Text>
                      <View className="flex-row items-center mt-1">
                        <View className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: stat.color }} />
                        <Text style={{ color: stat.color, fontSize: 10, fontWeight: 'bold' }}>{stat.text}</Text>
                      </View>
                    </Card>
                  );
                })}
              </View>

              {/* Chat Section */}
              <Text className="text-base font-bold text-slate-800 mt-4 mb-3">Chat</Text>
              {messages.map(msg => {
                const isMe = msg.sender === 'doctor';
                return (
                  <View key={msg.id} className={`mb-3 ${isMe ? 'items-end' : 'items-start'}`}>
                    <View className={`p-3 max-w-[80%] ${isMe ? 'bg-blue-600 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl' : 'bg-white border border-slate-200 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl'}`}>
                      <Text className={isMe ? 'text-white' : 'text-slate-800'}>{msg.text}</Text>
                    </View>
                    <Text className="text-xs text-slate-400 mt-1">{msg.time}</Text>
                  </View>
                );
              })}
            </ScrollView>

            {/* Chat Input */}
            <View className="flex-row p-3 bg-white border-t border-slate-200 items-center">
              <TextInput
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Type a message..."
                className="flex-1 bg-slate-100 h-12 rounded-full px-4 mr-2 text-slate-800"
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity onPress={handleSendMessage} className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center">
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>
    </SafeAreaView>
  );
}
