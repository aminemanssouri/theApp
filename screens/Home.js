import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, FlatList, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';
import { images, COLORS, SIZES, icons } from "../constants";
import { banners } from '../data'; // Keep banners as static for now
import { 
  fetchHomepageData,
  fetchServiceCategories,
  fetchAllCategories,
  fetchActiveServices,
  transformCategories, 
  transformServices,
  getWorkersForService
} from '../lib/services/home';
import { supabase } from '../lib/supabase';
import SubHeaderItem from '../components/SubHeaderItem';
import Category from '../components/Category';
import ServiceCard from '../components/ServiceCard';
// import ServiceDebugger from '../components/ServiceDebugger'; // Import the service debugger
import { useTheme } from '../theme/ThemeProvider';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const Home = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { dark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, userNotificationStats, isUserAuthenticated } = useNotifications();
  const { user, userProfile } = useAuth();
  
  // Supabase data states
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  // Move useState hooks to component level
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["all"]); // Start with "all" instead of hardcoded "1"

  // Handle notification icon press with detailed logging
  const handleNotificationPress = () => {
    console.log('🔔 NOTIFICATION ICON CLICKED 🔔');
    console.log('📱 Navigation: Navigating to Notifications screen');
    
    // Log user authentication status
    console.log('👤 User Authentication Status:', {
      isAuthenticated: isUserAuthenticated(),
      userId: user?.id,
      userEmail: user?.email,
      userName: userProfile?.first_name || user?.email?.split('@')[0] || 'Unknown'
    });
    
    // Log notification data
    console.log('📊 Notification Statistics:', {
      totalNotifications: notifications.length,
      unreadCount: unreadCount,
      userStats: userNotificationStats
    });
    
    // Log recent notifications (first 5)
    console.log('📋 Recent Notifications (first 5):', notifications.slice(0, 5).map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.is_read,
      createdAt: notification.created_at,
      relatedId: notification.related_id,
      relatedType: notification.related_type,
      channel: notification.channel
    })));
    
    // Log notification types breakdown
    const typeBreakdown = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {});
    console.log('📈 Notification Types Breakdown:', typeBreakdown);
    
    // Log unread notifications details
    const unreadNotifications = notifications.filter(n => !n.is_read);
    console.log('🔴 Unread Notifications Details:', unreadNotifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      createdAt: notification.created_at
    })));
    
    // Navigate to notifications screen
    navigation.navigate("Notifications");
  };

  // Toggle category selection function
  const toggleCategory = (categoryId) => {
    if (categoryId === "all") {
      // If "All" is selected, clear other selections
      setSelectedCategories(["all"]);
    } else {
      // Remove "all" if a specific category is selected
      const updatedCategories = selectedCategories.filter(id => id !== "all");
      const index = updatedCategories.indexOf(categoryId);

      if (index === -1) {
        // Add the category if not selected
        updatedCategories.push(categoryId);
      } else {
        // Remove the category if already selected
        updatedCategories.splice(index, 1);
      }

      // If no categories selected, default to "all"
      setSelectedCategories(updatedCategories.length > 0 ? updatedCategories : ["all"]);
    }
  };

  // Fetch data from Supabase on component mount
  useEffect(() => {
    loadHomepageData();
    
    // Add debug function to test SQL function directly using our helper function
    const testSQLFunction = async () => {
      try {
        console.log('⚠️ TESTING SQL FUNCTION DIRECTLY ⚠️');
        
        // First get all services to test with
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('id, name')
          .limit(10);
          
        if (serviceError || !serviceData || !serviceData.length) {
          console.error('❌ Could not find services to test with');
          return;
        }
        
        console.log(`Found ${serviceData.length} services to test:`);
        
        // Test with each service ID
        for (const service of serviceData) {
          console.log(`\n🔍 Testing service: ${service.name} (${service.id})`);
          
          // Use our helper function with the correct parameter syntax
          const { data, error } = await getWorkersForService(service.id);
          
          if (error) {
            console.error(`❌ SQL function error for ${service.name}:`, error);
          } else {
            console.log(`✅ SQL function result for ${service.name}: Found ${data?.length || 0} workers`);
            if (data && data.length > 0) {
              console.log(`First worker for ${service.name}:`, data[0].worker_full_name || `${data[0].first_name} ${data[0].last_name}`);
            } else {
              console.log(`No workers found for ${service.name}`);
              
              // Now check if there are actually worker_services for this service
              const { data: workerServices, error: wsError } = await supabase
                .from('worker_services')
                .select('*')
                .eq('service_id', service.id);
                
              if (wsError) {
                console.error(`❌ Error checking worker_services for ${service.name}:`, wsError);
              } else {
                console.log(`✅ Direct check: ${workerServices?.length || 0} worker_services found for ${service.name}`);
                if (workerServices && workerServices.length > 0) {
                  console.log(`First worker_service for ${service.name}:`, workerServices[0]);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('❌ Test function error:', err);
      }
    };
    
    // Run the test after a short delay
    setTimeout(testSQLFunction, 2000);
  }, []);

  const loadHomepageData = async () => {
    try {
      setLoading(true);
      console.log('🚀 LOADING HOMEPAGE DATA...');
      
      // Use the simplified fetchHomepageData function
      const { categories: homepageCategories, services: homepageServices, error } = 
        await fetchHomepageData();
      
      if (error) {
        console.error('❌ ERROR FETCHING DATA:', error);
        setLoading(false);
        return;
      }
      
      console.log(`✅ Got ${homepageCategories?.length || 0} categories and ${homepageServices?.length || 0} services`);
      
      // Fetch all categories for "See all" functionality
      const { data: allCats } = await fetchAllCategories();
      const allTransformedCategories = transformCategories(allCats || []);
      
      // Set data to state
      console.log('🔄 Updating state with data...');
      setCategories(homepageCategories || []);
      setAllCategories(allTransformedCategories || []);
      setServices(homepageServices || []); // Services are already processed
      
      console.log('✅ STATE UPDATED');
      
      if (homepageServices?.length === 0) {
        console.warn('⚠️ NO SERVICES FOUND TO DISPLAY');
      } else {
        console.log(`✅ SET ${homepageServices?.length || 0} SERVICES TO STATE`);
        
        // Log first service details
        if (homepageServices && homepageServices.length > 0) {
          const firstService = homepageServices[0];
          console.log('FIRST SERVICE:', {
            id: firstService.id,
            name: firstService.name,
            providerName: firstService.providerName
          });
        }
      }
      
      console.log('✅ HOMEPAGE DATA LOADED SUCCESSFULLY');
    } catch (error) {
      console.error('❌ Error loading homepage data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate bottom spacing to avoid tab bar overlap
  const getBottomSpacing = () => {
    const baseTabHeight = 60;
    const safeAreaBottom = insets.bottom;
    
    if (Platform.OS === 'ios') {
      return baseTabHeight + safeAreaBottom + 20; // Extra padding for iOS
    } else {
      return baseTabHeight + Math.max(safeAreaBottom, 10) + 20; // Extra padding for Android
    }
  };

  const renderBannerItem = ({ item }) => (
    <View style={styles.bannerContainer}>
      <View style={styles.bannerTopContainer}>
        <View>
          <Text style={styles.bannerDicount}>{item.discount} OFF</Text>
          <Text style={styles.bannerDiscountName}>{item.discountName}</Text>
        </View>
        <Text style={styles.bannerDiscountNum}>{item.discount}</Text>
      </View>
      <View style={styles.bannerBottomContainer}>
        <Text style={styles.bannerBottomTitle}>{item.bottomTitle}</Text>
        <Text style={styles.bannerBottomSubtitle}>{item.bottomSubtitle}</Text>
      </View>
    </View>
  );

  const keyExtractor = (item) => item.id.toString();

  const handleEndReached = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };

  const renderDot = (index) => {
    return (
      <View
        style={[styles.dot, index === currentIndex ? styles.activeDot : null]}
        key={index}
      />
    );
  };
  /**
  * Render Header
  */
  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.navigate("PersonalProfile")}>
            <Image
              source={images.user5}
              resizeMode='cover'
              style={styles.avatar}
            />
          </TouchableOpacity>
          <Text style={[styles.username, { 
            color: dark? COLORS.white : COLORS.greyscale900
          }]}>Hi, Joanna!</Text>
        </View>
        <TouchableOpacity
          onPress={handleNotificationPress}
          style={styles.notificationContainer}>
          <Image
            source={icons.bell}
            resizeMode='contain'
            style={[styles.bellIcon, { 
              tintColor: dark? COLORS.white : COLORS.greyscale900
            }]}
          />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    )
  }

  /**
  * render search bar
  */
  const renderSearchBar = () => {
    const handleInputFocus = () => {
      // Navigate to Search screen
      navigation.navigate('Search');
    };

    return (
      <TouchableOpacity 
        style={[styles.searchContainer, {  
          borderColor: dark ? COLORS.grayscale700 : "#E5E7EB"
        }]}
        onPress={handleInputFocus}
        activeOpacity={0.8}
      >
        <Image
          source={icons.search2}
          resizeMode='contain'
          style={styles.searchIcon}
        />
        <Text style={styles.searchPlaceholder}>
          Search services...
        </Text>
        <Image
          source={icons.filter}
          resizeMode='contain'
          style={[styles.filterIcon, { 
            tintColor: dark? COLORS.white : COLORS.greyscale900
          }]}
        />
      </TouchableOpacity>
    )
  }

  /**
   * Render banner
   */
  const renderBanner = () => {
    return (
      <View style={styles.bannerItemContainer}>
        <FlatList
          data={banners}
          renderItem={renderBannerItem}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(
              event.nativeEvent.contentOffset.x / SIZES.width
            );
            setCurrentIndex(newIndex);
          }}
        />
        <View style={styles.dotContainer}>
          {banners.map((_, index) => renderDot(index))}
        </View>
      </View>
    )
  }

  /**
   * Render categories
   */
  const renderCategories = () => {
    // Display either all categories or just the first 8
    const displayCategories = showAllCategories ? allCategories : categories;
    const hasMoreCategories = allCategories.length > categories.length;

    return (
      <View>
        <SubHeaderItem
          title="Categories"
          navTitle=""
          onPress={null}
        />
        <FlatList
          data={displayCategories}
          keyExtractor={(item) => item.id.toString()}
          horizontal={false}
          numColumns={4} // Render four items per row
          renderItem={({ item }) => (
            <Category
              name={item.name}
              icon={item.icon}
              iconColor={item.iconColor}
              backgroundColor={item.backgroundColor}
            />
          )}
        />
        {hasMoreCategories && (
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => setShowAllCategories(!showAllCategories)}
          >
            <Text style={styles.seeAllButtonText}>
              {showAllCategories ? "Show fewer categories" : "See all categories"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  /**
   * Render Top Services
   */
  const renderTopServices = () => {
    console.log(`🔍 RENDERING SERVICES. Total services: ${services.length}, Selected categories: ${selectedCategories.join(', ')}`);
    
    // Debug log service data
    if (services && services.length > 0) {
      console.log('💡 SAMPLE SERVICE DATA:', {
        id: services[0].id,
        name: services[0].name,
        providerName: services[0].providerName,
        hasWorker: services[0].hasWorker,
        categoryId: services[0].categoryId,
        workerId: services[0].workerId
      });
    } else {
      console.warn('⚠️ NO SERVICES AVAILABLE TO RENDER');
    }
    
    // Filter services based on selected categories
    const filteredServices = selectedCategories.includes("all") 
      ? services // Show all services if "all" is selected
      : services.filter(service => selectedCategories.includes(service.categoryId));
      

    // Use the categories directly from state (which already include the "All" option)
    const filterCategories = categories;

    // Category item for filtering
    const renderCategoryItem = ({ item }) => (
      <TouchableOpacity
        style={{
          backgroundColor: selectedCategories.includes(item.id) ? COLORS.primary : "transparent",
          padding: 10,
          marginVertical: 5,
          borderColor: COLORS.primary,
          borderWidth: 1.3,
          borderRadius: 24,
          marginRight: 12,
        }}
        onPress={() => toggleCategory(item.id)}>
        <Text style={{
          color: selectedCategories.includes(item.id) ? COLORS.white : COLORS.primary
        }}>{item.name}</Text>
      </TouchableOpacity>
    );

    return (
      <View>
        <SubHeaderItem
          title="Popular Services"
          navTitle="See all"
          onPress={() => navigation.navigate("AllServices", { showPopular: true })}
        />
        <FlatList
          data={filterCategories}
          keyExtractor={(item, index) => `category-${item.id}-${index}`}
          showsHorizontalScrollIndicator={false}
          horizontal
          renderItem={renderCategoryItem}
          style={{ marginBottom: 16 }}
        />
        {filteredServices.length > 0 ? (
          <FlatList
            data={filteredServices}
            keyExtractor={(item, index) => `service-${item.id}-${index}`}
            renderItem={({ item }) => {
              return (
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
              )
            }}
          />
        ) : (
          <View style={styles.noServicesContainer}>
            <Text style={[styles.noServicesText, { color: colors.text }]}>
              No services found in this category
            </Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: getBottomSpacing(),
          }}
          style={{ flex: 1 }}
        >
          {renderSearchBar()}
          {renderBanner()}
          {/* Service Debugger Component - Remove for production */}
          {/* {!loading && services && services.length > 0 && <ServiceDebugger services={services} />} */}
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
            </View>
          ) : (
            <>
              {renderCategories()}
              {renderTopServices()}
            </>
          )}
        </ScrollView>
      </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    width: SIZES.width - 32,
  },
  avatar: {
    height: 30,
    width: 30,
    borderRadius: 999,
    marginRight: 12
  },
  username: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: COLORS.black
  },
  bellIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.black
  },
  noti: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: COLORS.red,
    position: "absolute",
    top: 0,
    right: 3,
    zIndex: 99999
  },
  headerLeft: {
    alignItems: "center",
    flexDirection: "row",
  },
  searchContainer: {
    height: 50,
    width: SIZES.width - 32,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 22,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12
  },
  searchIcon: {
    height: 20,
    width: 20,
    tintColor: "#BABABA"
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginHorizontal: 8,
    borderRightColor: "#BABABA",
    borderRightWidth: .4
  },
  filterIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.black
  },
  bannerContainer: {
    width: SIZES.width - 32,
    height: 154,
    paddingHorizontal: 28,
    paddingTop: 28,
    borderRadius: 32,
    backgroundColor: COLORS.primary
  },
  bannerTopContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  bannerDicount: {
    fontSize: 12,
    fontFamily: "medium",
    color: COLORS.white,
    marginBottom: 4
  },
  bannerDiscountName: {
    fontSize: 16,
    fontFamily: "bold",
    color: COLORS.white
  },
  bannerDiscountNum: {
    fontSize: 46,
    fontFamily: "bold",
    color: COLORS.white
  },
  bannerBottomContainer: {
    marginTop: 8
  },
  bannerBottomTitle: {
    fontSize: 14,
    fontFamily: "medium",
    color: COLORS.white
  },
  bannerBottomSubtitle: {
    fontSize: 14,
    fontFamily: "medium",
    color: COLORS.white,
    marginTop: 4
  },
  bannerItemContainer: {
    width: "100%",
    paddingBottom: 10,
    backgroundColor: COLORS.primary,
    height: 170,
    borderRadius: 32,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: COLORS.white,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "medium"
  },
  noServicesContainer: {
    paddingVertical: 32,
    alignItems: 'center'
  },
  noServicesText: {
    fontSize: 16,
    fontFamily: "medium",
    textAlign: 'center'
  },
  seeAllButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 15,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15', // Primary color with opacity
    borderWidth: 1,
    borderColor: COLORS.primary
  },
  seeAllButtonText: {
    color: COLORS.primary,
    fontFamily: 'medium',
    fontSize: 14
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: COLORS.red,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: 'semiBold',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    marginHorizontal: 8,
    color: "#BABABA",
    borderRightColor: "#BABABA",
    borderRightWidth: .4,
    paddingRight: 8,
  },
})

export default Home