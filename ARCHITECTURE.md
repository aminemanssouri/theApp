# React Native App Architecture Guide

## 📱 Overview

This is a **comprehensive guide** for architecting production-ready React Native mobile applications. It covers design systems, navigation patterns, transition animations, and best practices used in real-world projects.

**Use this guide to:**
- Build scalable mobile app architecture
- Implement smooth navigation with custom transitions
- Create consistent design systems
- Follow industry-standard patterns

**Based on:** Real production app architecture using React Native + Expo + React Navigation v6

---

## 🎨 Design System

### Theme Architecture

Implement a dynamic theme system that supports both **Light** and **Dark** modes using React Context.

**Recommended Location**: `theme/ThemeProvider.js` or `contexts/ThemeContext.js`

```javascript
// Theme Provider wraps the entire app
<ThemeProvider>
  <App />
</ThemeProvider>

// Access theme in any component
import { useTheme } from '../theme/ThemeProvider';

const MyComponent = () => {
  const { colors, dark } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
};
```

### Color System

**Recommended Location**: `constants/theme.js` or `styles/colors.js`

Define your app's color palette in a centralized file. Use semantic naming for consistency.

```javascript
export const COLORS = {
  // Brand colors
  primary: "#007AFF",      // Main brand color (customize to your brand)
  secondary: "#5856D6",    // Secondary brand color
  accent: "#FF3B30",       // Accent/error color
  
  // Neutrals
  white: "#FFFFFF",
  black: "#000000",
  
  // Grayscale (for text and backgrounds)
  greyscale900: "#212121", // Primary text
  greyscale800: "#424242",
  greyscale700: "#616161",
  greyscale600: "#757575",
  greyscale500: "#9E9E9E", // Secondary text
  greyscale400: "#BDBDBD",
  greyscale300: "#E0E0E0",
  greyscale200: "#EEEEEE",
  greyscale100: "#F5F5F5", // Light backgrounds
  greyscale50: "#FAFAFA",
  
  // Semantic colors
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",
  
  // Dark mode alternatives
  dark: {
    background: "#121212",
    surface: "#1E1E1E",
    primary: "#BB86FC",
    // ... dark variants
  },
};
```

**Usage Example**:
```javascript
import { COLORS } from '../constants/theme';
// or: import { COLORS } from '../styles/colors';

const MyButton = () => (
  <TouchableOpacity 
    style={{ 
      backgroundColor: COLORS.primary,
      padding: 16,
      borderRadius: 8 
    }}
  >
    <Text style={{ color: COLORS.white }}>Submit</Text>
  </TouchableOpacity>
);
```

**Pro Tip**: Use theme context to switch between light/dark automatically:
```javascript
const { colors } = useTheme();
<View style={{ backgroundColor: colors.background }} />
```

### Typography System

**Recommended Location**: `constants/fonts.js` or `styles/typography.js`

Create a type scale following Material Design or iOS Human Interface Guidelines.

```javascript
export const FONTS = {
  // Display (Large titles)
  display1: { fontFamily: "Bold", fontSize: 48, lineHeight: 56 },
  display2: { fontFamily: "Bold", fontSize: 40, lineHeight: 48 },
  
  // Headings
  h1: { fontFamily: "Bold", fontSize: 32, lineHeight: 40 },
  h2: { fontFamily: "Bold", fontSize: 28, lineHeight: 36 },
  h3: { fontFamily: "Bold", fontSize: 24, lineHeight: 32 },
  h4: { fontFamily: "SemiBold", fontSize: 20, lineHeight: 28 },
  h5: { fontFamily: "SemiBold", fontSize: 18, lineHeight: 24 },
  h6: { fontFamily: "SemiBold", fontSize: 16, lineHeight: 22 },
  
  // Body text
  body1: { fontFamily: "Regular", fontSize: 16, lineHeight: 24 },
  body2: { fontFamily: "Regular", fontSize: 14, lineHeight: 20 },
  
  // UI elements
  button: { fontFamily: "SemiBold", fontSize: 16, lineHeight: 20 },
  caption: { fontFamily: "Regular", fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: "SemiBold", fontSize: 10, lineHeight: 14, letterSpacing: 1.5 },
};
```

**Font Family Setup** (using Expo):
```javascript
// App.js
import { useFonts } from 'expo-font';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Regular': require('./assets/fonts/YourFont-Regular.ttf'),
    'Bold': require('./assets/fonts/YourFont-Bold.ttf'),
    'SemiBold': require('./assets/fonts/YourFont-SemiBold.ttf'),
  });

  if (!fontsLoaded) return null;
  
  return <YourApp />;
}
```

**Real-World Usage**:
```javascript
import { FONTS, COLORS } from '../constants';

const LoginScreen = () => (
  <View>
    <Text style={{ ...FONTS.h1, color: COLORS.greyscale900 }}>
      Welcome Back
    </Text>
    <Text style={{ ...FONTS.body2, color: COLORS.greyscale700 }}>
      Sign in to continue
    </Text>
  </View>
);
```

**Advanced: Create Text Components**:
```javascript
// components/Typography.js
import { Text } from 'react-native';
import { FONTS, COLORS } from '../constants';

export const H1 = ({ children, style, ...props }) => (
  <Text style={[FONTS.h1, { color: COLORS.greyscale900 }, style]} {...props}>
    {children}
  </Text>
);

export const Body = ({ children, style, ...props }) => (
  <Text style={[FONTS.body1, { color: COLORS.greyscale800 }, style]} {...props}>
    {children}
  </Text>
);

// Usage:
<H1>Welcome Back</H1>
<Body>Sign in to continue</Body>
```

---

## 🧭 Navigation Architecture

### Stack-Based Navigation

Use **React Navigation v6** with a multi-layer stack system for scalable navigation.

**Recommended Location**: `navigation/AppNavigator.js` or `navigations/index.js`

### Typical Navigation Hierarchy

```
┌──────────────────────────────────────────┐
│  App.js (Root)                            │
│  ├── Context Providers                    │
│  │   ├── AuthProvider                     │
│  │   ├── ThemeProvider                    │
│  │   └── DataProvider (Redux/Context)     │
│  └── AppNavigator                         │
│      ├── Auth Stack (Unauthenticated)    │
│      │   ├── Onboarding                  │
│      │   ├── Welcome                     │
│      │   ├── Login                       │
│      │   └── Signup                      │
│      └── Main Stack (Authenticated)      │
│          ├── BottomTabNavigator         │
│          │   ├── Home Tab               │
│          │   ├── Explore Tab            │
│          │   ├── Create Tab             │
│          │   ├── Notifications Tab      │
│          │   └── Profile Tab            │
│          └── Modal/Detail Screens       │
│              ├── ItemDetails            │
│              ├── Settings               │
│              ├── EditProfile            │
│              └── Search                 │
└──────────────────────────────────────────┘
```

**Why This Structure?**
- **Separation of concerns**: Auth vs. Main app logic
- **Performance**: Only mount authenticated screens when needed
- **Security**: Prevent unauthorized access to protected screens
- **UX**: Smooth transitions between auth states

### Conditional Navigation Pattern

Implement smart navigation that responds to authentication state:

```javascript
// navigation/AppNavigator.js
import { useAuth } from '../contexts/AuthContext';

const AppNavigator = () => {
  const { user, isLoading, isFirstLaunch } = useAuth();
  
  // Determine which stack to show
  const shouldShowAuthStack = !user || isLoading;
  
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={
          shouldShowAuthStack
            ? (isFirstLaunch ? "Onboarding" : "Login")
            : "Main"
        }
        screenOptions={{ headerShown: false }}
      >
        {shouldShowAuthStack ? (
          // Unauthenticated Stack
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          // Authenticated Stack
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="ItemDetails" component={ItemDetailsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

**Decision Flow**:
1. ❓ Is user authenticated? → No → Show **Auth Stack**
2. ❓ Is this first launch? → Yes → Show **Onboarding**
3. ❓ User logged in? → Yes → Show **Main Stack**
4. ❓ Profile incomplete? → Yes → Show **Profile Setup** (optional)

**Advanced: Multi-State Navigation**:
```javascript
const getInitialScreen = (user, profile) => {
  if (!user) return 'Auth';
  if (!profile?.isComplete) return 'ProfileSetup';
  if (!profile?.hasSubscription) return 'Paywall';
  return 'Main';
};
```

---

## 🎬 Navigation Transitions System

### Overview

**Recommended Location**: `utils/navigationTransitions.js` or `config/transitions.js`

Implement a **centralized, intelligent transition system** that automatically applies the right animation based on screen type, platform, and user flow. This creates smooth, intuitive, platform-native navigation.

**Benefits**:
- ✅ Consistent animations across your app
- ✅ Easy to update all transitions in one place
- ✅ Platform-specific behavior (iOS vs Android)
- ✅ Semantic naming (e.g., "modal", "auth") instead of technical details
- ✅ Better UX with appropriate animations for each screen type

---

## 📦 The `navigationTransitions.js` File

### Core Architecture

The file contains **3 main layers**:

1. **`transitionConfig`** - Base transition types
2. **`screenTransitions`** - Semantic presets for screen categories
3. **`getTransitionConfig()`** - Intelligent mapping function

---

### Layer 1: Base Transition Configurations

```javascript
// utils/navigationTransitions.js

export const transitionConfig = {
  // 1. Slide from Right (iOS default)
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
  
  // 2. Slide from Left (Back navigation style)
  slideFromLeft: {
    animation: 'slide_from_left',
    animationDuration: 300,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
  },
  
  // 3. Slide from Bottom (Modal style)
  slideFromBottom: {
    animation: 'slide_from_bottom',
    animationDuration: 350,
    gestureEnabled: true,
    gestureDirection: 'vertical',
    ...(Platform.OS === 'ios' && {
      presentation: 'modal',
    }),
  },
  
  // 4. Fade (Smooth opacity change)
  fade: {
    animation: 'fade',
    animationDuration: 250,
    gestureEnabled: false,
    ...(Platform.OS === 'ios' && {
      presentation: 'transparentModal',
    }),
  },
  
  // 5. Fast Fade (Quick transitions)
  fastFade: {
    animation: 'fade',
    animationDuration: 200,
    gestureEnabled: false,
  },
  
  // 6. Slow Fade (Important screens)
  slowFade: {
    animation: 'fade',
    animationDuration: 400,
    gestureEnabled: false,
  },
  
  // 7. None (Instant)
  none: {
    animation: 'none',
    animationDuration: 0,
    gestureEnabled: false,
  },
};
```

**Key Properties:**
- `animation` - Type of animation (slide_from_right, fade, etc.)
- `animationDuration` - Time in milliseconds (200-400ms)
- `gestureEnabled` - Allow swipe-back gestures
- `gestureDirection` - Horizontal or vertical swipes
- `presentation` - iOS-specific modal presentation style

---

### Layer 2: Semantic Screen Transitions

Instead of manually mapping each screen, we group them by **purpose**:

```javascript
export const screenTransitions = {
  // Authentication flow (Login, Signup, Welcome)
  auth: {
    ...transitionConfig.fade,
    animationDuration: 250,
  },
  
  // Main app entry (After login)
  main: {
    ...transitionConfig.slowFade,
    animationDuration: 400,
  },
  
  // Modal-like screens (Search, Chat, Call)
  modal: {
    ...transitionConfig.slideFromBottom,
    animationDuration: 350,
  },
  
  // Settings and profile screens
  settings: {
    ...transitionConfig.slideFromRight,
    animationDuration: 280,
  },
  
  // Service booking flow
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
  
  // Payment and sensitive flows (No gestures)
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
```

**Why This Approach?**
- **Consistency**: All settings screens use the same transition
- **Flexibility**: Change all auth transitions by editing one line
- **Semantics**: `screenTransitions.payment` is clearer than `slideFromRight`

---

### Layer 3: Intelligent Screen Mapping

The **`getTransitionConfig()`** function automatically selects the right transition:

```javascript
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
    
    // Modals (slide from bottom)
    case 'Search':
    case 'Call':
    case 'Chat':
    case 'CustomerService':
      return screenTransitions.modal;
    
    // Settings (slide from right)
    case 'EditProfile':
    case 'SettingsNotifications':
    case 'SettingsPayment':
    case 'SettingsSecurity':
    case 'SettingsLanguage':
    case 'ChangePIN':
    case 'ChangePassword':
      return screenTransitions.settings;
    
    // Services (slide from right)
    case 'ServiceDetails':
    case 'ServiceDetailsReviews':
    case 'BookingStep1':
    case 'BookingDetails':
      return screenTransitions.service;
    
    // Payment (no gestures for security)
    case 'PaymentMethods':
    case 'AddNewPaymentMethod':
    case 'AddNewCard':
    case 'CancelBooking':
      return screenTransitions.payment;
    
    // Onboarding
    case 'Onboarding1':
    case 'Onboarding2':
    case 'Onboarding3':
    case 'FillYourProfile':
      return screenTransitions.onboarding;
    
    // Default fallback
    default:
      return transitionConfig.slideFromRight;
  }
};
```

---

## 🚀 How to Use in Your Navigation

### In AppNavigation.js

```javascript
import { getTransitionConfig } from '../utils/navigationTransitions';

// Apply to a single screen
<Stack.Screen 
  name="ServiceDetails" 
  component={ServiceDetails}
  options={getTransitionConfig('ServiceDetails')}
/>

// Apply to all screens dynamically
<Stack.Navigator
  screenOptions={({ route }) => ({
    ...getTransitionConfig(route.name),
    headerShown: false,
  })}
>
  <Stack.Screen name="Login" component={Login} />
  <Stack.Screen name="ServiceDetails" component={ServiceDetails} />
  <Stack.Screen name="EditProfile" component={EditProfile} />
</Stack.Navigator>
```

### Programmatic Navigation with Transitions

```javascript
import { navigateWithTransition } from '../utils/navigationTransitions';

// Instead of: navigation.navigate('ServiceDetails', { id: 123 })
// Use:
navigateWithTransition(navigation, 'ServiceDetails', { id: 123 });
```

### Navigation Utilities

The file also includes helper functions:

```javascript
import { navigationUtils } from '../utils/navigationTransitions';

// Smooth back navigation
navigationUtils.goBack(navigation);

// Reset navigation stack
navigationUtils.resetToScreen(navigation, 'Home');

// Replace current screen
navigationUtils.replaceScreen(navigation, 'Login');
```

---

## 🎨 Customizing for Your Project

### Example 1: Add a New Transition Type

```javascript
// In transitionConfig
slideFromTop: {
  animation: 'slide_from_top',
  animationDuration: 300,
  gestureEnabled: true,
  gestureDirection: 'vertical',
},
```

### Example 2: Create a New Screen Category

```javascript
// In screenTransitions
ecommerce: {
  ...transitionConfig.slideFromRight,
  animationDuration: 280,
},

// In getTransitionConfig
case 'ProductDetails':
case 'Cart':
case 'Checkout':
  return screenTransitions.ecommerce;
```

### Example 3: Platform-Specific Behavior

```javascript
// Different transitions for iOS and Android
payment: {
  ...(Platform.OS === 'ios' 
    ? transitionConfig.slideFromBottom 
    : transitionConfig.fade),
  animationDuration: 250,
},
```

### Example 4: Conditional Gestures

```javascript
// Disable gestures during form editing
<Stack.Screen 
  name="EditProfile" 
  component={EditProfile}
  options={({ route }) => ({
    ...getTransitionConfig('EditProfile'),
    gestureEnabled: !route.params?.isEditing,
  })}
/>
```

---

## 🔥 Real-World Implementation Examples

### Banking App

```javascript
// utils/navigationTransitions.js (your project)

export const screenTransitions = {
  // Secure screens - no gestures
  secure: {
    ...transitionConfig.fade,
    animationDuration: 200,
    gestureEnabled: false,
  },
  
  // Transaction details - slide from right
  transaction: {
    ...transitionConfig.slideFromRight,
    animationDuration: 250,
  },
};

export const getTransitionConfig = (screenName) => {
  switch (screenName) {
    case 'PINEntry':
    case 'Fingerprint':
    case 'TransferConfirm':
      return screenTransitions.secure;
    
    case 'TransactionDetails':
    case 'TransactionHistory':
      return screenTransitions.transaction;
    
    default:
      return transitionConfig.slideFromRight;
  }
};
```

### E-Commerce App

```javascript
export const screenTransitions = {
  // Product details - modal from bottom
  product: {
    ...transitionConfig.slideFromBottom,
    animationDuration: 300,
  },
  
  // Cart and checkout - slide from right
  checkout: {
    ...transitionConfig.slideFromRight,
    animationDuration: 250,
    gestureEnabled: false, // Prevent accidental back
  },
};

export const getTransitionConfig = (screenName) => {
  switch (screenName) {
    case 'ProductDetails':
    case 'ProductReviews':
      return screenTransitions.product;
    
    case 'Cart':
    case 'Checkout':
    case 'OrderConfirmation':
      return screenTransitions.checkout;
    
    default:
      return transitionConfig.slideFromRight;
  }
};
```

### Social Media App

```javascript
export const screenTransitions = {
  // Stories - slide from bottom with fast animation
  story: {
    ...transitionConfig.slideFromBottom,
    animationDuration: 250,
  },
  
  // Profile and posts - standard slide
  content: {
    ...transitionConfig.slideFromRight,
    animationDuration: 280,
  },
  
  // Camera and create - instant
  camera: {
    ...transitionConfig.none,
  },
};
```

---

## 🎯 Best Practices from This System

### 1. **Semantic Naming**
✅ **Good**: `screenTransitions.payment`  
❌ **Bad**: `slideRightPayment300ms`

### 2. **Group by Purpose, Not Animation**
✅ **Good**: All payment screens use `screenTransitions.payment`  
❌ **Bad**: Each payment screen has custom config

### 3. **Sensible Defaults**
```javascript
default:
  return transitionConfig.slideFromRight; // Always have a fallback
```

### 4. **Platform Awareness**
```javascript
...(Platform.OS === 'ios' && {
  presentation: 'modal',
}),
```

### 5. **Performance Timing**
- **Fast**: 200-250ms for quick actions (closing, back)
- **Standard**: 280-300ms for most screens
- **Slow**: 350-400ms for important transitions (login → home)

### 6. **Gesture Control**
```javascript
// Disable for forms and sensitive flows
payment: {
  ...transitionConfig.slideFromRight,
  gestureEnabled: false,
},
```

---

## 📊 Transition Decision Matrix

| Screen Type | Transition | Duration | Gestures | Use Case |
|-------------|-----------|----------|----------|----------|
| **Auth** | Fade | 250ms | ❌ No | Login, Signup |
| **Main** | Slow Fade | 400ms | ❌ No | App entry |
| **Modal** | Slide Bottom | 350ms | ✅ Yes | Search, Chat |
| **Settings** | Slide Right | 280ms | ✅ Yes | Preferences |
| **Service** | Slide Right | 300ms | ✅ Yes | Browse, Book |
| **Payment** | Slide Right | 250ms | ❌ No | Checkout |
| **Onboarding** | Slide Right | 350ms | ❌ No | First launch |

---

## 🛠️ Setup in a New Project

### Step 1: Copy the File
```bash
# Create utils folder
mkdir utils

# Copy navigationTransitions.js
cp path/to/navigationTransitions.js ./utils/
```

### Step 2: Update Screen Names
```javascript
// Edit getTransitionConfig() with your screen names
case 'YourScreenName':
  return screenTransitions.yourCategory;
```

### Step 3: Apply to Navigation
```javascript
// In your App.js or AppNavigation.js
import { getTransitionConfig } from './utils/navigationTransitions';

<Stack.Navigator
  screenOptions={({ route }) => ({
    ...getTransitionConfig(route.name),
    headerShown: false,
  })}
>
  {/* Your screens */}
</Stack.Navigator>
```

### Step 4: Customize Categories
```javascript
// Add your own screen categories
export const screenTransitions = {
  ...existingCategories,
  
  // Your custom category
  myCustomFlow: {
    ...transitionConfig.fade,
    animationDuration: 300,
  },
};
```

---

## 💡 Pro Tips

1. **Use `getTransitionConfig()` Consistently**
   - Don't mix manual options with the system
   - Let the function handle all transitions

2. **Test on Real Devices**
   - Emulators don't show true animation performance
   - Test gestures on actual hardware

3. **Monitor Animation Duration**
   - Too fast: < 200ms (jarring)
   - Too slow: > 400ms (sluggish)
   - Sweet spot: 250-300ms

4. **Consider User Flow**
   - Modal screens → `slideFromBottom`
   - Standard navigation → `slideFromRight`
   - Critical actions → `fade` (no gestures)

5. **Platform Conventions**
   - iOS: Prefers cards and modals
   - Android: Prefers fades and cross-fades
   - Use `Platform.OS` checks

6. **Debug Transitions**
   ```javascript
   console.log('Screen transition:', screenName, getTransitionConfig(screenName));
   ```

---

## 🎓 Advanced: Custom Interpolators

If you need more control, create custom interpolators:

```javascript
export const customFadeScale = {
  animation: 'custom',
  animationDuration: 300,
  gestureEnabled: true,
  cardStyleInterpolator: ({ current }) => ({
    cardStyle: {
      opacity: current.progress,
      transform: [
        {
          scale: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
          }),
        },
      ],
    },
  }),
};
```

Then add to your screen transitions:

```javascript
case 'SpecialScreen':
  return customFadeScale;
```

---

## 🔥 Real-World Implementation Examples

### Example 1: E-Commerce App

```javascript
// ProductDetails screen with slide-up modal
const transitionMap = {
  'ProductDetails': {
    ...slideFromBottom,
    cardStyle: {
      backgroundColor: 'transparent',
    },
    cardOverlayEnabled: true,
  },
  'Cart': {
    ...slideFromRight,
    gestureDirection: 'horizontal-inverted', // Slide from left
  },
  'Checkout': {
    ...scaleFromCenter,
    presentation: 'transparentModal',
  },
};
```

### Example 2: Social Media App

```javascript
// Stories with custom transition
export const storyTransition = {
  gestureDirection: 'vertical',
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 200,
      },
    },
  },
  cardStyleInterpolator: ({ current, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height, 0],
            }),
          },
          {
            scale: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
          },
        ],
      },
    };
  },
};
```

### Example 3: Banking App

```javascript
// Secure screens with special transitions
const secureTransitionMap = {
  'PINEntry': {
    ...fadeTransition,
    gestureEnabled: false, // Disable swipe-back
    cardOverlayEnabled: true,
    cardStyle: {
      backgroundColor: 'rgba(0,0,0,0.9)',
    },
  },
  'TransactionDetails': {
    ...slideFromRight,
    transitionSpec: {
      open: config,
      close: {
        animation: 'timing',
        config: { duration: 150 },
      },
    },
  },
};
```

---

## 🎯 Best Practices

### 1. Navigation Performance

```javascript
// Use lazy loading for heavy screens
const ServiceDetails = lazy(() => import('./screens/ServiceDetails'));

// Optimize stack depth
const navigationOptions = {
  headerShown: false,
  lazy: true,
  unmountOnBlur: true, // Clean up memory
};
```

### 2. Gesture Management

```javascript
// Conditional gestures based on screen state
options={({ route }) => ({
  ...getTransitionConfig('ServiceDetails'),
  gestureEnabled: !route.params?.isEditing, // Disable during editing
})}
```

### 3. Deep Linking

```javascript
const linking = {
  prefixes: ['bricollano://', 'https://bricollano.com'],
  config: {
    screens: {
      ServiceDetails: 'service/:id',
      BookingDetails: 'booking/:id',
      Profile: 'profile/:userId',
    },
  },
};

// Usage: bricollano://service/123
```

### 4. Navigation Guards

```javascript
// Protect screens based on auth state
{shouldShowAuthStack ? (
  <AuthStack />
) : !profileComplete ? (
  <ProfileSetupStack />
) : (
  <MainStack />
)}
```

---

## 🎯 Header Component - Reusable Screen Header

### Component Overview

The `Header` component is a **simple, reusable navigation header** used consistently across all app screens. It provides a back button and title, adapting to both light and dark themes.

**Location**: `components/Header.js`

### Architecture Analysis

```javascript
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { SIZES, COLORS, icons } from '../constants';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';

const Header = ({ title, showBackButton = true }) => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();

  return (
    <View style={[styles.container, {
      backgroundColor: dark ? COLORS.dark1 : COLORS.white
    }]}>
      {showBackButton && (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={icons.back}
            resizeMode='contain'
            style={[styles.backIcon, {
              tintColor: colors.text
            }]} 
          />
        </TouchableOpacity>
      )}
      <Text style={[styles.title, {
        color: colors.text
      }]}>
        {title}
      </Text>
    </View>
  )
};
```

### Key Features

**1. Automatic Navigation Integration**
- Uses `useNavigation()` hook - no need to pass navigation as prop
- Back button automatically calls `navigation.goBack()`

**2. Theme-Aware**
- Adapts background and text colors based on light/dark mode
- Uses `useTheme()` hook for automatic theme switching

**3. Conditional Back Button**
- `showBackButton` prop to hide/show back button
- Default: `true` (back button visible)

**4. Clean API**
- Only 2 props: `title` and `showBackButton`
- Simple to use, hard to misuse

---

### Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| **title** | `string` | `undefined` | Screen title text (optional - can be empty) |
| **showBackButton** | `boolean` | `true` | Show/hide the back navigation button |

---

### Usage Patterns

#### Pattern 1: Standard Header (With Title & Back Button)

**Most Common Usage** - Used in 90% of screens

```javascript
import Header from '../components/Header';

const EditProfileScreen = () => {
  return (
    <SafeAreaView>
      <Header title="Edit Profile" />
      {/* Screen content */}
    </SafeAreaView>
  );
};
```

**Real Examples from App**:
```javascript
// Settings screens
<Header title={t('settings.security.title')} />
<Header title={t('settings.notifications.title')} />
<Header title={t('profile.language_region')} />

// Profile screens
<Header title={t('profile.edit_profile')} />
<Header title={t('profile.invite_friends')} />

// Booking screens
<Header title={t('bookings.title')} />
```

#### Pattern 2: Header Without Back Button

**Use Case**: Login/signup screens where back navigation should be hidden

```javascript
import Header from '../components/Header';

const LoginScreen = () => {
  return (
    <SafeAreaView>
      <Header showBackButton={false} />
      {/* Login form */}
    </SafeAreaView>
  );
};
```

**Real Example**:
```javascript
// Login screen - no back button on entry point
<Header showBackButton={false} />
```

#### Pattern 3: Header Without Title

**Use Case**: Screens where title is shown elsewhere or not needed

```javascript
import Header from '../components/Header';

const SignupScreen = () => {
  return (
    <SafeAreaView>
      <Header />
      <Text style={styles.bigTitle}>Create Account</Text>
      {/* Signup form */}
    </SafeAreaView>
  );
};
```

**Real Example**:
```javascript
// Signup screen - title shown separately below
<Header />
```

#### Pattern 4: With Internationalization (i18n)

**Best Practice** - Use translation keys for multi-language support

```javascript
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';

const SettingsScreen = () => {
  const { t } = useTranslation();
  
  return (
    <SafeAreaView>
      <Header title={t('settings.security.title')} />
      {/* Settings content */}
    </SafeAreaView>
  );
};
```

---

### Design Decisions Explained

#### Why `useNavigation()` Hook?

**✅ Advantages**:
```javascript
// No need to pass navigation prop
const Header = ({ title, showBackButton }) => {
  const navigation = useNavigation(); // Get it directly!
  // ...
}

// Cleaner usage
<Header title="Settings" />
// vs
<Header title="Settings" navigation={navigation} />
```

**Alternative Approach** (Not used):
```javascript
// Would require navigation prop everywhere
const Header = ({ title, showBackButton, navigation }) => {
  // Less clean
}
```

#### Why Default `showBackButton = true`?

**✅ Reasoning**:
- 95% of screens need a back button
- Makes common case simpler
- Opt-out instead of opt-in

```javascript
// Common case (most screens)
<Header title="Edit Profile" />

// Special case (login/entry points)
<Header showBackButton={false} />
```

#### Why Not Custom `onPress` Handler?

**Current Design**:
```javascript
<TouchableOpacity onPress={() => navigation.goBack()}>
```

**Could Be** (but isn't):
```javascript
const Header = ({ title, showBackButton, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };
}
```

**Why the simpler approach?**
- 99% of cases just need `goBack()`
- Custom behavior can be handled in parent screen
- Keeps component API minimal
- If you need custom behavior, use a different component

---

### Styling Architecture

```javascript
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,      // Overridden by theme
    width: SIZES.width - 32,            // Full width minus padding
    flexDirection: "row",                // Back button + title side by side
    alignItems: "center",                // Vertical centering
  },
  backIcon: {
    width: 24,
    height: 24,
    marginRight: 16                      // Space between icon and title
  },
  title: {
    fontSize: 24,
    fontFamily: "bold",
    color: COLORS.black                  // Overridden by theme
  }
})
```

**Style Override Pattern**:
```javascript
<View style={[
  styles.container,                      // Base styles
  { backgroundColor: dark ? COLORS.dark1 : COLORS.white } // Theme override
]}>
```

---

### Customization Examples

#### Example 1: E-Commerce App Header

```javascript
// components/Header.js
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';

const Header = ({ 
  title, 
  showBackButton = true,
  rightIcon,           // NEW: Right side action
  onRightPress         // NEW: Handler for right icon
}) => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();

  return (
    <View style={styles.container}>
      {/* Back button */}
      {showBackButton && (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={icons.back} style={[styles.icon, { tintColor: colors.text }]} />
        </TouchableOpacity>
      )}
      
      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      
      {/* Right action (NEW) */}
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} style={styles.rightButton}>
          <Image source={rightIcon} style={[styles.icon, { tintColor: colors.text }]} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Usage:
<Header 
  title="Shopping Cart" 
  rightIcon={icons.share}
  onRightPress={() => shareCart()}
/>
```

#### Example 2: Social Media App Header

```javascript
// components/Header.js
const Header = ({ 
  title, 
  showBackButton = true,
  subtitle,            // NEW: Subtitle below title
  avatar              // NEW: User avatar
}) => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {showBackButton && (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={icons.back} style={styles.backIcon} />
        </TouchableOpacity>
      )}
      
      {/* Avatar (NEW) */}
      {avatar && (
        <Image source={{ uri: avatar }} style={styles.avatar} />
      )}
      
      {/* Title + Subtitle */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

// Usage:
<Header 
  title="John Doe" 
  subtitle="Active now"
  avatar="https://..." 
/>
```

#### Example 3: Search Header

```javascript
// components/SearchHeader.js
const SearchHeader = ({ 
  onSearch,
  placeholder = "Search..."
}) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Image source={icons.back} style={styles.backIcon} />
      </TouchableOpacity>
      
      {/* Search input instead of title */}
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          onSearch(text);
        }}
      />
      
      {query.length > 0 && (
        <TouchableOpacity onPress={() => setQuery('')}>
          <Image source={icons.close} style={styles.clearIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Usage:
<SearchHeader 
  placeholder="Search products..."
  onSearch={(query) => searchProducts(query)}
/>
```

---

### Best Practices

#### 1. ✅ Consistent Placement

**Good**:
```javascript
const MyScreen = () => (
  <SafeAreaView style={styles.area}>
    <Header title="My Screen" />  {/* Always first */}
    <ScrollView>
      {/* Content */}
    </ScrollView>
  </SafeAreaView>
);
```

**Avoid**:
```javascript
// Don't put Header inside ScrollView
<ScrollView>
  <Header title="My Screen" />  {/* ❌ Will scroll with content */}
  {/* Content */}
</ScrollView>
```

#### 2. ✅ Use Translations

**Good**:
```javascript
const { t } = useTranslation();
<Header title={t('settings.title')} />
```

**Avoid**:
```javascript
<Header title="Settings" />  {/* ❌ Hard-coded text */}
```

#### 3. ✅ Minimal Props

**Good**:
```javascript
<Header title="Edit Profile" />
```

**Avoid** (over-engineering):
```javascript
<Header 
  title="Edit Profile"
  titleSize={24}
  titleColor="black"
  titleWeight="bold"
  leftIcon={icons.back}
  leftIconSize={24}
  // Too many props!
/>
```

#### 4. ✅ Theme Integration

**Good** (uses theme):
```javascript
<Text style={[styles.title, { color: colors.text }]}>
  {title}
</Text>
```

**Avoid**:
```javascript
<Text style={[styles.title, { color: dark ? '#fff' : '#000' }]}>
  {title}  {/* ❌ Manual theme logic */}
</Text>
```

---

### When to Create a Different Header

**Use the standard `Header` component when:**
- ✅ Simple back button + title needed
- ✅ Screen fits standard navigation pattern
- ✅ No complex interactions required

**Create a custom header when:**
- ❌ Need search functionality
- ❌ Multiple action buttons required
- ❌ Complex layouts (tabs, filters, etc.)
- ❌ Animated headers
- ❌ Different visual design needed

**Example Custom Headers**:
```javascript
// Custom headers for specific use cases
components/
  ├── Header.js              // Standard header (this component)
  ├── SearchHeader.js        // Header with search input
  ├── ChatHeader.js          // Header with avatar + online status
  ├── ProfileHeader.js       // Header with cover photo + avatar
  └── HomeHeader.js          // Header with logo + notifications
```

---

## 🛠️ Customization Guide

### Creating Your Own Transition

```javascript
export const customSlideTransition = {
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 300,
        damping: 30,
        mass: 1,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      },
    },
  },
  cardStyleInterpolator: ({ current, next, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0.5, 1],
        }),
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
        }),
      },
    };
  },
};
```

### Platform-Specific Transitions

```javascript
import { Platform } from 'react-native';

export const platformTransition = Platform.select({
  ios: slideFromRight,
  android: fadeTransition,
  web: scaleFromCenter,
});
```

---

## 📚 Additional Resources

### File Structure
```
theApp/
├── navigations/
│   ├── AppNavigation.js          # Main navigation logic
│   └── BottomTabNavigation.js    # Tab bar navigation
├── utils/
│   └── navigationTransitions.js  # Transition configurations
├── constants/
│   ├── theme.js                  # Colors & styling
│   └── fonts.js                  # Typography system
├── screens/                      # All screen components
└── components/                   # Reusable UI components
```

### Key Dependencies
```json
{
  "@react-navigation/native": "^6.x",
  "@react-navigation/native-stack": "^6.x",
  "@react-navigation/bottom-tabs": "^6.x",
  "react-native-screens": "^3.x",
  "react-native-safe-area-context": "^4.x"
}
```

---

## 🎓 Learning Path

1. **Start with basic navigation**: Understand Stack and Tab navigators
2. **Add authentication flow**: Implement conditional navigation
3. **Apply transitions**: Use pre-built transitions from this system
4. **Customize transitions**: Create your own based on app needs
5. **Optimize performance**: Add lazy loading and gesture controls
6. **Test deep linking**: Implement URL-based navigation

---

## 💡 Pro Tips

1. **Keep transitions subtle**: 300ms is the sweet spot for most transitions
2. **Match platform conventions**: iOS = slide, Android = fade/scale
3. **Disable gestures when needed**: Forms, modals, critical flows
4. **Test on real devices**: Emulators don't show true performance
5. **Use memoization**: Prevent unnecessary re-renders in navigation components
6. **Handle edge cases**: Back button, deep links, logout during navigation

---

## � Recommended Project Structure

```
your-app/
├── src/                          # Source code
│   ├── navigation/               # Navigation configuration
│   │   ├── AppNavigator.js      # Main navigator
│   │   ├── AuthStack.js         # Auth flow screens
│   │   ├── MainStack.js         # Main app screens
│   │   └── TabNavigator.js      # Bottom tabs
│   ├── screens/                 # Screen components
│   │   ├── auth/
│   │   ├── home/
│   │   └── profile/
│   ├── components/              # Reusable components
│   │   ├── Button.js
│   │   ├── Card.js
│   │   └── Typography.js
│   ├── contexts/                # React Context providers
│   │   ├── AuthContext.js
│   │   └── ThemeContext.js
│   ├── hooks/                   # Custom hooks
│   │   ├── useAuth.js
│   │   └── useTheme.js
│   ├── services/                # API calls, external services
│   │   ├── api.js
│   │   └── storage.js
│   ├── utils/                   # Utilities
│   │   ├── navigationTransitions.js
│   │   └── helpers.js
│   ├── constants/               # App constants
│   │   ├── theme.js
│   │   ├── fonts.js
│   │   └── config.js
│   └── assets/                  # Images, fonts, etc.
│       ├── fonts/
│       └── images/
├── App.js                       # Entry point
├── app.json                     # Expo config
└── package.json                 # Dependencies
```

---

## 🚀 Getting Started Checklist

### 1. Setup Base Project
```bash
# Create new Expo project
npx create-expo-app your-app-name
cd your-app-name

# Install navigation
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
```

### 2. Create Folder Structure
```bash
mkdir -p src/{navigation,screens,components,contexts,hooks,services,utils,constants,assets}
```

### 3. Implement Theme System
- [ ] Create `constants/theme.js` with colors
- [ ] Create `constants/fonts.js` with typography
- [ ] Create `contexts/ThemeContext.js` for light/dark mode
- [ ] Wrap app with `ThemeProvider`

### 4. Setup Navigation
- [ ] Copy `utils/navigationTransitions.js` from this guide
- [ ] Create `navigation/AppNavigator.js`
- [ ] Implement conditional auth/main stacks
- [ ] Apply `getTransitionConfig()` to screens

### 5. Create Auth Context
- [ ] Setup `contexts/AuthContext.js`
- [ ] Implement login/logout/signup logic
- [ ] Handle token storage
- [ ] Protect routes based on auth state

### 6. Build Core Screens
- [ ] Onboarding screens
- [ ] Auth screens (Login, Signup)
- [ ] Main tab screens
- [ ] Settings/Profile screens

---

## 📚 Additional Resources

### Documentation
- **React Navigation**: https://reactnavigation.org/
- **Expo**: https://docs.expo.dev/
- **React Native**: https://reactnative.dev/

### Design Systems
- **Material Design**: https://material.io/
- **iOS Human Interface Guidelines**: https://developer.apple.com/design/
- **Ant Design Mobile**: https://mobile.ant.design/

### Packages to Consider
```json
{
  "dependencies": {
    "@react-navigation/native": "^6.x",
    "@react-navigation/native-stack": "^6.x",
    "@react-navigation/bottom-tabs": "^6.x",
    "react-native-screens": "^3.x",
    "react-native-safe-area-context": "^4.x",
    "react-native-gesture-handler": "^2.x",
    "react-native-reanimated": "^3.x"
  }
}
```

---

## 🎓 Learning Path

### Beginner
1. ✅ Setup basic React Navigation (Stack + Tabs)
2. ✅ Create constants for colors and fonts
3. ✅ Build simple auth flow (Login → Home)

### Intermediate
4. ✅ Implement conditional navigation based on auth
5. ✅ Apply custom transitions from this guide
6. ✅ Create theme provider with light/dark mode
7. ✅ Add deep linking

### Advanced
8. ✅ Build custom interpolators for unique animations
9. ✅ Implement navigation guards and middleware
10. ✅ Optimize performance (lazy loading, memoization)
11. ✅ Add analytics tracking to navigation

---

## 💡 Final Pro Tips

1. **Start Simple**: Begin with basic navigation, add complexity later
2. **Think Semantic**: Name things by their purpose, not implementation
3. **Test on Devices**: Always test animations on real hardware
4. **Follow Platform Conventions**: iOS and Android have different UX patterns
5. **Keep Transitions Subtle**: 250-300ms is the sweet spot
6. **Document Your Decisions**: Explain why you chose certain patterns
7. **Version Control**: Commit working navigation before refactoring
8. **Performance Matters**: Use lazy loading for heavy screens
9. **Accessibility**: Ensure navigation works with screen readers
10. **User Feedback**: Get real user testing on navigation flows

---

## 📞 Support & Contributing

**Questions?**
- Check React Navigation docs: https://reactnavigation.org/
- Review code examples in this guide
- Test patterns in a new Expo project

**Found an Issue?**
- This guide is based on production app architecture
- Adapt patterns to your specific needs
- Share improvements with your team

---

**Last Updated**: November 2025  
**Version**: 2.0.0  
**Stack**: React Native + Expo + React Navigation v6  
**License**: Use freely in your projects ⚡
