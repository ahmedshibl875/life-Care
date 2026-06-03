import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Platform, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Card } from '../../src/components/Card';
import { useAuthStore } from '../../src/store/authStore';

interface MedicalDocument {
  id: string;
  name: string;
  date: string;
  type: 'pdf' | 'image' | 'unknown';
  uri?: string;
}

export default function MedicalRecordScreen() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<MedicalDocument[]>([
    {
      id: '1',
      name: 'تحليل دم شامل CBC.pdf',
      date: '12 مايو 2026',
      type: 'pdf'
    },
    {
      id: '2',
      name: 'أشعة رنين مغناطيسي MRI',
      date: '05 أبريل 2026',
      type: 'image'
    }
  ]);

  const mockRecord = {
    bloodType: 'O+',
    weight: '75 kg',
    height: '178 cm',
    allergies: ['البنسلين', 'الفول السوداني'],
    chronicDiseases: ['السكري (النوع الثاني)', 'ارتفاع ضغط الدم'],
    surgeries: [
      { name: 'استئصال الزائدة الدودية', year: '2015' },
      { name: 'عملية تصحيح النظر', year: '2020' }
    ],
    familyHistory: ['أمراض القلب', 'السكري']
  };

  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const newDoc: MedicalDocument = {
        id: Date.now().toString(),
        name: file.name,
        date: new Date().toLocaleDateString('ar-EG', { day: '2-digit', month: 'long', year: 'numeric' }),
        type: file.mimeType?.includes('image') ? 'image' : 'pdf',
        uri: file.uri
      };

      setDocuments([newDoc, ...documents]);
      Alert.alert('تم الرفع', 'تم إضافة الملف بنجاح إلى سجلك الطبي.');
      
    } catch (err) {
      Alert.alert('خطأ', 'حدث خطأ أثناء قراءة الملف.');
    }
  };

  const InfoRow = ({ label, value, icon }: { label: string, value: string, icon: keyof typeof Ionicons.glyphMap }) => (
    <View className="flex-row-reverse items-center justify-between py-3 border-b border-slate-100">
      <View className="flex-row-reverse items-center">
        <View className="bg-blue-50 w-8 h-8 rounded-full items-center justify-center ml-3">
          <Ionicons name={icon} size={16} color="#2563EB" />
        </View>
        <Text className="text-slate-500 font-medium">{label}</Text>
      </View>
      <Text className="text-slate-800 font-bold">{value}</Text>
    </View>
  );

  const TagList = ({ title, items, icon, color }: { title: string, items: string[], icon: keyof typeof Ionicons.glyphMap, color: string }) => (
    <Card className="mb-4 p-4">
      <View className="flex-row-reverse items-center mb-3">
        <Ionicons name={icon} size={24} color={color} className="ml-2" />
        <Text className="text-lg font-bold text-slate-800">{title}</Text>
      </View>
      <View className="flex-row-reverse flex-wrap">
        {items.map((item, index) => (
          <View key={index} className="bg-slate-100 px-3 py-2 rounded-lg ml-2 mb-2 border border-slate-200">
            <Text className="text-slate-700 font-medium">{item}</Text>
          </View>
        ))}
        {items.length === 0 && <Text className="text-slate-400">لا يوجد بيانات</Text>}
      </View>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-6 pb-4 border-b border-slate-200 bg-white" style={{ paddingTop: Platform.OS === 'android' ? 40 : 16 }}>
        <View className="flex-row-reverse items-center justify-between">
          <View className="items-end">
            <Text className="text-2xl font-extrabold text-slate-900">السجل الطبي</Text>
            <Text className="text-sm text-slate-500">التاريخ الطبي والملفات المرفقة</Text>
          </View>
          <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
            <Ionicons name="clipboard" size={24} color="#2563EB" />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <Card className="mb-4 p-4 border-t-4 border-t-blue-500">
          <Text className="text-lg font-bold text-slate-800 mb-2 text-right">المعلومات الأساسية</Text>
          <InfoRow label="فصيلة الدم" value={mockRecord.bloodType} icon="water" />
          <InfoRow label="الوزن" value={mockRecord.weight} icon="body" />
          <InfoRow label="الطول" value={mockRecord.height} icon="resize" />
        </Card>

        {/* Chronic Diseases */}
        <TagList title="الأمراض المزمنة" items={mockRecord.chronicDiseases} icon="pulse" color="#EF4444" />

        {/* Allergies */}
        <TagList title="الحساسية" items={mockRecord.allergies} icon="warning" color="#F59E0B" />

        {/* Surgeries */}
        <Card className="mb-4 p-4">
          <View className="flex-row-reverse items-center mb-3">
            <Ionicons name="medical" size={24} color="#8B5CF6" className="ml-2" />
            <Text className="text-lg font-bold text-slate-800">العمليات الجراحية السابقة</Text>
          </View>
          {mockRecord.surgeries.map((surgery, idx) => (
            <View key={idx} className="flex-row-reverse justify-between items-center py-2 border-b border-slate-50 last:border-0">
              <View className="flex-row-reverse items-center">
                <View className="w-2 h-2 rounded-full bg-purple-500 ml-2" />
                <Text className="text-slate-700 font-medium">{surgery.name}</Text>
              </View>
              <Text className="text-slate-400 text-sm">{surgery.year}</Text>
            </View>
          ))}
        </Card>

        {/* Family History */}
        <TagList title="التاريخ المرضي للعائلة" items={mockRecord.familyHistory} icon="people" color="#10B981" />

        {/* Attached Files Section */}
        <Text className="text-lg font-bold text-slate-800 mt-4 mb-2 text-right">الأشعة والتحاليل المرفقة</Text>
        
        {documents.map((item) => (
          <Card key={item.id} className="mb-3 p-4 border-r-4 border-r-indigo-500">
            <View className="flex-row-reverse items-center mb-3">
              <View className={`w-12 h-12 rounded-xl items-center justify-center ml-3 ${item.type === 'pdf' ? 'bg-red-50' : 'bg-blue-50'}`}>
                <Ionicons 
                  name={item.type === 'pdf' ? 'document-text' : 'image'} 
                  size={24} 
                  color={item.type === 'pdf' ? '#EF4444' : '#3B82F6'} 
                />
              </View>
              <View className="flex-1 items-end">
                <Text className="text-base font-bold text-slate-800 text-right" numberOfLines={1}>{item.name}</Text>
                <Text className="text-xs text-slate-500 mt-1">{item.date}</Text>
              </View>
            </View>
            <View className="flex-row-reverse gap-2">
              <TouchableOpacity className="flex-1 flex-row-reverse items-center justify-center bg-slate-100 py-2 rounded-lg">
                <Ionicons name="eye-outline" size={16} color="#475569" className="ml-1" />
                <Text className="text-slate-700 font-bold text-sm">عرض</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 flex-row-reverse items-center justify-center bg-indigo-50 py-2 rounded-lg">
                <Ionicons name="download-outline" size={16} color="#4F46E5" className="ml-1" />
                <Text className="text-indigo-700 font-bold text-sm">تحميل</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        <TouchableOpacity 
          onPress={handleUploadFile}
          className="border-2 border-dashed border-indigo-300 bg-indigo-50/50 rounded-2xl p-6 items-center justify-center mt-2 mb-8"
        >
          <View className="w-12 h-12 bg-white rounded-full items-center justify-center mb-2 shadow-sm border border-indigo-100">
            <Ionicons name="cloud-upload" size={24} color="#4F46E5" />
          </View>
          <Text className="text-indigo-800 font-bold text-base mb-1">رفع أشعة أو تحليل جديد</Text>
          <Text className="text-indigo-500 text-xs">يدعم ملفات PDF والصور (JPG/PNG)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
