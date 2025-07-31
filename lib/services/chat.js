import { supabase } from '../supabase';

// Get all conversations for a user (no join workaround)
export async function getUserConversations(userId) {
  // 1. Get all conversation_participants for the user
  const { data: participants, error: participantsError } = await supabase
    .from('conversation_participants')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId);

  if (participantsError) throw participantsError;
  if (!participants) return [];

  // 2. For each conversation, get all participant user_ids and unread count
  const conversations = await Promise.all(participants.map(async (p) => {
    const { data: allParticipants } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', p.conversation_id);

    // 3. Fetch worker info for each user_id (except current user)
    const otherUserIds = (allParticipants || []).filter(ap => ap.user_id !== userId).map(ap => ap.user_id);
    let workers = [];
    if (otherUserIds.length) {
      const { data: workerData } = await supabase
        .from('workers')
        .select('*')
        .in('id', otherUserIds);
      workers = workerData || [];
    }

    // 4. Count unread messages for this user in this conversation
    const { count: unreadCount } = await supabase
      .from('message_status')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .in('message_id',
        (await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', p.conversation_id)
        ).data?.map(m => m.id) || []
      );

    return {
      id: p.conversation_id,
      last_read_at: p.last_read_at,
      participants: workers,
      unreadCount: unreadCount || 0,
    };
  }));

  return conversations;
}

// Get all messages for a conversation
export async function getConversationMessages(conversationId) {
  // 1. Get all messages
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  // 2. Get all unique sender_ids
  const senderIds = [...new Set((messages || []).map(m => m.sender_id))];
  let senders = [];
  if (senderIds.length) {
    const { data: senderData } = await supabase
      .from('workers')
      .select('*')
      .in('id', senderIds);
    senders = senderData || [];
  }

  // 3. Attach sender info to each message
  const messagesWithSender = (messages || []).map(msg => ({
    ...msg,
    sender: senders.find(s => s.id === msg.sender_id) || null,
  }));

  return messagesWithSender;
}

// Send a message in a conversation
export async function sendMessage(conversationId, senderId, content, messageType = 'text', fileUrl = null, metadata = null) {
  // 1. Insert message
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert([
      {
        conversation_id: conversationId,
        sender_id: senderId,
        message_type: messageType,
        content,
        file_url: fileUrl,
        metadata,
      },
    ])
    .select()
    .single();
  if (messageError) throw messageError;

  // 2. Get all participants
  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId);

  // 3. Insert message_status for each participant
  if (participants && participants.length > 0) {
    const statusRows = participants.map((p) => ({
      message_id: message.id,
      user_id: p.user_id,
      is_delivered: false,
      is_read: false,
    }));
    await supabase.from('message_status').insert(statusRows);
  }
  return message;
}

// Mark messages as read for a user in a conversation
export async function markMessagesRead(conversationId, userId) {
  // 1. Get all message ids in the conversation
  const { data: messages } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId);
  const messageIds = (messages || []).map((m) => m.id);
  if (messageIds.length === 0) return;

  // 2. Update message_status for these messages and user
  await supabase
    .from('message_status')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .in('message_id', messageIds)
    .eq('user_id', userId);

  // 3. Update last_read_at in conversation_participants
  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);
}

// Subscribe to new messages in a conversation (Supabase Realtime)
export function subscribeToNewMessages(conversationId, callback) {
  const channel = supabase.channel('messages-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
  return channel;
}

// Subscribe to new messages for all conversations a user participates in
export function subscribeToUserMessages(userId, callback) {
  // Listen for new messages in any conversation where the user is a participant
  const channel = supabase.channel('user-messages-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      async (payload) => {
        // Check if the user is a participant in the conversation
        const { conversation_id } = payload.new;
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversation_id);
        if (participants && participants.some(p => p.user_id === userId)) {
          callback(payload.new);
        }
      }
    )
    .subscribe();
  return channel;
}

// Create a new conversation and add participants
export async function createConversation(userIds, bookingId = null) {
  // 1. Create the conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert([
      {
        booking_id: bookingId,
      },
    ])
    .select()
    .single();
  if (convError) throw convError;

  // 2. Add participants
  const participants = userIds.map((userId) => ({
    conversation_id: conversation.id,
    user_id: userId,
  }));
  const { error: partError } = await supabase
    .from('conversation_participants')
    .insert(participants);
  if (partError) throw partError;

  return conversation.id;
} 