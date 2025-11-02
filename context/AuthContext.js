import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUser, onAuthStateChange, getUserProfile } from '../lib/services/auth';
import { registerPushTokenForUser } from '../utils/registerPushToken';
import AsyncStorage from '@react-native-async-storage/async-storage';

console.log('🚀 AuthContext module loaded');

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Profile completion check function
const checkProfileCompletion = async (userId) => {
  try {
    console.log('🔍 Checking profile completion for user:', userId);
    
    // Check if user has skipped profile setup
    const skipKey = `profile_skipped_${userId}`;
    console.log('📦 Checking AsyncStorage for key:', skipKey);
    
    const wasSkipped = await AsyncStorage.getItem(skipKey);
    console.log('📦 AsyncStorage result:', wasSkipped);
    
    if (wasSkipped === 'true') {
      console.log('✅ Profile was skipped - allowing access');
      return true;
    }
    
    console.log('🔍 Fetching profile from database...');
    
    // Use maybeSingle() with a very short timeout
    const queryPromise = supabase
      .from('users')
      .select('id, first_name, last_name, phone, email, address')
      .eq('id', userId)
      .maybeSingle();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile query timeout')), 500)
    );
    
    let profile, error;
    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);
      profile = result.data;
      error = result.error;
      console.log('📊 Database query result:', { hasProfile: !!profile, hasFirstName: !!profile?.first_name, hasPhone: !!profile?.phone });
    } catch (timeoutError) {
      console.log('⏱️ Database query timed out after 500ms - assuming incomplete');
      // On timeout, assume profile incomplete
      return false;
    }
    
    if (error) {
      console.log('❌ Profile check error:', error);
      return false;
    }
    
    if (!profile) {
      console.log('❌ No profile found for user');
      return false;
    }
    
    const hasFirstName = profile?.first_name && profile.first_name.trim().length > 0;
    const hasPhone = profile?.phone && profile.phone.trim().length > 0;
    const isComplete = !!(hasFirstName && hasPhone);
    
    console.log('✅ Profile check result:', {
      hasProfile: !!profile,
      hasFirstName,
      hasPhone,
      isComplete,
      wasSkipped: wasSkipped === 'true'
    });
    
    return isComplete;
  } catch (error) {
    console.error('💥 Profile completion check failed:', error);
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  console.log('🔵 AuthProvider component rendering');
  
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileCheckLoading, setProfileCheckLoading] = useState(true);

  // Custom setProfileComplete that persists the skip state
  const setProfileCompleteWithSkip = async (value, userId) => {
    setProfileComplete(value);
    if (value && userId) {
      // Save skip state to AsyncStorage
      const skipKey = `profile_skipped_${userId}`;
      await AsyncStorage.setItem(skipKey, 'true');
      console.log('💾 Saved profile skip state for user:', userId);
    }
  };

  // Fetch user profile data
  const fetchUserProfile = async (userId) => {
    if (!userId) {
      setUserProfile(null);
      return;
    }

    try {
      const { data, error } = await getUserProfile(userId);
      if (error) {
        console.error('Error fetching user profile:', error);
        setUserProfile(null);
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (isMounted) {
          if (session?.user) {
            console.log('👤 User found:', session.user.id);
            
            setUser(session.user);
            setSession(session);
            
            // Start profile check loading
            setProfileCheckLoading(true);
            console.log('🔄 Starting profile check in initializeAuth...');
            
            try {
              // Check if profile is complete
              const isComplete = await checkProfileCompletion(session.user.id);
              console.log('✅ Profile check result in initializeAuth:', isComplete);
              setProfileComplete(isComplete);
            } catch (profileError) {
              console.error('❌ Profile check failed in initializeAuth:', profileError);
              setProfileComplete(false);
            } finally {
              // ALWAYS set loading to false
              setProfileCheckLoading(false);
              console.log('✅ Profile check loading set to FALSE in initializeAuth');
            }
            
            await fetchUserProfile(session.user.id);
            registerPushTokenForUser(session.user.id);
            
            console.log('🎯 Auth initialized - Profile complete:', profileComplete);
          } else {
            console.log('👤 No user session found');
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setProfileComplete(false);
            setProfileCheckLoading(false);
          }
        }
      } catch (error) {
        console.error('💥 Error initializing auth:', error);
        if (isMounted) {
          setUser(null);
          setSession(null);
          setUserProfile(null);
          setProfileComplete(false);
          setProfileCheckLoading(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log('✅ Main loading set to FALSE in initializeAuth');
        }
      }
    };

    initializeAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, 'User ID:', session?.user?.id);
      
      if (isMounted) {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in:', session.user.id);
          
          // Set user and session immediately - no need to wait
          setUser(session.user);
          setSession(session);
          setProfileCheckLoading(true);
          
          console.log('🔄 Starting profile check in SIGNED_IN event...');
          
          // Start with optimistic assumption (incomplete) for fast UI
          setProfileComplete(false);
          
          try {
            // Check profile completion in background
            const isComplete = await checkProfileCompletion(session.user.id);
            console.log('✅ Profile check completed in SIGNED_IN:', isComplete);
            
            // Update if different from optimistic value
            if (isComplete !== false) {
              setProfileComplete(isComplete);
            }
            
            // Fetch additional data in background (non-blocking)
            fetchUserProfile(session.user.id).catch(err => 
              console.error('❌ Background fetchUserProfile failed:', err)
            );
            registerPushTokenForUser(session.user.id);
            
            console.log('🎯 Sign in complete - Profile complete:', isComplete);
          } catch (profileError) {
            console.error('❌ Profile check failed in SIGNED_IN:', profileError);
            setProfileComplete(false);
          } finally {
            // ALWAYS set loading to false
            setProfileCheckLoading(false);
            console.log('✅ Profile check loading set to FALSE in SIGNED_IN');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          // Clear skip state on sign out
          if (session?.user?.id) {
            const skipKey = `profile_skipped_${session.user.id}`;
            await AsyncStorage.removeItem(skipKey);
          }
          setUser(null);
          setSession(null);
          setUserProfile(null);
          setProfileComplete(false);
          setProfileCheckLoading(false);
        } else if (event === 'USER_UPDATED' && session?.user) {
          console.log('👤 User updated');
          setUser(session.user);
          setSession(session);
          
          setProfileCheckLoading(true);
          const isComplete = await checkProfileCompletion(session.user.id);
          setProfileComplete(isComplete);
          setProfileCheckLoading(false);
          
          await fetchUserProfile(session.user.id);
        }
        
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const refreshProfileStatus = async () => {
    if (user?.id) {
      console.log('🔄 Manually refreshing profile status for:', user.id);
      setProfileCheckLoading(true);
      const isComplete = await checkProfileCompletion(user.id);
      console.log('✅ Manual refresh result - Profile complete:', isComplete);
      setProfileComplete(isComplete);
      setProfileCheckLoading(false);
      return isComplete;
    }
    return false;
  };

  const value = {
    user,
    userProfile,
    session,
    loading: loading || profileCheckLoading,
    profileComplete,
    setProfileComplete,
    setProfileCompleteWithSkip, // Add this new function
    signOut: async () => {
      try {
        // Clear skip state on sign out
        if (user?.id) {
          const skipKey = `profile_skipped_${user.id}`;
          await AsyncStorage.removeItem(skipKey);
        }
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
    },
    refreshUserProfile: () => fetchUserProfile(user?.id),
    refreshProfileStatus
  };

  console.log('🔐 Auth State:', {
    hasUser: !!user,
    userId: user?.id,
    profileComplete,
    loading: loading || profileCheckLoading
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
