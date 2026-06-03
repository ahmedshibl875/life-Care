import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

export default function DashboardScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Load user data when dashboard opens
    const loadUser = async () => {
      const storedName = await SecureStore.getItemAsync('userName');
      if (storedName) setUserName(storedName);
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userName');
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.name}>{userName || 'Patient'} 👋</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Health Status</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="heart" size={24} color="#2563EB" />
              </View>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>Heart Rate</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="thermometer" size={24} color="#EF4444" />
              </View>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>Temperature</Text>
            </View>
          </View>
        </View>

        <View style={styles.comingSoonBox}>
          <Ionicons name="bluetooth-outline" size={40} color="#2563EB" />
          <Text style={styles.comingSoonText}>Bluetooth Connection to ESP32 device will be activated here in the next phase!</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  greeting: { fontSize: 16, color: '#64748B' },
  name: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  logoutButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  statsCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 20 },
  statsTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  iconBox: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 13, color: '#64748B', marginTop: 4 },
  comingSoonBox: { backgroundColor: '#E0E7FF', padding: 24, borderRadius: 20, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#818CF8', marginTop: 20 },
  comingSoonText: { marginTop: 12, fontSize: 16, color: '#4338CA', textAlign: 'center', fontWeight: '600', lineHeight: 24 },
});
