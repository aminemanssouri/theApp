import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions, Platform } from 'react-native';
import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { COLORS, SIZES, icons } from '../constants'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { TabView, TabBar } from 'react-native-tab-view';
import { CancelledBooking, CompletedBooking, UpcomingBooking } from '../tabs';
import { useI18n } from '../context/LanguageContext';

const MyBooking = ({ navigation }) => {
  const layout = useWindowDimensions();
  const { dark, colors } = useTheme();
  const { t, language } = useI18n();

  useEffect(() => {
    console.log('Theme Debug - Dark mode:', dark);
    console.log('Theme Debug - Background color:', colors.background);
    console.log('Theme Debug - Text color:', colors.text);
  }, [dark, colors]);

  const [index, setIndex] = React.useState(0);
  const routes = useMemo(() => ([
    { key: 'first', title: t('bookings.tab_upcoming') },
    { key: 'second', title: t('bookings.tab_completed') },
    { key: 'third', title: t('bookings.tab_cancelled') }
  ]), [language]);

  const upcomingRef = useRef(null);
  const completedRef = useRef(null);
  const cancelledRef = useRef(null);

  const handleIndexChange = useCallback((newIndex) => {
    setIndex(newIndex);

    setTimeout(() => {
      switch (newIndex) {
        case 0:
          upcomingRef.current?.refreshData?.();
          break;
        case 1:
          completedRef.current?.refreshData?.();
          break;
        case 2:
          cancelledRef.current?.refreshData?.();
          break;
      }
    }, 100);
  }, []);

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
        shadowColor: 'transparent',
        elevation: 0,
      }}
      renderLabel={({ route, focused }) => (
        <Text style={{
          color: focused ? COLORS.primary : (dark ? COLORS.white : colors.text),
          fontSize: 16,
          fontFamily: "semiBold"
        }}>
          {route.title}
        </Text>
      )}
    />
  );

  const renderHeader = () => {
    const iconColor = dark ? COLORS.white : COLORS.black;
    const textColor = dark ? COLORS.white : COLORS.black;

    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={icons.back}
              resizeMode='contain'
              style={[styles.backIcon, { tintColor: iconColor }]}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {t('bookings.title')}
          </Text>
        </View>
        <TouchableOpacity>
          <Image
            source={icons.moreCircle}
            resizeMode='contain'
            style={[styles.moreIcon, { tintColor: iconColor }]}
          />
        </TouchableOpacity>
      </View>
    )
  }

  const [forceUpdate, setForceUpdate] = React.useState(0);
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [dark]);

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <TabView
          key={`tabview-${forceUpdate}`}
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
  },
  container: {
    flex: 1,
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
});

export default M
