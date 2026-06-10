import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, Modal, TextInput, Platform, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { useAuthStore } from '../../src/store/authStore';

export default function TimelineScreen() {
  const { user } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isManualTime, setIsManualTime] = useState(false);
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState(new Date().toTimeString().substring(0, 5));
  const [submitting, setSubmitting] = useState(false);

  const { data: timelineData, isLoading, refetch } = useQuery({
    queryKey: ['timelineData', user?.id],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/patient/timeline');
        // Data is already sorted and mapped in the backend!
        // Just convert date strings back to Date objects
        return res.data?.data.map((item: any) => ({
          ...item,
          time: new Date(item.time)
        })) || [];
      } catch (error) {
        return [];
      }
    }
  });

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setSubmitting(true);
    try {
      let eventTime = new Date();
      if (isManualTime) {
        eventTime = new Date(`${manualDate}T${manualTime}`);
      }

      await apiClient.post('/notes', {
        noteText,
        eventTime: eventTime.toISOString(),
        type: 'Patient'
      });
      
      setModalVisible(false);
      setNoteText('');
      refetch();
    } catch (error) {
      console.log('Failed to save note', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isAlert = item.type === 'alert';
    const isSystem = item.type === 'system';
    
    let color = '#3B82F6'; // Default (note)
    let icon = 'document-text';

    if (isAlert) {
      color = item.severity === 'Critical' ? '#EF4444' : '#F59E0B';
      icon = 'warning';
    } else if (isSystem) {
      color = item.severity === 'Warning' ? '#64748B' : '#10B981'; // Grey for offline, Green for recovery
      icon = item.severity === 'Warning' ? 'bluetooth-outline' : 'checkmark-circle-outline';
    }

    return (
      <View className="flex-row-reverse mb-6">
        <View className="items-center mr-4 ml-4">
          <View className={`w-10 h-10 rounded-full items-center justify-center`} style={{ backgroundColor: color + '20' }}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <View className="w-0.5 flex-1 bg-slate-200 mt-2" />
        </View>
        
        <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 items-end">
          <Text className="text-sm text-slate-500 mb-1">{item.time.toLocaleString('ar-EG')}</Text>
          <Text className={`text-lg font-bold mb-1`} style={{ color }}>{item.title}</Text>
          <Text className="text-slate-700 text-right leading-5">{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="p-6 pb-2 border-b border-slate-200 flex-row-reverse justify-between items-center bg-white pt-12">
        <Text className="text-2xl font-extrabold text-slate-900">السجل الزمني</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} className="bg-blue-600 px-4 py-2 rounded-full flex-row-reverse items-center">
          <Ionicons name="add" size={20} color="white" />
          <Text className="text-white font-bold ml-1">إضافة ملاحظة</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2563EB" className="mt-10" />
      ) : (
        <FlatList
          data={timelineData}
          keyExtractor={(item, index) => item.id + index}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <Text className="text-center text-slate-500 mt-10">لا توجد أحداث أو ملاحظات مسجلة.</Text>
          }
        />
      )}

      {/* Add Note Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row-reverse justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-900">إضافة ملاحظة جديدة</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TextInput
              className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right mb-4 h-24"
              placeholder="بماذا تشعر؟ (مثال: أشعر بدوار، تناولت الدواء...)"
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              value={noteText}
              onChangeText={setNoteText}
            />

            <View className="flex-row-reverse mb-6">
              <TouchableOpacity 
                onPress={() => setIsManualTime(false)}
                className={`flex-1 py-3 rounded-r-xl border-y border-r border-l border-slate-200 items-center ${!isManualTime ? 'bg-blue-50 border-blue-600' : 'bg-slate-50'}`}
              >
                <Text className={`font-bold ${!isManualTime ? 'text-blue-600' : 'text-slate-500'}`}>الوقت الحالي</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setIsManualTime(true)}
                className={`flex-1 py-3 rounded-l-xl border-y border-l border-slate-200 items-center ${isManualTime ? 'bg-blue-50 border-blue-600' : 'bg-slate-50'}`}
              >
                <Text className={`font-bold ${isManualTime ? 'text-blue-600' : 'text-slate-500'}`}>تحديد وقت آخر</Text>
              </TouchableOpacity>
            </View>

            {isManualTime && (
              <View className="flex-row-reverse space-x-2 mb-6">
                <View className="flex-1 ml-2">
                  <Text className="text-right text-slate-600 mb-1 font-medium">التاريخ</Text>
                  <TextInput
                    className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center"
                    placeholder="YYYY-MM-DD"
                    value={manualDate}
                    onChangeText={setManualDate}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-right text-slate-600 mb-1 font-medium">الوقت</Text>
                  <TextInput
                    className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center"
                    placeholder="HH:MM"
                    value={manualTime}
                    onChangeText={setManualTime}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity 
              onPress={handleSaveNote}
              disabled={submitting}
              className={`bg-blue-600 p-4 rounded-xl items-center ${submitting ? 'opacity-70' : ''}`}
            >
              {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">حفظ الملاحظة</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
