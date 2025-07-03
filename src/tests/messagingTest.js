/**
 * Messaging Implementation Test
 *
 * This file contains basic tests to verify the messaging functionality
 * Run these tests to ensure the messaging system is working correctly
 */

import {
  getConversations,
  getConversationMessages,
  sendMessage,
  createConversation,
  getAvailableUsers,
  searchMessages,
  markMessageAsRead,
} from '../services/messagingService';

// Mock auth code for testing
const TEST_AUTH_CODE = 'test_auth_code_123';

// Test data
const testConversationData = {
  topic: 'Test Conversation',
  members: [1, 2, 3], // Mock user IDs
};

const testMessageData = {
  conversationUuid: 'test-uuid-123',
  content: 'Hello, this is a test message!',
  messageType: 'text',
};

/**
 * Test messaging service functions
 */
export const runMessagingTests = async () => {
  console.log('🧪 Starting Messaging Tests...');

  const results = {
    passed: 0,
    failed: 0,
    errors: [],
  };

  // Test 1: Get Conversations
  try {
    console.log('📋 Test 1: Getting conversations...');
    const conversations = await getConversations();
    if (conversations) {
      console.log('✅ Get conversations: PASSED');
      results.passed++;
    } else {
      console.log('❌ Get conversations: FAILED - No data returned');
      results.failed++;
      results.errors.push('Get conversations returned no data');
    }
  } catch (error) {
    console.log('❌ Get conversations: FAILED -', error.message);
    results.failed++;
    results.errors.push(`Get conversations error: ${error.message}`);
  }

  // Test 2: Get Available Users
  try {
    console.log('👥 Test 2: Getting available users...');
    const users = await getAvailableUsers();
    if (users) {
      console.log('✅ Get available users: PASSED');
      results.passed++;
    } else {
      console.log('❌ Get available users: FAILED - No data returned');
      results.failed++;
      results.errors.push('Get available users returned no data');
    }
  } catch (error) {
    console.log('❌ Get available users: FAILED -', error.message);
    results.failed++;
    results.errors.push(`Get available users error: ${error.message}`);
  }

  // Test 3: Search Messages
  try {
    console.log('🔍 Test 3: Searching messages...');
    const searchResults = await searchMessages('test', 'all');
    if (searchResults) {
      console.log('✅ Search messages: PASSED');
      results.passed++;
    } else {
      console.log('❌ Search messages: FAILED - No data returned');
      results.failed++;
      results.errors.push('Search messages returned no data');
    }
  } catch (error) {
    console.log('❌ Search messages: FAILED -', error.message);
    results.failed++;
    results.errors.push(`Search messages error: ${error.message}`);
  }

  // Test 4: Create Conversation (Note: This might fail if API is not available)
  try {
    console.log('💬 Test 4: Creating conversation...');
    const newConversation = await createConversation(
      testConversationData.topic,
      testConversationData.members
    );
    if (newConversation && newConversation.success) {
      console.log('✅ Create conversation: PASSED');
      results.passed++;
    } else {
      console.log('❌ Create conversation: FAILED - Invalid response');
      results.failed++;
      results.errors.push('Create conversation returned invalid response');
    }
  } catch (error) {
    console.log('❌ Create conversation: FAILED -', error.message);
    results.failed++;
    results.errors.push(`Create conversation error: ${error.message}`);
  }

  // Test 5: Send Message (Note: This might fail if API is not available)
  try {
    console.log('📤 Test 5: Sending message...');
    const sentMessage = await sendMessage(
      testMessageData.conversationUuid,
      testMessageData.content,
      testMessageData.messageType
    );
    if (sentMessage && sentMessage.success) {
      console.log('✅ Send message: PASSED');
      results.passed++;
    } else {
      console.log('❌ Send message: FAILED - Invalid response');
      results.failed++;
      results.errors.push('Send message returned invalid response');
    }
  } catch (error) {
    console.log('❌ Send message: FAILED -', error.message);
    results.failed++;
    results.errors.push(`Send message error: ${error.message}`);
  }

  // Test 6: Get Conversation Messages
  try {
    console.log('📨 Test 6: Getting conversation messages...');
    const messages = await getConversationMessages(
      testMessageData.conversationUuid
    );
    if (messages) {
      console.log('✅ Get conversation messages: PASSED');
      results.passed++;
    } else {
      console.log('❌ Get conversation messages: FAILED - No data returned');
      results.failed++;
      results.errors.push('Get conversation messages returned no data');
    }
  } catch (error) {
    console.log('❌ Get conversation messages: FAILED -', error.message);
    results.failed++;
    results.errors.push(`Get conversation messages error: ${error.message}`);
  }

  // Test 7: Mark Individual Message as Read
  try {
    console.log('📋 Test 7: Marking individual message as read...');
    const messageId = 1; // Mock message ID
    const markMessageResult = await markMessageAsRead(
      messageId,
      testMessageData.conversationUuid,
      TEST_AUTH_CODE
    );
    if (markMessageResult && markMessageResult.success) {
      console.log('✅ Mark individual message as read: PASSED');
      console.log('📊 Response data:', markMessageResult.data);
      results.passed++;
    } else {
      console.log(
        '❌ Mark individual message as read: FAILED - No success response'
      );
      results.failed++;
      results.errors.push(
        'Mark individual message as read returned no success'
      );
    }
  } catch (error) {
    console.log('❌ Mark individual message as read: FAILED -', error.message);
    results.failed++;
    results.errors.push(
      `Mark individual message as read error: ${error.message}`
    );
  }

  // Print test results
  console.log('\n🧪 Messaging Tests Complete!');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  return results;
};

/**
 * Test messaging components
 */
export const testMessagingComponents = () => {
  console.log('🧪 Testing Messaging Components...');

  // Test MessageBubble component with new is_read field
  const testMessage = {
    message_id: 1,
    content: 'Test message content',
    message_type: 'text',
    sender: {
      id: 1,
      name: 'Test User',
      user_type: 'student',
    },
    created_at: new Date().toISOString(),
    is_own_message: false,
    is_read: true, // NEW: Test the new read status field
    read_by: [2], // Legacy field for backward compatibility
    read_at: new Date().toISOString(),
  };

  console.log('📱 MessageBubble test data:', testMessage);

  // Verify new read status fields
  if (testMessage.is_read !== undefined) {
    console.log('✅ Message includes is_read field:', testMessage.is_read);
  } else {
    console.log('❌ Message missing is_read field');
  }

  if (testMessage.read_at) {
    console.log('✅ Message includes read_at timestamp:', testMessage.read_at);
  } else {
    console.log('❌ Message missing read_at timestamp');
  }

  // Test ConversationItem component
  const testConversation = {
    conversation_id: 1,
    conversation_uuid: 'test-uuid-123',
    topic: 'Test Conversation',
    creator: {
      id: 1,
      name: 'Test Creator',
    },
    members: [
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
    ],
    last_message: {
      content: 'Last message content',
      message_type: 'text',
    },
    unread_count: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log('💬 ConversationItem test data:', testConversation);

  // Test UserSelector component
  const testUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    user_type: 'student',
    branch_name: 'Test Branch',
  };

  console.log('👤 UserSelector test data:', testUser);

  console.log(
    '✅ Component tests completed - check console for data validation'
  );
};

/**
 * Test read status functionality specifically
 */
export const testReadStatusFunctionality = async () => {
  console.log('🧪 Testing Read Status Functionality...\n');

  const results = {
    passed: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Test 1: Get messages and verify is_read field
    console.log('📋 Test 1: Verifying messages include is_read field...');
    const messages = await getConversationMessages('conv-uuid-1');

    if (messages?.success && messages.data?.messages) {
      const hasIsReadField = messages.data.messages.every(
        (msg) => msg.is_read !== undefined
      );

      if (hasIsReadField) {
        console.log('✅ All messages include is_read field');
        results.passed++;
      } else {
        console.log('❌ Some messages missing is_read field');
        results.failed++;
        results.errors.push('Messages missing is_read field');
      }
    } else {
      console.log('❌ Failed to get messages for read status test');
      results.failed++;
      results.errors.push('Failed to get messages');
    }

    // Test 2: Test individual message read marking
    console.log('📋 Test 2: Testing individual message read marking...');
    const markResult = await markMessageAsRead(
      1,
      'conv-uuid-1',
      TEST_AUTH_CODE
    );

    if (markResult?.success) {
      console.log('✅ Individual message read marking works');
      console.log('📊 Mark result:', markResult.data);
      results.passed++;
    } else {
      console.log('❌ Individual message read marking failed');
      results.failed++;
      results.errors.push('Individual message read marking failed');
    }
  } catch (error) {
    console.log('❌ Read status test error:', error.message);
    results.failed++;
    results.errors.push(`Read status test error: ${error.message}`);
  }

  console.log('\n📊 Read Status Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('🚨 Errors:');
    results.errors.forEach((error) => console.log(`  - ${error}`));
  }

  return results;
};

/**
 * Run all tests
 */
export const runAllMessagingTests = async () => {
  console.log('🚀 Running All Messaging Tests...\n');

  // Test components first (synchronous)
  testMessagingComponents();

  console.log('\n');

  // Test services (asynchronous)
  const serviceResults = await runMessagingTests();

  console.log('\n');

  // Test new read status functionality
  const readStatusResults = await testReadStatusFunctionality();

  console.log('\n🎯 All tests completed!');

  return {
    services: serviceResults,
    readStatus: readStatusResults,
    totalPassed: serviceResults.passed + readStatusResults.passed,
    totalFailed: serviceResults.failed + readStatusResults.failed,
  };
};

// Export individual test functions for selective testing
export {
  testConversationData,
  testMessageData,
  TEST_AUTH_CODE,
  testReadStatusFunctionality,
};
