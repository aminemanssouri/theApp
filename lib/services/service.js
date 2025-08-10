import { supabase } from '../supabase';
import { fetchServiceWithWorkers, transformServices } from './home';

/**
 * Get a service by ID with all details including workers
 * @param {string} serviceId - The ID of the service to fetch
 * @returns {Promise<{service: Object, error: any}>}
 */
export const getServiceById = async (serviceId) => {
  try {
    const { data, error } = await fetchServiceWithWorkers(serviceId);
    
    if (error) {
      console.error('Error fetching service details:', error);
      return { service: null, error };
    }
    
    if (!data) {
      return { service: null, error: new Error('Service not found') };
    }
    
    // Transform the service data
    const [transformedService] = transformServices([data]);
    
    return { service: transformedService, error: null };
  } catch (err) {
    console.error('Service details fetch error:', err);
    return { service: null, error: err };
  }
};

/**
 * Get all workers for a specific service
 * @param {string} serviceId - The ID of the service
 * @returns {Promise<{workers: Array, error: any}>}
 */
export const getServiceWorkers = async (serviceId) => {
  try {
    const { data: workerServices, error } = await supabase
      .from('worker_services')
      .select(`
        *,
        workers(
          id,
          first_name,
          last_name,
          bio,
          hourly_rate,
          average_rating,
          total_jobs
        )
      `)
      .eq('service_id', serviceId);
      
    if (error) {
      console.error('Error fetching service workers:', error);
      return { workers: [], error };
    }
    
    // Extract and format worker data
    const workers = workerServices.map(ws => ({
      id: ws.workers.id,
      name: `${ws.workers.first_name} ${ws.workers.last_name}`,
      bio: ws.workers.bio,
      hourlyRate: ws.workers.hourly_rate,
      customPrice: ws.custom_price,
      rating: ws.workers.average_rating,
      jobsCompleted: ws.workers.total_jobs
    }));
    
    return { workers, error: null };
  } catch (err) {
    console.error('Service workers fetch error:', err);
    return { workers: [], error: err };
  }
};
