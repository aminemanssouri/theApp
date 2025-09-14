import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions,Platform } from 'react-native';
import React, { useRef, useCallback, useEffect } from 'react';
import { COLORS, SIZES, icons } from '../constants'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { TabView, TabBar } from 'react-native-tab-view';
import { CancelledBooking, CompletedBooking, UpcomingBooking } from '../tabs';

const MyBooking = ({ navigation }) => {
  const layout = useWindowDimensions();
  const { dark, colors } = useTheme();

  // Debug: Log theme values to see if they're updating
  useEffect(() => {
    console.log('Theme Debug - Dark mode:', dark);
    console.log('Theme Debug - Background color:', colors.background);
    console.log('Theme Debug - Text color:', colors.text);
  }, [dark, colors]);

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'first', title: 'Upcoming' },
    { key: 'second', title: 'Completed' },
    { key: 'third', title: 'Cancelled' }
  ]);

  // Refs to access child component methods
  const upcomingRef = useRef(null);
  const completedRef = useRef(null);
  const cancelledRef = useRef(null);

  // Handle tab change with refresh
  const handleIndexChange = useCallback((newIndex) => {
    setIndex(newIndex);
    
    // Trigger refresh on the newly selected tab
    setTimeout(() => {
      switch (newIndex) {
        case 0:
          // Refresh Upcoming bookings
          if (upcomingRef.current?.refreshData) {
            upcomingRef.current.refreshData();
          }
          break;
        case 1:
          // Refresh Completed bookings
          if (completedRef.current?.refreshData) {
            completedRef.current.refreshData();
          }
          break;
        case 2:
          // Refresh Cancelled bookings
          if (cancelledRef.current?.refreshData) {
            cancelledRef.current.refreshData();
          }
          break;
      }
    }, 100); // Small delay to ensure tab transition is smooth
  }, []);

  // Custom render scene to pass refs
  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'first':
        return <UpcomingBooking ref={upcomingRef} />;
      case 'second':
        return <CompletedBooking ref={completedRef} />;
      case 'third':
        return <CancelledBooking ref={cancelledRef} />;
      default:
        return null;
    }
  };

  const renderTabBar = (props) => {
    // Use colors.text from theme instead of manually checking dark
    const textColor = dark ? COLORS.primary : colors.text;
    
    console.log('TabBar - Dark mode:', dark, 'Text color:', textColor);
    
    return (
      <TabBar
        {...props}
        indicatorStyle={{
          backgroundColor: COLORS.primary,
        }}
        style={{
          backgroundColor: colors.background,
          shadowColor: 'transparent',
          elevation: 0,
        }}
        renderLabel={({ route, focused }) => (
          <Text style={{
            color: focused ? COLORS.primary : COLORS.primary,
            fontSize: 16,
            fontFamily: "semiBold"
          }}>
            {route.title}
          </Text>
        )}
      />
    );
  };

  /**
   * Render header
   */
  const renderHeader = () => {
    // Calculate colors once
    const iconColor = dark ? COLORS.white : COLORS.black;
    const textColor = dark ? COLORS.white : COLORS.black;
    
    console.log('Header - Dark mode:', dark, 'Icon color:', iconColor);
    
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}>
            <Image
              source={icons.back}
              resizeMode='contain'
              style={[styles.backIcon, {
                tintColor: iconColor
              }]}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {
            color: textColor
          }]}>
            My Booking
          </Text>
        </View>
        <TouchableOpacity>
          <Image
            source={icons.moreCircle}
            resizeMode='contain'
            style={[styles.moreIcon, {
              tintColor: iconColor
            }]}
          />
        </TouchableOpacity>
      </View>
    )
  }

  // Force re-render when theme changes
  const [forceUpdate, setForceUpdate] = React.useState(0);
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [dark]);

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <TabView
          key={`tabview-${forceUpdate}`} // Force TabView to re-render
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={handleIndexChange}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
        />
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
   area: {
     flex: 1,
     // Remove hardcoded color
   },
 container: {
    flex: 1,
    // Remove hardcoded color
    padding: 16,
    marginBottom: 32,
    paddingVertical: 16,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  backIcon: {
    height: 24,
    width: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'bold',
    marginLeft: 16
  },
  moreIcon: {
    width: 24,
    height: 24,
  },
})

export default MyBooking