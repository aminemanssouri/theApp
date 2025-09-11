import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, FlatList, Keyboard, ActivityIndicator } from 'react-native';
import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categories, ratings } from '../data'; // Keep categories and ratings for now
import NotFoundCard from '../components/NotFoundCard';
import RBSheet from "react-native-raw-bottom-sheet";
import Button from '../components/Button';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { FontAwesome } from "@expo/vector-icons";
import ServiceCard from '../components/ServiceCard';
import { useTheme } from '../theme/ThemeProvider';
import { t, useI18n } from '../context/LanguageContext';
import { fetchHomepageData, fetchActiveServices, transformServices } from '../lib/services/home'; // Import your service functions

// Custom slider marker
const CustomSliderHandle = ({ enabled, markerStyle }) => {
  return (
    <View
      style={[
        markerStyle,
        {
          backgroundColor: enabled ? COLORS.primary : 'lightgray',
          borderColor: 'white',
          borderWidth: 2,
          borderRadius: 10,
          width: 20,
          height: 20,
        },
      ]}
    />
  );
};

// Replace your current SearchBar component with this implementation:
class SearchInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: ''
    };
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    // Auto-focus with delay
    setTimeout(() => {
      if (this.inputRef.current) {
        this.inputRef.current.focus();
      }
    }, 300);
  }

  onChangeText = (text) => {
    // Update local state first (keeps focus)
    this.setState({ text }, () => {
      // Then notify parent component after state is updated
      this.props.onChangeText(text);
    });
  };

  render() {
    const { dark, onFilterPress } = this.props;
    
    return (
      <View style={[styles.searchContainer, { 
        borderColor: dark ? COLORS.grayscale700 : "#E5E7EB"
      }]}>
        <Image
          source={icons.search2}
          resizeMode='contain'
          style={styles.searchIcon}
        />
        <TextInput
          ref={this.inputRef}
          style={[styles.searchInput, { 
            color: dark ? COLORS.secondaryWhite : COLORS.greyscale900
          }]}
          value={this.state.text}
          onChangeText={this.onChangeText}
          placeholder={t('search.search_services')}
          placeholderTextColor="#BABABA"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          keyboardType="default"
          underlineColorAndroid="transparent"
          blurOnSubmit={false}
        />
        <TouchableOpacity onPress={onFilterPress}>
          <Image
            source={icons.filter}
            resizeMode='contain'
            style={[styles.filterIcon, { 
              tintColor: dark ? COLORS.white : COLORS.greyscale900
            }]}
          />
        </TouchableOpacity>
      </View>
    );
  }
}

// Header component - memoized but with stable props
const HeaderContent = ({ navigation, dark, onSearchChange, resultsCount, searchQuery, onFilterPress }) => (
  <>
    {/* Header */}
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={icons.arrowBack}
            resizeMode='contain'
            style={[styles.backIcon, { 
              tintColor: dark ? COLORS.white : COLORS.greyscale900
            }]}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { 
          color: dark ? COLORS.white : COLORS.greyscale900
        }]}>
          {t('search.screen_title')}
        </Text>
      </View>
      <TouchableOpacity>
        <Image
          source={icons.moreCircle}
          resizeMode='contain'
          style={[styles.moreIcon, { 
            tintColor: dark ? COLORS.white : COLORS.greyscale900
          }]}
        />
      </TouchableOpacity>
    </View>

    {/* SearchBar as a class component */}
    <SearchInput 
      dark={dark}
      onChangeText={onSearchChange}
      onFilterPress={onFilterPress}
    />

    {/* Results container */}
    {searchQuery.trim() !== '' && (
      <View style={styles.resultContainer}>
        <View style={styles.resultLeftView}>
          <Text style={[styles.subtitle, { 
            color: dark? COLORS.white : COLORS.greyscale900
          }]}>{t('search.results_for', { query: searchQuery })}</Text>
        </View>
        <Text style={styles.subResult}>{resultsCount === 1 ? t('search.results_found_one') : t('search.results_found_other', { count: resultsCount })}</Text>
      </View>
    )}
  </>
);

const Search = ({ navigation, route }) => {
  const refRBSheet = useRef();
  const searchInputRef = useRef(null);
  const [selectedCategories, setSelectedCategories] = useState(["all"]);
  const [selectedRating, setSelectedRating] = useState(["1"]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const { dark, colors } = useTheme();
  
  // Search state with proper initialization
  const [searchQuery, setSearchQuery] = useState('');
  const [allServices, setAllServices] = useState([]); // Store fetched services
  const [realCategories, setRealCategories] = useState([]); // Store real categories
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch real services and categories data using fetchHomepageData
  useEffect(() => {
    fetchData();
  }, []);

  // Refetch when language changes (names/descriptions localized)
  const { language } = useI18n();
  useEffect(() => {
    fetchData();
  }, [language]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get services with worker data using fetchActiveServices
      const { data: allServicesData, error: allServicesError } = await fetchActiveServices(50); // Get more services for search
      
      if (allServicesError) {
        // Fallback to homepage data if active services fails
        const { services, categories: cats, error: homepageError } = await fetchHomepageData();
        
        if (homepageError) {
          setError('Failed to load services');
          console.error('Error fetching data:', homepageError);
        } else {
          // Use services from homepage data
          setAllServices(services || []);
          setRealCategories(cats || []);
          
          // Update price range based on actual prices
          if (services && services.length > 0) {
            const prices = services.map(s => s.price || 0);
            const maxPrice = Math.max(...prices);
            setPriceRange([0, Math.ceil(maxPrice / 10) * 10]); // Round up to nearest 10
          }
        }
      } else {
        // Transform all services with worker data
        const transformedAllServices = transformServices(allServicesData || []);
        setAllServices(transformedAllServices);
        
        // Also get categories for filter
        const { categories: cats } = await fetchHomepageData();
        setRealCategories(cats || []);
        
        // Update price range based on actual prices
        if (transformedAllServices.length > 0) {
          const prices = transformedAllServices.map(s => s.price || 0);
          const maxPrice = Math.max(...prices);
          setPriceRange([0, Math.ceil(maxPrice / 10) * 10]); // Round up to nearest 10
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search query change
  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
  }, []);

  // Filter data based on search query and filters
  const filteredData = useMemo(() => {
    let filtered = allServices;
    
    // Search filter - search in name, provider name, and description
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((service) => {
        const nameMatch = service.name?.toLowerCase().includes(query);
        const providerMatch = service.providerName?.toLowerCase().includes(query);
        const descriptionMatch = service.description?.toLowerCase().includes(query);
        const categoryMatch = service.category?.name?.toLowerCase().includes(query);
        
        return nameMatch || providerMatch || descriptionMatch || categoryMatch;
      });
    }
    
    // Category filter (if not "All" categories selected)
    if (selectedCategories.length > 0 && !selectedCategories.includes("all") && !selectedCategories.includes("all_categories")) {
      filtered = filtered.filter((service) =>
        selectedCategories.includes(service.categoryId)
      );
    }
    
    // Price range filter
    filtered = filtered.filter((service) => {
      const price = service.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });
    
    // Rating filter
    if (selectedRating.length > 0 && !selectedRating.includes("1")) {
      filtered = filtered.filter((service) => {
        // Assuming rating IDs correspond to minimum ratings
        const minRating = Math.min(...selectedRating.map(id => parseInt(id)));
        return (service.rating || 0) >= minRating;
      });
    }
    
    return filtered;
  }, [searchQuery, allServices, selectedCategories, priceRange, selectedRating]);

  const resultsCount = searchQuery.trim() === '' ? 0 : filteredData.length;

  const handleSliderChange = useCallback((values) => {
    setPriceRange(values);
  }, []);

  // Toggle category selection
  const toggleCategory = useCallback((categoryId) => {
    setSelectedCategories(prev => {
      const updatedCategories = [...prev];
      const index = updatedCategories.indexOf(categoryId);

      if (index === -1) {
        updatedCategories.push(categoryId);
      } else {
        updatedCategories.splice(index, 1);
      }
      return updatedCategories;
    });
  }, []);

  // toggle rating selection
  const toggleRating = useCallback((ratingId) => {
    setSelectedRating(prev => {
      const updatedRatings = [...prev];
      const index = updatedRatings.indexOf(ratingId);

      if (index === -1) {
        updatedRatings.push(ratingId);
      } else {
        updatedRatings.splice(index, 1);
      }
      return updatedRatings;
    });
  }, []);

  // Apply filters when Filter button is pressed
  const applyFilters = useCallback(() => {
    // Filters are already applied in filteredData through useMemo
    refRBSheet.current.close();
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setSelectedCategories(["all"]);
    setSelectedRating(["1"]);
    setPriceRange([0, 500]);
  }, []);

  // Category item
  const renderCategoryItem = useCallback(({ item }) => (
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
  ), [selectedCategories, toggleCategory]);

  const renderRatingItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: selectedRating.includes(item.id) ? COLORS.primary : "transparent",
        paddingHorizontal: 16,
        paddingVertical: 6,
        marginVertical: 5,
        borderColor: COLORS.primary,
        borderWidth: 1.3,
        borderRadius: 24,
        marginRight: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
      onPress={() => toggleRating(item.id)}>
      <View style={{ marginRight: 6 }}>
        <FontAwesome name="star" size={14} color={selectedRating.includes(item.id) ? COLORS.white : COLORS.primary} />
      </View>
      <Text style={{
        color: selectedRating.includes(item.id) ? COLORS.white : COLORS.primary
      }}>{item.title}</Text>
    </TouchableOpacity>
  ), [selectedRating, toggleRating]);

  // Modified ListEmptyComponent to handle loading and error states
  const ListEmptyComponent = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: dark ? COLORS.white : COLORS.black }]}>
            {t('service.loading_services')}
          </Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: dark ? COLORS.white : COLORS.black }]}>
            {error || t('service.failed_load')}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (searchQuery.trim() === '' && allServices.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.noDataText, { color: dark ? COLORS.white : COLORS.black }]}>
            {t('service.no_services')}
          </Text>
        </View>
      );
    }
    
    if (searchQuery.trim() !== '' && filteredData.length === 0) {
      return <NotFoundCard />;
    }
    
    return null;
  }, [searchQuery, loading, error, dark, allServices.length, filteredData.length]);

  // Render service item with transformed data structure
  const renderServiceItem = useCallback(({ item }) => (
    <ServiceCard
      name={item.name}
      image={item.image}
      providerName={item.providerName}
      price={item.price}
      isOnDiscount={item.isOnDiscount}
      oldPrice={item.oldPrice}
      rating={item.rating}
      numReviews={item.numReviews}
      onPress={() => navigation.navigate("WorkerDetails", { 
        workerId: item.workerId, serviceId: item.serviceId, workerServiceId: item.workerServiceId
      })}
      serviceId={item.serviceId}
      workerId={item.workerId}
      categoryId={item.categoryId}
    />
  ), [navigation]);

  // Extract item key
  const keyExtractor = useCallback((item) => item.id.toString(), []);

  // Get max price for slider
  const maxPrice = useMemo(() => {
    if (allServices.length === 0) return 500;
    const prices = allServices.map(s => s.price || 0);
    return Math.ceil(Math.max(...prices) / 10) * 10; // Round up to nearest 10
  }, [allServices]);

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Pass everything needed as props */}
        <HeaderContent 
          navigation={navigation}
          dark={dark}
          onSearchChange={handleSearchChange}
          resultsCount={resultsCount}
          searchQuery={searchQuery}
          onFilterPress={() => refRBSheet.current.open()}
        />

        {/* Services list */}
        <FlatList
          data={filteredData}
          keyExtractor={keyExtractor}
          ListEmptyComponent={ListEmptyComponent}
          renderItem={renderServiceItem}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{ paddingBottom: 20 }}
          initialNumToRender={5}
          refreshing={loading}
          onRefresh={fetchData}
        />

        <RBSheet
          ref={refRBSheet}
          closeOnDragDown={true}
          closeOnPressMask={false}
          height={480}
          customStyles={{
            wrapper: {
              backgroundColor: "rgba(0,0,0,0.5)",
            },
            draggableIcon: {
              backgroundColor: dark ? COLORS.dark3 : "#000",
            },
            container: {
              borderTopRightRadius: 32,
              borderTopLeftRadius: 32,
              height: 480,
              backgroundColor: dark ? COLORS.dark2 : COLORS.white,
              alignItems: "center",
            }
          }}
        >
          <Text style={[styles.bottomTitle, { 
            color: dark ? COLORS.white : COLORS.greyscale900
          }]}>{t('search.filter')}</Text>
          <View style={styles.separateLine} />
          <View style={{ width: SIZES.width - 32 }}>
            <Text style={[styles.sheetTitle, { 
              color: dark ? COLORS.white : COLORS.greyscale900
            }]}>{t('search.categories')}</Text>
            <FlatList
              data={realCategories.length > 0 ? realCategories : categories}
              keyExtractor={item => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              horizontal
              renderItem={renderCategoryItem}
            />
            <Text style={[styles.sheetTitle, { 
              color: dark ? COLORS.white : COLORS.greyscale900
            }]}>{t('search.price_range')}</Text>
            <View style={styles.priceContainer}>
              <Text style={[styles.priceText, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                ${priceRange[0]}
              </Text>
              <Text style={[styles.priceText, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                ${priceRange[1]}
              </Text>
            </View>
            <MultiSlider
              values={priceRange}
              sliderLength={SIZES.width - 32}
              onValuesChange={handleSliderChange}
              min={0}
              max={maxPrice}
              step={5}
              allowOverlap={false}
              snapped
              minMarkerOverlapDistance={40}
              customMarker={CustomSliderHandle}
              selectedStyle={{ backgroundColor: COLORS.primary }}
              unselectedStyle={{ backgroundColor: 'lightgray' }}
              containerStyle={{ height: 40 }}
              trackStyle={{ height: 3 }}
            />
            <Text style={[styles.sheetTitle, { 
              color: dark ? COLORS.white : COLORS.greyscale900
            }]}>{t('search.rating')}</Text>
            <FlatList
              data={ratings}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              horizontal
              renderItem={renderRatingItem}
            />
          </View>

          <View style={styles.separateLine} />

          <View style={styles.bottomContainer}>
            <Button
              title={t('common.reset')}
              style={{
                width: (SIZES.width - 32) / 2 - 8,
                backgroundColor: dark ? COLORS.dark3 : COLORS.tansparentPrimary,
                borderRadius: 32,
                borderColor: dark ? COLORS.dark3 : COLORS.tansparentPrimary
              }}
              textColor={dark ? COLORS.white : COLORS.primary}
              onPress={resetFilters}
            />
            <Button
              title={t('search.apply')}
              filled
              style={styles.logoutButton}
              onPress={applyFilters}
            />
          </View>
        </RBSheet>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16
  },
  headerContainer: {
    flexDirection: "row",
    width: SIZES.width - 32,
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: 16
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  backIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.black
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'bold',
    color: COLORS.black,
    marginLeft: 16
  },
  moreIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.black
  },
  searchContainer: {
    height: 50,
    width: SIZES.width - 32,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 8
  },
  searchIcon: {
    height: 20,
    width: 20,
    tintColor: "#BABABA"
  },
  searchInput: {
    flex: 1,
    height: 46, // Fixed height
    fontSize: 14,
    marginHorizontal: 8,
    paddingVertical: 0, // Important for Android
    borderRightWidth: 0, // Remove border to fix rendering issues
  },
  filterIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.black,
    marginLeft: 8
  },
  resultContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: SIZES.width - 32,
    marginVertical: 16,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "bold",
    color: COLORS.black,
  },
  subResult: {
    fontSize: 14,
    fontFamily: "semiBold",
    color: COLORS.primary
  },
  resultLeftView: {
    flexDirection: "row"
  },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
    paddingHorizontal: 16,
    width: SIZES.width
  },
  cancelButton: {
    width: (SIZES.width - 32) / 2 - 8,
    backgroundColor: COLORS.tansparentPrimary,
    borderRadius: 32
  },
  logoutButton: {
    width: (SIZES.width - 32) / 2 - 8,
    backgroundColor: COLORS.primary,
    borderRadius: 32
  },
  bottomTitle: {
    fontSize: 24,
    fontFamily: "semiBold",
    color: COLORS.black,
    textAlign: "center",
    marginTop: 12
  },
  separateLine: {
    height: .4,
    width: SIZES.width - 32,
    backgroundColor: COLORS.greyscale300,
    marginVertical: 12
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.black,
    marginVertical: 12
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceText: {
    fontSize: 14,
    fontFamily: 'medium',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'regular',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'medium',
  },
  noDataText: {
    fontSize: 16,
    fontFamily: 'regular',
    textAlign: 'center',
  },
})


export default Search