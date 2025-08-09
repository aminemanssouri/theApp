import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Image, Modal, Alert } from 'react-native';
import React, { useState } from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView } from 'react-native-virtualized-view';
import PaymentMethodItem from '../components/PaymentMethodItem';
import { useTheme } from '../theme/ThemeProvider';
import { createBooking } from '../lib/services/booking';

const PaymentMethods = ({ navigation, route }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const { dark, colors } = useTheme();
  
  // Get booking data from previous screen
  const { bookingData, workerName, serviceName, price, workingHours } = route.params || {};

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back-outline"
            size={24}
            color={dark ? COLORS.white : COLORS.black}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { 
          color: dark? COLORS.white : COLORS.greyscale900
        }]}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>
    )
  }

  const handleCheckboxPress = (itemTitle) => {
    setSelectedItem(selectedItem === itemTitle ? null : itemTitle);
  };

  const handleProcessPayment = async () => {
    if (!selectedItem) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    setLoading(true);
    
    try {
      if (selectedItem === 'Credit/Debit Card') {
        navigation.navigate('CreditCardPayment', {
          bookingData,
          price,
          workerName,
          serviceName,
          workingHours
        });
      } else if (selectedItem === 'Cryptocurrency') {
        navigation.navigate('CryptoPayment', {
          bookingData,
          price,
          workerName,
          serviceName,
          workingHours
        });
      } else if (selectedItem === 'PayPal') {
        Alert.alert('Coming Soon', 'PayPal integration coming soon!');
      } else if (selectedItem === 'Apple Pay') {
        Alert.alert('Coming Soon', 'Apple Pay integration coming soon!');
      }
    } catch (error) {
      console.error('Payment processing failed:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    return (
      <View style={{ marginVertical: 12 }}>
        <PaymentMethodItem
          checked={selectedItem === 'Credit/Debit Card'}
          onPress={() => handleCheckboxPress('Credit/Debit Card')}
          title="Credit/Debit Card"
          subtitle="Visa, Mastercard, Amex"
          icon={icons.creditCard}
        />
        <PaymentMethodItem
          checked={selectedItem === 'Cryptocurrency'}
          onPress={() => handleCheckboxPress('Cryptocurrency')}
          title="Cryptocurrency"
          subtitle="Bitcoin, Ethereum & more"
          icon={icons.wallet || icons.creditCard}
        />
        <PaymentMethodItem
          checked={selectedItem === 'PayPal'}
          onPress={() => handleCheckboxPress('PayPal')}
          title="PayPal"
          subtitle="Pay with PayPal balance"
          icon={icons.paypal}
        />
        <PaymentMethodItem
          checked={selectedItem === 'Apple Pay'}
          onPress={() => handleCheckboxPress('Apple Pay')}
          title="Apple Pay"
          subtitle="Quick and secure"
          icon={icons.appleLogo}
        />
      </View>
    )
  }

  const renderBottomContent = () => {
    return (
      <View style={styles.bottomContainer}>
        <View style={styles.bottomLeft}>
          <Text style={[styles.total, { 
             color: dark ? COLORS.grayscale200 : "#767676",
          }]}>Total:</Text>
          <Text style={[styles.totalPrice, { 
            color: dark? COLORS.white : COLORS.greyscale900,
          }]}> ${price || 0}</Text>
        </View>
        <TouchableOpacity
          onPress={handleProcessPayment}
          style={[styles.bottomBtn, loading && styles.bottomBtnDisabled]}
          disabled={loading}>
          <Text style={styles.bottomBtnText}>
            {loading ? 'Processing...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, {
            color: dark ? COLORS.white : COLORS.greyscale900
          }]}>Select Payment Method</Text>
          
          {renderContent()}
          
          <View style={[styles.summaryCard, {
            backgroundColor: dark ? COLORS.dark2 : COLORS.tertiaryWhite,
            borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
          }]}>
            <Text style={[styles.summaryTitle, {
              color: dark ? COLORS.white : COLORS.greyscale900
            }]}>Booking Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, {
                color: dark ? COLORS.grayscale200 : COLORS.grayscale700
              }]}>Service:</Text>
              <Text style={[styles.summaryValue, {
                color: dark ? COLORS.white : COLORS.greyscale900
              }]} numberOfLines={1}>{serviceName || 'Service'}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, {
                color: dark ? COLORS.grayscale200 : COLORS.grayscale700
              }]}>Provider:</Text>
              <Text style={[styles.summaryValue, {
                color: dark ? COLORS.white : COLORS.greyscale900
              }]} numberOfLines={1}>{workerName || 'Professional'}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, {
                color: dark ? COLORS.grayscale200 : COLORS.grayscale700
              }]}>Duration:</Text>
              <Text style={[styles.summaryValue, {
                color: dark ? COLORS.white : COLORS.greyscale900
              }]}>{workingHours || 2} hours</Text>
            </View>

            <View style={[styles.divider, {
              backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
            }]} />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, {
                color: dark ? COLORS.white : COLORS.greyscale900,
                fontFamily: "semiBold"
              }]}>Total Amount:</Text>
              <Text style={[styles.summaryValue, {
                color: COLORS.primary,
                fontSize: 18
              }]}>${price || 0}</Text>
            </View>
          </View>

          <View style={[styles.securityNote, {
            backgroundColor: dark ? COLORS.dark3 : COLORS.transparentTertiary,
          }]}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            <Text style={[styles.securityText, {
              color: dark ? COLORS.grayscale200 : COLORS.grayscale700
            }]}>
              Your payment information is encrypted and secure
            </Text>
          </View>
        </ScrollView>
        {renderBottomContent()}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  area: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "bold",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "semiBold",
    marginBottom: 16,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 20,
    width: SIZES.width - 32,
    right: 16,
    left: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  bottomLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  total: {
    fontSize: 14,
    fontFamily: "regular"
  },
  totalPrice: {
    fontSize: 24,
    fontFamily: "bold",
  },
  bottomBtn: {
    width: 150,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary
  },
  bottomBtnDisabled: {
    opacity: 0.6
  },
  bottomBtnText: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: COLORS.white
  },
  summaryCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: "semiBold",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: "regular",
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "medium",
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 100,
  },
  securityText: {
    fontSize: 12,
    fontFamily: "regular",
    marginLeft: 8,
    flex: 1,
  },
})

export default PaymentMethods