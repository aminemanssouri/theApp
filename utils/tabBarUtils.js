import React from 'react';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Custom hook to get tab bar height
export const useTabBarHeight = () => {
  const insets = useSafeAreaInsets();
  
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
  const insets = useSafeAreaInsets();
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
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  
  return {
    paddingTop: insets.top,
    paddingBottom: tabBarHeight,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };
};
