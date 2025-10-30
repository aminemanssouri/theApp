import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Alert } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { addToFavorites, removeFromFavorites, getUserFavorites } from '../lib/services/favorites';
import { supabase } from '../lib/supabase';
import { t } from '../context/LanguageContext';
import ReviewStars from './ReviewStars';

const ServiceCard = ({
    name,
    image,
    providerName,
    price,
    isOnDiscount,
    oldPrice,
    rating,
    numReviews,
    onPress,
    serviceId,
    workerId,
    navigation
}) => {
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [loading, setLoading] = useState(false);
    const { dark } = useTheme();
    const { user } = useAuth();
    
    // Animation values
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0.98,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0.9,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    // Check if item is favorited on mount and when screen focuses
    const checkFavoriteStatus = async () => {
        if (!user?.id || (!serviceId && !workerId)) {
            setIsBookmarked(false);
            return;
        }
        
        try {
            // Get all user favorites
            const favorites = await getUserFavorites(user.id);
              
            // Check if this item is favorited
            let isFavorited = false;
            
            if (workerId && serviceId) {
                // For worker-service combinations - check both single and multiple service structures
                isFavorited = favorites.some(fav => {
                    if (fav.favorite_type === 'worker' && fav.favorite_id === workerId) {
                        const metadata = fav.metadata;
                        if (!metadata) return false;
                        
                        // Check single service structure
                        if (metadata.service_id === serviceId) {
                             return true;
                        }
                        
                        // Check multiple services structure
                        if (metadata.services && Array.isArray(metadata.services)) {
                            const serviceMatch = metadata.services.some(service => 
                                service.service_id === serviceId
                            );
                            if (serviceMatch) {
                                 return true;
                            }
                        }
                    }
                    return false;
                });
            } else if (workerId) {
                // For worker-only favorites (no service metadata or service_id is null)
                isFavorited = favorites.some(fav => {
                    const match = fav.favorite_type === 'worker' && 
                                 fav.favorite_id === workerId &&
                                 (!fav.metadata || (!fav.metadata.service_id && !fav.metadata.services));
                    if (match) {
                        console.log('✅ Found worker-only favorite match');
                    }
                    return match;
                });
            } else if (serviceId) {
                // For service-only favorites
                isFavorited = favorites.some(fav => {
                    const match = fav.favorite_type === 'service' && 
                                 fav.favorite_id === serviceId;
                    if (match) {
                        console.log('✅ Found service favorite match');
                    }
                    return match;
                });
            }
            
             setIsBookmarked(isFavorited);
        } catch (error) {
            console.error('❌ Error checking favorite status:', error);
            setIsBookmarked(false);
        }
    };

    // Check favorite status on mount
    useEffect(() => {
        checkFavoriteStatus();
    }, [user?.id, serviceId, workerId]);

    // Add focus listener to refresh favorite status when screen comes into focus
    useEffect(() => {
        const unsubscribe = navigation?.addListener?.('focus', () => {
            console.log('🔄 Screen focused, refreshing favorite status for:', name);
            checkFavoriteStatus();
        });

        return unsubscribe;
    }, [navigation, user?.id, serviceId, workerId]);

    // Handle bookmark toggle
    const handleBookmarkPress = async () => {
        if (!user?.id) {
            Alert.alert(t('favorites.login_required_title'), t('favorites.login_required_message'));
            return;
        }

        if (!serviceId && !workerId) {
            Alert.alert(t('common.error'), t('favorites.missing_id'));
            return;
        }

        if (loading) return;

        try {
            setLoading(true);
            
            // Determine favorite type and ID
            let favoriteType, favoriteId, metadata = null;
            
            console.log('🔍 Determining favorite type for:', { name, serviceId, workerId });
            
            if (workerId && serviceId) {
                // For worker-service combinations
                favoriteType = 'worker';
                favoriteId = workerId;
                metadata = {
                    service_id: serviceId,
                    service_name: name,
                    is_worker_service: true
                };
                console.log('📋 Worker-Service combination detected');
            } else if (workerId) {
                // For worker-only favorites
                favoriteType = 'worker';
                favoriteId = workerId;
                console.log('📋 Worker-only detected');
            } else if (serviceId) {
                // For service-only favorites
                favoriteType = 'service';
                favoriteId = serviceId;
                console.log('📋 Service-only detected');
            } else {
                console.error('❌ No valid ID found for favorite');
                return;
            }
            
            console.log('📝 Final favorite config:', { favoriteType, favoriteId, metadata });
            
            if (isBookmarked) {
                // Remove from favorites
                console.log('🗑️ Removing from favorites:', { name, serviceId, workerId });
                
                if (workerId && serviceId) {
                    // For worker-service combinations, we need special handling
                    const favorites = await getUserFavorites(user.id);
                    const targetFavorite = favorites.find(fav => 
                        fav.favorite_type === 'worker' && 
                        fav.favorite_id === workerId
                    );
                    
                    if (targetFavorite) {
                        const metadata = targetFavorite.metadata;
                        
                        // Check if single service or multiple services
                        if (metadata?.service_id === serviceId) {
                            // Single service - remove entire favorite
                            console.log('🗑️ Removing single service favorite');
                            await supabase.from('favorites').delete().eq('id', targetFavorite.id);
                        } else if (metadata?.services && Array.isArray(metadata.services)) {
                            // Multiple services - remove just this service from array
                            const updatedServices = metadata.services.filter(s => s.service_id !== serviceId);
                            
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
                    // For simple favorites, use the standard function
                    console.log('🗑️ Removing simple favorite');
                    await removeFromFavorites(user.id, favoriteType, favoriteId);
                }
                setIsBookmarked(false);
                console.log('✅ Removed from favorites:', name);
            } else {
                // Add to favorites - but first check if it already exists
                try {
                    // Check if this exact favorite already exists
                    const favorites = await getUserFavorites(user.id);
                    let alreadyExists = false;
                    
                    if (workerId && serviceId) {
                        // Check for worker-service combination - check both single and multiple structures
                        alreadyExists = favorites.some(fav => {
                            if (fav.favorite_type === 'worker' && fav.favorite_id === workerId) {
                                const metadata = fav.metadata;
                                if (!metadata) return false;
                                
                                // Check single service structure
                                if (metadata.service_id === serviceId) {
                                    return true;
                                }
                                
                                // Check multiple services structure
                                if (metadata.services && Array.isArray(metadata.services)) {
                                    return metadata.services.some(service => 
                                        service.service_id === serviceId
                                    );
                                }
                            }
                            return false;
                        });
                    } else {
                        // Check for simple favorites
                        alreadyExists = favorites.some(fav => 
                            fav.favorite_type === favoriteType && 
                            fav.favorite_id === favoriteId
                        );
                    }
                    
                    if (!alreadyExists) {
                        console.log('🔄 Adding to favorites:', {
                            userId: user.id,
                            favoriteType,
                            favoriteId,
                            metadata,
                            name
                        });
                        
                        const result = await addToFavorites(user.id, favoriteType, favoriteId, metadata);
                        console.log('📝 Add result:', result);
                        
                        setIsBookmarked(true);
                        console.log('✅ Added to favorites:', name);
                        
                        // Force refresh to verify it was added
                        setTimeout(() => {
                            checkFavoriteStatus();
                        }, 500);
                    } else {
                        // Already exists, just update UI
                        setIsBookmarked(true);
                        console.log('ℹ️ Already in favorites:', name);
                    }
                } catch (error) {
                    if (error.message === 'Item is already in favorites') {
                        // Handle the duplicate case gracefully
                        setIsBookmarked(true);
                        console.log('ℹ️ Already in favorites (caught):', name);
                    } else {
                        throw error; // Re-throw other errors
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error toggling favorite:', error);
            Alert.alert(t('common.error'), t('favorites.failed_update'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Animated.View
            style={{
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
            }}
        >
            <TouchableOpacity 
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
                style={[styles.container, { 
                    backgroundColor: dark ? COLORS.dark2 : COLORS.white
                }]}>
                <Image
                    source={image}
                    resizeMode='cover'
                    style={styles.courseImage}
                />
                <View style={styles.contentContainer}>
                    <View style={styles.topContainer}>
                        <View style={styles.categoryContainer}>
                            <Text 
                                style={styles.categoryName} 
                                numberOfLines={1} 
                                ellipsizeMode="tail"
                            >
                                {providerName}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleBookmarkPress}
                            style={styles.bookmarkButton}
                            disabled={loading}>
                            <Image
                                source={isBookmarked ? icons.heart : icons.heartOutline}
                                resizeMode='contain'
                                style={[styles.bookmarkIcon, { 
                                    tintColor: isBookmarked? COLORS.red : COLORS.primary,
                                    opacity: loading ? 0.5 : 1
                                }]}
                            />
                        </TouchableOpacity>
                    </View>
                    <Text 
                        style={[styles.name, { 
                            color: dark ? COLORS.secondaryWhite : COLORS.greyscale900,
                        }]} 
                        numberOfLines={2} 
                        ellipsizeMode="tail"
                    >
                        {name}
                    </Text>
                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>${price}</Text>
                        {
                            isOnDiscount && <Text style={[styles.oldPrice, { 
                                color: dark ? COLORS.greyscale300 : COLORS.grayscale700,
                            }]}>{"   "}${oldPrice}</Text>
                        }
                    </View>
                    <View style={styles.ratingContainer}>
                        <ReviewStars 
                            review={rating || 0} 
                            size={14}
                            color="orange"
                        />
                        <Text style={[styles.rating, { color: dark ? COLORS.greyscale300 : COLORS.grayscale700 }]}> {" "}{rating || '0.0'}</Text>
                        <Text style={[styles.numReviews, { color: dark ? COLORS.greyscale300 : COLORS.grayscale700 }]}> |  {t('service.reviews_count', { count: numReviews || 0 })}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: SIZES.width - 32,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems:"center",
        height: 148,
        backgroundColor: COLORS.white,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 0,
        marginVertical: 8
    },
    courseImage: {
        width: 124,
        height: 124,
        borderRadius: 16,
        marginRight: 16,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    categoryContainer: {
        flex: 1,
        marginRight: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: COLORS.transparentTertiary,
        borderRadius: 4,
        alignItems: 'flex-start',
        justifyContent: 'center',
        maxWidth: '80%',
    },
    categoryName: {
        fontSize: 12,
        fontFamily: 'semiBold',
        color: COLORS.primary
    },
    bookmarkButton: {
        padding: 4,
    },
    bookmarkIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.primary
    },
    name: {
        fontSize: 15,
        fontFamily: 'bold',
        color: COLORS.black,
        marginVertical: 6,
        lineHeight: 20,
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4
    },
    price: {
        fontSize: 18,
        fontFamily: 'bold',
        color: COLORS.primary,
    },
    oldPrice: {
        fontSize: 14,
        fontFamily: 'medium',
        color: "gray",
        textDecorationLine: 'line-through',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        fontSize: 14,
        fontFamily: 'medium',
        color: "gray",
    },
    numReviews: {
        fontSize: 12,
        fontFamily: 'medium',
        color: "gray",
        marginLeft: 8,
    }
})

export default ServiceCard