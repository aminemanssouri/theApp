import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons, images } from '../constants';
import Header from '../components/Header';
import { reducer } from '../utils/reducers/formReducers';
import { validateInput } from '../utils/actions/formActions';
import Input from '../components/Input';
import Checkbox from 'expo-checkbox';
import Button from '../components/Button';
import SocialButton from '../components/SocialButton';
import OrSeparator from '../components/OrSeparator';
import { useTheme } from '../theme/ThemeProvider';
import { signIn,signInWithGoogle } from '../lib/services/auth';
import { supabase } from '../lib/supabase';
import { t } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';


const isTestMode = false;

const initialState = {
  inputValues: {
    email: isTestMode ? 'example@gmail.com' : '',
    password: isTestMode ? '**********' : '',
  },
  inputValidities: {
    email: false,
    password: false
  },
  formIsValid: false,
}


const Login = ({ navigation }) => {
  const [formState, dispatchFormState] = useReducer(reducer, initialState);
  const [error, setError] = useState(null);
  const [isChecked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { colors, dark } = useTheme();
  const { refreshProfileStatus } = useAuth();

  const inputChangedHandler = useCallback(
    (inputId, inputValue) => {
      const result = validateInput(inputId, inputValue)
      dispatchFormState({ inputId, validationResult: result, inputValue })
    },
    [dispatchFormState]
  );

  useEffect(() => {
    if (error) {
      Alert.alert(t('common.error'), error)
    }
  }, [error]);

  // Handle login with Supabase
  const handleLogin = async () => {
    const { email, password } = formState.inputValues;
    
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.please_fill_all_fields'))
      return
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        Alert.alert(t('auth.sign_in_failed'), error.message)
        setIsLoading(false);
      } else if (data?.session) {
        console.log('✅ Login successful, checking profile...');
        
        // Keep loading state active while checking profile
        // Check profile completion directly here
        const { data: profile } = await supabase
          .from('users')
          .select('id, first_name, phone')
          .eq('id', data.session.user.id)
          .single();
        
        const hasProfile = profile && profile.first_name && profile.phone;
        
        console.log('📊 Profile check:', { hasProfile, profile });
        
        // Now we know where to navigate
        // The AuthContext will update and AppNavigation will handle it
        // But we stay on loading until navigation happens
        
        // Small delay to ensure auth context updates
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      }
    } catch (err) {
      Alert.alert(t('common.error'), err.message)
      setIsLoading(false);
    }
  };

  // implementing apple authentication
  const appleAuthHandler = () => {
    console.log("Apple Authentication")
  };

  // implementing facebook authentication
  const facebookAuthHandler = () => {
    console.log("Facebook Authentication")
  };

  // Implementing google authentication
  const googleAuthHandler = async () => {
    console.log('🟡 Google authentication started');
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const { data, error } = await signInWithGoogle();
      if (error) throw error;
      
      // Check if we have a valid session
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        console.log('✅ Google login successful, checking profile...');
        
        // Check profile completion directly
        const { data: profile } = await supabase
          .from('users')
          .select('id, first_name, phone')
          .eq('id', sessionData.session.user.id)
          .single();
        
        const hasProfile = profile && profile.first_name && profile.phone;
        
        console.log('📊 Google profile check:', { hasProfile, profile });
        
        // Keep loading until navigation happens
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      } else {
        Alert.alert(t('auth.login_error'), t('auth.authentication_no_session'));
        setIsLoading(false);
      }
    } catch (error) {
      Alert.alert(t('common.error'), error.message);
      setIsLoading(false);
    }
  };
  return (
    <SafeAreaView style={[styles.area, {
      backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={[styles.container, {
          backgroundColor: colors.background
        }]}>
          <Header showBackButton={false} />
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.logoContainer}>
              <Image
                source={images.logo}
                resizeMode='contain'
                style={styles.logo}
              />
            </View>
            <Text style={[styles.title, {
              color: dark ? COLORS.white : COLORS.black
            }]}>{t('auth.login_title')}</Text>
            <Input
              id="email"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['email']}
              placeholder={t('auth.email')}
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              icon={icons.email}
              keyboardType="email-address"
            />
            <Input
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['password']}
              autoCapitalize="none"
              id="password"
              placeholder={t('auth.password')}
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              icon={icons.padlock}
              secureTextEntry={true}
            />
            <View style={styles.checkBoxContainer}>
              <View style={{ flexDirection: 'row' }}>
                <Checkbox
                  style={styles.checkbox}
                  value={isChecked}
                  color={isChecked ? COLORS.primary : dark ? COLORS.primary : "gray"}
                  onValueChange={setChecked}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.privacy, {
                    color: dark ? COLORS.white : COLORS.black
                  }]}>{t('auth.remember_me')}</Text>
                </View>
              </View>
            </View>
            <Button
              title={t('auth.login')}
              filled
              onPress={handleLogin}
              style={styles.button}
              isLoading={isLoading}
            />
            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPasswordMethods")}>
              <Text style={styles.forgotPasswordBtnText}>{t('auth.forgot_password')}</Text>
            </TouchableOpacity>
            <View>

              <OrSeparator text={t('common.or_continue_with')} />
              <View style={styles.socialBtnContainer}>
                
                <SocialButton
                  icon={icons.google}
                  onPress={googleAuthHandler}
                />
              </View>
            </View>
          </ScrollView>
          <View style={styles.bottomContainer}>
            <Text style={[styles.bottomLeft, {
              color: dark ? COLORS.white : COLORS.black
            }]}>{t('auth.dont_have_account')}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.bottomRight}>{"  "}{t('auth.sign_up')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    padding: 16,
    backgroundColor: COLORS.white
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100 // Add space at bottom for the fixed bottom container
  },
  logo: {
    width: 100,
    height: 100,
    tintColor: COLORS.primary
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 32
  },
  title: {
    fontSize: 28,
    fontFamily: "bold",
    color: COLORS.black,
    textAlign: "center"
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: "semiBold",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 22
  },
  checkBoxContainer: {
    flexDirection: "row",
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 18,
  },
  checkbox: {
    marginRight: 8,
    height: 16,
    width: 16,
    borderRadius: 4,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  privacy: {
    fontSize: 12,
    fontFamily: "regular",
    color: COLORS.black,
  },
  socialTitle: {
    fontSize: 19.25,
    fontFamily: "medium",
    color: COLORS.black,
    textAlign: "center",
    marginVertical: 26
  },
  socialBtnContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomLeft: {
    fontSize: 14,
    fontFamily: "regular",
    color: "black"
  },
  bottomRight: {
    fontSize: 16,
    fontFamily: "medium",
    color: COLORS.primary
  },
  button: {
    marginVertical: 6,
    width: SIZES.width - 32,
    borderRadius: 30
  },
  forgotPasswordBtnText: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: COLORS.primary,
    textAlign: "center",
    marginTop: 12
  }
})

export default Login