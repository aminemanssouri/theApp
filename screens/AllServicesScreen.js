import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchActiveServices, transformServices } from '../lib/services/home';
import { COLORS, SIZES,icons } from "../constants";
import ServiceCard from '../components/ServiceCard';
import { useTheme } from '../theme/ThemeProvider';

const AllServicesScreen = ({ navigation }) => {
  const { dark, colors } = useTheme();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllServices();
  }, []);

  const loadAllServices = async () => {
    try {
      setLoading(true);
      
      // Fetch all active services with no limit
      const { data: rawServices, error } = await fetchActiveServices(100);
      
      if (error) {
        console.error('Error loading services:', error);
        setError('Failed to load services. Please try again.');
        return;
      }

      if (!rawServices || rawServices.length === 0) {
        setServices([]);
        setError('No services available');
        return;
      }

      const transformedServices = transformServices(rawServices);
      setServices(transformedServices);
      
    } catch (error) {
      console.error('Error in loadAllServices:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Image 
            source={icons.arrowBack}
            style={[styles.backIcon, { tintColor: dark ? COLORS.white : COLORS.black }]}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: dark ? COLORS.white : COLORS.black }]}>
          All Services
        </Text>
        <View style={{ width: 24 }} /> {/* Empty view for layout balance */}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.messageText, { color: colors.text }]}>
            Loading services...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.messageText, { color: colors.text }]}>
            {error}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadAllServices}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (services.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.messageText, { color: colors.text }]}>
            No services available
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={services}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ServiceCard
            name={item.name}
            image={item.image}
            providerName={item.providerName}
            price={item.price}
            isOnDiscount={item.isOnDiscount}
            oldPrice={item.oldPrice}
            rating={item.rating}
            numReviews={item.numReviews}
            onPress={() => navigation.navigate("ServiceDetails", { serviceId: item.id })}
            categoryId={item.categoryId}
          />
        )}
        contentContainerStyle={styles.listContainer}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'semiBold',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'medium',
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'medium',
  },
});

export default AllServicesScreen;
