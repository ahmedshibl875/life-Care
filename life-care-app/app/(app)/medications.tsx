import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, Modal, TextInput, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';

interface Medication {
  id: string;
  name: string;
  dose: string;
  time: string;
  takenToday: boolean;
  color: string;
}

export default function MedicationsScreen() {
  const [meds, setMeds] = useState<Medication[]>([
    {
      id: '1',
      name: 'Lisinopril',
      dose: '10mg',
      time: '08:00',
      takenToday: false,
      color: '#3B82F6' // blue
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newTime, setNewTime] = useState('');

  const scheduleAlarm = async (name: string, dose: string, timeString: string) => {
    try {
      // timeString format expected "HH:MM"
      const [hour, minute] = timeString.split(':').map(Number);
      if (isNaN(hour) || isNaN(minute)) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "موعد الدواء! 💊",
          body: `حان وقت أخذ ${name} - جرعة: ${dose}`,
          sound: true,
          data: { route: '/(app)/medications' },
        },
        // @ts-ignore - native trigger for daily alarms
        trigger: { hour, minute, repeats: true },
      });
    } catch (e) {
      console.log('Notification schedule failed', e);
    }
  };

  const handleSaveMedication = async () => {
    if (!newName || !newTime) {
      Alert.alert('Error', 'يرجى إدخال اسم الدواء والوقت على الأقل');
      return;
    }

    const newMed: Medication = {
      id: Date.now().toString(),
      name: newName,
      dose: newDose || '1 pill',
      time: newTime,
      takenToday: false,
      color: '#10B981', // green
    };

    setMeds([...meds, newMed]);
    await scheduleAlarm(newMed.name, newMed.dose, newMed.time);
    
    setShowAddModal(false);
    setNewName('');
    setNewDose('');
    setNewTime('');
    Alert.alert('نجاح', 'تم حفظ الدواء وتفعيل المنبه اليومي بنجاح!');
  };

  const markAsTaken = (id: string) => {
    setMeds(meds.map(m => m.id === id ? { ...m, takenToday: true } : m));
  };

  const deleteMed = (id: string) => {
    Alert.alert('حذف الدواء', 'هل أنت متأكد من إلغاء هذا الدواء والمنبه الخاص به؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => setMeds(meds.filter(m => m.id !== id)) }
    ]);
  };

  const renderMedication = ({ item }: { item: Medication }) => (
    <Card className="mb-4 p-4 border-l-4" style={{ borderLeftColor: item.color, opacity: item.takenToday ? 0.6 : 1 }}>
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${item.color}20` }}>
            <Ionicons name="medical" size={24} color={item.color} />
          </View>
          <View>
            <Text className={`text-lg font-bold text-slate-800 ${item.takenToday ? 'line-through' : ''}`}>{item.name}</Text>
            <Text className="text-sm font-bold text-slate-500">{item.dose} • {item.time}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={() => markAsTaken(item.id)}
          className={`w-10 h-10 rounded-full items-center justify-center border ${item.takenToday ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'}`}
        >
          <Ionicons name="checkmark" size={24} color={item.takenToday ? 'white' : '#CBD5E1'} />
        </TouchableOpacity>
      </View>

      <View className="flex-row gap-2 mt-2">
        <TouchableOpacity 
          disabled={item.takenToday}
          onPress={() => markAsTaken(item.id)}
          className={`flex-1 flex-row items-center justify-center py-2 rounded-xl ${item.takenToday ? 'bg-green-100' : 'bg-blue-600'}`}
        >
          <Ionicons name="checkmark-circle" size={18} color={item.takenToday ? '#10B981' : 'white'} className="mr-1" />
          <Text className={`font-bold ${item.takenToday ? 'text-green-600' : 'text-white'}`}>{item.takenToday ? 'تم الأخذ' : 'تسجيل أخذ الدواء'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => deleteMed(item.id)}
          className="flex-row items-center justify-center px-4 py-2 rounded-xl bg-red-50 border border-red-100"
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row justify-between items-center px-6 pb-4 border-b border-slate-200 bg-white" style={{ paddingTop: Platform.OS === 'android' ? 40 : 16 }}>
        <View>
          <Text className="text-2xl font-extrabold text-slate-900">مواعيد الأدوية</Text>
          <Text className="text-sm text-slate-500">نظام التنبيهات الدقيق للأدوية</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setShowAddModal(true)}
          className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center shadow-sm"
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={meds}
        keyExtractor={item => item.id}
        renderItem={renderMedication}
        contentContainerStyle={{ padding: 24 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="notifications-off-outline" size={64} color="#CBD5E1" />
            <Text className="text-lg text-slate-500 font-semibold mt-4">لم تقم بتسجيل أي أدوية بعد</Text>
          </View>
        }
      />

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-slate-50 px-6 pt-8">
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-2xl font-bold text-slate-800">إضافة دواء جديد</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)} className="w-10 h-10 bg-slate-200 rounded-full items-center justify-center">
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-base font-bold text-slate-700 mb-2">اسم الدواء</Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-2xl px-4 py-4 text-base mb-6"
              placeholder="مثال: بانادول"
              value={newName}
              onChangeText={setNewName}
            />

            <Text className="text-base font-bold text-slate-700 mb-2">الجرعة المحددة</Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-2xl px-4 py-4 text-base mb-6"
              placeholder="مثال: حبة واحدة 10مل"
              value={newDose}
              onChangeText={setNewDose}
            />

            <Text className="text-base font-bold text-slate-700 mb-2">وقت التنبيه (HH:MM)</Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-2xl px-4 py-4 text-base mb-8"
              placeholder="مثال: 08:30"
              value={newTime}
              onChangeText={setNewTime}
              keyboardType="numbers-and-punctuation"
            />

            <Button title="حفظ وتفعيل المنبه" onPress={handleSaveMedication} className="py-4" />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
