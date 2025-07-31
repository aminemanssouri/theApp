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
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      occupation: true,
      address: true,
      city: true,
      zipCode: true
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

  const today = new Date();
  const startDate = new Date(today.setDate(today.getDate() - 36500)).toISOString().split('T')[0]; // Allow dates up to 100 years ago in YYYY-MM-DD format

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
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: "center", marginVertical: 12 }}>
            <View style={styles.avatarContainer}>
              <Image
                source={image === null ? images.user1 : image}
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
              placeholder="First Name"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              initialValue={formState.inputValues.firstName}
            />
            <Input
              id="lastName"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['lastName']}
              placeholder="Last Name"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              initialValue={formState.inputValues.lastName}
            />
            <Input
              id="email"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['email']}
              placeholder="Email"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              keyboardType="email-address"
              initialValue={formState.inputValues.email}
              editable={false} // Email should not be editable from profile
            />
            
            {/* Date of Birth Section */}
            <View style={{
              width: SIZES.width - 32,
              marginTop: 8
            }}>
              <TouchableOpacity
                style={[styles.inputBtn, {
                  backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                  borderColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                }]}
                onPress={handleOnPressStartDate}
              >
                <Text style={{ ...FONTS.body4, color: dark ? COLORS.white : COLORS.grayscale400 }}>
                  {startedDate === "Select Date of Birth" ? "Date of Birth (Optional)" : startedDate}
                </Text>
                <Feather name="calendar" size={24} color={dark ? COLORS.white : COLORS.grayscale400} />
              </TouchableOpacity>
            </View>
            
            {/* Phone Number Section */}
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
                    style={[styles.downIcon, { tintColor: dark ? COLORS.white : "#111" }]}
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
                placeholder="Enter your phone number"
                placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
                selectionColor="#111"
                keyboardType="numeric"
                value={formState.inputValues.phoneNumber}
                onChangeText={(text) => inputChangedHandler('phoneNumber', text)}
              />
            </View>
            
            {/* Address Section */}
            <Input
              id="address"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['address']}
              placeholder="Address (Optional)"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              initialValue={formState.inputValues.address}
            />
            <Input
              id="city"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['city']}
              placeholder="City (Optional)"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              initialValue={formState.inputValues.city}
            />
            <Input
              id="zipCode"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['zipCode']}
              placeholder="ZIP Code (Optional)"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              initialValue={formState.inputValues.zipCode}
            />
            <Input
              id="occupation"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['occupation']}
              placeholder="Occupation (Optional)"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
              initialValue={formState.inputValues.occupation}
            />
          </View>
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
    borderRadius: 6,
    height: 52,
    width: SIZES.width - 32,
    alignItems: 'center',
    marginVertical: 8, // Increased from 2 to 8 for better spacing
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
    height: 50,
    paddingLeft: 8,
    fontSize: 18,
    justifyContent: "space-between",
    marginTop: 8, // Increased from 2 to 8
    marginBottom: 8, // Increased from 2 to 8
    backgroundColor: COLORS.greyscale500,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  bottomContainer: {
    position: "absolute",
    bottom: 32,
    right: 16,
    left: 16,
    flexDirection: "row",
    justifyContent: "space-between", // Back to original
    width: SIZES.width - 32,
    alignItems: "center"
  },
  continueButton: {
    width: SIZES.width - 32, // Back to full width
    borderRadius: 32, // Back to original
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  genderContainer: {
    flexDirection: "row",
    borderColor: COLORS.greyscale500,
    borderWidth: .4,
    borderRadius: 6,
    height: 58,
    width: SIZES.width - 32,
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: COLORS.greyscale500,
  }
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