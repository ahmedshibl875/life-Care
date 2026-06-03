import React, { useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, Modal, TextInput, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';

interface Caregiver {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
}

export default function CaregiversScreen() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([
    { id: '1', name: 'علي أحمد', relation: 'ابن', phone: '+123456789', isPrimary: true }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleGenerateCode = () => {
    if (!newName || !newPhone) {
      Alert.alert('خطأ', 'يرجى إدخال الاسم ورقم الهاتف على الأقل.');
      return;
    }
    const code = 'LC-' + Math.floor(1000 + Math.random() * 9000);
    setGeneratedCode(code);
  };

  const handleCopyAndSave = () => {
    // In a real app we would use expo-clipboard
    setCaregivers(prev => [...prev, {
      id: Date.now().toString(),
      name: newName,
      relation: newRelation || 'مرافق',
      phone: newPhone,
      isPrimary: false
    }]);

    setShowAddModal(false);
    setGeneratedCode(null);
    setNewName('');
    setNewRelation('');
    setNewPhone('');
    Alert.alert('نجاح', 'تم الحفظ! أرسل الرمز للمرافق لكي يربط حسابه بحسابك.');
  };

  const renderCaregiver = ({ item }: { item: Caregiver }) => (
    <Card className={`mb-4 p-5 border-l-4 ${item.isPrimary ? 'border-l-blue-500' : 'border-l-slate-300'}`}>
      {item.isPrimary && (
        <View className="absolute top-4 left-4 bg-blue-100 px-3 py-1 rounded-full">
          <Text className="text-blue-700 text-xs font-bold">أساسي</Text>
        </View>
      )}

      <View className="flex-row items-center mb-5">
        <View className="w-14 h-14 bg-blue-600 rounded-full items-center justify-center mr-4 shadow-sm">
          <Ionicons name="heart-half" size={28} color="white" />
        </View>
        <View>
          <Text className="text-xl font-bold text-slate-800">{item.name}</Text>
          <Text className="text-sm font-semibold text-slate-500 mt-1">{item.relation} • {item.phone}</Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-blue-50 border border-blue-200 py-3 rounded-xl">
          <Ionicons name="call" size={18} color="#2563EB" className="mr-2" />
          <Text className="text-blue-700 font-bold ml-1">اتصال الآن</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-amber-50 border border-amber-200 py-3 rounded-xl">
          <Ionicons name="notifications" size={18} color="#D97706" className="mr-2" />
          <Text className="text-amber-700 font-bold ml-1">تنبيه SOS</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-6 pb-4 border-b border-slate-200 bg-white flex-row justify-between items-center" style={{ paddingTop: Platform.OS === 'android' ? 40 : 16 }}>
        <View>
          <Text className="text-2xl font-extrabold text-slate-900">العائلة والمرافقين</Text>
          <Text className="text-sm text-slate-500">إدارة جهات الاتصال للطوارئ</Text>
        </View>
        <TouchableOpacity className="bg-red-50 px-3 py-2 border border-red-200 rounded-lg flex-row items-center">
          <Ionicons name="warning" size={16} color="#EF4444" />
          <Text className="text-red-600 font-bold text-xs ml-1">SOS</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={caregivers}
        keyExtractor={item => item.id}
        renderItem={renderCaregiver}
        contentContainerStyle={{ padding: 24 }}
        ListHeaderComponent={
          <TouchableOpacity 
            onPress={() => setShowAddModal(true)}
            className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-2xl p-6 items-center justify-center mb-6"
          >
            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-3">
              <Ionicons name="person-add" size={24} color="#2563EB" />
            </View>
            <Text className="text-blue-700 font-bold text-lg">إضافة فرد عائلة / مرافق</Text>
          </TouchableOpacity>
        }
      />

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white w-full rounded-3xl p-6 shadow-lg">
            {!generatedCode ? (
              <>
                <Text className="text-xl font-bold text-center text-blue-600 mb-2">إضافة مرافق جديد</Text>
                <Text className="text-sm text-center text-slate-500 mb-6">أدخل البيانات لإنشاء رمز ربط خاص به</Text>

                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 mb-4 h-14">
                  <Ionicons name="person" size={20} color="#2563EB" className="mr-3" />
                  <TextInput className="flex-1 text-base text-right ml-2" placeholder="اسم المرافق" value={newName} onChangeText={setNewName} />
                </View>

                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 mb-4 h-14">
                  <Ionicons name="people" size={20} color="#2563EB" className="mr-3" />
                  <TextInput className="flex-1 text-base text-right ml-2" placeholder="صلة القرابة (مثال: ابن)" value={newRelation} onChangeText={setNewRelation} />
                </View>

                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 mb-6 h-14">
                  <Ionicons name="call" size={20} color="#2563EB" className="mr-3" />
                  <TextInput className="flex-1 text-base text-right ml-2" placeholder="رقم الهاتف" keyboardType="phone-pad" value={newPhone} onChangeText={setNewPhone} />
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity onPress={() => setShowAddModal(false)} className="flex-1 bg-slate-100 py-4 rounded-xl items-center">
                    <Text className="text-slate-700 font-bold text-base">إلغاء</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleGenerateCode} className="flex-1 bg-blue-600 py-4 rounded-xl items-center">
                    <Text className="text-white font-bold text-base">إنشاء الرمز</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View className="items-center py-4">
                <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                </View>
                <Text className="text-2xl font-bold text-slate-800 mb-2">تم إنشاء الرمز!</Text>
                <Text className="text-center text-slate-500 mb-6 leading-6">
                  أرسل هذا الرمز لـ "{newName}". يمكنه استخدامه لربط حسابه بحالتك.
                </Text>
                
                <View className="w-full bg-blue-50 border-2 border-dashed border-blue-300 p-4 rounded-2xl items-center mb-6">
                  <Text className="text-3xl font-black text-blue-600 tracking-widest">{generatedCode}</Text>
                </View>

                <Button title="حفظ ونسخ الرمز" onPress={handleCopyAndSave} className="w-full py-4" />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
