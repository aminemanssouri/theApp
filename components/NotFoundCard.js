import { View, Text, StyleSheet, Image } from 'react-native';
import React from 'react';
import { COLORS, illustrations } from '../constants';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../context/LanguageContext';

const NotFoundCard = () => {
  const { dark } = useTheme();

  return (
    <View style={styles.container}>
      <Image
        source={illustrations.notFound}
        resizeMode='contain'
        style={styles.illustration}
      />
      <Text style={[styles.title, {
        color: dark ? COLORS.white : COLORS.black
      }]}>{t('errors.not_found_title')}</Text>
      <Text style={[styles.subtitle, {
        color: dark ? COLORS.white : COLORS.black
      }]}>{t('errors.not_found_subtitle')}</Text>
    </View>
  )
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  illustration: {
    width: 340,
    height: 250,
    marginVertical: 32
  },
  title: {
    fontSize: 24,
    fontFamily: "bold",
    color: COLORS.black,
    marginVertical: 16
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "regular",
    color: COLORS.grayscale700,
    textAlign: "center"
  }
})

export default NotFoundCard