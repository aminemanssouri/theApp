import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { SIZES, COLORS } from '../constants';
import { useTheme } from '../theme/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getCompletedBookings } from '../lib/services/booking';
import { FontAwesome } from "@expo/vector-icons";
import { t } from '../context/LanguageContext';

const CompletedBooking = forwardRef((props, ref) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { dark } = useTheme();
  const navigation = useNavigation();
  const { user, loading: authLoading } = useAuth();

  const fetchCompletedBookings = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await getCompletedBookings(user.id);
      console.log('📊 Completed bookings:', data?.length || 0);
      setBookings(data || []);
    } catch (error) {
      console.error('❌ Error fetching completed bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh method to parent component
  useImperativeHandle(ref, () => ({
    refreshData: fetchCompletedBookings
  }));

  useEffect(() => {
    let mounted = true;
    
    const initFetch = async () => {
      if (!authLoading && user?.id && mounted) {
        await fetchCompletedBookings();
      } else if (!authLoading && !user?.id && mounted) {
        setLoading(false);
      }
    };
    
    initFetch();
    
    return () => {
      mounted = false;
    };
  }, [user?.id, authLoading]);

  if (loading) {
    return (
      <View style={[styles.container, {
        backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite,
        justifyContent: 'center',
        alignItems: 'center'
      }]}>
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
        <Text style={{
          color: dark ? COLORS.secondaryWhite : COLORS.greyscale900,
          textAlign: 'center',
          marginBottom: 8,
          fontSize: 18,
          fontFamily: 'bold'
        }}>{t('booking.empty.completed_title')}</Text>
        <Text style={{
          color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
          textAlign: 'center'
        }}>{t('booking.empty.completed_sub')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {
      backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite
    }]}>
      <FlatList
        data={bookings} // Use 'bookings' instead of 'upcomingBookings'
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.cardContainer, {
              backgroundColor: dark ? COLORS.dark2 : COLORS.white,
            }]}
            onPress={() => navigation.navigate("BookingDetails", { id: item.id })}
          >
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
                    <Text style={styles.totalPrice}>€{item.total_amount || item.price}</Text>
                  </View>
                  <View style={styles.statusContainer}>
                    <Text 
                      style={styles.statusText}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                    >
                      {t('booking.status.completed')}
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
                onPress={() => navigation.navigate("EReceipt", { bookingId: item.id })}
                style={styles.receiptBtn}>
                <Text style={styles.receiptBtnText}>{t('booking.actions.view_e_receipt')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
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
    width: (SIZES.width - 32) - 12,
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

export default CompletedBooking