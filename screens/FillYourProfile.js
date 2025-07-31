import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import Input from '../components/Input';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const initialState = {
  inputValues: {
    fullName: '',
    nickname: '',
    email: '',
    phone: '',
    date_of_birth: '',
  },
};

const FillYourProfile = ({ navigation }) => {
  const [formState, setFormState] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { colors, dark } = useTheme();
  const { user, isAuthenticated, loading } = useAuth();

  const handleInputChange = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      inputValues: {
        ...prev.inputValues,
        [field]: value,
      },
    }));
  };

  const handleProfileSubmit = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      setError(null);
      // Use user from context
      if (!user) {
        throw new Error('Could not get user information. Please try logging in again.');
      }
      const userId = user.id;
      const { fullName, nickname, email, phone, date_of_birth } = formState.inputValues;
      // Parse fullName into first and last name
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      // Update user metadata in auth.users table
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          date_of_birth: date_of_birth,
        },
      });
      if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
      }
      // Update user_profiles table
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          first_name: firstName,
          last_name: lastName || nickname,
          email: email,
          phone: phone,
          date_of_birth: date_of_birth,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });
      if (profileError) {
        throw profileError;
      }
      Alert.alert('Success', 'Profile saved successfully!');
      navigation.navigate('CreateNewPIN');
    } catch (err) {
      console.error('Profile submission error:', err);
      let errorMessage = 'An error occurred while saving your profile.';
      if (err.message && err.message.includes('relation "user_profiles" does not exist')) {
        errorMessage = 'Database setup incomplete. Please contact support.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text>You must be logged in to fill your profile.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Fill Your Profile</Text>
        <Input
          id="fullName"
          placeholder="Full Name"
          value={formState.inputValues.fullName}
          onInputChanged={(id, value) => handleInputChange('fullName', value)}
        />
        <Input
          id="nickname"
          placeholder="Nickname (optional)"
          value={formState.inputValues.nickname}
          onInputChanged={(id, value) => handleInputChange('nickname', value)}
        />
        <Input
          id="email"
          placeholder="Email"
          value={formState.inputValues.email}
          onInputChanged={(id, value) => handleInputChange('email', value)}
          keyboardType="email-address"
        />
        <Input
          id="phone"
          placeholder="Phone Number"
          value={formState.inputValues.phone}
          onInputChanged={(id, value) => handleInputChange('phone', value)}
          keyboardType="phone-pad"
        />
        <Input
          id="date_of_birth"
          placeholder="Date of Birth (YYYY-MM-DD)"
          value={formState.inputValues.date_of_birth}
          onInputChanged={(id, value) => handleInputChange('date_of_birth', value)}
        />
        <Button
          title={isLoading ? 'Saving...' : 'Save Profile'}
          filled
          onPress={handleProfileSubmit}
          disabled={isLoading}
          style={styles.button}
        />
        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'semiBold',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    borderRadius: 30,
  },
  error: {
    color: 'red',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default FillYourProfile;