import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert, RefreshControl } from 'react-native';
import React, { useState, useEffect } from 'react';
import { COLORS, icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import NotificationCard from '../components/NotificationCard';
import { getOrCreateConversation } from '../lib/services/chat';

const Notifications = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const { user, userProfile } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    refreshing, 
    userNotificationStats,
    markAsRead, 
    markAllAsRead, 
    deleteAll,
    refreshNotifications
  } = useNotifications();

  // Log recent notifications (first 5)
  console.log('📋 Recent Notifications (first 5):', notifications.slice(0, 5).map(notification => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.is_read,
    createdAt: notification.created_at,
    relatedId: notification.related_id,
    relatedType: notification.related_type,
    channel: notification.channel,
    // Add detailed logging for debugging
    typeType: typeof notification.type,
    typeValue: notification.type,
    isNewMessageType: notification.type === 'new_message',
    relatedTypeType: typeof notification.related_type,
    relatedTypeValue: notification.related_type,
    isUserRelatedType: notification.related_type === 'user'
  })));

  // Check if user is authenticated
  const isUserAuthenticated = () => {
    return user && user.id;
  };

  // Handle notification press with user context
  const handleNotificationPress = async (notification) => {
    console.log('🔔 NOTIFICATION CLICKED - Full notification data:', notification);
    
    if (!isUserAuthenticated()) {
      Alert.alert('Authentication Required', 'Please log in to view notifications');
      navigation.navigate('Login');
      return;
    }

    console.log('✅ User is authenticated, proceeding with notification action');
    console.log('📊 Notification details:', {
      id: notification.id,
      type: notification.type,
      related_id: notification.related_id,
      related_type: notification.related_type,
      title: notification.title,
      message: notification.message
    });

    if (!notification.is_read) {
      console.log('📖 Marking notification as read...');
      await markAsRead(notification.id);
      console.log('✅ Notification marked as read');
    }

    // Handle navigation based on notification type and data
    console.log('🧭 Starting notification action handling...');
    await handleNotificationAction(notification);
  };

  const handleNotificationAction = async (notification) => {
    const { type, related_id, related_type, title, message } = notification;
    
    console.log('🔔 Handling notification action:', {
      type,
      related_id,
      related_type,
      title,
      message
    });
    
    console.log('🔍 Checking type:', type);
    console.log('🔍 type type:', typeof type);
    console.log('🔍 type === "new_message":', type === 'new_message');
    console.log('🔍 related_type:', related_type);
    console.log('🔍 related_id:', related_id);
    console.log('🔍 Current user ID:', user?.id);
    
    switch (type) {
      case 'new_message':
        console.log('✅ Matched type: new_message - proceeding to chat');
        console.log('🔍 Checking conditions: related_id exists?', !!related_id, 'related_type === "user"?', related_type === 'user');
        
        if (related_id && related_type === 'user') {
          try {
            console.log('💬 Getting or creating conversation between users:', user.id, related_id);
            const conversationId = await getOrCreateConversation(user.id, related_id);
            console.log('✅ Conversation ID:', conversationId);
            
            if (conversationId) {
              console.log('🧭 Navigating to Chat screen with conversationId:', conversationId);
              navigation.navigate('Chat', { 
                conversationId: conversationId,
                notificationData: {
                  title,
                  message,
                  notificationId: notification.id
                }
              });
              console.log('✅ Navigation to Chat completed');
            } else {
              console.error('❌ No conversation ID returned from getOrCreateConversation');
              Alert.alert('Error', 'Unable to create conversation. Please try again.');
            }
          } catch (error) {
            console.error('❌ Error getting conversation:', error);
            Alert.alert('Error', 'Unable to open chat. Please try again.');
          }
        } else {
          console.log('⚠️ Message notification missing related_id or related_type is not "user"');
          console.log('⚠️ related_id:', related_id, 'related_type:', related_type);
          console.log('⚠️ Falling back to Inbox navigation');
          // Fallback to inbox
          navigation.navigate('Inbox');
        }
        break;
      case 'booking_created':
      case 'booking_confirmed':
      case 'booking_cancelled':
      case 'booking_completed':
        console.log('✅ Matched type: booking - navigating to BookingDetails');
        if (related_id && related_type === 'booking') {
          navigation.navigate('BookingDetails', { bookingId: related_id });
        } else {
          navigation.navigate('Bookings');
        }
        break;
      case 'payment_received':
        console.log('✅ Matched type: payment - navigating to PaymentMethod');
        if (related_id && related_type === 'payment') {
          navigation.navigate('PaymentMethod', { paymentId: related_id });
        } else {
          navigation.navigate('PaymentMethods');
        }
        break;
      case 'service_rating':
        console.log('✅ Matched type: service_rating - navigating to PopularServices');
        navigation.navigate('PopularServices');
        break;
      case 'profile_updated':
        console.log('✅ Matched type: profile_updated - navigating to Profile');
        navigation.navigate('Profile');
        break;
      case 'admin_notification':
      case 'system_notification':
        console.log('✅ Matched type: system notification - no specific navigation');
        // System notifications might not need specific navigation
        break;
      default:
        console.log('⚠️ No specific action for type:', type);
        console.log('⚠️ Available type values:', ['new_message', 'booking_created', 'booking_confirmed', 'booking_cancelled', 'booking_completed', 'payment_received', 'service_rating', 'profile_updated', 'admin_notification', 'system_notification']);
        // Default action or no action
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!isUserAuthenticated()) {
      Alert.alert('Authentication Required', 'Please log in to manage notifications');
      return;
    }

    try {
      await markAllAsRead();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleClearAll = () => {
    if (!isUserAuthenticated()) {
      Alert.alert('Authentication Required', 'Please log in to manage notifications');
      return;
    }

    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAll();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear all notifications');
            }
          }
        }
      ]
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.headerIconContainer, {
            borderColor: dark ? COLORS.dark3 : COLORS.grayscale200
          }]}>
          <Image
            source={icons.back}
            resizeMode='contain'
            style={[styles.arrowBackIcon, {
              tintColor: dark ? COLORS.white : COLORS.greyscale900
            }]}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {
          color: dark ? COLORS.white : COLORS.greyscale900
        }]}>Notifications</Text>
        <View style={styles.headerActions}>
        </View>
      </View>
    )
  };



  const renderNotificationItem = ({ item }) => (
    <NotificationCard
      notification={item}
      onPress={() => handleNotificationPress(item)}
    />
  );

  const renderEmptyState = () => {
    if (!isUserAuthenticated()) {
      return (
        <View style={styles.emptyContainer}>
          <Image
            source={icons.notification}
            style={styles.emptyIcon}
            resizeMode="contain"
          />
          <Text style={[styles.emptyTitle, {
            color: dark ? COLORS.white : COLORS.greyscale900
          }]}>Login to see notifications</Text>
          <Text style={[styles.emptySubtitle, {
            color: dark ? COLORS.gray3 : COLORS.gray3
          }]}>
            Sign in to your account to view and manage your notifications
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Image
          source={icons.notification}
          style={styles.emptyIcon}
          resizeMode="contain"
        />
        <Text style={[styles.emptyTitle, {
          color: dark ? COLORS.white : COLORS.greyscale900
        }]}>No notifications yet</Text>
        <Text style={[styles.emptySubtitle, {
          color: dark ? COLORS.gray3 : COLORS.gray3
        }]}>
          You'll see your notifications here when they arrive
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        
        <View style={styles.headerNoti}>
          <View style={styles.headerNotiLeft}>
            <Text style={[styles.notiTitle, {
              color: dark ? COLORS.white : COLORS.greyscale900
            }]}>Recent</Text>
            {unreadCount > 0 && (
              <View style={styles.headerNotiView}>
                <Text style={styles.headerNotiTitle}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerActions}>
            {unreadCount > 0 && isUserAuthenticated() && (
              <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerActionButton}>
                <Text style={styles.markAllRead}>Mark All Read</Text>
              </TouchableOpacity>
            )}
            {isUserAuthenticated() && (
              <TouchableOpacity onPress={handleClearAll} style={styles.headerActionButton}>
                <Text style={styles.clearAll}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderNotificationItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshNotifications}
              tintColor={dark ? COLORS.white : COLORS.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={notifications.length === 0 ? styles.emptyListContainer : null}
        />
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginBottom: 16
  },
  headerIconContainer: {
    height: 46,
    width: 46,
    borderWidth: 1,
    borderColor: COLORS.grayscale200,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999
  },
  arrowBackIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.black
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "bold",
    color: COLORS.black
  },
  headerAction: {
    fontSize: 14,
    fontFamily: "medium",
    color: COLORS.primary
  },
  headerActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.secondaryWhite,
    marginLeft: 8
  },

  headerNoti: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12
  },
  headerNotiLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  notiTitle: {
    fontSize: 16,
    fontFamily: "bold",
    color: COLORS.black
  },
  headerNotiView: {
    height: 16,
    width: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4
  },
  headerNotiTitle: {
    fontSize: 10,
    fontFamily: "bold",
    color: COLORS.white
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerActionButton: {
    marginLeft: 12
  },
  markAllRead: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: "medium"
  },
  clearAll: {
    fontSize: 14,
    color: COLORS.error,
    fontFamily: "medium"
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyIcon: {
    width: 80,
    height: 80,
    tintColor: COLORS.gray3,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "bold",
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "regular",
    textAlign: 'center',
    paddingHorizontal: 32
  }
})

export default Notifications