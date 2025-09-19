import { View, Text, StyleSheet, ScrollView, Image, Alert,TouchableOpacity} from 'react-native';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons, images } from '../constants';
import Header from '../components/Header';
import { reducer } from '../utils/reducers/formReducers';
import { validateInput } from '../utils/actions/formActions';
import Input from '../components/Input';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../context/LanguageContext';
import { sendPasswordResetEmail } from '../lib/services/auth';

const isTestMode = false;

const initialState = {
    inputValues: {
        email: '',
    },
    inputValidities: {
        email: false
    },
    formIsValid: false,
}

const ForgotPasswordEmail = ({ navigation }) => {
    const [formState, dispatchFormState] = useReducer(reducer, initialState);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
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

    const handleSendResetEmail = async () => {
        const { email } = formState.inputValues;
        const { email: emailError } = formState.inputValidities;
        
        if (!email) {
            Alert.alert(t('common.error'), t('auth.please_enter_email'));
            return;
        }
        
        if (emailError) {
            Alert.alert(t('common.error'), t('auth.please_enter_valid_email'));
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            const { data, error } = await sendPasswordResetEmail(email);
            
            if (error) {
                setError(error.message);
                Alert.alert(t('common.error'), error.message);
            } else {
                Alert.alert(
                    t('auth.email_sent'), 
                    t('auth.check_email_for_reset_code'),
                    [
                        {
                            text: t('common.ok'),
                            onPress: () => navigation.navigate('OTPVerification', { email })
                        }
                    ]
                );
            }
        } catch (err) {
            setError(err.message);
            Alert.alert(t('common.error'), err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Header title={t('auth.forgot_password_title')} />

                <ScrollView style={{ marginVertical: 54 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={images.logo}
                            resizeMode='contain'
                            style={styles.logo}
                        />
                    </View>
                    <Text style={[styles.title, {
                        color: dark ? COLORS.white : COLORS.black
                    }]}>{t('auth.enter_your_email')}</Text>

                    <Input
                        id="email"
                        onInputChanged={inputChangedHandler}
                        errorText={formState.inputValidities['email']}
                        placeholder={t('auth.email')}
                        placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
                        icon={icons.email}
                        keyboardType="email-address"
                        value={formState.inputValues.email}
                    />
                    
                    <Button
                        title={t('auth.send_reset_code')}
                        filled
                        onPress={handleSendResetEmail}
                        style={styles.button}
                        isLoading={isLoading}
                    />
                    
                    <Button
                        title={t('auth.back_to_login')}
                        onPress={() => navigation.navigate("Login")}
                        style={[styles.button, styles.backButton]}
                        textColor={COLORS.primary}
                    />
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
    button: {
        marginVertical: 6,
        width: SIZES.width - 32,
        borderRadius: 30
    },
    backButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primary
    }
})

export default ForgotPasswordEmail