import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as Linking from 'expo-linking'


import { View } from 'react-native'
import { useFonts } from 'expo-font'
import { useCallback, useEffect } from 'react'
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

  // Handle deep links for password reset
  useEffect(() => {
    const handleDeepLink = async (url) => {
      if (url?.includes('reset-password')) {
        // The deep link handling will be managed by the navigation system
        // The AppNavigation component will handle the routing
        console.log('Password reset deep link received:', url)
      }
    }

    // Handle app opened from deep link while closed
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url)
      }
    })

    // Handle app opened from deep link while running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url)
    })

    return () => subscription?.remove()
  }, [])

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