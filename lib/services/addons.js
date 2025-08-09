import { supabase } from '../supabase';

/**
 * Get all addons for a specific service
 * @param {string} serviceId - The service ID to get addons for
 * @returns {Promise<Array>} Array of addon objects
 */
export const getServiceAddons = async (serviceId) => {
  try {
    const { data, error } = await supabase
      .from('service_addons')
      .select('*')
      .eq('service_id', serviceId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching service addons:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getServiceAddons:', error);
    return [];
  }
};

/**
 * Create a new service addon
 * @param {Object} addonData - The addon data
 * @returns {Promise<Object>} Created addon object
 */
export const createServiceAddon = async (addonData) => {
  try {
    const { data, error } = await supabase
      .from('service_addons')
      .insert({
        service_id: addonData.serviceId,
        name: addonData.name,
        description: addonData.description || '',
        price: addonData.price
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating service addon:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createServiceAddon:', error);
    throw error;
  }
};

/**
 * Update a service addon
 * @param {string} addonId - The addon ID to update
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} Updated addon object
 */
export const updateServiceAddon = async (addonId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('service_addons')
      .update(updateData)
      .eq('id', addonId)
      .select()
      .single();

    if (error) {
      console.error('Error updating service addon:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateServiceAddon:', error);
    throw error;
  }
};

/**
 * Delete a service addon
 * @param {string} addonId - The addon ID to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteServiceAddon = async (addonId) => {
  try {
    const { error } = await supabase
      .from('service_addons')
      .delete()
      .eq('id', addonId);

    if (error) {
      console.error('Error deleting service addon:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteServiceAddon:', error);
    return false;
  }
};
