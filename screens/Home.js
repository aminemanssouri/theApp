import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, FlatList, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';
import { images, COLORS, SIZES, icons } from "../constants";
import { banners } from '../data'; // Keep banners as static for now
import { 
  fetchHomepageData,
  fetchAllCategories,
  transformCategories, 
  getWorkersForService
} from '../lib/services/home';
import { supabase } from '../lib/supabase';
import SubHeaderItem from '../components/SubHeaderItem';
import Category from '../components/Category';
import ServiceCard from '../components/ServiceCard';
import { useTheme } from '../theme/ThemeProvider';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { t, useI18n } from '../context/LanguageContext';

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
     
    
     
    
    // Log notification types breakdown
    const typeBreakdown = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {});
     
    // Log unread notifications details
    const unreadNotifications = notifications.filter(n => !n.is_read);
   
    
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

 

  // Refetch when language changes so names/descriptions are localized
  const { language } = useI18n();
  useEffect(() => {
    loadHomepageData();
  }, [language]);

  const loadHomepageData = async () => {
    try {
      setLoading(true);
       
      // Use the simplified fetchHomepageData function
      const { categories: homepageCategories, services: homepageServices, error } = 
        await fetchHomepageData();
      
      if (error) {
         setLoading(false);
        return;
      }
      
       
      // Fetch all categories for "See all" functionality
      const { data: allCats } = await fetchAllCategories();
      const allTransformedCategories = transformCategories(allCats || []);
      
      // Set data to state
       setCategories(homepageCategories || []);
      setAllCategories(allTransformedCategories || []);
      setServices(homepageServices || []); // Services are already processed
      
       
      if (homepageServices?.length === 0) {
       } else {
         
        // Log first service details
        if (homepageServices && homepageServices.length > 0) {
          const firstService = homepageServices[0];
         
        }
      }
      
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

  // Map banner item to localized copy (use id-based mapping for stability)
  const getBannerCopy = (item) => {
    const nameKeyById = {
      1: 'banners.today_special',
      2: 'banners.weekend_sale',
      3: 'banners.limited_time_offer',
    };
    const bottomTitleKeyById = {
      1: 'banners.get_discount_next_order',
      2: 'banners.special_discount_weekend',
      3: 'banners.limited_time_hurry',
    };
    const bottomSubtitleKeyById = {
      1: 'banners.only_valid_for_today',
      2: 'banners.this_weekend_only',
      3: 'banners.valid_until_supplies_last',
    };

    const discountLabel = t('banners.discount_label', { discount: item.discount }) || `${item.discount} OFF`;
    const discountName = t(nameKeyById[item.id]) || item.discountName;
    const bottomTitle = t(bottomTitleKeyById[item.id]) || item.bottomTitle;
    const bottomSubtitle = t(bottomSubtitleKeyById[item.id]) || item.bottomSubtitle;

    return { discountLabel, discountName, bottomTitle, bottomSubtitle };
  };

  const renderBannerItem = ({ item }) => {
    const { discountLabel, discountName, bottomTitle, bottomSubtitle } = getBannerCopy(item);
    return (
      <View style={styles.bannerContainer}>
        <View style={styles.bannerTopContainer}>
          <View>
            <Text style={styles.bannerDicount}>{discountLabel}</Text>
            <Text style={styles.bannerDiscountName}>{discountName}</Text>
          </View>
          <Text style={styles.bannerDiscountNum}>{item.discount}</Text>
        </View>
        <View style={styles.bannerBottomContainer}>
          <Text style={styles.bannerBottomTitle}>{bottomTitle}</Text>
          <Text style={styles.bannerBottomSubtitle}>{bottomSubtitle}</Text>
        </View>
      </View>
    );
  };

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

  const renderHeader = () => {
    // Get user display name
    const getDisplayName = () => {
      if (userProfile?.first_name) {
        return `Hi, ${userProfile.first_name}!`;
      } else if (user?.email) {
        return `Hi, ${user.email.split('@')[0]}!`;
      }
      return 'Hi, User!';
    };

    // Get profile image
    const getProfileImage = () => {
      if (userProfile?.profile_picture) {
        return { uri: userProfile.profile_picture };
      } else {
        return images.user5; // Default fallback
      }
    };

    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.navigate("PersonalProfile")}>
            <Image
              source={getProfileImage()}
              resizeMode='cover'
              style={styles.avatar}
            />
          </TouchableOpacity>
          <Text style={[styles.username, { 
            color: dark? COLORS.white : COLORS.greyscale900

          }]}>{getDisplayName()}</Text>

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
          {t('search.search_services')}
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

  
  const renderCategories = () => {
     if (!categories || categories.length === 0) {
      return null;  
    }

     const hasAllCategory = categories.some(cat => cat.id === "all" || cat.name.toLowerCase() === "all");
    
     const allCategoriesList = hasAllCategory ? categories : [
      { id: "all", name: t('search.all'), icon: icons.categoryAll || icons.categoryDefault }
    ].concat(categories);

     const handleCategoryPress = (categoryId) => {
      if (categoryId === "all") {
         setSelectedCategories(["all"]);
      } else {
         setSelectedCategories([categoryId]);
      }
    };

    return (
      <View style={styles.categoriesContainer}>
        <SubHeaderItem
          title={t('search.categories')}
          navTitle={allCategories.length > categories.length ? t('common.see_all') : ""}
          onPress={allCategories.length > categories.length ? 
            () => navigation.navigate("AllCategories") : null}
        />
        
        {/* Horizontal ScrollView for categories */}
        <FlatList
          data={allCategoriesList}
          keyExtractor={(item) => item.id.toString()}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleCategoryPress(item.id)}
              style={[
                styles.categoryItemContainer,
                selectedCategories.includes(item.id) && styles.selectedCategoryItemContainer
              ]}
            >
              <Category
                name={item.name}
                icon={item.icon || icons.categoryDefault}
                iconColor={selectedCategories.includes(item.id) ? COLORS.primary : COLORS.gray}
                backgroundColor={selectedCategories.includes(item.id) ? `${COLORS.primary}15` : COLORS.lightGray}
                selected={selectedCategories.includes(item.id)}
              />
            </TouchableOpacity>
          )}
        />
      </View>
    )
  }

  /**
   * Render Top Services
   */
  const renderTopServices = () => {
     
    if (!services || services.length === 0) {
       return (
        <View style={styles.noServicesContainer}>
          <Text style={[styles.noServicesText, { color: colors.text }]}>
            {t('service.no_services')}
          </Text>
        </View>
      );
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
          title={t('home.popular_services')}
          navTitle={t('common.see_all')}
          onPress={() => navigation.navigate("AllServices", { showPopular: true })}
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
                  serviceId={item.serviceId}
                  workerId={item.workerId}
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
              {t('service.no_services_in_category')}
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
              <Text style={[styles.loadingText, { color: colors.text }]}>{t('common.loading')}</Text>
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
  searchIconContainer: {
    paddingRight: 8
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
  // Styles for horizontal scrolling categories
  categoriesContainer: {
    marginVertical: 8
  },
  categoriesScrollContainer: {
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  categoryItemContainer: {
    alignItems: 'center',
    marginRight: 15,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    width: 85, // Fixed width for each category item
  },
  selectedCategoryItemContainer: {
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  // Notification styles
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