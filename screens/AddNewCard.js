import { View, Text, StyleSheet, Alert } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useReducer, useCallback, useEffect } from 'react';
import { commonStyles } from '../styles/CommonStyles';
import { COLORS, SIZES } from '../constants';
import Input from '../components/Input';
import { validateInput } from '../utils/actions/formActions';
import { reducer } from '../utils/reducers/formReducers';
import Button from '../components/Button';
import Header from '../components/Header';
import Card from '../components/Card';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../context/LanguageContext';

const initialState = {
  inputValues: {
    creditCardHolderName: '',
    creditCardNumber: '',
    creditCardExpiryDate: '',
    cvv: ''
  },
  inputValidities: {
    creditCardHolderName: false,
    creditCardNumber: false,
    creditCardExpiryDate: false,
    cvv: false
  },
  formIsValid: false,
}

const AddNewCard = ({ navigation }) => {
  const [error, setError] = useState(null);
  const [formState, dispatchFormState] = useReducer(reducer, initialState);
  const { colors, dark } = useTheme();

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

  const renderPaymentForm = () => {
    return (
      <View style={{ marginVertical: 22 }}>
        <Card
          containerStyle={styles.card}
          number="•••• •••• •••• ••••"
          balance="10000"
          date="11/2029"
        />
        <View style={{ marginTop: 12 }}>
          <Text style={[commonStyles.inputHeader, {
            color: dark ? COLORS.white : COLORS.black
          }]}>{t('payment.cardholder_name')}</Text>
          <Input
            id="creditCardHolderName"
            onInputChanged={inputChangedHandler}
            errorText={formState.inputValidities['creditCardHolderName']}
            placeholder={t('payment.cardholder_name_placeholder')}
            placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
          />
        </View>
        <View style={{ marginTop: 12 }}>
          <Text style={[commonStyles.inputHeader, {
            color: dark ? COLORS.white : COLORS.black
          }]}>{t('payment.card_number')}</Text>
          <Input
            id="creditCardNumber"
            onInputChanged={inputChangedHandler}
            errorText={formState.inputValidities['creditCardNumber']}
            placeholder={t('payment.card_number_placeholder')}
            placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <View style={{ width: (SIZES.width - 32) / 2 - 10 }}>
            <Text style={[commonStyles.inputHeader, {
              color: dark ? COLORS.white : COLORS.black
            }]}>{t('payment.expiry_date')}</Text>
            <Input
              id="creditCardExpiryDate"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['creditCardExpiryDate']}
              placeholder={t('payment.expiry_date_placeholder')}
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
            />
          </View>
          <View style={{ width: (SIZES.width - 32) / 2 - 10 }}>
            <Text style={[commonStyles.inputHeader, {
              color: dark ? COLORS.white : COLORS.black
            }]}>{t('payment.cvv')}</Text>
            <Input
              id="cvv"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['cvv']}
              placeholder={t('payment.cvv_placeholder')}
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
            />
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, margin: 16 }}>
        <Header title={t('settings.payment.add_new_card')}/>

        {renderPaymentForm()}
        <View 
          style={{
            position: 'absolute',
            bottom: 0,
            width: SIZES.width - 32
          }}>
          <Button
            filled
            title={t('settings.payment.add_new_card')}
            onPress={() => navigation.goBack()}
            style={styles.addBtn}
          />
        </View>
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  card: {
    width: SIZES.width - 32,
    borderRadius: 16,
    marginVertical: 6
  },
  addBtn: {
    borderRadius: 32
  }
})

export default AddNewCard