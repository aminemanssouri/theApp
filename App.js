import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'

import { View } from 'react-native'
import { useFonts } from 'expo-font'
import { useCallback } from 'react'
import { FONTS } from './constants/fonts'
import AppNavigation from './navigations/AppNavigation'
import { LogBox } from 'react-native'
import { ThemeProvider } from './theme/ThemeProvider'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { StatusBar } from 'react-native';

//Ignore all log notifications
LogBox.ignoreAllLogs();

SplashScreen.preventAutoHideAsync()

// Show alerts while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [fontsLoaded] = useFonts(FONTS)

  const onLayoutRootView = useCallback(async () => {
      if (fontsLoaded) {
          await SplashScreen.hideAsync()
      }
  }, [fontsLoaded])

  if (!fontsLoaded) {
      return null
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <StatusBar 
    backgroundColor="transparent" 
    translucent={true}
    barStyle="light-content" 
  />
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <AppNavigation />
          </View>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}