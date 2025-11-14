import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SIZES, icons, images } from "../constants";
import SocialButtonV2 from "../components/SocialButtonV2";
import { useTheme } from "../theme/ThemeProvider";
import { signInWithGoogle } from '../lib/services/auth';
import { supabase } from '../lib/supabase';
import { t } from '../context/LanguageContext';

const Welcome = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  // Google authentication handler (same logic as Signup.js)
  const googleAuthHandler = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await signInWithGoogle();
      if (error) throw error;
      
      console.log('Google Sign In Data:', data);
      
      // Check if we have a valid session
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        console.log('✅ Google authentication successful - AppNavigation will handle routing');
        
        // Don't manually navigate - let AuthContext and AppNavigation handle it
        // The SIGNED_IN event will trigger checkProfileCompletion
        // and AppNavigation will show FillYourProfile or Main automatically
        
        // Keep loading briefly for smooth transition
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } else {
        console.log('Authentication completed but no session found');
        Alert.alert(t('common.error'), t('auth.authentication_no_session'));
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Google auth error:', error);
      Alert.alert(t('common.error'), error.message);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Image source={images.logo} resizeMode="contain" style={styles.logo} />
        <Text style={[styles.title, { color: colors.text }]}>{t('welcome.title')}</Text>
        <Text style={[styles.subtitle, { color: dark ? COLORS.white : "black" }]}>
          {t('welcome.subtitle')}
        </Text>
        <View style={{ marginVertical: 32 }}>
          <SocialButtonV2 
            title={t('welcome.continue_with_google')}
            icon={icons.google} 
            onPress={googleAuthHandler}
            isLoading={isLoading}
          />
          <SocialButtonV2 
            title={t('welcome.continue_with_email')}
            icon={icons.email2} 
            onPress={() => navigation.navigate("Signup")} 
          />
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={[styles.loginTitle, {
            color: dark ? COLORS.white : "black"
          }]}>{t('welcome.already_have_account')} </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginSubtitle}>{t('welcome.log_in')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <Text style={[styles.bottomTitle, {
          color: dark ? COLORS.white : COLORS.black }]}>
          {t('welcome.terms_text')}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={[styles.bottomSubtitle, {
            color: dark ? COLORS.white : COLORS.black
          }]}>{t('welcome.privacy_policy')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 22,
    marginTop: -22,
    tintColor: COLORS.primary
  },
  title: {
    fontSize: 28,
    fontFamily: "bold",
    color: COLORS.black,
    marginVertical: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "regular",
    color: "black",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  loginTitle: {
    fontSize: 14,
    fontFamily: "regular",
    color: "black",
  },
  loginSubtitle: {
    fontSize: 14,
    fontFamily: "semiBold",
    color: COLORS.primary,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 32,
    right: 0,
    left: 0,
    width: SIZES.width - 32,
    alignItems: "center",
  },
  bottomTitle: {
    fontSize: 12,
    fontFamily: "regular",
    color: COLORS.black,
  },
  bottomSubtitle: {
    fontSize: 12,
    fontFamily: "regular",
    color: COLORS.black,
    textDecorationLine: "underline",
    marginTop: 2,
  },
});

export default Welcome;