import { Platform } from 'react-native';

// Enhanced scroll configurations for smooth scrolling
export const scrollConfig = {
  // Default smooth scrolling configuration
  default: {
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
    scrollEventThrottle: 16,
    bounces: true,
    bouncesZoom: false,
    alwaysBounceVertical: false,
    alwaysBounceHorizontal: false,
    decelerationRate: 'normal',
    ...(Platform.OS === 'ios' && {
      automaticallyAdjustContentInsets: false,
      contentInsetAdjustmentBehavior: 'never',
    }),
  },

  // Configuration for horizontal scrolling (banners, categories)
  horizontal: {
    horizontal: true,
    showsHorizontalScrollIndicator: false,
    showsVerticalScrollIndicator: false,
    scrollEventThrottle: 16,
    bounces: true,
    bouncesZoom: false,
    alwaysBounceHorizontal: false,
    decelerationRate: 'fast',
    snapToInterval: undefined, // Set this based on item width
    snapToAlignment: 'center',
    ...(Platform.OS === 'ios' && {
      automaticallyAdjustContentInsets: false,
      contentInsetAdjustmentBehavior: 'never',
    }),
  },

  // Configuration for vertical lists
  vertical: {
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
    scrollEventThrottle: 16,
    bounces: true,
    bouncesZoom: false,
    alwaysBounceVertical: false,
    decelerationRate: 'normal',
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    windowSize: 10,
    initialNumToRender: 10,
    ...(Platform.OS === 'ios' && {
      automaticallyAdjustContentInsets: false,
      contentInsetAdjustmentBehavior: 'never',
    }),
  },

  // Configuration for fast scrolling (search results, large lists)
  fast: {
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
    scrollEventThrottle: 32,
    bounces: true,
    bouncesZoom: false,
    alwaysBounceVertical: false,
    decelerationRate: 'fast',
    removeClippedSubviews: true,
    maxToRenderPerBatch: 5,
    windowSize: 5,
    initialNumToRender: 5,
    getItemLayout: undefined, // Define this for known item heights
    ...(Platform.OS === 'ios' && {
      automaticallyAdjustContentInsets: false,
      contentInsetAdjustmentBehavior: 'never',
    }),
  },

  // Configuration for smooth paging
  paging: {
    horizontal: true,
    pagingEnabled: true,
    showsHorizontalScrollIndicator: false,
    showsVerticalScrollIndicator: false,
    scrollEventThrottle: 16,
    bounces: false,
    bouncesZoom: false,
    alwaysBounceHorizontal: false,
    decelerationRate: 'fast',
    ...(Platform.OS === 'ios' && {
      automaticallyAdjustContentInsets: false,
      contentInsetAdjustmentBehavior: 'never',
    }),
  },
};

// FlatList optimization configurations
export const flatListConfig = {
  // Default FlatList configuration
  default: {
    ...scrollConfig.vertical,
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    windowSize: 10,
    initialNumToRender: 10,
    updateCellsBatchingPeriod: 100,
    getItemLayout: undefined, // Define for known item heights
    keyExtractor: (item, index) => item.id?.toString() || index.toString(),
  },

  // Configuration for large lists
  large: {
    ...scrollConfig.fast,
    removeClippedSubviews: true,
    maxToRenderPerBatch: 5,
    windowSize: 5,
    initialNumToRender: 5,
    updateCellsBatchingPeriod: 50,
    getItemLayout: undefined,
    keyExtractor: (item, index) => item.id?.toString() || index.toString(),
  },

  // Configuration for horizontal lists
  horizontal: {
    ...scrollConfig.horizontal,
    removeClippedSubviews: false, // Better for horizontal scrolling
    maxToRenderPerBatch: 10,
    windowSize: 10,
    initialNumToRender: 5,
    updateCellsBatchingPeriod: 100,
    keyExtractor: (item, index) => item.id?.toString() || index.toString(),
  },
};

// Utility functions for scroll optimization
export const scrollUtils = {
  // Get optimized scroll props based on content type
  getScrollProps: (type = 'default') => {
    return scrollConfig[type] || scrollConfig.default;
  },

  // Get optimized FlatList props based on list type
  getFlatListProps: (type = 'default') => {
    return flatListConfig[type] || flatListConfig.default;
  },

  // Create item layout for known heights (performance optimization)
  createItemLayout: (itemHeight, itemSeparatorHeight = 0) => {
    return (data, index) => ({
      length: itemHeight,
      offset: (itemHeight + itemSeparatorHeight) * index,
      index,
    });
  },

  // Optimized key extractor
  keyExtractor: (item, index) => {
    return item.id?.toString() || item.key?.toString() || index.toString();
  },
};

// Enhanced scroll performance configurations
export const performanceConfig = {
  // For better scroll performance on Android
  android: {
    nestedScrollEnabled: true,
    overScrollMode: 'never',
    scrollbarThumbColor: 'transparent',
    scrollbarTrackColor: 'transparent',
  },

  // For better scroll performance on iOS
  ios: {
    automaticallyAdjustContentInsets: false,
    contentInsetAdjustmentBehavior: 'never',
    keyboardDismissMode: 'on-drag',
    keyboardShouldPersistTaps: 'handled',
  },
};

// Get platform-specific scroll configuration
export const getPlatformScrollConfig = () => {
  return Platform.OS === 'ios' ? performanceConfig.ios : performanceConfig.android;
};
