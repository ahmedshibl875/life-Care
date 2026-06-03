import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Alert, ActivityIndicator } from 'react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      Alert.alert('Missing Fields', 'Please fill in all fields to create your account.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://life-care-production.up.railway.app/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email.toLowerCase(),
          phone: formData.phone,
          password: formData.password,
          role: 'patient', // Default role for app users
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful, optionally log them in directly
        // Here we just save the token if it returns one, and go to dashboard
        if (data.token) {
          await SecureStore.setItemAsync('userToken', data.token);
          await SecureStore.setItemAsync('userName', formData.name);
          router.replace('/dashboard');
        } else {
          Alert.alert('Success', 'Account created successfully! Please login.', [
            { text: 'OK', onPress: () => router.replace('/login') }
          ]);
        }
      } else {
        Alert.alert('Registration Failed', data.message || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Could not connect to the server. Please check your internet connection.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Create Account ✨</Text>
            <Text style={styles.subtitle}>Join Life Care to track your health and connect with top doctors easily.</Text>

            <View style={styles.formContainer}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor="#94A3B8"
                    value={formData.name}
                    onChangeText={(text) => setFormData({...formData, name: text})}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text) => setFormData({...formData, email: text})}
                  />
                </View>
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="+1 234 567 890"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({...formData, phone: text})}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a strong password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={formData.password}
                    onChangeText={(text) => setFormData({...formData, password: text})}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                activeOpacity={0.8}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.registerButtonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 30 },
  title: { fontSize: 32, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#64748B', lineHeight: 24, marginBottom: 30 },
  formContainer: { gap: 18 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, height: 56, paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: '100%', fontSize: 16, color: '#0F172A' },
  eyeIcon: { padding: 8 },
  registerButton: {
    backgroundColor: '#2563EB', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    marginTop: 20, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  registerButtonDisabled: {
    backgroundColor: '#93C5FD',
    elevation: 0,
    shadowOpacity: 0,
  },
  registerButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  footerText: { color: '#64748B', fontSize: 15 },
  footerLink: { color: '#2563EB', fontSize: 15, fontWeight: '700' },
});
