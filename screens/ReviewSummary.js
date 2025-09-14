import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, TouchableWithoutFeedback, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons, illustrations } from '../constants';
import Header from '../components/Header';
import { ScrollView } from 'react-native-virtualized-view';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import reviewsService from '../lib/services/reviews';
import ReviewStars from '../components/ReviewStars';

const ReviewSummary = ({ navigation, route }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const { colors, dark } = useTheme();

  // Get booking data from route params
  useEffect(() => {
    if (route.params?.booking) {
      setBookingData(route.params.booking);
    }
  }, [route.params]);

  // Handle payment and show rating modal
  const handlePaymentSuccess = () => {
    setModalVisible(false);
    // After successful payment, show rating modal
    setTimeout(() => {
      setRatingModalVisible(true);
    }, 500);
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!bookingData) return;
    
    setLoading(true);
    try {
      const result = await reviewsService.createReview({
        booking_id: bookingData.id,
        worker_id: bookingData.worker_id,
        rating: selectedRating,
        comment: reviewComment
      });

      if (result.success) {
        Alert.alert('Success', 'Thank you for your review!');
        setRatingModalVisible(false);
        navigation.navigate("Home");
      } else {
        Alert.alert('Error', result.error || 'Failed to submit review');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  // Render rating modal
  const renderRatingModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={ratingModalVisible}>
        <TouchableWithoutFeedback
          onPress={() => setRatingModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={[styles.ratingModalSubContainer, {
              backgroundColor: dark ? COLORS.dark2 : COLORS.white,
            }]}>
              <Text style={[styles.ratingTitle, {
                color: dark ? COLORS.white : COLORS.greyscale900
              }]}>Rate Your Experience</Text>
              
              <Text style={[styles.ratingSubtitle, {
                color: dark ? COLORS.gray : COLORS.grayscale700
              }]}>
                How was your experience with {bookingData?.worker_name || 'the service provider'}?
              </Text>

              {/* Interactive Star Rating */}
              <View style={styles.ratingStarsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setSelectedRating(star)}
                    style={styles.starButton}
                  >
                    <Image
                      source={icons.star}
                      style={[
                        styles.starIcon,
                        {
                          tintColor: star <= selectedRating ? COLORS.primary : COLORS.grayscale300
                        }
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.ratingText, {
                color: COLORS.primary
              }]}
              >
                {selectedRating === 5 ? 'Excellent!' : 
                 selectedRating === 4 ? 'Good!' : 
                 selectedRating === 3 ? 'Average' : 
                 selectedRating === 2 ? 'Poor' : 'Very Poor'}
              </Text>

              {/* Comment Input */}
              <View style={[styles.commentInput, {
                backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                borderColor: dark ? COLORS.dark3 : COLORS.grayscale200
              }]}>
                <TouchableOpacity
                  onPress={() => {
                    // Navigate to a full review screen if needed
                    navigation.navigate('WriteReview', {
                      booking: bookingData,
                      rating: selectedRating,
                      onSubmit: (rating, comment) => {
                        setSelectedRating(rating);
                        setReviewComment(comment);
                        handleSubmitReview();
                      }
                    });
                    setRatingModalVisible(false);
                  }}
                >
                  <Text style={[styles.commentPlaceholder, {
                    color: dark ? COLORS.gray : COLORS.grayscale500
                  }]}>
                    Add a comment (optional)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.ratingButtonsContainer}>
                <Button
                  title={loading ? "Submitting..." : "Submit Review"}
                  filled
                  onPress={handleSubmitReview}
                  disabled={loading}
                  style={styles.submitReviewBtn}
                />
                <Button
                  title="Skip"
                  onPress={() => {
                    setRatingModalVisible(false);
                    navigation.navigate("Home");
                  }}
                  textColor={dark ? COLORS.white : COLORS.primary}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    borderRadius: 32,
                    backgroundColor: 'transparent',
                    borderColor: dark ? COLORS.dark3 : COLORS.primary,
                    borderWidth: 1
                  }}
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // Render success modal
  const renderModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}>
        <TouchableWithoutFeedback
          onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalSubContainer, {
              backgroundColor: dark ? COLORS.dark2 : COLORS.white,
            }]}>
              <View style={styles.backgroundIllustration}>
                <Image
                  source={illustrations.background}
                  resizeMode='contain'
                  style={styles.modalIllustration}
                />
                <Image
                  source={icons.check}
                  resizeMode='contain'
                  style={styles.editPencilIcon}
                />
              </View>
              <Text style={styles.modalTitle}>Congratulations!</Text>
              <Text style={[styles.modalSubtitle, {
                color: dark ? COLORS.white : COLORS.black,
              }]}>
                You have successfully made a payment and booked a service.
              </Text>
              <Button
                title="Continue"
                filled
                onPress={handlePaymentSuccess}
                style={styles.successBtn}
              />
              <Button
                title="View E-Receipt"
                onPress={() => {
                  setModalVisible(false)
                  navigation.navigate("EReceipt", { booking: bookingData })
                }}
                textColor={dark ? COLORS.white : COLORS.primary}
                style={{
                  width: "100%",
                  marginTop: 12,
                  borderRadius: 32,
                  backgroundColor: dark ? COLORS.dark3 : COLORS.tansparentPrimary,
                  borderColor: dark ? COLORS.dark3 : COLORS.tansparentPrimary
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }

  // Format booking data for display
  const formatBookingData = () => {
    if (!bookingData) {
      return {
        service: 'House Cleaning',
        category: 'Cleaning',
        worker: 'Jenny Wilson',
        dateTime: 'Dec 23, 2025 | 10:00 AM',
        hours: '2 hours',
        amount: '$60',
        tax: '$5.55',
        total: '$65.55'
      };
    }

    return {
      service: bookingData.service_name || 'Service',
      category: bookingData.category_name || 'Category',
      worker: bookingData.worker_name || 'Worker',
      dateTime: bookingData.formatted_date || 'Date & Time',
      hours: `${bookingData.duration || 2} hours`,
      amount: `$${bookingData.price || 60}`,
      tax: `$${bookingData.tax || 5.55}`,
      total: `$${bookingData.total_amount || 65.55}`
    };
  };

  const displayData = formatBookingData();

  return (
    <SafeAreaView style={[styles.area, {
      backgroundColor: dark ? COLORS.dark1 : COLORS.white
    }]}>
      <View style={[styles.container, {
        backgroundColor: dark ? COLORS.dark1 : COLORS.white
      }]}>
        <Header title="Review Summary" />
        <ScrollView showsVerticalScrollIndicator={false}>

          <View style={[styles.summaryContainer, {
            backgroundColor: dark ? COLORS.dark2 : COLORS.white,
          }]}>
            <View style={styles.view}>
              <Text style={styles.viewLeft}>Services</Text>
              <Text style={[styles.viewRight, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>{displayData.service}</Text>
            </View>
            <View style={styles.view}>
              <Text style={styles.viewLeft}>Category</Text>
              <Text style={[styles.viewRight, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>{displayData.category}</Text>
            </View>

            <View style={styles.view}>
              <Text style={styles.viewLeft}>Workers</Text>
              <Text style={[styles.viewRight, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>{displayData.worker}</Text>
            </View>
            <View style={styles.view}>
              <Text style={styles.viewLeft}>Date & Time</Text>
              <Text style={[styles.viewRight, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>{displayData.dateTime}</Text>
            </View>
            <View style={styles.view}>
              <Text style={styles.viewLeft}>Working Hours</Text>
              <Text style={[styles.viewRight, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>{displayData.hours}</Text>
            </View>
          </View>

          <View style={[styles.summaryContainer, {
            backgroundColor: dark ? COLORS.dark2 : COLORS.white,
          }]}>
            <View style={styles.view}>
              <Text style={styles.viewLeft}>Amount</Text>
              <Text style={[styles.viewRight, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>{displayData.amount}</Text>
            </View>
            <View style={styles.view}>
              <Text style={styles.viewLeft}>Tax</Text>
              <Text style={[styles.viewRight, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>{displayData.tax}</Text>
            </View>
            <View style={[styles.separateLine, {
              backgroundColor: dark ? COLORS.greyScale800 : COLORS.grayscale200
            }]} />
            <View style={styles.view}>
              <Text style={styles.viewLeft}>Total</Text>
              <Text style={[styles.viewRight, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>{displayData.total}</Text>
            </View>
          </View>

          <View style={[styles.cardContainer, {
            backgroundColor: dark ? COLORS.dark2 : COLORS.white
          }]}>
            <View style={styles.cardLeft}>
              <Image
                source={icons.creditCard}
                resizeMode='contain'
                style={styles.creditCard}
              />
              <Text style={[styles.creditCardNum, {
                color: dark ? COLORS.white : COLORS.greyscale900
              }]}
              >
                •••• •••• •••• •••• 4679</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("AddNewCard")}>
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
        <Button
          title="Continue"
          onPress={() => setModalVisible(true)}
          filled
          style={styles.continueBtn}
        />
      </View>
      {renderModal()}
      {renderRatingModal()}
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
    padding: 16
  },
  btnContainer: {
    width: SIZES.width - 32,
    height: 300,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 16,
    backgroundColor: "#FAFAFA"
  },
  premiumIcon: {
    width: 60,
    height: 60,
    tintColor: COLORS.primary
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12
  },
  price: {
    fontSize: 32,
    fontFamily: "bold",
    color: COLORS.greyscale900
  },
  priceMonth: {
    fontSize: 18,
    fontFamily: "medium",
    color: COLORS.grayscale700,
  },
  premiumItemContainer: {
    marginTop: 16
  },
  premiumItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6
  },
  premiumText: {
    fontSize: 16,
    fontFamily: "medium",
    color: COLORS.greyScale800,
    marginLeft: 24
  },
  summaryContainer: {
    width: SIZES.width - 32,
    borderRadius: 16,
    padding: 16,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 1,
      height: 1
    },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 2,
    marginBottom: 12,
    marginTop: 12,
  },
  view: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12
  },
  viewLeft: {
    fontSize: 14,
    fontFamily: "medium",
    color: COLORS.grayscale700
  },
  viewRight: {
    fontSize: 14,
    fontFamily: "semiBold",
    color: COLORS.greyscale900
  },
  separateLine: {
    width: "100%",
    height: 1,
    backgroundColor: COLORS.grayscale200
  },
  creditCard: {
    width: 44,
    height: 34
  },
  creditCardNum: {
    fontSize: 18,
    fontFamily: "bold",
    color: COLORS.greyscale900,
    marginLeft: 12
  },
  changeBtnText: {
    fontSize: 16,
    fontFamily: "bold",
    color: COLORS.primary
  },
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 72,
    width: SIZES.width - 32,
    height: 80,
    borderRadius: 16,
    padding: 16,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 1,
      height: 1
    },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 2
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  continueBtn: {
    borderRadius: 32,
    position: "absolute",
    bottom: 16,
    width: SIZES.width - 32,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    right: 16,
    left: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginVertical: 12
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: "regular",
    color: COLORS.black,
    textAlign: "center",
    marginVertical: 12
  },
  modalContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)"
  },
  modalSubContainer: {
    height: 520,
    width: SIZES.width * 0.9,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  modalIllustration: {
    height: 180,
    width: 180,
    marginVertical: 22
  },
  successBtn: {
    width: "100%",
    marginTop: 12,
    borderRadius: 32
  },
  receiptBtn: {
    width: "100%",
    marginTop: 12,
    borderRadius: 32,
    backgroundColor: COLORS.tansparentPrimary,
    borderColor: COLORS.tansparentPrimary
  },
  editPencilIcon: {
    width: 42,
    height: 42,
    tintColor: COLORS.white,
    zIndex: 99999,
    position: "absolute",
    top: 54,
    left: 58,
  },
  backgroundIllustration: {
    height: 150,
    width: 150,
    marginVertical: 22,
    alignItems: "center",
    justifyContent: "center",
    zIndex: -999
  },
  // New styles for rating modal
  ratingModalSubContainer: {
    width: SIZES.width * 0.9,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
  },
  ratingTitle: {
    fontSize: 20,
    fontFamily: "bold",
    textAlign: "center",
    marginBottom: 8
  },
  ratingSubtitle: {
    fontSize: 14,
    fontFamily: "regular",
    textAlign: "center",
    marginBottom: 24
  },
  ratingStarsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20
  },
  starButton: {
    padding: 8
  },
  starIcon: {
    width: 32,
    height: 32
  },
  ratingText: {
    fontSize: 18,
    fontFamily: "semiBold",
    textAlign: "center",
    marginBottom: 20
  },
  commentInput: {
    width: "100%",
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
    marginBottom: 20
  },
  commentPlaceholder: {
    fontSize: 14,
    fontFamily: "regular"
  },
  ratingButtonsContainer: {
    width: "100%"
  },
  submitReviewBtn: {
    width: "100%",
    borderRadius: 32
  }
})

export default ReviewSummary