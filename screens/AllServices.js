import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchActiveServices, transformServices } from '../lib/services/home';
import { COLORS, icons, SIZES } from "../constants";
import ServiceCard from '../components/ServiceCard';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../context/LanguageContext';

const AllServices = ({ navigation }) => {
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
        setError(t('service.failed_load'));
        return;
      }

      if (!rawServices || rawServices.length === 0) {
        setServices([]);
        setError(null);
        return;
      }

      const transformedServices = transformServices(rawServices);
      setServices(transformedServices);
      
    } catch (error) {
      console.error('Error in loadAllServices:', error);
      setError(t('service.failed_load'));
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
          {t('service.all_services') || 'All Services'}
        </Text>
        <View style={{ width: 24 }} />
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.messageText, { color: colors.text }]}>
            {t('service.loading_services') || 'Loading services...'}
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.messageText, { color: colors.text }]}>
            {error || t('service.failed_load') || 'Failed to load services'}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadAllServices}
          >
            <Text style={styles.retryText}>{t('common.try_again') || 'Try Again'}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (services.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.messageText, { color: colors.text }]}>
            {t('service.no_services') || 'No services available'}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={services}
        keyExtractor={(item, index) => `service-${item.id || item.serviceId || index}`}
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
            worker={item.worker}
            hasWorker={item.hasWorker}
            serviceId={item.serviceId}
            workerId={item.workerId}
            navigation={navigation}
            onPress={() => {
              if (item.hasWorker && item.workerId) {
                navigation.navigate("WorkerDetails", { 
                  workerId: item.workerId,
                  serviceId: item.serviceId
                });
              } else {
                navigation.navigate("ServiceDetails", { 
                  serviceId: item.serviceId, 
                  workerId: item.workerId
                });
              }
            }}
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

export default AllServices;
