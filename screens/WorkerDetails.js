import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons, images } from '../constants';
import ReviewStars from '../components/ReviewStars';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { ProfileReviews, ProfileServices } from '../tabs';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { getWorkerDetails, getWorkerServices } from '../lib/services/workers';
import { createConversation, getUserConversations } from '../lib/services/chat';
import { findOrCreateConversation } from '../lib/services/chat-helper';

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
    { key: 'first', title: 'Services' },
    { key: 'second', title: 'Reviews' }
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
      Alert.alert('Error', 'Could not start conversation. Please try again.');
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
        backgroundColor: dark ? COLORS.dark : colors.background
      }}
      renderLabel={({ route, focused }) => (
        <Text style={[{
          color: focused ? COLORS.primary : "gray",
          fontSize: 16,
          fontFamily: "semiBold"
        }]}>
          {route.title}
        </Text>
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
          <Text style={styles.loadingText}>Loading worker details...</Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        <View style={styles.profileImageContainer}>
          <Image
            source={worker?.avatar_url ? { uri: worker.avatar_url } : images.user5}
            resizeMode='contain'
            style={styles.profileImage}
          />
          <Text style={[styles.fullName, { 
            color: dark ? COLORS.white : COLORS.greyscale900
          }]}>{worker?.full_name || 'Professional'}</Text>
          <Text style={[styles.yearExperience, {
            color: dark ? COLORS.secondaryWhite : COLORS.greyscale900
          }]}>{worker?.years_experience || '5'} years experience</Text>
          <View style={styles.reviewContainer}>
            <ReviewStars review={5} size={14} color="orange" />
            <Text style={[styles.ratingNum, { 
              color: dark ? COLORS.grayscale200 : "gray"
            }]}>({worker?.rating || '4.7'})</Text>
          </View>
          <Text style={styles.price}>${worker?.custom_price || worker?.hourly_rate || '30.00'}/h</Text>

          <View style={styles.viewContainer}>
            <View style={styles.view}>
              <Text style={[styles.viewNum, { 
                color: dark ? COLORS.white : COLORS.greyscale900
              }]}>{worker?.total_reviews || '100'}+</Text>
              <Text style={[styles.viewText, { 
                color: dark ? COLORS.secondaryWhite : COLORS.greyscale900
              }]}>Reviews</Text>
            </View>
            <View style={styles.view}>
              <Text style={[styles.viewNum, { 
                color: dark ? COLORS.white : COLORS.greyscale900
              }]}>{worker?.ongoing_jobs || '50'}+</Text>
              <Text style={[styles.viewText, { 
                color: dark ? COLORS.secondaryWhite : COLORS.greyscale900
              }]}>Ongoing</Text>
            </View>
            <View style={styles.viewLeft}>
              <Text style={[styles.viewNum, { 
                color: dark ? COLORS.white : COLORS.greyscale900
              }]}>{worker?.total_clients || '200'}+</Text>
              <Text style={[styles.viewText, { 
                color: dark ? COLORS.secondaryWhite : COLORS.greyscale900
              }]}>Client</Text>
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
              <Text style={styles.buttonActionText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("BookingStep1", {
                serviceId,
                workerId: worker?.id,
                workerName: worker?.full_name || 'Professional'
              })}
              style={styles.buttonActionRight}>
              <Image
                source={icons.calendar2}
                resizeMode='contain'
                style={styles.buttonActionIconRight}
              />
              <Text style={styles.buttonActionTextRight}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TabView
          navigationState={{ index, routes }}
          renderScene={createScene(worker)}
          renderTabBar={renderTabBar}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          style={styles.tabViewStyle}
          lazy={true}
          lazyPreloadDistance={0}
          renderLazyPlaceholder={() => <View style={{ padding: 20 }}><Text>Loading...</Text></View>}
        />
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      <ScrollView 
        style={styles.scrollViewStyle}
        contentContainerStyle={styles.scrollViewContentStyle}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1, 
    minHeight: 500, // Give the content container enough height for the TabView
  },
  scrollViewStyle: {
    flex: 1,
  },
  scrollViewContentStyle: {
    flexGrow: 1,
    paddingBottom: 80, // Add more padding at the bottom
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 24,
  },
  arrowBackIcon: {
    width: 24,
    height: 24,
  },
  bellIcon: {
    width: 24,
    height: 24,
  },
  profileImageContainer: {
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  fullName: {
    fontSize: 20,
    fontFamily: "bold",
    marginTop: 12,
  },
  yearExperience: {
    fontSize: 16,
    fontFamily: "medium",
    marginTop: 8,
  },
  reviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  ratingNum: {
    marginLeft: 4,
    fontFamily: "regular",
    fontSize: 14,
  },
  price: {
    fontSize: 20,
    fontFamily: "bold",
    color: COLORS.primary,
    marginTop: 16,
  },
  viewContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  view: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderColor: COLORS.grayscale400
  },
  viewLeft: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  viewNum: {
    fontSize: 16,
    fontFamily: "bold",
  },
  viewText: {
    fontSize: 14,
    fontFamily: "regular",
    marginTop: 4,
  },
  buttonActionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
  },
  buttonAction: {
    height: 56,
    width: 157,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginRight: 8,
  },
  buttonActionIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.primary,
  },
  buttonActionText: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: COLORS.primary,
    marginLeft: 8,
  },
  buttonActionRight: {
    height: 56,
    width: 157,
    backgroundColor: COLORS.primary,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginLeft: 8,
  },
  buttonActionIconRight: {
    width: 24,
    height: 24,
    tintColor: COLORS.white,
  },
  buttonActionTextRight: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: COLORS.white,
    marginLeft: 8,
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
  tabViewStyle: {
    marginTop: 20,
    height: 500, // Increase height to show more content
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  }
});

export default WorkerDetails;
