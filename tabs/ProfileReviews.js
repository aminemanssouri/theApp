import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { COLORS, icons, images } from '../constants';
import { ScrollView } from 'react-native-virtualized-view';
import ReviewCard from '../components/ReviewCard';
import { Fontisto } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import reviewsService from '../lib/services/reviews';

const ProfileReviews = ({ worker }) => {
  const navigation = useNavigation();
  const [selectedRating, setSelectedRating] = useState("All");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    average: 0,
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const { colors, dark } = useTheme();

  // Load reviews when component mounts or worker changes
  useEffect(() => {
    if (worker?.id) {
      fetchReviews();
    } else {
      setLoading(false); // Stop loading if no worker
    }
  }, [worker?.id]);

  // Fetch reviews from database
  const fetchReviews = async () => {
    if (!worker?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await reviewsService.getWorkerReviews(worker.id, {
        page: 1,
        limit: 50
      });

      if (result.success) {
        setReviews(result.data.reviews);
        setStatistics(result.data.statistics);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRatingButton = (rating) => (
    <TouchableOpacity
      key={rating.toString()}
      style={[styles.ratingButton, selectedRating === rating && styles.selectedRatingButton]}
      onPress={() => setSelectedRating(rating)}
    >
      <Fontisto name="star" size={12} color={selectedRating === rating ? COLORS.white : COLORS.primary} />
      <Text style={[styles.ratingButtonText, selectedRating === rating && styles.selectedRatingButtonText]}>{rating}</Text>
    </TouchableOpacity>
  );

  // Filter reviews based on selected rating
  const filteredReviews = selectedRating === "All" 
    ? reviews 
    : reviews.filter(review => review.rating === parseInt(selectedRating));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, {
          color: dark ? COLORS.white : COLORS.greyscale900
        }]}>Loading reviews...</Text>
      </View>
    );
  }

  if (!worker?.id) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, {
          color: dark ? COLORS.gray : COLORS.grayscale700
        }]}>No worker selected</Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.reviewHeaderContainer}>
        <View style={styles.reviewHeaderLeft}>
          <Image
            source={icons.star}
            resizeMode='contain'
            style={styles.starIcon}
          />
          <Text style={[styles.starTitle, { 
            color: dark? COLORS.white : COLORS.greyscale900
          }]}>
            {"  "}{statistics.average || 0} ({statistics.total || 0} reviews)
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("ServiceDetailsReviews", { 
            workerId: worker?.id 
          })}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      
      {/* Rating Filter Buttons */}
      <FlatList
        horizontal
        data={["All", "5", "4", "3", "2", "1"]}
        keyExtractor={(item) => item}
        renderItem={({ item }) => renderRatingButton(item)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ratingButtonContainer}
      />
      
      {/* Reviews List */}
      {filteredReviews.length > 0 ? (
        <FlatList
          data={filteredReviews}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const reviewer = item.users || {};
            const avatar = reviewer.profile_picture 
              ? { uri: reviewer.profile_picture }
              : images.user1;
            
            return (
              <ReviewCard
                avatar={avatar}
                name={`${reviewer.first_name || ''} ${reviewer.last_name || ''}`.trim() || 'Anonymous'}
                description={item.comment || 'No comment provided'}
                avgRating={item.rating}
                date={item.created_at}
                numLikes={0}
              />
            );
          }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, {
            color: dark ? COLORS.gray : COLORS.grayscale700
          }]}>
            {selectedRating === "All" 
              ? "No reviews yet" 
              : `No ${selectedRating}-star reviews`}
          </Text>
        </View>
      )}
    </ScrollView>
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  reviewHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12
  },
  reviewHeaderLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  starIcon: {
    width: 18,
    height: 18,
    tintColor: "orange"
  },
  starTitle: {
    fontSize: 16,
    fontFamily: "bold",
    color: COLORS.black2
  },
  seeAll: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: COLORS.primary
  },
  // Styles for rating buttons
  ratingButtonContainer: {
    paddingVertical: 10,
  },
  ratingButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.4,
    borderColor: COLORS.primary,
    marginRight: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  selectedRatingButton: {
    backgroundColor: COLORS.primary,
  },
  ratingButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    marginLeft: 10,
  },
  selectedRatingButtonText: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'regular'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'regular'
  }
})

export default ProfileReviews