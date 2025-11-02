import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { COLORS, SIZES, icons, illustrations } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../context/LanguageContext';

const ForgotPasswordMethods = ({ navigation }) => {
  const { colors, dark } = useTheme();

  const handleContinue = () => {
    navigation.navigate('ForgotPasswordEmail');
  };
  
  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title={t('auth.forgot_password_title')} />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.passwordContainer}>
            <Image
              source={dark ? illustrations.passwordDark : illustrations.password}
              resizeMode='contain'
              style={styles.password}
            />
          </View>
          <Text style={[styles.title, {
            color: dark ? COLORS.white : COLORS.greyscale900
          }]}>{t('auth.reset_instructions')}</Text>

          <TouchableOpacity
            style={[styles.methodContainer, { borderColor: COLORS.primary, borderWidth: 2 }]}
            onPress={handleContinue}>
            <View style={styles.iconContainer}>
              <Image
                source={icons.email}
                resizeMode='contain'
                style={styles.icon} />
            </View>
            <View>
              <Text style={styles.methodTitle}>{t('auth.via_email')}</Text>
              <Text style={[styles.methodSubtitle, {
                color: dark ? COLORS.white : COLORS.black
              }]}>{t('auth.reset_via_email_desc')}</Text>
            </View>
          </TouchableOpacity>

          <Button
            title={t('common.continue')}
            filled
            style={styles.button}
            onPress={handleContinue}
          />
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
  password: {
    width: 276,
    height: 250
  },
  passwordContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 32
  },
  title: {
    fontSize: 18,
    fontFamily: "medium",
    color: COLORS.greyscale900
  },
  methodContainer: {
    width: SIZES.width - 32,
    height: 112,
    borderRadius: 32,
    borderColor: "gray",
    borderWidth: .3,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.tansparentPrimary,
    marginHorizontal: 16
  },
  icon: {
    width: 32,
    height: 32,
    tintColor: COLORS.primary
  },
  methodTitle: {
    fontSize: 14,
    fontFamily: "medium",
    color: COLORS.greyscale600
  },
  methodSubtitle: {
    fontSize: 16,
    fontFamily: "bold",
    color: COLORS.black,
    marginTop: 12
  },
  button: {
    borderRadius: 32,
    marginVertical: 22
  }
})

export default ForgotPasswordMethods