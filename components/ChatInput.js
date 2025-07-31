import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Keyboard,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useTheme } from '../theme/ThemeProvider';

const { width: screenWidth } = Dimensions.get('window');

const ChatInput = ({ 
  onSend, 
  onAttachment, 
  onTyping,
  placeholder = "Type a message...",
  maxLength = 1000,
  disabled = false,
  showAttachment = true,
  showSendButton = true,
  multiline = true,
  autoFocus = false,
  value = '',
  onChangeText
}) => {
  const { dark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);
  
  // Animations
  const inputScale = useRef(new Animated.Value(1)).current;
  const sendButtonScale = useRef(new Animated.Value(0.8)).current;
  const containerHeight = useRef(new Animated.Value(60)).current;
  const borderOpacity = useRef(new Animated.Value(0.3)).current;

  const hasText = value.trim().length > 0;
  const isNearLimit = value.length > maxLength * 0.8;

  // Animate send button based on text presence
  useEffect(() => {
    Animated.spring(sendButtonScale, {
      toValue: hasText ? 1 : 0.8,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [hasText]);

  // Animate container height based on focus
  useEffect(() => {
    Animated.timing(containerHeight, {
      toValue: isFocused ? 70 : 60,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  // Animate border opacity based on focus
  useEffect(() => {
    Animated.timing(borderOpacity, {
      toValue: isFocused ? 1 : 0.3,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const handleTextChange = (newText) => {
    if (onChangeText) {
      onChangeText(newText);
    }
    
    // Trigger typing indicator
    if (onTyping && newText.length > 0) {
      setIsTyping(true);
      onTyping(true);
      
      // Clear typing indicator after 2 seconds of no typing
      setTimeout(() => {
        setIsTyping(false);
        onTyping(false);
      }, 2000);
    }
  };

  const handleSend = () => {
    if (!hasText || disabled) return;
    
    // Animate input scale
    Animated.sequence([
      Animated.timing(inputScale, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(inputScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onSend(value.trim());
    
    // Clear typing indicator
    if (onTyping) {
      setIsTyping(false);
      onTyping(false);
    }
  };

  const handleAttachment = () => {
    if (onAttachment) {
      onAttachment();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const getCharCountColor = () => {
    if (value.length > maxLength) return COLORS.error;
    if (isNearLimit) return COLORS.warning;
    return dark ? COLORS.grayscale400 : COLORS.grayscale600;
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: dark ? COLORS.dark2 : COLORS.white,
        borderTopColor: dark ? COLORS.dark3 : COLORS.grayscale200 
      }
    ]}>
      <Animated.View style={[
        styles.inputContainer,
        { 
          height: containerHeight,
          borderColor: dark ? COLORS.dark3 : COLORS.grayscale300,
          backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale50,
        }
      ]}>
        <View style={styles.inputWrapper}>
          {/* Attachment Button */}
          {showAttachment && (
            <TouchableOpacity 
              style={[
                styles.attachButton, 
                { backgroundColor: dark ? COLORS.dark4 : COLORS.grayscale100 }
              ]} 
              onPress={handleAttachment} 
              disabled={disabled} 
              activeOpacity={0.7}
            >
              <Ionicons 
                name="add" 
                size={20} 
                color={dark ? COLORS.white : COLORS.black} 
              />
            </TouchableOpacity>
          )}

          {/* Text Input */}
          <Animated.View style={[
            styles.textInputWrapper,
            { 
              transform: [{ scale: inputScale }],
              backgroundColor: dark ? COLORS.dark4 : COLORS.white,
              borderColor: isFocused ? COLORS.primary : 'transparent',
            }
          ]}>
            <TextInput
              ref={inputRef}
              style={[
                styles.textInput, 
                { color: dark ? COLORS.white : COLORS.black }
              ]}
              value={value}
              onChangeText={handleTextChange}
              placeholder={placeholder}
              placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale500}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline={multiline}
              maxLength={maxLength}
              onFocus={handleFocus}
              onBlur={handleBlur}
              editable={!disabled}
              autoFocus={autoFocus}
              textAlignVertical="top"
              scrollEnabled={multiline}
            />
            
            {/* Character Count */}
            {value.length > 0 && (
              <Text style={[
                styles.charCount, 
                { color: getCharCountColor() }
              ]}>
                {value.length}/{maxLength}
              </Text>
            )}
          </Animated.View>

          {/* Send Button */}
          {showSendButton && (
            <Animated.View style={{ 
              transform: [{ scale: sendButtonScale }],
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <TouchableOpacity 
                style={[
                  styles.sendButton, 
                  { 
                    backgroundColor: hasText && !disabled 
                      ? COLORS.primary 
                      : COLORS.primary,
                    opacity: disabled ? 0.5 : 1
                  }
                ]} 
                onPress={handleSend} 
                disabled={!hasText || disabled}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="send" 
                  size={24} 
                  color={COLORS.white}
                />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </Animated.View>
      
      {/* Typing Indicator */}
      {isTyping && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingDots}>
            <View style={[styles.dot, { backgroundColor: dark ? COLORS.grayscale400 : COLORS.grayscale600 }]} />
            <View style={[styles.dot, { backgroundColor: dark ? COLORS.grayscale400 : COLORS.grayscale600 }]} />
            <View style={[styles.dot, { backgroundColor: dark ? COLORS.grayscale400 : COLORS.grayscale600 }]} />
          </View>
          <Text style={[styles.typingText, { color: dark ? COLORS.grayscale400 : COLORS.grayscale600 }]}>
            Typing...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  inputContainer: {
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: '100%',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  textInputWrapper: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    minHeight: 44,
    maxHeight: 120,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 20,
    flex: 1,
    minHeight: 20,
    padding: 0,
    margin: 0,
  },
  charCount: {
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
    opacity: 0.7,
  },
  sendButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'center',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 16,
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
    opacity: 0.6,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
  },
});

export default ChatInput; 