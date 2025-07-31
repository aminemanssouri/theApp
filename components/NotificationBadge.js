import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

const NotificationBadge = ({ count, size = 'small' }) => {
  if (!count || count === 0) return null;

  const badgeSize = size === 'large' ? 20 : 16;
  const fontSize = size === 'large' ? 10 : 8;

  return (
    <View style={[
      styles.badge,
      {
        width: badgeSize,
        height: badgeSize,
        borderRadius: badgeSize / 2,
        minWidth: badgeSize
      }
    ]}>
      <Text style={[
        styles.badgeText,
        { fontSize }
      ]}>
        {count > 99 ? '99+' : count.toString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -5,
    right: -5,
    zIndex: 1
  },
  badgeText: {
    color: COLORS.white,
    fontFamily: 'bold',
    textAlign: 'center',
    lineHeight: 12
  }
});

export default NotificationBadge; 