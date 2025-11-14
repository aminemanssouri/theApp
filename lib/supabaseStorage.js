import { supabase } from './supabase';

// Supabase Storage configuration
const STORAGE_BUCKET = 'app-assets';

/**
 * Get public URL for an asset from Supabase Storage
 * @param {string} path - Path to the asset (e.g., 'icons/home.png')
 * @returns {string} - Public URL
 */
export const getAssetUrl = (path) => {
  if (!path) return null;
  
  // If already a full URL, return as-is
  if (path.startsWith('http')) return path;
  
  // Get public URL from Supabase Storage
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

/**
 * Upload a file to Supabase Storage
 * @param {string} filePath - Local file path or blob
 * @param {string} storagePath - Path in storage bucket
 * @returns {Promise<{url: string, error: any}>}
 */
export const uploadAsset = async (file, storagePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        upsert: true,
      });

    if (error) throw error;

    const url = getAssetUrl(storagePath);
    return { url, error: null };
  } catch (error) {
    console.error('Upload error:', error);
    return { url: null, error };
  }
};

/**
 * Delete a file from Supabase Storage
 * @param {string} storagePath - Path in storage bucket
 * @returns {Promise<{success: boolean, error: any}>}
 */
export const deleteAsset = async (storagePath) => {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error };
  }
};
