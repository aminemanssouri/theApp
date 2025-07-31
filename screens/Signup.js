// Simplified Signup.js - Now using database trigger
import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
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

import { supabase } from '../lib/supabase';

const isTestMode = false; // Set to false for production

const initialState = {
  inputValues: {
    email: isTestMode ? 'test@example.com' : '',
    password: isTestMode ? 'Test123456!' : '',
    confirmPassword: isTestMode ? 'Test123456!' : '',
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
            validationResult: 'Passwords do not match', 
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
      Alert.alert('An error occurred', error)
    }
  }, [error])

  const handleSignUp = async () => {
    const email = formState.inputValues.email;
    const password = formState.inputValues.password;
    const confirmPassword = formState.inputValues.confirmPassword;

    // Validation checks
    if (!isChecked) {
      Alert.alert('Agreement Required', 'Please accept the Privacy Policy to continue.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    if (!formState.formIsValid) {
      Alert.alert('Invalid Form', 'Please check all fields and try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create user in auth.users table
      // The database trigger will automatically create the profile
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            email: email.toLowerCase().trim(),
          }
        }
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Check if user was created successfully
      if (data?.user) {
        // The trigger automatically created the profile record
        // No need to manually insert into users table
        
        if (data.session) {
          // User is fully authenticated (session exists)
          Alert.alert(
            'Account Created!',
            'Your account has been created successfully.',
            [
              {
                text: 'Continue',
                onPress: () => navigation.navigate('FillYourProfile')
              }
            ]
          );
        } else {
          // No session yet (email confirmation required)
          Alert.alert(
            'Check Your Email',
            'We\'ve sent you a confirmation email. Please verify your email, then log in to continue.',
            [
              {
                text: 'Go to Login',
                onPress: () => navigation.navigate('Login')
              }
            ]
          );
        }
      } else {
        setError('Failed to create account. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Social authentication handlers
  const appleAuthHandler = () => {
    console.log("Apple Authentication - Not implemented yet")
    Alert.alert('Coming Soon', 'Apple authentication will be available soon.');
  };

  const facebookAuthHandler = () => {
    console.log("Facebook Authentication - Not implemented yet")
    Alert.alert('Coming Soon', 'Facebook authentication will be available soon.');
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
      Alert.alert('Error', 'Failed to create account. Please try again.');
    }
  } catch (error) {
    console.error('Google auth error:', error);
    Alert.alert('Error', error.message);
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
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    
    if (emailError || passwordError || confirmPasswordError) {
      Alert.alert('Error', 'Please correct the errors in the form')
      return
    }

    if (!isChecked) {
      Alert.alert('Error', 'Please accept the Privacy Policy')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
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
        Alert.alert('Sign Up Failed', error.message)
      } else {
        Alert.alert('Success', 'Account created successfully!')
        navigation.navigate("FillYourProfile")
      }
    } catch (err) {
      setError(err.message)
      Alert.alert('Error', err.message)
    } finally {
      setIsLoading(false)
    }
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <Image
              source={images.logo}
              resizeMode='contain'
              style={styles.logo}
            />
          </View>
          <Text style={[styles.title, {
            color: dark ? COLORS.white : COLORS.black
          }]}>Create Your Account</Text>
          
          <Input
            id="email"
            onInputChanged={inputChangedHandler}
            errorText={formState.inputValidities['email']}
            placeholder="Email"
            placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
            icon={icons.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <Input
            onInputChanged={inputChangedHandler}
            errorText={formState.inputValidities['password']}
            autoCapitalize="none"
            id="password"
            placeholder="Password"
            placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
            icon={icons.padlock}
            secureTextEntry={true}
          />
          
          <Input
            onInputChanged={inputChangedHandler}
            errorText={formState.inputValidities['confirmPassword']}
            autoCapitalize="none"
            id="confirmPassword"
            placeholder="Confirm Password"
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
                }]}>By continuing you accept our Privacy Policy and Terms of Service</Text>
              </View>
            </View>
          </View>
          
          <Button
            title={isLoading ? "Creating Account..." : "Sign Up"}
            filled
            onPress={handleSignUp}
            style={styles.button}

            isLoading={isLoading}
          />
          
          <View>
            <OrSeparator text="or continue with" />
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
          }]}>Already have an account?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}>
            <Text style={styles.bottomRight}> Sign In</Text>
          </TouchableOpacity>
        </View>
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
    padding: 16,
    backgroundColor: COLORS.white
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
  socialBtnContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 18,
    position: "absolute",
    bottom: 12,
    right: 0,
    left: 0,
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

export default Signup;