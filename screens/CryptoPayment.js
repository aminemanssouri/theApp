import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';
import { useTheme } from '../theme/ThemeProvider';
import { createCoinbaseCharge } from '../lib/services/payment';
import { createBooking } from '../lib/services/booking';
import { supabase } from '../lib/supabase';

const CryptoPayment = ({ navigation, route }) => {
  const { dark, colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [chargeData, setChargeData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  
  const { bookingData, price, serviceName, workerName } = route.params || {};

  const cryptoOptions = [
    { id: 'BTC', name: 'Bitcoin', icon: '₿', color: '#F7931A' },
    { id: 'ETH', name: 'Ethereum', icon: 'Ξ', color: '#627EEA' },
    { id: 'USDC', name: 'USD Coin', icon: '$', color: '#2775CA' },
    { id: 'LTC', name: 'Litecoin', icon: 'Ł', color: '#345D9D' },
  ];

  const createCharge = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const charge = await createCoinbaseCharge({
        booking_id: bookingData.id,
        payer_id: user?.id,
        amount: price,
        currency: 'EUR',
        name: serviceName,
        description: `Booking for ${serviceName} with ${workerName}`,
        pricing_type: 'fixed_price',
      });

      if (charge.success) {
        setChargeData(charge.data);
        // Start monitoring payment status
        monitorPaymentStatus(charge.data.id);
      } else {
        Alert.alert('Error', charge.error || 'Failed to create payment request');
      }
    } catch (error) {
      console.error('Crypto payment error:', error);
      Alert.alert('Error', 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const monitorPaymentStatus = (chargeId) => {
    // In production, you'd use webhooks or polling to check status
    // This is a simplified version
    const interval = setInterval(async () => {
      try {
        // Check payment status from your backend
        const status = await checkPaymentStatus(chargeId);
        if (status === 'completed') {
          clearInterval(interval);
          handlePaymentSuccess();
        } else if (status === 'expired' || status === 'cancelled') {
          clearInterval(interval);
          Alert.alert('Payment Failed', 'Transaction was not completed');
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 5000); // Check every 5 seconds
  };

  const handlePaymentSuccess = async () => {
    try {
      const booking = await createBooking({
        ...bookingData,
        payment_method: 'crypto',
        payment_status: 'completed',
        transaction_id: chargeData?.id,
      });

      if (booking) {
        Alert.alert(
          'Success!',
          'Payment received and booking confirmed!',
          [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
        );
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Payment received but booking failed');
    }
  };

  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Address copied to clipboard');
  };

  useEffect(() => {
    createCharge();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={dark ? COLORS.white : COLORS.black} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: dark ? COLORS.white : COLORS.black }]}>
          Crypto Payment
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.loadingText, { color: dark ? COLORS.white : COLORS.black }]}>
              Creating payment request...
            </Text>
          </View>
        ) : chargeData ? (
          <>
            <View style={[styles.amountCard, { 
              backgroundColor: dark ? COLORS.dark2 : COLORS.white 
            }]}>
              <Text style={[styles.amountLabel, { 
                color: dark ? COLORS.gray : COLORS.grayscale700 
              }]}>
                Amount to Pay
              </Text>
              <Text style={[styles.amount, { color: COLORS.primary }]}>
                ${price || 0}
              </Text>
              <Text style={[styles.serviceInfo, { 
                color: dark ? COLORS.grayscale200 : COLORS.grayscale700 
              }]}>
                {serviceName}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { 
              color: dark ? COLORS.white : COLORS.black 
            }]}>
              Select Cryptocurrency
            </Text>

            <View style={styles.cryptoGrid}>
              {cryptoOptions.map((crypto) => (
                <TouchableOpacity
                  key={crypto.id}
                  style={[
                    styles.cryptoOption,
                    {
                      backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                      borderColor: selectedCrypto === crypto.id ? crypto.color : COLORS.grayscale200,
                      borderWidth: selectedCrypto === crypto.id ? 2 : 1,
                    },
                  ]}
                  onPress={() => setSelectedCrypto(crypto.id)}>
                  <Text style={[styles.cryptoIcon, { color: crypto.color }]}>
                    {crypto.icon}
                  </Text>
                  <Text style={[styles.cryptoName, { 
                    color: dark ? COLORS.white : COLORS.black 
                  }]}>
                    {crypto.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {chargeData?.addresses?.[selectedCrypto.toLowerCase()] && (
              <View style={[styles.addressCard, {
                backgroundColor: dark ? COLORS.dark2 : COLORS.white
              }]}>
                <Text style={[styles.addressLabel, {
                  color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                }]}>
                  Send {selectedCrypto} to this address:
                </Text>
                <TouchableOpacity
                  style={[styles.addressContainer, {
                    backgroundColor: dark ? COLORS.dark3 : COLORS.tertiaryWhite
                  }]}
                  onPress={() => copyToClipboard(chargeData.addresses[selectedCrypto.toLowerCase()])}>
                  <Text style={[styles.addressText, {
                    color: dark ? COLORS.white : COLORS.black
                  }]} numberOfLines={1}>
                    {chargeData.addresses[selectedCrypto.toLowerCase()]}
                  </Text>
                  <Ionicons name="copy" size={20} color={COLORS.primary} />
                </TouchableOpacity>

                <View style={styles.qrContainer}>
                  {/* QR Code would go here - you'd need a QR library */}
                  <View style={[styles.qrPlaceholder, {
                    backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100
                  }]}>
                    <MaterialCommunityIcons 
                      name="qrcode" 
                      size={100} 
                      color={dark ? COLORS.white : COLORS.black} 
                    />
                  </View>
                </View>

                <View style={[styles.warningCard, {
                  backgroundColor: dark ? COLORS.dark3 : '#FFF5E6'
                }]}>
                  <Ionicons name="warning" size={20} color="#FFA500" />
                  <Text style={[styles.warningText, {
                    color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                  }]}>
                    Send only {selectedCrypto} to this address. Sending any other cryptocurrency may result in permanent loss.
                  </Text>
                </View>

                <Text style={[styles.timerText, {
                  color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                }]}>
                  This payment request expires in 15 minutes
                </Text>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.cancelButton, {
            backgroundColor: dark ? COLORS.dark2 : COLORS.grayscale100
          }]}
          onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelButtonText, {
            color: dark ? COLORS.white : COLORS.black
          }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => Alert.alert('Waiting', 'Waiting for payment confirmation...')}>
          <Text style={styles.confirmButtonText}>
            I've Sent Payment
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'regular',
  },
  amountCard: {
    padding: 20,
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
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'semiBold',
    marginBottom: 16,
  },
  cryptoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  cryptoOption: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  cryptoIcon: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  cryptoName: {
    fontSize: 14,
    fontFamily: 'medium',
    marginTop: 8,
  },
  addressCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  addressLabel: {
    fontSize: 14,
    fontFamily: 'regular',
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'regular',
    marginRight: 8,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  qrPlaceholder: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  warningCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'regular',
    marginLeft: 8,
  },
  timerText: {
    fontSize: 12,
    fontFamily: 'regular',
    textAlign: 'center',
    marginTop: 8,
  },
  bottomContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'medium',
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'semiBold',
    color: COLORS.white,
  },
});

export default CryptoPayment;