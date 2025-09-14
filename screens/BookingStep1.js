import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { COLORS, SIZES } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import BookingItem from '../components/BookingItem';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { getServiceAddons } from '../lib/services/addons';
import { useI18n } from '../context/LanguageContext';

const BookingStep1 = ({ navigation, route }) => {
    const { colors, dark } = useTheme();
    const { t } = useI18n();
    const { serviceId, serviceName, workerId, workerName, workerRate } = route.params || {};
    
    const [selectedItems, setSelectedItems] = useState({});
    const [realAddons, setRealAddons] = useState([]);
    const [loadingAddons, setLoadingAddons] = useState(false);
    
    useEffect(() => {
        const fetchAddons = async () => {
            if (!serviceId) return;
            
            try {
                setLoadingAddons(true);
                const addons = await getServiceAddons(serviceId);
                setRealAddons(addons);
            } catch (error) {
                console.log('Error fetching addons:', error);
                setRealAddons([]);
            } finally {
                setLoadingAddons(false);
            }
        };
        
        fetchAddons();
    }, [serviceId]);
    
    const getAllItems = () => {
        const addonItems = realAddons.map(addon => ({
            id: `addon_${addon.id}`,
            name: addon.name,
            price: addon.price,
            description: addon.description,
            isAddon: true,
            addonId: addon.id
        }));
        
        return [...addonItems];
    };

    // Localize known addon names (e.g., room names) while leaving unknown names as-is
    const localizeAddonName = (name) => {
        if (!name) return name;
        const key = String(name).trim().toLowerCase();
        const map = {
            'living room': 'booking.rooms.living_room',
            'kitchen': 'booking.rooms.kitchen',
            'bathroom': 'booking.rooms.bathroom',
            'bedroom': 'booking.rooms.bedroom',
            'dining room': 'booking.rooms.dining_room',
            'master bedroom': 'booking.rooms.master_bedroom',
            'office': 'booking.rooms.office',
            'terrace': 'booking.rooms.terrace',
            'garden': 'booking.rooms.garden',
            'garage': 'booking.rooms.garage',
        };
        const tKey = map[key];
        return tKey ? t(tKey) : name;
    };
    
    const handleItemChange = (itemId, itemName, quantity, itemPrice = 10, isAddon = false, addonId = null) => {
        setSelectedItems(prev => {
            if (quantity === 0) {
                const newItems = { ...prev };
                delete newItems[itemId];
                return newItems;
            } else {
                return {
                    ...prev,
                    [itemId]: {
                        id: itemId,
                        name: itemName,
                        quantity: quantity,
                        price: itemPrice,
                        isAddon: isAddon,
                        addonId: addonId
                    }
                };
            }
        });
    };
    
    const calculatePrice = () => {
        let basePrice = (workerRate || 30) * 2;
        
        const itemsPrice = Object.values(selectedItems).reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        
        return basePrice + itemsPrice;
    };
    
    const getAddons = () => {
        return Object.values(selectedItems)
            .filter(item => item.isAddon) 
            .map(item => ({
                addon_id: item.addonId,
                name: item.name,
                quantity: item.quantity,
                price: item.price
            }));
    };
    
    // Header component for FlatList
    const ListHeaderComponent = () => (
        <>
            <Text style={[styles.itemNum, { 
                color: dark? COLORS.white : COLORS.greyscale900,
                marginTop: 22
            }]}>{t('booking.select_items_and_quantities')}</Text>
            
            {loadingAddons && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>
                        {t('booking.loading_addons')}
                    </Text>
                </View>
            )}
        </>
    );
    
    // Footer component for FlatList (Summary)
    const ListFooterComponent = () => {
        if (Object.keys(selectedItems).length === 0) return null;
        
        return (
            <View style={[styles.summaryContainer, {
                backgroundColor: dark ? COLORS.dark2 : COLORS.tertiaryWhite,
                borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                marginBottom: 100, // Add space for the bottom button
            }]}>
                <Text style={[styles.summaryTitle, {
                    color: dark ? COLORS.white : COLORS.greyscale900
                }]}>{t('booking.selected_items')}</Text>
                {Object.values(selectedItems).map(item => (
                    <View key={item.id} style={styles.summaryItem}>
                        <View style={styles.summaryItemInfo}>
                            <Text style={[styles.summaryItemText, {
                                color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                            }]}>{item.name}</Text>
                            <Text style={[styles.summaryItemPrice, {
                                color: dark ? COLORS.white : COLORS.grayscale600
                            }]}>${item.price} {t('booking.each')}</Text>
                        </View>
                        <View style={styles.summaryItemQuantityContainer}>
                            <Text style={[styles.summaryItemQuantity, {
                                color: dark ? COLORS.white : COLORS.greyscale900
                            }]}>x{item.quantity}</Text>
                            <Text style={[styles.summaryItemTotal, {
                                color: COLORS.primary
                            }]}>${(item.price * item.quantity).toFixed(2)}</Text>
                        </View>
                    </View>
                ))}
                
                {/* Price Breakdown */}
                <View style={[styles.priceBreakdown, {
                    borderTopWidth: 1,
                    borderTopColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                    paddingTop: 12,
                    marginTop: 12,
                }]}>
                    <View style={styles.priceRow}>
                        <Text style={[styles.priceLabel, {
                            color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                        }]}>{t('booking.base_service_hours', { hours: 2 })}</Text>
                        <Text style={[styles.priceValue, {
                            color: dark ? COLORS.white : COLORS.greyscale900
                        }]}>${(workerRate || 30) * 2}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={[styles.priceLabel, {
                            color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                        }]}>{t('booking.additional_items')}</Text>
                        <Text style={[styles.priceValue, {
                            color: dark ? COLORS.white : COLORS.greyscale900
                        }]}>${Object.values(selectedItems).reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</Text>
                    </View>
                    <View style={[styles.priceRow, { marginTop: 8 }]}>
                        <Text style={[styles.totalLabel, {
                            color: dark ? COLORS.white : COLORS.greyscale900
                        }]}>{t('booking.total')}</Text>
                        <Text style={[styles.totalValue, {
                            color: COLORS.primary
                        }]}>${calculatePrice().toFixed(2)}</Text>
                    </View>
                </View>
            </View>
        );
    };
    
    return (
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Header title={serviceName || t('service.unknown_service')} />
                
                {/* Single FlatList for better performance */}
                <FlatList
                    data={getAllItems()}
                    keyExtractor={item => item.id}
                    ListHeaderComponent={ListHeaderComponent}
                    ListFooterComponent={ListFooterComponent}
                    renderItem={({ item }) => {
                        const displayName = localizeAddonName(item.name);
                        return (
                            <BookingItem 
                                itemId={item.id}
                                name={displayName}
                                price={item.price}
                                description={item.description}
                                onQuantityChange={(quantity) => {
                                    handleItemChange(
                                        item.id, 
                                        displayName, 
                                        quantity, 
                                        item.price || 10,
                                        item.isAddon || false,
                                        item.addonId || null
                                    );
                                }}
                                initialQuantity={selectedItems[item.id]?.quantity || 0}
                            />
                        );
                    }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    // Performance optimizations
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    updateCellsBatchingPeriod={50}
                    windowSize={10}
                    initialNumToRender={10}
                />
            </View>
            
            {/* Fixed bottom button */}
            <View style={[styles.bottomContainer, { 
                backgroundColor: dark ? COLORS.dark1 : COLORS.white
            }]}>
                <Button
                    title={t('booking.continue_with_price', { price: calculatePrice().toFixed(2) })}
                    style={styles.bottomBtn}
                    filled
                    onPress={() => navigation.navigate('BookingDetails', {
                        serviceId,
                        serviceName,
                        workerId,
                        workerName,
                        workerRate,
                        basePrice: calculatePrice(),
                        addons: getAddons()
                    })}
                />
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
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20, // Add padding to prevent last item being hidden behind button
    },
    itemNum: {
        fontSize: 16,
        fontFamily: "regular",
        color: COLORS.black,
        marginBottom: 16
    },
    bottomContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        width: "100%",
        height: 84,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.white,
        // Add shadow for better visibility
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    bottomBtn: {
        width: SIZES.width - 32
    },
    summaryContainer: {
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    summaryTitle: {
        fontSize: 16,
        fontFamily: "semiBold",
        marginBottom: 12,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    summaryItemInfo: {
        flex: 1,
    },
    summaryItemText: {
        fontSize: 14,
        fontFamily: "regular",
        marginBottom: 2,
    },
    summaryItemPrice: {
        fontSize: 12,
        fontFamily: "regular",
    },
    summaryItemQuantityContainer: {
        alignItems: 'flex-end',
    },
    summaryItemQuantity: {
        fontSize: 14,
        fontFamily: "semiBold",
        marginBottom: 2,
    },
    summaryItemTotal: {
        fontSize: 14,
        fontFamily: "semiBold",
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        fontFamily: "regular",
    },
    priceBreakdown: {
        marginTop: 8,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    priceLabel: {
        fontSize: 14,
        fontFamily: "regular",
    },
    priceValue: {
        fontSize: 14,
        fontFamily: "semiBold",
    },
    totalLabel: {
        fontSize: 16,
        fontFamily: "bold",
    },
    totalValue: {
        fontSize: 18,
        fontFamily: "bold",
    },
})

export default BookingStep1