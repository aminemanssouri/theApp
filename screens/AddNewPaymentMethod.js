import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useReducer, useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { commonStyles } from '../styles/CommonStyles';
import { COLORS, SIZES, icons } from '../constants';
import Input from '../components/Input';
import { validateInput } from '../utils/actions/formActions';
import { reducer } from '../utils/reducers/formReducers';
import Button from '../components/Button';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../context/LanguageContext';

const initialState = {
    inputValues: {
        creditCardHolderName: '',
        creditCardNumber: '',
        creditCardExpiryDate: '',
        cvv: '',
    },
    inputValidities: {
        creditCardHolderName: false,
        creditCardNumber: false,
        creditCardExpiryDate: false,
        cvv: false,
    },
    formIsValid: false,
}

const AddNewPaymentMethod = ({ navigation }) => {
    const [error, setError] = useState(null)
    const [formState, dispatchFormState] = useReducer(reducer, initialState);
    const { colors, dark } = useTheme();

    const inputChangedHandler = useCallback(
        (inputId, inputValue) => {
            const result = validateInput(inputId, inputValue)
            dispatchFormState({ inputId, validationResult: result, inputValue })
        },
        [dispatchFormState]
    )

    useEffect(() => {
        if (error) {
            Alert.alert(t('common.error'), error)
        }
    }, [error])
    const renderHeader = () => {
        const navigation = useNavigation()

        return (
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}>
                    <Image
                        resizeMode="contain"
                        source={icons.arrowBack}
                        style={[styles.headerIcon, { 
                            tintColor: dark? COLORS.white : COLORS.greyscale900
                        }]}
                    />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { 
                    color: dark? COLORS.white : COLORS.greyscale900
                }]}>{t('settings.payment.add_new_card')}</Text>
            </View>
        )
    }

    const renderPaymentForm = () => {
        return (
            <View style={{ marginVertical: 22 }}>
                <View style={{ marginTop: 12 }}>
                    <Text style={[commonStyles.inputHeader, { 
                        color: dark? COLORS.white : COLORS.greyscale900
                    }]}>
                        {t('payment.cardholder_name')}
                    </Text>
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
                        color: dark? COLORS.white : COLORS.greyscale900
                    }]}>{t('payment.card_number')}</Text>
                    <Input
                        id="creditCardNumber"
                        onInputChanged={inputChangedHandler}
                        errorText={formState.inputValidities['creditCardNumber']}
                        placeholder={t('payment.card_number_placeholder')}
                        placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
                    />
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: 12,
                    }}>
                    <View style={{ width: (SIZES.width - 32) / 2 - 10 }}>
                        <Text style={[commonStyles.inputHeader, { 
                            color: dark? COLORS.white : COLORS.greyscale900
                        }]}>
                            {t('payment.expiry_date')}
                        </Text>
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
                            color: dark? COLORS.white : COLORS.greyscale900
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
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <StatusBar hidden={true} />
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {renderHeader()}
                {renderPaymentForm()}
                <View
                    style={styles.bottomContainer}>
                    <Button
                        filled
                        title={t('settings.payment.add_new_card')}
                        style={{ borderRadius: 30 }}
                        onPress={() => navigation.navigate('AddNewPaymentMethodDeclined')}
                    />
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
        marginHorizontal: 16
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 30,
        width: SIZES.width - 32,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
    },
    headerIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.black,
    },
    headerTitle: {
        marginLeft: 12,
        fontSize: 17,
        fontFamily: 'bold',
    }
})

export default AddNewPaymentMethod