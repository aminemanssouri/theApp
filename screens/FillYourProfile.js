import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, Modal, TouchableWithoutFeedback, FlatList, TextInput } from 'react-native';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { COLORS, SIZES, FONTS, icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { reducer } from '../utils/reducers/formReducers';
import { validateInput } from '../utils/actions/formActions';
import { MaterialCommunityIcons, Feather, Ionicons } from "@expo/vector-icons";
import { launchImagePicker } from '../utils/ImagePickerHelper';
import Input from '../components/Input';
import { getFormatedDate } from "react-native-modern-datepicker";
import DatePickerModal from '../components/DatePickerModal';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useI18n } from '../context/LanguageContext';

const isTestMode = false;

const initialState = {
  inputValues: {
    firstName: isTestMode ? 'John' : '',
    lastName: isTestMode ? 'Doe' : '',
    nickname: isTestMode ? 'John' : '',
    email: isTestMode ? 'john@example.com' : '',
    phoneNumber: isTestMode ? '1234567890' : '',
    address: isTestMode ? '123 Main St' : '',
    city: isTestMode ? 'New York' : '',
    zipCode: isTestMode ? '10001' : '',
  },
  inputValidities: {
    firstName: false,
    lastName: false,
    nickname: false,
    email: false,
    phoneNumber: false,
    address: false,
    city: false,
    zipCode: false,
  },
  formIsValid: false,
}

const FillYourProfile = ({ navigation, route }) => {
  const [image, setImage] = useState(null);
  const [error, setError] = useState();
  const [formState, dispatchFormState] = useReducer(reducer, initialState);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [openStartDatePicker, setOpenStartDatePicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [email, setEmail] = useState(''); // Add this state
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { colors, dark } = useTheme();
  const { user, setProfileComplete, setProfileCompleteWithSkip, refreshUserProfile } = useAuth();
  const { t } = useI18n();

  // Get user data from route params (if coming from Google OAuth)
  const userId = route?.params?.userId || user?.id;
  const userEmail = route?.params?.email || user?.email;

  const today = new Date();
  const startDate = getFormatedDate(
    new Date(today.setDate(today.getDate() + 1)),
    "YYYY/MM/DD"
  );

  const [startedDate, setStartedDate] = useState("12/12/2023");

  const handleOnPressStartDate = () => {
    setOpenStartDatePicker(!openStartDatePicker);
  };

  const inputChangedHandler = useCallback(
    (inputId, inputValue) => {
      const result = validateInput(inputId, inputValue)
      dispatchFormState({ inputId, validationResult: result, inputValue })
    },
    [dispatchFormState]
  )

  useEffect(() => {
    if (error) {
      Alert.alert('An error occured', error)
    }
  }, [error])

  // Initialize email state with userEmail
  useEffect(() => {
    if (userEmail) {
      setEmail(userEmail);
      // Also update the form state
      inputChangedHandler('email', userEmail);
    }
  }, [userEmail]);

  // Load existing user data if available
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (data) {
          // Pre-fill form with existing data
          if (data.first_name) {
            setFirstName(data.first_name);
            inputChangedHandler('firstName', data.first_name);
          }
          if (data.last_name) {
            setLastName(data.last_name);
            inputChangedHandler('lastName', data.last_name);
          }
          if (data.email) {
            setEmail(data.email); // Set email state
            inputChangedHandler('email', data.email);
          }
          if (data.phone) {
            setPhoneNumber(data.phone);
          }
          if (data.address) {
            setAddress(data.address);
          }
          if (data.city) {
            setCity(data.city);
          }
          if (data.zip_code) {
            setZipCode(data.zip_code);
          }
          if (data.profile_picture) {
            setImage({ uri: data.profile_picture });
          }
          if (data.date_of_birth) {
            const date = new Date(data.date_of_birth);
            setStartedDate(getFormatedDate(date, "MM/DD/YYYY"));
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, [userId]);

  const pickImage = async () => {
    try {
      const tempUri = await launchImagePicker()

      if (!tempUri) return

      // set the image
      setImage({ uri: tempUri })
    } catch (error) { }
  };

  // Upload image to Supabase Storage
  const uploadImage = async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const fileExt = imageUri.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `profile-images/profiles/${fileName}`;

      const { data, error } = await supabase.storage
        .from('profiles') // Your bucket name
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  // Save profile data to database
  const handleSaveProfile = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    // Get first and last name from form state
    const firstName = formState.inputValues.firstName?.trim() || '';
    const lastName = formState.inputValues.lastName?.trim() || '';

    // Validate required fields
    if (!firstName || !phoneNumber) {
      Alert.alert('Required Fields', 'Please fill in your first name and phone number');
      return;
    }

    setIsLoading(true);

    try {
      // Upload image if selected
      let profilePictureUrl = null;
      if (image && image.uri && !image.uri.startsWith('http')) {
        profilePictureUrl = await uploadImage(image.uri);
      } else if (image && image.uri && image.uri.startsWith('http')) {
        profilePictureUrl = image.uri;
      }

      // Format phone number with country code
      const formattedPhone = selectedArea ? 
        `${selectedArea.callingCode}${phoneNumber}` : 
        phoneNumber;

      // Format date of birth
      const dateOfBirth = startedDate !== "12/12/2023" ? 
        new Date(startedDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2')) : 
        null;

      // Prepare user data matching the database schema
      const userData = {
        id: userId, // Important: use the auth user ID
        first_name: firstName,
        last_name: lastName,
        email: email || userEmail || formState.inputValues.email, // Use email state
        phone: formattedPhone,
        address: address || null,
        city: city || null,
        zip_code: zipCode || null,
        profile_picture: profilePictureUrl,
        date_of_birth: dateOfBirth,
        updated_at: new Date().toISOString()
      };

      console.log('Saving user profile:', userData);

      // Check if user record exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      let result;
      if (existingUser) {
        // Update existing record
        result = await supabase
          .from('users')
          .update(userData)
          .eq('id', userId);
      } else {
        // Insert new record
        result = await supabase
          .from('users')
          .insert([userData]);
      }

      if (result.error) throw result.error;

      console.log('Profile saved successfully');
      
      // Refresh user profile in context
      if (refreshUserProfile) {
        await refreshUserProfile();
      }
      
      // Mark profile as complete
      setProfileComplete(true);
      
      Alert.alert(
        'Success',
        'Your profile has been updated successfully!',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigation will happen automatically due to AppNavigation logic
              // but we can force it if needed
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(t('common.error'), t('profile.save_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Skip button
  const handleSkip = async () => {
    setIsLoading(true);
    try {
      // Create minimal user record with email only
      if (userId && userEmail) {
        const { error } = await supabase
          .from('users')
          .upsert([{
            id: userId,
            email: userEmail,
            updated_at: new Date().toISOString()
          }], {
            onConflict: 'id'
          });
        
        if (error) {
          console.error('Error creating user record:', error);
        }
      }
      
      // Mark profile as complete with skip flag
      await setProfileCompleteWithSkip(true, userId);
      
      console.log('✅ Profile skipped - navigation will handle automatically');
      
      // Don't manually navigate - let AppNavigation handle it automatically
      // The state change will trigger navigation re-render with Main screen
    } catch (error) {
      console.error('Error skipping profile:', error);
      // Even on error, mark as skipped to allow access
      await setProfileCompleteWithSkip(true, userId);
    } finally {
      setIsLoading(false);
    }
  };

  // fectch codes from rescountries api
  useEffect(() => {
    fetch("https://restcountries.com/v2/all")
      .then(response => response.json())
      .then(data => {
        let areaData = data.map((item) => {
          return {
            code: item.alpha2Code,
            item: item.name,
            callingCode: `+${item.callingCodes[0]}`,
            flag: `https://flagsapi.com/${item.alpha2Code}/flat/64.png`
          }
        });

        setAreas(areaData);
        if (areaData.length > 0) {
          let defaultData = areaData.filter((a) => a.code == "IT"); // Default to Italy for your app

          if (defaultData.length > 0) {
            setSelectedArea(defaultData[0])
          }
        }
      })
  }, [])

  // render countries codes modal
  function RenderAreasCodesModal() {

    const renderItem = ({ item }) => {
      return (
        <TouchableOpacity
          style={{
            padding: 10,
            flexDirection: "row"
          }}
          onPress={() => {
            setSelectedArea(item),
              setModalVisible(false)
          }}>
          <Image
            source={{ uri: item.flag }}
            contentFit='contain'
            style={{
              height: 30,
              width: 30,
              marginRight: 10
            }}
          />
          <Text style={{ fontSize: 16, color: "#fff" }}>{item.item}</Text>
        </TouchableOpacity>
      )
    }
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}>
        <TouchableWithoutFeedback
          onPress={() => setModalVisible(false)}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <View
              style={{
                height: SIZES.height,
                width: SIZES.width,
                backgroundColor: COLORS.primary,
                borderRadius: 12
              }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}>
                <Ionicons name="close-outline" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <FlatList
                data={areas}
                renderItem={renderItem}
                horizontal={false}
                keyExtractor={(item) => item.code}
                style={{
                  padding: 20,
                  marginBottom: 20
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title={t('profile.fill_your_profile')} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: "center", marginVertical: 12 }}>
            <View style={styles.avatarContainer}>
              <Image
                source={image === null ? icons.userDefault2 : image}
                resizeMode="cover"
                style={styles.avatar} />
              <TouchableOpacity
                onPress={pickImage}
                style={styles.pickImage}>
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={24}
                  color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
          <View>
            <Input
              id="firstName"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['firstName']}
              placeholder={t('profile.first_name')}
              placeholderTextColor={COLORS.gray}
              initialValue={firstName}
            />
            <Input
              id="lastName"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['lastName']}
              placeholder={t('profile.last_name')}
              placeholderTextColor={COLORS.gray}
              initialValue={lastName}
            />
            
            {/* Replace the Input component with TextInput for email */}
            <TextInput
              style={[styles.emailInput, {
                backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                borderColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                color: dark ? COLORS.white : "#111"
              }]}
              placeholder={t('profile.email')}
              placeholderTextColor={COLORS.gray}
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                inputChangedHandler('email', text);
              }}
              editable={!userEmail} // Only editable if no email from auth
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <View style={{
              width: SIZES.width - 32
            }}>
              <TouchableOpacity
                style={[styles.inputBtn, {
                  backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                  borderColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                }]}
                onPress={handleOnPressStartDate}>
                <Text style={{ ...FONTS.body4, color: COLORS.grayscale400 }}>
                  {startedDate === "12/12/2023" ? t('profile.date_of_birth') : startedDate}
                </Text>
                <Feather name="calendar" size={24} color={COLORS.grayscale400} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.inputContainer, {
              backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
              borderColor: dark ? COLORS.dark2 : COLORS.greyscale500,
            }]}>
              <TouchableOpacity
                style={styles.selectFlagContainer}
                onPress={() => setModalVisible(true)}>
                <View style={{ justifyContent: "center" }}>
                  <Image
                    source={icons.down}
                    resizeMode='contain'
                    style={styles.downIcon}
                  />
                </View>
                <View style={{ justifyContent: "center", marginLeft: 5 }}>
                  <Image
                    source={{ uri: selectedArea?.flag }}
                    contentFit="contain"
                    style={styles.flagIcon}
                  />
                </View>
                <View style={{ justifyContent: "center", marginLeft: 5 }}>
                  <Text style={{ color: dark ? COLORS.white : "#111", fontSize: 12 }}>{selectedArea?.callingCode}</Text>
                </View>
              </TouchableOpacity>
              {/* Phone Number Text Input */}
              <TextInput
                style={[styles.input, { color: dark ? COLORS.white : "#111" }]}
                placeholder={t('profile.phone_number')}
                placeholderTextColor={COLORS.gray}
                selectionColor="#111"
                keyboardType="numeric"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>
            
            {/* Additional fields for address */}
            <TextInput
              style={[styles.addressInput, {
                backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                borderColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                color: dark ? COLORS.white : "#111"
              }]}
              placeholder={t('profile.address')}
              placeholderTextColor={COLORS.gray}
              value={address}
              onChangeText={setAddress}
            />
            
            <View style={styles.rowContainer}>
              <TextInput
                style={[styles.halfInput, {
                  backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                  borderColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                  color: dark ? COLORS.white : "#111"
                }]}
                placeholder={t('profile.city')}
                placeholderTextColor={COLORS.gray}
                value={city}
                onChangeText={setCity}
              />
              
              <TextInput
                style={[styles.halfInput, {
                  backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                  borderColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                  color: dark ? COLORS.white : "#111"
                }]}
                placeholder={t('profile.zip_code')}
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
                value={zipCode}
                onChangeText={setZipCode}
              />
            </View>
          </View>
        </ScrollView>
      </View>
      <DatePickerModal
        open={openStartDatePicker}
        startDate={startDate}
        selectedDate={startedDate}
        onClose={() => setOpenStartDatePicker(false)}
        onChangeStartDate={(date) => setStartedDate(date)}
      />
      {RenderAreasCodesModal()}
      <View style={styles.bottomContainer}>
        <Button
          title={t('common.skip')}
          style={{
            width: (SIZES.width - 32) / 2 - 8,
            borderRadius: 32,
            backgroundColor: dark ? COLORS.dark3 : COLORS.tansparentPrimary,
            borderColor: dark ? COLORS.dark3 : COLORS.tansparentPrimary
          }}
          textColor={dark ? COLORS.white : COLORS.primary}
          onPress={handleSkip}
          disabled={isLoading}
        />
        <Button
          title={isLoading ? t('profile.saving') : t('common.continue')}
          filled
          style={styles.continueButton}
          onPress={handleSaveProfile}
          disabled={isLoading}
        />
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
  avatarContainer: {
    marginVertical: 12,
    alignItems: "center",
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  avatar: {
    height: 130,
    width: 130,
    borderRadius: 65,
  },
  pickImage: {
    height: 42,
    width: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  inputContainer: {
    flexDirection: "row",
    borderColor: COLORS.greyscale500,
    borderWidth: .4,
    borderRadius: 12,
    height: 52,
    width: SIZES.width - 32,
    alignItems: 'center',
    marginVertical: 12,
    backgroundColor: COLORS.greyscale500,
  },
  downIcon: {
    width: 10,
    height: 10,
    tintColor: "#111"
  },
  selectFlagContainer: {
    width: 90,
    height: 50,
    marginHorizontal: 5,
    flexDirection: "row",
  },
  flagIcon: {
    width: 30,
    height: 30
  },
  input: {
    flex: 1,
    marginVertical: 10,
    height: 40,
    fontSize: 14,
    color: "#111"
  },
  inputBtn: {
    borderWidth: 1,
    borderRadius: 12,
    borderColor: COLORS.greyscale500,
    height: 52,
    paddingLeft: 8,
    fontSize: 18,
    justifyContent: "space-between",
    marginTop: 4,
    backgroundColor: COLORS.greyscale500,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8
  },
  addressInput: {
    borderWidth: 1,
    borderRadius: 12,
    borderColor: COLORS.greyscale500,
    height: 52,
    paddingHorizontal: 12,
    fontSize: 14,
    marginVertical: 6,
    backgroundColor: COLORS.greyscale500,
    width: SIZES.width - 32,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  halfInput: {
    borderWidth: 1,
    borderRadius: 12,
    borderColor: COLORS.greyscale500,
    height: 52,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: COLORS.greyscale500,
    width: (SIZES.width - 40) / 2,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 32,
    right: 16,
    left: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    width: SIZES.width - 32,
    alignItems: "center"
  },
  continueButton: {
    width: (SIZES.width - 32) / 2 - 8,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    position: "absolute",
    right: 16,
    top: 32,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  },
  emailInput: {
    borderWidth: 1,
    borderRadius: 12,
    borderColor: COLORS.greyscale500,
    height: 52,
    paddingHorizontal: 12,
    fontSize: 14,
    marginVertical: 6,
    backgroundColor: COLORS.greyscale500,
    width: SIZES.width - 32,
  },
})

export default FillYourProfile