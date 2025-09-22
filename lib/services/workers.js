import { supabase } from '../supabase';

/**
 * Direct SQL approach to get worker data for services
 * This uses a SQL query similar to the one that worked in Supabase Studio
 */
export const getServiceWorkersWithNames = async (serviceId) => {
  try {
    // This query is structured exactly like your SQL query that worked
    const { data, error } = await supabase.rpc(
      'get_service_workers',
      { service_id_param: serviceId }
    );
    
    if (error) {
      console.error(`Error fetching workers for service ${serviceId}:`, error);
      return { data: [], error };
    }
    
    console.log(`Got ${data?.length || 0} workers for service ${serviceId}`);
    if (data && data.length > 0) {
      console.log('First worker data:', JSON.stringify(data[0], null, 2));
    }
    
    return { data, error: null };
  } catch (err) {
    console.error(`Error in getServiceWorkersWithNames for service ${serviceId}:`, err);
    return { data: [], error: err };
  }
};

/**
 * Get detailed worker information
 * @param {string} workerId - The worker's UUID
 * @param {string} serviceId - Optional service ID to get custom price for this service
 * @returns {Promise<{data: Object, error: any}>}
 */
export const getWorkerDetails = async (workerId, serviceId = null) => {
  try {
    // First get the basic worker info
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .single();
    
    if (workerError) {
      console.error('Error fetching worker:', workerError);
      return { data: null, error: workerError };
    }
    
    if (!worker) {
      return { data: null, error: { message: 'Worker not found' } };
    }
    
    // Format the worker's full name
    worker.full_name = `${worker.first_name || ''} ${worker.last_name || ''}`.trim();
    
    // If a service ID was provided, get the custom price for this service
    if (serviceId) {
      const { data: workerService, error: wsError } = await supabase
        .from('worker_services')
        .select('*')
        .eq('worker_id', workerId)
        .eq('service_id', serviceId)
        .single();
      
      if (!wsError && workerService) {
        worker.custom_price = workerService.custom_price;
        worker.worker_service_id = workerService.id;
      }
    }
    
    // Get the worker's reviews and calculate statistics
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating, comment, created_at, bookings(service_id, services(name))')
      .eq('worker_id', workerId)
      .order('created_at', { ascending: false });
    
    if (!reviewsError && reviews && reviews.length > 0) {
      worker.reviews = reviews;
      
      // Calculate real review statistics
      const ratings = reviews.map(r => r.rating);
      const sum = ratings.reduce((acc, rating) => acc + rating, 0);
      worker.average_rating = Number((sum / ratings.length).toFixed(1));
      worker.total_reviews = ratings.length;
      worker.rating = worker.average_rating; // For compatibility with existing code
      
      // Calculate rating distribution
      worker.rating_distribution = {
        1: ratings.filter(r => r === 1).length,
        2: ratings.filter(r => r === 2).length,
        3: ratings.filter(r => r === 3).length,
        4: ratings.filter(r => r === 4).length,
        5: ratings.filter(r => r === 5).length
      };
    } else {
      worker.reviews = [];
      worker.average_rating = 0;
      worker.total_reviews = 0;
      worker.rating = 0; // No reviews = no rating
      worker.rating_distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }
    
    return { data: worker, error: null };
  } catch (err) {
    console.error('Error in getWorkerDetails:', err);
    return { data: null, error: err };
  }
};

/**
 * Get all services provided by a worker
 * @param {string} workerId - The worker's UUID
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getWorkerServices = async (workerId) => {
  try {
    const { data, error } = await supabase
      .from('worker_services')
      .select(`
        id,
        custom_price,
        service_id,
        services:service_id (
          id,
          name,
          description,
          base_price,
          icon,
          category_id,
          service_categories:category_id (
            id,
            name
          )
        )
      `)
      .eq('worker_id', workerId);
    
    if (error) {
      return { data: [], error };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err };
  }
};

/**
 * Get worker information by conversation ID
 * @param {string} conversationId - The conversation UUID
 * @param {string} userId - The current user's ID
 * @returns {Promise<{data: Object, error: any}>}
 */
export const getWorkerByConversation = async (conversationId, userId) => {
  try {
    // Get all participants in the conversation
    const { data: participants, error } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId);
    
    if (error) {
      console.error('Error fetching conversation participants:', error);
      return { data: null, error };
    }
    
    // Find the other participant (not the current user)
    const otherParticipantId = participants?.find(p => p.user_id !== userId)?.user_id;
    
    if (!otherParticipantId) {
      console.log('No other participant found in conversation');
      return { data: null, error: null };
    }
    
    // Check if this user is a worker
    const result = await getWorkerDetails(otherParticipantId);
    console.log('Found worker in conversation:', result.data?.full_name);
    return result;
  } catch (err) {
    console.error('Error getting worker from conversation:', err);
    return { data: null, error: err };
  }
};
