import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SIZES, FONTS, images, icons } from "../constants";
import Button from "../components/Button";
import Input from "../components/Input";
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../context/LanguageContext';  // Import t directly
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OTPVerification = ({ navigation }) => {
  const { colors, dark } = useTheme();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryTokens, setRecoveryTokens] = useState(null);
  const [errors, setErrors] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    checkRecoveryTokens();
  }, []);

  const checkRecoveryTokens = async () => {
    console.log('🔍 Checking for recovery tokens...');
    try {
      const accessToken = await AsyncStorage.getItem('recovery_access_token');
      const refreshToken = await AsyncStorage.getItem('recovery_refresh_token');
      
      console.log('📦 Tokens found:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenLength: accessToken?.length,
        refreshTokenLength: refreshToken?.length
      });
      
      if (!accessToken || !refreshToken) {
        console.log('❌ No recovery tokens found');
        Alert.alert(
          t('auth.session_expired'),
          t('auth.please_request_new_reset_link'),
          [{ text: t('common.ok'), onPress: () => navigation.navigate('Login') }]
        );
      } else {
        console.log('✅ Recovery tokens found - ready for password reset');
        setRecoveryTokens({ accessToken, refreshToken });
      }
    } catch (error) {
      console.error('Error checking recovery tokens:', error);
      Alert.alert(
        t('common.error'),
        t('auth.something_went_wrong'),
        [{ text: t('common.ok'), onPress: () => navigation.navigate('Login') }]
      );
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      newPassword: '',
      confirmPassword: ''
    };

    if (!newPassword || newPassword.length < 6) {
      newErrors.newPassword = t('auth.password_min_length');
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('auth.confirm_password_required');
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t('auth.passwords_do_not_match');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handlePasswordReset = async () => {
    if (!validateForm()) {
      return;
    }

    if (!recoveryTokens) {
      console.log('❌ No recovery tokens available');
      Alert.alert(
        t('common.error'),
        t('auth.session_expired'),
        [{ text: t('common.ok'), onPress: () => navigation.navigate('Login') }]
      );
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔐 Setting recovery session...');
      
      // Set the session temporarily to update password
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: recoveryTokens.accessToken,
        refresh_token: recoveryTokens.refreshToken,
      });

      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw sessionError;
      }

      console.log('✅ Recovery session set, updating password...');

      // Update the password
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) {
        console.error('❌ Password update error:', error);
        throw error;
      }
      
      console.log('✅ Password updated successfully!');
      
      // Clear recovery tokens
      await AsyncStorage.removeItem('recovery_access_token');
      await AsyncStorage.removeItem('recovery_refresh_token');
      await AsyncStorage.removeItem('is_password_recovery');
      
      // Sign out the recovery session
      await supabase.auth.signOut();
      
      Alert.alert(
        t('auth.password_reset_success'),
        t('auth.password_reset_success_message'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert(
        t('auth.password_reset_error'),
        error.message || t('auth.password_reset_error_message')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <Image
              source={images.newPassword}
              resizeMode='contain'
              style={styles.logo}
            />
          </View>
          
          <Text style={[styles.title, { color: dark ? COLORS.white : COLORS.black }]}>
            {t('auth.reset_password')}
          </Text>
          
          <View style={styles.inputContainer}>
            <Input
              id="newPassword"
              placeholder={t('auth.new_password')}
              value={newPassword}
              onInputChanged={(id, text) => setNewPassword(text)}
              secureTextEntry
              errorText={errors.newPassword}
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
            />
            
            <Input
              id="confirmPassword"
              placeholder={t('auth.confirm_password')}
              value={confirmPassword}
              onInputChanged={(id, text) => setConfirmPassword(text)}
              secureTextEntry
              errorText={errors.confirmPassword}
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
            />
          </View>
          
          <Button
            title={t('auth.reset_password')}
            filled
            isLoading={loading}
            onPress={handlePasswordReset}
            style={styles.button}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1
  },
  container: {
    flex: 1,
    padding: 16
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: 52
  },
  logo: {
    width: SIZES.width * 0.8,
    height: SIZES.height * 0.25
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: 24
  },
  inputContainer: {
    marginBottom: 24
  },
  button: {
    marginTop: 12,
    marginBottom: 32
  }
});

export default OTPVerification;