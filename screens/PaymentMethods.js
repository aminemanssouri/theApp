import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Image, Modal, Alert } from 'react-native';
import React, { useState } from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, AntDesign } from "@expo/vector-icons";
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

  /**
   * Render Header
   */
  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back-outline"
            size={24}
            color={dark ? COLORS.white : COLORS.black}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { 
          color: dark? COLORS.white : COLORS.greyscale900
        }]}>Payment Methods</Text>
        <TouchableOpacity>
          <Text style={styles.createTitle}>{"   "}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const handleCheckboxPress = (itemTitle) => {
    if (selectedItem === itemTitle) {
      setSelectedItem(null);
    } else {
      setSelectedItem(itemTitle);
    }
  };

  // Process payment and create booking
  const handleProcessPayment = async () => {
    if (!selectedItem) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    setLoading(true);
    try {
      // For testing, we'll create the booking directly
      console.log('Creating booking with data:', bookingData);
      
      const result = await createBooking(bookingData);
      
      if (result) {
        console.log('Booking created successfully:', result);
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Booking creation failed:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    return (
      <View style={{ marginVertical: 12 }}>
        <PaymentMethodItem
          checked={selectedItem === 'Visa Card'}
          onPress={() => handleCheckboxPress('Visa Card')}
          title="Visa Card"
          icon={icons.creditCard}
        />
        <PaymentMethodItem
          checked={selectedItem === 'Paypal'}
          onPress={() => handleCheckboxPress('Paypal')}
          title="Paypal"
          icon={icons.paypal}
        />
        <PaymentMethodItem
          checked={selectedItem === 'Apple Pay'}
          onPress={() => handleCheckboxPress('Apple Pay')}
          title="Apple Pay"
          icon={icons.appleLogo}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate("AddNewPaymentMethod")}
          style={[styles.addBtn, { 
            borderColor: dark ? COLORS.secondaryWhite : COLORS.gray,
          }]}>
          <AntDesign name="pluscircleo" size={24} color="#BABABA" />
          <Text style={[styles.addBtnText, { 
            color: dark? COLORS.white : COLORS.grayscale700,
          }]}>Add more</Text>
        </TouchableOpacity>
      </View>
    )
  }

  /**
   * Render Bottom Content
   */
  const renderBottomContent = () => {
    return (
      <View style={styles.bottomContainer}>
        <View style={styles.bottomLeft}>
          <Text style={[styles.total, { 
             color: dark ? COLORS.grayscale200 : "#767676",
          }]}>Total:</Text>
          <Text style={[styles.totalPrice, { 
            color: dark? COLORS.white : COLORS.greyscale900,
          }]}> ${price || 125}</Text>
        </View>
        <TouchableOpacity
          onPress={handleProcessPayment}
          style={[styles.bottomBtn, loading && styles.bottomBtnDisabled]}
          disabled={loading}>
          <Text style={styles.bottomBtnText}>
            {loading ? 'Processing...' : 'Process Payment'}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Render Success Modal
  const renderSuccessModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}>
        <TouchableWithoutFeedback
          onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalSubContainer, { 
               backgroundColor: dark ? COLORS.dark2 : COLORS.white,
            }]}>
              <Image
                source={icons.checked}
                resizeMode='contain'
                style={styles.successIcon}
              />
              <Text style={[styles.modalTitle, { 
                color: dark? COLORS.white : COLORS.greyscale900,
              }]}>Booking Successfully!</Text>
              <Text style={[styles.modalSubtitle, { 
                color: dark ? COLORS.grayscale200 : "#6C6C6C",
              }]}>Your booking has been confirmed. The service provider will be notified.</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  // Navigate to home or bookings list
                  navigation.navigate("Main");
                }}
                style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Go to Bookings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <ScrollView>
          {renderContent()}
          
          {/* Show booking summary for testing */}
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
              }]}>{serviceName || 'Service'}</Text>
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
              }]}>Duration:</Text>
              <Text style={[styles.summaryValue, {
                color: dark ? COLORS.white : COLORS.greyscale900
              }]}>{workingHours || 2} hours</Text>
            </View>
          </View>
        </ScrollView>
        {renderBottomContent()}
      </View>
      {renderSuccessModal()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "bold",
    color: COLORS.black,
  },
  createTitle: {
    fontFamily: "bold",
    color: COLORS.primary,
    fontSize: 16,
  },
  headerIconContainer: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#E5E9EF",
    borderRadius: 7.7,
    borderWidth: 1
  },
  addBtn: {
    height: 64,
    width: SIZES.width - 32,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderColor: COLORS.gray,
    borderWidth: .4,
    borderRadius: 30
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: "medium",
    marginLeft: 12
  },
  bottomContainer: {
    position: "absolute",
    bottom: 12,
    width: SIZES.width - 32,
    right: 16,
    left: 16,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  bottomLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  total: {
    fontSize: 12,
    color: "#767676",
    fontFamily: "regular"
  },
  totalPrice: {
    fontSize: 22,
    fontFamily: "bold",
    color: COLORS.black
  },
  bottomBtn: {
    width: 175,
    height: 50,
    borderRadius: 30,
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
  modalContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)"
  },
  modalSubContainer: {
    height: 400,
    width: SIZES.width * 0.86,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "bold",
    color: COLORS.black,
    textAlign: "center",
    marginVertical: 16
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: "regular",
    color: "#6C6C6C",
    textAlign: "center",
    marginVertical: 16
  },
  modalBtn: {
    width: SIZES.width * 0.72,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 30
  },
  modalBtnText: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: COLORS.white
  },
  successIcon: {
    width: 125,
    height: 125,
    tintColor: COLORS.primary
  },
  summaryCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: "semiBold",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: "regular",
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "semiBold",
  },
})

export default PaymentMethods