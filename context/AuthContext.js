import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUser, onAuthStateChange, getUserProfile } from '../lib/services/auth';
import { registerPushTokenForUser } from '../utils/registerPushToken';

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
    
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, phone, email, address')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.log('❌ Profile check error:', error);
      if (error.code === 'PGRST116') {
        console.log('❌ No profile found for user');
        return false;
      }
      return false;
    }
    
    const hasFirstName = profile?.first_name && profile.first_name.trim().length > 0;
    const hasPhone = profile?.phone && profile.phone.trim().length > 0;
    const isComplete = !!(hasFirstName && hasPhone);
    
    console.log('✅ Profile check result:', {
      hasProfile: !!profile,
      hasFirstName,
      hasPhone,
      isComplete
    });
    
    return isComplete;
  } catch (error) {
    console.error('💥 Profile completion check failed:', error);
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileCheckLoading, setProfileCheckLoading] = useState(true); // Add this

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
            
            // Check if profile is complete
            const isComplete = await checkProfileCompletion(session.user.id);
            setProfileComplete(isComplete);
            
            // Profile check complete
            setProfileCheckLoading(false);
            
            await fetchUserProfile(session.user.id);
            registerPushTokenForUser(session.user.id);
            
            console.log('🎯 Auth initialized - Profile complete:', isComplete);
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
        }
      }
    };

    initializeAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (isMounted) {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in:', session.user.id);
          
          // Set loading state for profile check
          setProfileCheckLoading(true);
          
          setUser(session.user);
          setSession(session);
          
          // Check profile completion
          const isComplete = await checkProfileCompletion(session.user.id);
          setProfileComplete(isComplete);
          
          // Profile check complete
          setProfileCheckLoading(false);
          
          await fetchUserProfile(session.user.id);
          registerPushTokenForUser(session.user.id);
          
          console.log('🎯 Sign in complete - Profile complete:', isComplete);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
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
    loading: loading || profileCheckLoading, // Combined loading state
    profileComplete,
    setProfileComplete,
    signOut: async () => {
      try {
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
