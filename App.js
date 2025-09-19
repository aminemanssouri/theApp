import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

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
import { LanguageProvider } from './context/LanguageContext'
import { ChatProvider } from './context/ChatContext'

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <AuthProvider>
          <ThemeProvider>
            <ChatProvider>
              <NotificationProvider>
                <StatusBar 
                  backgroundColor="transparent" 
                  translucent={true}
                />
                <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
                  <AppNavigation />
                </View>
              </NotificationProvider>
            </ChatProvider>
          </ThemeProvider>
        </AuthProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}