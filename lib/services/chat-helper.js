import { supabase } from '../supabase';
import { createConversation } from './chat';

// Helper function to find or create a conversation between users
export async function findOrCreateConversation(userIds) {
  if (!userIds || userIds.length < 2) {
    throw new Error('At least two user IDs are required');
  }

  try {
    console.log('Finding conversation between users:', userIds);
    
    // Get all conversations for the first user
    const { data: user1Participants, error: user1Error } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userIds[0]);
      
    if (user1Error) throw user1Error;
    
    if (user1Participants && user1Participants.length > 0) {
      // For each conversation, check if the second user is a participant
      const convIds = user1Participants.map(p => p.conversation_id);
      
      const { data: user2Participants, error: user2Error } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userIds[1])
        .in('conversation_id', convIds);
        
      if (user2Error) throw user2Error;
      
      // If we found a conversation with both users, return it
      if (user2Participants && user2Participants.length > 0) {
        console.log('Found existing conversation:', user2Participants[0].conversation_id);
        return user2Participants[0].conversation_id;
      }
    }
    
    // If no existing conversation, create a new one
    console.log('Creating new conversation between users');
    const newConversationId = await createConversation(userIds);
    console.log('Created new conversation:', newConversationId);
    return newConversationId;
  } catch (err) {
    console.error('Error finding or creating conversation:', err);
    throw err;
  }
}
