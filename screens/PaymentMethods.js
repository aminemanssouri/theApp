import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Image, Modal, Alert } from 'react-native';
import React, { useState } from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView } from 'react-native-virtualized-view';
import PaymentMethodItem from '../components/PaymentMethodItem';
import { useTheme } from '../theme/ThemeProvider';
import { createBooking } from '../lib/services/booking';
import { t } from '../context/LanguageContext';

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
        }]}>{t('payment.payment_methods_title')}</Text>
        <View style={{ width: 24 }} />
      </View>
    )
  }

  const handleCheckboxPress = (itemTitle) => {
    setSelectedItem(selectedItem === itemTitle ? null : itemTitle);
  };

  const handleProcessPayment = async () => {
    if (!selectedItem) {
      Alert.alert(t('common.error'), t('payment.please_select_method'));
      return;
    }

    setLoading(true);
    
    try {
      if (selectedItem === 'card') {
        navigation.navigate('CreditCardPayment', {
          bookingData,
          price,
          workerName,
          serviceName,
          workingHours
        });
      } else if (selectedItem === 'crypto') {
        navigation.navigate('CryptoPayment', {
          bookingData,
          price,
          workerName,
          serviceName,
          workingHours
        });
      } else if (selectedItem === 'paypal') {
        Alert.alert(t('common.coming_soon'), t('payment.paypal_coming_soon'));
      } else if (selectedItem === 'apple') {
        Alert.alert(t('common.coming_soon'), t('payment.apple_pay_coming_soon'));
      }
    } catch (error) {
      console.error('Payment processing failed:', error);
      Alert.alert(t('common.error'), t('payment.failed_to_process'));
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    return (
      <View style={{ marginVertical: 12 }}>
        <PaymentMethodItem
          checked={selectedItem === 'card'}
          onPress={() => handleCheckboxPress('card')}
          title={t('payment.credit_debit_card')}
          subtitle={t('payment.credit_debit_card_sub')}
          icon={icons.creditCard}
        />
        <PaymentMethodItem
          checked={selectedItem === 'crypto'}
          onPress={() => handleCheckboxPress('crypto')}
          title={t('payment.cryptocurrency')}
          subtitle={t('payment.cryptocurrency_sub')}
          icon={icons.wallet || icons.creditCard}
        />
        <PaymentMethodItem
          checked={selectedItem === 'paypal'}
          onPress={() => handleCheckboxPress('paypal')}
          title={t('payment.paypal')}
          subtitle={t('payment.paypal_sub')}
          icon={icons.paypal}
        />
        <PaymentMethodItem
          checked={selectedItem === 'apple'}
          onPress={() => handleCheckboxPress('apple')}
          title={t('payment.apple_pay')}
          subtitle={t('payment.apple_pay_sub')}
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
          }]}>{t('payment.total')}</Text>
          <Text style={[styles.totalPrice, { 
            color: dark? COLORS.white : COLORS.greyscale900,
          }]}> ${price || 0}</Text>
        </View>
        <TouchableOpacity
          onPress={handleProcessPayment}
          style={[styles.bottomBtn, loading && styles.bottomBtnDisabled]}
          disabled={loading}>
          <Text style={styles.bottomBtnText}>
            {loading ? t('payment.processing') : t('common.continue')}
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
          }]}>{t('payment.select_payment_method')}</Text>
          
          {renderContent()}
          
          <View style={[styles.summaryCard, {
            backgroundColor: dark ? COLORS.dark2 : COLORS.tertiaryWhite,
            borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
          }]}>
            <Text style={[styles.summaryTitle, {
              color: dark ? COLORS.white : COLORS.greyscale900
            }]}>{t('payment.booking_summary')}</Text>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, {
                color: dark ? COLORS.grayscale200 : COLORS.grayscale700
              }]}>{t('payment.service')}</Text>
              <Text style={[styles.summaryValue, {
                color: dark ? COLORS.white : COLORS.greyscale900
              }]} numberOfLines={1}>{serviceName || 'Service'}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, {
                color: dark ? COLORS.grayscale200 : COLORS.grayscale700
              }]}>{t('payment.provider')}</Text>
              <Text style={[styles.summaryValue, {
                color: dark ? COLORS.white : COLORS.greyscale900
              }]} numberOfLines={1}>{workerName || 'Professional'}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, {
                color: dark ? COLORS.grayscale200 : COLORS.grayscale700
              }]}>{t('payment.duration')}</Text>
              <Text style={[styles.summaryValue, {
                color: dark ? COLORS.white : COLORS.greyscale900
              }]}>{workingHours || 2} {t('payment.hours')}</Text>
            </View>

            <View style={[styles.divider, {
              backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
            }]} />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, {
                color: dark ? COLORS.white : COLORS.greyscale900,
                fontFamily: "semiBold"
              }]}>{t('payment.total_amount')}</Text>
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
              {t('payment.secure_note')}
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