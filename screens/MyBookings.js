import { View, Text, TouchableOpacity, Image, useWindowDimensions, StatusBar, Platform } from 'react-native';
import React from 'react';
import { getSafeAreaInsets } from '../utils/safeAreaUtils';
import { COLORS,  icons } from '../constants';
import { useNavigation } from '@react-navigation/native';
import { commonStyles } from '../styles/CommonStyles';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { MyBookingCompleted, MyBookingsCancelled, MyBookingsUpcoming } from '../tabs';
import Header from '../components/Header';
import { useTheme } from '../theme/ThemeProvider';


const renderScene = SceneMap({
  first: MyBookingsUpcoming,
  second: MyBookingCompleted,
  third: MyBookingsCancelled
});

const MyBookings = ({ navigation }) => {
  const layout = useWindowDimensions();
  const { dark, colors } = useTheme();
  const insets = getSafeAreaInsets();

  // Calculate bottom spacing to avoid tab bar overlap
  const getBottomSpacing = () => {
    const baseTabHeight = 60;
    const safeAreaBottom = insets.bottom;
    
    if (Platform.OS === 'ios') {
      return baseTabHeight + safeAreaBottom;
    } else {
      return baseTabHeight + Math.max(safeAreaBottom, 10);
    }
  };

  const [index, setIndex] = React.useState(0);

  const [routes] = React.useState([
    { key: 'first', title: 'Upcoming' },
    { key: 'second', title: 'Completed' },
    { key: 'third', title: 'Cancelled'}
  ])

  const renderTabBar = props => (
    <TabBar
      {...props}
      indicatorStyle={{
        backgroundColor: COLORS.primary
      }}
      style={{
        backgroundColor: colors.background
      }}
      renderLabel={({ route, focused, color }) => (
        <Text style={[{ 
            color: focused ? COLORS.primary : (dark ? COLORS.gray3 : COLORS.grayscale700),
            fontFamily: focused ? "semiBold" : "regular",
            fontSize: 16
            }]}>
          {route.title}
        </Text>
      )}
    />
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.background  }}>
      <StatusBar hidden={true} />
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background
      }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Header title="My Bookings" />
        </View>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  )
}

export default MyBookings