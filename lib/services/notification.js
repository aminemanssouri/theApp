import { supabase } from '../supabase';

// Notification types aligned to DB enum `notification_type`
// DB labels: booking_created, booking_confirmed, booking_cancelled, booking_completed,
// new_message, payment_received, profile_updated, service_rating, admin_notification, system_notification
export const NOTIFICATION_TYPES = {
  MESSAGE: 'new_message',
  SERVICE_UPDATE: 'profile_updated',
  PAYMENT: 'payment_received',
  PROMO: 'admin_notification', // best fit for marketing/system-wide announcements
  SYSTEM: 'system_notification',
  BOOKING_CREATED: 'booking_created',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_COMPLETED: 'booking_completed',
  SERVICE_RATING: 'service_rating'
};

// Notification channels (matching the 'notificatic' enum type)
export const NOTIFICATION_CHANNELS = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  PUSH: 'push',
  SMS: 'sms'
};

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (userId, limit = 50, offset = 0) => {
  try {
    console.log('🔍 Fetching notifications from Supabase for user:', userId);
    
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        recipient_id,
        type,
        title,
        message,
        related_id,
        related_type,
        channel,
        is_read,
        created_at
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('📊 Supabase query result - data:', data);
    console.log('📊 Supabase query result - error:', error);

    if (error) throw error;
    
    console.log('✅ Notifications fetched successfully:', {
      count: data?.length || 0,
      userId: userId,
      sampleNotifications: data?.slice(0, 2) || []
    });
    
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadNotificationsCount = async (userId) => {
  try {
    console.log('🔍 Fetching unread count from Supabase for user:', userId);
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    console.log('📊 Unread count query result:', { count, error });

    if (error) throw error;
    
    console.log('✅ Unread count fetched successfully:', count || 0);
    return count || 0;
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true
      })
      .eq('id', notificationId)
      .eq('recipient_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true
      })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId, userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('recipient_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Delete all notifications
 */
export const deleteAllNotifications = async (userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};

/**
 * Create a new notification
 */
export const createNotification = async (notificationData) => {
  try {
    const baseRow = {
      recipient_id: notificationData.recipientId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      related_id: notificationData.relatedId || null,
      related_type: notificationData.relatedType || null,
      channel: notificationData.channel || NOTIFICATION_CHANNELS.IN_APP,
      is_read: false
    };

    // First attempt: use provided type
    let { data, error } = await supabase
      .from('notifications')
      .insert([baseRow])
      .select()
      .single();

    // If enum value invalid (22P02), retry with SYSTEM as a safe fallback
    if (error && error.code === '22P02') {
      console.warn('Notification type invalid for enum, retrying with SYSTEM. Original type:', notificationData.type);
      const fallbackRow = {
        ...baseRow,
        type: NOTIFICATION_TYPES.SYSTEM,
        message: `${baseRow.message} (original type: ${notificationData.type})`
      };
      const retry = await supabase
        .from('notifications')
        .insert([fallbackRow])
        .select()
        .single();
      if (retry.error) throw retry.error;
      return retry.data;
    }

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time notifications
 */
export const subscribeToNotifications = (userId, callback) => {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new, 'UPDATE');
      }
    )
    .subscribe();

  return channel;
};

/**
 * Send message notification
 */
export const sendMessageNotification = async (recipientId, messageData) => {
  return createNotification({
    recipientId,
    type: NOTIFICATION_TYPES.MESSAGE,
    title: 'New Message',
    message: messageData.message,
    relatedId: messageData.senderId,
    relatedType: 'user',
    channel: NOTIFICATION_CHANNELS.IN_APP
  });
};

/**
 * Send booking notification
 */
export const sendBookingNotification = async (recipientId, bookingData) => {
  // Map booking status to specific enum label
  const status = (bookingData?.status || '').toLowerCase();
  const typeByStatus = {
    created: NOTIFICATION_TYPES.BOOKING_CREATED,
    confirmed: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
    cancelled: NOTIFICATION_TYPES.BOOKING_CANCELLED,
    completed: NOTIFICATION_TYPES.BOOKING_COMPLETED,
  };
  const type = typeByStatus[status] || NOTIFICATION_TYPES.BOOKING_CREATED;

  return createNotification({
    recipientId,
    type,
    title: 'Booking Update',
    message: `Your booking #${bookingData.id} has been ${bookingData.status}`,
    relatedId: bookingData.id,
    relatedType: 'booking',
    channel: NOTIFICATION_CHANNELS.IN_APP
  });
};

/**
 * Send payment notification
 */
export const sendPaymentNotification = async (recipientId, paymentData) => {
  return createNotification({
    recipientId,
    type: NOTIFICATION_TYPES.PAYMENT,
    title: 'Payment Update',
    message: `Payment of $${paymentData.amount} has been ${paymentData.status}`,
    relatedId: paymentData.id,
    relatedType: 'payment',
    channel: NOTIFICATION_CHANNELS.IN_APP
  });
};

/**
 * Send promo notification
 */
export const sendPromoNotification = async (recipientId, promoData) => {
  return createNotification({
    recipientId,
    type: NOTIFICATION_TYPES.PROMO,
    title: 'Special Offer!',
    message: `${promoData.discount}% off on ${promoData.service}`,
    relatedId: promoData.id,
    relatedType: 'promo',
    channel: NOTIFICATION_CHANNELS.IN_APP
  });
};

/**
 * Send system notification
 */
export const sendSystemNotification = async (recipientId, systemData) => {
  return createNotification({
    recipientId,
    type: NOTIFICATION_TYPES.SYSTEM,
    title: systemData.title,
    message: systemData.message,
    relatedId: systemData.relatedId,
    relatedType: systemData.relatedType,
    channel: NOTIFICATION_CHANNELS.IN_APP
  });
};

/**
 * Send reminder notification
 */
export const sendReminderNotification = async (recipientId, reminderData) => {
  return createNotification({
    recipientId,
    type: NOTIFICATION_TYPES.REMINDER,
    title: 'Reminder',
    message: reminderData.message,
    relatedId: reminderData.id,
    relatedType: 'reminder',
    channel: NOTIFICATION_CHANNELS.IN_APP
  });
};

/**
 * Get notification settings for a user
 */
export const getNotificationSettings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || getDefaultNotificationSettings();
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return getDefaultNotificationSettings();
  }
};

/**
 * Update notification settings
 */
export const updateNotificationSettings = async (userId, settings) => {
  try {
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

/**
 * Get default notification settings
 */
export const getDefaultNotificationSettings = () => ({
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
});

/**
 * Check if notification type is enabled for user
 */
export const isNotificationTypeEnabled = async (userId, notificationType) => {
  try {
    const settings = await getNotificationSettings(userId);
    
    switch (notificationType) {
      case NOTIFICATION_TYPES.MESSAGE:
        return settings.message_notifications && settings.general_enabled;
      case NOTIFICATION_TYPES.BOOKING:
        return settings.booking_notifications && settings.general_enabled;
      case NOTIFICATION_TYPES.PAYMENT:
        return settings.payment_enabled && settings.general_enabled;
      case NOTIFICATION_TYPES.PROMO:
        return settings.promo_discount_enabled && settings.general_enabled;
      case NOTIFICATION_TYPES.SYSTEM:
        return settings.system_notifications && settings.general_enabled;
      default:
        return settings.general_enabled;
    }
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return true; // Default to enabled if error
  }
};

/**
 * Get user-specific notification statistics
 */
export const getUserNotificationStats = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId);

    if (error) throw error;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: data?.length || 0,
      unread: data?.filter(n => !n.is_read).length || 0,
      today: data?.filter(n => new Date(n.created_at) >= today).length || 0,
      thisWeek: data?.filter(n => new Date(n.created_at) >= weekAgo).length || 0,
      thisMonth: data?.filter(n => new Date(n.created_at) >= monthAgo).length || 0
    };

    return stats;
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    throw error;
  }
};

/**
 * Get notifications by type for a specific user
 */
export const getUserNotificationsByType = async (userId, type, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications by type:', error);
    throw error;
  }
};

/**
 * Get recent notifications for a user (last N days)
 */
export const getRecentUserNotifications = async (userId, days = 7, limit = 20) => {
  try {
    const dateLimit = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .gte('created_at', dateLimit.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    throw error;
  }
};

/**
 * Mark multiple notifications as read
 */
export const markMultipleNotificationsAsRead = async (notificationIds, userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true
      })
      .in('id', notificationIds)
      .eq('recipient_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking multiple notifications as read:', error);
    throw error;
  }
};

/**
 * Delete multiple notifications
 */
export const deleteMultipleNotifications = async (notificationIds, userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds)
      .eq('recipient_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting multiple notifications:', error);
    throw error;
  }
};

/**
 * Get notification summary for user dashboard
 */
export const getUserNotificationSummary = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('type, is_read, created_at')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const summary = {
      total: data?.length || 0,
      unread: data?.filter(n => !n.is_read).length || 0,
      byType: {},
      recentActivity: data?.slice(0, 5) || []
    };

    // Group by type
    data?.forEach(notification => {
      if (!summary.byType[notification.type]) {
        summary.byType[notification.type] = {
          total: 0,
          unread: 0
        };
      }
      summary.byType[notification.type].total++;
      if (!notification.is_read) {
        summary.byType[notification.type].unread++;
      }
    });

    return summary;
  } catch (error) {
    console.error('Error fetching notification summary:', error);
    throw error;
  }
};

/**
 * Check if user has any unread notifications
 */
export const hasUnreadNotifications = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return (count || 0) > 0;
  } catch (error) {
    console.error('Error checking unread notifications:', error);
    throw error;
  }
};

/**
 * Get notification count by type for a user
 */
export const getNotificationCountByType = async (userId, type) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('type', type);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching notification count by type:', error);
    throw error;
  }
};

/**
 * Send welcome notification to new user
 */
export const sendWelcomeNotification = async (userId, userName) => {
  return createNotification({
    recipientId: userId,
    type: NOTIFICATION_TYPES.SYSTEM,
    title: 'Welcome to BRICOLLANO!',
    message: `Hi ${userName || 'there'}! Welcome to our service platform. We're excited to help you find the perfect service providers.`,
    relatedId: userId,
    relatedType: 'user',
    channel: NOTIFICATION_CHANNELS.IN_APP
  });
};

/**
 * Send profile completion reminder
 */
export const sendProfileCompletionReminder = async (userId, userName) => {
  return createNotification({
    recipientId: userId,
    type: NOTIFICATION_TYPES.REMINDER,
    title: 'Complete Your Profile',
    message: `Hi ${userName || 'there'}! Don't forget to complete your profile to get the best service recommendations.`,
    relatedId: userId,
    relatedType: 'user',
    channel: NOTIFICATION_CHANNELS.IN_APP
  });
};

/**
 * Send booking reminder notification
 */
export const sendBookingReminder = async (userId, bookingData) => {
  return createNotification({
    recipientId: userId,
    type: NOTIFICATION_TYPES.REMINDER,
    title: 'Upcoming Booking Reminder',
    message: `Don't forget! You have a booking scheduled for ${bookingData.service_name} on ${bookingData.booking_date}.`,
    relatedId: bookingData.id,
    relatedType: 'booking',
    channel: NOTIFICATION_CHANNELS.IN_APP
  });
};

/**
 * Send test notification (for demo purposes)
 */
export const sendTestNotification = async (userId, type = 'message') => {
  const testNotifications = {
    message: {
      title: 'Test Message',
      message: 'This is a test message notification',
      type: NOTIFICATION_TYPES.MESSAGE,
      relatedId: 'test-sender',
      relatedType: 'user'
    },
    booking: {
      title: 'Test Booking Update',
      message: 'Your booking #12345 has been confirmed',
      type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
      relatedId: '12345',
      relatedType: 'booking'
    },
    payment: {
      title: 'Test Payment',
      message: 'Payment of $50.00 has been processed',
      type: NOTIFICATION_TYPES.PAYMENT,
      relatedId: 'pay_123',
      relatedType: 'payment'
    },
    promo: {
      title: 'Test Promo',
      message: 'Get 20% off on cleaning services!',
      type: NOTIFICATION_TYPES.PROMO,
      relatedId: 'promo_123',
      relatedType: 'promo'
    },
    system: {
      title: 'Test System Message',
      message: 'Welcome to our app!',
      type: NOTIFICATION_TYPES.SYSTEM,
      relatedId: userId,
      relatedType: 'user'
    }
  };

  const notification = testNotifications[type] || testNotifications.message;
  
  return createNotification({
    recipientId: userId,
    ...notification,
    channel: NOTIFICATION_CHANNELS.IN_APP
  });
};

/**
 * Invoke Supabase Edge Function `notify-push` to send a push notification
 * This uses the server-side function you already deployed and expects:
 * { recipient_id, title, body, data }
 */
export const sendPushViaEdge = async (recipientId, { title, body, data = {} }) => {
  try {
    const { data: resp, error } = await supabase.functions.invoke('notify-push', {
      body: {
        recipient_id: recipientId,
        title,
        body,
        data
      }
    });

    if (error) throw error;
    return resp;
  } catch (err) {
    console.error('Error invoking notify-push edge function:', err);
    // Do not throw to avoid breaking UX if push fails; return null to continue app flow
    return null;
  }
};