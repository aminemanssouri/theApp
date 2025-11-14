import { supabase } from '../supabase';
import { getCurrentLanguage, t } from '../../context/LanguageContext';

// Helpers to pick and apply translations from related tables
const pickTranslation = (translations, lang) => {
  if (!Array.isArray(translations)) return null;
  return (
    translations.find(tr => tr.language_code === lang) ||
    translations.find(tr => tr.language_code === 'en') ||
    translations[0] ||
    null
  );
};

const mapCategoryWithTranslation = (category, lang) => {
  if (!category) return category;
  const tr = pickTranslation(category.service_category_translations, lang);
  return {
    ...category,
    name: tr?.name ?? category.name,
    description: tr?.description ?? category.description,
  };
};

const mapServiceWithTranslation = (service, lang) => {
  if (!service) return service;
  const tr = pickTranslation(service?.service_translations, lang);
  const mappedCategory = mapCategoryWithTranslation(service?.service_categories, lang);
  return {
    ...service,
    name: tr?.name ?? service.name,
    description: tr?.description ?? service.description,
    service_categories: mappedCategory,
  };
};

/**
 * Fetch service categories from Supabase
 * @param {number} limit - Maximum number of categories to fetch
 * @returns {Promise<{data: Array, error: any}>}
 */
export const fetchServiceCategories = async (limit = 8) => {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select(`
        id,
        name,
        description,
        icon_url,
        created_at,
        service_category_translations(
          language_code,
          name,
          description
        )
      `)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) return { data: null, error };
    const lang = getCurrentLanguage();
    const mapped = (data || []).map(c => mapCategoryWithTranslation(c, lang));
    return { data: mapped, error: null };
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
      .select(`
        id,
        name,
        description,
        icon_url,
        created_at,
        service_category_translations(
          language_code,
          name,
          description
        )
      `)
      .order('created_at', { ascending: true });

    if (error) return { data: null, error };
    
    const lang = getCurrentLanguage();
    const mapped = (data || []).map(c => mapCategoryWithTranslation(c, lang));
    return { data: mapped, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};

/**
 * Fetch all active services with category and worker data including real review statistics
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
        service_translations(
          language_code,
          name,
          description
        ),
        service_categories (
          id,
          name,
          description,
          icon_url,
          service_category_translations(
            language_code,
            name,
            description
          )
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
    
    // Apply translations based on current language
    const lang = getCurrentLanguage();
    const translatedServices = services.map(s => mapServiceWithTranslation(s, lang));

    // For each service, get workers with real review statistics
    const servicesWithWorkers = await Promise.all(translatedServices.map(async (service) => {
      // Get workers for this service with real review data
      const { data: workerServices, error: wsError } = await supabase
        .from('worker_services')
        .select(`
          id,
          custom_price,
          worker_id,
          workers (
            id,
            first_name,
            last_name,
            bio,
            experience_years,
            hourly_rate,
            is_available,
            total_jobs,
            Image
          )
        `)
        .eq('service_id', service.id);

      if (wsError || !workerServices) {
        return { ...service, workers: [] };
      }

      // For each worker, calculate real review statistics
      const workersWithReviews = await Promise.all(workerServices.map(async (ws) => {
        const worker = ws.workers;
        if (!worker) return null;

        // Get real review statistics from reviews table
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating, comment, created_at')
          .eq('worker_id', worker.id);

        let reviewStats = {
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };

        if (!reviewsError && reviews && reviews.length > 0) {
          const ratings = reviews.map(r => r.rating);
          const sum = ratings.reduce((acc, rating) => acc + rating, 0);
          
          reviewStats = {
            average_rating: Number((sum / ratings.length).toFixed(1)),
            total_reviews: ratings.length,
            rating_distribution: {
              1: ratings.filter(r => r === 1).length,
              2: ratings.filter(r => r === 2).length,
              3: ratings.filter(r => r === 3).length,
              4: ratings.filter(r => r === 4).length,
              5: ratings.filter(r => r === 5).length
            }
          };
        }

        return {
          worker_id: worker.id,
          worker_service_id: ws.id,
          first_name: worker.first_name,
          last_name: worker.last_name,
          worker_full_name: `${worker.first_name || ''} ${worker.last_name || ''}`.trim(),
          bio: worker.bio,
          experience_years: worker.experience_years,
          hourly_rate: worker.hourly_rate,
          is_available: worker.is_available,
          total_jobs: worker.total_jobs,
          image: worker.Image,
          custom_price: ws.custom_price,
          ...reviewStats
        };
      }));

      // Include all workers, filter out only null ones
      const validWorkers = workersWithReviews.filter(w => w !== null);

      // Sort workers by ranking criteria (reviews first, then experience, then availability)
      const rankedWorkers = validWorkers.sort((a, b) => {
         if (a.total_reviews > 0 && b.total_reviews === 0) return -1;
        if (a.total_reviews === 0 && b.total_reviews > 0) return 1;
        
         if (a.total_reviews > 0 && b.total_reviews > 0) {
          if (a.average_rating !== b.average_rating) {
            return b.average_rating - a.average_rating; // Higher rating first
          }
           return b.total_reviews - a.total_reviews;
        }
        
        // For workers without reviews, sort by experience and availability
        if (a.total_reviews === 0 && b.total_reviews === 0) {
          // Available workers first
          if (a.is_available && !b.is_available) return -1;
          if (!a.is_available && b.is_available) return 1;
          
          // Then by experience years
          const aExp = a.experience_years || 0;
          const bExp = b.experience_years || 0;
          if (aExp !== bExp) return bExp - aExp; // More experience first
          
          // Finally by total jobs completed
          const aJobs = a.total_jobs || 0;
          const bJobs = b.total_jobs || 0;
          return bJobs - aJobs; // More jobs first
        }
        
        return 0;
      });

      return {
        ...service,
        workers: rankedWorkers
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
        id,
        name,
        description,
        base_price,
        is_active,
        created_at,
        category_id,
        icon,
        service_translations(
          language_code,
          name,
          description
        ),
        service_categories(
          id,
          name,
          description,
          icon,
          service_category_translations(
            language_code,
            name,
            description
          )
        )
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return { data: null, error };
    const lang = getCurrentLanguage();
    const mapped = (data || []).map(s => mapServiceWithTranslation(s, lang));
    return { data: mapped, error: null };
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
        id,
        name,
        description,
        base_price,
        is_active,
        created_at,
        category_id,
        icon,
        service_translations(
          language_code,
          name,
          description
        ),
        service_categories(
          id,
          name,
          description,
          icon,
          service_category_translations(
            language_code,
            name,
            description
          )
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error };
    const lang = getCurrentLanguage();
    const mapped = (data || []).map(s => mapServiceWithTranslation(s, lang));
    return { data: mapped, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};

/**
 * Search services by name or description
 * @param {string} query - The search query
 * @param {number} limit - Maximum number of services to fetch
 * @returns {Promise<{data: Array, error: any}>}
 */
export const searchServices = async (query, limit = 10) => {
  try {
    if (!query || query.trim() === '') {
      return { data: [], error: null };
    }
    
    // Search services by name or description using ilike for case-insensitive search
    const { data: services, error } = await supabase
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
        service_translations(
          language_code,
          name,
          description
        ),
        service_categories (
          id,
          name,
          description,
          icon,
          service_category_translations(
            language_code,
            name,
            description
          )
        )
      `)
      .eq('is_active', true)
      .or(`name.ilike.%${query}%, description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: [], error };
    }
    
    // Apply translations based on current language
    const lang = getCurrentLanguage();
    const translated = (services || []).map(s => mapServiceWithTranslation(s, lang));

    // Get workers for each service with review statistics
    const servicesWithWorkers = await Promise.all(translated.map(async (service) => {
      let { data: workers, error: workersError } = await supabase
        .rpc('get_service_workers', {
          service_id_param: service.id
        });
      
      if (workersError) {
        return { ...service, workers: [] };
      }
      
      // For each worker, get their review statistics
      const workersWithReviews = await Promise.all((workers || []).map(async (worker) => {
        try {
          // Get review statistics for this worker
          const { data: reviewStats, error: reviewError } = await supabase
            .from('reviews')
            .select('rating')
            .eq('worker_id', worker.worker_id);
          
          let averageRating = worker.average_rating || 0;
          let totalReviews = worker.total_jobs || 0;
          
          // If we have review data, calculate real statistics
          if (reviewStats && reviewStats.length > 0 && !reviewError) {
            const ratings = reviewStats.map(r => r.rating);
            const sum = ratings.reduce((acc, rating) => acc + rating, 0);
            averageRating = Number((sum / ratings.length).toFixed(1));
            totalReviews = ratings.length;
          }
          
          return {
            ...worker,
            average_rating: averageRating,
            total_reviews: totalReviews,
            total_jobs: worker.total_jobs || totalReviews
          };
        } catch (error) {
          return {
            ...worker,
            total_reviews: worker.total_jobs || 0
          };
        }
      }));
      
      return {
        ...service,
        workers: workersWithReviews
      };
    }));

    // Transform services to the expected format
    const transformedServices = transformServices(servicesWithWorkers || []);
    
    return { data: transformedServices, error: null };
  } catch (err) {
    return { data: [], error: err };
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
    name: t('search.all'),
    description: t('service.all_categories') || 'All Categories',
    icon: null
  };
  
  const transformedCategories = [allCategory, ...categories.map(category => {
    // Build full Supabase Storage URL for icon if it exists
    let iconUrl = null;
    if (category.icon_url) {
      // Check if icon is already a full URL
      if (category.icon_url.startsWith('http://') || category.icon_url.startsWith('https://')) {
        // Only use it if it's from our Supabase storage
        if (category.icon_url.includes('supabase.co')) {
          iconUrl = category.icon_url;
        }
      } else {
        // It's a filename - check if it has an extension
        let filename = category.icon_url;
        if (!filename.includes('.')) {
          // No extension - try common ones
          filename = `${filename}.svg`; // Default to .svg
        }
        
        // Get public URL from Supabase Storage for filename
        const { data } = supabase.storage
          .from('categories_icons')
          .getPublicUrl(filename);
        iconUrl = data?.publicUrl || null;
      }
    }
    
    return {
      id: category.id,
      name: category.name,
      description: category.description || '',
      icon: iconUrl
    };
  })];
  
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
  
  const transformedServices = [];
  
  try {
    services.forEach((service, serviceIndex) => {
      if (!transformedServices || !Array.isArray(transformedServices)) {
        return;
      }
    // Build full Supabase Storage URL for service icon
    let serviceIconUrl = null;
    
    if (service.icon) {
      // Check if icon is already a full URL
      if (service.icon.startsWith('http://') || service.icon.startsWith('https://')) {
        // Only use it if it's from our Supabase storage
        if (service.icon.includes('supabase.co')) {
          serviceIconUrl = service.icon;
        }
      } else {
        // It's a filename - check if it has an extension
        let filename = service.icon;
        if (!filename.includes('.')) {
          // No extension - try common image extensions
          filename = `${filename}.png`; // Default to .png for service images
        }
        
        // Get public URL from Supabase Storage - service_icons bucket
        const { data } = supabase.storage
          .from('service_icons')
          .getPublicUrl(filename);
        serviceIconUrl = data?.publicUrl || null;
      }
    }
    
    // Fallback to default image if no icon from storage
    const fallbackImage = getImageForService(service.name);
    const finalImage = serviceIconUrl || fallbackImage;
    
    if (service.workers && Array.isArray(service.workers) && service.workers.length > 0) {
      service.workers.forEach((worker, workerIndex) => {
        // Include ALL workers (with and without reviews)
        const workerDisplayName = worker.worker_full_name || 
                                 `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || 
                                 `${service.name} Expert`;
        
        worker.display_name = workerDisplayName;
        
        // Calculate worker rank badge based on criteria
        let rankBadge = '';
        if (worker.total_reviews > 0) {
          if (worker.average_rating >= 4.5) rankBadge = '⭐ Top Rated';
          else if (worker.average_rating >= 4.0) rankBadge = '👍 Highly Rated';
          else if (worker.average_rating >= 3.5) rankBadge = '✅ Good Rating';
        } else {
          if (worker.is_available) {
            if ((worker.experience_years || 0) >= 5) rankBadge = '🏆 Experienced';
            else if ((worker.total_jobs || 0) >= 10) rankBadge = '💼 Active Worker';
            else rankBadge = '🆕 New Worker';
          } else {
            rankBadge = '⏸️ Unavailable';
          }
        }
        
        transformedServices.push({
          id: `${service.id}-${worker.worker_id}-${serviceIndex}-${workerIndex}`, // Add indices for uniqueness
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
          rating: worker.average_rating || 0,
          numReviews: worker.total_reviews || 0,
          date: service.created_at,
          categoryId: service.category_id,
          category: service.service_categories,
          worker: worker,
          hasWorker: true,
          rankBadge: rankBadge,
          experienceYears: worker.experience_years || 0,
          totalJobs: worker.total_jobs || 0,
          isAvailable: worker.is_available || false
        });
      });
    }
  });
  
  } catch (error) {
    // Silent error handling
  }
  
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
    const { data: workers, error } = await supabase
      .rpc('get_service_workers', {
        service_id_param: serviceId
      });
    
    if (error) {
      return { data: null, error };
    }
    
    // For each worker, get their review statistics
    const workersWithReviews = await Promise.all((workers || []).map(async (worker) => {
      try {
        // Get review statistics for this worker
        const { data: reviewStats, error: reviewError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('worker_id', worker.worker_id);
        
        let averageRating = worker.average_rating || 0;
        let totalReviews = worker.total_jobs || 0;
        
        // If we have review data, calculate real statistics
        if (reviewStats && reviewStats.length > 0 && !reviewError) {
          const ratings = reviewStats.map(r => r.rating);
          const sum = ratings.reduce((acc, rating) => acc + rating, 0);
          averageRating = Number((sum / ratings.length).toFixed(1));
          totalReviews = ratings.length;
        }
        
        return {
          ...worker,
          average_rating: averageRating,
          total_reviews: totalReviews,
          total_jobs: worker.total_jobs || 0
        };
      } catch (error) {
        return {
          ...worker,
          total_reviews: worker.total_jobs || 0
        };
      }
    }));
    
    return { data: workersWithReviews, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};