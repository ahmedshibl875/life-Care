import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../src/store/authStore';
import { apiClient } from '../src/api/client';
import { registerForPushNotificationsAsync } from '../src/utils/notifications';
import '../global.css'; // NativeWind v4 requires this or standard tailwind setup
import { initI18n } from '../src/i18n';

// Initialize i18n
initI18n();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes (data remains fresh, reduces unnecessary API calls)
      gcTime: 1000 * 60 * 30, // 30 minutes (keeps cache in memory for fast switching)
      retry: 2, // Auto retry twice on network failure
      refetchOnWindowFocus: false, // Prevent aggressive refetching on mobile
    },
  },
});

function InitialLayout() {
  const { user, isLoading, restoreSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  
  // Notification Response Listener for Deep Linking
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Attempt to restore user session
    restoreSession();

    // 1. Setup Push Notifications & API Integration
    registerForPushNotificationsAsync().then(token => {
      if (token && user) {
        // Send token to backend so server can push to this device
        apiClient.post('/auth/push-token', { token }).catch(() => console.log('Mock: Token API not ready yet'));
      }
    });

    // 2. Handle Deep Linking when user taps a notification (Foreground/Background)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data && data.route) {
        router.push(data.route as any);
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user && !inAuthGroup) {
      // Redirect to login if not logged in
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to app if logged in
      router.replace('/(app)/dashboard');
    }
  }, [user, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <InitialLayout />
    </QueryClientProvider>
  );
}
