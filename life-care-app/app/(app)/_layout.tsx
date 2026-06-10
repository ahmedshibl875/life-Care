import { Drawer } from 'expo-router/drawer';
import { Home, Users, UserPlus, Bot, Settings, ClipboardList, FileText, Pill, HeartHandshake, Globe } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useBLEStore } from '../../src/store/bleStore';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { switchLanguage } from '../../src/i18n';

export default function AppLayout() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { user } = useAuthStore();
  const isDoctor = user?.role === 'doctor';
  const isPatient = user?.role === 'patient';

  const { isConnected, batteryLevel } = useBLEStore();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ar' : 'en';
    switchLanguage(nextLang);
  };

  return (
    <Drawer screenOptions={{ 
      headerShown: true,
      headerTitleAlign: 'center',
      drawerPosition: i18n.language === 'ar' ? 'right' : 'left', // Dynamic based on language
      drawerActiveTintColor: '#2563EB',
      drawerLabelStyle: { fontFamily: 'System', fontWeight: 'bold', textAlign: i18n.language === 'ar' ? 'right' : 'left' },
      headerStyle: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
      headerTintColor: isDark ? '#FFFFFF' : '#0F172A',
      sceneContainerStyle: { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
      headerLeft: () => (
        isPatient ? (
          <View className="flex-row items-center mx-4">
            <View className={`flex-row items-center px-2 py-1 rounded-full ${isConnected ? 'bg-green-100 dark:bg-green-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
              <Ionicons 
                name={isConnected ? "bluetooth" : "bluetooth-outline"} 
                size={16} 
                color={isConnected ? "#10B981" : "#94A3B8"} 
              />
              <Text className={`text-xs ml-1 font-bold ${isConnected ? 'text-green-700 dark:text-green-300' : 'text-slate-500 dark:text-slate-400'}`}>
                {isConnected ? t('dashboard.connected', 'متصل') : t('dashboard.disconnected', 'غير متصل')}
              </Text>
            </View>
            {isConnected && batteryLevel !== null && (
              <View className="flex-row items-center mx-2 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                <Ionicons 
                  name={batteryLevel > 20 ? "battery-full" : "battery-dead"} 
                  size={16} 
                  color={batteryLevel > 20 ? "#3B82F6" : "#EF4444"} 
                />
                <Text className="text-xs text-slate-700 dark:text-slate-300 ml-1 font-bold">{batteryLevel}%</Text>
              </View>
            )}
          </View>
        ) : null
      ),
      headerRight: () => (
        <TouchableOpacity onPress={toggleLanguage} className="mx-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800">
          <Globe size={20} color={isDark ? '#F1F5F9' : '#475569'} />
        </TouchableOpacity>
      ),
    }}>
      <Drawer.Screen 
        name="dashboard" 
        options={{
          title: 'الرئيسية',
          drawerIcon: ({ color }) => <Home color={color} />,
        }} 
      />
      <Drawer.Screen 
        name="medical-record" 
        options={{
          title: 'السجل الطبي',
          drawerItemStyle: isPatient ? {} : { display: 'none' },
          drawerIcon: ({ color }) => <ClipboardList color={color} />,
        }} 
      />
      <Drawer.Screen 
        name="reports" 
        options={{
          title: 'التقارير والإحصائيات',
          drawerItemStyle: isPatient ? {} : { display: 'none' },
          drawerIcon: ({ color }) => <FileText color={color} />,
        }} 
      />
      <Drawer.Screen 
        name="timeline" 
        options={{
          title: 'السجل الزمني',
          drawerItemStyle: isPatient ? {} : { display: 'none' },
          drawerIcon: ({ color }) => <FileText color={color} />, // Or any timeline icon
        }} 
      />
      <Drawer.Screen 
        name="medications" 
        options={{
          title: 'الأدوية',
          drawerItemStyle: isPatient ? {} : { display: 'none' },
          drawerIcon: ({ color }) => <Pill color={color} />,
        }} 
      />
      <Drawer.Screen 
        name="caregivers" 
        options={{
          title: 'المرافقين',
          drawerItemStyle: isPatient ? {} : { display: 'none' },
          drawerIcon: ({ color }) => <HeartHandshake color={color} />,
        }} 
      />
      <Drawer.Screen 
        name="profile" 
        options={{
          title: 'حسابي',
          drawerIcon: ({ color }) => <Settings color={color} />,
        }} 
      />
      <Drawer.Screen 
        name="doctors" 
        options={{
          title: 'الأطباء',
          drawerItemStyle: isDoctor ? { display: 'none' } : {},
          drawerIcon: ({ color }) => <Users color={color} />,
        }} 
      />
      <Drawer.Screen 
        name="patients" 
        options={{
          title: 'المرضى',
          drawerItemStyle: isPatient ? { display: 'none' } : {},
          drawerIcon: ({ color }) => <UserPlus color={color} />,
        }} 
      />
      <Drawer.Screen 
        name="ai-assistant" 
        options={{
          title: 'المساعد الذكي',
          drawerIcon: ({ color }) => <Bot color={color} />,
        }} 
      />
    </Drawer>
  );
}
