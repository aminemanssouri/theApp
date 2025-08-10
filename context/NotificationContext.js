import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getUserNotifications, 
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  subscribeToNotifications,
  getNotificationSettings,
  updateNotificationSettings
} from '../lib/services/notification';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(null);
  const [userNotificationStats, setUserNotificationStats] = useState({
    total: 0,
    unread: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });

  // Check if user is authenticated
  const isUserAuthenticated = () => {
    return user && user.id;
  };

  // Calculate user-specific notification statistics
  const calculateUserStats = (notifications) => {
    if (!notifications.length) {
      setUserNotificationStats({
        total: 0,
        unread: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0
      });
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      today: notifications.filter(n => new Date(n.created_at) >= today).length,
      thisWeek: notifications.filter(n => new Date(n.created_at) >= weekAgo).length,
      thisMonth: notifications.filter(n => new Date(n.created_at) >= monthAgo).length
    };

    setUserNotificationStats(stats);
  };

  const loadNotifications = async () => {
    if (!isUserAuthenticated()) {
      console.log('🔒 User not authenticated - clearing notifications');
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    try {
      console.log('📥 Loading notifications for user:', user.id);
      setLoading(true);
      const data = await getUserNotifications(user.id);
      console.log('✅ Notifications loaded successfully:', {
        count: data?.length || 0,
        notifications: data?.slice(0, 3) || [] // Log first 3 for debugging
      });
      setNotifications(data);
      calculateUserStats(data);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!isUserAuthenticated()) {
      console.log('🔒 User not authenticated - setting unread count to 0');
      setUnreadCount(0);
      return;
    }
    
    try {
      console.log('📊 Loading unread count for user:', user.id);
      const count = await getUnreadNotificationsCount(user.id);
      console.log('✅ Unread count loaded:', count);
      setUnreadCount(count);
    } catch (error) {
      console.error('❌ Error loading unread count:', error);
      setUnreadCount(0);
    }
  };

  const loadNotificationSettings = async () => {
    if (!isUserAuthenticated()) {
      setNotificationSettings(null);
      return;
    }

    try {
      const settings = await getNotificationSettings(user.id);
      setNotificationSettings(settings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      setNotificationSettings(null);
    }
  };

  const markAsRead = async (notificationId) => {
    if (!isUserAuthenticated()) {
      throw new Error('User not authenticated');
    }
    
    try {
      console.log('🔵 Marking notification as read:', notificationId);
      console.log('📊 Current notifications count:', notifications.length);
      
      await markNotificationAsRead(notificationId, user.id);
      
      // Update notifications state with the new read status
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      
      console.log('✅ Updated notifications count:', updatedNotifications.length);
      console.log('✅ Notification marked as read successfully');
      
      setNotifications(updatedNotifications);
      
      // Calculate stats with the updated notifications
      calculateUserStats(updatedNotifications);
      
      // Reload unread count
      await loadUnreadCount();
    } catch (error) {
      console.error('❌ Error marking as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    if (!isUserAuthenticated()) {
      throw new Error('User not authenticated');
    }
    
    try {
      await markAllNotificationsAsRead(user.id);
      
      // Update all notifications to read status
      const updatedNotifications = notifications.map(n => ({ ...n, is_read: true }));
      
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      
      // Calculate stats with the updated notifications
      calculateUserStats(updatedNotifications);
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  };

  const deleteNotif = async (notificationId) => {
    if (!isUserAuthenticated()) {
      throw new Error('User not authenticated');
    }
    
    try {
      await deleteNotification(notificationId, user.id);
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);
      calculateUserStats(updatedNotifications);
      await loadUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };

  const deleteAll = async () => {
    if (!isUserAuthenticated()) {
      throw new Error('User not authenticated');
    }
    
    try {
      await deleteAllNotifications(user.id);
      setNotifications([]);
      setUnreadCount(0);
      setUserNotificationStats({
        total: 0,
        unread: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0
      });
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  };

  const refreshNotifications = async () => {
    if (!isUserAuthenticated()) {
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    try {
      console.log('🔄 Refreshing notifications...');
      await Promise.all([
        loadNotifications(), 
        loadUnreadCount(),
        loadNotificationSettings()
      ]);
      console.log('✅ Notifications refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing notifications:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const updateUserNotificationSettings = async (newSettings) => {
    if (!isUserAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const updatedSettings = await updateNotificationSettings(user.id, newSettings);
      setNotificationSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  };

  // Get user-specific notification preferences
  const getUserNotificationPreferences = () => {
    if (!notificationSettings) {
      return {
        general_enabled: true,
        sound_enabled: true,
        vibrate_enabled: false,
        special_offers_enabled: false,
        promo_discount_enabled: true,
        payment_enabled: true,
        cashback_enabled: false,
        app_updates_enabled: true,
        new_service_enabled: false,
        new_tips_enabled: true,
        message_notifications: true,
        booking_notifications: true,
        system_notifications: true
      };
    }
    return notificationSettings;
  };

  // Check if user has any notifications
  const hasNotifications = () => {
    return notifications.length > 0;
  };

  // Check if user has unread notifications
  const hasUnreadNotifications = () => {
    return unreadCount > 0;
  };

  // Get notifications by type
  const getNotificationsByType = (type) => {
    return notifications.filter(n => n.type === type);
  };

  // Get recent notifications (last 7 days)
  const getRecentNotifications = () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return notifications.filter(n => new Date(n.created_at) >= weekAgo);
  };

  useEffect(() => {
    if (isUserAuthenticated()) {
      loadNotifications();
      loadUnreadCount();
      loadNotificationSettings();
      
      // Subscribe to real-time updates
      const channel = subscribeToNotifications(user.id, (newNotification, eventType = 'INSERT') => {
        console.log('🔔 Real-time notification received:', {
          id: newNotification.id,
          type: newNotification.type,
          eventType: eventType,
          isRead: newNotification.is_read
        });
        
        setNotifications(prev => {
          // Enhanced duplicate detection - check by ID and also by content similarity
          const existingById = prev.find(n => n.id === newNotification.id);
          if (existingById) {
            console.log('🔄 Duplicate notification detected by ID, updating existing:', newNotification.id);
            // Update existing notification with new data
            const updated = prev.map(n => n.id === newNotification.id ? newNotification : n);
            calculateUserStats(updated);
            return updated;
          }
          
          // Additional check for similar notifications (same type, title, and recent timestamp)
          const similarNotification = prev.find(n => 
            n.type === newNotification.type &&
            n.title === newNotification.title &&
            Math.abs(new Date(n.created_at) - new Date(newNotification.created_at)) < 5000 // Within 5 seconds
          );
          
          if (similarNotification) {
            console.log('🔄 Similar notification detected, skipping duplicate:', newNotification.id);
            return prev;
          }
          
          console.log('✅ Adding new notification to list:', newNotification.id);
          const updated = [newNotification, ...prev];
          calculateUserStats(updated);
          return updated;
        });
        
        // Update unread count only for new unread notifications
        if (!newNotification.is_read && eventType === 'INSERT') {
          setUnreadCount(prev => prev + 1);
        } else if (newNotification.is_read && eventType === 'UPDATE') {
          // Recalculate unread count when a notification is marked as read
          loadUnreadCount();
        }
      });

      return () => {
        console.log('🔌 Unsubscribing from notifications channel');
        if (channel) {
          channel.unsubscribe();
        }
      };
    } else {
      // Clear data when user is not authenticated
      setNotifications([]);
      setUnreadCount(0);
      setNotificationSettings(null);
      setUserNotificationStats({
        total: 0,
        unread: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0
      });
    }
  }, [user?.id]);

  const value = {
    notifications,
    unreadCount,
    loading,
    refreshing,
    notificationSettings,
    userNotificationStats,
    markAsRead,
    markAllAsRead,
    deleteNotif,
    deleteAll,
    refreshNotifications,
    updateUserNotificationSettings,
    getUserNotificationPreferences,
    hasNotifications,
    hasUnreadNotifications,
    getNotificationsByType,
    getRecentNotifications,
    isUserAuthenticated
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}; 