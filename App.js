import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts } from 'expo-font'
import { useCallback } from 'react'
import { FONTS } from './constants/fonts'
import AppNavigation from './navigations/AppNavigation'
import { LogBox } from 'react-native'
import { ThemeProvider } from './theme/ThemeProvider'
import { AuthProvider } from './context/AuthContext'

if (typeof global.structuredClone !== 'function') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

//Ignore all log notifications
LogBox.ignoreAllLogs();

SplashScreen.preventAutoHideAsync()

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
    <ThemeProvider>
      <AuthProvider>
        <SafeAreaProvider onLayout={onLayoutRootView}>
          <AppNavigation />
        </SafeAreaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}