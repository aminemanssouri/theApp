import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, Modal, TouchableWithoutFeedback, FlatList, TextInput } from 'react-native';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { COLORS, SIZES, FONTS, icons, images } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { reducer } from '../utils/reducers/formReducers';
import { validateInput } from '../utils/actions/formActions';
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { launchImagePicker } from '../utils/ImagePickerHelper';
import Input from '../components/Input';
import { getFormatedDate } from "react-native-modern-datepicker";
import DatePickerModal from '../components/DatePickerModal';
import Button from '../components/Button';
import RNPickerSelect from 'react-native-picker-select';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../lib/services/auth';
import { supabase } from '../lib/supabase';

// Storage bucket name for profile avatars. Ensure this bucket exists in Supabase Storage.
const AVATAR_BUCKET = 'profile-images';

const EditProfile = ({ navigation }) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [image, setImage] = useState(null);
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [openStartDatePicker, setOpenStartDatePicker] = useState(false);
  const [selectedGender, setSelectedGender] = useState('');
  const { colors, dark } = useTheme();

  // Initialize form state with user data
  const getInitialState = () => ({
    inputValues: {
      firstName: userProfile?.first_name || '',
      lastName: userProfile?.last_name || '',
      email: user?.email || '',
      phoneNumber: userProfile?.phone || '',
      occupation: userProfile?.occupation || '',
      address: userProfile?.address || '',
      city: userProfile?.city || '',
      zipCode: userProfile?.zip_code || ''
    },
    inputValidities: {
      firstName: undefined,
      lastName: undefined,
      email: undefined,
      phoneNumber: undefined,
      occupation: undefined,
      address: undefined,
      city: undefined,
      zipCode: undefined
    },
    formIsValid: true,
  });

  const [formState, dispatchFormState] = useReducer(reducer, getInitialState());

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  const handleGenderChange = (value) => {
    setSelectedGender(value);
  };

  // Upload selected image to Supabase Storage and return public URL
  const uploadProfileImageIfNeeded = async () => {
    try {
      // If no new image picked, keep existing URL
      if (!image?.uri) {
        return userProfile?.profile_picture || null;
      }

      // Derive file extension from uri if possible
      const extMatch = image.uri.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
      const ext = (extMatch && extMatch[1]) ? extMatch[1].toLowerCase() : 'jpg';
      const filePath = `profiles/${user.id}-${Date.now()}.${ext}`;

      // Get file data as ArrayBuffer and convert to Blob for RN compatibility
      const resp = await fetch(image.uri);
      if (!resp.ok) {
        throw new Error(`Failed to read image (status ${resp.status})`);
      }
      const arrayBuffer = await resp.arrayBuffer();
      const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      // Upload to bucket (make sure it exists and is public or has proper policies)
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, arrayBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Image Upload Failed', uploadError.message || 'Could not upload profile image.');
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath);

      return publicUrlData?.publicUrl || null;
    } catch (e) {
      console.error('Failed to upload profile image:', e);
      Alert.alert('Image Upload Error', e.message || 'Failed to upload profile image.');
      // Do not block profile update if image upload fails; return previous value
      return userProfile?.profile_picture || null;
    }
  };

  const today = new Date();
  const startDate = new Date(today.setDate(today.getDate() - 36500)).toISOString().split('T')[0];

  const [startedDate, setStartedDate] = useState(
    userProfile?.date_of_birth 
      ? getFormatedDate(new Date(userProfile.date_of_birth), "DD/MM/YYYY")
      : "Select Date of Birth"
  );

  const handleOnPressStartDate = () => {
    setOpenStartDatePicker(!openStartDatePicker);
  };

  const handleDateChange = (date) => {
    setStartedDate(date);
    setOpenStartDatePicker(false);
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
      Alert.alert('An error occurred', error)
    }
  }, [error])

  const pickImage = async () => {
    try {
      const tempUri = await launchImagePicker()

      if (!tempUri) return

      // set the image
      setImage({ uri: tempUri })
    } catch (error) { }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!formState.formIsValid) {
      Alert.alert('Validation Error', 'Please check your input fields');
      return;
    }

    setLoading(true);
    try {
      // Upload image if any, and get URL
      const profilePictureUrl = await uploadProfileImageIfNeeded();

      // Parse date of birth
      const dateOfBirth = startedDate !== "Select Date of Birth" 
        ? new Date(startedDate.split('/').reverse().join('-')).toISOString()
        : null;

      // Prepare update data
      const updateData = {
        first_name: formState.inputValues.firstName,
        last_name: formState.inputValues.lastName,
        email: formState.inputValues.email,
        phone: formState.inputValues.phoneNumber,
        date_of_birth: dateOfBirth,
        address: formState.inputValues.address,
        city: formState.inputValues.city,
        zip_code: formState.inputValues.zipCode,
        profile_picture: profilePictureUrl,
        updated_at: new Date().toISOString()
      };

      // Update user profile in database
      const { data, error } = await updateUserProfile(user.id, updateData);

      if (error) {
        throw error;
      }

      // Refresh user profile data
      await refreshUserProfile();

      Alert.alert(
        'Success', 
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Update Failed', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
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
          let defaultData = areaData.filter((a) => a.code == "US");

          if (defaultData.length > 0) {
            setSelectedArea(defaultData[0])
          }
        }
      })
  }, [])

  // Update form state when userProfile changes
  useEffect(() => {
    if (userProfile) {
      const newFormState = getInitialState();
      dispatchFormState({ 
        type: 'UPDATE_FORM', 
        inputValues: newFormState.inputValues,
        inputValidities: newFormState.inputValidities,
        formIsValid: newFormState.formIsValid
      });
      
      // Update date of birth
      if (userProfile.date_of_birth) {
        setStartedDate(getFormatedDate(new Date(userProfile.date_of_birth), "DD/MM/YYYY"));
      }
    }
  }, [userProfile]);

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
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <View
              style={{
                height: 400,
                width: SIZES.width * 0.8,
                backgroundColor: COLORS.primary,
                borderRadius: 12
              }}
            >
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
    <SafeAreaView style={[styles.area, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
        <Header title="Edit Profile" />
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={
                  image
                    ? image
                    : (userProfile?.profile_picture
                        ? { uri: userProfile.profile_picture }
                        : images.user1)
                }
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
          
          {/* Form Fields */}
          <View style={styles.formContainer}>
            <Input
              id="firstName"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['firstName']}
              placeholder="First Name"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              initialValue={formState.inputValues.firstName}
              containerStyle={styles.inputWrapper}
            />
            
            <Input
              id="lastName"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['lastName']}
              placeholder="Last Name"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              initialValue={formState.inputValues.lastName}
              containerStyle={styles.inputWrapper}
            />
            
            <Input
              id="email"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['email']}
              placeholder="Email"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              keyboardType="email-address"
              initialValue={formState.inputValues.email}
              editable={false}
              containerStyle={styles.inputWrapper}
            />
            
            {/* Date of Birth Section */}
            <TouchableOpacity
              style={[styles.datePickerBtn, {
                backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                borderColor: dark ? COLORS.dark2 : COLORS.greyscale500,
              }]}
              onPress={handleOnPressStartDate}
            >
              <Text style={[styles.datePickerText, { 
                color: startedDate === "Select Date of Birth" 
                  ? (dark ? COLORS.grayTie : COLORS.black)
                  : (dark ? COLORS.white : COLORS.black)
              }]}>
                {startedDate === "Select Date of Birth" ? "Date of Birth (Optional)" : startedDate}
              </Text>
              <Feather name="calendar" size={20} color={dark ? COLORS.white : COLORS.grayscale400} />
            </TouchableOpacity>
            
            {/* Simple Phone Number Input - No Modal */}
            <Input
              id="phoneNumber"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['phoneNumber']}
              placeholder="Phone Number (Optional)"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              keyboardType="phone-pad"
              initialValue={formState.inputValues.phoneNumber}
              containerStyle={styles.inputWrapper}
            />
            
            {/* Address Fields */}
            <Input
              id="address"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['address']}
              placeholder="Address (Optional)"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              initialValue={formState.inputValues.address}
              containerStyle={styles.inputWrapper}
            />
            
            <Input
              id="city"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['city']}
              placeholder="City (Optional)"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              initialValue={formState.inputValues.city}
              containerStyle={styles.inputWrapper}
            />
            
            <Input
              id="zipCode"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['zipCode']}
              placeholder="ZIP Code (Optional)"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              initialValue={formState.inputValues.zipCode}
              containerStyle={styles.inputWrapper}
            />
            
            <Input
              id="occupation"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['occupation']}
              placeholder="Occupation (Optional)"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              initialValue={formState.inputValues.occupation}
              containerStyle={styles.inputWrapper}
            />
          </View>
          
          {/* Add padding at bottom to prevent button overlap */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </View>
      
      <DatePickerModal
        open={openStartDatePicker}
        startDate={startDate}
        selectedDate={startedDate}
        onClose={() => setOpenStartDatePicker(false)}
        onChangeStartDate={handleDateChange}
      />
      
      {RenderAreasCodesModal()}
      
      <View style={styles.bottomContainer}>
        <Button
          title="Update"
          filled
          style={styles.continueButton}
          onPress={handleUpdateProfile}
          isLoading={loading}
        />
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white,
          paddingTop: 37,

  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,

  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  avatarContainer: {
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
  formContainer: {
    marginTop: 10,
  },
  inputWrapper: {
    marginBottom: 12, // Consistent spacing between inputs
  },
  datePickerBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  datePickerText: {
    fontSize: 14,
    fontFamily: "regular",
  },
  phoneContainer: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 10, // Add gap between country code and phone input
  },
  countryCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 100,
  },
  countryCodeText: {
    fontSize: 14,
    fontFamily: "medium",
    marginHorizontal: 6,
  },
  flagIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  downIcon: {
    width: 12,
    height: 12,
    marginLeft: 4,
  },
  phoneInput: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: "regular",
    borderWidth: 1,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 32,
    right: 16,
    left: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  continueButton: {
    width: SIZES.width - 32,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingHorizontal: 10,
    borderRadius: 4,
    color: COLORS.greyscale600,
    paddingRight: 30,
    height: 58,
    width: SIZES.width - 32,
    alignItems: 'center',
    backgroundColor: COLORS.greyscale500,
    borderRadius: 16
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    borderRadius: 8,
    color: COLORS.greyscale600,
    paddingRight: 30,
    height: 58,
    width: SIZES.width - 32,
    alignItems: 'center',
    backgroundColor: COLORS.greyscale500,
    borderRadius: 16
  },
});

export default EditProfile