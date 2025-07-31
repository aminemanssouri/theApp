import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Manual safe area calculations
export const getSafeAreaInsets = () => {
  return {
    top: Platform.OS === 'ios' ? 44 : 0,
    bottom: Platform.OS === 'ios' ? 34 : 0,
    left: 0,
    right: 0,
  };
};

// Get safe area bottom for iOS devices
export const getSafeAreaBottom = () => {
  return Platform.OS === 'ios' ? 34 : 0;
};

// Get safe area top for iOS devices
export const getSafeAreaTop = () => {
  return Platform.OS === 'ios' ? 44 : 0;
};

// Check if device has notch (simplified)
export const hasNotch = () => {
  return Platform.OS === 'ios' && (height >= 812 || width >= 812);
};

// Get status bar height
export const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? (hasNotch() ? 44 : 20) : 0;
};

// Safe area styles for containers
export const getSafeAreaStyles = () => {
  const insets = getSafeAreaInsets();
  return {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };
}; 