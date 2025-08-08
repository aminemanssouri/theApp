import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUser, onAuthStateChange, getUserProfile } from '../lib/services/auth';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

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
  
  // Get initial session with timeout protection
  const getInitialSession = async () => {
    try {
      const sessionPromise = Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timed out')), 8000)
        )
      ]);
      
      const { data: { session } } = await sessionPromise;
      
      if (isMounted) {
        setSession(session);
        setUser(session?.user || null);
        
        // Fetch user profile if user exists
        if (session?.user?.id) {
          await fetchUserProfile(session.user.id);
        }
      }
    } catch (error) {
      console.error('Error getting initial session:', error);
      if (isMounted) {
        // Even if there's an error, we still need to stop loading
        setSession(null);
        setUser(null);
        setUserProfile(null);
      }
    } finally {
      if (isMounted) {
        setLoading(false); // Always set loading to false
      }
    }
  };

  getInitialSession();
  
  // Use a timeout as a fallback to ensure loading never stays true indefinitely
  const timeoutId = setTimeout(() => {
    if (isMounted && loading) {
      setLoading(false);
    }
  }, 10000); // 10 second maximum loading time

  // Listen for auth state changes
  const { data: { subscription } } = onAuthStateChange(async (event, session) => {
    if (isMounted) {
      setSession(session);
      setUser(session?.user || null);
      
      // Fetch user profile when auth state changes
      if (session?.user?.id) {
        await fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
      
      // Ensure loading state is updated
      setLoading(false);
    }
  });

  // Cleanup function
  return () => {
    isMounted = false;
    clearTimeout(timeoutId);
    subscription?.unsubscribe();
  };
}, []);

  const value = {
    user,
    userProfile,
    session,
    loading,
    signOut: async () => {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
    },
    refreshUserProfile: () => fetchUserProfile(user?.id)
  };

  // Debug log the auth state
  // console.log('🔐 AuthProvider state:', {
  //   hasUser: !!user,
  //   userId: user?.id,
  //   userEmail: user?.email,
  //   hasProfile: !!userProfile,
  //   hasSession: !!session,
  //   loading
  // });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
