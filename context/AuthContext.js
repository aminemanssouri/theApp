import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUser, onAuthStateChange, getUserProfile } from '../lib/services/auth';
import { registerPushTokenForUser } from '../utils/registerPushToken';
import AsyncStorage from '@react-native-async-storage/async-storage';

 
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
    
    // ALWAYS return true - skip FillYourProfile screen for all users
    console.log('✅ Profile completion check skipped - always returning true');
    return true;
    
  } catch (error) {
    console.error('💥 Profile completion check failed:', error);
    return true; // Still return true even on error
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
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

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
    
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      // Skip password recovery events - handle them separately
      if (event === 'PASSWORD_RECOVERY') {
        console.log('🔐 Password recovery event detected - handled by deep link');
        return; // Don't process this as a regular sign-in
      }
      
      if (event === 'SIGNED_IN' && session) {
        // Check if this is a password recovery session
        const isRecovery = await AsyncStorage.getItem('is_password_recovery');
        
        if (isRecovery === 'true') {
          console.log('⚠️ SIGNED_IN during password recovery - ignoring to prevent auto-login');
          return; // Don't process this sign-in
        }
        
        console.log('✅ User signed in successfully');
        
        // IMPORTANT: Wait 500ms for session to fully establish (especially for OAuth)
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('⏱️ Session establishment delay complete');
        
        const user = session.user;
        setUser(user);
        
        // Load user profile
        const profile = await getUserProfile(user.id);
        if (profile) {
          const isComplete = await checkProfileCompletion(user.id);
          setProfileComplete(isComplete);
          console.log('📊 Profile loaded. Complete:', isComplete);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        setProfileComplete(false);
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
    isPasswordRecovery, // Export password recovery state
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
    refreshUserProfile: async () => {
      console.log('🔄 Manually refreshing user profile for:', user?.id);
      if (user?.id) {
        await fetchUserProfile(user.id);
        console.log('✅ User profile refreshed');
      } else {
        console.log('⚠️ No user ID available for refresh');
      }
    },
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
