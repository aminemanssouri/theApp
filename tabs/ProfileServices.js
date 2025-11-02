import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import { COLORS, icons } from '../constants';
import { Ionicons } from '@expo/vector-icons';
import ProviderLocationMap from '../components/ProviderLocationMap';
import { ScrollView } from 'react-native-virtualized-view';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../context/LanguageContext';

const ProfileServices = () => {
    const { colors, dark } = useTheme();
    // Example provider coordinates
    const providerCoordinates = {
        latitude: 37.7749,
        longitude: -122.4194,
    };

    const initialNumberOfLines = 3;
    const [showFullDescription, setShowFullDescription] = useState(false);

    const toggleDescription = () => {
        setShowFullDescription(!showFullDescription);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>{t('profile_services.description_title')}</Text>
            <Text style={[styles.description, { 
                marginBottom: 10,
                color: dark ? COLORS.grayscale200 : COLORS.grayscale700,
                }]} numberOfLines={showFullDescription ? undefined : initialNumberOfLines}>
                {t('profile_services.description_body')}
            </Text>
            <TouchableOpacity onPress={toggleDescription}>
                <Text style={{ color: COLORS.primary }}>{showFullDescription ? t('profile_services.view_less') : t('profile_services.view_more')}</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { 
                color: dark ? COLORS.white : COLORS.greyscale900
            }]}>{t('profile_services.service_type')}</Text>
            <View style={styles.typeContainer}>
                <Image
                    source={icons.category}
                    resizeMode='contain'
                    style={styles.categoryIcon}
                />
                <Text style={[styles.description, { 
                    color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                }]}> {t('service.category.cleaning')}</Text>
            </View>
            <Text style={[styles.title, { 
                 color: dark ? COLORS.white : COLORS.greyscale900
            }]}>{t('profile_services.location')}</Text>
            <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={14} color={COLORS.primary} />
                <Text style={[styles.description, { 
                     color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                }]}>{"  "}{t('profile_services.location_example')}</Text>
            </View>
         </ScrollView>
    )
};

const styles = StyleSheet.create({
    container: {

    },
    title: {
        fontSize: 18,
        fontFamily: "bold",
        color: COLORS.black,
        marginVertical: 12
    },
    description: {
        fontSize: 14,
        fontFamily: "regular",
        color: COLORS.grayscale700,
    },
    locationContainer: {
        flexDirection: "row",
        alignItems: "center"
    },
    typeContainer: {
        flexDirection: "row",
        alignItems: "center"
    },
    categoryIcon: {
        width: 14,
        height: 14,
        marginRight: 2,
        tintColor: COLORS.primary
    }
})

export default ProfileServices