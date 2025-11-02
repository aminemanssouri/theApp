import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useRef } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { AddNewCard, AddNewPaymentMethod, AddNewPaymentMethodDeclined, AddNewPaymentMethodSuccess, AllServices, BookingDetails, BookingStep1, Call, CancelBooking, CancelBookingPaymentMethods, ChangeEmail, ChangePIN, ChangePassword, Chat, CreateNewPIN, CreateNewPassword, CustomerService, EReceipt, EditProfile, FillYourProfile, Fingerprint, ForgotPasswordEmail, ForgotPasswordMethods, ForgotPasswordPhoneNumber, HelpCenter, InviteFriends, Login, MyBookings, Notifications, OTPVerification, Onboarding1, Onboarding2, Onboarding3, Onboarding4, PaymentMethod, PaymentMethods, PopularServices, ReviewSummary, Search, ServiceDetails, ServiceDetailsReviews, SettingsLanguage, SettingsNotifications, SettingsPayment, SettingsPrivacyPolicy, SettingsSecurity, Signup, Welcome, WorkerDetails, YourAddress, CryptoPayment, CreditCardPayment } from '../screens';
import BottomTabNavigation from './BottomTabNavigation';
import { getTransitionConfig } from '../utils/navigationTransitions';

const Stack = createNativeStackNavigator();

// Enhanced navigation options for smooth transitions
const defaultScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  animationDuration: 300,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  ...(Platform.OS === 'ios' && {
    presentation: 'card',
    animationTypeForReplace: 'push',
  }),
};

// Navigation wrapper component to handle profileComplete changes
const NavigationWrapper = ({ navigationRef: externalRef }) => {
  const { user, loading: authLoading, profileComplete, isPasswordRecovery } = useAuth();
  const internalRef = useRef();
  // Use external ref if provided, otherwise use internal ref
  const navigationRef = externalRef || internalRef;

  // Navigate to OTPVerification when password recovery is detected
  useEffect(() => {
    if (isPasswordRecovery && navigationRef.current && navigationRef.current.isReady()) {
      console.log('🔑 Password recovery detected, navigating to OTPVerification');
      setTimeout(() => {
        navigationRef.current.navigate('OTPVerification');
      }, 100);
    }
  }, [isPasswordRecovery]);

  // Handle navigation when profileComplete changes
  useEffect(() => {
    // DISABLED: Always skip FillYourProfile screen
    console.log('🔄 ProfileComplete listener disabled - FillYourProfile screen bypassed');
    return;
    
    // CRITICAL: Don't do any navigation if we're in password recovery mode
    if (isPasswordRecovery) {
      console.log('🔐 Skipping profile navigation - in password recovery mode');
      return;
    }
    
    if (!user || authLoading) return;
    
    // Only navigate if we have a navigation ref
    if (navigationRef.current) {
      const currentRoute = navigationRef.current.getCurrentRoute()?.name;
      
      console.log('🔄 ProfileComplete changed:', {
        profileComplete,
        currentRoute,
        hasUser: !!user
      });
      
      // If profile becomes complete and we're on FillYourProfile, navigate to Main
      if (profileComplete && currentRoute === 'FillYourProfile') {
        console.log('✅ Navigating to Main because profile is now complete');
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
      // If profile becomes incomplete and we're on Main, navigate to FillYourProfile
      else if (!profileComplete && currentRoute === 'Main') {
        console.log('⚠️ Navigating to FillYourProfile because profile is incomplete');
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'FillYourProfile' }],
        });
      }
    }
  }, [profileComplete, user, authLoading, isPasswordRecovery]);
  
  return <AppNavigationContent navigationRef={navigationRef} />;
};

const AppNavigationContent = ({ navigationRef }) => {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading, profileComplete, isPasswordRecovery } = useAuth();

  useEffect(() => {
    const checkIfFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem('alreadyLaunched');
        if (value === null) {
          await AsyncStorage.setItem('alreadyLaunched', 'true');
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        setIsFirstLaunch(false);
      }
      setIsLoading(false);
    };

    checkIfFirstLaunch();
  }, []);

  // Only wait for first launch check, not auth loading
  // This way, during login, user stays on login screen
  if (isLoading) {
    return null; // Initial app load only
  }

  // If auth is still loading AND we have no user, keep showing auth screens
  // This prevents white screen during login
  // ALSO treat password recovery as "not logged in" so we show auth stack
  const shouldWaitForAuth = authLoading && !user;
  const shouldShowAuthStack = !user || shouldWaitForAuth || isPasswordRecovery;

  console.log('🧭 Navigation Decision:', {
    hasUser: !!user,
    authLoading,
    profileComplete,
    shouldWaitForAuth,
    isPasswordRecovery,
    willShowAuth: shouldShowAuthStack,
    willShowFillProfile: false, // ALWAYS FALSE - screen disabled
    willShowMain: user && !authLoading && !isPasswordRecovery
  });

  // Deep link configuration
  const linking = {
    prefixes: [
      'bricollano://',           // Production deep links
      'exp+bricollano://',       // Expo development client
    ],
    config: {
      screens: {
        // Auth flow deep links
        'OTPVerification': 'auth/reset-password',
        'CreateNewPassword': 'auth/new-password',
        // Add other deep links as needed
        'Main': 'main',
        'Login': 'login',
      },
    },
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      theme={{
        colors: {
          background: 'transparent',
          primary: COLORS.primary,
          card: 'transparent',
          text: COLORS.black,
          border: 'transparent',
          notification: COLORS.primary,
        },
      }}
    >
      <Stack.Navigator 
        screenOptions={defaultScreenOptions}
        initialRouteName={
          shouldShowAuthStack
            ? (isFirstLaunch ? "Onboarding1" : "Welcome")
            : "Main" // Always go to Main, skip FillYourProfile
        }
      >
        {shouldShowAuthStack ? (
          // NOT LOGGED IN or WAITING FOR AUTH or PASSWORD RECOVERY - Show authentication screens
          <>
            {isFirstLaunch && (
              <>
                <Stack.Screen name="Onboarding1" component={Onboarding1} options={getTransitionConfig('Onboarding1')} />
                <Stack.Screen name="Onboarding2" component={Onboarding2} options={getTransitionConfig('Onboarding2')} />
                <Stack.Screen name="Onboarding3" component={Onboarding3} options={getTransitionConfig('Onboarding3')} />
                <Stack.Screen name="Onboarding4" component={Onboarding4} options={getTransitionConfig('Onboarding4')} />
              </>
            )}
            <Stack.Screen name="Welcome" component={Welcome} options={getTransitionConfig('Welcome')} />
            <Stack.Screen name="Login" component={Login} options={getTransitionConfig('Login')} />
            <Stack.Screen name="Signup" component={Signup} options={getTransitionConfig('Signup')} />
            <Stack.Screen name="ForgotPasswordMethods" component={ForgotPasswordMethods} options={getTransitionConfig('ForgotPasswordMethods')} />
            <Stack.Screen name="ForgotPasswordEmail" component={ForgotPasswordEmail} options={getTransitionConfig('ForgotPasswordEmail')} />
            <Stack.Screen name="ForgotPasswordPhoneNumber" component={ForgotPasswordPhoneNumber} options={getTransitionConfig('ForgotPasswordPhoneNumber')} />
            <Stack.Screen name="OTPVerification" component={OTPVerification} options={getTransitionConfig('OTPVerification')} />
            <Stack.Screen name="CreateNewPassword" component={CreateNewPassword} options={getTransitionConfig('CreateNewPassword')} />
          </>
        ) : (
          // LOGGED IN - Show Main app and all screens
          <>
            {/* FillYourProfile REMOVED - Screen bypassed for all users */}
            <Stack.Screen 
              name="Main" 
              component={BottomTabNavigation}
              options={{
                headerShown: false,
                contentStyle: { paddingTop: 0, marginTop: 0 },
                ...getTransitionConfig('Main')
              }}
            />
            {/* All other authenticated screens */}
            <Stack.Screen name="OTPVerification" component={OTPVerification} options={getTransitionConfig('OTPVerification')} />
            <Stack.Screen name="EditProfile" component={EditProfile} options={getTransitionConfig('EditProfile')} />
            <Stack.Screen name="SettingsNotifications" component={SettingsNotifications} options={getTransitionConfig('SettingsNotifications')} />
            <Stack.Screen name='SettingsPayment' component={SettingsPayment} options={getTransitionConfig('SettingsPayment')} />
            <Stack.Screen name="AddNewCard" component={AddNewCard} options={getTransitionConfig('AddNewCard')} />
            <Stack.Screen name="SettingsSecurity" component={SettingsSecurity} options={getTransitionConfig('SettingsSecurity')} />
            <Stack.Screen name="ChangePIN" component={ChangePIN} options={getTransitionConfig('ChangePIN')} />
            <Stack.Screen name="ChangePassword" component={ChangePassword} options={getTransitionConfig('ChangePassword')} />
            <Stack.Screen name="ChangeEmail" component={ChangeEmail} options={getTransitionConfig('ChangeEmail')} />
            <Stack.Screen name="SettingsLanguage" component={SettingsLanguage} options={getTransitionConfig('SettingsLanguage')} />
            <Stack.Screen name="SettingsPrivacyPolicy" component={SettingsPrivacyPolicy} options={getTransitionConfig('SettingsPrivacyPolicy')} />
            <Stack.Screen name="InviteFriends" component={InviteFriends} options={getTransitionConfig('InviteFriends')} />
            <Stack.Screen name="HelpCenter" component={HelpCenter} options={getTransitionConfig('HelpCenter')} />
            <Stack.Screen name="CustomerService" component={CustomerService} options={getTransitionConfig('CustomerService')} />
            <Stack.Screen name="EReceipt" component={EReceipt} options={getTransitionConfig('EReceipt')} />
            <Stack.Screen name="Call" component={Call} options={getTransitionConfig('Call')} />
            <Stack.Screen name="Chat" component={Chat} options={getTransitionConfig('Chat')} />
            <Stack.Screen name="Notifications" component={Notifications} options={getTransitionConfig('Notifications')} />
            <Stack.Screen name="Search" component={Search} options={getTransitionConfig('Search')} />
            <Stack.Screen name="PopularServices" component={PopularServices} options={getTransitionConfig('PopularServices')} />
            <Stack.Screen name="ServiceDetails" component={ServiceDetails} options={getTransitionConfig('ServiceDetails')} />
            <Stack.Screen name="WorkerDetails" component={WorkerDetails} options={getTransitionConfig('WorkerDetails')} />
            <Stack.Screen name="CreditCardPayment" component={CreditCardPayment} options={getTransitionConfig('CreditCardPayment')} />
            <Stack.Screen name="CryptoPayment" component={CryptoPayment} options={getTransitionConfig('CryptoPayment')} />
            <Stack.Screen name="AllServices" component={AllServices} options={getTransitionConfig('AllServices')} />
            <Stack.Screen name="ServiceDetailsReviews" component={ServiceDetailsReviews} options={getTransitionConfig('ServiceDetailsReviews')} />
            <Stack.Screen name="BookingStep1" component={BookingStep1} options={getTransitionConfig('BookingStep1')} />
            <Stack.Screen name="BookingDetails" component={BookingDetails} options={getTransitionConfig('BookingDetails')} />
            <Stack.Screen name="YourAddress" component={YourAddress} options={getTransitionConfig('YourAddress')} />
            <Stack.Screen name="PaymentMethods" component={PaymentMethods} options={getTransitionConfig('PaymentMethods')} />
            <Stack.Screen name="AddNewPaymentMethod" component={AddNewPaymentMethod} options={getTransitionConfig('AddNewPaymentMethod')} />
            <Stack.Screen name="AddNewPaymentMethodDeclined" component={AddNewPaymentMethodDeclined} options={getTransitionConfig('AddNewPaymentMethodDeclined')} />
            <Stack.Screen name="AddNewPaymentMethodSuccess" component={AddNewPaymentMethodSuccess} options={getTransitionConfig('AddNewPaymentMethodSuccess')} />
            <Stack.Screen name="PaymentMethod" component={PaymentMethod} options={getTransitionConfig('PaymentMethod')} />
            <Stack.Screen name="CancelBooking" component={CancelBooking} options={getTransitionConfig('CancelBooking')} />
            <Stack.Screen name="CancelBookingPaymentMethods" component={CancelBookingPaymentMethods} options={getTransitionConfig('CancelBookingPaymentMethods')} />
            <Stack.Screen name="MyBookings" component={MyBookings} options={getTransitionConfig('MyBookings')} />
            <Stack.Screen name="ReviewSummary" component={ReviewSummary} options={getTransitionConfig('ReviewSummary')} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default NavigationWrapper;