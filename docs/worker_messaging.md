# Worker Messaging Feature

This document explains how the direct messaging feature between clients and service workers is implemented.

## Overview

The worker messaging feature allows clients to directly message service workers without requiring the creation of conversation objects in the database. This simplifies the chat flow for direct communication.

## Implementation

### Database Schema

Direct messaging uses the existing `messages` table with an additional `recipient_id` column:

- `sender_id`: User sending the message
- `recipient_id`: User receiving the message
- `content`: Message content
- `created_at`: Timestamp when message was sent

### API Functions

The following functions handle direct messaging operations:

1. `sendDirectMessage(senderId, recipientId, content)`: Sends a direct message between two users
2. `getDirectMessages(userId1, userId2)`: Retrieves all direct messages between two users
3. `subscribeToDirectMessages(userId1, userId2, callback)`: Sets up real-time subscription to direct messages between users

### User Flow

1. User views a worker's profile in the `WorkerDetails` screen
2. User clicks the "Message" button which navigates to the `Chat` screen
3. The Chat screen receives the worker information as a `recipient` parameter
4. If a recipient parameter is present, the Chat component uses direct messaging functions
5. Otherwise, it uses the existing conversation-based messaging system

## Differences from Conversation-Based Messaging

Traditional conversation-based messaging:
- Requires creating a `conversation` record first
- Links messages to conversations via `conversation_id`
- Manages participants through a `conversation_participants` table

Direct messaging:
- No conversation record needed
- Messages linked directly between sender and recipient
- Simplifies the data model for one-to-one communication

## Security

Row-level security policies ensure users can only:
- View messages where they are either the sender or recipient
- Send messages where they are the sender

## Usage

To implement direct messaging in a new screen:

```javascript
// Navigate to Chat with recipient info
navigation.navigate("Chat", {
  recipient: {
    id: workerId,
    name: workerName,
    avatar_url: workerAvatarUrl
  }
});
```

The Chat screen handles both messaging modes automatically based on the parameters provided.
