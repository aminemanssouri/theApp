import { supabase } from '../supabase';

/**
 * Fetch service categories from Supabase
 * @param {number} limit - Maximum number of categories to fetch
 * @returns {Promise<{data: Array, error: any}>}
 */
export const fetchServiceCategories = async (limit = 8) => {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) return { data: null, error };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};

/**
 * Fetch all service categories
 * @returns {Promise<{data: Array, error: any}>}
 */
export const fetchAllCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) return { data: null, error };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};

/**
 * Fetch all active services with category and worker data
 * @param {number} limit - Maximum number of services to fetch
 * @returns {Promise<{data: Array, error: any}>}
 */
export const fetchActiveServices = async (limit = 10) => {
  try {
    // First get all active services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        base_price,
        is_active,
        created_at,
        category_id,
        icon,
        service_categories (
          id,
          name,
          description
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (servicesError) {
      return { data: [], error: servicesError };
    }
    
    if (!services || services.length === 0) {
      return { data: [], error: null };
    }
    
    // For each service, get workers using our SQL function with the correct service ID
    const servicesWithWorkers = await Promise.all(services.map(async (service) => {
      // Use the exact parameter syntax required by the function
      let { data: workers, error: workersError } = await supabase
        .rpc('get_service_workers', {
          service_id_param: service.id // Use the actual service ID, not a hardcoded value
        });
      
      if (workersError) {
        return { ...service, workers: [] };
      }
      
      return {
        ...service,
        workers: workers || []
      };
    }));

    return { data: servicesWithWorkers, error: null };
  } catch (err) {
    return { data: [], error: err };
  }
};

/**
 * Fetch services by category
 * @param {string} categoryId - Category ID to filter by
 * @param {number} limit - Maximum number of services to fetch
 * @returns {Promise<{data: Array, error: any}>}
 */
export const fetchServicesByCategory = async (categoryId, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        service_categories(
          id,
          name,
          description
        )
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return { data: null, error };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};

/**
 * Fetch all active services without limit
 * @returns {Promise<{data: Array, error: any}>}
 */
export const fetchAllServices = async () => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        service_categories(
          id,
          name,
          description
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};

/**
 * Fetch all homepage data (categories and services)
 * @returns {Promise<{categories: Array, services: Array, error: any}>}
 */
export const fetchHomepageData = async () => {
  try {
    // Get active services with worker data
    const { data: rawServices, error: servicesError } = await fetchActiveServices(10);
    
    if (servicesError) {
      return {
        categories: [],
        services: [],
        error: servicesError
      };
    }
    
    // Get categories
    const { data: categories, error: catError } = await fetchServiceCategories(8);
    
    if (catError) {
      return {
        categories: [],
        services: [],
        error: catError
      };
    }

    // Transform the data for UI
    const transformedCategories = transformCategories(categories || []);
    const transformedServices = transformServices(rawServices || []);

    return {
      categories: transformedCategories,
      services: transformedServices,
      error: null
    };
  } catch (err) {
    return {
      categories: [],
      services: [],
      error: err
    };
  }
};

/**
 * Transform category data to include "All" option
 * @param {Array} categories - Categories to transform
 * @returns {Array} Transformed categories
 */
export const transformCategories = (categories) => {
  if (!categories || !Array.isArray(categories)) {
    return [];
  }
  
  // Check if there's already a category with id "all"
  const hasAllCategory = categories.some(category => 
    category.id === "all" || category.id === "ALL");
  
  // Add "All" category at the beginning with a guaranteed unique ID
  const allCategory = {
    id: hasAllCategory ? "all_categories" : "all",
    name: "All",
    description: "All Categories",
    icon: null
  };
  
  const transformedCategories = [allCategory, ...categories.map(category => ({
    id: category.id,
    name: category.name,
    description: category.description || '',
    icon: category.icon
  }))];
  
  return transformedCategories;
};

/**
 * Transform service data for UI display
 * @param {Array} services - Services to transform
 * @returns {Array} Transformed services
 */
export const transformServices = (services) => {
  if (!services || !Array.isArray(services)) {
    return [];
  }
  
  // Import images for mapping
  const { images } = require('../../constants');

  // Map service names to appropriate images
  const getImageForService = (serviceName) => {
    if (!serviceName) return images.service1;
    
    const name = serviceName?.toLowerCase();
    if (name.includes('floor') || name.includes('regular') || name.includes('standard')) return images.service1;
    if (name.includes('house') || name.includes('home') || name.includes('deep')) return images.service2;
    if (name.includes('repair') || name.includes('appliance') || name.includes('plumb')) return images.service3;
    if (name.includes('paint')) return images.service4;
    if (name.includes('beauty') || name.includes('hair') || name.includes('cut') || name.includes('style')) return images.service5;
    if (name.includes('pet') || name.includes('groom')) return images.service6;
    if (name.includes('manicure') || name.includes('pedicure') || name.includes('nail')) return images.service7;
    if (name.includes('pipe') || name.includes('water')) return images.service8;
    if (name.includes('electric')) return images.service9;
    if (name.includes('garden') || name.includes('yard')) return images.service10;
    if (name.includes('moving') || name.includes('move')) return images.service11;
    return images.service1;
  };
  
  let transformedServices = [];
  
  services.forEach((service) => {
    const fallbackImage = getImageForService(service.name);
    const finalImage = service.icon || fallbackImage;
    
    // If the service has workers, create a separate card for each worker
    if (service.workers && service.workers.length > 0) {
      service.workers.forEach(worker => {
        // Worker full name should be provided directly by the SQL function
        const workerDisplayName = worker.worker_full_name || 
                                 `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || 
                                 `${service.name} Expert`;
        
        // Save display name to worker object for component usage
        worker.display_name = workerDisplayName;
        
        transformedServices.push({
          id: `${service.id}-${worker.worker_id}`,
          serviceId: service.id,
          name: service.name,
          description: service.description || '',
          image: finalImage,
          providerName: workerDisplayName,
          workerId: worker.worker_id,
          workerServiceId: worker.worker_service_id,
          price: worker.custom_price || service.base_price,
          isOnDiscount: false,
          oldPrice: null,
          rating: worker.average_rating || 4.5,
          numReviews: worker.total_jobs || 10,
          date: service.created_at,
          categoryId: service.category_id,
          category: service.service_categories,
          worker: worker,
          hasWorker: true
        });
      });
    } else {
      transformedServices.push({
        id: service.id,
        serviceId: service.id,
        name: service.name,
        description: service.description || '',
        image: finalImage,
        providerName: `${service.name} Provider`,
        price: service.base_price,
        isOnDiscount: false,
        oldPrice: null,
        rating: 4.5,
        numReviews: 10,
        date: service.created_at,
        categoryId: service.category_id,
        category: service.service_categories,
        hasWorker: false
      });
    }
  });
  
  return transformedServices;
};

/**
 * Utility function to get workers for a service using the SQL function
 * @param {string} serviceId - UUID of the service to get workers for
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getWorkersForService = async (serviceId) => {
  try {
    // Use the exact parameter syntax required by the function
    const { data, error } = await supabase
      .rpc('get_service_workers', {
        service_id_param: serviceId
      });
    
    if (error) {
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};