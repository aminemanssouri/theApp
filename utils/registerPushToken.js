// Safe, optional push token registration.
// Works even if expo-notifications isn't installed yet.
import { Platform } from 'react-native';
import { upsertUserPushToken } from '../lib/services/pushTokens';

export async function registerPushTokenForUser(userId) {
  if (!userId) return null;

  // Dynamically import to avoid bundling errors if module missing
  let Notifications, Device, Constants;
  try {
    Notifications = await import('expo-notifications');
    Device = await import('expo-device');
    Constants = await import('expo-constants');
  } catch (e) {
    console.log('[push] expo-notifications not installed yet; skipping token registration');
    return null;
  }

  try {
    // Request permissions
    const settings = await Notifications.getPermissionsAsync();
    let finalStatus = settings.status;
    if (finalStatus !== 'granted') {
      const ask = await Notifications.requestPermissionsAsync();
      finalStatus = ask.status;
    }
    if (finalStatus !== 'granted') {
      console.log('[push] Notification permissions not granted');
      return null;
    }

    // On Android, set a default channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Fetch the Expo push token. In EAS builds, a projectId is recommended.
    let expoPushToken = null;
    try {
      let projectId = undefined;
      try {
        const cfg = Constants?.default?.expoConfig || Constants?.expoConfig || {};
        projectId = cfg?.extra?.eas?.projectId || cfg?.extra?.projectId;
      } catch (_) {}

      const tokenResult = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();
      expoPushToken = tokenResult.data;
      console.log('[push] Obtained Expo push token', expoPushToken ? `...${expoPushToken.slice(-6)}` : '(empty)');
    } catch (err) {
      console.warn('[push] getExpoPushTokenAsync failed (ensure projectId in app.json / EAS linked):', err?.message);
      return null;
    }

    if (!expoPushToken) return null;

    const deviceInfo = {
      platform: Platform.OS,
      model: Device?.deviceName || null,
    };

    const res = await upsertUserPushToken(userId, expoPushToken, deviceInfo);
    console.log('[push] Registered Expo push token for user', res ? '(saved)' : '(no save)');
    return expoPushToken;
  } catch (err) {
    console.error('[push] Error registering push token:', err);
    return null;
  }
}
