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
import { useI18n } from '../context/LanguageContext';


const renderScene = SceneMap({
  first: MyBookingsUpcoming,
  second: MyBookingCompleted,
  third: MyBookingsCancelled
});

const MyBookings = ({ navigation }) => {
  const layout = useWindowDimensions();
  const { dark, colors } = useTheme();
  const { t, language } = useI18n();
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

  const routes = React.useMemo(() => ([
    { key: 'first', title: t('bookings.tab_upcoming') },
    { key: 'second', title: t('bookings.tab_completed') },
    { key: 'third', title: t('bookings.tab_cancelled') }
  ]), [language])

  const renderTabBar = props => (
    <TabBar
      {...props}
      indicatorStyle={{
        backgroundColor: COLORS.primary
      }}
      style={{
        backgroundColor: colors.background,
        shadowColor: 'transparent',
        elevation: 0,
      }}
      labelStyle={{
        fontSize: 16,
        fontFamily: "semiBold",
        textTransform: 'none',
      }}
      activeColor={COLORS.primary}
      inactiveColor={dark ? COLORS.white : COLORS.black}
      renderLabel={({ route, focused }) => (
        <View style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
          <Text style={{
            color: focused ? COLORS.primary : (dark ? COLORS.white : COLORS.greyscale900),
            fontSize: 16,
            fontFamily: "semiBold",
            textTransform: 'none',
            textAlign: 'center',
          }}>
            {route.title}
          </Text>
        </View>
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

        <View style={{ paddingHorizontal: 16, paddingTop: 37 }}>
          <Header title={t('bookings.title')} />

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