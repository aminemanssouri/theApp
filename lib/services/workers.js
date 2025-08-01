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
    
    // Get the worker's reviews if available
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('worker_id', workerId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!reviewsError) {
      worker.reviews = reviews || [];
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
