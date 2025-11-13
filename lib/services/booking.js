import { supabase } from '../supabase';
import { processStripeRefund } from './payment';


export const getUserBookings = async (userId, status = null) => {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      service:services(*),
      worker:workers(id, average_rating),
      booking_addons(*)
    `)
    .eq('client_id', userId)
    .order('booking_date', { ascending: false });
    
  // Optional filter by status
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getUpcomingBookings = async (userId) => {
  try {
    
    // First, let's do a simple query to see if we have any bookings at all

      
 
    
    // Now try the full query without the problematic join
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(*),
        worker:workers(*),
        booking_addons(
          id,
          quantity,
          price,
          addon:service_addons(name, description)
        )
      `)
      .eq('client_id', userId)
      .in('status', [ 'confirmed'])
      .order('booking_date', { ascending: true });
      
    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }
    
    // Remove duplicates based on id
    const uniqueBookings = data ? Array.from(
      new Map(data.map(booking => [booking.id, booking])).values()
    ) : [];
    
    return uniqueBookings;
  } catch (error) {
    console.error('❌ Error in getUpcomingBookings:', error);
    return [];
  }
};
export const getCompletedBookings = async (userId) => {
  try {
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(*),
        worker:workers(*),
        booking_addons(
          id,
          quantity,
          price,
          addon:service_addons(name, description)
        ),
        reviews!left(id, rating, comment)
      `)
      .eq('client_id', userId)
      .eq('status', 'completed')
      .order('booking_date', { ascending: false });
      
    if (error) {
      console.error('❌ Supabase error in getCompletedBookings:', error);
      throw error;
    }
    
    console.log('✅ Completed bookings fetched:', data ? data.length : 0);
    return data || [];
  } catch (error) {
    console.error('❌ Error in getCompletedBookings:', error);
    return [];
  }
};

export const getCancelledBookings = async (userId) => {
  try {
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(*),
        worker:workers(*),
        booking_addons(
          id,
          quantity,
          price,
          addon:service_addons(name, description)
        )
      `)
      .eq('client_id', userId)
      .in('status', ['cancelled', 'rejected'])
      .order('updated_at', { ascending: false });
      
    if (error) {
      console.error('❌ Supabase error in getCancelledBookings:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ Error in getCancelledBookings:', error);
    return [];
  }
};

export const createBooking = async (bookingData) => {
  try {
    
    // Format addons properly for the new RPC function
    const formattedAddons = bookingData.addons && bookingData.addons.length > 0
      ? bookingData.addons.map(addon => ({
          addon_id: addon.addon_id,
          quantity: addon.quantity || 1,
          price: addon.price || 0
        }))
      : [];
    
    
    const { data, error } = await supabase.rpc('create_booking', {
      p_client_id: bookingData.clientId,
      p_worker_id: bookingData.workerId,
      p_service_id: bookingData.serviceId,
      p_booking_date: bookingData.bookingDate,
      p_start_time: bookingData.startTime,
      p_end_time: bookingData.endTime,
      p_address: bookingData.address,
      p_city: bookingData.city,
      p_postal_code: bookingData.postalCode,
      p_notes: bookingData.notes || '',
      p_addons: formattedAddons  // Send as JavaScript array, Supabase will convert to JSONB
    });
    
    if (error) {
      console.error('Supabase RPC error:', error);
      throw error;
    }
    
    console.log('Booking created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createBooking:', error);
    throw error;
  }
};


export const cancelBooking = async (bookingId, userId, reason) => {
  try {
    console.log('🔄 Attempting to cancel booking:', { bookingId, userId, reason });
    
    // First, get the payment info for this booking
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .select('stripe_payment_intent_id, amount')
      .eq('booking_id', bookingId)
      .eq('method', 'credit_card')
      .eq('status', 'completed')
      .single();
    
    if (paymentError && paymentError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is okay (booking might not have payment)
      console.error('Error fetching payment:', paymentError);
    }
    
    // Check if there's a payment to refund
    let refundResult = null;
    if (paymentData?.stripe_payment_intent_id && paymentData?.amount) {
      console.log('💳 Processing refund for payment:', paymentData.stripe_payment_intent_id);
      
      // Process 80% refund via Stripe
      refundResult = await processStripeRefund(
        bookingId,
        paymentData.stripe_payment_intent_id,
        paymentData.amount,
        reason
      );
      
      if (!refundResult.success) {
        throw new Error(`Refund failed: ${refundResult.error}`);
      }
      
      console.log('✅ Refund processed:', refundResult);
    } else {
      console.log('ℹ️ No Stripe payment found for this booking, skipping refund');
    }
    
    // Now cancel the booking in the database
    const { data, error } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_user_id: userId,
      p_cancel_reason: reason
    });
    
    if (error) {
      console.error('❌ Supabase RPC error:', error);
      throw error;
    }
    
    console.log('📋 Backend response:', data);
    
    // The backend function returns a JSON object with success/failure info
    if (data && typeof data === 'object') {
      if (data.success === false) {
        throw new Error(data.message || 'Cancellation failed');
      }
      
      // Add refund info to response
      const response = { ...data };
      if (refundResult) {
        response.refund = {
          refundAmount: refundResult.refundAmount,
          cancellationFee: refundResult.cancellationFee,
          refundId: refundResult.refundId,
        };
      }
      
      // Success case - log any cancellation fee info
      if (data.cancellation_fee) {
        console.log('💰 Cancellation fee applied:', data.cancellation_fee);
      }
      
      console.log('✅ Booking cancelled successfully:', data.message);
      return response;
    } else {
      // Fallback for unexpected response format
      console.log('✅ Booking cancelled (legacy response)');
      return { success: true, message: 'Booking cancelled successfully', refund: refundResult };
    }
    
  } catch (error) {
    console.error('❌ Error in cancelBooking:', error);
    throw error;
  }
};


export const getBookingDetails = async (bookingId) => {
  const { data, error } = await supabase.rpc('get_booking_details', {
    p_booking_id: bookingId
  });
  
  if (error) throw error;
  return data;
};

export const addBookingReview = async (bookingId, userId, workerId, rating, comment) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      booking_id: bookingId,
      reviewer_id: userId,
      worker_id: workerId,
      rating,
      comment
    });
    
  if (error) throw error;
  return data;
};