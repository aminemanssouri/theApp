import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserFavoriteServices, getUserFavoriteWorkers } from '../lib/services/favorites';

const FavoritesContext = createContext({
  favorites: [],
  favoriteIds: new Set(),
  loading: false,
  refreshFavorites: () => {},
  addFavoriteToContext: (favorite) => {},
  removeFavoriteFromContext: (favoriteId, favoriteType) => {},
  isFavoriteInContext: (favoriteId, favoriteType) => false,
});

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load favorites from database
  const loadFavorites = async () => {
    if (!user?.id) {
      setFavorites([]);
      setFavoriteIds(new Set());
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 Loading favorites for user:', user.id);
      
      // Load both service and worker favorites
      const [serviceFavorites, workerFavorites] = await Promise.all([
        getUserFavoriteServices(user.id),
        getUserFavoriteWorkers(user.id)
      ]);
      
      const allFavorites = [];
      const allFavoriteIds = new Set();
      
      // Transform service favorites
      if (serviceFavorites && serviceFavorites.length > 0) {
        const transformedServices = serviceFavorites.map(fav => {
          const transformed = {
            id: fav.id,
            favoriteId: fav.favorite_id,
            favoriteType: 'service',
            name: fav.services?.name || 'Unknown Service',
            description: fav.services?.description || '',
            price: fav.services?.base_price || 0,
            image: fav.services?.icon || null,
            categoryId: fav.services?.service_categories?.id || '1',
            categoryName: fav.services?.service_categories?.name || 'General',
            isActive: fav.services?.is_active || false,
            createdAt: fav.created_at,
            providerName: 'Service Provider',
            rating: 0,
            numReviews: 0,
            isOnDiscount: false,
            oldPrice: null
          };
          
          // Add to ID set for quick lookup
          allFavoriteIds.add(`service_${fav.favorite_id}`);
          return transformed;
        });
        allFavorites.push(...transformedServices);
      }
      
      // Transform worker favorites
      if (workerFavorites && workerFavorites.length > 0) {
        const transformedWorkers = workerFavorites.map(fav => {
          // Handle worker-service combinations differently
          if (fav.isWorkerService && fav.serviceMetadata) {
            const transformed = {
              id: fav.id, // Use the real database ID
              favoriteId: fav.favorite_id,
              favoriteType: 'worker_service',
              name: `${fav.serviceMetadata.service_name || 'Unknown Service'} - ${fav.workers?.first_name || ''} ${fav.workers?.last_name || ''}`.trim(),
              description: fav.workers?.bio || 'Professional',
              price: fav.workers?.hourly_rate || 0,
              image: fav.workers?.Image || null,
              categoryId: '1',
              categoryName: 'Worker Service',
              isActive: fav.workers?.is_available || false,
              createdAt: fav.created_at,
              providerName: `${fav.workers?.first_name || ''} ${fav.workers?.last_name || ''}`.trim() || 'Service Provider',
              rating: fav.workers?.average_rating || 0,
              numReviews: fav.workers?.total_jobs || 0,
              isOnDiscount: false,
              oldPrice: null,
              workerId: fav.favorite_id,
              serviceId: fav.serviceMetadata.service_id
            };
            
            // Add to ID set for quick lookup
            allFavoriteIds.add(`worker_service_${fav.favorite_id}_${fav.serviceMetadata.service_id}`);
            return transformed;
          } else {
            // Regular worker favorites
            const transformed = {
              id: fav.id,
              favoriteId: fav.favorite_id,
              favoriteType: 'worker',
              name: `${fav.workers?.first_name || ''} ${fav.workers?.last_name || ''}`.trim() || 'Unknown Worker',
              description: fav.workers?.bio || 'Professional',
              price: fav.workers?.hourly_rate || 0,
              image: fav.workers?.Image || null,
              categoryId: '1',
              categoryName: 'Worker',
              isActive: fav.workers?.is_available || false,
              createdAt: fav.created_at,
              providerName: 'Service Provider',
              rating: fav.workers?.average_rating || 0,
              numReviews: fav.workers?.total_jobs || 0,
              isOnDiscount: false,
              oldPrice: null,
              workerId: fav.favorite_id
            };
            
            // Add to ID set for quick lookup
            allFavoriteIds.add(`worker_${fav.favorite_id}`);
            return transformed;
          }
        });
        allFavorites.push(...transformedWorkers);
      }
      
      // Sort by creation date (newest first)
      allFavorites.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log('✅ Loaded favorites:', allFavorites.length);
      setFavorites(allFavorites);
      setFavoriteIds(allFavoriteIds);
      
    } catch (error) {
      console.error('❌ Error loading favorites:', error);
      setFavorites([]);
      setFavoriteIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  // Refresh favorites (public method)
  const refreshFavorites = async () => {
    await loadFavorites();
  };

  // Add favorite to context (optimistic update)
  const addFavoriteToContext = (favorite) => {
    console.log('➕ Adding favorite to context:', favorite);
    
    // Create ID for quick lookup
    let lookupId;
    if (favorite.favoriteType === 'service') {
      lookupId = `service_${favorite.favoriteId}`;
    } else if (favorite.favoriteType === 'worker_service') {
      lookupId = `worker_service_${favorite.workerId}_${favorite.serviceId}`;
    } else {
      lookupId = `worker_${favorite.favoriteId}`;
    }
    
    // Add to favorites array
    setFavorites(prev => [favorite, ...prev]);
    
    // Add to ID set
    setFavoriteIds(prev => new Set([...prev, lookupId]));
  };

  // Remove favorite from context (optimistic update)
  const removeFavoriteFromContext = (favoriteId, favoriteType, workerId = null, serviceId = null) => {
    console.log('➖ Removing favorite from context:', { favoriteId, favoriteType, workerId, serviceId });
    
    // Create ID for quick lookup
    let lookupId;
    if (favoriteType === 'service') {
      lookupId = `service_${favoriteId}`;
    } else if (favoriteType === 'worker_service' && workerId && serviceId) {
      lookupId = `worker_service_${workerId}_${serviceId}`;
    } else {
      lookupId = `worker_${favoriteId}`;
    }
    
    // Remove from favorites array
    setFavorites(prev => prev.filter(fav => {
      if (favoriteType === 'service') {
        return !(fav.favoriteType === 'service' && fav.favoriteId === favoriteId);
      } else if (favoriteType === 'worker_service' && workerId && serviceId) {
        return !(fav.favoriteType === 'worker_service' && fav.workerId === workerId && fav.serviceId === serviceId);
      } else {
        return !(fav.favoriteType === 'worker' && fav.favoriteId === favoriteId);
      }
    }));
    
    // Remove from ID set
    setFavoriteIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(lookupId);
      return newSet;
    });
  };

  // Check if item is favorite (quick lookup)
  const isFavoriteInContext = (favoriteId, favoriteType, workerId = null, serviceId = null) => {
    let lookupId;
    if (favoriteType === 'service') {
      lookupId = `service_${favoriteId}`;
    } else if (favoriteType === 'worker_service' && workerId && serviceId) {
      lookupId = `worker_service_${workerId}_${serviceId}`;
    } else {
      lookupId = `worker_${favoriteId}`;
    }
    
    return favoriteIds.has(lookupId);
  };

  // Load favorites when user changes
  useEffect(() => {
    if (user?.id) {
      loadFavorites();
    } else {
      setFavorites([]);
      setFavoriteIds(new Set());
    }
  }, [user?.id]);

  const value = {
    favorites,
    favoriteIds,
    loading,
    refreshFavorites,
    addFavoriteToContext,
    removeFavoriteFromContext,
    isFavoriteInContext,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
