import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

import { getCurrentUser, onAuthStateChange } from '../lib/services/auth';

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
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      
      setSession(session);
      setUser(session?.user || null);
      
      // if (event === 'SIGNED_IN') {
      //   console.log('User signed in:', session?.user?.email);
      // } else if (event === 'SIGNED_OUT') {
      //   console.log('User signed out');
      // }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    signOut: async () => {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
  };

  // Debug log the auth state
  // console.log('🔐 AuthProvider state:', {
  //   hasUser: !!user,
  //   userId: user?.id,
  //   userEmail: user?.email,
  //   hasSession: !!session,
  //   loading
  // });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

