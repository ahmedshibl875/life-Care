import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Platform, TouchableOpacity, Alert, Dimensions, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LineChart } from 'react-native-chart-kit';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { useAuthStore } from '../../src/store/authStore';
import { Card } from '../../src/components/Card';
import { generateAndShareReport } from '../../src/utils/pdfGenerator';

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
  const { user } = useAuthStore();
  const [selectedPeriod, setSelectedPeriod] = useState<number>(7);

  // Map 7 days to 'weekly', 30 days to 'monthly'
  const rangeStr = selectedPeriod === 7 ? 'weekly' : selectedPeriod === 30 ? 'monthly' : 'daily';

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['advancedReports', user?.id, rangeStr],
    queryFn: async () => {
      try {
        const [summaryRes, trendsRes, correlationsRes, insightsRes] = await Promise.all([
          apiClient.get('/reports/summary').catch(() => ({ data: { data: null } })),
          apiClient.get(`/reports/trends?range=${rangeStr}`).catch(() => ({ data: { data: null } })),
          apiClient.get('/reports/correlations').catch(() => ({ data: { data: [] } })),
          apiClient.get('/reports/insights').catch(() => ({ data: { data: [] } }))
        ]);

        return {
          summary: summaryRes.data?.data || { totalAlerts: 0, highestHR: 0, lowestHR: 0, abnormalPeriods: [] },
          trends: trendsRes.data?.data || { labels: ['السبت', 'الأحد', 'الإثنين'], heartRate: [72, 75, 71], spO2: [98, 97, 98] },
          correlations: correlationsRes.data?.data || [],
          insights: insightsRes.data?.data || []
        };
      } catch (error) {
        return null;
      }
    }
  });

  const handleExportPDF = async () => {
    if (!reportData) return;
    try {
      await generateAndShareReport({
        patientName: user?.name || 'مريض غير معروف',
        patientId: user?.id || 'N/A',
        date: new Date().toLocaleDateString('ar-EG'),
        summary: reportData.summary,
        insights: reportData.insights,
        correlations: reportData.correlations
      });
    } catch (e) {
      Alert.alert('خطأ', 'حدث خطأ أثناء استخراج ملف PDF');
    }
  };

  const PeriodButton = ({ days, label }: { days: number, label: string }) => (
    <TouchableOpacity 
      onPress={() => setSelectedPeriod(days)}
      className={`px-4 py-2 rounded-xl mx-1 border ${selectedPeriod === days ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}
    >
      <Text className={`font-bold ${selectedPeriod === days ? 'text-white' : 'text-slate-600'}`}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-6 pb-4 border-b border-slate-200 bg-white" style={{ paddingTop: Platform.OS === 'android' ? 40 : 16 }}>
        <View className="flex-row-reverse items-center justify-between">
          <View className="items-end">
            <Text className="text-2xl font-extrabold text-slate-900">التقارير والإحصائيات</Text>
            <Text className="text-sm text-slate-500">تحليلات متقدمة، ورؤى ذكية لحالتك الصحية</Text>
          </View>
          <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
            <Ionicons name="bar-chart" size={24} color="#2563EB" />
          </View>
        </View>
      </View>

      {isLoading || !reportData ? (
        <ActivityIndicator size="large" color="#2563EB" className="mt-10" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          
          <Text className="text-lg font-bold text-slate-800 mb-3 text-right">تحليل الرؤى الذكية (AI Insights)</Text>
          {reportData.insights.length > 0 ? reportData.insights.map((insight: any, i: number) => (
            <Card key={i} className="mb-4 bg-blue-50 border-l-4 border-l-blue-600 p-4">
              <Text className="text-blue-800 font-bold text-lg text-right mb-1">{insight.title}</Text>
              <Text className="text-blue-700 text-right leading-5">{insight.description}</Text>
            </Card>
          )) : (
             <Text className="text-center text-slate-500 mb-6">لا توجد تحليلات متاحة حالياً.</Text>
          )}

          <Text className="text-lg font-bold text-slate-800 mb-3 text-right">ارتباط الملاحظات والأعراض</Text>
          {reportData.correlations.length > 0 ? reportData.correlations.map((c: any, i: number) => (
            <Card key={i} className="mb-4 bg-red-50 border-r-4 border-r-red-500 p-4 items-end">
              <Text className="text-slate-800 font-bold mb-1">ملاحظة: "{c.note}"</Text>
              <Text className="text-red-600 text-sm mb-2">ارتبطت بالتنبيه: {c.relatedAlerts[0]?.description || 'تنبيه'}</Text>
            </Card>
          )) : (
             <Text className="text-center text-slate-500 mb-6 mt-2">لا توجد ملاحظات مرتبطة بتغيرات في المؤشرات الحيوية.</Text>
          )}

          <Text className="text-lg font-bold text-slate-800 mb-3 text-right">اختر فترة الرسم البياني</Text>
          <View className="flex-row-reverse justify-center mb-6">
            <PeriodButton days={1} label="يومي" />
            <PeriodButton days={7} label="أسبوعي" />
            <PeriodButton days={30} label="شهري" />
          </View>

          <Text className="text-lg font-bold text-slate-800 mb-3 text-right">معدل نبض القلب</Text>
          <Card className="p-0 overflow-hidden mb-6 items-center border-0 bg-white shadow-sm">
            <LineChart
              data={{
                labels: reportData.trends.labels,
                datasets: [{ data: reportData.trends.heartRate.length > 0 ? reportData.trends.heartRate : [0] }]
              }}
              width={screenWidth - 48}
              height={220}
              chartConfig={{
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#ffffff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: "5", strokeWidth: "2", stroke: "#EF4444" }
              }}
              bezier
              style={{ borderRadius: 16 }}
            />
          </Card>

          <Text className="text-lg font-bold text-slate-800 mb-3 text-right">نسبة الأكسجين بالدم</Text>
          <Card className="p-0 overflow-hidden mb-6 items-center border-0 bg-white shadow-sm">
            <LineChart
              data={{
                labels: reportData.trends.labels,
                datasets: [{ data: reportData.trends.spO2.length > 0 ? reportData.trends.spO2 : [0] }]
              }}
              width={screenWidth - 48}
              height={220}
              chartConfig={{
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#ffffff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: "5", strokeWidth: "2", stroke: "#10B981" }
              }}
              bezier
              style={{ borderRadius: 16 }}
            />
          </Card>

          <TouchableOpacity 
            onPress={handleExportPDF}
            className="bg-blue-600 rounded-2xl p-4 flex-row-reverse items-center justify-center mb-8 shadow-sm"
          >
            <Ionicons name="document-text" size={24} color="white" className="ml-3" />
            <Text className="text-white font-bold text-lg">استخراج تقرير طبي شامل (PDF)</Text>
          </TouchableOpacity>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

