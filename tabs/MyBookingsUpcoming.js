import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';

import { COLORS,images } from '../constants';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { getUpcomingBookings } from '../lib/services/booking';
import { useAuth } from '../context/AuthContext';
import { FontAwesome } from "@expo/vector-icons";
import { t } from '../context/LanguageContext';

const MyBookingsUpcoming = forwardRef((props, ref) => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUpcomingBookings = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await getUpcomingBookings(user.id);
      console.log('📊 Upcoming bookings:', data?.length || 0);
      setBookings(data || []);
    } catch (error) {
      console.error('❌ Error fetching upcoming bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh method to parent component
  useImperativeHandle(ref, () => ({
    refreshData: fetchUpcomingBookings
  }));

  useEffect(() => {
      let mounted = true;
      
      const initFetch = async () => {
        // Only proceed when auth is finished AND we have a user
        if (!authLoading && user?.id && mounted) {
          await fetchUpcomingBookings();
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

  // Refetch when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      if (!authLoading && user?.id) {
        fetchUpcomingBookings();
      }
    }, [authLoading, user?.id])
  );

  const onRefresh = async () => {
    if (!user?.id) return;
    try {
      setRefreshing(true);
      await fetchUpcomingBookings();
    } finally {
      setRefreshing(false);
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
        justifyContent: 'center',
        alignItems: 'center'
      }]}>
        <Text style={[styles.itemName, {
          color: dark ? COLORS.white : COLORS.greyscale900,
          textAlign: 'center',
          marginBottom: 8
        }]}>{t('booking.empty.upcoming_title')}</Text>
        <Text style={[styles.itemDate, {
          color: dark ? COLORS.grayscale200 : COLORS.grayscale700,
          textAlign: 'center'
        }]}>{t('booking.empty.upcoming_sub')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        showsVerticalScrollIndicator={false}
        keyExtractor={item => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item, index }) => (
          <View style={styles.itemContainer}>
            <View style={styles.statusContainer}>
              <Text style={[styles.typeText, { 
                color: dark ? COLORS.white : COLORS.greyscale900
              }]}>{item.service?.name || t('payment.service')}</Text>
              <Text style={[styles.statusText, { 
                color: item.status === "confirmed" ? COLORS.green : 
                      item.status === "pending" ? COLORS.orange : COLORS.red, 
                marginLeft: 12 
              }]}>
                {item.status === 'confirmed' ? t('booking.status.confirmed') : item.status === 'pending' ? t('booking.status.pending') : item.status === 'cancelled' ? t('booking.status.cancelled') : (item.status || 'N/A')}
              </Text>
            </View>
            <View style={styles.infoContainer}>
              <View style={styles.infoLeft}>
                <Image
                  source={
                    item.worker?.Image
                      ? { uri: item.worker.Image }
                      : item.worker?.profile_picture
                      ? { uri: item.worker.profile_picture }
                      : images.user1
                  }
                  style={styles.itemImage}
                />
                <View style={styles.itemDetails}>
                  <Text style={[styles.itemName, { 
                    color: dark? COLORS.white : COLORS.greyscale900
                  }]}>
                    {item.worker?.first_name && item.worker?.last_name
                      ? `${item.worker.first_name} ${item.worker.last_name}`
                      : t('chat.service_provider')}
                  </Text>
                  <View style={styles.itemSubDetails}>
                    <Text style={[styles.itemPrice, { 
                      color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                    }]}>€{item.total_amount || 'N/A'}</Text>
                    <Text style={[styles.itemDate, { 
                      color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                    }]}> | {new Date(item.booking_date).toLocaleDateString()}</Text>
                    <Text style={[styles.itemItems, { 
                      color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                    }]}> | {item.address || t('booking.address_missing')}</Text>
                  </View>
                  {item.worker?.average_rating && (
                    <View style={styles.ratingContainer}>
                      <FontAwesome name="star" size={12} color="orange" />
                      <Text style={styles.rating}>{item.worker.average_rating}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate("CancelBooking", { bookingId: item.id })}
                style={styles.rateButton}>
                <Text style={styles.rateButtonText}>{t('booking.actions.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("EReceipt", { bookingId: item.id })}
                style={styles.reorderButton}>
                <Text style={styles.reorderButtonText}>{t('booking.actions.view')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'column',
  },
  statusContainer: {
    borderBottomColor: COLORS.grayscale400,
    borderBottomWidth: .3,
    marginVertical: 12,
    flexDirection: 'row',
    paddingBottom: 4,
  },
  typeText: {
    fontSize: 14,
    fontFamily: "bold",
  },
  statusText: {
    fontSize: 14,
    fontFamily: "bold",
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    height: 60,
    width: 60,
    borderRadius: 8,
  },
  itemDetails: {
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemSubDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: "bold",
  },
  itemDate: {
    fontSize: 12,
    fontFamily: "regular",
    marginHorizontal: 2,
  },
  itemItems: {
    fontSize: 12,
    fontFamily: "regular",
  },
  receiptText: {
    fontSize: 14,
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.gray5,
    fontFamily: "regular",
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 18,
  },
  rateButton: {
    height: 38,
    width: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 8,
  },
  rateButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: "regular",
  },
  reorderButton: {
    height: 38,
    width: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  reorderButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: "regular",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  rating: {
    fontSize: 12,
    fontFamily: "semiBold",
    color: COLORS.primary,
    marginLeft: 4
  },
});

export default MyBookingsUpcoming;