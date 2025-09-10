import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Platform, Alert } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { getSafeAreaInsets } from '../utils/safeAreaUtils';
import { ScrollView } from 'react-native-virtualized-view';
import { category } from '../data';
import RBSheet from "react-native-raw-bottom-sheet";
import Button from '../components/Button';
import WishlistServiceCard from '../components/WishlistServiceCard';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { getUserFavoriteServices, getUserFavoriteWorkers, removeFavoriteById } from '../lib/services/favorites';

const Favourite = ({ navigation }) => {
    const refRBSheet = useRef();
    const [selectedWishlistItem, setSelectedWishlistItem] = useState(null);
    const [myWishlistServices, setMyWishlistServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { colors, dark } = useTheme();
    const { user } = useAuth();
    const insets = getSafeAreaInsets();

    // Calculate bottom spacing to avoid tab bar overlap
    const getBottomSpacing = () => {
        const baseTabHeight = 60;
        const safeAreaBottom = insets.bottom;
        
        if (Platform.OS === 'ios') {
            return baseTabHeight + safeAreaBottom + 20;
        } else {
            return baseTabHeight + Math.max(safeAreaBottom, 10) + 20;
        }
    };

    // Load user's favorite services and workers from database
    const loadFavorites = async () => {
        if (!user?.id) {
            console.log('No user ID found, cannot load favorites');
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            console.log('Loading favorites for user:', user.id);
            
            // Load both service and worker favorites
            const [serviceFavorites, workerFavorites] = await Promise.all([
                getUserFavoriteServices(user.id),
                getUserFavoriteWorkers(user.id)
            ]);
            
            console.log('Raw service favorites:', serviceFavorites);
            console.log('Raw worker favorites:', workerFavorites);
            
            const allFavorites = [];
            
            // Transform service favorites
            if (serviceFavorites && serviceFavorites.length > 0) {
                const transformedServices = serviceFavorites.map(fav => {
                    console.log('Transforming service favorite:', fav);
                    return {
                        id: fav.id,
                        favoriteId: fav.favorite_id,
                        favoriteType: 'service',
                        name: fav.services?.name || 'Unknown Service',
                        description: fav.services?.description || '',
                        price: fav.services?.base_price || 0,
                        image: fav.services?.icon || null,
                        categoryId: fav.services?.service_categories?.id || '1',
                        categoryName: fav.services?.service_categories?.name || 'General',
                        isActive: fav.services?.is_active || false,
                        createdAt: fav.created_at,
                        // Mock data for compatibility with existing card
                        providerName: 'Service Provider',
                        rating: 4.5,
                        numReviews: 0,
                        isOnDiscount: false,
                        oldPrice: null
                    };
                });
                allFavorites.push(...transformedServices);
            }
            
            // Transform worker favorites
            if (workerFavorites && workerFavorites.length > 0) {
                const transformedWorkers = workerFavorites.map(fav => {
                    console.log('Transforming worker favorite:', fav);
                    
                    // Handle worker-service combinations differently
                    if (fav.isWorkerService && fav.serviceMetadata) {
                        return {
                            id: `${fav.id}_${fav.serviceMetadata.service_id}`,
                            favoriteId: fav.favorite_id,
                            favoriteType: 'worker_service',
                            name: `${fav.serviceMetadata.service_name || 'Service'} - ${fav.workers?.first_name || ''} ${fav.workers?.last_name || ''}`.trim(),
                            description: fav.workers?.bio || 'Professional service provider',
                            price: fav.workers?.hourly_rate || 0,
                            image: fav.workers?.Image || null,
                            categoryId: '1',
                            categoryName: 'Worker Service',
                            isActive: fav.workers?.is_available || false,
                            createdAt: fav.created_at,
                            providerName: `${fav.workers?.first_name || ''} ${fav.workers?.last_name || ''}`.trim() || 'Service Provider',
                            rating: fav.workers?.average_rating || 0,
                            numReviews: fav.workers?.total_jobs || 0,
                            isOnDiscount: false,
                            oldPrice: null,
                            workerId: fav.favorite_id, // Worker ID is stored in favorite_id
                            serviceId: fav.serviceMetadata.service_id
                        };
                    } else {
                        // Regular worker favorites
                        return {
                            id: fav.id,
                            favoriteId: fav.favorite_id,
                            favoriteType: 'worker',
                            name: `${fav.workers?.first_name || ''} ${fav.workers?.last_name || ''}`.trim() || 'Unknown Worker',
                            description: fav.workers?.bio || 'Professional service provider',
                            price: fav.workers?.hourly_rate || 0,
                            image: fav.workers?.Image || null,
                            categoryId: '1',
                            categoryName: 'Worker',
                            isActive: fav.workers?.is_available || false,
                            createdAt: fav.created_at,
                            providerName: 'Service Provider',
                            rating: fav.workers?.average_rating || 0,
                            numReviews: fav.workers?.total_jobs || 0,
                            isOnDiscount: false,
                            oldPrice: null,
                            workerId: fav.favorite_id
                        };
                    }
                });
                allFavorites.push(...transformedWorkers);
            }
            
            // Sort by creation date (newest first)
            allFavorites.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            console.log('All transformed favorites:', allFavorites);
            setMyWishlistServices(allFavorites);
            
            if (allFavorites.length === 0) {
                console.log('No favorites found for user');
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
            setMyWishlistServices([]);
        } finally {
            setLoading(false);
        }
    };

    // Remove favorite from database
    const handleRemoveBookmark = async () => {
        if (!selectedWishlistItem || !user?.id) return;
        
        try {
            await removeFavoriteById(selectedWishlistItem.id, user.id);
            
            // Update local state
            const updatedFavorites = myWishlistServices.filter(
                (item) => item.id !== selectedWishlistItem.id
            );
            setMyWishlistServices(updatedFavorites);
            
            // Close the bottom sheet
            refRBSheet.current.close();
            
            // Silently removed - no alert needed
        } catch (error) {
            console.error('Error removing favorite:', error);
            Alert.alert('Error', 'Failed to remove from favorites');
        }
    };

    // Refresh favorites
    const onRefresh = async () => {
        setRefreshing(true);
        await loadFavorites();
        setRefreshing(false);
    };

    // Load favorites on mount and when user changes
    useEffect(() => {
        console.log('Favourite screen useEffect triggered, user:', user);
        if (user?.id) {
            loadFavorites();
        } else {
            console.log('No user found, clearing favorites');
            setMyWishlistServices([]);
            setLoading(false);
        }
    }, [user?.id]);

    // Add focus listener to reload favorites when screen comes into focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            console.log('Favourite screen focused, reloading favorites');
            if (user?.id) {
                loadFavorites();
            }
        });

        return unsubscribe;
    }, [navigation, user?.id]);
    
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
                                tintColor: dark? COLORS.white : COLORS.greyscale900
                            }]}
                        />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { 
                        color: dark? COLORS.white : COLORS.greyscale900
                    }]}>
                        My Wishlist
                    </Text>
                </View>
                <TouchableOpacity>
                    <Image
                        source={icons.moreCircle}
                        resizeMode='contain'
                        style={[styles.moreIcon, { 
                            tintColor: dark? COLORS.secondaryWhite : COLORS.greyscale900
                        }]}
                    />
                </TouchableOpacity>
            </View>
        )
    }
    /**
       * Render my bookmark courses
       */
    const renderMyWishlistServices = () => {
        const [selectedCategories, setSelectedCategories] = useState(["1"]);

        const filteredServices = myWishlistServices.filter(course => selectedCategories.includes("1") || selectedCategories.includes(course.categoryId));

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

        return (
            <View>
                <View style={styles.categoryContainer}>
                    <FlatList
                        data={category}
                        keyExtractor={item => item.id}
                        showsHorizontalScrollIndicator={false}
                        horizontal
                        renderItem={renderCategoryItem}
                    />
                </View>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={[styles.loadingText, { color: dark ? COLORS.white : COLORS.black }]}>
                            Loading favorites...
                        </Text>
                    </View>
                ) : filteredServices.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: dark ? COLORS.white : COLORS.black }]}>
                            No favorites yet
                        </Text>
                        <Text style={[styles.emptySubtext, { color: dark ? COLORS.white : COLORS.greyscale600 }]}>
                            Start adding services to your wishlist!
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredServices}
                        keyExtractor={item => item.id}
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        renderItem={({ item }) => {
                            return (
                                <WishlistServiceCard
                                    name={item.name}
                                    image={item.image}
                                    providerName={item.providerName}
                                    price={item.price}
                                    isOnDiscount={item.isOnDiscount}
                                    oldPrice={item.oldPrice}
                                    rating={item.rating}
                                    numReviews={item.numReviews}
                                    onPress={() => {
                                        if (item.favoriteType === 'worker') {
                                            navigation.navigate("WorkerDetails", { workerId: item.workerId || item.favoriteId });
                                        } else if (item.favoriteType === 'worker_service') {
                                            navigation.navigate("WorkerDetails", { 
                                                workerId: item.workerId,
                                                serviceId: item.serviceId
                                            });
                                        } else {
                                            navigation.navigate("ServiceDetails", { serviceId: item.favoriteId });
                                        }
                                    }}
                                    categoryId={item.categoryId}
                                    bookmarkOnPress={() => {
                                        // Show the bookmark item in the bottom sheet
                                        setSelectedWishlistItem(item);
                                        refRBSheet.current.open()
                                    }}
                                />
                            )
                        }}
                    />
                )}
            </View>
        )
    }

    return (
        <View style={[styles.area, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {renderHeader()}
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingBottom: getBottomSpacing(),
                    }}
                >
                    {renderMyWishlistServices()}
                </ScrollView>
            </View>
            <RBSheet
                ref={refRBSheet}
                closeOnDragDown={true}
                closeOnPressMask={false}
                height={380}
                customStyles={{
                    wrapper: {
                        backgroundColor: "rgba(0,0,0,0.5)",
                    },
                    draggableIcon: {
                        backgroundColor: dark ? COLORS.greyscale300 : COLORS.greyscale300,
                    },
                    container: {
                        borderTopRightRadius: 32,
                        borderTopLeftRadius: 32,
                        height: 380,
                        backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                        alignItems: "center",
                        width: "100%"
                    }
                }}>
                <Text style={[styles.bottomSubtitle, { 
                    color: dark ? COLORS.white : COLORS.black
                }]}>Remove from Bookmark?</Text>
                <View style={styles.separateLine} />

                <View style={[styles.selectedBookmarkContainer, { 
                    ackgroundColor: dark ? COLORS.dark2 : COLORS.tertiaryWhite
                }]}>
                    <WishlistServiceCard
                        name={selectedWishlistItem?.name}
                        image={selectedWishlistItem?.image}
                        providerName={selectedWishlistItem?.providerName}
                        price={selectedWishlistItem?.price}
                        isOnDiscount={selectedWishlistItem?.isOnDiscount}
                        oldPrice={selectedWishlistItem?.oldPrice}
                        rating={selectedWishlistItem?.rating}
                        numReviews={selectedWishlistItem?.numReviews}
                        onPress={() => navigation.navigate("ServiceDetails")}
                        categoryId={selectedWishlistItem?.categoryId}
                        containerStyles={{
                            backgroundColor: COLORS.white
                        }}
                    />
                </View>

                <View style={styles.bottomContainer}>
                    <Button
                        title="Cancel"
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
                        title="Yes, Remove"
                        filled
                        style={styles.removeButton}
                        onPress={handleRemoveBookmark}
                    />
                </View>
            </RBSheet>
        </View>
    )
};

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white,
            paddingTop: Platform.OS === 'android' ? 25 : 0,

    },
container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16, 
     marginBottom: 32,
    paddingVertical: 16,

  },
    headerContainer: {
        flexDirection: "row",
            alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center"
    },
  
    headerTitle: {
        fontSize: 22,
        fontFamily: 'bold',
        color: COLORS.black,
        marginLeft: 12
    }, 
    
    backIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.black
    },
    moreIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.black
    },
    categoryContainer: {
        marginTop: 0
    },
    bottomContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginVertical: 16,
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
    selectedBookmarkContainer: {
        marginVertical: 16
    },
    separateLine: {
        width: "100%",
        height: .2,
        backgroundColor: COLORS.greyscale300,
        marginHorizontal: 16
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'medium'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50
    },
    emptyText: {
        fontSize: 18,
        fontFamily: 'bold',
        marginBottom: 8
    },
    emptySubtext: {
        fontSize: 14,
        fontFamily: 'regular',
        textAlign: 'center'
    }
})

export default Favourite