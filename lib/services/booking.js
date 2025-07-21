import { supabase } from '../supabase'


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
      .in('status', ['pending', 'confirmed', 'in_progress'])
      .order('booking_date', { ascending: true });
      
    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }
    
    return data || [];
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
    p_notes: bookingData.notes,
    p_addons: JSON.stringify(bookingData.addons || [])
  });
  
  if (error) throw error;
  return data;
};


export const cancelBooking = async (bookingId, userId, reason) => {
  const { data, error } = await supabase.rpc('cancel_booking', {
    p_booking_id: bookingId,
    p_user_id: userId,
    p_cancel_reason: reason
  });
  
  if (error) throw error;
  return data;
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