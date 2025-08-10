import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { COLORS, SIZES } from '../constants';
import { useTheme } from '../theme/ThemeProvider';
import { createCoinbaseCharge, checkPaymentStatus, testCoinbaseConnection } from '../lib/services/payment';
import { createBooking } from '../lib/services/booking';
import { supabase } from '../lib/supabase';
import { coinbaseConfig } from '../config/coinbase.config';
import { COINBASE_API_KEY } from '../config/coinbase.config';

const CryptoPayment = ({ navigation, route }) => {
  const { dark, colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [chargeData, setChargeData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [showWebView, setShowWebView] = useState(false);
  const [statusInterval, setStatusInterval] = useState(null);
  
  const { bookingData, price, serviceName, workerName } = route.params || {};

  // Get supported currencies from config
  const cryptoOptions = coinbaseConfig.supportedCurrencies;

  const createCharge = async () => {
    setLoading(true);
    try {
      console.log('🚀 Creating Coinbase Commerce charge...');
      
      // Debug: Check API key
      console.log('🔑 API Key check:', COINBASE_API_KEY ? `${COINBASE_API_KEY.substring(0, 8)}...` : 'MISSING OR UNDEFINED');
      console.log('🔑 API Key length:', COINBASE_API_KEY ? COINBASE_API_KEY.length : 'N/A');
      
      // Debug: Log the route params
      console.log('📋 Route params:', { bookingData, price, serviceName, workerName });
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'Please log in to continue');
        return;
      }
      
      console.log('👤 Current user:', { id: user.id, email: user.email });
      
      // Debug: Check all required data
      console.log('🔍 Validation check:', {
        bookingData: bookingData,
        user_id: user.id,
        price: price,
        serviceName: serviceName,
        workerName: workerName
      });
      
      // Validate required data with better error messages
      if (!bookingData) {
        console.error('❌ Missing booking data');
        Alert.alert('Error', 'Booking information is missing. Please go back and try again.');
        return;
      }
      
      if (!price || price <= 0) {
        console.error('❌ Invalid price:', price);
        Alert.alert('Error', 'Invalid payment amount. Please go back and try again.');
        return;
      }
      
      // Create the booking first if it doesn't have an ID
      let bookingId = bookingData.id;
      
      if (!bookingId) {
        console.log('📝 Creating booking record first...');
        
        console.log('📋 Booking data to create:', bookingData);
        
        try {
          const newBooking = await createBooking({
            clientId: bookingData.clientId || user.id,
            workerId: bookingData.workerId,
            serviceId: bookingData.serviceId,
            bookingDate: bookingData.bookingDate,
            startTime: bookingData.startTime,
            endTime: bookingData.endTime,
            address: bookingData.address,
            city: bookingData.city,
            postalCode: bookingData.postalCode,
            notes: bookingData.notes || '',
            addons: bookingData.addons || []
          });
          
          if (!newBooking || (!newBooking.id && !newBooking.booking_id)) {
            console.error('❌ No booking data returned');
            Alert.alert('Error', 'Failed to create booking - no data returned.');
            return;
          }
          
          // The RPC function returns booking_id instead of id
          bookingId = newBooking.booking_id || newBooking.id;
          console.log('✅ Booking created with ID:', bookingId);
          
          // Update bookingData with the new ID
          bookingData.id = bookingId;
          
        } catch (error) {
          console.error('❌ Booking creation failed:', error);
          console.error('❌ Error stack:', error.stack);
          Alert.alert('Error', `Failed to create booking: ${error.message}`);
          return;
        }
      }
      
      const charge = await createCoinbaseCharge({
        booking_id: bookingId,
        payer_id: user.id,
        amount: price,
        currency: 'EUR',
        name: serviceName || 'BRICOLLANO Service',
        serviceName: serviceName,
        description: `Booking for ${serviceName || 'service'} with ${workerName || 'professional'}`,
        pricing_type: 'fixed_price',
      });

      console.log('💳 Charge result:', charge);

      if (charge.success && charge.data) {
        setChargeData(charge.data);
        // Ensure UI shows the action buttons until a final status is reached
        setPaymentStatus('pending');
        console.log('✅ Charge created successfully:', charge.data.id);
        
        // Start monitoring payment status
        startPaymentMonitoring(charge.data.id);
      } else {
        console.error('❌ Charge creation failed:', charge.error);
        Alert.alert('Error', charge.error || 'Failed to create payment request');
      }
    } catch (error) {
      console.error('❌ Crypto payment error:', error);
      Alert.alert('Error', 'Failed to initialize payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startPaymentMonitoring = (chargeId) => {
    console.log('🔍 Starting payment monitoring for charge:', chargeId);
    
    // Clear any existing interval
    if (statusInterval) {
      clearInterval(statusInterval);
    }
    
    // Monitor payment status every 10 seconds
    const interval = setInterval(async () => {
      try {
        console.log('🔄 Checking payment status...');
        const status = await checkPaymentStatus(chargeId);
        console.log('📊 Payment status:', status);
        
        // Normalize statuses so UI remains interactive until final state
        const finalCompleted = status === 'COMPLETED';
        const finalFailed = status === 'EXPIRED' || status === 'CANCELED';
        const normalized = finalCompleted ? 'COMPLETED' : finalFailed ? status : 'pending';

        setPaymentStatus(normalized);
        
        if (finalCompleted) {
          console.log('✅ Payment completed!');
          clearInterval(interval);
          setStatusInterval(null);
          handlePaymentSuccess();
        } else if (finalFailed) {
          console.log('❌ Payment failed:', status);
          clearInterval(interval);
          setStatusInterval(null);
          Alert.alert(
            'Payment Failed', 
            'Transaction was not completed or expired. Please try again.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } catch (error) {
        console.error('❌ Status check error:', error);
        // On polling errors, keep current state (likely 'pending') and try again next tick
      }
    }, 10000); // Check every 10 seconds
    
    setStatusInterval(interval);
  };
  
  const stopPaymentMonitoring = () => {
    if (statusInterval) {
      clearInterval(statusInterval);
      setStatusInterval(null);
    }
  };
  
  const openCoinbaseCheckout = async () => {
    if (!chargeData?.hosted_url) {
      Alert.alert('Error', 'Payment checkout not available');
      return;
    }
    
    console.log('🌍 Opening Coinbase checkout:', chargeData.hosted_url);
    
    try {
      const supported = await Linking.canOpenURL(chargeData.hosted_url);
      if (supported) {
        await Linking.openURL(chargeData.hosted_url);
        // Show WebView as fallback or alternative
        setShowWebView(true);
      } else {
        // Fallback to WebView
        setShowWebView(true);
      }
    } catch (error) {
      console.error('❌ Error opening checkout:', error);
      // Fallback to WebView
      setShowWebView(true);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      console.log('✅ Processing payment success...');
      
      // Stop monitoring
      stopPaymentMonitoring();
      
      // Update booking status in database
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          payment_method: 'crypto',
          payment_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingData?.id);

      if (bookingError) {
        console.error('❌ Booking update error:', bookingError);
        Alert.alert('Warning', 'Payment completed but booking update failed. Please contact support.');
        return;
      }

      Alert.alert(
        '🎉 Payment Successful!',
        'Your cryptocurrency payment has been confirmed and your booking is now active.',
        [
          { 
            text: 'View Booking', 
            onPress: () => navigation.navigate('MyBookings') 
          },
          { 
            text: 'Go Home', 
            onPress: () => navigation.navigate('Main'),
            style: 'default'
          }
        ]
      );
    } catch (error) {
      console.error('❌ Payment success handling error:', error);
      Alert.alert('Error', 'Payment completed but there was an issue updating your booking. Please contact support.');
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopPaymentMonitoring();
    };
  }, []);

  useEffect(() => {
    createCharge();
  }, []);

  // Handle WebView navigation
  const handleWebViewNavigationStateChange = (navState) => {
    const { url } = navState;
    console.log('🌍 WebView navigation:', url);
    
    // Check for success/cancel URLs
    if (url.includes('payment-success') || url.includes('success')) {
      setShowWebView(false);
      // Payment might be successful, check status
      if (chargeData?.id) {
        checkPaymentStatus(chargeData.id).then(status => {
          if (status === 'COMPLETED') {
            handlePaymentSuccess();
          }
        });
      }
    } else if (url.includes('payment-cancelled') || url.includes('cancel')) {
      setShowWebView(false);
      Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
    }
  };

  if (showWebView && chargeData?.hosted_url) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowWebView(false)}>
            <Ionicons name="close" size={24} color={dark ? COLORS.white : COLORS.black} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: dark ? COLORS.white : COLORS.black }]}>
            Coinbase Payment
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <WebView
          source={{ uri: chargeData.hosted_url }}
          style={{ flex: 1 }}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[styles.loadingText, { color: dark ? COLORS.white : COLORS.black }]}>
                Loading Coinbase checkout...
              </Text>
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          stopPaymentMonitoring();
          navigation.goBack();
        }}>
          <Ionicons name="arrow-back" size={24} color={dark ? COLORS.white : COLORS.black} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: dark ? COLORS.white : COLORS.black }]}>
          Cryptocurrency Payment
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.loadingText, { color: dark ? COLORS.white : COLORS.black }]}>
              Setting up your crypto payment...
            </Text>
          </View>
        ) : chargeData ? (
          <>
            {/* Payment Summary Card */}
            <View style={[styles.amountCard, { 
              backgroundColor: dark ? COLORS.dark2 : COLORS.white 
            }]}>
              <Ionicons name="logo-bitcoin" size={48} color={COLORS.primary} />
              <Text style={[styles.amountLabel, { 
                color: dark ? COLORS.gray : COLORS.grayscale700 
              }]}>
                Total Amount
              </Text>
              <Text style={[styles.amount, { color: COLORS.primary }]}>
                €{price || 0}
              </Text>
              <Text style={[styles.serviceInfo, { 
                color: dark ? COLORS.grayscale200 : COLORS.grayscale700 
              }]}>
                {serviceName} with {workerName}
              </Text>
            </View>

            {/* Supported Cryptocurrencies */}
            <View style={[styles.cryptoCard, {
              backgroundColor: dark ? COLORS.dark2 : COLORS.white
            }]}>
              <Text style={[styles.sectionTitle, { 
                color: dark ? COLORS.white : COLORS.black 
              }]}>
                Supported Cryptocurrencies
              </Text>
              <View style={styles.cryptoGrid}>
                {cryptoOptions.map((crypto) => (
                  <View key={crypto.id} style={styles.cryptoItem}>
                    <Text style={[styles.cryptoIcon, { color: crypto.color }]}>
                      {crypto.symbol}
                    </Text>
                    <Text style={[styles.cryptoName, { 
                      color: dark ? COLORS.white : COLORS.black 
                    }]}>
                      {crypto.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Payment Status */}
            <View style={[styles.statusCard, {
              backgroundColor: dark ? COLORS.dark2 : COLORS.white
            }]}>
              <View style={styles.statusHeader}>
                <Ionicons 
                  name={paymentStatus === 'COMPLETED' ? 'checkmark-circle' : 
                        paymentStatus === 'EXPIRED' || paymentStatus === 'CANCELED' ? 'close-circle' :
                        'time'} 
                  size={24} 
                  color={paymentStatus === 'COMPLETED' ? COLORS.success : 
                         paymentStatus === 'EXPIRED' || paymentStatus === 'CANCELED' ? COLORS.error :
                         COLORS.warning} 
                />
                <Text style={[styles.statusText, { 
                  color: dark ? COLORS.white : COLORS.black 
                }]}>
                  Payment Status: {paymentStatus === 'pending' ? 'Waiting for Payment' : paymentStatus}
                </Text>
              </View>
              
              {paymentStatus === 'pending' && (
                <Text style={[styles.statusDescription, {
                  color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                }]}>
                  Click "Pay with Crypto" to complete your payment using Coinbase Commerce.
                </Text>
              )}
            </View>

            {/* Instructions */}
            <View style={[styles.instructionsCard, {
              backgroundColor: dark ? COLORS.dark3 : COLORS.transparentTertiary
            }]}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <View style={styles.instructionsText}>
                <Text style={[styles.instructionsTitle, {
                  color: dark ? COLORS.white : COLORS.black
                }]}>
                  How it works:
                </Text>
                <Text style={[styles.instructionsDescription, {
                  color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                }]}>
                  1. Click "Pay with Crypto" below{"\n"}
                  2. Choose your preferred cryptocurrency{"\n"}
                  3. Complete payment in your crypto wallet{"\n"}
                  4. Your booking will be confirmed automatically
                </Text>
              </View>
            </View>

            {/* (Test API button removed) */}
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={COLORS.error} />
            <Text style={[styles.errorText, {
              color: dark ? COLORS.white : COLORS.black
            }]}>
              Failed to create payment request
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={createCharge}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Payment Button */}
      {chargeData && paymentStatus === 'pending' && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, {
              backgroundColor: dark ? COLORS.dark2 : COLORS.grayscale100
            }]}
            onPress={() => {
              stopPaymentMonitoring();
              navigation.goBack();
            }}>
            <Text style={[styles.cancelButtonText, {
              color: dark ? COLORS.white : COLORS.black
            }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.payButton}
            onPress={openCoinbaseCheckout}>
            <Ionicons name="logo-bitcoin" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={styles.payButtonText}>
              Pay with Crypto
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Payment Completed State */}
      {paymentStatus === 'COMPLETED' && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.payButton, { backgroundColor: COLORS.success }]}
            onPress={() => navigation.navigate('MyBookings')}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={styles.payButtonText}>
              View Booking
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  // New styles for enhanced UI
  cryptoCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cryptoItem: {
    width: '48%',
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'semiBold',
    marginLeft: 12,
  },
  statusDescription: {
    fontSize: 14,
    fontFamily: 'regular',
    marginLeft: 36,
  },
  instructionsCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionsText: {
    flex: 1,
    marginLeft: 12,
  },
  instructionsTitle: {
    fontSize: 14,
    fontFamily: 'semiBold',
    marginBottom: 8,
  },
  instructionsDescription: {
    fontSize: 12,
    fontFamily: 'regular',
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'medium',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'semiBold',
  },
  payButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
  },
  payButtonText: {
    fontSize: 16,
    fontFamily: 'semiBold',
    color: COLORS.white,
  },
});

export default CryptoPayment;