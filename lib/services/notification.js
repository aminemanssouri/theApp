import { supabase } from '../supabase';
import { useAuth } from '../../context/AuthContext';

// Notification types
export const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  SERVICE_UPDATE: 'service_update',
  PAYMENT: 'payment',
  PROMO: 'promo',
  SYSTEM: 'system',
  BOOKING: 'booking',
  REMINDER: 'reminder'
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
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:profiles!notifications_sender_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url,
          display_name
        )
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('Supabase query result - data:', data);
    console.log('Supabase query result - error:', error);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadNotificationsCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
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
        is_read: true,
        read_at: new Date().toISOString()
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
        is_read: true,
        read_at: new Date().toISOString()
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
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        recipient_id: notificationData.recipientId,
        sender_id: notificationData.senderId || null,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        priority: notificationData.priority || NOTIFICATION_PRIORITIES.MEDIUM,
        is_read: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

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
export const sendMessageNotification = async (recipientId, senderId, message) => {
  return createNotification({
    recipientId,
    senderId,
    type: NOTIFICATION_TYPES.MESSAGE,
    title: 'New Message',
    message: message,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    data: {
      action: 'open_chat',
      senderId
    }
  });
};

/**
 * Send booking notification
 */
export const sendBookingNotification = async (recipientId, bookingData) => {
  return createNotification({
    recipientId,
    type: NOTIFICATION_TYPES.BOOKING,
    title: 'Booking Update',
    message: `Your booking #${bookingData.id} has been ${bookingData.status}`,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    data: {
      action: 'open_booking',
      bookingId: bookingData.id
    }
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
    priority: NOTIFICATION_PRIORITIES.HIGH,
    data: {
      action: 'open_payment',
      paymentId: paymentData.id
    }
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
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    data: {
      action: 'open_promo',
      promoId: promoData.id
    }
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
    priority: NOTIFICATION_PRIORITIES.LOW,
    data: {
      action: systemData.action || 'none'
    }
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
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    data: {
      action: 'open_reminder',
      reminderId: reminderData.id
    }
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
 * Send test notification (for demo purposes)
 */
export const sendTestNotification = async (userId, type = 'message') => {
  const testNotifications = {
    message: {
      title: 'Test Message',
      message: 'This is a test message notification',
      type: NOTIFICATION_TYPES.MESSAGE,
      data: { action: 'open_chat', senderId: 'test-sender' }
    },
    booking: {
      title: 'Test Booking Update',
      message: 'Your booking #12345 has been confirmed',
      type: NOTIFICATION_TYPES.BOOKING,
      data: { action: 'open_booking', bookingId: '12345' }
    },
    payment: {
      title: 'Test Payment',
      message: 'Payment of $50.00 has been processed',
      type: NOTIFICATION_TYPES.PAYMENT,
      data: { action: 'open_payment', paymentId: 'pay_123' }
    },
    promo: {
      title: 'Test Promo',
      message: 'Get 20% off on cleaning services!',
      type: NOTIFICATION_TYPES.PROMO,
      data: { action: 'open_promo', promoId: 'promo_123' }
    },
    system: {
      title: 'Test System Message',
      message: 'Welcome to our app!',
      type: NOTIFICATION_TYPES.SYSTEM,
      data: { action: 'none' }
    }
  };

  const notification = testNotifications[type] || testNotifications.message;
  
  return createNotification({
    recipientId: userId,
    ...notification,
    priority: NOTIFICATION_PRIORITIES.MEDIUM
  });
}; 