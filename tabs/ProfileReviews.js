import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import React, { useState } from 'react';
import { COLORS, icons } from '../constants';
import { ScrollView } from 'react-native-virtualized-view';
import { reviews } from '../data';
import ReviewCard from '../components/ReviewCard';
import { Fontisto } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../context/LanguageContext';

const ProfileReviews = () => {
  const navigation = useNavigation();
  const FILTER_ALL = t('reviews.filter_all');
  const [selectedRating, setSelectedRating] = useState(FILTER_ALL);
  const { colors, dark } = useTheme();

  const renderRatingButton = (rating) => (
    <TouchableOpacity
      key={rating}
      style={[styles.ratingButton, selectedRating === rating && styles.selectedRatingButton]}
      onPress={() => setSelectedRating(rating)}
    >
      <Fontisto name="star" size={12} color={selectedRating === rating ? COLORS.white : COLORS.primary} />
      <Text style={[styles.ratingButtonText, selectedRating === rating && styles.selectedRatingButtonText]}>{rating}</Text>
    </TouchableOpacity>
  );

  const filteredReviews = selectedRating === FILTER_ALL ? reviews : reviews.filter(review => review.avgRating === selectedRating);

  const totalReviews = reviews?.length || 0;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + (Number(r.avgRating) || 0), 0) / totalReviews)
    : 0;

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
          }]}> {t('reviews.summary', { rating: avgRating.toFixed(1), count: totalReviews })}</Text>

        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("ServiceDetailsReviews")}>
          <Text style={styles.seeAll}>{t('common.see_all')}</Text>

        </TouchableOpacity>
      </View>
      {/* Horizontal FlatList for rating buttons */}
      <FlatList
        horizontal
        data={[FILTER_ALL, 5, 4, "3", "2", "1"]}

        keyExtractor={(item) => item}
        renderItem={({ item }) => renderRatingButton(item)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ratingButtonContainer}
      />
      <FlatList
        data={filteredReviews}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <ReviewCard
            avatar={item.avatar}
            name={item.name}
            description={item.description}
            avgRating={item.avgRating}
            date={item.date}
            numLikes={item.numLikes}
          />
        )}
      />
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
})

export default ProfileReviews