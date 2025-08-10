import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';
import { useTheme } from '../theme/ThemeProvider';
import { StripeProvider, CardField, useStripe } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '../config/stripe.config';
import { processStripePayment } from '../lib/services/payment';
import { createBooking } from '../lib/services/booking';
import { supabase } from '../lib/supabase';

const CreditCardPayment = ({ navigation, route }) => {
  const { dark, colors } = useTheme();
  const { confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const { bookingData, price, serviceName, workerName } = route.params || {};

  const handlePayment = async () => {
    if (!cardDetails?.complete || !name || !email) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Process payment through your backend
      const paymentResult = await processStripePayment({
        booking_id: bookingData.id,
        payer_id: user?.id,
        amount: price,
        currency: 'EUR',
        customerEmail: email,
        customerName: name,
      });

      if (paymentResult.success) {
        // Update booking status
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ 
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingData.id);

        if (!bookingError) {
          Alert.alert(
            'Success!', 
            'Payment processed and booking confirmed!',
            [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
          );
        }
      } else {
        Alert.alert('Payment Failed', paymentResult.error || 'Please try again');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={dark ? COLORS.white : COLORS.black} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: dark ? COLORS.white : COLORS.black }]}>
              Card Payment
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            
            <View style={[styles.amountCard, { 
              backgroundColor: dark ? COLORS.dark2 : COLORS.white 
            }]}>
              <Text style={[styles.amountLabel, { 
                color: dark ? COLORS.gray : COLORS.grayscale700 
              }]}>
                Total Amount
              </Text>
              <Text style={[styles.amount, { 
                color: COLORS.primary 
              }]}
              testID="amountText"
              >
                €{price || 0}
              </Text>
              <Text style={[styles.serviceInfo, { 
                color: dark ? COLORS.grayscale200 : COLORS.grayscale700 
              }]}
              testID="serviceNameText"
              >
                {serviceName}
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { 
                  color: dark ? COLORS.white : COLORS.black 
                }]}>
                  Cardholder Name
                </Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: dark ? COLORS.dark2 : COLORS.tertiaryWhite,
                    color: dark ? COLORS.white : COLORS.black
                  }]}
                  placeholder="John Doe"
                  placeholderTextColor={COLORS.gray}
                  value={name}
                  onChangeText={setName}
                  testID="cardholderNameInput"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { 
                  color: dark ? COLORS.white : COLORS.black 
                }]}
                testID="emailLabel"
                >
                  Email Address
                </Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: dark ? COLORS.dark2 : COLORS.tertiaryWhite,
                    color: dark ? COLORS.white : COLORS.black
                  }]}
                  placeholder="john@example.com"
                  placeholderTextColor={COLORS.gray}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  testID="emailInput"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { 
                  color: dark ? COLORS.white : COLORS.black 
                }]}
                testID="cardDetailsLabel"
                >
                  Card Details
                </Text>
                
                {/* Card Number - Full Width */}
                <View style={[styles.cardFieldWrapper, {
                  backgroundColor: dark ? COLORS.dark2 : COLORS.tertiaryWhite,
                }]}>
                  <CardField
                    postalCodeEnabled={true}
                    placeholders={{
                      number: '4242 4242 4242 4242',
                      expiry: 'MM/YY',
                      cvc: 'CVC',
                      postalCode: 'ZIP',
                    }}
                    cardStyle={{
                      backgroundColor: dark ? COLORS.dark2 : COLORS.tertiaryWhite,
                      textColor: dark ? COLORS.white : COLORS.black,
                      placeholderColor: COLORS.gray,
                      borderWidth: 0,
                      fontSize: 16,
                    }}
                    style={styles.cardField}
                    onCardChange={(cardDetails) => setCardDetails(cardDetails)}
                    testID="cardField"
                  />
                </View>

                {/* Info text */}
                <Text style={[styles.helperText, {
                  color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                }]}
                testID="cardDetailsInfoText"
                >
                  Enter your card number, expiry date, CVC and postal code
                </Text>
              </View>

              {/* Card Icons for visual reference */}
              <View style={styles.cardIconsContainer}>
                <View style={[styles.cardIcon, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
                  <Text style={styles.cardIconText}>VISA</Text>
                </View>
                <View style={[styles.cardIcon, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
                  <Text style={styles.cardIconText}>MC</Text>
                </View>
                <View style={[styles.cardIcon, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
                  <Text style={styles.cardIconText}>AMEX</Text>
                </View>
              </View>

              <View style={[styles.securityInfo, {
                backgroundColor: dark ? COLORS.dark3 : COLORS.transparentTertiary,
              }]}>
                <Ionicons name="lock-closed" size={16} color={COLORS.primary} />
                <Text style={[styles.securityText, {
                  color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                }]}>
                  Your payment info is stored securely using Stripe
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={[styles.payButton, loading && styles.payButtonDisabled]}
              onPress={handlePayment}
              disabled={loading}
              testID="payButton"
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.payButtonText}>
                  Pay €{price || 0}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'semiBold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  amountCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: 'regular',
  },
  amount: {
    fontSize: 36,
    fontFamily: 'bold',
    marginVertical: 8,
  },
  serviceInfo: {
    fontSize: 14,
    fontFamily: 'regular',
    textAlign: 'center',
  },
  formContainer: {
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'medium',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'regular',
  },
  cardFieldWrapper: {
    borderRadius: 12,
    padding: 4,
    minHeight: 55,
    justifyContent: 'center',
  },
  cardField: {
    width: '100%',
    height: 50,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'regular',
    marginTop: 8,
    marginLeft: 4,
  },
  cardIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  cardIcon: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardIconText: {
    fontSize: 12,
    fontFamily: 'semiBold',
    color: COLORS.primary,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  securityText: {
    fontSize: 12,
    fontFamily: 'regular',
    marginLeft: 8,
    flex: 1,
  },
  bottomContainer: {
    padding: 16,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'semiBold',
  },
});

export default CreditCardPayment;