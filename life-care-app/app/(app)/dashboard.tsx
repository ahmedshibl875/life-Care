import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from '../../src/components/Header';
import { View, Text, SafeAreaView, ScrollView, RefreshControl, ActivityIndicator, Dimensions, TouchableOpacity, Platform, Vibration, Modal, useColorScheme } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { useBLE } from '../../src/hooks/useBLE';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { connectedDevice, scanForDevices, connectToDevice, heartRate, spO2, temperature, bloodPressure } = useBLE();
  const [criticalAlert, setCriticalAlert] = useState<any>(null);
  const [alertSound, setAlertSound] = useState<Audio.Sound | null>(null);

  const currentVitals = useRef({ heartRate, spO2, temperature, bloodPressure });
  useEffect(() => {
    currentVitals.current = { heartRate, spO2, temperature, bloodPressure };
  }, [heartRate, spO2, temperature, bloodPressure]);

  const lastDataTime = useRef(Date.now());
  const hasLoggedOffline = useRef(false);
  const prevVitals = useRef({ heartRate: 0, spO2: 0, temp: 0 });

  useEffect(() => {
    if (!connectedDevice) return;
    
    lastDataTime.current = Date.now();
    if (hasLoggedOffline.current) {
      hasLoggedOffline.current = false;
      apiClient.post('/events', {
        eventType: 'RECOVERY',
        details: 'تم استعادة تدفق البيانات من الجهاز الطبي'
      }).catch(() => {});
    }
    
    const syncInterval = setInterval(() => {
      const v = currentVitals.current;
      if (v.heartRate) {
        apiClient.post('/patient/vitals/sync', {
          heartRate: v.heartRate,
          oxygen: v.spO2,
          temperature: v.temperature,
          bloodPressure: v.bloodPressure
        }).catch(err => console.log('Background Sync Failed', err));
      }
    }, 60000);

    const watchdogInterval = setInterval(() => {
      if (Date.now() - lastDataTime.current > 60000 && !hasLoggedOffline.current) {
        hasLoggedOffline.current = true;
        apiClient.post('/events', {
          eventType: 'DEVICE_OFFLINE',
          details: 'انقطع الاتصال بالجهاز الطبي، لم يتم استلام قراءات منذ أكثر من دقيقة',
          lastKnownValues: {
            heartRate: prevVitals.current.heartRate,
            spO2: prevVitals.current.spO2,
            temperature: prevVitals.current.temp
          }
        }).catch(() => {});
      }
    }, 10000);
    
    return () => {
      clearInterval(syncInterval);
      clearInterval(watchdogInterval);
    };
  }, [connectedDevice]); // Only recreate when connection changes

  // Fetch dynamic patient baseline
  const { data: baselineRes } = useQuery({
    queryKey: ['patientBaseline', user?.id],
    queryFn: async () => {
      const res = await apiClient.get('/patient/baseline');
      return res.data?.data; 
    },
    enabled: !!user?.id && user.role === 'patient'
  });

  useEffect(() => {
    if (!baselineRes) return;
    
    let isSensorError = false;
    const hr = currentVitals.current.heartRate;
    const o2 = currentVitals.current.spO2;
    const tmp = currentVitals.current.temperature;
    
    if (hr) {
      if (hr > 250 || hr < 20) isSensorError = true;
      if (prevVitals.current.heartRate > 0 && Math.abs(hr - prevVitals.current.heartRate) > 50) isSensorError = true;
      prevVitals.current.heartRate = hr;
    }
    
    if (o2) {
      if (o2 > 100 || o2 < 30) isSensorError = true;
      prevVitals.current.spO2 = o2;
    }
    
    if (tmp) {
      if (tmp > 45 || tmp < 30) isSensorError = true;
      prevVitals.current.temp = tmp;
    }

    if (isSensorError) return;

    let triggeredAlert = null;
    let threshold = 0;
    
    const hrUpper = baselineRes.hrAvg + (2 * baselineRes.hrSD);
    const hrLower = Math.max(30, baselineRes.hrAvg - (2 * baselineRes.hrSD));
    const spo2Lower = Math.max(80, baselineRes.spo2Avg - (2 * baselineRes.spo2SD));
    const tempUpper = baselineRes.tempAvg + (2 * baselineRes.tempSD);
    const tempLower = baselineRes.tempAvg - (2 * baselineRes.tempSD);

    if (hr && hr > hrUpper) { triggeredAlert = `نبض القلب مرتفع عن معدلك الطبيعي (${hrUpper.toFixed(0)})`; threshold = Math.round(hrUpper); }
    else if (hr && hr < hrLower) { triggeredAlert = `نبض القلب منخفض عن معدلك الطبيعي (${hrLower.toFixed(0)})`; threshold = Math.round(hrLower); }
    
    if (o2 && o2 < spo2Lower) { triggeredAlert = `نقص أكسجين عن المعتاد لك (${spo2Lower.toFixed(0)})`; threshold = Math.round(spo2Lower); }
    if (tmp && tmp > tempUpper) { triggeredAlert = `حمى شديدة مقارنة بحرارتك المعتادة (${tempUpper.toFixed(1)})`; threshold = Number(tempUpper.toFixed(1)); }
    if (tmp && tmp < tempLower) { triggeredAlert = `انخفاض حرارة عن المعتاد لك (${tempLower.toFixed(1)})`; threshold = Number(tempLower.toFixed(1)); }

    if (triggeredAlert && !criticalAlert) {
      setCriticalAlert({ message: triggeredAlert, value: hr || o2 || tmp, threshold });
      Vibration.vibrate([500, 500, 500, 500], true);
      
      const playSound = async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(require('../../assets/images/icon.png'), { isLooping: true });
          setAlertSound(sound);
        } catch (e) {}
      };
      playSound();

      apiClient.post('/alerts', {
        sensorType: triggeredAlert.includes('نبض') ? 'Heart Rate' : triggeredAlert.includes('أكسجين') ? 'SpO2' : 'Body Temperature',
        readingValue: hr || o2 || tmp,
        threshold: threshold,
        severity: 'Critical',
        details: triggeredAlert
      }).catch(err => console.log('Failed to save alert', err));
    }
  }, [heartRate, spO2, temperature, baselineRes]);

  const dismissAlert = () => {
    setCriticalAlert(null);
    Vibration.cancel();
    if (alertSound) {
      alertSound.stopAsync();
      alertSound.unloadAsync();
    }
  };

  // TanStack Query to fetch dashboard data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboardData', user?.id],
    queryFn: async () => {
      let alertsCount = 0;
      try {
        const [alertsRes, notesRes] = await Promise.all([
          apiClient.get('/alerts').catch(() => ({ data: { data: [] } })),
          apiClient.get('/notes').catch(() => ({ data: { data: [] } }))
        ]);
        alertsCount = alertsRes.data?.data?.filter((a: any) => !a.resolvedStatus).length || 0;
        notesCount = notesRes.data?.data?.length || 0;
      } catch (error) {}

      // Simulating network delay for loading states
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        alertsCount,
        notesCount,
        vitals: {
          heartRate: 72,
          temp: 36.6,
          bp: '120/80',
        },
        chartData: [65, 68, 74, 72, 78, 71],
        activities: [
          { id: '1', title: 'Heart Rate Measured', time: '10 mins ago', value: '72 bpm', icon: 'heart', color: '#EF4444' },
          { id: '2', title: 'Medication Taken', time: '2 hours ago', value: 'Aspirin', icon: 'medical', color: '#3B82F6' },
          { id: '3', title: 'Blood Pressure', time: 'Yesterday', value: '120/80', icon: 'water', color: '#8B5CF6' },
          { id: '4', title: 'Temperature', time: 'Yesterday', value: '36.6°C', icon: 'thermometer', color: '#F59E0B' },
        ] as HealthActivity[]
      };
    }
  });

  const [isDeviceModalVisible, setDeviceModalVisible] = useState(false);

  const startScan = () => {
    setDeviceModalVisible(true);
    scanForDevices();
  };

  const connectAndClose = (device: any) => {
    connectToDevice(device);
    setDeviceModalVisible(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderActivity = useCallback(({ item }: { item: HealthActivity }) => (
    <Card className="mb-3 flex-row-reverse items-center p-4">
      <View className={`w-12 h-12 rounded-full items-center justify-center opacity-20`} style={{ backgroundColor: item.color }} />
      <View className="absolute mr-4 w-12 h-12 items-center justify-center">
        <Ionicons name={item.icon} size={24} color={item.color} />
      </View>
      <View className="flex-1 mr-4 items-end">
        <Text className="text-base font-bold text-slate-800 dark:text-white">{item.title}</Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.time}</Text>
      </View>
      <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.value}</Text>
    </Card>
  ), []);

  const HeaderComponent = () => (
    <View className="pb-6">
      {/* Top Bar */}
      <View className="flex-row-reverse justify-between items-center mb-6">
        <View className="items-end">
          <Text className="text-sm text-slate-500 font-medium">مرحباً بك،</Text>
          <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">👋 {user?.name || 'مريض'}</Text>
        </View>
        <View className="flex-row-reverse">
          <TouchableOpacity className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm ml-2">
            <Ionicons name="notifications-outline" size={20} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} className="w-10 h-10 bg-red-50 rounded-full items-center justify-center border border-red-100">
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dashboard Alert Cards */}
      <View className="flex-row-reverse justify-between mb-6">
        <View className="w-[48%] bg-red-500 rounded-3xl p-4 items-end shadow-md">
          <Ionicons name="warning" size={28} color="white" className="mb-2" />
          <Text className="text-red-100 text-sm font-medium">تنبيهات حرجة (نشطة)</Text>
          <Text className="text-white font-extrabold text-2xl">{data?.alertsCount || 0}</Text>
        </View>
        <View className="w-[48%] bg-blue-600 rounded-3xl p-4 items-end shadow-md">
          <Ionicons name="document-text" size={28} color="white" className="mb-2" />
          <Text className="text-blue-100 text-sm font-medium">ملاحظات المريض</Text>
          <Text className="text-white font-extrabold text-2xl">{data?.notesCount || 0}</Text>
        </View>
      </View>

      {/* BLE Connection Status */}
      {!connectedDevice && user?.role === 'patient' && (
        <TouchableOpacity 
          onPress={startScan}
          className="bg-slate-800 rounded-2xl p-4 flex-row-reverse items-center justify-center mb-6 shadow-sm"
        >
          <Ionicons name="bluetooth" size={24} color="white" className="ml-3" />
          <Text className="text-white font-bold text-lg">الاتصال بالجهاز الطبي</Text>
        </TouchableOpacity>
      )}

      {connectedDevice && (
        <View className="bg-green-50 border border-green-200 rounded-2xl p-3 flex-row-reverse items-center justify-center mb-6">
          <Ionicons name="checkmark-circle" size={20} color="#10B981" className="ml-2" />
          <Text className="text-green-700 font-bold">متصل بـ {connectedDevice.name}</Text>
        </View>
      )}

      {/* Vitals Grid */}
      <Text className="text-lg font-bold text-slate-800 mb-4 mr-1 text-right">المؤشرات الأساسية</Text>
      
      {data && (
        <View className="flex-row-reverse flex-wrap justify-between">
          {/* Heart Rate */}
          <Card className="w-[48%] items-end mb-4 p-4 border-l-4 border-l-red-500">
            <View className="flex-row-reverse justify-between w-full mb-2">
              <View className="bg-red-50 p-2 rounded-xl">
                <Ionicons name="heart" size={20} color="#EF4444" />
              </View>
              <Text className="text-slate-500 text-xs">طبيعي</Text>
            </View>
            <Text className="text-slate-500 text-sm mb-1 font-medium">نبض القلب</Text>
            <View className="flex-row-reverse items-end">
              <Text className="text-2xl font-bold text-slate-800 ml-1">
                {connectedDevice && heartRate ? heartRate : data.vitals.heartRate}
              </Text>
              <Text className="text-xs text-slate-500 mb-1">BPM</Text>
            </View>
          </Card>

          {/* Blood Pressure */}
          <Card className="w-[48%] items-end mb-4 p-4 border-l-4 border-l-blue-500">
            <View className="flex-row-reverse justify-between w-full mb-2">
              <View className="bg-blue-50 p-2 rounded-xl">
                <Ionicons name="water" size={20} color="#3B82F6" />
              </View>
            </View>
            <Text className="text-slate-500 text-sm mb-1 font-medium">ضغط الدم</Text>
            <View className="flex-row-reverse items-end">
              <Text className="text-2xl font-bold text-slate-800 ml-1">
                {connectedDevice && bloodPressure ? bloodPressure : data.vitals.bp}
              </Text>
              <Text className="text-xs text-slate-500 mb-1">mmHg</Text>
            </View>
          </Card>

          {/* SpO2 */}
          <Card className="w-[48%] items-end mb-4 p-4 border-l-4 border-l-green-500">
            <View className="flex-row-reverse justify-between w-full mb-2">
              <View className="bg-green-50 p-2 rounded-xl">
                <Ionicons name="leaf" size={20} color="#10B981" />
              </View>
            </View>
            <Text className="text-slate-500 text-sm mb-1 font-medium">نسبة الأكسجين</Text>
            <View className="flex-row-reverse items-end">
              <Text className="text-2xl font-bold text-slate-800 ml-1">
                {connectedDevice && spO2 ? spO2 : '98'}
              </Text>
              <Text className="text-xs text-slate-500 mb-1">%</Text>
            </View>
          </Card>

          {/* Temperature */}
          <Card className="w-[48%] items-end mb-4 p-4 border-l-4 border-l-orange-500">
            <View className="flex-row-reverse justify-between w-full mb-2">
              <View className="bg-orange-50 p-2 rounded-xl">
                <Ionicons name="thermometer" size={20} color="#F59E0B" />
              </View>
            </View>
            <Text className="text-slate-500 text-sm mb-1 font-medium">درجة الحرارة</Text>
            <View className="flex-row-reverse items-end">
              <Text className="text-2xl font-bold text-slate-800 ml-1">
                {connectedDevice && temperature ? temperature : data.vitals.temp}
              </Text>
              <Text className="text-xs text-slate-500 mb-1">°C</Text>
            </View>
          </Card>

          {/* Blood Sugar (Mock) */}
          <Card className="w-[48%] items-end mb-4 p-4">
            <View className="bg-purple-50 p-2 rounded-xl mb-2">
              <Ionicons name="medical" size={20} color="#8B5CF6" />
            </View>
            <Text className="text-slate-500 text-sm mb-1 font-medium">مستوى السكر</Text>
            <View className="flex-row-reverse items-end">
              <Text className="text-2xl font-bold text-slate-800 ml-1">110</Text>
              <Text className="text-xs text-slate-500 mb-1">mg/dL</Text>
            </View>
          </Card>

          {/* Sleep Quality (Mock) */}
          <Card className="w-[48%] items-end mb-4 p-4">
            <View className="bg-indigo-50 p-2 rounded-xl mb-2">
              <Ionicons name="moon" size={20} color="#6366F1" />
            </View>
            <Text className="text-slate-500 text-sm mb-1 font-medium">جودة النوم</Text>
            <View className="flex-row-reverse items-end">
              <Text className="text-2xl font-bold text-slate-800 ml-1">7.5</Text>
              <Text className="text-xs text-slate-500 mb-1">ساعات</Text>
            </View>
          </Card>
        </View>
      )}

      {/* Activity Section */}
      <Text className="text-lg font-bold text-slate-800 mb-4 mr-1 text-right mt-2">النشاط والحركة</Text>
      <Card className="flex-row-reverse items-center justify-between p-5 mb-8">
        <View className="items-end">
          <Text className="text-slate-500 font-medium mb-1">الخطوات اليومية</Text>
          <Text className="text-3xl font-extrabold text-slate-800">2,450</Text>
          <Text className="text-sm text-green-600 font-medium mt-1">الهدف: 6,000</Text>
        </View>
        <View className="w-24 h-24 rounded-full border-8 border-slate-100 justify-center items-center relative">
          <View className="absolute inset-0 rounded-full border-8 border-blue-500 border-t-transparent border-l-transparent" style={{ transform: [{ rotate: '45deg' }] }}></View>
          <Ionicons name="walk" size={32} color="#3B82F6" />
        </View>
      </Card>

      {/* React Native Chart Kit */}
      <Text className="text-lg font-bold text-slate-800 mb-4 mr-1 text-right">معدل نبضات القلب</Text>
      {data && (
        <Card className="p-0 overflow-hidden mb-8 items-center border-0 bg-white">
          <LineChart
            data={{
              labels: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"],
              datasets: [{ data: data.chartData }]
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
              propsForDots: { r: "6", strokeWidth: "2", stroke: "#EF4444" }
            }}
            bezier
            style={{ borderRadius: 16, paddingRight: 30 }}
          />
        </Card>
      )}

      <Text className="text-lg font-bold text-slate-800 mb-4 mr-1 text-right">النشاط الأخير</Text>
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-slate-500 font-semibold">جاري تحميل البيانات...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center px-6">
        <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
        <Text className="mt-4 text-slate-800 font-bold text-lg">فشل تحميل البيانات</Text>
        <Text className="text-slate-500 text-center mt-2 mb-6">لا يمكن الاتصال بالخادم. تأكد من اتصالك بالإنترنت.</Text>
        <TouchableOpacity onPress={() => refetch()} className="bg-blue-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <FlatList
        data={data?.activities || []}
        keyExtractor={(item) => item.id}
        renderItem={renderActivity}
        ListHeaderComponent={<Header />}
        contentContainerStyle={{ padding: 24, paddingTop: Platform.OS === 'android' ? 40 : 20 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" colors={['#2563EB']} />
        }
      />

      {/* Device Selection Modal */}
      {isDeviceModalVisible && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center z-50">
          <View className="bg-white w-[85%] rounded-3xl p-6 shadow-xl max-h-[70%]">
            <View className="flex-row-reverse justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-800">الأجهزة المتاحة</Text>
              <TouchableOpacity onPress={() => setDeviceModalVisible(false)} className="bg-slate-100 p-2 rounded-full">
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {isScanning && (
              <View className="flex-row-reverse items-center justify-center mb-6">
                <ActivityIndicator color="#2563EB" size="small" className="ml-3" />
                <Text className="text-blue-600 font-medium">جاري البحث عن أجهزة بلوتوث...</Text>
              </View>
            )}

            <FlatList
              data={scannedDevices}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                !isScanning ? (
                  <Text className="text-center text-slate-500 py-4 font-medium">لم يتم العثور على أجهزة قريبة</Text>
                ) : null
              }
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => connectAndClose(item)}
                  className="bg-slate-50 p-4 rounded-2xl mb-3 flex-row-reverse items-center border border-slate-100 active:bg-slate-100"
                >
                  <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center ml-4">
                    <Ionicons name="bluetooth" size={20} color="#2563EB" />
                  </View>
                  <View className="flex-1 items-end">
                    <Text className="text-slate-800 font-bold text-base">{item.name || 'جهاز غير معروف'}</Text>
                    <Text className="text-slate-500 text-xs mt-1">{item.id}</Text>
                  </View>
                  <Ionicons name="chevron-back" size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
            />

            {!isScanning && (
              <TouchableOpacity 
                onPress={scanForDevices}
                className="mt-4 bg-blue-50 py-3 rounded-xl border border-blue-100 flex-row-reverse justify-center items-center"
              >
                <Ionicons name="refresh" size={20} color="#2563EB" className="ml-2" />
                <Text className="text-blue-600 font-bold text-center">إعادة البحث</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Critical Alert Full Screen Modal */}
      <Modal visible={!!criticalAlert} animationType="slide" transparent>
        <View className="flex-1 bg-red-600 justify-center items-center px-6">
          <Ionicons name="warning" size={100} color="white" />
          <Text className="text-white font-extrabold text-4xl mt-6 mb-2 text-center">حالة حرجة!</Text>
          <Text className="text-red-100 font-bold text-2xl mb-8 text-center">{criticalAlert?.message}</Text>
          
          <View className="bg-white/20 p-6 rounded-3xl w-full items-center mb-10">
            <Text className="text-red-100 text-lg mb-2">القراءة الحالية</Text>
            <Text className="text-white font-extrabold text-6xl">{criticalAlert?.value}</Text>
            <Text className="text-red-200 mt-2">الحد الآمن: {criticalAlert?.threshold}</Text>
          </View>

          <TouchableOpacity onPress={dismissAlert} className="bg-white px-10 py-4 rounded-full w-full">
            <Text className="text-red-600 font-bold text-xl text-center">علم (إيقاف التنبيه)</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
