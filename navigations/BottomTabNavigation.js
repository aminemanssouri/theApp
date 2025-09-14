import { View, Platform, Image, Text, Dimensions } from 'react-native';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS, FONTS, icons } from '../constants';
import { Bookings, Favourite, Home, Inbox, Profile } from '../screens';
import { useTheme } from '../theme/ThemeProvider';
import { useNotifications } from '../context/NotificationContext';
import NotificationBadge from '../components/NotificationBadge';
// Removed safe area context dependency

const Tab = createBottomTabNavigator();

const BottomTabNavigation = () => {
    const { dark } = useTheme();
    const { unreadCount } = useNotifications();
    // Manual safe area calculation
    const getSafeAreaBottom = () => Platform.OS === 'ios' ? 34 : 0;
    const { width } = Dimensions.get('window');
    const isSmallScreen = width < 375;

    return (
        <Tab.Navigator 
            screenOptions={{
                tabBarShowLabel: false,
                headerShown: false,
                sceneContainerStyle: {
                    paddingTop: 0, 
                    marginTop: 0,  
                },
                tabBarStyle: {
                    position: 'absolute',
                    bottom: Platform.OS === 'android' ? 0 : 0, // Lift above Android navigation
                    left: isSmallScreen ? 5 : 10,
                    right: isSmallScreen ? 5 : 10,
                    height: Platform.OS === 'ios' ? 75 + getSafeAreaBottom() : 60,
                    backgroundColor: dark ? COLORS.dark1 : COLORS.white,
                    borderTopWidth: 0,
                    borderRadius: 20, // Rounded corners for modern look
                    elevation: 8, // Shadow for Android
                    shadowColor: '#000', // Shadow for iOS
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    paddingBottom: Platform.OS === 'ios' ? getSafeAreaBottom() : 8,
                    paddingTop: 8,
                    paddingHorizontal: 10,
                },
                tabBarItemStyle: {
                    height: 45,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={Home}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={{
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: focused ? `${COLORS.primary}15` : 'transparent',
                            borderRadius: 12,
                            paddingHorizontal: isSmallScreen ? 8 : 12,
                            paddingVertical: 6,
                        }}>
                            <Image
                                source={focused ? icons.home : icons.home2Outline}
                                resizeMode='contain'
                                style={{
                                    height: 20,
                                    width: 20,
                                    tintColor: focused ? COLORS.primary : dark ? COLORS.gray3 : COLORS.gray3,
                                }}
                            />
                            <Text style={{
                                ...FONTS.body5,
                                color: focused ? COLORS.primary : dark ? COLORS.gray3 : COLORS.gray3,
                                fontWeight: focused ? '600' : '400',
                                marginTop: 2,
                                fontSize: isSmallScreen ? 8 : 9,
                                textAlign: 'center',
                                numberOfLines: 1,
                            }} numberOfLines={1}>
                                Home
                            </Text>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Bookings"
                component={Bookings}
                options={{
                    sceneContainerStyle: {
                        paddingTop: 0,
                        marginTop: 0,
                        backgroundColor: 'transparent',
                    },
                    tabBarIcon: ({ focused }) => (
                        <View style={{
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: focused ? `${COLORS.primary}15` : 'transparent',
                            borderRadius: 12,
                            paddingHorizontal: isSmallScreen ? 6 : 8,
                            paddingVertical: 6,
                        }}>
                            <Image
                                source={focused ? icons.document2 : icons.document2Outline}
                                resizeMode='contain'
                                style={{
                                    height: 20,
                                    width: 20,
                                    tintColor: focused ? COLORS.primary : dark ? COLORS.gray3 : COLORS.gray3,
                                }}
                            />
                            <Text style={{
                                ...FONTS.body5,
                                color: focused ? COLORS.primary : dark ? COLORS.gray3 : COLORS.gray3,
                                fontWeight: focused ? '600' : '400',
                                marginTop: 2,
                                fontSize: isSmallScreen ? 8 : 9,
                                textAlign: 'center',
                            }} numberOfLines={1}>
                                Bookings
                            </Text>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Favourite"
                component={Favourite}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={{
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: focused ? `${COLORS.primary}15` : 'transparent',
                            borderRadius: 12,
                            paddingHorizontal: 8,
                            paddingVertical: 6,
                        }}>
                            <Image
                                source={focused ? icons.heart2 : icons.heart2Outline}
                                resizeMode='contain'
                                style={{
                                    height: 20,
                                    width: 20,
                                    tintColor: focused ? COLORS.primary : dark ? COLORS.gray3 : COLORS.gray3,
                                }}
                            />
                            <Text style={{
                                ...FONTS.body5,
                                color: focused ? COLORS.primary : dark ? COLORS.gray3 : COLORS.gray3,
                                fontWeight: focused ? '600' : '400',
                                marginTop: 2,
                                fontSize: 9,
                                textAlign: 'center',
                            }} numberOfLines={1}>
                                Favourite
                            </Text>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Inbox"
                component={Inbox}
                options={{
                    sceneContainerStyle: {
                        backgroundColor: 'transparent',
                        paddingTop: 0,
                        marginTop: 0,
                    },
                    tabBarIcon: ({ focused }) => (
                        <View style={{ position: 'relative' }}>
                            <View style={{
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: focused ? `${COLORS.primary}15` : 'transparent',
                                borderRadius: 12,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                            }}>
                                <Image
                                    source={focused ? icons.chatBubble2 : icons.chatBubble2Outline}
                                    resizeMode='contain'
                                    style={{
                                        height: 20,
                                        width: 20,
                                        tintColor: focused ? COLORS.primary : dark ? COLORS.gray3 : COLORS.gray3,
                                    }}
                                />
                                <Text style={{
                                    ...FONTS.body5,
                                    color: focused ? COLORS.primary : dark ? COLORS.gray3 : COLORS.gray3,
                                    fontWeight: focused ? '600' : '400',
                                    marginTop: 2,
                                    fontSize: 9,
                                    textAlign: 'center',
                                }} numberOfLines={1}>
                                    Inbox
                                </Text>
                            </View>
                            <NotificationBadge count={unreadCount} />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={Profile}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={{
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: focused ? `${COLORS.primary}15` : 'transparent',
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                        }}>
                            <Image
                                source={focused ? icons.user : icons.userOutline}
                                resizeMode='contain'
                                style={{
                                    height: 20,
                                    width: 20,
                                    tintColor: focused ? COLORS.primary : dark ? COLORS.gray3 : COLORS.gray3,
                                }}
                            />
                            <Text style={{
                                ...FONTS.body5,
                                color: focused ? COLORS.primary : dark ? COLORS.gray3 : COLORS.gray3,
                                fontWeight: focused ? '600' : '400',
                                marginTop: 2,
                                fontSize: 9,
                                textAlign: 'center',
                            }} numberOfLines={1}>
                                Profile
                            </Text>
                        </View>
                    ),
                }}
            />
        </Tab.Navigator>
    )
}

export default BottomTabNavigation