# Testing the New Read Status Implementation

## Overview

This guide explains how to test the updated messaging read status functionality that now works with the backend's last read time tracking system.

## Quick Test

### 1. Run the Test Suite

```javascript
import {
  runAllMessagingTests,
  testReadStatusFunctionality,
} from '../src/tests/messagingTest';

// Run all tests including new read status tests
const results = await runAllMessagingTests();
console.log('Test Results:', results);

// Or run just the read status tests
const readStatusResults = await testReadStatusFunctionality();
console.log('Read Status Results:', readStatusResults);
```

### 2. Manual Testing in the App

#### Test Message Read Status Display

1. Open a conversation with unread messages
2. Verify unread messages show without read indicators
3. Tap on unread messages from others
4. Verify messages are marked as read with visual indicators
5. Check that own messages always show as read

#### Test Conversation Read Counts

1. Navigate to messaging screen
2. Verify unread conversation counts are accurate (calculated from conversations list)
3. Enter a conversation with unread messages
4. Verify unread messages are automatically marked as read
5. Exit and verify unread count decreases to 0
6. Check global unread badge updates (calculated from conversations, not separate endpoint)

#### Test Individual Message Read Marking

1. Open a conversation
2. Tap on an unread message from another user
3. Verify the message is marked as read immediately
4. Check that the read status persists after refreshing

## API Testing

### Test New Endpoint

```javascript
import { markMessageAsRead } from '../src/services/messagingService';

// Test marking individual message as read
const result = await markMessageAsRead(
  messageId, // ID of the message
  conversationUuid, // UUID of the conversation
  authCode // User's auth code
);

console.log('Mark message result:', result);
// Expected: { success: true, data: { message_id: 123, is_read: true, read_at: "..." } }
```

### Test Message Response Format

```javascript
import { getConversationMessages } from '../src/services/messagingService';

// Get messages and verify new fields
const messages = await getConversationMessages('conversation-uuid');

messages.data.messages.forEach((message) => {
  console.log('Message ID:', message.message_id);
  console.log('Is Read:', message.is_read); // NEW field
  console.log('Read At:', message.read_at); // NEW field
  console.log('Read By:', message.read_by); // Legacy field
});
```

## Component Testing

### MessageBubble Component

```javascript
// Test message with new read status
const testMessage = {
  message_id: 1,
  content: 'Test message',
  sender: { id: 1, name: 'Test User' },
  is_read: true, // NEW: Read status
  read_at: new Date(), // NEW: Read timestamp
  read_by: [2], // Legacy: Read by array
  created_at: new Date(),
  is_own_message: false,
};

// Component should display read status correctly
<MessageBubble
  message={testMessage}
  isOwnMessage={false}
  onMessagePress={(msg) => {
    // Should mark as read if unread and not own message
    if (!msg.is_read && !msg.is_own_message) {
      markMessageAsRead(msg.message_id, conversationUuid, authCode);
    }
  }}
/>;
```

### ConversationItem Component

```javascript
// Test conversation with accurate unread count
const testConversation = {
  conversation_uuid: 'test-uuid',
  topic: 'Test Conversation',
  unread_count: 3, // Should be accurate based on last read time
  last_message: {
    content: 'Latest message',
    created_at: new Date(),
  },
};

// Component should display unread badge correctly
<ConversationItem
  conversation={testConversation}
  showUnreadBadge={true}
  onPress={(conv) => {
    // Navigate to conversation and mark as read
    navigation.navigate('ConversationScreen', {
      conversationUuid: conv.conversation_uuid,
    });
  }}
/>;
```

## Expected Behavior

### ✅ What Should Work

- Messages display correct read status using `is_read` field
- Tapping unread messages marks them as read immediately
- Own messages always show as read
- Conversation unread counts are accurate
- Global unread badge updates correctly
- Optimistic updates provide smooth UX
- Error handling reverts failed operations

### ❌ What Should Not Happen

- Read status should not flicker or be inconsistent
- Unread counts should not be negative
- Own messages should never show as unread
- Failed API calls should not leave UI in broken state
- Read status should not reset unexpectedly

## Debugging

### Common Issues

#### Messages Not Marking as Read

1. Check if `markMessageAsRead` function is called
2. Verify API endpoint is correct (`/mobile-api/messaging/mark-message-read`)
3. Check network connectivity and auth code
4. Verify message ID and conversation UUID are correct

#### Incorrect Unread Counts

1. Check if backend is using last read time correctly
2. Verify `getConversations` returns accurate counts
3. Check if `markConversationAsReadLocally` is called
4. Verify polling interval is working

#### Read Status Not Persisting

1. Check if API call succeeds
2. Verify backend updates user's last read time
3. Check if optimistic updates are reverted on error
4. Verify message refresh includes updated status

### Debug Logging

Enable detailed logging to track read status operations:

```javascript
// In ConversationScreen.js
console.log('📖 Marking message as read:', messageId);
console.log('✅ Message marked as read successfully');
console.log('❌ Failed to mark message as read:', error);

// In MessagingContext.js
console.log('📊 Unread counts updated:', { conversations, messages });
console.log('🔄 Refreshing unread counts');
```

## Performance Considerations

### Optimizations

- Use optimistic updates for immediate feedback
- Batch read status updates when possible
- Cache read status locally
- Minimize API calls with smart polling

### Monitoring

- Track API response times
- Monitor error rates for read status operations
- Check memory usage with large message lists
- Verify smooth scrolling performance

## Backward Compatibility

### Legacy Support

- `read_by` array still supported for older messages
- Fallback logic handles missing `is_read` field
- Existing API endpoints continue to work
- No breaking changes to component interfaces

### Migration

- New messages automatically include `is_read` field
- Existing messages get `is_read` calculated from `read_by`
- Gradual migration as users interact with messages
- No data loss during transition
