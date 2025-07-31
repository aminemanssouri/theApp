import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert, RefreshControl } from 'react-native';
import React, { useState } from 'react';
import { COLORS, icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import NotificationCard from '../components/NotificationCard';
import { sendTestNotification } from '../lib/services/notification';

const Notifications = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    refreshing, 
    markAsRead, 
    markAllAsRead, 
    deleteNotif, 
    deleteAll, 
    refreshNotifications 
  } = useNotifications();

  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handleNotificationPress = async (notification) => {
    if (isSelectionMode) {
      toggleNotificationSelection(notification.id);
      return;
    }

    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Handle navigation based on notification type and data
    handleNotificationAction(notification);
  };

  const handleNotificationAction = (notification) => {
    const { type, data } = notification;
    
    switch (type) {
      case 'message':
        if (data?.senderId) {
          navigation.navigate('Chat', { userId: data.senderId });
        }
        break;
      case 'booking':
        if (data?.bookingId) {
          navigation.navigate('BookingDetails', { bookingId: data.bookingId });
        }
        break;
      case 'payment':
        if (data?.paymentId) {
          navigation.navigate('PaymentMethod', { paymentId: data.paymentId });
        }
        break;
      case 'promo':
        if (data?.promoId) {
          navigation.navigate('PopularServices');
        }
        break;
      default:
        // Default action or no action
        break;
    }
  };

  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedNotifications(new Set());
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedNotifications.size === 0) return;
    
    try {
      for (const notificationId of selectedNotifications) {
        await markAsRead(notificationId);
      }
      setSelectedNotifications(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.size === 0) return;
    
    Alert.alert(
      'Delete Notifications',
      `Are you sure you want to delete ${selectedNotifications.size} notification${selectedNotifications.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const notificationId of selectedNotifications) {
                await deleteNotif(notificationId);
              }
              setSelectedNotifications(new Set());
              setIsSelectionMode(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete notifications');
            }
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
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

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleTestNotification = async (type) => {
    if (!user?.id) return;
    
    try {
      await sendTestNotification(user.id, type);
      Alert.alert('Success', `Test ${type} notification sent!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
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
          <TouchableOpacity onPress={toggleSelectionMode} style={styles.headerActionButton}>
            <Text style={[styles.headerAction, {
              color: dark ? COLORS.white : COLORS.primary
            }]}>
              {isSelectionMode ? 'Cancel' : 'Select'}
            </Text>
          </TouchableOpacity>
                     <TouchableOpacity 
             onPress={() => handleTestNotification('message')} 
             style={styles.headerActionButton}
           >
             <Text style={[styles.headerAction, {
               color: dark ? COLORS.white : COLORS.success
             }]}>
               Test
             </Text>
           </TouchableOpacity>


        </View>
      </View>
    )
  };

  const renderSelectionActions = () => {
    if (!isSelectionMode) return null;

    return (
      <View style={[styles.selectionActions, {
        backgroundColor: dark ? COLORS.dark2 : COLORS.white
      }]}>
        <TouchableOpacity 
          style={styles.selectionButton}
          onPress={handleMarkSelectedAsRead}
          disabled={selectedNotifications.size === 0}
        >
          <Text style={[styles.selectionButtonText, {
            color: selectedNotifications.size === 0 ? COLORS.gray3 : COLORS.primary
          }]}>
            Mark Read ({selectedNotifications.size})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.selectionButton}
          onPress={handleDeleteSelected}
          disabled={selectedNotifications.size === 0}
        >
          <Text style={[styles.selectionButtonText, {
            color: selectedNotifications.size === 0 ? COLORS.gray3 : COLORS.error
          }]}>
            Delete ({selectedNotifications.size})
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderNotificationItem = ({ item }) => (
    <NotificationCard
      notification={item}
      isSelected={selectedNotifications.has(item.id)}
      isSelectionMode={isSelectionMode}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => {
        if (!isSelectionMode) {
          setIsSelectionMode(true);
          setSelectedNotifications(new Set([item.id]));
        }
      }}
    />
  );

  const renderEmptyState = () => (
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

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        {renderSelectionActions()}
        
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
           {!isSelectionMode && unreadCount > 0 && (
             <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerActionButton}>
               <Text style={styles.markAllRead}>Mark All Read</Text>
             </TouchableOpacity>
           )}
           <TouchableOpacity onPress={handleClearAll} style={styles.headerActionButton}>
             <Text style={styles.clearAll}>Clear All</Text>
           </TouchableOpacity>
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
    marginLeft: 12
  },
  selectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  selectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  selectionButtonText: {
    fontSize: 14,
    fontFamily: "medium"
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
   },
   

})

export default Notifications