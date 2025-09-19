import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getUnreadMessagesCount, 
  subscribeToMessageStatus,
  subscribeToUserMessages,
  markMessagesRead
} from '../lib/services/chat';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load and track unread chat messages
  useEffect(() => {
    if (!user?.id) {
      setChatUnreadCount(0);
      return;
    }

    let statusChannel;
    let messageChannel;

    const loadUnreadCount = async () => {
      try {
        setLoading(true);
        const count = await getUnreadMessagesCount(user.id);
        console.log('📊 Chat unread count loaded:', count);
        setChatUnreadCount(count);
      } catch (error) {
        console.error('❌ Error loading chat unread count:', error);
        setChatUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    const setupSubscriptions = async () => {
      // Initial load
      await loadUnreadCount();

      // Subscribe to message status changes
      statusChannel = subscribeToMessageStatus(user.id, async (payload, event) => {
        console.log('📬 Message status changed:', event, payload);
        const count = await getUnreadMessagesCount(user.id);
        setChatUnreadCount(count);
      });

      // Subscribe to new messages
      messageChannel = subscribeToUserMessages(user.id, async (newMessage) => {
        console.log('💬 New message received:', newMessage.id);
        // Only increment if it's not from the current user
        if (newMessage.sender_id !== user.id) {
          const count = await getUnreadMessagesCount(user.id);
          setChatUnreadCount(count);
        }
      });
    };

    setupSubscriptions();

    return () => {
      if (statusChannel) statusChannel.unsubscribe();
      if (messageChannel) messageChannel.unsubscribe();
    };
  }, [user?.id]);

  // Mark messages as read for a conversation
  const markConversationAsRead = async (conversationId) => {
    if (!user?.id || !conversationId) return;
    
    try {
      console.log('✅ Marking conversation as read:', conversationId);
      await markMessagesRead(conversationId, user.id);
      // Refresh count after marking as read
      const count = await getUnreadMessagesCount(user.id);
      setChatUnreadCount(count);
    } catch (error) {
      console.error('❌ Error marking conversation as read:', error);
    }
  };

  // Manually refresh unread count
  const refreshUnreadCount = async () => {
    if (!user?.id) return;
    
    try {
      const count = await getUnreadMessagesCount(user.id);
      setChatUnreadCount(count);
    } catch (error) {
      console.error('❌ Error refreshing unread count:', error);
    }
  };

  const value = {
    chatUnreadCount,
    loading,
    markConversationAsRead,
    refreshUnreadCount
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};
