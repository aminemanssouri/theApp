import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  Image, 
  Keyboard,
  Animated,
  Dimensions,
  StatusBar,
  Alert
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { getConversationMessages, sendMessage, subscribeToNewMessages } from '../lib/services/chat';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS, SIZES, icons } from '../constants';
import { Ionicons } from '@expo/vector-icons';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import defaultAvatar from '../assets/images/avatar.jpeg';
import { getSafeAreaBottom } from '../utils/safeAreaUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return 'Today';
  }
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Yesterday';
  }
  return date.toLocaleDateString();
}

const Chat = () => {
  const { user } = useAuth();
  const { colors, dark } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const conversationId = route.params?.conversationId;
  const notificationData = route.params?.notificationData;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // Log notification data if coming from notification
  useEffect(() => {
    if (notificationData) {
      console.log('💬 Chat opened from notification:', notificationData);
    }
  }, [notificationData]);
  
  const handleInputTextChange = (text) => {
    setInputText(text);
  };
  const flatListRef = useRef();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Using utility function for safe area calculation

  // Animation for header and content
  const animateIn = () => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    getConversationMessages(conversationId)
      .then(setMessages)
      .catch(setError)
      .finally(() => {
        setLoading(false);
        animateIn();
      });
  }, [conversationId]);

  // Real-time subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = subscribeToNewMessages(conversationId, (newMsg) => {
      setMessages((prev) => {
        const filtered = prev.filter(
          (msg) => !(msg.pending && msg.content === newMsg.content && msg.sender_id === newMsg.sender_id)
        );
        return [...filtered, newMsg];
      });
    });
    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [conversationId]);

  useEffect(() => {
    const onKeyboardShow = (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      // Reset any potential layout issues
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    };
    
    const onKeyboardHide = () => {
      setKeyboardHeight(0);
      // Force layout recalculation when keyboard hides
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: false });
        }
      }, 50);
    };

    const showSub = Keyboard.addListener('keyboardDidShow', onKeyboardShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    
    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      content: text.trim(),
      sender_id: user.id,
      created_at: new Date().toISOString(),
      pending: true,
      sender: user,
    };
    
    setMessages((prev) => [...prev, tempMsg]);
    setInputText(''); // Clear the input text
    
    try {
      await sendMessage(conversationId, user.id, tempMsg.content);
    } catch (err) {
      setError(err.message || err.toString() || 'Failed to send message');
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleAttachment = () => {
    Alert.alert('Attachment', 'Attachment feature coming soon!');
  };

  const handleTyping = (typing) => {
    setIsTyping(typing);
    // In a real app, you would send typing status to the server
  };

  const renderHeader = () => (
    <Animated.View 
      style={[
        styles.header, 
        { 
          backgroundColor: dark ? COLORS.dark1 : COLORS.white,
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-20, 0]
          })}]
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="arrow-back" 
          size={24} 
          color={dark ? COLORS.white : COLORS.black} 
        />
      </TouchableOpacity>
      
      <View style={styles.headerInfo}>
        <View style={styles.avatarContainer}>
          <Image 
            source={defaultAvatar} 
            style={styles.headerAvatar} 
          />
          {notificationData && (
            <View style={styles.notificationIndicator}>
              <Ionicons name="notifications" size={12} color={COLORS.white} />
            </View>
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.headerName, { color: dark ? COLORS.white : COLORS.black }]}>
            Service Provider
          </Text>
          {notificationData && (
            <Text style={[styles.notificationSubtitle, { color: dark ? COLORS.gray3 : COLORS.gray3 }]}>
              New message
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );

  const renderDateSeparator = (date) => (
    <View style={styles.dateSeparatorContainer}>
      <View style={[styles.dateSeparator, { backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200 }]}>
        <Text style={[styles.dateSeparatorText, { color: dark ? COLORS.grayscale400 : COLORS.grayscale600 }]}>
          {date}
        </Text>
      </View>
    </View>
  );

  const renderMessage = ({ item, index }) => {
    const isMe = item.sender_id === user.id;
    
    // Date separator logic
    let showDate = false;
    if (index === 0) showDate = true;
    else {
      const curr = messages[index];
      const prev = messages[index - 1];
      if (curr && prev && formatDate(curr.created_at) !== formatDate(prev.created_at)) {
        showDate = true;
      }
    }

    // Group messages logic
    const nextMessage = messages[index + 1];
    const prevMessage = messages[index - 1];
    const isLastInGroup = !nextMessage || nextMessage.sender_id !== item.sender_id;
    const isFirstInGroup = !prevMessage || prevMessage.sender_id !== item.sender_id;

    return (
      <Animated.View 
        style={[
          { opacity: fadeAnim }
        ]}
      >
        {showDate && renderDateSeparator(formatDate(item.created_at))}
        <MessageBubble
          message={item.content}
          isMe={isMe}
          showTime={true}
          showStatus={isMe}
          isLastInGroup={isLastInGroup}
          isFirstInGroup={isFirstInGroup}
          timestamp={item.created_at}
          status={item.pending ? 'pending' : 'read'}
        />
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: dark ? COLORS.white : COLORS.black }]}>
          Loading conversation...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
        <Ionicons name="alert-circle" size={48} color={COLORS.error} />
        <Text style={[styles.errorText, { color: dark ? COLORS.white : COLORS.black }]}>
          {error?.message || error?.toString() || 'An error occurred.'}
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: dark ? COLORS.dark1 : '#f8f9fa' }]}>
      <StatusBar 
        barStyle={dark ? 'light-content' : 'dark-content'}
        backgroundColor={dark ? COLORS.dark1 : COLORS.white}
      />
      {renderHeader()}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        enabled={true}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[
            styles.messagesContainer,
            { 
              paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : getSafeAreaBottom() + 100,
              flexGrow: 1
            }
          ]}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: false });
            }
          }}
          showsVerticalScrollIndicator={false}
          style={styles.messagesList}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
        
        <ChatInput
          onSend={handleSend}
          onAttachment={handleAttachment}
          onTyping={handleTyping}
          placeholder="Type a message..."
          maxLength={1000}
          disabled={false}
          showAttachment={false}
          showSendButton={true}
          multiline={true}
          autoFocus={false}
          value={inputText}
          onChangeText={handleInputTextChange}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'regular',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale200,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontFamily: 'bold',
    marginBottom: 2,
  },
  headerStatus: {
    fontSize: 12,
    fontFamily: 'regular',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 4,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingTop: 16,
  },
  dateSeparatorContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparator: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontFamily: 'medium',
  },
  notificationIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  notificationSubtitle: {
    fontSize: 12,
    fontFamily: 'regular',
    marginTop: 2,
  },
});

export default Chat;