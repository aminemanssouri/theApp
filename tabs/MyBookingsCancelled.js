import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';

import { COLORS } from '../constants';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { getCancelledBookings } from '../lib/services/booking';

const MyBookingsCancelled = () => {
  const navigation = useNavigation();
  const { dark, colors } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCancelledBookings = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await getCancelledBookings(user.id);
      console.log(' Cancelled bookings:', data?.length || 0);
      setBookings(data || []);
    } catch (error) {
      console.error(' Error fetching cancelled bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initFetch = async () => {
      if (!authLoading && user?.id && mounted) {
        await fetchCancelledBookings();
      } else if (!authLoading && !user?.id && mounted) {
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
        fetchCancelledBookings();
      }
    }, [authLoading, user?.id])
  );

  const onRefresh = async () => {
    if (!user?.id) return;
    try {
      setRefreshing(true);
      await fetchCancelledBookings();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{
          color: dark ? COLORS.secondaryWhite : COLORS.greyscale900,
          textAlign: 'center',
          marginBottom: 8,
          fontSize: 18,
          fontFamily: 'bold'
        }}>No Cancelled Bookings</Text>
        <Text style={{
          color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
          textAlign: 'center'
        }}>You don't have any cancelled bookings.</Text>
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
              }]}>{item.service?.name || 'Service'}</Text>
              <Text style={[styles.statusText, { 
                color: COLORS.red, 
                marginLeft: 12 
              }]}>
                Cancelled
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
                      : require('../assets/images/users/user1.jpeg')
                  }
                  style={styles.itemImage}
                />

                <View style={styles.itemDetails}>
                  <Text style={[styles.itemName, { 
                    color: dark ? COLORS.white : COLORS.greyscale900
                  }]}>
                    {item.worker?.first_name && item.worker?.last_name
                      ? `${item.worker.first_name} ${item.worker.last_name}`
                      : "Service Provider"}
                  </Text>
                  <View style={styles.itemSubDetails}>
                    <Text style={[styles.itemPrice, { 
                      color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                    }]}>€{item.total_amount || item.price}</Text>
                    <Text style={[styles.itemDate, { 
                      color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                    }]}> | {new Date(item.booking_date).toLocaleDateString()}</Text>

                    <Text style={[styles.itemItems, { 
                      color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                    }]}> | {item.city}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.receiptText}>Receipt</Text>
            </View>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('BookingStep1', {
                  serviceId: item.service?.id || item.service_id,
                  serviceName: item.service?.name,
                  workerId: item.worker?.id || item.worker_id,
                  workerName: item.worker?.first_name && item.worker?.last_name
                    ? `${item.worker.first_name} ${item.worker.last_name}`
                    : undefined,
                  workerRate: item.worker?.rate || item.worker?.hourly_rate
                })}
                style={styles.rateButton}>
                <Text style={styles.rateButtonText}>Re-book</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("EReceipt", { bookingId: item.id })}
                style={styles.reorderButton}>
                <Text style={styles.reorderButtonText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

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
});

export default MyBookingsCancelled