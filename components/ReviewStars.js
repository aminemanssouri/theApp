import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { FontAwesome } from "@expo/vector-icons";

const ReviewStars = ({ 
  review, 
  size = 20, 
  color = "#FFD700", 
  spacing = 4, 
  interactive = false,
  onRatingChange = () => {},
  maxStars = 5 
}) => {
  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= maxStars; i++) {
      const filled = i <= review;
      
      if (interactive) {
        stars.push(
          <TouchableOpacity
            key={i}
            onPress={() => onRatingChange(i)}
            style={{ marginRight: i < maxStars ? spacing : 0 }}
          >
            <FontAwesome 
              name={filled ? "star" : "star-o"} 
              size={size} 
              color={filled ? color : "#D3D3D3"} 
            />
          </TouchableOpacity>
        );
      } else {
        stars.push(
          <View
            style={{ marginRight: i < maxStars ? spacing : 0 }}
            key={i}
          >
            <FontAwesome 
              name={filled ? "star" : "star-o"} 
              size={size} 
              color={filled ? color : "#D3D3D3"} 
            />
          </View>
        );
      }
    }
    
    // Handle half stars for display mode
    if (!interactive && review % 1 !== 0) {
      const fullStars = Math.floor(review);
      if (fullStars < maxStars) {
        stars[fullStars] = (
          <View
            style={{ marginRight: fullStars < maxStars - 1 ? spacing : 0 }}
            key={fullStars + 1}
          >
            <FontAwesome 
              name="star-half-o" 
              size={size} 
              color={color} 
            />
          </View>
        );
      }
    }
    
    return stars;
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {renderStars()}
    </View>
  );
};

export default ReviewStars;