import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from "../constants";
import { fetchAllServices, fetchServicesByCategory, transformServices } from '../lib/services/home';
import Header from '../components/Header';
import ServiceCard from '../components/ServiceCard';
import { useTheme } from '../theme/ThemeProvider';

const AllServices = ({ navigation, route }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();
  const showPopular = route.params?.showPopular || false;
  const categoryId = route.params?.categoryId;
  const categoryName = route.params?.categoryName;

  useEffect(() => {
    if (categoryId) {
      loadServicesByCategory(categoryId);
    } else {
      loadAllServices();
    }
  }, [categoryId]);

  const loadAllServices = async () => {
    try {
      setLoading(true);
      const { data: rawServices, error } = await fetchAllServices();
      
      if (error) {
        console.error('Error loading all services:', error);
        return;
      }

      // Transform data to match existing component format
      const transformedServices = transformServices(rawServices);
      setServices(transformedServices);
      
    } catch (error) {
      console.error('Error in loadAllServices:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadServicesByCategory = async (categoryId) => {
    try {
      setLoading(true);
      const { data: rawServices, error } = await fetchServicesByCategory(categoryId);
      
      if (error) {
        console.error('Error loading services by category:', error);
        return;
      }

      // Transform data to match existing component format
      const transformedServices = transformServices(rawServices);
      setServices(transformedServices);
      
    } catch (error) {
      console.error('Error in loadServicesByCategory:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
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
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title={categoryName ? `${categoryName} Services` : (showPopular ? "Popular Services" : "All Services")} 
        goBack={() => navigation.goBack()} 
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        services.length > 0 ? (
          <FlatList
            data={services}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No services available at the moment
            </Text>
          </View>
        )
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontFamily: 'medium',
    fontSize: 16,
    textAlign: 'center',
  }
});

export default AllServices;
