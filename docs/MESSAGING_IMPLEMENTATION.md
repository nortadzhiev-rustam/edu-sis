# Messaging Implementation Guide

## Overview

The messaging system provides comprehensive chat functionality for the EduSIS mobile application, enabling communication between teachers, students, and staff members with role-based permissions and real-time notifications.

## 🚀 Features

### Core Functionality
- **Conversations**: Create and manage group conversations
- **Real-time Messaging**: Send and receive messages instantly
- **File Attachments**: Share images, documents, and files
- **Search**: Search through conversations and messages
- **Notifications**: Push notifications for new messages
- **Role-based Access**: Different permissions for teachers and students

### User Experience
- **Teacher Dashboard**: Access messaging from teacher quick actions
- **Student Dashboard**: Access messaging from parent screen menu
- **Conversation Management**: Create, view, and manage conversations
- **Message History**: View conversation history with pagination
- **Unread Indicators**: Visual indicators for unread messages

## 📁 File Structure

```
src/
├── services/
│   └── messagingService.js          # API service for messaging
├── screens/
│   ├── TeacherMessagingScreen.js    # Teacher messaging interface
│   ├── StudentMessagingScreen.js    # Student messaging interface
│   ├── ConversationScreen.js        # Conversation view (shared)
│   ├── CreateConversationScreen.js  # Create new conversation
│   └── StudentCreateConversationScreen.js # Student-specific creation
├── components/
│   └── messaging/
│       ├── MessageBubble.js         # Individual message component
│       ├── ConversationItem.js      # Conversation list item
│       ├── UserSelector.js          # User selection component
│       ├── AttachmentHandler.js     # File attachment handling
│       └── index.js                 # Component exports
├── tests/
│   └── messagingTest.js             # Testing utilities
└── utils/
    └── messaging.js                 # Updated notification handling
```

## 🔧 API Integration

### Endpoints Added to Config
```javascript
// Messaging API Endpoints
GET_CONVERSATIONS: '/messaging/conversations',
GET_CONVERSATION_MESSAGES: '/messaging/conversation/messages',
SEND_MESSAGE: '/messaging/send-message',
CREATE_CONVERSATION: '/messaging/create-conversation',
GET_AVAILABLE_USERS: '/messaging/available-users',
SEARCH_MESSAGES: '/messaging/search',
MARK_MESSAGES_READ: '/messaging/mark-read',
UPLOAD_MESSAGE_ATTACHMENT: '/messaging/upload-attachment',
```

### Service Functions
- `getConversations()` - Fetch user's conversations
- `getConversationMessages(uuid, page, limit)` - Get messages from conversation
- `sendMessage(uuid, content, type, attachment)` - Send a message
- `createConversation(topic, members)` - Create new conversation
- `getAvailableUsers(userType)` - Get users available for messaging
- `searchMessages(query, type)` - Search conversations and messages
- `markMessagesAsRead(uuid)` - Mark conversation messages as read
- `uploadMessageAttachment(file)` - Upload file attachment

## 🎨 Components

### MessageBubble
Displays individual messages with:
- Sender information
- Message content
- Timestamps
- Attachment support
- Own/other message styling

### ConversationItem
Shows conversation in list with:
- Conversation topic
- Last message preview
- Member count
- Unread badge
- Timestamp

### UserSelector
User selection interface with:
- User avatar/icon
- Name and role
- Email and branch info
- Selection state
- Disabled state support

### AttachmentHandler
File attachment functionality:
- Camera capture
- Photo library selection
- Document picker
- File upload with progress
- File type validation

## 📱 Navigation Integration

### Teacher Access
- Added messaging tile to TeacherScreen quick actions
- Navigation: `TeacherScreen` → `TeacherMessagingScreen` → `ConversationScreen`

### Student Access
- Enabled messaging in ParentScreen menu items
- Navigation: `ParentScreen` → `StudentMessagingScreen` → `ConversationScreen`

### Navigation Stack
All messaging screens added to App.js navigation stack:
- `TeacherMessagingScreen`
- `StudentMessagingScreen`
- `ConversationScreen`
- `CreateConversationScreen`
- `StudentCreateConversationScreen`

## 🔔 Notification Integration

### Enhanced Notification Handling
Updated `handleNotificationNavigation` in `src/utils/messaging.js` to support:
- Direct navigation to specific conversations
- Fallback to messaging screens
- Role-based navigation parameters

### Message Notification Flow
1. User receives message notification
2. Taps notification to open app
3. App navigates directly to conversation
4. Messages marked as read automatically

## 🧪 Testing

### Test File: `src/tests/messagingTest.js`
Includes tests for:
- Service function calls
- Component data validation
- Error handling
- API response validation

### Running Tests
```javascript
import { runAllMessagingTests } from '../tests/messagingTest';

// Run all tests
const results = await runAllMessagingTests();
console.log('Test results:', results);
```

## 🔒 Security & Permissions

### Role-based Access
- **Teachers**: Can message students and other staff in their branch
- **Students**: Can message teachers and classmates
- **Branch Isolation**: Users can only message within their branch

### Authentication
- All API calls require `authCode` parameter
- Authentication handled automatically by service layer
- Stored in AsyncStorage for persistence

## 📋 Usage Examples

### Creating a Conversation
```javascript
import { createConversation } from '../services/messagingService';

const newConversation = await createConversation(
  'Math Homework Discussion',
  [teacherId, studentId1, studentId2]
);
```

### Sending a Message
```javascript
import { sendMessage } from '../services/messagingService';

const message = await sendMessage(
  conversationUuid,
  'Hello, how can I help you?',
  'text'
);
```

### Using Components
```javascript
import { MessageBubble, ConversationItem } from '../components/messaging';

// In your render function
<MessageBubble
  message={messageData}
  isOwnMessage={true}
  showSender={false}
  onAttachmentPress={handleAttachmentPress}
/>
```

## 🚨 Known Limitations

1. **File Upload**: Requires `expo-image-picker` dependency (not yet added)
2. **Real-time Updates**: No WebSocket implementation (uses polling)
3. **Message Encryption**: Messages are not encrypted in transit
4. **Offline Support**: No offline message queuing

## 🔄 Future Enhancements

1. **Real-time Updates**: Implement WebSocket for live messaging
2. **Message Reactions**: Add emoji reactions to messages
3. **Message Threading**: Support for threaded conversations
4. **Voice Messages**: Audio message support
5. **Message Encryption**: End-to-end encryption
6. **Offline Support**: Queue messages when offline

## 📞 Support

For issues or questions about the messaging implementation:
1. Check the test file for debugging utilities
2. Review API documentation for endpoint details
3. Verify authentication and permissions
4. Check console logs for detailed error messages
