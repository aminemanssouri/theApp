import { supabase } from '../supabase'
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// Sign up function
export const signUp = async (email, password, firstName = '', lastName = '', userType = '') => {
  try {   
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          first_name: firstName || '',
          last_name: lastName || '',
          user_type: userType || 'client',
          email: email // Add email to metadata in case it's needed
        }
      }
    })

    
    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Sign in function
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Sign out function
export const signOut = async () => {
  try {
    // Clear browser state before signing out
    await WebBrowser.dismissBrowser();
    await WebBrowser.coolDownAsync();
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw error
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error }
  }
}


export const signInWithGoogle = async () => {
  try {
    // This creates the correct redirect URI for your app
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
      scheme: 'bricollano'
    });
    
    // Get the auth URL from Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        queryParams: {
          prompt: 'select_account', // This ensures account selection
        }
      }
    });
    
    if (error) {
      throw error;
    }
    if (!data?.url) throw new Error('No auth URL returned');
    
    // Open the browser with simplified configuration
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUri
    );
    
    if (result.type === 'success') {
      // Add timeout protection for session check
      const sessionPromise = Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timed out after 5 seconds')), 5000)
        )
      ]);
      
      try {
        const { data: sessionData, error: sessionError } = await sessionPromise;
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (sessionData?.session) {
          return { data: sessionData, error: null };
        } else {
          throw new Error('Failed to establish session after authentication');
        }
      } catch (sessionError) {
        return { data: null, error: sessionError };
      }
    } else if (result.type === 'cancel') {
      return { data: null, error: new Error('Authentication canceled by user') };
    } else {
      return { data: null, error: new Error('Authentication failed') };
    }
  } catch (error) {
    return { data: null, error };
  }
}




// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}

// Get user profile data from users table
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Update user profile data
export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}