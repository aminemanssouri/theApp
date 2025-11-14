import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { SIZES, COLORS, images } from '../constants';
import RBSheet from "react-native-raw-bottom-sheet";
import { useTheme } from '../theme/ThemeProvider';
import { getUpcomingBookings, cancelBooking } from '../lib/services/booking';
import Button from '../components/Button';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator } from 'react-native';
import { FontAwesome } from "@expo/vector-icons";
import { supabase } from '../lib/supabase';
import { t } from '../context/LanguageContext';

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
      let alertMessage = t('booking.alerts.cancel_success_msg');
      
      if (result && result.cancellation_fee) {
        alertMessage += `\n\n${t('booking.alerts.cancel_success_fee_note', { fee: result.cancellation_fee })}`;
      } else {
        alertMessage += `\n\n${t('booking.alerts.cancel_success_refund_note')}`;
      }
      
      Alert.alert(
        t('booking.alerts.cancel_success_title'),
        alertMessage,
        [{ text: t('common.ok') }]
      );
      
      // Refresh the bookings list to reflect the change
      await fetchBookings();
      
    } catch (error) {
      console.error('❌ Error cancelling booking:', error);
      
      // Show specific error message from backend or generic message
      const errorMessage = error.message || t('booking.alerts.cancel_failed_generic');
      
      Alert.alert(
        t('booking.alerts.cancel_failed_title'), 
        errorMessage,
        [{ text: t('common.ok') }]
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
        }]}>{t('booking.empty.upcoming_title')}</Text>
        <Text style={[styles.address, {
          color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
          textAlign: 'center',
          marginBottom: 20
        }]}>{t('booking.empty.upcoming_sub')}</Text>
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
                      : images.avatarurl
                  }
                  resizeMode='cover'
                  style={styles.serviceImage}
                />
                <View style={styles.reviewContainer}>
                  <FontAwesome name="star" size={12} color="orange" />
                  <Text style={styles.rating}>{item.worker?.average_rating || t('common.not_available')}</Text>
                </View>
              </View>
              <View style={styles.detailsRightContainer}>
                <Text style={[styles.name, {
                  color: dark ? COLORS.secondaryWhite : COLORS.greyscale900
                }]}>
                  {item.worker?.first_name && item.worker?.last_name
                    ? `${item.worker.first_name} ${item.worker.last_name}`
                    : t('chat.service_provider')}
                </Text>
                <Text style={[styles.address, {
                  color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
                }]}>{item.address}, {item.city}</Text>
                <View style={styles.priceContainer}>
                  <View style={styles.priceItemContainer}>
                    <Text style={styles.totalPrice}>€{item.total_amount}</Text>
                  </View>
                  <View style={styles.statusContainer}>
                    <Text 
                      style={styles.statusText}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                    >
                      {item.status === 'confirmed' 
                        ? t('booking.status.confirmed') 
                        : item.status === 'pending' 
                        ? t('booking.status.pending') 
                        : item.status === 'cancelled' 
                        ? t('booking.status.cancelled') 
                        : (item.status || t('common.not_available'))}
                    </Text>
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
                style={[styles.cancelBtn, { backgroundColor: COLORS.red }]}>
                <FontAwesome name="times-circle" size={20} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("EReceipt", { bookingId: item.id })}
                style={styles.receiptBtn}>
                <FontAwesome name="file-text-o" size={20} color={COLORS.white} />
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
        }]}>{t('booking.actions.cancel_booking')}</Text>

        <View style={[styles.separateLine, {
          backgroundColor: dark ? COLORS.greyScale800 : COLORS.grayscale200,
        }]} />

        <View style={styles.selectedCancelContainer}>
          <Text style={[styles.cancelTitle, {
            color: dark ? COLORS.secondaryWhite : COLORS.greyscale900
          }]}>{t('booking.alerts.cancel_confirm_title')}</Text>
          <Text style={[styles.cancelSubtitle, {
            color: dark ? COLORS.grayscale400 : COLORS.grayscale700
          }]}>{t('booking.alerts.cancel_policy_note')}</Text>

        </View>

        <View style={styles.bottomContainer}>
          <Button
            title={t('common.cancel')}
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
            title={cancelling ? t('booking.actions.cancelling') : t('booking.actions.yes_cancel')}
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
    minHeight: 24,
    borderRadius: 6,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 12
  },
  cancelBtnText: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: COLORS.white,
  },
  receiptBtn: {
    width: (SIZES.width - 32) / 2 - 16,
    height: 36,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
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