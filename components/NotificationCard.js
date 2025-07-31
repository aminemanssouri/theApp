import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import React from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { getTimeAgo } from '../utils/date';
import { useTheme } from '../theme/ThemeProvider';

const NotificationCard = ({ 
  notification, 
  isSelected, 
  isSelectionMode, 
  onPress, 
  onLongPress 
}) => {
  const { dark } = useTheme();
  const { title, message, type, is_read, created_at, sender, data } = notification;

  const getNotificationIcon = () => {
    switch (type) {
      case 'message':
        return icons.chat;
      case 'booking':
        return icons.document2;
      case 'payment':
        return icons.creditCard;
      case 'promo':
        return icons.discount;
      case 'system':
        return icons.infoCircle;
      case 'reminder':
        return icons.clockTime;
      default:
        return icons.notification;
    }
  };

  const getNotificationColor = () => {
    switch (type) {
      case 'message':
        return COLORS.primary;
      case 'booking':
        return COLORS.success;
      case 'payment':
        return COLORS.warning;
      case 'promo':
        return COLORS.error;
      case 'system':
        return COLORS.info;
      case 'reminder':
        return COLORS.secondary;
      default:
        return COLORS.primary;
    }
  };

  const getSenderName = () => {
    if (sender) {
      return sender.display_name || `${sender.first_name} ${sender.last_name}`;
    }
    return null;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: !is_read 
            ? (dark ? COLORS.primary + '10' : COLORS.primary + '05') 
            : (dark ? COLORS.dark2 : COLORS.white),
          borderColor: isSelected ? COLORS.primary : (!is_read ? COLORS.primary + '20' : 'transparent'),
          borderWidth: isSelected ? 2 : (!is_read ? 1 : 0),
          opacity: is_read ? 0.8 : 1
        }
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {isSelectionMode && (
        <View style={[
          styles.selectionIndicator,
          {
            backgroundColor: isSelected ? COLORS.primary : 'transparent',
            borderColor: isSelected ? COLORS.primary : COLORS.gray3
          }
        ]}>
          {isSelected && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
      )}
      
      <View style={styles.leftContainer}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor() }
        ]}>
          <Image
            source={getNotificationIcon()}
            resizeMode='cover'
            style={styles.icon}
          />
        </View>
        {!is_read && (
          <View style={[
            styles.leftUnreadIndicator,
            { borderColor: dark ? COLORS.dark2 : COLORS.white }
          ]} />
        )}
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={[
              styles.title,
              {
                color: dark ? COLORS.white : COLORS.greyscale900,
                fontFamily: is_read ? "regular" : "bold"
              }
            ]}>
              {title}
            </Text>
            {!is_read && (
              <View style={styles.unreadIndicator} />
            )}
          </View>
          
          {getSenderName() && (
            <Text style={[
              styles.senderName,
              { color: dark ? COLORS.primary : COLORS.primary }
            ]}>
              {getSenderName()}
            </Text>
          )}
          
          <Text style={[
            styles.message,
            { color: dark ? COLORS.gray3 : COLORS.gray3 }
          ]}>
            {message}
          </Text>
          
          {data?.action && (
            <Text style={[
              styles.actionHint,
              { color: dark ? COLORS.primary : COLORS.primary }
            ]}>
              Tap to {data.action.replace('_', ' ')}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.rightContainer}>
        <Text style={[
          styles.date,
          { color: dark ? COLORS.gray3 : COLORS.gray3 }
        ]}>
          {getTimeAgo(created_at)}
        </Text>
        
        {type === 'message' && !is_read && (
          <View style={styles.messageIndicator} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 80
  },
  selectionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: 'bold'
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  iconContainer: {
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    marginRight: 12
  },
  icon: {
    width: 22,
    height: 22,
    tintColor: COLORS.white
  },
  leftUnreadIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2
  },
  contentContainer: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  title: {
    fontSize: 14,
    fontFamily: "medium",
    color: COLORS.black,
    flex: 1
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2
  },
  senderName: {
    fontSize: 12,
    fontFamily: "medium",
    marginBottom: 2
  },
  message: {
    fontSize: 13,
    fontFamily: "regular",
    color: "gray",
    marginBottom: 4
  },
  actionHint: {
    fontSize: 11,
    fontFamily: "medium",
    fontStyle: 'italic'
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingLeft: 8
  },
  date: {
    fontSize: 11,
    fontFamily: "regular",
    color: "gray",
    marginBottom: 4
  },
  messageIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary
  }
});

export default NotificationCard;