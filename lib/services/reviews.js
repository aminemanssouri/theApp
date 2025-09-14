import { supabase } from '../supabase';

/**
 * Reviews Service
 * Handles all review-related operations matching the database schema
 */

class ReviewsService {
  /**
   * Create a new review
   * @param {Object} reviewData - Review details
   * @param {string} reviewData.booking_id - UUID of the booking
   * @param {string} reviewData.worker_id - UUID of the worker being reviewed
   * @param {number} reviewData.rating - Rating from 1-5
   * @param {string} reviewData.comment - Optional review comment
   * @returns {Promise<Object>} Created review
   */
  async createReview({ booking_id, worker_id, rating, comment }) {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Check if booking exists and belongs to user
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, client_id, worker_id, status')
        .eq('id', booking_id)
        .eq('client_id', user.id)
        .single();

      if (bookingError || !booking) {
        throw new Error('Booking not found or unauthorized');
      }

      // Verify booking is completed
      if (booking.status !== 'completed') {
        throw new Error('Can only review completed bookings');
      }

      // Check if review already exists for this booking
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', booking_id)
        .single();

      if (existingReview) {
        throw new Error('Review already exists for this booking');
      }

      // Create the review
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          booking_id,
          reviewer_id: user.id,
          worker_id: worker_id || booking.worker_id,
          rating,
          comment: comment || null,
          created_at: new Date().toISOString()
        })
        .select('*, workers(first_name, last_name, Image)')
        .single();

      if (reviewError) throw reviewError;

      // Update worker's average rating and total jobs
      await this.updateWorkerStatistics(worker_id || booking.worker_id);

      return {
        success: true,
        data: review
      };
    } catch (error) {
      console.error('Error creating review:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get reviews for a specific worker
   * @param {string} worker_id - UUID of the worker
   * @param {Object} options - Query options
   * @returns {Promise<Object>} List of reviews
   */
  async getWorkerReviews(worker_id, options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'created_at', order = 'desc' } = options;
      const offset = (page - 1) * limit;

      // Get reviews with reviewer details
      const { data: reviews, error, count } = await supabase
        .from('reviews')
        .select(`
          *,
          users!reviewer_id (
            first_name,
            last_name,
            profile_picture
          ),
          bookings (
            service_id,
            services (
              name,
              icon
            )
          )
        `, { count: 'exact' })
        .eq('worker_id', worker_id)
        .order(sortBy, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Calculate rating distribution
      const { data: ratingStats } = await supabase
        .from('reviews')
        .select('rating')
        .eq('worker_id', worker_id);

      const distribution = {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
        total: 0,
        average: 0
      };

      if (ratingStats) {
        ratingStats.forEach(r => {
          distribution[r.rating]++;
          distribution.total++;
        });
        
        if (distribution.total > 0) {
          const sum = Object.keys(distribution)
            .filter(key => !isNaN(key))
            .reduce((acc, key) => acc + (parseInt(key) * distribution[key]), 0);
          distribution.average = (sum / distribution.total).toFixed(1);
        }
      }

      return {
        success: true,
        data: {
          reviews: reviews || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          },
          statistics: distribution
        }
      };
    } catch (error) {
      console.error('Error fetching worker reviews:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get reviews by a specific user
   * @param {string} user_id - UUID of the reviewer (optional, defaults to current user)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} List of reviews
   */
  async getUserReviews(user_id = null, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;

      // Use current user if no user_id provided
      if (!user_id) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        user_id = user.id;
      }

      const { data: reviews, error, count } = await supabase
        .from('reviews')
        .select(`
          *,
          workers (
            id,
            first_name,
            last_name,
            Image,
            average_rating
          ),
          bookings (
            booking_date,
            services (
              name,
              icon
            )
          )
        `, { count: 'exact' })
        .eq('reviewer_id', user_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: {
          reviews: reviews || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        }
      };
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get a single review by booking ID
   * @param {string} booking_id - UUID of the booking
   * @returns {Promise<Object>} Review details
   */
  async getBookingReview(booking_id) {
    try {
      const { data: review, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users!reviewer_id (
            first_name,
            last_name,
            profile_picture
          ),
          workers (
            first_name,
            last_name,
            Image
          )
        `)
        .eq('booking_id', booking_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

      return {
        success: true,
        data: review,
        exists: !!review
      };
    } catch (error) {
      console.error('Error fetching booking review:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update an existing review
   * @param {string} review_id - UUID of the review
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated review
   */
  async updateReview(review_id, { rating, comment }) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Verify ownership
      const { data: existingReview, error: checkError } = await supabase
        .from('reviews')
        .select('reviewer_id, worker_id')
        .eq('id', review_id)
        .eq('reviewer_id', user.id)
        .single();

      if (checkError || !existingReview) {
        throw new Error('Review not found or unauthorized');
      }

      // Validate rating if provided
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Update the review
      const updateData = {
        updated_at: new Date().toISOString()
      };
      
      if (rating !== undefined) updateData.rating = rating;
      if (comment !== undefined) updateData.comment = comment;

      const { data: review, error } = await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', review_id)
        .select()
        .single();

      if (error) throw error;

      // Update worker statistics if rating changed
      if (rating !== undefined) {
        await this.updateWorkerStatistics(existingReview.worker_id);
      }

      return {
        success: true,
        data: review
      };
    } catch (error) {
      console.error('Error updating review:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a review
   * @param {string} review_id - UUID of the review
   * @returns {Promise<Object>} Deletion result
   */
  async deleteReview(review_id) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Verify ownership and get worker_id for stats update
      const { data: review, error: checkError } = await supabase
        .from('reviews')
        .select('reviewer_id, worker_id')
        .eq('id', review_id)
        .eq('reviewer_id', user.id)
        .single();

      if (checkError || !review) {
        throw new Error('Review not found or unauthorized');
      }

      // Delete the review
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', review_id);

      if (error) throw error;

      // Update worker statistics
      await this.updateWorkerStatistics(review.worker_id);

      return {
        success: true,
        message: 'Review deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting review:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update worker statistics after review changes
   * @param {string} worker_id - UUID of the worker
   * @private
   */
  async updateWorkerStatistics(worker_id) {
    try {
      // Calculate new average rating
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('worker_id', worker_id);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        // Update worker's average rating
        await supabase
          .from('workers')
          .update({
            average_rating: avgRating.toFixed(2),
            updated_at: new Date().toISOString()
          })
          .eq('id', worker_id);

        // Update worker statistics if the table exists
        await supabase
          .from('worker_statistics')
          .upsert({
            worker_id,
            average_rating: avgRating.toFixed(2),
            total_reviews: reviews.length,
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'worker_id'
          });
      }
    } catch (error) {
      console.error('Error updating worker statistics:', error);
      // Don't throw - this is a background operation
    }
  }

  /**
   * Check if user can review a booking
   * @param {string} booking_id - UUID of the booking
   * @returns {Promise<Object>} Eligibility status
   */
  async canReviewBooking(booking_id) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Check booking status and ownership
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('status, client_id, worker_id')
        .eq('id', booking_id)
        .eq('client_id', user.id)
        .single();

      if (bookingError || !booking) {
        return {
          success: false,
          canReview: false,
          reason: 'Booking not found or unauthorized'
        };
      }

      if (booking.status !== 'completed') {
        return {
          success: false,
          canReview: false,
          reason: 'Booking must be completed before reviewing'
        };
      }

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', booking_id)
        .single();

      if (existingReview) {
        return {
          success: true,
          canReview: false,
          reason: 'Review already submitted',
          reviewId: existingReview.id
        };
      }

      return {
        success: true,
        canReview: true,
        workerId: booking.worker_id
      };
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new ReviewsService();