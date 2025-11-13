import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Modal, TouchableWithoutFeedback, FlatList, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';
import QRCode from 'react-native-qrcode-svg';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../theme/ThemeProvider';
import { getBookingDetails } from '../lib/services/booking';
import { useAuth } from '../context/AuthContext';

const EReceipt = ({ navigation, route }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const { colors, dark } = useTheme();
  const { user } = useAuth();
  
  // Get the bookingId from navigation params
  const bookingId = route.params?.bookingId;

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!bookingId) {
        Alert.alert('Error', 'Booking ID not provided');
        navigation.goBack();
        return;
      }

      try {
        setLoading(true);
        const bookingData = await getBookingDetails(bookingId);
        console.log('📄 Booking details for receipt:', bookingData);
        setBooking(bookingData);
      } catch (error) {
        console.error('❌ Error fetching booking details:', error);
        Alert.alert('Error', 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [bookingId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: dark ? COLORS.white : COLORS.black }}>Loading receipt...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: dark ? COLORS.white : COLORS.black }}>Booking not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
            <Text style={{ color: COLORS.primary }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const dropdownItems = [
    { label: 'Share E-Receipt', value: 'share', icon: icons.shareOutline },
    { label: 'Download E-Receipt', value: 'downloadEReceipt', icon: icons.download2 },
    { label: 'Print', value: 'print', icon: icons.documentOutline },
  ];

  const handleDropdownSelect = (item) => {
    setSelectedItem(item.value);
    setModalVisible(false);

    // Perform actions based on the selected item
    switch (item.value) {
      case 'share':
        // Handle Share action
        setModalVisible(false);
        navigation.navigate("Home")
        break;
      case 'downloadEReceipt':
        // Handle Download E-Receipt action
        setModalVisible(false);
        navigation.navigate("Home")
        break;
      case 'print':
        // Handle Print action
        setModalVisible(false)
        navigation.navigate("Home")
        break;
      default:
        break;
    }
  };
  /**
    * Render Header
    */
  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}>
            <Image
              source={icons.arrowBack}
              resizeMode='contain'
              style={[styles.backIcon, { 
                tintColor: dark ? COLORS.white : COLORS.black
              }]} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { 
             color: dark ? COLORS.white : COLORS.black
          }]}>E-Receipt</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Image
            source={icons.moreCircle}
            resizeMode='contain'
            style={[styles.moreIcon, { 
              tintColor: dark ? COLORS.secondaryWhite : COLORS.black
            }]}
          />
        </TouchableOpacity>
      </View>
    )
  }
  /**
   * Render content
   */
  const renderContent = () => {
    const transactionId = booking?.booking?.id || 'N/A'; // Use booking ID as transaction ID
    const bookingDate = booking?.booking?.booking_date ? new Date(booking.booking.booking_date).toLocaleDateString() : 'N/A';
    const bookingTime = booking?.booking?.start_time || 'N/A';
    const endTime = booking?.booking?.end_time || 'N/A';

    const handleCopyToClipboard = async () => {
      await Clipboard.setStringAsync(transactionId);
      Alert.alert('Copied!', 'Transaction ID copied to clipboard.');
    };

    return (
      <View style={{ marginVertical: 22 }}>
        {/* QR Code with booking information */}
        <View style={{ 
          alignItems: 'center', 
          marginBottom: 40,
          padding: 20,
          backgroundColor: dark ? COLORS.dark1 : COLORS.white,
          borderRadius: 12
        }}>
          <QRCode
            value={JSON.stringify({
              bookingId: booking?.booking?.id,
              service: booking?.service?.name,
              worker: `${booking?.worker?.first_name} ${booking?.worker?.last_name}`,
              date: booking?.booking?.booking_date,
              time: booking?.booking?.start_time,
              amount: booking?.booking?.total_amount,
              status: booking?.booking?.status
            })}
            size={200}
            color={dark ? COLORS.white : COLORS.black}
            backgroundColor={dark ? COLORS.dark1 : COLORS.white}
            quietZone={10}
          />
          <Text style={{ 
            marginTop: 12, 
            fontSize: 12, 
            color: COLORS.gray,
            textAlign: 'center'
          }}>
            Scan to verify booking
          </Text>
        </View>
        <View style={[styles.summaryContainer, {
          backgroundColor: dark ? COLORS.dark2 : COLORS.white,
          borderRadius: 6,
        }]}>
          <View style={styles.viewContainer}>
            <Text style={styles.viewLeft}>Services</Text>
            <Text style={[styles.viewRight, { 
               color: dark ? COLORS.white : COLORS.black
            }]}>{booking?.service?.name || 'N/A'}</Text>
          </View>
          <View style={styles.viewContainer}>
            <Text style={styles.viewLeft}>Category</Text>
            <Text style={[styles.viewRight, {
               color: dark ? COLORS.white : COLORS.black
            }]}>{booking?.service?.category || 'Service'}</Text>
          </View>
          <View style={styles.viewContainer}>
            <Text style={styles.viewLeft}>Workers</Text>
            <Text style={[styles.viewRight, { 
               color: dark ? COLORS.white : COLORS.black
            }]}>
              {booking?.worker?.first_name && booking?.worker?.last_name 
                ? `${booking.worker.first_name} ${booking.worker.last_name}`
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.viewContainer}>
            <Text style={styles.viewLeft}>Date & Time</Text>
            <Text style={[styles.viewRight, { 
               color: dark ? COLORS.white : COLORS.black
            }]}>{bookingDate} | {bookingTime}</Text>
          </View>
          <View style={styles.viewContainer}>
            <Text style={styles.viewLeft}>Address</Text>
            <Text style={[styles.viewRight, { 
               color: dark ? COLORS.white : COLORS.black
            }]}>{booking?.booking?.address || 'N/A'}, {booking?.booking?.city || ''}</Text>
          </View>
        </View>

        <View style={[styles.summaryContainer, {
         backgroundColor: dark ? COLORS.dark2 : COLORS.white,
         borderRadius: 6,
        }]}>
          <View style={styles.viewContainer}>
            <Text style={styles.viewLeft}>Name</Text>
            <Text style={[styles.viewRight,{
               color: dark ? COLORS.white : COLORS.black
            }]}>{user?.user_metadata?.full_name || user?.email || 'N/A'}</Text>
          </View>
          <View style={styles.viewContainer}>
            <Text style={styles.viewLeft}>Phone</Text>
            <Text style={[styles.viewRight, { 
               color: dark ? COLORS.white : COLORS.black
            }]}>{user?.user_metadata?.phone || 'N/A'}</Text>
          </View>
          <View style={styles.viewContainer}>
            <Text style={styles.viewLeft}>Email</Text>
            <Text style={[styles.viewRight, { 
               color: dark ? COLORS.white : COLORS.black
            }]}>{user?.email || 'N/A'}</Text>
          </View>
          <View style={styles.viewContainer}>
            <Text style={styles.viewLeft}>Status</Text>
            <Text style={[styles.viewRight, { 
               color: dark ? COLORS.white : COLORS.black
            }]}>{booking?.booking?.status || 'N/A'}</Text>
          </View>
        </View>
        <View style={[styles.summaryContainer, {
          backgroundColor: dark ? COLORS.dark2 : COLORS.white,
          borderRadius: 6,
        }]}>
          <View style={styles.viewContainer}>
            <Text style={styles.viewLeft}>Service Price</Text>
            <Text style={[styles.viewRight, { 
               color: dark ? COLORS.white : COLORS.black
            }]}>€{booking?.booking?.price || '0'}</Text>
          </View>
          
          {/* Display Addons */}
          {booking?.addons && booking.addons.length > 0 && (
            <>
              <View style={{ marginVertical: 8 }}>
                <Text style={[styles.viewLeft, { fontWeight: 'bold', fontSize: 14 }]}>Addons:</Text>
              </View>
              {booking.addons.map((addon, index) => (
                <View key={index} style={styles.viewContainer}>
                  <Text style={[styles.viewLeft, { paddingLeft: 10 }]}>
                    {addon.addon?.name || 'Addon'} (x{addon.quantity})
                  </Text>
                  <Text style={[styles.viewRight, { 
                    color: dark ? COLORS.white : COLORS.black
                  }]}>€{(addon.price * addon.quantity).toFixed(2)}</Text>
                </View>
              ))}
            </>
          )}
          
          <View style={styles.viewContainer}>
            <Text style={styles.viewLeft}>Admin Fee</Text>
            <Text style={[styles.viewRight, { 
               color: dark ? COLORS.white : COLORS.black
            }]}>€{booking?.booking?.admin_fee || '0'}</Text>
          </View>
          
          <View style={[styles.viewContainer, { borderTopWidth: 1, borderTopColor: COLORS.grayscale400, marginTop: 8, paddingTop: 8 }]}>
            <Text style={[styles.viewLeft, { fontWeight: 'bold', fontSize: 16 }]}>Total Amount</Text>
            <Text style={[styles.viewRight, { 
               color: dark ? COLORS.white : COLORS.black,
               fontWeight: 'bold',
               fontSize: 16
            }]}>€{booking?.booking?.total_amount || '0'}</Text>
          </View>
          
          <View style={styles.viewContainer}>
            <Text style={styles.viewLeft}>Payment Methods</Text>
            <Text style={[styles.viewRight, { 
               color: dark ? COLORS.white : COLORS.black
            }]}>Credit Card</Text>
          </View>
          <View style={styles.viewContainer}>
            <Text style={styles.viewLeft}>Created Date</Text>
            <Text style={[styles.viewRight, { 
               color: dark ? COLORS.white : COLORS.black
            }]}>
              {booking?.booking?.created_at 
                ? new Date(booking.booking.created_at).toLocaleString()
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.viewContainer}>
            <Text style={styles.viewLeft}>Status</Text>
            <TouchableOpacity style={[styles.statusBtn, {
              backgroundColor: booking?.booking?.status === 'completed' ? COLORS.green :
                              booking?.booking?.status === 'confirmed' ? COLORS.primary :
                              booking?.booking?.status === 'pending' ? COLORS.orange :
                              booking?.booking?.status === 'cancelled' ? COLORS.red : COLORS.gray
            }]}>
              <Text style={styles.statusBtnText}>
                {booking?.booking?.status?.charAt(0).toUpperCase() + booking?.booking?.status?.slice(1) || 'Unknown'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }
  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <ScrollView
         style={[styles.scrollView, { backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite }]}
          showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>
      </View>
      {/* Modal for dropdown selection */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={{ flex: 1 }}>
            <View style={{ 
              position: "absolute", 
              top: 112, 
              right: 12,
              width: 202,
              padding: 16,
              backgroundColor: dark ? COLORS.dark2 : COLORS.tertiaryWhite,
              borderRadius: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5
            }}>
              <FlatList
                data={dropdownItems}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: 'center',
                      marginVertical: 12
                    }}
                    onPress={() => handleDropdownSelect(item)}>
                    <Image
                      source={item.icon}
                      resizeMode='contain'
                      style={{
                        width: 20,
                        height: 20,
                        marginRight: 16,
                        tintColor: dark ? COLORS.white : COLORS.black
                      }}
                    />
                    <Text style={{
                      fontSize: 14,
                      fontFamily: "semiBold",
                      color: dark ? COLORS.white : COLORS.black
                    }}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    backgroundColor: COLORS.white,
    padding: 16
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16
  },
  scrollView: {
    backgroundColor: COLORS.tertiaryWhite
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  backIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.black,
    marginRight: 16
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "bold",
    color: COLORS.black
  },
  moreIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.black
  },
  summaryContainer: {
    width: SIZES.width - 32,
    backgroundColor: COLORS.white,
    alignItems: "center",
    padding: 16,
    marginVertical: 8
  },
  viewContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginVertical: 12
  },
  viewLeft: {
    fontSize: 12,
    fontFamily: "regular",
    color: "gray"
  },
  viewRight: {
    fontSize: 14,
    fontFamily: "medium",
    color: COLORS.black
  },
  copyContentContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  statusBtn: {
    width: 72,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.tansparentPrimary,
    borderRadius: 6
  },
  statusBtnText: {
    fontSize: 12,
    fontFamily: "medium",
    color: COLORS.primary
  }
})

export default EReceipt