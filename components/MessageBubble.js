import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useTheme } from '../theme/ThemeProvider';

const { width: screenWidth } = Dimensions.get('window');

const MessageBubble = ({ 
  message, 
  isMe, 
  showAvatar = true, 
  showTime = true, 
  showStatus = true,
  isLastInGroup = false,
  isFirstInGroup = false,
  timestamp,
  status = 'sent' // 'sent', 'delivered', 'read', 'pending', 'error'
}) => {
  const { dark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Ionicons name="time-outline" size={6} color="rgba(255,255,255,0.3)" />;
      case 'sent':
        return <Ionicons name="checkmark" size={6} color="rgba(255,255,255,0.3)" />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={6} color="rgba(255,255,255,0.3)" />;
      case 'read':
        return <Ionicons name="checkmark-done" size={6} color={COLORS.success} />;
      case 'error':
        return <Ionicons name="alert-circle" size={6} color={COLORS.error} />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={[
        styles.bubbleContainer,
        isMe ? styles.myBubbleContainer : styles.otherBubbleContainer,
        isLastInGroup && (isMe ? styles.myLastBubble : styles.otherLastBubble),
        isFirstInGroup && (isMe ? styles.myFirstBubble : styles.otherFirstBubble),
      ]}>
        <View style={[
          styles.messageBubble,
          isMe 
            ? [styles.myBubble, { backgroundColor: COLORS.primary }]
            : [styles.otherBubble, { 
                backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                borderColor: dark ? COLORS.dark3 : COLORS.grayscale200
              }],
          isLastInGroup && (isMe ? styles.myLastBubbleStyle : styles.otherLastBubbleStyle),
          isFirstInGroup && (isMe ? styles.myFirstBubbleStyle : styles.otherFirstBubbleStyle),
        ]}>
          <Text style={[
            styles.messageText,
            { color: isMe ? COLORS.white : dark ? COLORS.white : COLORS.black }
          ]}>
            {message}
          </Text>
          
          {(showTime || showStatus) && (
            <View style={styles.messageFooter}>
              {showTime && (
                <Text style={[
                  styles.timeText,
                  { color: isMe ? 'rgba(255,255,255,0.5)' : dark ? COLORS.grayscale400 : COLORS.grayscale600 }
                ]}>
                  {formatTime(timestamp)}
                </Text>
              )}
              
              {isMe && showStatus && (
                <View style={styles.statusContainer}>
                  {getStatusIcon()}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 1,
  },
  bubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  myBubbleContainer: {
    justifyContent: 'flex-end',
  },
  otherBubbleContainer: {
    justifyContent: 'flex-start',
  },
  myLastBubble: {
    marginBottom: 4,
  },
  otherLastBubble: {
    marginBottom: 4,
  },
  myFirstBubble: {
    marginTop: 4,
  },
  otherFirstBubble: {
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: screenWidth * 0.65,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    elevation: 0.3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 0.3 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
  },
  myBubble: {
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    borderBottomLeftRadius: 2,
    borderWidth: 0.2,
  },
  myLastBubbleStyle: {
    borderBottomRightRadius: 12,
  },
  otherLastBubbleStyle: {
    borderBottomLeftRadius: 12,
  },
  myFirstBubbleStyle: {
    borderTopRightRadius: 2,
  },
  otherFirstBubbleStyle: {
    borderTopLeftRadius: 2,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'regular',
    marginBottom: 1,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 0,
  },
  timeText: {
    fontSize: 8,
    fontFamily: 'regular',
    marginRight: 1,
  },
  statusContainer: {
    marginLeft: 1,
  },
});

export default MessageBubble; 