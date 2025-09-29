import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

const WishlistServiceCard = ({
    name,
    image,
    providerName,
    price,
    isOnDiscount,
    oldPrice,
    rating,
    numReviews,
    onPress,
    bookmarkOnPress,
    containerStyles
}) => {
    const { dark } = useTheme();

    return (
        <TouchableOpacity onPress={onPress} 
        style={[styles.container, containerStyles, { 
            backgroundColor: dark ? COLORS.dark2 : COLORS.white
        } ]}>
            <Image
                source={image}
                resizeMode='cover'
                style={styles.courseImage}
            />
            <View style={styles.contentContainer}>
                <View style={styles.topContainer}>
                    <View style={styles.categoryContainer}>
                        <Text 
                            style={[styles.categoryName, {
                                color: dark ? COLORS.primary : COLORS.primary
                            }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {providerName}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={bookmarkOnPress}
                        style={styles.bookmarkButton}>
                        <Image
                            source={icons.heart}
                            resizeMode='contain'
                            style={styles.bookmarkIcon}
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
                    <Text style={[styles.price, {
                        color: dark ? COLORS.primary : COLORS.primary
                    }]}>${price}</Text>
                    {
                        isOnDiscount && <Text style={[styles.oldPrice, { 
                            color: dark ? COLORS.greyscale300 : COLORS.grayscale700
                        }]}>{"   "}${oldPrice}</Text>
                    }
                </View>
                
                <View style={styles.ratingContainer}>
                    <FontAwesome name="star" size={14} color="#FFA500" />
                    <Text style={[styles.rating, { 
                        color: dark ? COLORS.greyscale300 : COLORS.grayscale700 
                    }]}> {rating || '0.0'}</Text>
                    <Text style={[styles.numReviews, { 
                        color: dark ? COLORS.greyscale300 : COLORS.grayscale700 
                    }]}> | {numReviews || 0} reviews</Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        width: SIZES.width - 32,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        minHeight: 140,
        backgroundColor: COLORS.white,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        marginVertical: 6,
        marginHorizontal: 16,
    },
    courseImage: {
        width: 110,
        height: 110,
        borderRadius: 12,
        marginRight: 14,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 2,
    },
    topContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    categoryContainer: {
        flex: 1,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: COLORS.transparentTertiary,
        borderRadius: 6,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 8,
    },
    categoryName: {
        fontSize: 12,
        fontFamily: 'semiBold',
        color: COLORS.primary
    },
    bookmarkButton: {
        padding: 4,
        marginTop: -4,
    },
    bookmarkIcon: {
        width: 22,
        height: 22,
        tintColor: COLORS.red
    },
    name: {
        fontSize: 15,
        fontFamily: 'bold',
        color: COLORS.black,
        marginBottom: 8,
        lineHeight: 20,
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8
    },
    price: {
        fontSize: 17,
        fontFamily: 'bold',
        color: COLORS.primary,
    },
    oldPrice: {
        fontSize: 13,
        fontFamily: 'medium',
        color: "gray",
        textDecorationLine: 'line-through',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        fontSize: 13,
        fontFamily: 'medium',
        color: "gray",
    },
    numReviews: {
        fontSize: 12,
        fontFamily: 'medium',
        color: "gray",
    }
})

export default WishlistServiceCard