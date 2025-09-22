import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Alert } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { 
    toggleFavorite, 
    isFavorited,
    isWorkerServiceFavorited,
    toggleWorkerServiceFavorite
} from '../lib/services/favorites';
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
    workerId
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

    // Check if item is favorited on mount
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (!user?.id || (!serviceId && !workerId)) return;
            
            try {
                if (workerId && serviceId) {
                    // For worker-service combinations, check if this specific combination exists
                    const favorited = await isWorkerServiceFavorited(user.id, workerId, serviceId);
                    setIsBookmarked(favorited);
                } else if (workerId) {
                    // For worker-only favorites
                    const favoriteType = 'worker';
                    const favoriteId = workerId;
                    const favorited = await isFavorited(user.id, favoriteType, favoriteId);
                    setIsBookmarked(favorited);
                } else {
                    // For service-only favorites
                    const favoriteType = 'service';
                    const favoriteId = serviceId;
                    const favorited = await isFavorited(user.id, favoriteType, favoriteId);
                    setIsBookmarked(favorited);
                }
            } catch (error) {
                console.error('Error checking favorite status:', error);
            }
        };
        
        checkFavoriteStatus();
    }, [user?.id, serviceId, workerId]);

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
            
            let favoriteType, favoriteId, metadata = null;
            
            if (workerId && serviceId) {
                // For worker-service combinations, use worker type with service metadata
                favoriteType = 'worker';
                favoriteId = workerId;
                metadata = {
                    service_id: serviceId,
                    service_name: name,
                    is_worker_service: true
                };
            } else if (workerId) {
                // For worker-only favorites
                favoriteType = 'worker';
                favoriteId = workerId;
            } else {
                // For service-only favorites
                favoriteType = 'service';
                favoriteId = serviceId;
            }
            
            if (workerId && serviceId) {
                // For worker-service combinations, use special toggle function
                const result = await toggleWorkerServiceFavorite(user.id, workerId, serviceId, name);
                setIsBookmarked(result.isFavorited);
            } else {
                // For regular favorites
                const result = await toggleFavorite(user.id, favoriteType, favoriteId, metadata);
                setIsBookmarked(result.isFavorited);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
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
        maxWidth: '80%', // Limit width to prevent overflow
    },
    categoryName: {
        fontSize: 12, // Slightly smaller for longer text
        fontFamily: 'semiBold',
        color: COLORS.primary
    },
    bookmarkButton: {
        padding: 4, // Add padding for better touch target
    },
    bookmarkIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.primary
    },
    name: {
        fontSize: 15, // Slightly smaller to fit better
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
        fontSize: 12, // Slightly smaller
        fontFamily: 'medium',
        color: "gray",
        marginLeft: 8,
    }
})

export default ServiceCard