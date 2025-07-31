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
    console.log('Starting Google sign-in process...');
    
    // This creates the correct redirect URI for your app
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
      scheme: 'bricollano'
    });
    
    console.log('Redirect URI:', redirectUri);
    
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
      console.log('OAuth URL generation error:', error);
      throw error;
    }
    if (!data?.url) throw new Error('No auth URL returned');
    
    console.log('Opening browser with URL:', data.url);
    
    // Open the browser with simplified configuration
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUri
    );
    
    console.log('Browser result:', result);
    
    if (result.type === 'success') {
      console.log('Authentication successful, checking for session...');
      
      // Wait a moment for the session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.log('Session error:', sessionError);
        throw sessionError;
      }
      
      if (sessionData?.session) {
        console.log('Google sign-in successful');
        return { data: sessionData, error: null };
      } else {
        throw new Error('Failed to establish session after authentication');
      }
    } else if (result.type === 'cancel') {
      console.log('Authentication was canceled by user');
      return { data: null, error: new Error('Authentication canceled by user') };
    } else {
      console.log('Authentication failed:', result);
      return { data: null, error: new Error('Authentication failed') };
    }
  } catch (error) {
    console.log('Error signing in with Google:', error.message);
    return { data: null, error };
  }
}




// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}