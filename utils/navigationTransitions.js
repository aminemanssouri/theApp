import { Platform, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Custom transition configurations for smooth animations
export const transitionConfig = {
  // Slide transitions
  slideFromRight: {
    animation: 'slide_from_right',
    animationDuration: 300,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    ...(Platform.OS === 'ios' && {
      presentation: 'card',
      animationTypeForReplace: 'push',
    }),
  },
  
  slideFromLeft: {
    animation: 'slide_from_left',
    animationDuration: 300,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    ...(Platform.OS === 'ios' && {
      presentation: 'card',
      animationTypeForReplace: 'push',
    }),
  },
  
  slideFromBottom: {
    animation: 'slide_from_bottom',
    animationDuration: 350,
    gestureEnabled: true,
    gestureDirection: 'vertical',
    ...(Platform.OS === 'ios' && {
      presentation: 'modal',
      animationTypeForReplace: 'push',
    }),
  },
  
  // Fade transitions
  fade: {
    animation: 'fade',
    animationDuration: 250,
    gestureEnabled: false,
    ...(Platform.OS === 'ios' && {
      presentation: 'transparentModal',
      animationTypeForReplace: 'push',
    }),
  },
  
  // Fast fade for quick transitions
  fastFade: {
    animation: 'fade',
    animationDuration: 200,
    gestureEnabled: false,
  },
  
  // Slow fade for important transitions
  slowFade: {
    animation: 'fade',
    animationDuration: 400,
    gestureEnabled: false,
  },
  
  // No animation for instant transitions
  none: {
    animation: 'none',
    animationDuration: 0,
    gestureEnabled: false,
  },
};

// Enhanced transition presets for different screen types
export const screenTransitions = {
  // Authentication flow
  auth: {
    ...transitionConfig.fade,
    animationDuration: 250,
  },
  
  // Main app entry
  main: {
    ...transitionConfig.slowFade,
    animationDuration: 400,
  },
  
  // Modal-like screens
  modal: {
    ...transitionConfig.slideFromBottom,
    animationDuration: 350,
  },
  
  // Settings and profile screens
  settings: {
    ...transitionConfig.slideFromRight,
    animationDuration: 280,
  },
  
  // Service and booking flow
  service: {
    ...transitionConfig.slideFromRight,
    animationDuration: 300,
  },
  
  // Chat and communication
  communication: {
    ...transitionConfig.slideFromBottom,
    animationDuration: 300,
  },
  
  // Search and discovery
  search: {
    ...transitionConfig.slideFromBottom,
    animationDuration: 280,
  },
  
  // Payment and sensitive flows
  payment: {
    ...transitionConfig.slideFromRight,
    animationDuration: 250,
  },
  
  // Onboarding screens
  onboarding: {
    ...transitionConfig.slideFromRight,
    animationDuration: 350,
  },
};

// Function to get transition config based on screen name
export const getTransitionConfig = (screenName) => {
  switch (screenName) {
    // Authentication
    case 'Login':
    case 'Signup':
    case 'Welcome':
      return screenTransitions.auth;
    
    // Main app
    case 'Main':
      return screenTransitions.main;
    
    // Modals
    case 'Search':
    case 'Call':
    case 'Chat':
    case 'CustomerService':
      return screenTransitions.modal;
    
    // Settings
    case 'EditProfile':
    case 'SettingsNotifications':
    case 'SettingsPayment':
    case 'SettingsSecurity':
    case 'SettingsLanguage':
    case 'SettingsPrivacyPolicy':
    case 'ChangePIN':
    case 'ChangePassword':
    case 'ChangeEmail':
      return screenTransitions.settings;
    
    // Services
    case 'ServiceDetails':
    case 'ServiceDetailsReviews':
    case 'PopularServices':
    case 'BookingStep1':
    case 'BookingDetails':
    case 'ReviewSummary':
      return screenTransitions.service;
    
    // Communication
    case 'Notifications':
    case 'HelpCenter':
    case 'InviteFriends':
      return screenTransitions.communication;
    
    // Payment
    case 'PaymentMethods':
    case 'AddNewPaymentMethod':
    case 'AddNewPaymentMethodSuccess':
    case 'AddNewPaymentMethodDeclined':
    case 'PaymentMethod':
    case 'AddNewCard':
    case 'CancelBooking':
    case 'CancelBookingPaymentMethods':
      return screenTransitions.payment;
    
    // Onboarding
    case 'Onboarding1':
    case 'Onboarding2':
    case 'Onboarding3':
    case 'Onboarding4':
    case 'FillYourProfile':
    case 'CreateNewPIN':
    case 'Fingerprint':
      return screenTransitions.onboarding;
    
    // Password recovery
    case 'ForgotPasswordMethods':
    case 'ForgotPasswordEmail':
    case 'ForgotPasswordPhoneNumber':
    case 'OTPVerification':
    case 'CreateNewPassword':
      return {
        ...screenTransitions.auth,
        animationDuration: 250,
      };
    
    // Others
   
    case 'MyBookings':
    case 'YourAddress':
    case 'EReceipt':
      return screenTransitions.service;
    
    // Default
    default:
      return transitionConfig.slideFromRight;
  }
};

// Utility function for programmatic navigation with smooth transitions
export const navigateWithTransition = (navigation, screenName, params = {}) => {
  const config = getTransitionConfig(screenName);
  
  // Add transition animation to navigation
  navigation.navigate(screenName, params);
  
  // Optional: Add haptic feedback for better UX (if you want to add react-native-haptic-feedback)
  // HapticFeedback.trigger('impactLight');
};

// Enhanced navigation utilities
export const navigationUtils = {
  // Smooth back navigation
  goBack: (navigation) => {
    navigation.goBack();
  },
  
  // Navigate with custom transition
  navigateWithCustomTransition: (navigation, screenName, params, customConfig) => {
    navigation.navigate(screenName, params);
  },
  
  // Reset navigation stack with smooth transition
  resetToScreen: (navigation, screenName, params = {}) => {
    navigation.reset({
      index: 0,
      routes: [{ name: screenName, params }],
    });
  },
  
  // Navigate and replace current screen
  replaceScreen: (navigation, screenName, params = {}) => {
    navigation.replace(screenName, params);
  },
};
