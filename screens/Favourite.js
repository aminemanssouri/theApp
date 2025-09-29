import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Platform, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { getSafeAreaInsets } from '../utils/safeAreaUtils';
import { ScrollView } from 'react-native-virtualized-view';
import { category } from '../data';
import WishlistServiceCard from '../components/WishlistServiceCard';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { getUserFavoriteServices, getUserFavoriteWorkers, removeFavoriteById } from '../lib/services/favorites';
import { t } from '../context/LanguageContext';

const Favourite = ({ navigation }) => {
    const [selectedCategories, setSelectedCategories] = useState(["1"]);
    const { colors, dark } = useTheme();
    const { user } = useAuth();
    const { favorites, loading, refreshFavorites, removeFavoriteFromContext } = useFavorites();
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


    // Remove favorite from database directly (no modal)
    const handleRemoveBookmark = async (item) => {
        if (!item || !user?.id) return;
        
        try {
            // Check if the ID is a composite ID (contains underscore and multiple UUIDs)
            const isCompositeId = item.id.includes('_') && item.id.split('_').length > 1;
            
            if (isCompositeId) {
                // For composite IDs, extract the real database ID (first part)
                const realId = item.id.split('_')[0];
                await removeFavoriteById(realId, user.id);
            } else {
                // For regular IDs, use as is
                await removeFavoriteById(item.id, user.id);
            }
            
            // Update global context
            if (item.favoriteType === 'worker_service') {
                removeFavoriteFromContext(
                    item.workerId, 
                    'worker_service', 
                    item.workerId, 
                    item.serviceId
                );
            } else {
                removeFavoriteFromContext(
                    item.favoriteId, 
                    item.favoriteType
                );
            }
            
            // Silently removed - no alert needed
        } catch (error) {
            console.error('Error removing favorite:', error);
            Alert.alert(t('common.error'), t('favorites.failed_remove'));
        }
    };

    // Refresh favorites
    const onRefresh = async () => {
        await refreshFavorites();
    };

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
        const filteredServices = favorites.filter(course => selectedCategories.includes("1") || selectedCategories.includes(course.categoryId));
        const filteredServicesLength = filteredServices.length;

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
                        refreshing={loading}
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
                                    bookmarkOnPress={() => handleRemoveBookmark(item)}
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