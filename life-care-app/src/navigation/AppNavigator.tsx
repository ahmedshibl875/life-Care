import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../app/(app)/dashboard';
import MedicalRecordScreen from '../app/(app)/medical-record';
import ReportsScreen from '../app/(app)/reports';
import TimelineScreen from '../app/(app)/timeline';
import MedicationsScreen from '../app/(app)/medications';
import CaregiversScreen from '../app/(app)/caregivers';
import ProfileScreen from '../app/(app)/profile';
import DoctorsScreen from '../app/(app)/doctors';
import PatientsScreen from '../app/(app)/patients';
import AiAssistantScreen from '../app/(app)/ai-assistant';
import AddCompanionPatientScreen from '../app/(app)/add-companion-patient';
import AddDoctorScreen from '../app/(app)/add-doctor';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerPosition: 'left',
        headerTitleAlign: 'center',
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'الرئيسية' }} />
      <Drawer.Screen name="MedicalRecord" component={MedicalRecordScreen} options={{ title: 'السجل الطبي' }} />
      <Drawer.Screen name="Reports" component={ReportsScreen} options={{ title: 'التقارير والإحصائيات' }} />
      <Drawer.Screen name="Timeline" component={TimelineScreen} options={{ title: 'السجل الزمني' }} />
      <Drawer.Screen name="Medications" component={MedicationsScreen} options={{ title: 'الأدوية' }} />
      <Drawer.Screen name="Caregivers" component={CaregiversScreen} options={{ title: 'المرافقين' }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'حسابي' }} />
      <Drawer.Screen name="Doctors" component={DoctorsScreen} options={{ title: 'الأطباء' }} />
      <Drawer.Screen name="Patients" component={PatientsScreen} options={{ title: 'المرضى' }} />
      <Drawer.Screen name="AiAssistant" component={AiAssistantScreen} options={{ title: 'المساعد الذكي' }} />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Drawer" component={DrawerNavigator} />
        <Stack.Screen name="AddCompanionPatient" component={AddCompanionPatientScreen} />
        <Stack.Screen name="AddDoctor" component={AddDoctorScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
