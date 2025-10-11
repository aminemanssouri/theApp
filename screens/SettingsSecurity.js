import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import { COLORS, icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';
import Header from '../components/Header';
import GlobalSettingsItem from '../components/GlobalSettingsItem';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../context/LanguageContext';

const SettingsSecurity = ({ navigation }) => {
  const { colors, dark } = useTheme();

  // Navigate to forgot password immediately when component mounts
  React.useEffect(() => {
    navigation.navigate("ForgotPassword");
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title={t('settings.security.title')}/>
        <ScrollView style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          {/* All security options removed - redirects to forgot password */}
        </ScrollView>
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
  scrollView: {
    marginVertical: 22
  },
  arrowRight: {
    height: 24,
    width: 24,
    tintColor: COLORS.greyscale900
  },
  view: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16
  },
  viewLeft: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.greyscale900,
    marginRight: 8
  },
  button: {
    backgroundColor: COLORS.tansparentPrimary,
    borderRadius: 32,
    borderColor: COLORS.tansparentPrimary,
    marginTop: 22
  }
})

export default SettingsSecurity