import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  useWindowDimensions,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

import { icons, COLORS, SIZES } from '../constants';
import { useTheme } from '../theme/ThemeProvider';
import {
  UpcomingBooking,
  CompletedBooking,
  CancelledBooking
} from '../tabs';

const renderScene = SceneMap({
  first: UpcomingBooking,
  second: CompletedBooking,
  third: CancelledBooking
});

const MyBooking = ({ navigation }) => {
  const layout = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { dark, colors } = useTheme();

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'first', title: 'Upcoming' },
    { key: 'second', title: 'Completed' },
    { key: 'third', title: 'Cancelled' }
  ]);

  const getBottomSpacing = () => {
    const baseTabHeight = 60;
    const safeAreaBottom = insets.bottom;

    if (Platform.OS === 'ios') {
      return baseTabHeight + safeAreaBottom + 10;
    } else {
      return baseTabHeight + Math.max(safeAreaBottom, 10) + 10;
    }
  };

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={{
        backgroundColor: COLORS.primary
      }}
      style={{
        backgroundColor: colors.background
      }}
      renderLabel={({ route, focused }) => (
        <Text
          style={{
            color: focused ? COLORS.primary : 'gray',
            fontSize: 16,
            fontFamily: 'semiBold'
          }}
        >
          {route.title}
        </Text>
      )}
    />
  );

  const renderHeader = () => {
    return (
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={icons.back}
              style={[
                styles.icon,
                { tintColor: dark ? COLORS.white : COLORS.greyscale900 }
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerText,
              { color: dark ? COLORS.white : COLORS.greyscale900 }
            ]}
          >
            My Booking
          </Text>
        </View>
        <TouchableOpacity>
          <Image
            source={icons.moreCircle}
            style={[
              styles.icon,
              { tintColor: dark ? COLORS.white : COLORS.greyscale900 }
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (

    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background, flex: 1 }]}>

        {renderHeader()}

        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.background,
              paddingBottom: getBottomSpacing()
            }
          ]}
        >
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={renderTabBar}
          />
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  container: {
    flex: 1,
    paddingHorizontal: 16
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: 'blue'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    width: 24,
    height: 24
  },
  headerText: {
    fontSize: 20,
    fontFamily: 'bold',
    marginLeft: 16
  }
});

export default MyBooking;
