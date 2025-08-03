import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, FlatList, ActivityIndicator } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';
import { categories, ratings } from '../data'; // Remove allServices as we'll get real data from API
import NotFoundCard from '../components/NotFoundCard';
import { searchServices } from '../lib/services/home';
import RBSheet from "react-native-raw-bottom-sheet";
import Button from '../components/Button';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { FontAwesome } from "@expo/vector-icons";
import ServiceCard from '../components/ServiceCard';
import { useTheme } from '../theme/ThemeProvider';

// Handler slider
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

const Search = ({ navigation, route }) => {
  const refRBSheet = useRef();
  const [selectedCategories, setSelectedCategories] = useState(["1"]);
  const [selectedRating, setSelectedRating] = useState(["1"]);
  const [priceRange, setPriceRange] = useState([0, 100]); // Initial price range
  const { dark, colors } = useTheme();
  
  // Get initial query from navigation params if available
  const initialQuery = route.params?.initialQuery || '';
  const showFilters = route.params?.showFilters || false;
  
  // Open filters if requested
  useEffect(() => {
    if (showFilters && refRBSheet.current) {
      setTimeout(() => refRBSheet.current.open(), 500);
    }
  }, []);

  const handleSliderChange = (values) => {
    setPriceRange(values);
  };

  /**
     * Render header
     */
  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}>
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
            Search
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
    )
  }
  /**
   * Render content
   */
  const renderContent = () => {
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [filteredServices, setFilteredServices] = useState([]);
    const [resultsCount, setResultsCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Use effect to search when query changes with a small delay
    useEffect(() => {
      const delaySearch = setTimeout(() => {
        handleSearch();
      }, 500); // Debounce for better performance
      
      return () => clearTimeout(delaySearch);
    }, [searchQuery]);

    // Search for services using our API
    const handleSearch = async () => {
      if (!searchQuery || searchQuery.trim() === '') {
        setFilteredServices([]);
        setResultsCount(0);
        return;
      }
      
      setLoading(true);
      
      try {
        // Import at the top of the file: import { searchServices } from '../lib/services/home';
        const { data: services, error } = await searchServices(searchQuery);
        
        if (error) {
          console.error('Search error:', error);
          setFilteredServices([]);
          setResultsCount(0);
        } else {
          setFilteredServices(services || []);
          setResultsCount(services?.length || 0);
        }
      } catch (err) {
        console.error('Search error:', err);
        setFilteredServices([]);
        setResultsCount(0);
      } finally {
        setLoading(false);
      }
    };

    return (
      <View>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { 
           borderColor: dark ? COLORS.grayscale700 : "#E5E7EB"
        }]}>
          <TouchableOpacity>
            <Image
              source={icons.search2}
              resizeMode='contain'
              style={styles.searchIcon}
            />
          </TouchableOpacity>
          <TextInput
            style={[styles.searchInput, { 
              color: dark? COLORS.secondaryWhite : COLORS.greyscale900
            }]}
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
            placeholder='Search services...'
            placeholderTextColor="#BABABA"
          />
          <TouchableOpacity
           onPress={() => refRBSheet.current.open()}>
            <Image
              source={icons.filter}
              resizeMode='contain'
              style={[styles.filterIcon, { 
                tintColor: dark? COLORS.white : COLORS.greyscale900
              }]}
            />
          </TouchableOpacity>
      </View>

        {/* Results container  */}
        <View>
          {
            searchQuery && (
              <View style={styles.resultContainer}>
                <View style={styles.resultLeftView}>
                  <Text style={[styles.subtitle, { 
                    color: dark? COLORS.white : COLORS.greyscale900
                  }]}>Results for "</Text>
                  <Text style={styles.subtitle}>{searchQuery}</Text>
                  <Text style={styles.subtitle}>"</Text>
                </View>
                <Text style={styles.subResult}>{resultsCount} found</Text>
              </View>
            )
          }

          {/* Services result list */}
          <View style={{ marginVertical: 16 }}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchQuery && resultsCount > 0 ? (
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
            ) : searchQuery ? (
              <NotFoundCard />
            ) : null}
          </View>
        </View>
      </View>
    )
  }

  // Toggle category selection
  const toggleCategory = (categoryId) => {
    const updatedCategories = [...selectedCategories];
    const index = updatedCategories.indexOf(categoryId);

    if (index === -1) {
      updatedCategories.push(categoryId);
    } else {
      updatedCategories.splice(index, 1);
    }

    setSelectedCategories(updatedCategories);
  };

  // toggle rating selection
  const toggleRating = (ratingId) => {
    const updatedRatings = [...selectedRating];
    const index = updatedRatings.indexOf(ratingId);

    if (index === -1) {
      updatedRatings.push(ratingId);
    } else {
      updatedRatings.splice(index, 1);
    }

    setSelectedRating(updatedRatings);
  };

  // Category item
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

  const renderRatingItem = ({ item }) => (
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
  );



  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>
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
          }]}>Filter</Text>
          <View style={styles.separateLine} />
          <View style={{ width: SIZES.width - 32 }}>
            <Text style={[styles.sheetTitle, { 
              color: dark ? COLORS.white : COLORS.greyscale900
            }]}>Category</Text>
            <FlatList
              data={categories}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              horizontal
              renderItem={renderCategoryItem}
            />
            <Text style={[styles.sheetTitle, { 
              color: dark ? COLORS.white : COLORS.greyscale900
            }]}>Filter</Text>
            <MultiSlider
              values={priceRange}
              sliderLength={SIZES.width - 32}
              onValuesChange={handleSliderChange}
              min={0}
              max={100}
              step={1}
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
            }]}>Rating</Text>
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
              title="Reset"
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
              title="Filter"
              filled
              style={styles.logoutButton}
              onPress={() => refRBSheet.current.close()}
            />
          </View>
        </RBSheet>
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
    width: SIZES.width - 32,
    justifyContent: "space-between",
    marginBottom: 16
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
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: SIZES.width - 32,
    justifyContent: "space-between"
  },
  tabBtn: {
    width: (SIZES.width - 32) / 2 - 6,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.4,
    borderColor: COLORS.primary,
    borderRadius: 32
  },
  selectedTab: {
    width: (SIZES.width - 32) / 2 - 6,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.4,
    borderColor: COLORS.primary,
    borderRadius: 32
  },
  tabBtnText: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: COLORS.primary,
    textAlign: "center"
  },
  selectedTabText: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: COLORS.white,
    textAlign: "center"
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "medium",
    marginTop: 10,
    color: COLORS.gray
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
  }
})

export default Search