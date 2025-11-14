import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as Linking from 'expo-linking'
import AsyncStorage from '@react-native-async-storage/async-storage';
 import { StripeProvider } from '@stripe/stripe-react-native'
import { STRIPE_PUBLISHABLE_KEY } from './config/stripe.config'

import { View } from 'react-native'
import { useFonts } from 'expo-font'
import { useCallback, useEffect, useRef } from 'react'
import { FONTS } from './constants/fonts'
import AppNavigation from './navigations/AppNavigation'
import { LogBox } from 'react-native'
import { ThemeProvider } from './theme/ThemeProvider'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { StatusBar } from 'react-native';
import { LanguageProvider } from './context/LanguageContext'
import { ChatProvider } from './context/ChatContext'

//Ignore all log notifications
LogBox.ignoreAllLogs();

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
  const navigationRef = useRef(null);
  const subscriptionRef = useRef(null);

  const handleDeepLink = useCallback(async (url) => {
    console.log('🔗 Deep link received:', url);
    
    if (!url) {
      console.log('⚠️ No URL provided');
      return;
    }
    
    if (url.includes('reset-password') || url.includes('type=recovery')) {
      console.log('✅ Password reset deep link detected');
      
      // Extract the hash parameters from the URL
      if (url.includes('#')) {
        const hashParams = url.split('#')[1];
        const params = new URLSearchParams(hashParams);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        
        console.log('🔑 Extracted params:', {
          type,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken
        });
        
        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('🔄 Storing recovery tokens...');
          
          try {
            // Store tokens in AsyncStorage WITHOUT setting session
            await AsyncStorage.setItem('recovery_access_token', accessToken);
            await AsyncStorage.setItem('recovery_refresh_token', refreshToken);
            await AsyncStorage.setItem('is_password_recovery', 'true');
            
            console.log('✅ Tokens stored successfully');
            
            // Force a small delay to ensure storage is complete
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Navigate directly to OTPVerification
            const navigateToPasswordReset = () => {
              console.log('🔍 Checking navigation ref...', {
                hasRef: !!navigationRef.current,
                isReady: navigationRef.current?.isReady?.()
              });
              
              if (navigationRef.current && navigationRef.current.isReady()) {
                console.log('🔑 Navigation ready, navigating to OTPVerification...');
                
                const state = navigationRef.current.getRootState();
                console.log('📍 Current navigation state routes:', state?.routes?.map(r => r.name));
                
                // Try to navigate to OTPVerification
                try {
                  navigationRef.current.navigate('OTPVerification');
                  console.log('✅ Navigation command sent to OTPVerification');
                } catch (navError) {
                  console.error('❌ Navigation error:', navError);
                  // If regular navigation fails, try reset
                  navigationRef.current.reset({
                    index: 0,
                    routes: [{ name: 'OTPVerification' }],
                  });
                  console.log('✅ Navigation reset to OTPVerification');
                }
              } else {
                console.log('⏳ Navigation not ready, retrying in 100ms...');
                setTimeout(navigateToPasswordReset, 100);
              }
            };
            
            // Start navigation attempt after a small delay
            setTimeout(navigateToPasswordReset, 300);
            
          } catch (error) {
            console.error('❌ Error handling recovery tokens:', error);
          }
        } else {
          console.log('⚠️ Missing recovery params');
        }
      } else {
        console.log('⚠️ No hash parameters in URL');
      }
    } else {
      console.log('ℹ️ Not a password reset link');
    }
  }, []);

  useEffect(() => {
    // Handle initial URL
    Linking.getInitialURL().then(url => {
      console.log('📱 Initial URL:', url);
      if (url) {
        handleDeepLink(url);
      }
    }).catch(error => {
      console.error('Error getting initial URL:', error);
    });

    // Listen for URL changes
    try {
      subscriptionRef.current = Linking.addEventListener('url', (event) => {
        console.log('🔔 Link event received:', event.url);
        handleDeepLink(event.url);
      });
    } catch (error) {
      console.error('Error setting up deep link listener:', error);
    }

    return () => {
      try {
        if (subscriptionRef.current && typeof subscriptionRef.current.remove === 'function') {
          subscriptionRef.current.remove();
          subscriptionRef.current = null;
        }
      } catch (error) {
        console.error('Error removing deep link listener:', error);
      }
    };
  }, [handleDeepLink]);

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
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <LanguageProvider defaultLanguage="it">
          <AuthProvider>
            <FavoritesProvider>
              <ThemeProvider>
                <ChatProvider>
                  <NotificationProvider>
                    <StatusBar 
                      backgroundColor="transparent" 
                      translucent={true}
                    />
                    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
                      <AppNavigation navigationRef={navigationRef} />
                    </View>
                  </NotificationProvider>
                </ChatProvider>
              </ThemeProvider>
            </FavoritesProvider>
          </AuthProvider>
        </LanguageProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}