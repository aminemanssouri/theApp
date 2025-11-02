import { supabase } from '../supabase';
import { getCurrentLanguage } from '../../context/LanguageContext';

// Local helpers to pick/apply translations
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
  const tr = pickTranslation(category?.service_category_translations, lang);
  return {
    ...category,
    name: tr?.name ?? category.name,
    description: tr?.description ?? category.description,
  };
};

const mapServiceWithTranslation = (service, lang) => {
  if (!service) return service;
  const tr = pickTranslation(service?.service_translations, lang);
  return {
    ...service,
    name: tr?.name ?? service.name,
    description: tr?.description ?? service.description,
    service_categories: mapCategoryWithTranslation(service?.service_categories, lang)
  };
};

/**
 * Get user's favorites with joined service/worker data
 */
export const getUserFavorites = async (userId, type = null) => {
  try {
    let query = supabase
      .from('favorites')
      .select(`
        id,
        favorite_type,
        favorite_id,
        created_at,
        metadata
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('favorite_type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getUserFavorites error:', error);
    throw error;
  }
};

/**
 * Get user's favorite services with service details
 */
export const getUserFavoriteServices = async (userId) => {
  try {
    // First get the favorites
    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select('id, favorite_id, created_at, metadata')
      .eq('user_id', userId)
      .eq('favorite_type', 'service')
      .order('created_at', { ascending: false });

    if (favError) {
      console.error('Error fetching favorites:', favError);
      throw favError;
    }

    if (!favorites || favorites.length === 0) {
      return [];
    }

    // Get service IDs
    const serviceIds = favorites.map(fav => fav.favorite_id);

    // Then get the services data
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        base_price,
        icon,
        is_active,
        service_translations(
          language_code,
          name,
          description
        ),
        service_categories (
          id,
          name,
          icon,
          service_category_translations(
            language_code,
            name,
            description
          )
        )
      `)
      .in('id', serviceIds);

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      throw servicesError;
    }

    // Combine the data with localized names
    const lang = getCurrentLanguage();
    const localized = (services || []).map(s => mapServiceWithTranslation(s, lang));
    const result = favorites.map(fav => ({
      ...fav,
      services: localized.find(service => service.id === fav.favorite_id) || null
    }));

    return result;
  } catch (error) {
    console.error('getUserFavoriteServices error:', error);
    throw error;
  }
};

/**
 * Get user's favorite workers with worker details
 */
export const getUserFavoriteWorkers = async (userId) => {
  try {
    // Get both worker-only and worker-service favorites
    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select('id, favorite_id, created_at, metadata, favorite_type')
      .eq('user_id', userId)
      .eq('favorite_type', 'worker')
      .order('created_at', { ascending: false });

    if (favError) {
      console.error('Error fetching favorites:', favError);
      throw favError;
    }

    if (!favorites || favorites.length === 0) {
      return [];
    }

    let allResults = [];

    // Get all unique worker IDs
    const allWorkerIds = [...new Set(favorites.map(fav => fav.favorite_id))];
    
    // Get all workers data in one query
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select(`
        id,
        first_name,
        last_name,
        bio,
        hourly_rate,
        average_rating,
        total_jobs,
        Image,
        is_available
      `)
      .in('id', allWorkerIds);

    if (workersError) {
      console.error('Error fetching workers:', workersError);
      return [];
    }

    // Process each favorite and expand worker-service combinations
    favorites.forEach(fav => {
      const worker = workers?.find(w => w.id === fav.favorite_id);
      const metadata = fav.metadata || {};
      
      if (metadata.is_worker_service) {
        if (metadata.services && Array.isArray(metadata.services)) {
          // Multiple services - create separate entries for each
          metadata.services.forEach(service => {
            allResults.push({
              ...fav,
              workers: worker,
              isWorkerService: true,
              serviceMetadata: service
            });
          });
        } else if (metadata.service_id) {
          // Single service
          allResults.push({
            ...fav,
            workers: worker,
            isWorkerService: true,
            serviceMetadata: {
              service_id: metadata.service_id,
              service_name: metadata.service_name
            }
          });
        }
      } else {
        // Regular worker favorite
        allResults.push({
          ...fav,
          workers: worker,
          isWorkerService: false
        });
      }
    });

    return allResults;
  } catch (error) {
    console.error('getUserFavoriteWorkers error:', error);
    throw error;
  }
};

/**
 * Add item to favorites
 */
export const addToFavorites = async (userId, favoriteType, favoriteId, metadata = null) => {
  try {
    console.log('🔄 addToFavorites called with:', { userId, favoriteType, favoriteId, metadata });
    
    // For worker-service combinations, we need to handle the unique constraint differently
    if (favoriteType === 'worker' && metadata?.service_id) {
      console.log('🔧 Handling worker-service combination');
      
      // Check if a worker favorite already exists
      const { data: existingWorkerFav } = await supabase
        .from('favorites')
        .select('id, metadata')
        .eq('user_id', userId)
        .eq('favorite_type', favoriteType)
        .eq('favorite_id', favoriteId)
        .maybeSingle();

      console.log('📋 Existing worker favorite:', existingWorkerFav);

      if (existingWorkerFav) {
        // Worker favorite exists, check if this service is already in metadata
        const currentMetadata = existingWorkerFav.metadata || {};
        
        if (currentMetadata.service_id === metadata.service_id) {
          console.log('⚠️ This worker-service combination already exists');
          throw new Error('Item is already in favorites');
        } else if (currentMetadata.services) {
          // Multiple services exist, check if this service is already there
          const serviceExists = currentMetadata.services.some(s => s.service_id === metadata.service_id);
          if (serviceExists) {
            console.log('⚠️ This service already exists in worker favorites');
            throw new Error('Item is already in favorites');
          }
          
          // Add this service to the existing services array
          const updatedMetadata = {
            ...currentMetadata,
            services: [
              ...currentMetadata.services,
              {
                service_id: metadata.service_id,
                service_name: metadata.service_name
              }
            ]
          };
          
          console.log('🔄 Updating existing worker favorite with new service');
          const { data: updatedData, error: updateError } = await supabase
            .from('favorites')
            .update({ metadata: updatedMetadata })
            .eq('id', existingWorkerFav.id)
            .select()
            .single();
            
          if (updateError) {
            console.error('❌ Error updating worker favorite:', updateError);
            throw updateError;
          }
          
          console.log('✅ Successfully updated worker favorite with new service');
          return updatedData;
        } else {
          // Single service exists, convert to multiple services
          const updatedMetadata = {
            services: [
              {
                service_id: currentMetadata.service_id,
                service_name: currentMetadata.service_name
              },
              {
                service_id: metadata.service_id,
                service_name: metadata.service_name
              }
            ],
            is_worker_service: true
          };
          
          console.log('🔄 Converting single service to multiple services');
          const { data: updatedData, error: updateError } = await supabase
            .from('favorites')
            .update({ metadata: updatedMetadata })
            .eq('id', existingWorkerFav.id)
            .select()
            .single();
            
          if (updateError) {
            console.error('❌ Error updating worker favorite:', updateError);
            throw updateError;
          }
          
          console.log('✅ Successfully converted to multiple services');
          return updatedData;
        }
      } else {
        // No existing worker favorite, create new one
        console.log('✅ No existing worker favorite, creating new one');
      }
    } else {
      // For simple favorites, check normally
      const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('favorite_type', favoriteType)
        .eq('favorite_id', favoriteId)
        .maybeSingle();

      console.log('📋 Existing simple favorite:', existing);

      if (existing) {
        console.log('⚠️ Simple favorite already exists');
        throw new Error('Item is already in favorites');
      }
    }

    console.log('✅ No duplicate found, inserting new favorite');

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        favorite_type: favoriteType,
        favorite_id: favoriteId,
        metadata
      })
      .select()
      .single();

    if (error) {
      // Handle the unique constraint violation specifically
      if (error.code === '23505' && error.message.includes('favorites_unique')) {
        console.log('⚠️ Caught unique constraint violation, item already exists');
        throw new Error('Item is already in favorites');
      }
      console.error('❌ Error inserting favorite:', error);
      throw error;
    }

    console.log('✅ Successfully added favorite:', data);
    return data;
  } catch (error) {
    console.error('❌ addToFavorites error:', error);
    throw error;
  }
};

/**
 * Remove item from favorites
 */
export const removeFromFavorites = async (userId, favoriteType, favoriteId) => {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('favorite_type', favoriteType)
      .eq('favorite_id', favoriteId);

    if (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('removeFromFavorites error:', error);
    throw error;
  }
};

/**
 * Remove favorite by favorite record ID
 */
export const removeFavoriteById = async (favoriteId, userId) => {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId)
      .eq('user_id', userId); // Security: ensure user owns this favorite

    if (error) {
      console.error('Error removing favorite by ID:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('removeFavoriteById error:', error);
    throw error;
  }
};

/**
 * Check if item is favorited by user
 */
export const isFavorited = async (userId, favoriteType, favoriteId) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('favorite_type', favoriteType)
      .eq('favorite_id', favoriteId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking favorite status:', error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('isFavorited error:', error);
    return false;
  }
};

/**
 * Toggle favorite status
 */
export const toggleFavorite = async (userId, favoriteType, favoriteId, metadata = null) => {
  try {
    const isCurrentlyFavorited = await isFavorited(userId, favoriteType, favoriteId);
    
    if (isCurrentlyFavorited) {
      await removeFromFavorites(userId, favoriteType, favoriteId);
      return { isFavorited: false, action: 'removed' };
    } else {
      await addToFavorites(userId, favoriteType, favoriteId, metadata);
      return { isFavorited: true, action: 'added' };
    }
  } catch (error) {
    console.error('toggleFavorite error:', error);
    throw error;
  }
};

/**
 * Check if a specific worker-service combination is favorited
 */
export const isWorkerServiceFavorited = async (userId, workerId, serviceId) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('metadata')
      .eq('user_id', userId)
      .eq('favorite_type', 'worker')
      .eq('favorite_id', workerId);

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking worker-service favorite status:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return false;
    }

    // Check if any of the worker favorites contains this service
    return data.some(favorite => {
      const metadata = favorite.metadata;
      if (!metadata) return false;
      
      // Check for single service metadata
      if (metadata.service_id === serviceId && metadata.is_worker_service) {
        return true;
      }
      
      // Check for multiple services array
      if (metadata.services && Array.isArray(metadata.services)) {
        return metadata.services.some(service => service.service_id === serviceId);
      }
      
      return false;
    });
  } catch (error) {
    console.error('isWorkerServiceFavorited error:', error);
    return false;
  }
};

/**
 * Toggle worker-service favorite
 */
export const toggleWorkerServiceFavorite = async (userId, workerId, serviceId, serviceName) => {
  try {
    // Get existing worker favorite
    const { data: existingFavorites, error: fetchError } = await supabase
      .from('favorites')
      .select('id, metadata')
      .eq('user_id', userId)
      .eq('favorite_type', 'worker')
      .eq('favorite_id', workerId);

    if (fetchError) {
      console.error('Error fetching existing worker favorites:', fetchError);
      throw fetchError;
    }

    const isCurrentlyFavorited = await isWorkerServiceFavorited(userId, workerId, serviceId);
    
    if (existingFavorites && existingFavorites.length > 0) {
      // Worker favorite exists, update metadata
      const existingFavorite = existingFavorites[0];
      const currentMetadata = existingFavorite.metadata || {};
      
      if (isCurrentlyFavorited) {
        // Remove service from metadata
        let updatedMetadata;
        
        if (currentMetadata.service_id === serviceId) {
          // Single service, remove worker-service flag
          updatedMetadata = { ...currentMetadata };
          delete updatedMetadata.service_id;
          delete updatedMetadata.service_name;
          delete updatedMetadata.is_worker_service;
          
          // If no other metadata, set to null
          if (Object.keys(updatedMetadata).length === 0) {
            updatedMetadata = null;
          }
        } else if (currentMetadata.services && Array.isArray(currentMetadata.services)) {
          // Multiple services, remove this one
          updatedMetadata = {
            ...currentMetadata,
            services: currentMetadata.services.filter(s => s.service_id !== serviceId)
          };
          
          // If no services left, clean up
          if (updatedMetadata.services.length === 0) {
            delete updatedMetadata.services;
            if (Object.keys(updatedMetadata).length === 0) {
              updatedMetadata = null;
            }
          }
        }
        
        const { error: updateError } = await supabase
          .from('favorites')
          .update({ metadata: updatedMetadata })
          .eq('id', existingFavorite.id);

        if (updateError) {
          console.error('Error updating worker favorite metadata:', updateError);
          throw updateError;
        }

        return { isFavorited: false, action: 'removed' };
      } else {
        // Add service to metadata
        let updatedMetadata;
        
        if (!currentMetadata.is_worker_service && !currentMetadata.services) {
          // First service for this worker
          updatedMetadata = {
            ...currentMetadata,
            service_id: serviceId,
            service_name: serviceName,
            is_worker_service: true
          };
        } else if (currentMetadata.service_id && !currentMetadata.services) {
          // Convert single service to multiple services
          updatedMetadata = {
            services: [
              {
                service_id: currentMetadata.service_id,
                service_name: currentMetadata.service_name
              },
              {
                service_id: serviceId,
                service_name: serviceName
              }
            ],
            is_worker_service: true
          };
        } else if (currentMetadata.services) {
          // Add to existing services array
          updatedMetadata = {
            ...currentMetadata,
            services: [
              ...currentMetadata.services,
              {
                service_id: serviceId,
                service_name: serviceName
              }
            ]
          };
        }
        
        const { error: updateError } = await supabase
          .from('favorites')
          .update({ metadata: updatedMetadata })
          .eq('id', existingFavorite.id);

        if (updateError) {
          console.error('Error updating worker favorite metadata:', updateError);
          throw updateError;
        }

        return { isFavorited: true, action: 'added' };
      }
    } else {
      // No existing worker favorite, create new one
      const { error: insertError } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          favorite_type: 'worker',
          favorite_id: workerId,
          metadata: {
            service_id: serviceId,
            service_name: serviceName,
            is_worker_service: true
          }
        });

      if (insertError) {
        console.error('Error creating new worker favorite:', insertError);
        throw insertError;
      }

      return { isFavorited: true, action: 'added' };
    }
  } catch (error) {
    console.error('toggleWorkerServiceFavorite error:', error);
    throw error;
  }
};

/**
 * Get favorites count for user
 */
export const getFavoritesCount = async (userId, type = null) => {
  try {
    let query = supabase
      .from('favorites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (type) {
      query = query.eq('favorite_type', type);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error getting favorites count:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('getFavoritesCount error:', error);
    return 0;
  }
};
