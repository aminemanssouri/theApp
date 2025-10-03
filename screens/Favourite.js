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
            const services = await getUserFavoriteServices(user.id);
            const workers = await getUserFavoriteWorkers(user.id);
            let allFavorites = [...services, ...workers];

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

    useEffect(() => {
        loadFavorites();
    }, []);

    /** Render header */
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
                        {t('favorites.title')}
                    </Text>
                </View>
                <TouchableOpacity>
                    <Image
                        source={icons.moreCircle}
                        resizeMode='contain'
                        style={[styles.moreIcon, {
                            tintColor: dark ? COLORS.secondaryWhite : COLORS.greyscale900
                        }]}
                    />
                </TouchableOpacity>
            </View>
        )
    }

    /** Render my bookmark services */
    const renderMyWishlistServices = () => {
        return (
            <View>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={[styles.loadingText, { color: dark ? COLORS.white : COLORS.black }]}>
                            {t('favorites.loading')}
                        </Text>
                    </View>
                ) : myWishlistServices.length === 0 ? (
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
                        data={myWishlistServices}
                        keyExtractor={item => item.id}
                        refreshing={loading}
                        onRefresh={loadFavorites}
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

export default Favourite;
