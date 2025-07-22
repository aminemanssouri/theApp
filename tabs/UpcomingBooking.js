import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { SIZES, COLORS } from '../constants';
import RBSheet from "react-native-raw-bottom-sheet";
import { useTheme } from '../theme/ThemeProvider';
import { getUpcomingBookings, cancelBooking } from '../lib/services/booking';
import Button from '../components/Button';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator } from 'react-native';
import { FontAwesome } from "@expo/vector-icons";
import { supabase } from '../lib/supabase';

const UpcomingBooking = forwardRef((props, ref) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  
  // Debug auth context
  const authContext = useAuth();
 
  
  const { user, loading: authLoading } = authContext;
  const refRBSheet = useRef();
  const { dark } = useTheme();
  const navigation = useNavigation();  // Debug the current auth state
  
  const fetchBookings = async () => {
    try {
    
      setLoading(true);
      
      const data = await getUpcomingBookings(user.id);
   
      setBookings(data || []);
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh method to parent component
  useImperativeHandle(ref, () => ({
    refreshData: fetchBookings
  }));


  useEffect(() => {
    let mounted = true;
    
    const initFetch = async () => {
      // Only proceed when auth is finished AND we have a user
      if (!authLoading && user?.id && mounted) {
        await fetchBookings();
      } else if (!authLoading && !user?.id && mounted) {
        // No user but auth completed
        setLoading(false);
      }
    };
    
    initFetch();
    
    return () => {
      mounted = false;
    };
  }, [user?.id, authLoading]);

  const openCancelSheet = (booking) => {
    setSelectedBooking(booking);
    refRBSheet.current.open();
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || !user?.id) return;
    
    try {
      setCancelling(true);
      
      // Call the backend function to cancel the booking
      const result = await cancelBooking(selectedBooking.id, user.id, "User cancelled booking");
      
      console.log('✅ Booking cancellation result:', result);
      
      // Close the bottom sheet
      refRBSheet.current.close();
      
      // Show success message with cancellation fee info if applicable
      let alertMessage = "Your booking has been cancelled successfully.";
      
      if (result && result.cancellation_fee) {
        alertMessage += `\n\nA cancellation fee of €${result.cancellation_fee} applies due to late cancellation (within 24 hours of service time).`;
      } else {
        alertMessage += "\n\nA refund of 80% will be processed according to our policy.";
      }
      
      Alert.alert(
        "Booking Cancelled",
        alertMessage,
        [{ text: "OK" }]
      );
      
      // Refresh the bookings list to reflect the change
      await fetchBookings();
      
    } catch (error) {
      console.error('❌ Error cancelling booking:', error);
      
      // Show specific error message from backend or generic message
      const errorMessage = error.message || "Failed to cancel the booking. Please try again or contact support.";
      
      Alert.alert(
        "Cancellation Failed", 
        errorMessage,
        [{ text: "OK" }]
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={[styles.container, {
        backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite,
        justifyContent: 'center',
        alignItems: 'center'
      }]}>
        <Text style={[styles.name, {
          color: dark ? COLORS.secondaryWhite : COLORS.greyscale900,
          textAlign: 'center',
          marginBottom: 8
        }]}>No Upcoming Bookings</Text>
        <Text style={[styles.address, {
          color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
          textAlign: 'center',
          marginBottom: 20
        }]}>You don't have any upcoming bookings at the moment.</Text>
        
  
      </View>
    );
  }

  return (
    <View style={[styles.container, {
      backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite
    }]}>
      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.cardContainer, {
              backgroundColor: dark ? COLORS.dark2 : COLORS.white,
            }]}
            onPress={() => navigation.navigate("BookingDetail", { id: item.id })}
          >
            {/* Rest of your rendering code remains the same */}
            <View style={styles.detailsContainer}>
              <View>
                <Image
                  source={
                    item.worker?.profile_picture 
                      ? { uri: item.worker.profile_picture }
                      : require('../assets/images/users/user1.jpeg')
                  }
                  resizeMode='cover'
                  style={styles.serviceImage}
                />
                <View style={styles.reviewContainer}>
                  <FontAwesome name="star" size={12} color="orange" />
                  <Text style={styles.rating}>{item.worker?.average_rating || "N/A"}</Text>
                </View>
              </View>
              <View style={styles.detailsRightContainer}>
                <Text style={[styles.name, {
                  color: dark ? COLORS.secondaryWhite : COLORS.greyscale900
                }]}>
                  {item.worker?.first_name && item.worker?.last_name
                    ? `${item.worker.first_name} ${item.worker.last_name}`
                    : "Service Provider"}
                </Text>
                <Text style={[styles.address, {
                  color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
                }]}>{item.address}, {item.city}</Text>
                <View style={styles.priceContainer}>
                  <View style={styles.priceItemContainer}>
                    <Text style={styles.totalPrice}>€{item.total_amount}</Text>
                  </View>
                  <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={[styles.separateLine, {
              marginVertical: 10,
              backgroundColor: dark ? COLORS.greyScale800 : COLORS.grayscale200,
            }]} />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => openCancelSheet(item)}
                style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("EReceipt", { bookingId: item.id })}
                style={styles.receiptBtn}>
                <Text style={styles.receiptBtnText}>View E-Receipt</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
      <RBSheet
        ref={refRBSheet}
        closeOnDragDown={true}
        closeOnPressMask={false}
        height={332}
        customStyles={{
          wrapper: {
            backgroundColor: "rgba(0,0,0,0.5)",
          },
          draggableIcon: {
            backgroundColor: dark ? COLORS.greyscale300 : COLORS.greyscale300,
          },
          container: {
            borderTopRightRadius: 32,
            borderTopLeftRadius: 32,
            height: 332,
            backgroundColor: dark ? COLORS.dark2 : COLORS.white,
            alignItems: "center",
            width: "100%"
          }
        }}>
        {/* Bottom sheet content remains the same */}
        <Text style={[styles.bottomSubtitle, {
          color: dark ? COLORS.red : COLORS.red
        }]}>Cancel Booking</Text>
        <View style={[styles.separateLine, {
          backgroundColor: dark ? COLORS.greyScale800 : COLORS.grayscale200,
        }]} />

        <View style={styles.selectedCancelContainer}>
          <Text style={[styles.cancelTitle, {
            color: dark ? COLORS.secondaryWhite : COLORS.greyscale900
          }]}>Are you sure you want to cancel your booking?</Text>
          <Text style={[styles.cancelSubtitle, {
            color: dark ? COLORS.grayscale400 : COLORS.grayscale700
          }]}>Only 80% of the money you can refund from your payment according to our policy.</Text>
        </View>

        <View style={styles.bottomContainer}>
          <Button
            title="Cancel"
            style={{
              width: (SIZES.width - 32) / 2 - 8,
              backgroundColor: dark ? COLORS.dark3 : COLORS.tansparentPrimary,
              borderRadius: 32,
              borderColor: dark ? COLORS.dark3 : COLORS.tansparentPrimary
            }}
            textColor={dark ? COLORS.white : COLORS.primary}
            onPress={() => refRBSheet.current.close()}
          />
          <Button
            title={cancelling ? "Cancelling..." : "Yes, Cancel"}
            filled
            style={styles.removeButton}
            disabled={cancelling}
            onPress={handleCancelBooking}
          />
        </View>
      </RBSheet>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.tertiaryWhite,
    paddingTop: 0,
    marginTop: 0,
  },
  cardContainer: {
    width: SIZES.width - 32,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 16
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 16,
    fontFamily: "bold",
    color: COLORS.greyscale900
  },
  statusContainer: {
    width: 54,
    height: 24,
    borderRadius: 6,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    borderColor: COLORS.primary,
    borderWidth: 1
  },
  statusText: {
    fontSize: 10,
    color: COLORS.primary,
    fontFamily: "medium",
  },
  separateLine: {
    width: "100%",
    height: .7,
    backgroundColor: COLORS.greyScale800,
    marginVertical: 12
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceImage: {
    width: 88,
    height: 88,
    borderRadius: 16,
    marginHorizontal: 12
  },
  detailsRightContainer: {
    flex: 1,
    marginLeft: 12
  },
  name: {
    fontSize: 17,
    fontFamily: "bold",
    color: COLORS.greyscale900
  },
  address: {
    fontSize: 12,
    fontFamily: "regular",
    color: COLORS.grayscale700,
    marginVertical: 6
  },
  serviceTitle: {
    fontSize: 12,
    fontFamily: "regular",
    color: COLORS.grayscale700,
  },
  serviceText: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: "medium",
    marginTop: 6
  },
  cancelBtn: {
    width: (SIZES.width - 32) / 2 - 16,
    height: 36,
    borderRadius: 24,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    borderColor: COLORS.primary,
    borderWidth: 1.4,
    marginBottom: 12
  },
  cancelBtnText: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: COLORS.primary,
  },
  receiptBtn: {
    width: (SIZES.width - 32) / 2 - 16,
    height: 36,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    borderColor: COLORS.primary,
    borderWidth: 1.4,
    marginBottom: 12
  },
  receiptBtnText: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: COLORS.white,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  remindMeText: {
    fontSize: 12,
    fontFamily: "regular",
    color: COLORS.grayscale700,
    marginVertical: 4
  },
  switch: {
    marginLeft: 8,
    transform: [{ scaleX: .8 }, { scaleY: .8 }], // Adjust the size of the switch
  },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
    paddingHorizontal: 16,
    width: "100%"
  },
  cancelButton: {
    width: (SIZES.width - 32) / 2 - 8,
    backgroundColor: COLORS.tansparentPrimary,
    borderRadius: 32
  },
  removeButton: {
    width: (SIZES.width - 32) / 2 - 8,
    backgroundColor: COLORS.primary,
    borderRadius: 32
  },
  bottomTitle: {
    fontSize: 24,
    fontFamily: "semiBold",
    color: "red",
    textAlign: "center",
  },
  bottomSubtitle: {
    fontSize: 22,
    fontFamily: "bold",
    color: COLORS.greyscale900,
    textAlign: "center",
    marginVertical: 12
  },
  selectedCancelContainer: {
    marginVertical: 24,
    paddingHorizontal: 36,
    width: "100%"
  },
  cancelTitle: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.greyscale900,
    textAlign: "center",
  },
  cancelSubtitle: {
    fontSize: 14,
    fontFamily: "regular",
    color: COLORS.grayscale700,
    textAlign: "center",
    marginVertical: 8,
    marginTop: 16
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6
  },
  totalPrice: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.primary,
    textAlign: "center",
  },
  duration: {
    fontSize: 12,
    fontFamily: "regular",
    color: COLORS.grayscale700,
    textAlign: "center",
  },
  priceItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,

  },
  reviewContainer: {
    position: "absolute",
    top: 6,
    right: 16,
    width: 46,
    height: 20,
    borderRadius: 16,
    backgroundColor: COLORS.transparentWhite2,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  rating: {
    fontSize: 12,
    fontFamily: "semiBold",
    color: COLORS.primary,
    marginLeft: 4
  },

})

export default UpcomingBooking;