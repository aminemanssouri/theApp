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
import { getConversationMessages, sendMessage, subscribeToNewMessages, autoMarkMessageAsRead } from '../lib/services/chat';
import { getWorkerByConversation } from '../lib/services/workers';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS, SIZES, icons } from '../constants';
import { Ionicons } from '@expo/vector-icons';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import defaultAvatar from '../assets/images/avatar.jpeg';
import { getSafeAreaBottom, getSafeAreaTop } from '../utils/safeAreaUtils';
import { useI18n } from '../context/LanguageContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Chat = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { markConversationAsRead } = useChat();
  const { colors, dark } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const conversationId = route.params?.conversationId;
  const workerInfo = route.params?.workerInfo; // Worker info from Chats or WorkerDetails
  const notificationData = route.params?.notificationData;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false); // Start with false for instant UI
  const [messagesReady, setMessagesReady] = useState(true); // Start ready for instant UI
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [chatPartner, setChatPartner] = useState(workerInfo); // Store worker info
  
  const flatListRef = useRef();
  const didInitialScroll = useRef(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const headerAnim = useRef(new Animated.Value(1)).current; // Start visible
  const fadeAnim = useRef(new Animated.Value(1)).current; // Start visible
  
  const formatDateLocalized = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return t('chat.today');
    }
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return t('chat.yesterday');
    }
    return date.toLocaleDateString();
  };
  
  // Log notification data if coming from notification
  useEffect(() => {
    if (notificationData) {
      console.log('💬 Chat opened from notification:', notificationData);
    }
  }, [notificationData]);
  
  const handleInputTextChange = (text) => {
    setInputText(text);
  };

  // Animation for header and content (already visible for instant UI)
  const animateIn = () => {
    // No animation needed - already visible
  };

  // Load messages immediately on mount
  useEffect(() => {
    if (!conversationId) return;
    
    // Load messages in background
    getConversationMessages(conversationId)
      .then((msgs) => {
        setMessages(msgs);
        didInitialScroll.current = false;
      })
      .catch(setError);
  }, [conversationId]);

  // Load worker info only if not already provided
  useEffect(() => {
    if (!conversationId || !user || chatPartner) return;
    
    getWorkerByConversation(conversationId, user.id)
      .then(({ data }) => {
        if (data) {
          setChatPartner({
            id: data.id,
            name: data.full_name || undefined, 
            avatar_url: data.Image
          });
        }
      })
      .catch(err => console.error('Error loading worker info:', err));
  }, [conversationId, user, chatPartner]);

  // Mark messages as read when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      if (conversationId) {
        markConversationAsRead(conversationId);
        
        // If opened from notification, mark the specific message as read
        if (notificationData?.message_id && user) {
          console.log('📖 Marking notification message as read:', notificationData.message_id);
          autoMarkMessageAsRead(notificationData.message_id, user.id);
        }
      }
    }, [conversationId, markConversationAsRead, notificationData, user])
  );

  // Real-time subscription
  useEffect(() => {
    if (!conversationId || !user) return;
    const channel = subscribeToNewMessages(conversationId, async (newMsg) => {
      setMessages((prev) => {
        const filtered = prev.filter(
          (msg) => !(msg.pending && msg.content === newMsg.content && msg.sender_id === newMsg.sender_id)
        );
        return [...filtered, newMsg];
      });
      
      // Auto-mark message as read if it's not from the current user and the chat is active
      if (newMsg.sender_id !== user.id) {
        console.log('📖 Auto-marking message as read:', newMsg.id);
        await autoMarkMessageAsRead(newMsg.id, user.id);
      }
    });
    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [conversationId, user]);

  useEffect(() => {
    const onKeyboardShow = (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    };
    
    const onKeyboardHide = () => {
      setKeyboardHeight(0);
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
      setError(err.message || err.toString() || t('chat.failed_to_send'));
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      Alert.alert(t('common.error'), t('chat.failed_to_send'));
    }
  };

  const handleAttachment = () => {
    Alert.alert(t('common.coming_soon'), t('chat.attachment_coming_soon'));
  };

  const handleTyping = (typing) => {
    setIsTyping(typing);
    // In a real app, you would send typing status to the server
  };

  const renderHeader = () => (
    <View 
      style={[
        styles.header, 
        { 
          backgroundColor: dark ? COLORS.dark1 : COLORS.white,
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
            source={chatPartner?.avatar_url ? { uri: chatPartner.avatar_url } : defaultAvatar} 
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
            {chatPartner?.name || t('chat.service_provider')}
          </Text>
          {chatPartner && (
            <Text style={[styles.headerStatus, { color: dark ? COLORS.grayscale400 : COLORS.grayscale600 }]}> 
              {t('chat.professional')}
            </Text>
          )}
          {notificationData && (
            <Text style={[styles.notificationSubtitle, { color: dark ? COLORS.gray3 : COLORS.gray3 }]}> 
              {t('chat.new_message')}
            </Text>
          )}
        </View>
      </View>
    </View>
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
      if (curr && prev && formatDateLocalized(curr.created_at) !== formatDateLocalized(prev.created_at)) {
        showDate = true;
      }
    }

    // Group messages logic
    const nextMessage = messages[index + 1];
    const prevMessage = messages[index - 1];
    const isLastInGroup = !nextMessage || nextMessage.sender_id !== item.sender_id;
    const isFirstInGroup = !prevMessage || prevMessage.sender_id !== item.sender_id;

    return (
      <View>
        {showDate && renderDateSeparator(formatDateLocalized(item.created_at))}
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
      </View>
    );
  };

  // Skeleton/Empty state for instant UI
  const renderEmptyMessages = () => (
    <View style={styles.emptyMessagesContainer}>
      <Text style={[styles.emptyMessagesText, { color: dark ? COLORS.grayscale400 : COLORS.grayscale600 }]}>
        {t('')}
      </Text>
    </View>
  );

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
        <Ionicons name="alert-circle" size={48} color={COLORS.error} />
        <Text style={[styles.errorText, { color: dark ? COLORS.white : COLORS.black }]}> 
          {error?.message || error?.toString() || t('common.error')}
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            getConversationMessages(conversationId)
              .then((msgs) => {
                setMessages(msgs);
              })
              .catch(setError);
          }}
        >
          <Text style={styles.retryButtonText}>{t('chat.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: dark ? COLORS.dark1 : '#f8f9fa' }]}>
      <StatusBar 
        barStyle={dark ? 'light-content' : 'dark-content'}
        backgroundColor={dark ? COLORS.dark1 : COLORS.white}
        translucent={false}
      />
      <View style={{ paddingTop: getSafeAreaTop() }}>
        {renderHeader()}
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        enabled={Platform.OS === 'ios'}
      >
        <FlatList
          ref={flatListRef}
          data={messages.slice().reverse()}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => {
            const originalIndex = messages.length - 1 - index;
            return renderMessage({ item, index: originalIndex });
          }}
          inverted
          contentContainerStyle={[
            styles.messagesContainer,
            { 
              paddingTop: getSafeAreaBottom() + 20,
              flexGrow: 1
            }
          ]}
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10
          }}
          showsVerticalScrollIndicator={false}
          style={styles.messagesList}
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          windowSize={8}
          initialNumToRender={20}
          updateCellsBatchingPeriod={50}
          ListEmptyComponent={renderEmptyMessages}
        />
        
        <ChatInput
          onSend={handleSend}
          onAttachment={handleAttachment}
          onTyping={handleTyping}
          placeholder={t('chat.type_message')}
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
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingTop: 16,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMessagesText: {
    fontSize: 16,
    fontFamily: 'regular',
    textAlign: 'center',
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
