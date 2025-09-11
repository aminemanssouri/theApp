import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Image, Modal } from 'react-native'
import React, { useState } from 'react'
import { COLORS, SIZES, icons } from '../constants'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, AntDesign } from "@expo/vector-icons"
import { ScrollView } from 'react-native-virtualized-view'
import PaymentMethodItem from '../components/PaymentMethodItem'
import { useTheme } from '../theme/ThemeProvider'
import { t } from '../context/LanguageContext'

const PaymentMethod = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { colors, dark } = useTheme();

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
        }]}>{t('payment.payment_methods_title')}</Text>
        <TouchableOpacity>
          <Text style={styles.createTitle}>{"   "}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderContent = () => {
    const [selectedItem, setSelectedItem] = useState(null);

    const handleCheckboxPress = (itemTitle) => {
      if (selectedItem === itemTitle) {
        // If the clicked item is already selected, deselect it
        setSelectedItem(null);
      } else {
        // Otherwise, select the clicked item
        setSelectedItem(itemTitle);
      }
    };
    return (
      <View style={{ marginVertical: 12 }}>
        <PaymentMethodItem
          checked={selectedItem === 'add_card'}
          onPress={() => handleCheckboxPress('add_card')}
          title={t('settings.payment.add_new_card')}
          icon={icons.creditCard}
        />
        <PaymentMethodItem
          checked={selectedItem === 'paypal'}
          onPress={() => handleCheckboxPress('paypal')}
          title={t('payment.paypal')}
          icon={icons.paypal}
        />
        <PaymentMethodItem
          checked={selectedItem === 'apple'}
          onPress={() => handleCheckboxPress('apple')}
          title={t('payment.apple_pay')}
          icon={icons.appleLogo}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate("AddNewPaymentMethod")}
          style={[styles.addBtn, { 
            borderColor: dark? COLORS.white : COLORS.gray,
          }]}>
          <AntDesign name="pluscircleo" size={24} color="#BABABA" />
          <Text style={[styles.addBtnText, { 
            color: dark? COLORS.white : COLORS.grayscale700,
          }]}>{t('payment.add_more')}</Text>
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
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.bottomBtn}>
          <Text style={styles.bottomBtnText}>{t('common.save')}</Text>
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
              backgroundColor: dark? COLORS.dark2 : COLORS.white,
            }]}>
              <Image
                source={icons.checked}
                resizeMode='contain'
                style={styles.successIcon}
              />
              <Text style={[styles.modalTitle, { 
                color: dark? COLORS.white : COLORS.black
              }]}>{t('common.saved_successfully')}</Text>
              <Text style={[styles.modalSubtitle, { 
                  color: dark ? COLORS.grayscale200 : "#6C6C6C",
              }]}>{t('payment.methods_saved_message')}</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false)
                  navigation.navigate("Main")
                }}
                style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>{t('common.continue')}</Text>
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
    width: SIZES.width - 32,
    height: 50,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary
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
  }
})
export default PaymentMethod