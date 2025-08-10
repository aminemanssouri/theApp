import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons, FONTS } from '../constants';
import { Feather } from "@expo/vector-icons";
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { createBooking } from '../lib/services/booking';
import { useAuth } from '../context/AuthContext';

const YourAddress = ({ navigation, route }) => {
    const { colors, dark } = useTheme();
    const { user } = useAuth();
    
    // Get booking details from previous screens
    const { 
        workerId, 
        workerName, 
        serviceId,
        serviceName,
        bookingDate,
        startTime,
        endTime,
        workingHours,
        price,
        addons 
    } = route.params || {};
    
    // Form state
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [apartmentNumber, setApartmentNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Validation
    const validateForm = () => {
        if (!address.trim()) {
            Alert.alert('Error', 'Please enter your address');
            return false;
        }
        if (!city.trim()) {
            Alert.alert('Error', 'Please enter your city');
            return false;
        }
        if (!postalCode.trim()) {
            Alert.alert('Error', 'Please enter your postal code');
            return false;
        }
        return true;
    };
    
    // Handle booking submission
    const handleContinue = async () => {
        if (!validateForm()) return;
        
        setLoading(true);
        try {
            // Prepare booking data
            const bookingData = {
                clientId: user?.id,
                workerId: workerId,
                serviceId: serviceId,
                bookingDate: bookingDate || new Date().toISOString().split('T')[0],
                startTime: startTime || '09:00',
                endTime: endTime || '11:00',
                address: `${address}${apartmentNumber ? ', Apt ' + apartmentNumber : ''}`,
                city: city,
                postalCode: postalCode,
                notes: notes,
                addons: addons || []
            };
            
            // Navigate to payment with all booking data
            navigation.navigate('PaymentMethods', {
                bookingData: bookingData,
                workerName: workerName,
                serviceName: serviceName,
                price: price || 125,
                workingHours: workingHours || 2
            });
            
        } catch (error) {
            console.error('Error preparing booking:', error);
            Alert.alert('Error', 'Failed to process booking. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    const renderHeader = () => {
        return (
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.headerIconContainer, { 
                        borderColor: dark? COLORS.dark1 : COLORS.grayscale200
                    }]}>
                    <Image
                        source={icons.arrowBack}
                        resizeMode='contain'
                        style={[styles.arrowBackIcon, { 
                            tintColor: dark? COLORS.white : COLORS.greyscale900
                        }]}
                    />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { 
                    color: dark? COLORS.white : COLORS.greyscale900
                }]}>Your Address</Text>
                <TouchableOpacity>
                    <Feather name="more-vertical" size={24} color={dark? COLORS.white : COLORS.greyscale900} />
                </TouchableOpacity>
            </View>
        );
    };
    
    const renderInput = (label, value, setValue, placeholder, keyboardType = 'default', multiline = false) => {
        return (
            <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { 
                    color: dark ? COLORS.white : COLORS.greyscale900 
                }]}>
                    {label}
                </Text>
                <TextInput
                    style={[
                        styles.input,
                        multiline && styles.textArea,
                        { 
                            backgroundColor: dark ? COLORS.dark2 : COLORS.tertiaryWhite,
                            color: dark ? COLORS.white : COLORS.greyscale900,
                            borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                        }
                    ]}
                    value={value}
                    onChangeText={setValue}
                    placeholder={placeholder}
                    placeholderTextColor={dark ? COLORS.grayTie : COLORS.grayscale700}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    numberOfLines={multiline ? 4 : 1}
                />
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {renderHeader()}
                
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Text style={[styles.title, { 
                        color: dark ? COLORS.white : COLORS.greyscale900 
                    }]}>
                        Enter Your Service Address
                    </Text>
                    
                    <Text style={[styles.subtitle, { 
                        color: dark ? COLORS.grayscale200 : COLORS.grayscale700 
                    }]}>
                        Please provide the address where the service will be performed
                    </Text>
                    
                    {renderInput(
                        'Street Address*',
                        address,
                        setAddress,
                        'Enter your street address',
                        'default'
                    )}
                    
                    <View style={styles.row}>
                        <View style={[styles.halfInput, { marginRight: 8 }]}>
                            {renderInput(
                                'Apartment/Suite',
                                apartmentNumber,
                                setApartmentNumber,
                                'Apt/Suite #',
                                'default'
                            )}
                        </View>
                        <View style={[styles.halfInput, { marginLeft: 8 }]}>
                            {renderInput(
                                'Postal Code*',
                                postalCode,
                                setPostalCode,
                                'Postal code',
                                'numeric'
                            )}
                        </View>
                    </View>
                    
                    {renderInput(
                        'City*',
                        city,
                        setCity,
                        'Enter your city',
                        'default'
                    )}
                    
                    {renderInput(
                        'Special Instructions (Optional)',
                        notes,
                        setNotes,
                        'Any special instructions for the service provider...',
                        'default',
                        true
                    )}
                    
                    {/* Booking Summary Card */}
                    <View style={[styles.summaryCard, {
                        backgroundColor: dark ? COLORS.dark2 : COLORS.tertiaryWhite,
                        borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                    }]}>
                        <Text style={[styles.summaryTitle, {
                            color: dark ? COLORS.white : COLORS.greyscale900
                        }]}>
                            Booking Summary
                        </Text>
                        
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, {
                                color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                            }]}>Service:</Text>
                            <Text style={[styles.summaryValue, {
                                color: dark ? COLORS.white : COLORS.greyscale900
                            }]}>{serviceName || 'House Cleaning'}</Text>
                        </View>
                        
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, {
                                color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                            }]}>Provider:</Text>
                            <Text style={[styles.summaryValue, {
                                color: dark ? COLORS.white : COLORS.greyscale900
                            }]}>{workerName || 'Professional'}</Text>
                        </View>
                        
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, {
                                color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                            }]}>Date:</Text>
                            <Text style={[styles.summaryValue, {
                                color: dark ? COLORS.white : COLORS.greyscale900
                            }]}>{bookingDate || 'Today'}</Text>
                        </View>
                        
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, {
                                color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                            }]}>Time:</Text>
                            <Text style={[styles.summaryValue, {
                                color: dark ? COLORS.white : COLORS.greyscale900
                            }]}>{startTime || '09:00'} - {endTime || '11:00'}</Text>
                        </View>
                    </View>
                </ScrollView>
                
                <View style={[styles.bottomContainer, { 
                    backgroundColor: dark ? COLORS.dark1 : COLORS.white,
                    borderTopColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                }]}>
                    <Button
                        title={`Continue - $${price || 125}`}
                        filled
                        style={styles.continueButton}
                        onPress={handleContinue}
                        disabled={loading}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    area: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    headerIconContainer: {
        height: 46,
        width: 46,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    arrowBackIcon: {
        width: 24,
        height: 24,
    },
    headerTitle: {
        ...FONTS.h4,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    title: {
        ...FONTS.h3,
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        ...FONTS.body3,
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        ...FONTS.body3,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        fontFamily: 'regular',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        marginHorizontal: -8,
    },
    halfInput: {
        flex: 1,
    },
    summaryCard: {
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    summaryTitle: {
        ...FONTS.h5,
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        ...FONTS.body3,
    },
    summaryValue: {
        ...FONTS.body3,
        fontFamily: 'semiBold',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
    },
    continueButton: {
        borderRadius: 30,
        height: 56,
    },
});

export default YourAddress;