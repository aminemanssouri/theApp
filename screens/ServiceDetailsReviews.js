import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Modal, TouchableWithoutFeedback, TextInput, ActivityIndicator, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { COLORS, SIZES, icons, illustrations, images } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';
import ReviewCard from '../components/ReviewCard';
import { Fontisto } from "@expo/vector-icons";
import { useTheme } from '../theme/ThemeProvider';
import Rating from '../components/Rating';
import Button from '../components/Button';
import reviewsService from '../lib/services/reviews';
import ReviewStars from '../components/ReviewStars';

const ServiceDetailsReviews = ({ navigation, route }) => {
    const { colors, dark } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState({
        average: 0,
        total: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    });
    const [selectedRating, setSelectedRating] = useState("All");
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Get worker ID from route params
    const workerId = route.params?.workerId;
    const bookingId = route.params?.bookingId;

    // Load reviews on mount
    useEffect(() => {
        console.log('ServiceDetailsReviews params:', { workerId, bookingId });
        
        if (workerId) {
            fetchReviews();
        }
        
        // Show modal if there's a booking to review
        if (bookingId) {
            console.log('Checking if user can review booking:', bookingId);
            checkAndShowReviewModal();
        }
    }, [workerId, bookingId]);

    // Check if user can review and show modal
    const checkAndShowReviewModal = async () => {
        if (!bookingId) return;
        
        console.log('Checking review eligibility for booking:', bookingId);
        const result = await reviewsService.canReviewBooking(bookingId);
        console.log('Review eligibility result:', result);
        
        if (result.success && result.canReview) {
            console.log('User can review - showing modal');
            setModalVisible(true);
        } else {
            console.log('User cannot review:', result.reason || result.error);
        }
    };

    // Fetch reviews from database
    const fetchReviews = async () => {
        setLoading(true);
        try {
            const result = await reviewsService.getWorkerReviews(workerId, {
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

    const handleSubmitReview = async () => {
        if (!bookingId) {
            Alert.alert('Test Mode', 'This tests the review UI without a real booking.');
            setSubmitting(true);
            setTimeout(() => {
                setSubmitting(false);
                Alert.alert('Success', 'Review UI test completed!');
                setModalVisible(false);
                setReviewComment('');
                setReviewRating(5);
            }, 1500);
            return;
        }

        setSubmitting(true);
        try {
            const result = await reviewsService.createReview({
                booking_id: bookingId,
                worker_id: workerId,
                rating: reviewRating,
                comment: reviewComment
            });

            if (result.success) {
                Alert.alert('Success', 'Thank you for your review!');
                setModalVisible(false);
                setReviewComment('');
                setReviewRating(5);
                fetchReviews();
            } else {
                Alert.alert('Error', result.error || 'Failed to submit review');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Render header
     */
    const renderHeader = () => {
        return (
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}>
                        <Image
                            source={icons.back}
                            resizeMode='contain'
                            style={[styles.backIcon, {
                                tintColor: dark ? COLORS.white : COLORS.greyscale900
                            }]}
                        />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, {
                        color: dark ? COLORS.white : COLORS.greyscale900
                    }]}>
                        {statistics.average} ({statistics.total} reviews)
                    </Text>
                </View>
                <TouchableOpacity>
                    <Image
                        source={icons.moreCircle}
                        resizeMode='contain'
                        style={[styles.moreIcon, {
                            tintColor: dark ? COLORS.secondaryWhite : COLORS.greyscale900
                        }]}
                    />
                </TouchableOpacity>
            </View>
        );
    };

    /**
     * Render review statistics
     */
    const renderStatistics = () => {
        return (
            <View style={[styles.statsContainer, {
                backgroundColor: dark ? COLORS.dark2 : COLORS.white
            }]}>
                <View style={styles.statsLeft}>
                    <Text style={[styles.statsNumber, {
                        color: dark ? COLORS.white : COLORS.greyscale900
                    }]}>{statistics.average}</Text>
                    <ReviewStars 
                        review={parseFloat(statistics.average)} 
                        size={16}
                        color={COLORS.primary}
                    />
                    <Text style={[styles.statsTotal, {
                        color: dark ? COLORS.gray : COLORS.grayscale700
                    }]}>({statistics.total} reviews)</Text>
                </View>
                <View style={styles.statsRight}>
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = statistics.distribution[star] || 0;
                        const percentage = statistics.total > 0 
                            ? (count / statistics.total * 100).toFixed(0) 
                            : 0;
                        
                        return (
                            <View key={star} style={styles.statBar}>
                                <Text style={[styles.statLabel, {
                                    color: dark ? COLORS.gray : COLORS.grayscale700
                                }]}>{star}</Text>
                                <View style={[styles.progressBar, {
                                    backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200
                                }]}>
                                    <View 
                                        style={[
                                            styles.progressFill,
                                            { 
                                                width: `${percentage}%`,
                                                backgroundColor: COLORS.primary
                                            }
                                        ]} 
                                    />
                                </View>
                                <Text style={[styles.statCount, {
                                    color: dark ? COLORS.gray : COLORS.grayscale700
                                }]}>{count}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    /**
     * Render reviews modal
     */
    const renderModal = () => {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}>
                <TouchableWithoutFeedback
                    onPress={() => setModalVisible(false)}>
                    <View style={[styles.modalContainer]}>
                        <View style={[styles.modalSubContainer, {
                            backgroundColor: dark ? COLORS.dark2 : COLORS.secondaryWhite
                        }]}>
                            <View style={styles.backgroundIllustration}>
                                <Image
                                    source={illustrations.background}
                                    resizeMode='contain'
                                    style={styles.modalIllustration}
                                />
                                <Image
                                    source={icons.editPencil}
                                    resizeMode='contain'
                                    style={styles.editPencilIcon}
                                />
                            </View>
                            <Text style={styles.modalTitle}>Booking Completed!</Text>
                            <Text style={[styles.modalSubtitle, { 
                                color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 
                            }]}>
                                Please leave a review for others.
                            </Text>
                            
                            {/* Interactive Star Rating */}
                            <View style={styles.ratingContainer}>
                                <ReviewStars
                                    review={reviewRating}
                                    size={32}
                                    color={COLORS.primary}
                                    interactive={true}
                                    onRatingChange={setReviewRating}
                                />
                            </View>
                            
                            <TextInput
                                placeholder="Share your experience..."
                                placeholderTextColor={dark ? COLORS.gray : COLORS.grayscale500}
                                style={[styles.modalInput, {
                                    backgroundColor: dark ? COLORS.dark3 : COLORS.tansparentPrimary,
                                    color: dark ? COLORS.white : COLORS.black,
                                    borderColor: dark ? COLORS.dark3 : COLORS.primary
                                }]}
                                value={reviewComment}
                                onChangeText={setReviewComment}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                            
                            <Button
                                title={submitting ? "Submitting..." : "Write Review"}
                                filled
                                disabled={submitting}
                                onPress={handleSubmitReview}
                                style={{
                                    width: "100%",
                                    marginTop: 12
                                }}
                            />
                            <Button
                                title="Cancel"
                                onPress={() => {
                                    setModalVisible(false);
                                    setReviewComment('');
                                    setReviewRating(5);
                                }}
                                textColor={dark ? COLORS.white : COLORS.primary}
                                style={{
                                    width: "100%",
                                    marginTop: 12,
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

    /**
     * Render content
     */
    const renderContent = () => {
        const renderRatingButton = (rating) => (
            <TouchableOpacity
                key={rating.toString()}
                style={[
                    styles.ratingButton, 
                    selectedRating === rating && styles.selectedRatingButton
                ]}
                onPress={() => setSelectedRating(rating)}
            >
                <Fontisto 
                    name="star" 
                    size={12} 
                    color={selectedRating === rating ? COLORS.white : COLORS.primary} 
                />
                <Text style={[
                    styles.ratingButtonText, 
                    selectedRating === rating && styles.selectedRatingButtonText
                ]}>
                    {rating}
                </Text>
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

        return (
            <ScrollView
                showsVerticalScrollIndicator={false}
                style={[styles.container, { backgroundColor: colors.background }]}>
                
                {/* Statistics Section */}
                {renderStatistics()}
                
                {/* Rating Filter Buttons */}
                <FlatList
                    horizontal
                    data={["All", "5", "4", "3", "2", "1"]}
                    keyExtractor={(item) => item.toString()}
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
                            // Format review data for ReviewCard
                            const reviewer = item.users || {};
                            const avatar = reviewer.profile_picture 
                                ? { uri: reviewer.profile_picture }
                                : images.user1; // fallback image
                            
                            return (
                                <ReviewCard
                                    avatar={avatar}
                                    name={`${reviewer.first_name || ''} ${reviewer.last_name || ''}`.trim() || 'Anonymous'}
                                    description={item.comment || 'No comment provided'}
                                    avgRating={item.rating}
                                    date={item.created_at}
                                    numLikes={0} // You can add likes functionality later
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
    }

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {renderHeader()}
                {renderContent()}
            </View>
            {renderModal()}
            
            {/* Floating test button */}
            <TouchableOpacity 
                onPress={() => {
                    console.log('Test modal triggered');
                    setModalVisible(true);
                }}
                style={{
                    position: 'absolute',
                    bottom: 80,
                    right: 20,
                    backgroundColor: COLORS.primary,
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                }}
            >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>TEST</Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
};

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    headerContainer: {
        flexDirection: "row",
        width: SIZES.width - 32,
        justifyContent: "space-between",
        marginBottom: 0
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center"
    },
    backIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.black
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'bold',
        color: COLORS.black,
        marginLeft: 16
    },
    moreIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.black
    },
    // Statistics styles
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        marginVertical: 12,
        borderRadius: 12,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
    },
    statsLeft: {
        alignItems: 'center',
        marginRight: 24,
        paddingRight: 24,
        borderRightWidth: 1,
        borderRightColor: COLORS.grayscale200
    },
    statsNumber: {
        fontSize: 32,
        fontFamily: 'bold',
        marginBottom: 8
    },
    statsTotal: {
        fontSize: 14,
        fontFamily: 'regular',
        marginTop: 8
    },
    statsRight: {
        flex: 1
    },
    statBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4
    },
    statLabel: {
        width: 20,
        fontSize: 14,
        fontFamily: 'medium'
    },
    progressBar: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 8,
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        borderRadius: 4
    },
    statCount: {
        width: 30,
        fontSize: 14,
        fontFamily: 'regular',
        textAlign: 'right'
    },
    // Rating buttons styles
    ratingButtonContainer: {
        paddingVertical: 10,
        marginVertical: 12
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
    // Modal styles
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
        marginVertical: 12,
        marginHorizontal: 16
    },
    modalContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.5)"
    },
    modalSubContainer: {
        height: 622,
        width: SIZES.width * 0.86,
        backgroundColor: COLORS.white,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        padding: 16
    },
    backgroundIllustration: {
        height: 150,
        width: 150,
        marginVertical: 22,
        alignItems: "center",
        justifyContent: "center",
        zIndex: -999
    },
    modalIllustration: {
        height: 150,
        width: 150,
    },
    modalInput: {
        width: "100%",
        height: 100,
        backgroundColor: COLORS.tansparentPrimary,
        paddingHorizontal: 12,
        paddingTop: 12,
        borderRadius: 12,
        borderColor: COLORS.primary,
        borderWidth: 1,
        marginVertical: 12
    },
    editPencilIcon: {
        width: 42,
        height: 42,
        tintColor: COLORS.white,
        zIndex: 99999,
        position: "absolute",
        top: 54,
        left: 60,
    },
    ratingContainer: {
        marginVertical: 16
    },
    // Loading and empty states
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

export default ServiceDetailsReviews