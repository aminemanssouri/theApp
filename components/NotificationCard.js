import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import React from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { getTimeAgo } from '../utils/date';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../context/LanguageContext';

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

  const localizeAction = (code) => {
    if (!code) return '';
    const key = `notifications.actions.${code}`;
    const localized = t(key);
    // If t() falls back to the key path string, use prettified code instead
    if (typeof localized === 'string' && localized.startsWith('notifications.actions.')) {
      return code.replace(/_/g, ' ');
    }
    return localized;
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

  const getLocalizedTitle = () => {
    switch (type) {
      case 'message':
        return t('notifications.generic_titles.message');
      case 'booking':
        return t('notifications.generic_titles.booking');
      case 'payment':
        return t('notifications.generic_titles.payment');
      case 'promo':
        return t('notifications.generic_titles.promo');
      case 'system':
        return t('notifications.generic_titles.system');
      case 'reminder':
        return t('notifications.generic_titles.reminder');
      default:
        return title;
    }
  };

  const getLocalizedMessage = () => {
    const name = getSenderName();
    switch (type) {
      case 'message':
        return t('notifications.generic_messages.message', { name: name || t('chat.service_provider') });
      case 'booking':
        return t('notifications.generic_messages.booking');
      case 'payment':
        return t('notifications.generic_messages.payment');
      case 'promo':
        return t('notifications.generic_messages.promo');
      case 'system':
        return t('notifications.generic_messages.system');
      case 'reminder':
        return t('notifications.generic_messages.reminder');
      default:
        return message;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: dark ? COLORS.dark2 : COLORS.white,
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
              {getLocalizedTitle()}
            </Text>
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
            {getLocalizedMessage()}
          </Text>
          
          {data?.action && (
            <Text style={[
              styles.actionHint,
              { color: dark ? COLORS.primary : COLORS.primary }
            ]}>
              {t('notifications.tap_to_action', { action: localizeAction(data.action) })}
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
    minHeight: 80,
    backgroundColor: 'transparent'
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
    borderColor: COLORS.white,
    zIndex: 1
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
    justifyContent: 'center',
    paddingLeft: 8
  },
  date: {
    fontSize: 11,
    fontFamily: "regular",
    color: "gray"
  }
});

export default NotificationCard;