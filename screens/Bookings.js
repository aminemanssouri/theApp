import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import React, { useRef, useCallback } from 'react';
import { COLORS, SIZES, icons } from '../constants'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { CancelledBooking, CompletedBooking, UpcomingBooking } from '../tabs';

const renderScene = SceneMap({
  first: UpcomingBooking,
  second: CompletedBooking,
  third: CancelledBooking
});


const MyBooking = ({ navigation }) => {
  const layout = useWindowDimensions();
  const { dark, colors } = useTheme();

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

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={{
        backgroundColor: COLORS.primary,
      }}
      style={{
        backgroundColor: colors.background,
      }}
      renderLabel={({ route, focused }) => (
        <Text style={[{
          color: focused ? COLORS.primary : (dark ? COLORS.white : COLORS.greyscale900),
          fontSize: 16,
          fontFamily: "semiBold"
        }]}>
          {route.title}
        </Text>
      )}
    />
  )
  /**
 * Render header
 */
  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}>
            <Image
              source={icons.back}
              resizeMode='contain'
              style={[styles.backIcon, {
                tintColor: dark ? COLORS.white : COLORS.greyscale900
              }]}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {
            color: dark ? COLORS.white : COLORS.greyscale900
          }]}>
            My Booking
          </Text>
        </View>
        <TouchableOpacity>
          <Image
            source={icons.moreCircle}
            resizeMode='contain'
            style={[styles.moreIcon, {
              tintColor: dark ? COLORS.white : COLORS.greyscale900
            }]}
          />
        </TouchableOpacity>
      </View>
    )
  }
  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <TabView
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
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16
  },
  headerContainer: {
    flexDirection: "row",
    width: SIZES.width - 32,
    justifyContent: "space-between",
    marginBottom: 16
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  backIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.black
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'bold',
    color: COLORS.black,
    marginLeft: 16
  },
  moreIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.black
  },
})

export default MyBooking