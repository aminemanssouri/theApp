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
import { signUp } from '../lib/services/auth';
import { signInWithGoogle } from '../lib/services/auth';
import { supabase } from '../lib/supabase';
import { t } from '../context/LanguageContext';

const isTestMode = false;

const initialState = {
  inputValues: {
    email: isTestMode ? 'example@gmail.com' : '',
    password: isTestMode ? '**********' : '',
    confirmPassword: isTestMode ? '**********' : '',
  },
  inputValidities: {
    email: false,
    password: false,
    confirmPassword: false
  },
  formIsValid: false,
}


const Signup = ({ navigation }) => {
  const [formState, dispatchFormState] = useReducer(reducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isChecked, setChecked] = useState(false);
  const { colors, dark } = useTheme();

  const inputChangedHandler = useCallback(
    (inputId, inputValue) => {
      const result = validateInput(inputId, inputValue)
      dispatchFormState({ inputId, validationResult: result, inputValue })
      
      // Additional validation for password confirmation
      if (inputId === 'confirmPassword') {
        const passwordValue = formState.inputValues.password
        if (inputValue !== passwordValue) {
          dispatchFormState({ 
            inputId: 'confirmPassword', 
            validationResult: t('auth.passwords_do_not_match'), 
            inputValue 
          })
        }
      }
      
      // Re-validate confirm password when password changes
      if (inputId === 'password') {
        const confirmPasswordValue = formState.inputValues.confirmPassword
        if (confirmPasswordValue && inputValue !== confirmPasswordValue) {
          dispatchFormState({ 
            inputId: 'confirmPassword', 
            validationResult: 'Passwords do not match', 
            inputValue: confirmPasswordValue 
          })
        } else if (confirmPasswordValue && inputValue === confirmPasswordValue) {
          dispatchFormState({ 
            inputId: 'confirmPassword', 
            validationResult: undefined, 
            inputValue: confirmPasswordValue 
          })
        }
      }
    },
    [dispatchFormState, formState.inputValues.password, formState.inputValues.confirmPassword]
  )

  useEffect(() => {
    if (error) {
      Alert.alert(t('common.error'), error)
    }
  }, [error])

  // implementing apple authentication
  const appleAuthHandler = () => {
    console.log("Apple Authentication")
  };

  // implementing facebook authentication
  const facebookAuthHandler = () => {
    console.log("Facebook Authentication")
  };

  // Implementing google authentication
// Change this:
// To this:
const googleAuthHandler = async () => {
  setIsLoading(true);
  try {
    const { data, error } = await signInWithGoogle();
    if (error) throw error;
    
    console.log('Google Sign Up Data:', data);
    
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

  // Handle signup with Supabase
  const handleSignUp = async () => {
    // Check if all fields are filled and valid
    const { email, password, confirmPassword } = formState.inputValues
    const { email: emailError, password: passwordError, confirmPassword: confirmPasswordError } = formState.inputValidities
    
    if (!email || !password || !confirmPassword) {
      Alert.alert(t('common.error'), t('auth.please_fill_all_fields'))
      return
    }
    
    if (emailError || passwordError || confirmPasswordError) {
      Alert.alert(t('common.error'), t('auth.correct_errors_in_form'))
      return
    }

    if (!isChecked) {
      Alert.alert(t('common.error'), t('auth.accept_privacy_policy'))
      return
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwords_do_not_match'))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await signUp(
        email,
        password,
        '', // firstName - will be filled in next screen
        '', // lastName - will be filled in next screen
        'client' // userType
      )

      if (error) {
        setError(error.message)
        Alert.alert(t('auth.sign_up_failed'), error.message)
      } else {
        Alert.alert(t('common.success'), t('auth.account_created_successfully'))
        navigation.navigate("FillYourProfile")
      }
    } catch (err) {
      setError(err.message)
      Alert.alert(t('common.error'), err.message)
    } finally {
      setIsLoading(false)
    }
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Header />
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
            }]}>{t('auth.create_account_title')}</Text>
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

            <Input
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['confirmPassword']}
              autoCapitalize="none"
              id="confirmPassword"
              placeholder={t('auth.confirm_password')}
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
                  }]}>{t('auth.accept_privacy_policy_label')}</Text>
                </View>
              </View>
            </View>
            <Button
              title={t('auth.sign_up')}
              filled
              onPress={handleSignUp}
              style={styles.button}
              isLoading={isLoading}
            />
            <View>
              <OrSeparator text={t('common.or_continue_with')} />
              <View style={styles.socialBtnContainer}>
                <SocialButton
                  icon={icons.appleLogo}
                  onPress={appleAuthHandler}
                  tintColor={dark ? COLORS.white : COLORS.black}
                />
                <SocialButton
                  icon={icons.facebook}
                  onPress={facebookAuthHandler}
                />
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
            }]}>{t('auth.already_have_account')}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}>
              <Text style={styles.bottomRight}>{" "}{t('auth.sign_in')}</Text>
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
    marginTop: 0,
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
  }
})

export default Signup