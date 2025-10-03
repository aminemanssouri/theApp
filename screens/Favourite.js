import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Platform, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { getSafeAreaInsets } from '../utils/safeAreaUtils';
import { ScrollView } from 'react-native-virtualized-view';
import { category } from '../data';
import WishlistServiceCard from '../components/WishlistServiceCard';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { getUserFavoriteServices, getUserFavoriteWorkers, removeFavoriteById, getUserFavorites } from '../lib/services/favorites';
import { supabase } from '../lib/supabase';
import { t } from '../context/LanguageContext';
const Favourite = ({ navigation }) => {
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
                        name: fav.services?.name || t('service.unknown_service'),
                        description: fav.services?.description || '',
                        price: fav.services?.base_price || 0,
                        image: fav.services?.icon || null,
                        categoryId: fav.services?.service_categories?.id || '1',
                        categoryName: fav.services?.service_categories?.name || t('common.general'),
                        isActive: fav.services?.is_active || false,
                        createdAt: fav.created_at,
                        // Mock data for compatibility with existing card
                        providerName: t('chat.service_provider'),
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
                            name: `${fav.serviceMetadata.service_name || t('service.unknown_service')} - ${fav.workers?.first_name || ''} ${fav.workers?.last_name || ''}`.trim(),
                            description: fav.workers?.bio || t('worker.professional'),
                            price: fav.workers?.hourly_rate || 0,
                            image: fav.workers?.Image || null,
                            categoryId: '1',
                            categoryName: t('worker.worker_service'),
                            isActive: fav.workers?.is_available || false,
                            createdAt: fav.created_at,
                            providerName: `${fav.workers?.first_name || ''} ${fav.workers?.last_name || ''}`.trim() || t('chat.service_provider'),
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
                            name: `${fav.workers?.first_name || ''} ${fav.workers?.last_name || ''}`.trim() || t('worker.unknown_worker'),
                            description: fav.workers?.bio || t('worker.professional'),
                            price: fav.workers?.hourly_rate || 0,
                            image: fav.workers?.Image || null,
                            categoryId: '1',
                            categoryName: t('worker.worker'),
                            isActive: fav.workers?.is_available || false,
                            createdAt: fav.created_at,
                            providerName: t('chat.service_provider'),
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


    // Handle bookmark press - remove favorite directly without modal
    const handleBookmarkPress = async (item) => {
        if (!item || !user?.id) return;
        
        try {
            console.log('🗑️ Removing favorite from Favourites screen:', item);
            
            if (item.favoriteType === 'worker_service') {
                // For worker-service combinations, handle complex metadata
                const favorites = await getUserFavorites(user.id);
                const targetFavorite = favorites.find(fav => 
                    fav.favorite_type === 'worker' && 
                    fav.favorite_id === item.workerId
                );
                
                if (targetFavorite) {
                    const metadata = targetFavorite.metadata;
                    
                    // Check if single service or multiple services
                    if (metadata?.service_id === item.serviceId) {
                        // Single service - remove entire favorite
                        console.log('🗑️ Removing single service favorite');
                        await supabase.from('favorites').delete().eq('id', targetFavorite.id);
                    } else if (metadata?.services && Array.isArray(metadata.services)) {
                        // Multiple services - remove just this service from array
                        const updatedServices = metadata.services.filter(s => s.service_id !== item.serviceId);
                        
                        if (updatedServices.length === 0) {
                            // No services left, remove entire favorite
                            console.log('🗑️ No services left, removing entire favorite');
                            await supabase.from('favorites').delete().eq('id', targetFavorite.id);
                        } else if (updatedServices.length === 1) {
                            // Only one service left, convert back to single service structure
                            console.log('🗑️ Converting back to single service');
                            const updatedMetadata = {
                                service_id: updatedServices[0].service_id,
                                service_name: updatedServices[0].service_name,
                                is_worker_service: true
                            };
                            await supabase.from('favorites')
                                .update({ metadata: updatedMetadata })
                                .eq('id', targetFavorite.id);
                        } else {
                            // Multiple services remain, update array
                            console.log('🗑️ Updating services array');
                            const updatedMetadata = {
                                ...metadata,
                                services: updatedServices
                            };
                            await supabase.from('favorites')
                                .update({ metadata: updatedMetadata })
                                .eq('id', targetFavorite.id);
                        }
                    }
                }
            } else {
                // For service or worker favorites, use the database record ID
                console.log('🗑️ Removing simple favorite');
                await removeFavoriteById(item.id, user.id);
            }
            
            // Update local state
            const updatedFavorites = myWishlistServices.filter(
                (favorite) => favorite.id !== item.id
            );
            setMyWishlistServices(updatedFavorites);
            
            // Optional: Show a brief toast/feedback that item was removed
            console.log('✅ Favorite removed:', item.name);
        } catch (error) {
            console.error('❌ Error removing favorite:', error);
            Alert.alert(t('common.error'), t('favorites.failed_remove'));
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
                        {t('favorites.title')}
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
                            {t('favorites.loading')}
                        </Text>
                    </View>
                ) : filteredServices.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: dark ? COLORS.white : COLORS.black }]}>
                            {t('favorites.empty_title')}
                        </Text>
                        <Text style={[styles.emptySubtext, { color: dark ? COLORS.white : COLORS.greyscale600 }]}>
                            {t('favorites.empty_sub')}
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
                                    bookmarkOnPress={() => handleBookmarkPress(item)}
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
        </View>
    )
};

const styles = StyleSheet.create({
    area: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
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