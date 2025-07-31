import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import React, { useState, useRef } from 'react';
import { COLORS, SIZES, icons, images } from '../constants';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

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
    worker,
    hasWorker
}) => {
    const [isBookmarked, setIsBookmarked] = useState(false);
    const { dark } = useTheme();
    
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
                {/* Left side - service image */}
                <Image
                    source={image}
                    resizeMode='cover'
                    style={styles.courseImage}
                />
                
                <View style={{ flex: 1 }}>
                    {/* Provider name tag */}
                    <View style={styles.topContainer}>
                        <View style={styles.categoryContainer}>
                            <Text style={styles.categoryName}>
                                {(hasWorker && worker && worker.display_name) || providerName || "Service Provider"}
                            </Text>
                        </View>
                        
                        {/* Bookmark button */}
                        <TouchableOpacity
                            onPress={() => setIsBookmarked(!isBookmarked)}
                            style={styles.bookmarkButton}>
                            <Image
                                source={isBookmarked ? icons.heart : icons.heartOutline}
                                resizeMode='contain'
                                style={[styles.bookmarkIcon, { 
                                    tintColor: isBookmarked? COLORS.red : COLORS.primary
                                }]}
                            />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Service name */}
                    <Text style={[styles.name, { 
                         color: dark ? COLORS.secondaryWhite : COLORS.greyscale900,
                    }]} numberOfLines={1} ellipsizeMode="tail">{name || "Service"}</Text>
                    
                    {/* Worker info if available */}
                    {hasWorker && worker && (
                        <View style={styles.workerInfoContainer}>
                            <Image
                                source={images.user5} // Using placeholder image since profile_image isn't in schema
                                style={styles.workerThumbnail}
                            />
                            <View>
                                <Text style={[styles.workerName]}>
                                    {worker.display_name || worker.worker_full_name || worker.full_name || providerName || `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || "Professional"}
                                </Text>
                                <Text style={styles.workerJobsText}>
                                    {worker.total_jobs || worker.completed_jobs || 0} jobs completed
                                </Text>
                            </View>
                        </View>
                    )}
                    
                    {/* Price section */}
                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>${price}</Text>
                        {
                            isOnDiscount && <Text style={[styles.oldPrice, { 
                                color: dark ? COLORS.greyscale300 : COLORS.grayscale700,
                            }]}>{"   "}${oldPrice}</Text>
                        }
                    </View>
                    
                    {/* Rating section */}
                    <View style={styles.ratingContainer}>
                        <FontAwesome name="star-half-empty" size={16} color="orange" />
                        <Text style={[styles.rating, { color: dark ? COLORS.greyscale300 : COLORS.grayscale700 }]}> {" "}{rating}</Text>
                        <Text style={[styles.numReviews, { color: dark ? COLORS.greyscale300 : COLORS.grayscale700 }]}>
                            {" "} | {" "}{hasWorker ? "Jobs" : "Reviews"}: {numReviews}
                        </Text>
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
        height: 160, // Increased height to accommodate worker info
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
    topContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    categoryContainer: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: COLORS.transparentTertiary,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryName: {
        fontSize: 14,
        fontFamily: 'semiBold',
        color: COLORS.primary
    },
    bookmarkIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.primary
    },
    name: {
        fontSize: 16,
        fontFamily: 'bold',
        color: COLORS.black,
        marginVertical: 6,
    },
    // Worker specific styles
    workerInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    workerThumbnail: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    workerName: {
        fontSize: 13,
        fontFamily: 'semiBold',
        color: COLORS.greyscale900,
    },
    workerJobsText: {
        fontSize: 12,
        fontFamily: 'regular',
        color: COLORS.greyscale700,
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6
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
        fontSize: 14,
        fontFamily: 'medium',
        color: "gray",
        marginLeft: 8,
    }
})

export default ServiceCard