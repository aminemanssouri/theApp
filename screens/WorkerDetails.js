import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons, images } from '../constants';
import ReviewStars from '../components/ReviewStars';
import { TabView, TabBar } from 'react-native-tab-view';
import { ProfileReviews, ProfileServices } from '../tabs';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { getWorkerDetails } from '../lib/services/workers';
import { createConversation, getUserConversations } from '../lib/services/chat';
import { findOrCreateConversation } from '../lib/services/chat-helper';
import { t } from '../context/LanguageContext';

// We'll create a custom scene renderer instead of using SceneMap
// This allows us to pass props to our tab components
const createScene = (worker) => {
  return ({ route }) => {
    console.log('Rendering tab:', route.key, 'Worker data:', worker);
    
    switch (route.key) {
      case 'first':
        return <ProfileServices worker={worker} />;
      case 'second':
        return <ProfileReviews worker={worker} />;
      default:
        return null;
    }
  };
};

const WorkerDetails = ({ route, navigation }) => {
  const { workerId, serviceId } = route.params || {};
  const layout = useWindowDimensions();
  const { dark, colors } = useTheme();
  const { user } = useAuth();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: t('worker.services_tab') },
    { key: 'second', title: t('worker.reviews_tab') }
  ]);
  
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWorkerDetails();
  }, [workerId]);

  const loadWorkerDetails = async () => {
    try {
      if (!workerId) {
        console.error('Worker ID is missing');
        return;
      }
      
      const { data, error } = await getWorkerDetails(workerId, serviceId);
      
      if (error) {
        console.error('Error fetching worker details:', error);
        return;
      }
      
      console.log('Worker details loaded:', data);
      setWorker(data);
      setLoading(false);
    } catch (err) {
      console.error('Error in loadWorkerDetails:', err);
      setLoading(false);
    }
  };
  
  // Import at the top of the file: import { createConversation } from '../lib/services/chat';
  const handleMessageWorker = async (worker) => {
    if (!worker?.id || !user?.id) {
      console.error('Missing worker or user ID');
      return;
    }
    
    try {
      setLoading(true);
      // Check if a conversation already exists between these users
      // You would need to add this function to your chat service
      const conversationId = await findOrCreateConversation([user.id, worker.id]);
      
      // Navigate to chat with the conversation ID and worker info
      navigation.navigate("Chat", { 
        conversationId,
        workerInfo: {
          id: worker.id,
          name: worker.full_name || 'Professional',
          avatar_url: worker.avatar_url
        }
      });
    } catch (err) {
      console.error('Error starting conversation:', err);
      Alert.alert(t('common.error'), t('chat.could_not_start_try_again'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render header
   */
  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}>
          <Image
            source={icons.arrowLeft}
            resizeMode='contain'
            style={[styles.arrowBackIcon, { 
              tintColor: dark ? COLORS.white : COLORS.greyscale900
            }]}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={icons.bell}
            resizeMode='contain'
            style={[styles.bellIcon, { 
              tintColor: dark ? COLORS.white : COLORS.greyscale900
            }]}
          />
        </TouchableOpacity>
      </View>
    )
  }

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={{
        backgroundColor: COLORS.primary,
      }}
      style={{
        backgroundColor: colors.background,
        shadowColor: 'transparent',
        elevation: 0,
      }}
      labelStyle={{
        fontSize: 16,
        fontFamily: "semiBold",
        textTransform: 'none',
      }}
      activeColor={COLORS.primary}
      inactiveColor={dark ? COLORS.white : COLORS.greyscale900}
      renderLabel={({ route, focused }) => (
        <View style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
          <Text style={{
            color: focused ? COLORS.primary : (dark ? COLORS.white : COLORS.greyscale900),
            fontSize: 16,
            fontFamily: "semiBold",
            textTransform: 'none',
            textAlign: 'center',
          }}>
            {route.title}
          </Text>
        </View>
      )}
    />
  )

  /**
   * Render content
   */
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('worker.loading_details')}</Text>
        </View>
      );
    }

    return (
      <View>
        <View style={styles.profileImageContainer}>
          <Image
            source={worker?.avatar_url ? { uri: worker.avatar_url } : images.user5}
            resizeMode='contain'
            style={styles.profileImage}
          />
          <Text style={[styles.fullName, { 
            color: dark ? COLORS.white : COLORS.greyscale900
          }]}>{worker?.full_name || t('worker.professional')}</Text>
          <Text style={[styles.yearExperience, {
            color: dark ? COLORS.secondaryWhite : COLORS.greyscale900
          }]}>{t('worker.years_experience', { years: worker?.years_experience || '5' })}</Text>
          <View style={styles.reviewContainer}>
            <ReviewStars review={worker?.average_rating || worker?.rating || 0} size={14} color="orange" />
            <Text style={[styles.ratingNum, { 
              color: dark ? COLORS.grayscale200 : "gray"
            }]}>({worker?.average_rating || worker?.rating || '0.0'})</Text>
          </View>
          <Text style={styles.price}>${worker?.custom_price || worker?.hourly_rate || '30.00'}/h</Text>

          <View style={styles.viewContainer}>
            <View style={styles.view}>
              <Text style={[styles.viewNum, { 
                color: dark ? COLORS.white : COLORS.greyscale900
              }]}>{worker?.total_reviews || 0}+</Text>
              <Text style={[styles.viewText, { 
                color: dark ? COLORS.secondaryWhite : COLORS.greyscale900
              }]}>{t('worker.reviews_label')}</Text>
            </View>
            <View style={styles.view}>
              <Text style={[styles.viewNum, { 
                color: dark ? COLORS.white : COLORS.greyscale900
              }]}>{worker?.ongoing_jobs || '50'}+</Text>
              <Text style={[styles.viewText, { 
                color: dark ? COLORS.secondaryWhite : COLORS.greyscale900
              }]}>{t('worker.ongoing_label')}</Text>
            </View>
            <View style={styles.viewLeft}>
              <Text style={[styles.viewNum, { 
                color: dark ? COLORS.white : COLORS.greyscale900
              }]}>{worker?.total_clients || '200'}+</Text>
              <Text style={[styles.viewText, { 
                color: dark ? COLORS.secondaryWhite : COLORS.greyscale900
              }]}>{t('worker.client_label')}</Text>
            </View>
          </View>

          <View style={styles.buttonActionContainer}>
            <TouchableOpacity
              onPress={() => handleMessageWorker(worker)}
              style={styles.buttonAction}>
              <Image
                source={icons.chat}
                resizeMode='contain'
                style={styles.buttonActionIcon}
              />
              <Text style={styles.buttonActionText}>{t('chat.message')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("BookingStep1", {
                serviceId,
                serviceName: worker?.service_name || 'Service', // Add service name
                workerId: worker?.id,
                workerName: worker?.full_name || 'Professional',
                workerRate: worker?.hourly_rate || 30 // Pass hourly rate
              })}
              style={styles.buttonActionRight}>
              <Image
                source={icons.calendar2}
                resizeMode='contain'
                style={styles.buttonActionIconRight}
              />
              <Text style={styles.buttonActionTextRight}>{t('booking.book_now')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.separateLine} />
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <View style={{ flex: 1 }}>
          {renderContent()}
          <View style={{ flex: 1 }}>
            <TabView
              navigationState={{ index, routes }}
              renderScene={createScene(worker)}
              onIndexChange={setIndex}
              initialLayout={{ width: layout.width }}
              renderTabBar={renderTabBar}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  arrowBackIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.black
  },
  bellIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.black
  },
  profileImageContainer: {
    alignItems: "center",
  },
  profileImage: {
    height: 120,
    width: 120,
    borderRadius: 9999,
    borderColor: COLORS.gray,
    borderWidth: 2
  },
  fullName: {
    fontSize: 20,
    fontFamily: "bold",
    color: COLORS.black,
    marginVertical: 8
  },
  yearExperience: {
    fontSize: 14,
    color: COLORS.greyscale900
  },
  reviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6
  },
  ratingNum: {
    color: "gray",
    fontSize: 14
  },
  price: {
    fontSize: 20,
    fontFamily: "bold",
    color: COLORS.primary,
    marginVertical: 8
  },
  summaryContainer: {
    width: SIZES.width - 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 22
  },
  viewContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12
  },
  view: {
    width: (SIZES.width - 32) / 3,
    alignItems: "center",
    borderRightColor: COLORS.black,
    borderRightWidth: .3
  },
  viewNum: {
    fontSize: 20,
    fontFamily: "bold",
    color: COLORS.black
  },
  viewText: {
    fontSize: 14,
    fontFamily: "regular",
    color: COLORS.black,
    marginVertical: 4
  },
  viewLeft: {
    width: (SIZES.width - 32) / 3,
    alignItems: "center"
  },
  buttonActionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
    width: SIZES.width - 32
  },
  buttonAction: {
    width: (SIZES.width - 32) / 2 - 8,
    backgroundColor: COLORS.primary,
    borderRadius: 32,
    borderWidth: 1.4,
    borderColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42
  },
  buttonActionIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.white,
    marginRight: 8
  },
  buttonActionText: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.white
  },
  buttonActionRight: {
    width: (SIZES.width - 32) / 2 - 8,
    borderRadius: 32,
    borderWidth: 1.4,
    borderColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42
  },
  buttonActionIconRight: {
    width: 16,
    height: 16,
    tintColor: COLORS.primary,
    marginRight: 8
  },
  buttonActionTextRight: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.primary
  },
  separateLine: {
    width: SIZES.width - 32,
    height: .1,
    backgroundColor: COLORS.gray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.gray,
  },
});

export default WorkerDetails;
