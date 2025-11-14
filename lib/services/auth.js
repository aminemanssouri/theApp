import { supabase } from '../supabase'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'

WebBrowser.maybeCompleteAuthSession()

// ------------------------------
// Password Reset
// ------------------------------
export const sendPasswordResetEmail = async (email) => {
  try {
    // Use the correct deep link format for both development and production
    const redirectTo = 'bricollano://auth/reset-password'

    console.log('🔐 Sending password reset email to:', email);
    console.log('📧 Redirect URL:', redirectTo);

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    })

    if (error) {
      console.error('❌ Password reset error:', error);
      throw error;
    }
    
    console.log('✅ Password reset email sent successfully');
    console.log('📬 Response data:', data);
    
    return { data, error: null }
  } catch (error) {
    console.error('❌ Exception in sendPasswordResetEmail:', error.message);
    return { data: null, error }
  }
}

// ------------------------------
// Sign Up
// ------------------------------
export const signUp = async (email, password, firstName = '', lastName = '', userType = '') => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName || '',
          last_name: lastName || '',
          user_type: userType || 'client',
          email: email
        }
      }
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ------------------------------
// Sign In (email/password)
// ------------------------------
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ------------------------------
// Sign Out
// ------------------------------
export const signOut = async () => {
  try {
    await WebBrowser.dismissBrowser()
    await WebBrowser.coolDownAsync()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// ------------------------------
// Get Current User
// ------------------------------
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error) {
    return { user: null, error }
  }
}

// ------------------------------
// Sign in with Google
// ------------------------------
export const signInWithGoogle = async () => {
  try {
    // Create redirect URI based on environment
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'bricollano',
      useProxy: false // Set to false for production, true for Expo Go
    })

    console.log('Google Auth Redirect URI:', redirectUri)

    // Ask Supabase for Google login URL
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true, // Important for mobile
        queryParams: { 
          prompt: 'select_account',
          access_type: 'offline'
        }
      }
    })

    if (error) throw error
    if (!data?.url) throw new Error('No auth URL returned from Supabase')

    // Open browser for Google login
    const result = await WebBrowser.openAuthSessionAsync(
      data.url, 
      redirectUri,
      {
        showInRecents: true,
        createTask: false
      }
    )

    if (result.type === 'success' && result.url) {
      // Parse the URL to get the access token
      const url = new URL(result.url)
      const access_token = url.searchParams.get('access_token')
      const refresh_token = url.searchParams.get('refresh_token')
      
      if (access_token) {
        console.log('🔑 Setting session with tokens...')
        // Set the session manually
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token
        })
        
        if (sessionError) throw sessionError
        
        // CRITICAL: Wait for session to fully establish
        console.log('⏱️ Waiting for session to establish...')
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Verify session is ready
        const { data: { session: verifiedSession } } = await supabase.auth.getSession()
        console.log('✅ Session verified:', { hasSession: !!verifiedSession })
        
        return { data: sessionData, error: null }
      }
      
      // Fallback to getting session from URL
      const params = result.url.split('#')[1]
      if (params) {
        const searchParams = new URLSearchParams(params)
        const access_token = searchParams.get('access_token')
        const refresh_token = searchParams.get('refresh_token')
        
        if (access_token) {
          console.log('🔑 Setting session with tokens (fallback)...')
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token
          })
          
          if (sessionError) throw sessionError
          
          // CRITICAL: Wait for session to fully establish
          console.log('⏱️ Waiting for session to establish...')
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          // Verify session is ready
          const { data: { session: verifiedSession } } = await supabase.auth.getSession()
          console.log('✅ Session verified:', { hasSession: !!verifiedSession })
          
          return { data: sessionData, error: null }
        }
      }
    }

    if (result.type === 'cancel') {
      return { data: null, error: new Error('Authentication canceled by user') }
    }

    return { data: null, error: new Error('Authentication failed') }
  } catch (error) {
    console.error('Google Sign In Error:', error)
    return { data: null, error }
  }
}

// ------------------------------
// Auth State Listener
// ------------------------------
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}

// ------------------------------
// Get User Profile
// ------------------------------
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ------------------------------
// Update User Profile
// ------------------------------
export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ------------------------------
// Verify OTP for password reset
// ------------------------------
export const verifyOTP = async (email, token) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery'
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ------------------------------
// Update password
// ------------------------------
export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}