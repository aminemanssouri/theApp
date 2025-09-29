import React from 'react';
import { View, Platform } from 'react-native';

// Manual safe area calculations
const getSafeAreaInsets = () => {
  return {
    top: Platform.OS === 'ios' ? 44 : 0,
    bottom: Platform.OS === 'ios' ? 34 : 0,
    left: 0,
    right: 0,
  };
};

// Custom hook to get tab bar height
export const useTabBarHeight = () => {
  const insets = getSafeAreaInsets();
  
  const getTabBarHeight = () => {
    const baseHeight = 60;
    const safeAreaBottom = insets.bottom;
    
    if (Platform.OS === 'ios') {
      return baseHeight + safeAreaBottom;
    } else {
      return baseHeight + Math.max(safeAreaBottom, 10);
    }
  };
  
  return getTabBarHeight();
};

// Component to add proper spacing above bottom tab bar
export const TabBarSpacer = ({ children, style = {} }) => {
  const tabBarHeight = useTabBarHeight();
  
  return (
    <View style={[{ paddingBottom: tabBarHeight + 10 }, style]}>
      {children}
    </View>
  );
};

// Component for screens with bottom tab navigation
export const TabScreenContainer = ({ children, style = {} }) => {
  const insets = getSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  
  return (
    <View style={[
      { 
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: tabBarHeight,
        backgroundColor: 'transparent'
      }, 
      style
    ]}>
      {children}
    </View>
  );
};

// Safe area configuration for tab screens
export const getTabScreenSafeArea = () => {
  const insets = getSafeAreaInsets();
  // Calculate tab bar height without using hooks
  const baseHeight = 60;
  const safeAreaBottom = insets.bottom;
  let tabBarHeight;
  
  if (Platform.OS === 'ios') {
    tabBarHeight = baseHeight + safeAreaBottom;
  } else {
    tabBarHeight = baseHeight + Math.max(safeAreaBottom, 10);
  }
  
  return {
    paddingTop: insets.top,
    paddingBottom: tabBarHeight,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };
};
