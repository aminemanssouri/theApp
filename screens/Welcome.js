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
        console.log('Google authentication successful');
        
        // Check if this is a first-time login (new user)
        const isNewUser = sessionData.session.user?.app_metadata?.provider === 'google' && 
                         !sessionData.session.user?.user_metadata?.profile_completed;
        
        if (isNewUser) {
          // New user - send to profile completion
          navigation.navigate("FillYourProfile", { 
            userId: sessionData.session.user.id,
            email: sessionData.session.user.email
          });
        } else {
          // Existing user - go to main screen
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      } else {
        console.log('Authentication completed but no session found');
        Alert.alert(t('common.error'), t('auth.authentication_no_session'));
      }
    } catch (error) {
      console.error('Google auth error:', error);
      Alert.alert(t('common.error'), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Image source={images.logo} resizeMode="contain" style={styles.logo} />
        <Text style={[styles.title, { color: colors.text }]}>Welcome Back!</Text>
        <Text style={[styles.subtitle, { color: dark ? COLORS.white : "black" }]}>
          Hello there, continue with and search the services from around the world.
        </Text>
        <View style={{ marginVertical: 32 }}>
          <SocialButtonV2 
            title="Continue with Apple" 
            icon={icons.appleLogo} 
            onPress={() => navigation.navigate("Signup")}
            iconStyles={{ tintColor: dark ? COLORS.white : COLORS.black }} 
          />
          <SocialButtonV2 
            title="Continue with Google" 
            icon={icons.google} 
            onPress={googleAuthHandler}
            isLoading={isLoading}
          />
          <SocialButtonV2 
            title="Continue with Email" 
            icon={icons.email2} 
            onPress={() => navigation.navigate("Signup")} 
          />
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={[styles.loginTitle, {
            color: dark ? COLORS.white : "black"
          }]}>Already have account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginSubtitle}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <Text style={[styles.bottomTitle, {
          color: dark ? COLORS.white : COLORS.black }]}>
          By continuing, you accept the Terms Of Use and
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={[styles.bottomSubtitle, {
            color: dark ? COLORS.white : COLORS.black
          }]}>Privacy Policy.</Text>
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