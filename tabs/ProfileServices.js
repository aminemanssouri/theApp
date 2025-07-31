import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { COLORS, icons } from '../constants';
import { Ionicons } from '@expo/vector-icons';
import ProviderLocationMap from '../components/ProviderLocationMap';
import { ScrollView } from 'react-native-virtualized-view';
import { useTheme } from '../theme/ThemeProvider';
import { getWorkerServices } from '../lib/services/workers';

const ProfileServices = ({ worker }) => {
    const { colors, dark } = useTheme();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (worker?.id) {
            console.log('Loading services for worker ID:', worker.id);
            loadWorkerServices(worker.id);
        } else {
            console.log('No worker ID available yet');
            setLoading(false); // Make sure loading state is updated even when no worker ID
        }
    }, [worker]);
    
    const loadWorkerServices = async (workerId) => {
        try {
            console.log('Loading services for worker:', workerId);
            const { data, error } = await getWorkerServices(workerId);
            if (error) {
                console.error('Error loading worker services:', error);
            } else {
                console.log('Worker services loaded:', data || 'No data');
                setServices(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Exception in loadWorkerServices:', err);
        } finally {
            setLoading(false);
        }
    };
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

    console.log('ProfileServices rendered with worker:', worker);
    
    return (
        <ScrollView 
            style={[styles.container, { backgroundColor: dark ? COLORS.dark : COLORS.white }]} 
            showsVerticalScrollIndicator={false}
        >
            <Text style={[styles.title, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>About {worker?.first_name || 'Me'}</Text>
            <Text style={[styles.description, { 
                marginBottom: 10,
                color: dark ? COLORS.grayscale200 : COLORS.grayscale700,
                }]} numberOfLines={showFullDescription ? undefined : initialNumberOfLines}>
                {worker?.bio || `${worker?.full_name || 'This professional'} has years of experience providing excellent service. They're dedicated to making sure every client receives top-quality care and attention to detail.`}
            </Text>
            <TouchableOpacity onPress={toggleDescription}>
                <Text style={{ color: COLORS.primary }}>{showFullDescription ? 'View Less' : 'View More'}</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { 
                color: dark ? COLORS.white : COLORS.greyscale900
            }]}>Service Types</Text>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text style={[styles.description, { 
                        color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                    }]}>Loading services...</Text>
                </View>
            ) : services && services.length > 0 ? (
                services.map((service, index) => (
                    <View key={service?.id || index} style={styles.typeContainer}>
                        <Image
                            source={icons.category}
                            resizeMode='contain'
                            style={styles.categoryIcon}
                        />
                        <Text style={[styles.description, { 
                            color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                        }]}>{"  "}{service && service.services ? service.services.name : 'Professional Service'}</Text>
                    </View>
                ))
            ) : (
                <View style={styles.typeContainer}>
                    <Image
                        source={icons.category}
                        resizeMode='contain'
                        style={styles.categoryIcon}
                    />
                    <Text style={[styles.description, { 
                        color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                    }]}>{"  "}{worker?.service_specialization || 'Professional Services'}</Text>
                </View>
            )}
            <Text style={[styles.title, { 
                 color: dark ? COLORS.white : COLORS.greyscale900
            }]}>Location</Text>
            <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={14} color={COLORS.primary} />
                <Text style={[styles.description, { 
                     color: dark ? COLORS.grayscale200 : COLORS.grayscale700
                }]}>{"  "}255 Grand Park Avenue, New York.</Text>
            </View>
            <ProviderLocationMap providerCoordinates={providerCoordinates} />
        </ScrollView>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    title: {
        fontSize: 18,
        fontFamily: "bold",
        marginVertical: 12
    },
    description: {
        fontSize: 14,
        fontFamily: "regular",
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
    },
    loadingContainer: {
        padding: 10,
        alignItems: 'center'
    }
})

export default ProfileServices