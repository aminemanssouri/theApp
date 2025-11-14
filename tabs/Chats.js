import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, Animated, Platform } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { getUserConversations, getConversationMessages, subscribeToUserMessages, markMessagesRead } from '../lib/services/chat';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS, SIZES, images } from '../constants';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../context/LanguageContext';

const Chats = ({ searchQuery = '' }) => {
  const { t } = useI18n();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { markConversationAsRead, refreshUnreadCount } = useChat();
  const { colors, dark } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadConversations = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const convs = await getUserConversations(user.id);
      
      // For each conversation, fetch the latest message
      const convsWithLastMsg = await Promise.all(
        convs.map(async (conv) => {
          const msgs = await getConversationMessages(conv.id);
          const lastMsg = msgs && msgs.length > 0 ? msgs[msgs.length - 1] : null;
          return {
            ...conv,
            last_message: lastMsg ? lastMsg.content : '',
            last_message_time: lastMsg ? lastMsg.created_at : null,
            unread_count: conv.unreadCount || 0,
          };
        })
      );
      
      setConversations(convsWithLastMsg);
      animateIn();
    } catch (err) {
      setError(err.message || t('chat.loading_failed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversations();

    // Subscribe to new messages for this user
    const channel = subscribeToUserMessages(user?.id, (newMessage) => {
      setConversations(prev => 
        prev.map(conv => {
          if (conv.id === newMessage.conversation_id) {
            const newUnreadCount = newMessage.sender_id !== user.id 
              ? (conv.unread_count || 0) + 1 
              : conv.unread_count;
            
            return {
              ...conv,
              last_message: newMessage.content,
              last_message_time: newMessage.created_at,
              unread_count: newUnreadCount,
            };
          }
          return conv;
        })
      );
    });
    
    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [user]);
  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleConversationPress = async (conversationId, participantId) => {
    // Get worker info to pass to Chat screen
    const conversation = conversations.find(conv => conv.id === conversationId);
    const participant = conversation?.participants[0];
    const workerInfo = participant ? {
      id: participant.id,
      name: (participant.first_name || '') + ' ' + (participant.last_name || ''),
      avatar_url: participant.avatar_url,
      full_name: (participant.first_name || '') + ' ' + (participant.last_name || ''),
    } : null;

    // Navigate immediately for instant response
    navigation.navigate('Chat', { 
      conversationId, 
      workerId: participantId,
      workerInfo: workerInfo // Pass worker info to avoid double loading
    });

    // Update UI optimistically
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unread_count: 0 }
          : conv
      )
    );

    // Mark as read in background (don't await)
    markConversationAsRead(conversationId).catch(error => {
      console.error('Error marking messages as read:', error);
    });
  };

  // Filter by search query
  const filteredConversations = conversations.filter(item => {
    const q = searchQuery?.trim().toLowerCase() || '';
    if (!q) return true;
    
    return item.participants.some(participant => {
      const firstName = (participant.first_name || '').toLowerCase();
      const lastName = (participant.last_name || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      const displayName = participant.display_name || '';
      const email = participant.email || '';
      
      return (
        firstName.includes(q) ||
        lastName.includes(q) ||
        fullName.includes(q) ||
        displayName.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q)
      );
    });
  });

  const formatLastMessageTime = (dateStr) => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return t('chat.just_now');
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return t('chat.yesterday');
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  const highlightText = (text, query) => {
    if (!query.trim() || !text) return text;
    
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <Text key={index} style={{ backgroundColor: COLORS.primary, color: COLORS.white, fontWeight: 'bold' }}>
          {part}
        </Text>
      ) : part
    );
  };

  const renderEmptyState = () => {
    if (searchQuery.trim()) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.background }]}>
            <Ionicons 
              name="search-outline" 
              size={48} 
              color={dark ? COLORS.grayscale400 : COLORS.grayscale600} 
            />
          </View>
          <Text style={[styles.emptyTitle, { color: dark ? COLORS.white : COLORS.black }]}>
            {t('chat.no_results_title')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: dark ? COLORS.grayscale400 : COLORS.grayscale600 }]}>
            {t('chat.no_results_subtitle')}
          </Text>
        </View>
      );
    }
    
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.background }]}>
          <Ionicons 
            name="chatbubbles-outline" 
            size={48} 
            color={dark ? COLORS.grayscale400 : COLORS.grayscale600} 
          />
        </View>
        <Text style={[styles.emptyTitle, { color: dark ? COLORS.white : COLORS.black }]}>
          {t('chat.no_conversations_title')}
        </Text>
        <Text style={[styles.emptySubtitle, { color: dark ? COLORS.grayscale400 : COLORS.grayscale600 }]}>
          {t('chat.no_conversations_subtitle')}
        </Text>
      </View>
    );
  };

  const renderConversationItem = ({ item, index }) => {
    const participant = item.participants[0] || {};
    const fullName = (participant.first_name || '') + ' ' + (participant.last_name || '');
    const avatarUrl = participant.avatar_url;
    const lastMessage = item.last_message || '';
    const lastMessageTime = formatLastMessageTime(item.last_message_time);
    const hasUnread = item.unread_count > 0;

    return (
      <Animated.View
        style={[
          { 
            opacity: fadeAnim, 
            transform: [{ translateY: slideAnim }],
            backgroundColor: 'transparent'
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            handleConversationPress(item.id, participant.id);
          }}
          style={[
            styles.conversationItem,
            { 
              backgroundColor: dark ? COLORS.dark2 : COLORS.white,
              elevation: dark ? 2 : 1,
              shadowColor: dark ? '#000' : '#000',
              shadowOffset: { width: 0, height: dark ? 2 : 1 },
              shadowOpacity: dark ? 0.3 : 0.1,
              shadowRadius: dark ? 4 : 2,
              ...Platform.select({
                ios: { 
                  backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                  shadowColor: dark ? '#000' : '#000',
                  shadowOffset: { width: 0, height: dark ? 2 : 1 },
                  shadowOpacity: dark ? 0.3 : 0.1,
                  shadowRadius: dark ? 4 : 2,
                },
                android: { 
                  backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                  elevation: dark ? 2 : 1,
                }
              })
            },
            index === 0 && { marginTop: 8 }
          ]}
          activeOpacity={0.7}
        >
          {/* Avatar with online status */}
          <View style={[styles.avatarContainer, { backgroundColor: 'transparent' }]}>
            <Image
              source={avatarUrl ? { uri: avatarUrl } : images.avatarurl}
              style={styles.avatar}
            />
            <View style={[styles.onlineIndicator, { backgroundColor: COLORS.success }]} />
          </View>

          {/* Conversation content */}
          <View style={[styles.conversationContent, { backgroundColor: 'transparent' }]}>
            <View style={[styles.conversationHeader, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.participantName, { color: dark ? COLORS.white : COLORS.black }]}>
                {searchQuery.trim() ? 
                  highlightText(fullName.trim() || t('chat.service_provider'), searchQuery) : 
                  (fullName.trim() || t('chat.service_provider'))
                }
              </Text>
              <Text style={[styles.lastMessageTime, { color: dark ? COLORS.grayscale400 : COLORS.grayscale600 }]}>
                {lastMessageTime}
              </Text>
            </View>
            
            <View style={[styles.conversationFooter, { backgroundColor: 'transparent' }]}>
              <Text 
                style={[
                  styles.lastMessage, 
                  { 
                    color: hasUnread 
                      ? (dark ? COLORS.white : COLORS.black) 
                      : (dark ? COLORS.grayscale400 : COLORS.grayscale600),
                    fontFamily: hasUnread ? 'medium' : 'regular'
                  }
                ]}
                numberOfLines={1}
              >
                {truncateMessage(lastMessage) || t('chat.start_conversation_placeholder')}
              </Text>
              
              {hasUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>
                    {item.unread_count > 9 ? '9+' : item.unread_count}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action button */}
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'transparent' }]}>
            <Ionicons 
              name="ellipsis-vertical" 
              size={16} 
              color={dark ? COLORS.grayscale400 : COLORS.grayscale600} 
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: dark ? COLORS.white : COLORS.black }]}>
          {t('chat.loading_conversations')}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={48} color={COLORS.error} />
        <Text style={[styles.errorText, { color: dark ? COLORS.white : COLORS.black }]}> 
          {error || t('common.error')}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadConversations}>
          <Text style={styles.retryButtonText}>{t('chat.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Results Counter */}
      {searchQuery.trim() && (
        <View style={[styles.searchResultsContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.searchResultsText, { color: dark ? COLORS.grayscale400 : COLORS.grayscale600 }]}> 
            {filteredConversations.length === 1
              ? t('chat.conversations_found_one')
              : t('chat.conversations_found_other', { count: filteredConversations.length })}
          </Text>
        </View>
      )}
      
      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContainer, { backgroundColor: colors.background }]}
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.background }]} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
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
  listContainer: {
    paddingHorizontal: 8,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 2,
    backgroundColor: 'transparent',
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    ...Platform.select({
      ios: { backgroundColor: 'transparent' },
      android: { backgroundColor: 'transparent' }
    }),
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
    backgroundColor: 'transparent',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  conversationContent: {
    flex: 1,
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  participantName: {
    fontSize: 16,
    fontFamily: 'bold',
    flex: 1,
  },
  lastMessageTime: {
    fontSize: 12,
    fontFamily: 'regular',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCount: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: 'bold',
    textAlign: 'center',
  },
  actionButton: {
    padding: 8,
    backgroundColor: 'transparent',
  },
  separator: {
    height: 8,
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
    backgroundColor: 'transparent',
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  searchResultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  searchResultsText: {
    fontSize: 14,
    fontFamily: 'regular',
  },
});

export default Chats;