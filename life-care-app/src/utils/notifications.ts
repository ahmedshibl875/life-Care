import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 1. Foreground Notification Behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 2. Register for Push Notifications
export async function registerForPushNotificationsAsync() {
  let token;

  // Android Optimization: Notification Channels are mandatory for Android 8+
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB', // Life Care blue
    });

    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Medical Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#EF4444', // Red for critical
      sound: 'default',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return undefined;
    }

    try {
      // Get the Expo Push Token (requires Expo project ID in app.json if using EAS)
      // Here we pass empty projectId which works locally in Expo Go
      const pushTokenString = (await Notifications.getExpoPushTokenAsync({
        projectId: "your-project-id", // Replace with real ID when building via EAS
      })).data;
      token = pushTokenString;
    } catch (e) {
      console.log('Error getting push token', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// 3. Local Reminder Scheduling (e.g., Medication)
export async function scheduleMedicalReminder(title: string, body: string, triggerInSeconds: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: { route: '/(app)/dashboard' }, // Deep linking data
    },
    // @ts-ignore - Supress enum version discrepancy to ensure stability
    trigger: { seconds: triggerInSeconds, type: 'timeInterval' },
  });
}
