/**
 * Messaging Service
 * Handles all messaging-related API calls including conversations, messages, and file uploads
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config, buildApiUrl } from '../config/env';

// Temporary flag for testing with mock data
const USE_MOCK_DATA = false; // Set to false when backend API is ready

// Mock data for testing
const mockConversations = [
  {
    conversation_id: 1,
    conversation_uuid: 'conv-uuid-1',
    topic: 'Math Homework Discussion',
    creator: {
      id: 1,
      name: 'John Teacher',
    },
    members: [
      { id: 1, name: 'John Teacher', user_type: 'staff', photo: null },
      { id: 2, name: 'Jane Student', user_type: 'student', photo: null },
      { id: 3, name: 'Bob Student', user_type: 'student', photo: null },
    ],
    grouped_members: [
      {
        type: 'staff',
        type_label: 'Staff',
        count: 1,
        members: [
          {
            id: 1,
            name: 'John Teacher',
            user_type: 'staff',
            photo: null,
            email: 'john@school.edu',
            branch_id: 1,
          },
        ],
      },
      {
        type: 'student',
        type_label: 'Student',
        count: 2,
        members: [
          {
            id: 2,
            name: 'Jane Student',
            user_type: 'student',
            photo: null,
            email: 'jane@school.edu',
            branch_id: 1,
          },
          {
            id: 3,
            name: 'Bob Student',
            user_type: 'student',
            photo: null,
            email: 'bob@school.edu',
            branch_id: 1,
          },
        ],
      },
    ],
    last_message: {
      message_id: 3,
      content:
        '<p>Thank you! Let me know if you need any help.</p><br/><strong>Additional resources:</strong><ul><li>Chapter 5 examples</li><li>Practice problems</li></ul>',
      sender_id: 1,
      created_at: new Date().toISOString(),
      message_type: 'text',
    },
    unread_count: 2,
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updated_at: new Date().toISOString(),
  },
  {
    conversation_id: 2,
    conversation_uuid: 'conv-uuid-2',
    topic: 'Science Project Help',
    creator: {
      id: 4,
      name: 'Sarah Teacher',
    },
    members: [
      { id: 4, name: 'Sarah Teacher', user_type: 'staff', photo: null },
      { id: 2, name: 'Jane Student', user_type: 'student', photo: null },
    ],
    grouped_members: [
      {
        type: 'staff',
        type_label: 'Staff',
        count: 1,
        members: [
          {
            id: 4,
            name: 'Sarah Teacher',
            user_type: 'staff',
            photo: null,
            email: 'sarah@school.edu',
            branch_id: 1,
          },
        ],
      },
      {
        type: 'student',
        type_label: 'Student',
        count: 1,
        members: [
          {
            id: 2,
            name: 'Jane Student',
            user_type: 'student',
            photo: null,
            email: 'jane@school.edu',
            branch_id: 1,
          },
        ],
      },
    ],
    last_message: {
      message_id: 5,
      content:
        '<p>Of course! What specific part do you need help with?</p><p>Here are some <em>helpful tips</em>:</p><ol><li>Start with the hypothesis</li><li>Gather your materials</li><li>Document everything</li></ol>',
      sender_id: 4,
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      message_type: 'text',
    },
    unread_count: 0,
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

const mockUsers = [
  {
    id: 1,
    name: 'John Teacher',
    email: 'john@school.edu',
    user_type: 'staff',
    photo: 'https://sis.bfi.edu.mm/path/to/john.jpg',
    branch_id: 1,
  },
  {
    id: 4,
    name: 'Sarah Teacher',
    email: 'sarah@school.edu',
    user_type: 'staff',
    photo: 'https://sis.bfi.edu.mm/path/to/sarah.jpg',
    branch_id: 1,
  },
  {
    id: 2,
    name: 'Jane Student',
    email: 'jane@school.edu',
    user_type: 'student',
    photo: 'https://sis.bfi.edu.mm/path/to/jane.jpg',
    branch_id: 1,
  },
  {
    id: 3,
    name: 'Bob Student',
    email: 'bob@school.edu',
    user_type: 'student',
    photo: 'https://sis.bfi.edu.mm/path/to/bob.jpg',
    branch_id: 1,
  },
  {
    id: 5,
    name: 'Mary Parent',
    email: 'mary.parent@email.com',
    user_type: 'parent',
    photo: 'https://sis.bfi.edu.mm/path/to/mary.jpg',
    branch_id: 1,
  },
  {
    id: 6,
    name: 'David Parent',
    email: 'david.parent@email.com',
    user_type: 'parent',
    photo: null,
    branch_id: 1,
  },
  {
    id: 7,
    name: 'Dr. Smith',
    email: 'principal@school.edu',
    user_type: 'staff',
    role: 'head_of_section',
    photo:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    branch_id: 1,
  },
  {
    id: 8,
    name: 'Ms. Johnson',
    email: 'director@school.edu',
    user_type: 'staff',
    role: 'head_of_section',
    photo:
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    branch_id: 1,
  },
  {
    id: 9,
    name: 'Mr. Wilson',
    email: 'head.section@school.edu',
    user_type: 'staff',
    role: 'head_of_section',
    photo: null,
    branch_id: 1,
  },
];

const mockMessages = {
  'conv-uuid-1': [
    {
      message_id: 1,
      content: 'Please submit your homework by Friday',
      message_type: 'text',
      attachment_url: null,
      sender: {
        id: 1,
        name: 'John Teacher',
        user_type: 'staff',
        photo: null,
      },
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      is_own_message: false, // This would be determined by the current user
      is_read: true, // NEW: Message has been read by current user
      read_by: [2], // User ID 2 (student) has read this message
      read_at: new Date(Date.now() - 3000000).toISOString(), // Read 50 minutes ago
    },
    {
      message_id: 2,
      content: 'Sure, I will submit it by tomorrow.',
      message_type: 'text',
      attachment_url: null,
      sender: {
        id: 2,
        name: 'Jane Student',
        user_type: 'student',
        photo: null,
      },
      created_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      is_own_message: true, // This is the current user's message
      is_read: true, // NEW: Own messages are automatically read
      read_by: [1], // User ID 1 (teacher) has read this message
      read_at: new Date(Date.now() - 1200000).toISOString(), // Read 20 minutes ago
    },
    {
      message_id: 3,
      content:
        '<p>Thank you! Let me know if you need any help.</p><br/><strong>Additional resources:</strong><ul><li>Chapter 5 examples</li><li>Practice problems</li></ul>',
      message_type: 'text',
      attachment_url: null,
      sender: {
        id: 1,
        name: 'John Teacher',
        user_type: 'staff',
        photo: null,
      },
      created_at: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
      is_own_message: false, // This would be determined by the current user
      is_read: false, // NEW: Message is unread by current user
      read_by: [], // Not read yet - this will show as unread
      read_at: null,
    },
  ],
  'conv-uuid-2': [
    {
      message_id: 4,
      content: 'Can you help me with the science project?',
      message_type: 'text',
      attachment_url: null,
      sender: {
        id: 2,
        name: 'Jane Student',
        user_type: 'student',
        photo: null,
      },
      created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      is_own_message: true, // This is the current user's message
      is_read: true, // NEW: Own messages are automatically read
      read_by: [4], // User ID 4 (teacher) has read this message
      read_at: new Date(Date.now() - 6000000).toISOString(), // Read 1.7 hours ago
    },
    {
      message_id: 5,
      content:
        '<p>Of course! What specific part do you need help with?</p><p>Here are some <em>helpful tips</em>:</p><ol><li>Start with the hypothesis</li><li>Gather your materials</li><li>Document everything</li></ol>',
      message_type: 'text',
      attachment_url: null,
      sender: {
        id: 4,
        name: 'Sarah Teacher',
        user_type: 'staff',
        photo: null,
      },
      created_at: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
      is_own_message: false, // This would be determined by the current user
      is_read: true, // NEW: Message has been read by current user
      read_by: [2], // User ID 2 (student) has read this message
      read_at: new Date(Date.now() - 4800000).toISOString(), // Read 1.3 hours ago
    },
    {
      message_id: 6,
      content: 'Thank you for the explanation!',
      message_type: 'text',
      attachment_url: null,
      sender: {
        id: 2,
        name: 'Jane Student',
        user_type: 'student',
        photo: null,
      },
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      is_own_message: true, // This is the current user's message
      is_read: true, // NEW: Own messages are automatically read
      read_by: [], // Not read yet by teacher
      read_at: null,
    },
  ],
};

// Helper function to get auth code from storage
const getAuthCode = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      return user.authCode || user.auth_code;
    }
    return null;
  } catch (error) {
    console.error('Error getting auth code:', error);
    return null;
  }
};

// Helper function to get current user ID from storage
const getCurrentUserId = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id || user.user_id || 2; // Default to 2 for mock data
    }
    return 2; // Default mock user ID
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return 2; // Default mock user ID
  }
};

// Helper function to make API requests
const makeApiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      timeout: Config.NETWORK.TIMEOUT,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Get all conversations for the authenticated user
 * @param {string} customAuthCode - Optional custom auth code to use instead of stored one
 * @returns {Promise<Object>} - Conversations data
 */
export const getConversations = async (customAuthCode = null) => {
  try {
    const authCode = customAuthCode || (await getAuthCode());
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Return mock data for testing
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

      // Calculate user-specific unread counts
      const currentUserId = await getCurrentUserId();
      const conversationsWithUserSpecificUnread = mockConversations.map(
        (conv) => {
          // Calculate unread count for current user
          const messages = mockMessages[conv.conversation_uuid] || [];
          const unreadCount = messages.filter((msg) => {
            // Message is unread if:
            // 1. It's not from the current user
            // 2. Current user is not in the read_by array
            return (
              msg.sender.id !== currentUserId &&
              (!msg.read_by || !msg.read_by.includes(currentUserId))
            );
          }).length;

          return {
            ...conv,
            unread_count: unreadCount,
          };
        }
      );

      return {
        success: true,
        data: {
          conversations: conversationsWithUserSpecificUnread,
          total_count: conversationsWithUserSpecificUnread.length,
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_CONVERSATIONS, {
      authCode,
    });
    return await makeApiRequest(url);
  } catch (error) {
    console.error('Error fetching conversations:', error);

    // Fallback to mock data if API fails
    if (!USE_MOCK_DATA) {
      console.log('API failed, falling back to mock data');
      return {
        success: true,
        data: {
          conversations: mockConversations,
          total_count: mockConversations.length,
        },
      };
    }

    throw error;
  }
};

/**
 * Get messages from a specific conversation
 * @param {string} conversationUuid - UUID of the conversation
 * @param {number} page - Page number for pagination (default: 1)
 * @param {number} limit - Messages per page (default: 50)
 * @param {string} userAuthCode - Optional authCode to use instead of getting from storage
 * @returns {Promise<Object>} - Messages data
 */
export const getConversationMessages = async (
  conversationUuid,
  page = 1,
  limit = 50,
  userAuthCode = null
) => {
  try {
    const authCode = userAuthCode || (await getAuthCode());
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Return mock data for testing
      await new Promise((resolve) => setTimeout(resolve, 400)); // Simulate network delay

      const messages = mockMessages[conversationUuid] || [];
      const currentUserId = await getCurrentUserId();

      // Ensure all messages have the is_read field for consistency
      const messagesWithReadStatus = messages.map((msg) => ({
        ...msg,
        is_read:
          msg.is_read !== undefined
            ? msg.is_read
            : msg.read_by?.includes(currentUserId) || false,
      }));

      return {
        success: true,
        data: {
          conversation: {
            id: 1,
            uuid: conversationUuid,
            topic: 'Mock Conversation',
          },
          messages: messagesWithReadStatus,
          pagination: {
            current_page: page,
            per_page: limit,
            total_messages: messagesWithReadStatus.length,
            total_pages: Math.ceil(messagesWithReadStatus.length / limit),
            has_more: false, // For simplicity, assume all messages fit in one page
          },
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_CONVERSATION_MESSAGES, {
      authCode,
      conversation_uuid: conversationUuid,
      page,
      limit,
    });
    return await makeApiRequest(url);
  } catch (error) {
    console.error('Error fetching conversation messages:', error);

    // Fallback to mock data if API fails
    if (!USE_MOCK_DATA) {
      console.log('API failed, falling back to mock data for messages');
      const messages = mockMessages[conversationUuid] || [];

      return {
        success: true,
        data: {
          conversation: {
            id: 1,
            uuid: conversationUuid,
            topic: 'Mock Conversation',
          },
          messages: messages,
          pagination: {
            current_page: page,
            per_page: limit,
            total_messages: messages.length,
            total_pages: Math.ceil(messages.length / limit),
            has_more: false,
          },
        },
      };
    }

    throw error;
  }
};

/**
 * Send a message to a conversation
 * @param {string} conversationUuid - UUID of the conversation
 * @param {string} messageContent - Message text content
 * @param {string} messageType - Type of message (default: "text")
 * @param {string} attachmentUrl - Optional attachment URL
 * @param {string} userAuthCode - Optional authCode to use instead of getting from storage
 * @returns {Promise<Object>} - Response data
 */
export const sendMessage = async (
  conversationUuid,
  messageContent,
  messageType = 'text',
  attachmentUrl = null,
  userAuthCode = null
) => {
  try {
    const authCode = userAuthCode || (await getAuthCode());
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Simulate sending message with mock data
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay

      const newMessage = {
        message_id: Date.now(), // Simple ID generation
        content: messageContent,
        message_type: messageType,
        attachment_url: attachmentUrl,
        sender: {
          id: 2, // Assume current user is student with ID 2
          name: 'Current User',
          user_type: 'student',
          photo: null,
        },
        created_at: new Date().toISOString(),
        is_own_message: true,
        is_read: true, // NEW: Sender automatically reads their own message
        read_by: [2], // NEW: Add sender to read_by array
        read_at: new Date().toISOString(), // NEW: Set read timestamp
      };

      // Add to mock messages (in real app, this would be handled by the server)
      if (!mockMessages[conversationUuid]) {
        mockMessages[conversationUuid] = [];
      }
      mockMessages[conversationUuid].push(newMessage);

      return {
        success: true,
        message: 'Message sent successfully',
        data: {
          message_id: newMessage.message_id,
          conversation_uuid: conversationUuid,
          content: newMessage.content,
          message_type: newMessage.message_type,
          created_at: newMessage.created_at,
          sender: newMessage.sender,
          message: newMessage, // Keep full message for backward compatibility
        },
        notifications: [
          {
            user_id: 1, // Mock notification
            notification_sent: true,
          },
        ],
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SEND_MESSAGE);
    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        conversation_uuid: conversationUuid,
        message_content: messageContent,
        message_type: messageType,
        attachment_url: attachmentUrl,
      }),
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Create a new conversation
 * @param {string} topic - Conversation topic/title
 * @param {Array<number>} members - Array of user IDs to include
 * @param {string} userType - Type of user creating the conversation ('student' or 'staff')
 * @param {string} userAuthCode - Optional authCode to use instead of getting from storage
 * @returns {Promise<Object>} - Response data
 */
export const createConversation = async (
  topic,
  members,
  userType = null,
  userAuthCode = null
) => {
  try {
    const authCode = userAuthCode || (await getAuthCode());
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Simulate creating conversation with mock data
      await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate network delay

      const newConversationUuid = `conv-uuid-${Date.now()}`;
      const memberObjects = members
        .map((memberId) => {
          const user = mockUsers.find((u) => u.id === memberId);
          return user
            ? {
                id: user.id,
                name: user.name,
                user_type: user.user_type,
              }
            : null;
        })
        .filter(Boolean);

      // Add current user to members
      const currentUser = { id: 2, name: 'Current User', user_type: 'student' };
      const allMembers = [currentUser, ...memberObjects];

      // Group members by type for the new API structure
      const groupedMembers = {
        staff: allMembers.filter((member) => member.user_type === 'staff'),
        students: allMembers.filter((member) => member.user_type === 'student'),
      };

      const newConversation = {
        conversation_id: Date.now(),
        conversation_uuid: newConversationUuid,
        topic: topic,
        creator: {
          id: 2, // Assume current user is student with ID 2
          name: 'Current User',
        },
        members: groupedMembers,
        last_message: null,
        unread_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add to mock conversations (in real app, this would be handled by the server)
      mockConversations.push(newConversation);

      // Initialize empty messages array for this conversation
      mockMessages[newConversationUuid] = [];

      return {
        success: true,
        data: {
          conversation: newConversation,
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.CREATE_CONVERSATION);
    const requestBody = {
      authCode,
      topic,
      members,
    };

    // Include user_type if provided
    if (userType) {
      requestBody.user_type = userType;
    }

    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

/**
 * Get available users that can be messaged (now returns grouped users)
 * @param {string} userType - Optional filter by user type ("student", "staff")
 * @returns {Promise<Object>} - Grouped available users data
 */
export const getAvailableUsers = async (userType = null) => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Return mock data for testing with grouped structure
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay

      let filteredUsers = mockUsers;
      if (userType) {
        filteredUsers = mockUsers.filter((user) => user.user_type === userType);
      }

      // Group users by type for the new API structure
      const groupedUsers = [
        {
          type: 'staff',
          type_label: 'Staff',
          count: filteredUsers.filter((user) => user.user_type === 'staff')
            .length,
          users: filteredUsers.filter((user) => user.user_type === 'staff'),
        },
        {
          type: 'student',
          type_label: 'Student',
          count: filteredUsers.filter((user) => user.user_type === 'student')
            .length,
          users: filteredUsers.filter((user) => user.user_type === 'student'),
        },
        {
          type: 'parent',
          type_label: 'Parent',
          count: filteredUsers.filter((user) => user.user_type === 'parent')
            .length,
          users: filteredUsers.filter((user) => user.user_type === 'parent'),
        },
      ].filter((group) => group.count > 0);

      return {
        success: true,
        data: {
          grouped_users: groupedUsers,
          total_count: filteredUsers.length,
          users: filteredUsers, // Flat list for backward compatibility
        },
      };
    }

    const params = { authCode };
    if (userType) {
      params.user_type = userType; // Optional filter for returned users
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_AVAILABLE_USERS, params);
    return await makeApiRequest(url);
  } catch (error) {
    console.error('Error fetching available users:', error);

    // Fallback to mock data if API fails
    if (!USE_MOCK_DATA) {
      console.log('API failed, falling back to mock data for users');
      let filteredUsers = mockUsers;
      if (userType) {
        filteredUsers = mockUsers.filter((user) => user.user_type === userType);
      }

      // Group users by type for fallback
      const groupedUsers = [
        {
          type: 'staff',
          type_label: 'Staff',
          count: filteredUsers.filter((user) => user.user_type === 'staff')
            .length,
          users: filteredUsers.filter((user) => user.user_type === 'staff'),
        },
        {
          type: 'student',
          type_label: 'Student',
          count: filteredUsers.filter((user) => user.user_type === 'student')
            .length,
          users: filteredUsers.filter((user) => user.user_type === 'student'),
        },
        {
          type: 'parent',
          type_label: 'Parent',
          count: filteredUsers.filter((user) => user.user_type === 'parent')
            .length,
          users: filteredUsers.filter((user) => user.user_type === 'parent'),
        },
      ].filter((group) => group.count > 0);

      return {
        success: true,
        data: {
          grouped_users: groupedUsers,
          total_count: filteredUsers.length,
          users: filteredUsers, // Flat list for backward compatibility
        },
      };
    }

    throw error;
  }
};

/**
 * Get available users for students (restricted access)
 * Students can only message: homeroom teacher, subject teachers, head of section, librarian, classmates
 * @param {string} userType - Optional filter by user type
 * @param {string} studentAuthCode - Optional student authCode to use instead of getting from storage
 * @returns {Promise<Object>} - Available users data for students
 */
export const getAvailableUsersForStudent = async (
  userType = null,
  studentAuthCode = null
) => {
  try {
    const authCode = studentAuthCode || (await getAuthCode());
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Return mock data for testing with student restrictions
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay

      // Mock restricted users for students
      const restrictedUsers = [
        {
          id: 1,
          name: 'Homeroom Teacher',
          user_type: 'staff',
          role: 'homeroom_teacher',
          email: 'homeroom@school.edu',
          photo:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          branch_id: 1,
        },
        {
          id: 2,
          name: 'Math Teacher',
          user_type: 'staff',
          role: 'subject_teacher',
          email: 'math@school.edu',
          photo: null, // This will show icon
          branch_id: 1,
        },
        // Removed classmate mock data - students should primarily contact staff
        {
          id: 5,
          name: 'Head of Primary Section',
          user_type: 'staff',
          role: 'head_of_section',
          email: 'head.primary@school.edu',
          photo:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          branch_id: 1, // Same branch as demo student
        },
        {
          id: 6,
          name: 'Head of Secondary Section',
          user_type: 'staff',
          role: 'head_of_section',
          email: 'head.secondary@school.edu',
          photo:
            'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
          branch_id: 2, // Different branch - should be filtered out
        },
        {
          id: 7,
          name: 'Head of High School Section',
          user_type: 'staff',
          role: 'head_of_section',
          email: 'head.highschool@school.edu',
          photo: null, // This will show icon
          branch_id: 1, // Same branch as demo student
        },
        {
          id: 8,
          name: 'School Principal',
          user_type: 'staff',
          role: 'head_of_section',
          email: 'principal@school.edu',
          photo:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          branch_id: 1, // Same branch as demo student
        },
        {
          id: 9,
          name: 'Academic Director',
          user_type: 'staff',
          role: 'head_of_section',
          email: 'director@school.edu',
          photo:
            'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
          branch_id: 1, // Same branch as demo student
        },
      ];

      let filteredUsers = restrictedUsers;
      if (userType) {
        filteredUsers = restrictedUsers.filter(
          (user) => user.user_type === userType
        );
      }

      // Helper function to check if user is head of school
      const isHeadOfSchool = (user) => {
        return (
          user.role === 'head_of_section' &&
          user.email &&
          (user.email.toLowerCase().includes('principal') ||
            user.email.toLowerCase().includes('director'))
        );
      };

      // Group users by their relationship to the student
      const groupedUsers = [
        {
          type: 'head_of_school',
          type_label: 'Head of School',
          count: filteredUsers.filter(isHeadOfSchool).length,
          users: filteredUsers.filter(isHeadOfSchool),
        },
        {
          type: 'homeroom_teacher',
          type_label: 'Homeroom Teacher',
          count: filteredUsers.filter(
            (user) => user.role === 'homeroom_teacher'
          ).length,
          users: filteredUsers.filter(
            (user) => user.role === 'homeroom_teacher'
          ),
        },
        {
          type: 'subject_teacher',
          type_label: 'Subject Teachers',
          count: filteredUsers.filter((user) => user.role === 'subject_teacher')
            .length,
          users: filteredUsers.filter(
            (user) => user.role === 'subject_teacher'
          ),
        },
        {
          type: 'head_of_section',
          type_label: 'Head of Section',
          count: filteredUsers.filter(
            (user) => user.role === 'head_of_section' && !isHeadOfSchool(user)
          ).length,
          users: filteredUsers.filter(
            (user) => user.role === 'head_of_section' && !isHeadOfSchool(user)
          ),
        },
        // Removed classmates - students should primarily contact staff, not other students
      ].filter((group) => group.count > 0);

      return {
        success: true,
        data: {
          grouped_users: groupedUsers,
          total_count: filteredUsers.length,
          user_type: 'student',
          access_level: 'restricted',
        },
      };
    }

    const params = {
      authCode,
      user_type: 'student', // Requesting user type
    };
    if (userType) {
      params.filter_user_type = userType; // Optional filter for returned users
    }

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GET_AVAILABLE_USERS_STUDENT,
      params
    );
    return await makeApiRequest(url);
  } catch (error) {
    console.error('Error fetching available users for student:', error);
    throw error;
  }
};

/**
 * Get available users for staff (role-based access)
 * Access depends on staff role: head of school, head of section, homeroom teacher, subject teacher, general staff
 * @param {string} userType - Optional filter by user type
 * @returns {Promise<Object>} - Available users data for staff
 */
export const getAvailableUsersForStaff = async (userType = null) => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Return mock data for testing with staff permissions
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay

      // Mock all users for staff (assuming head of school role)
      let filteredUsers = mockUsers;
      if (userType) {
        filteredUsers = mockUsers.filter((user) => user.user_type === userType);
      }

      // Helper function to check if user is head of school
      const isHeadOfSchool = (user) => {
        return (
          user.role === 'head_of_section' &&
          user.email &&
          (user.email.toLowerCase().includes('principal') ||
            user.email.toLowerCase().includes('director'))
        );
      };

      const groupedUsers = [
        {
          type: 'head_of_school',
          type_label: 'Head of School',
          count: filteredUsers.filter(isHeadOfSchool).length,
          users: filteredUsers.filter(isHeadOfSchool),
        },
        {
          type: 'head_of_section',
          type_label: 'Head of Section',
          count: filteredUsers.filter(
            (user) => user.role === 'head_of_section' && !isHeadOfSchool(user)
          ).length,
          users: filteredUsers.filter(
            (user) => user.role === 'head_of_section' && !isHeadOfSchool(user)
          ),
        },
        {
          type: 'staff',
          type_label: 'Staff',
          count: filteredUsers.filter(
            (user) =>
              user.user_type === 'staff' && user.role !== 'head_of_section'
          ).length,
          users: filteredUsers.filter(
            (user) =>
              user.user_type === 'staff' && user.role !== 'head_of_section'
          ),
        },
        {
          type: 'student',
          type_label: 'Students',
          count: filteredUsers.filter((user) => user.user_type === 'student')
            .length,
          users: filteredUsers.filter((user) => user.user_type === 'student'),
        },
        {
          type: 'parent',
          type_label: 'Parents',
          count: filteredUsers.filter((user) => user.user_type === 'parent')
            .length,
          users: filteredUsers.filter((user) => user.user_type === 'parent'),
        },
      ].filter((group) => group.count > 0);

      return {
        success: true,
        data: {
          grouped_users: groupedUsers,
          total_count: filteredUsers.length,
          user_type: 'staff',
          staff_role: 'head_of_school', // Mock role
          access_level: 'full',
          users: filteredUsers, // Flat list for backward compatibility
        },
      };
    }

    const params = {
      authCode,
      user_type: 'staff', // Requesting user type
    };
    if (userType) {
      params.filter_user_type = userType; // Optional filter for returned users
    }

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GET_AVAILABLE_USERS_STAFF,
      params
    );
    return await makeApiRequest(url);
  } catch (error) {
    console.error('Error fetching available users for staff:', error);
    throw error;
  }
};

/**
 * Get conversation members (NEW endpoint)
 * @param {string} conversationUuid - UUID of the conversation
 * @returns {Promise<Object>} - Grouped conversation members data
 */
export const getConversationMembers = async (conversationUuid) => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Return mock data for testing
      await new Promise((resolve) => setTimeout(resolve, 200)); // Simulate network delay

      // Find the conversation and return its members
      const conversation = mockConversations.find(
        (conv) => conv.conversation_uuid === conversationUuid
      );

      if (conversation && conversation.members) {
        return {
          success: true,
          data: {
            conversation_uuid: conversationUuid,
            grouped_members: conversation.members,
            total_count:
              (conversation.members.staff?.length || 0) +
              (conversation.members.students?.length || 0),
          },
        };
      } else {
        return {
          success: true,
          data: {
            conversation_uuid: conversationUuid,
            grouped_members: { staff: [], students: [] },
            total_count: 0,
          },
        };
      }
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_CONVERSATION_MEMBERS, {
      authCode,
      conversation_uuid: conversationUuid,
    });
    return await makeApiRequest(url);
  } catch (error) {
    console.error('Error fetching conversation members:', error);

    // Fallback to mock data if API fails
    if (!USE_MOCK_DATA) {
      console.log(
        'API failed, falling back to mock data for conversation members'
      );
      const conversation = mockConversations.find(
        (conv) => conv.conversation_uuid === conversationUuid
      );

      if (conversation && conversation.members) {
        return {
          success: true,
          data: {
            conversation_uuid: conversationUuid,
            grouped_members: conversation.members,
            total_count:
              (conversation.members.staff?.length || 0) +
              (conversation.members.students?.length || 0),
          },
        };
      }
    }

    throw error;
  }
};

/**
 * Search conversations and messages
 * @param {string} query - Search query string
 * @param {string} type - Search type ("all", "conversations", "messages")
 * @param {string} customAuthCode - Optional custom auth code to use instead of stored one
 * @returns {Promise<Object>} - Search results
 */
export const searchMessages = async (
  query,
  type = 'all',
  customAuthCode = null
) => {
  try {
    const authCode = customAuthCode || (await getAuthCode());
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Return mock search results for testing
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay

      // Filter mock conversations based on search query
      const filteredConversations = mockConversations.filter((conv) =>
        conv.topic.toLowerCase().includes(query.toLowerCase())
      );

      // Mock messages search (simplified)
      const mockMessages = [];
      if (type === 'all' || type === 'messages') {
        // Add some mock message results
        mockMessages.push({
          type: 'message',
          id: 1,
          content: `Mock message containing "${query}"`,
          conversation_uuid: 'conv-uuid-1',
          conversation_title: 'Math Homework Discussion',
          sender_name: 'John Teacher',
          created_at: new Date().toISOString(),
        });
      }

      return {
        success: true,
        data: {
          conversations: filteredConversations,
          messages: mockMessages,
          query: query,
          type: type,
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SEARCH_MESSAGES, {
      authCode,
      query,
      type,
    });
    return await makeApiRequest(url);
  } catch (error) {
    console.error('Error searching messages:', error);

    // Fallback to mock data if API fails
    if (!USE_MOCK_DATA) {
      console.log('API failed, falling back to mock search data');

      // Filter mock conversations based on search query
      const filteredConversations = mockConversations.filter((conv) =>
        conv.topic.toLowerCase().includes(query.toLowerCase())
      );

      return {
        success: true,
        data: {
          conversations: filteredConversations,
          messages: [],
          query: query,
          type: type,
        },
      };
    }

    throw error;
  }
};

/**
 * Mark messages in a conversation as read
 * @param {string} conversationUuid - UUID of the conversation
 * @param {string} userAuthCode - Optional authCode to use instead of getting from storage
 * @returns {Promise<Object>} - Response data
 */
export const markMessagesAsRead = async (
  conversationUuid,
  userAuthCode = null
) => {
  try {
    const authCode = userAuthCode || (await getAuthCode());
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Simulate marking messages as read with mock data
      await new Promise((resolve) => setTimeout(resolve, 200)); // Simulate network delay

      return {
        success: true,
        data: {
          conversation_uuid: conversationUuid,
          marked_as_read: true,
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.MARK_MESSAGES_READ);
    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        conversation_uuid: conversationUuid,
      }),
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);

    // Fallback to mock success if API fails
    if (!USE_MOCK_DATA) {
      console.log('API failed, falling back to mock success for mark as read');
      return {
        success: true,
        data: {
          conversation_uuid: conversationUuid,
          marked_as_read: true,
        },
      };
    }

    throw error;
  }
};

/**
 * Upload a file attachment for messages
 * @param {Object} file - File object to upload
 * @returns {Promise<Object>} - Upload response data
 */
export const uploadMessageAttachment = async (file) => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    const formData = new FormData();
    formData.append('authCode', authCode);
    formData.append('attachment', file);

    const url = buildApiUrl(Config.API_ENDPOINTS.UPLOAD_MESSAGE_ATTACHMENT);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: Config.NETWORK.TIMEOUT,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading attachment:', error);
    throw error;
  }
};

/**
 * Delete an entire conversation (creator only)
 * @param {string} conversationUuid - UUID of the conversation to delete
 * @param {string} userAuthCode - Optional authCode to use instead of getting from storage
 * @returns {Promise<Object>} - Response data
 */
export const deleteConversation = async (
  conversationUuid,
  userAuthCode = null
) => {
  try {
    const authCode = userAuthCode || (await getAuthCode());
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Simulate deleting conversation with mock data
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay

      // Find and remove conversation from mock data
      const conversationIndex = mockConversations.findIndex(
        (conv) => conv.conversation_uuid === conversationUuid
      );

      if (conversationIndex === -1) {
        return {
          success: false,
          error: 'Conversation not found',
        };
      }

      // Check if current user is the creator (mock check)
      const conversation = mockConversations[conversationIndex];
      if (conversation.creator.id !== 2) {
        // Assume current user ID is 2
        return {
          success: false,
          error: 'Only the conversation creator can delete this conversation',
        };
      }

      // Remove conversation from mock data
      mockConversations.splice(conversationIndex, 1);

      // Remove associated messages
      delete mockMessages[conversationUuid];

      return {
        success: true,
        message: 'Conversation deleted successfully',
        data: {
          conversation_uuid: conversationUuid,
          deleted_at: new Date().toISOString(),
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.DELETE_CONVERSATION);
    return await makeApiRequest(url, {
      method: 'DELETE',
      body: JSON.stringify({
        authCode,
        conversation_uuid: conversationUuid,
      }),
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

/**
 * Leave a conversation (any member can leave)
 * @param {string} conversationUuid - UUID of the conversation to leave
 * @param {string} userAuthCode - Optional authCode to use instead of getting from storage
 * @returns {Promise<Object>} - Response data
 */
export const leaveConversation = async (
  conversationUuid,
  userAuthCode = null
) => {
  try {
    const authCode = userAuthCode || (await getAuthCode());
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Simulate leaving conversation with mock data
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay

      // Find conversation in mock data
      const conversation = mockConversations.find(
        (conv) => conv.conversation_uuid === conversationUuid
      );

      if (!conversation) {
        return {
          success: false,
          error: 'Conversation not found',
        };
      }

      // Remove current user from conversation members (mock implementation)
      const currentUserId = 2; // Assume current user ID is 2

      // Remove from flat members array
      if (conversation.members && Array.isArray(conversation.members)) {
        conversation.members = conversation.members.filter(
          (member) => member.id !== currentUserId
        );
      }

      // Remove from grouped members
      if (
        conversation.grouped_members &&
        Array.isArray(conversation.grouped_members)
      ) {
        conversation.grouped_members.forEach((group) => {
          if (group.members && Array.isArray(group.members)) {
            group.members = group.members.filter(
              (member) => member.id !== currentUserId
            );
            group.count = group.members.length;
          }
        });
        // Remove empty groups
        conversation.grouped_members = conversation.grouped_members.filter(
          (group) => group.count > 0
        );
      }

      return {
        success: true,
        message: 'Left conversation successfully',
        data: {
          conversation_uuid: conversationUuid,
          left_at: new Date().toISOString(),
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.LEAVE_CONVERSATION);
    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        conversation_uuid: conversationUuid,
      }),
    });
  } catch (error) {
    console.error('Error leaving conversation:', error);
    throw error;
  }
};

/**
 * Delete a specific message (sender only, 24h limit)
 * @param {number} messageId - ID of the message to delete
 * @param {string} conversationUuid - UUID of the conversation containing the message
 * @param {string} userAuthCode - Optional authCode to use instead of getting from storage
 * @returns {Promise<Object>} - Response data
 */
export const deleteMessage = async (
  messageId,
  conversationUuid,
  userAuthCode = null
) => {
  try {
    const authCode = userAuthCode || (await getAuthCode());
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Simulate deleting message with mock data
      await new Promise((resolve) => setTimeout(resolve, 200)); // Simulate network delay

      // Find message in mock data
      const conversationMessages = mockMessages[conversationUuid] || [];
      const messageIndex = conversationMessages.findIndex(
        (msg) => msg.message_id === messageId
      );

      if (messageIndex === -1) {
        return {
          success: false,
          error: 'Message not found',
        };
      }

      const message = conversationMessages[messageIndex];

      // Check if current user is the sender (mock check)
      const currentUserId = 2; // Assume current user ID is 2
      if (message.sender.id !== currentUserId) {
        return {
          success: false,
          error: 'You can only delete your own messages',
        };
      }

      // Check 24-hour limit (mock check)
      const messageTime = new Date(message.created_at);
      const now = new Date();
      const hoursDiff = (now - messageTime) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        return {
          success: false,
          error: 'Messages can only be deleted within 24 hours of sending',
        };
      }

      // Remove message from mock data
      conversationMessages.splice(messageIndex, 1);

      return {
        success: true,
        message: 'Message deleted successfully',
        data: {
          message_id: messageId,
          conversation_uuid: conversationUuid,
          deleted_at: new Date().toISOString(),
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.DELETE_MESSAGE);
    return await makeApiRequest(url, {
      method: 'DELETE',
      body: JSON.stringify({
        authCode,
        message_id: messageId,
        conversation_uuid: conversationUuid,
      }),
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

// Mark conversation as read by marking all unread messages as read
export const markConversationAsRead = async (conversationUuid, authCode) => {
  try {
    if (USE_MOCK_DATA) {
      // Mark all unread messages in conversation as read by current user
      const currentUserId = await getCurrentUserId();
      const messages = mockMessages[conversationUuid] || [];
      let markedCount = 0;

      for (const message of messages) {
        if (message.sender.id !== currentUserId && !message.is_read) {
          // Mark unread messages from other users as read
          message.is_read = true;
          message.read_at = new Date().toISOString();

          // Also update legacy read_by array for backward compatibility
          if (!message.read_by) message.read_by = [];
          if (!message.read_by.includes(currentUserId)) {
            message.read_by.push(currentUserId);
          }
          markedCount++;
        }
      }

      console.log(
        `📖 MOCK: Marked ${markedCount} messages as read in conversation ${conversationUuid} for user ${currentUserId}`
      );
      return {
        success: true,
        data: {
          conversation_uuid: conversationUuid,
          messages_marked: markedCount,
          unread_count: 0,
        },
      };
    }

    // Since there's no conversation mark as read endpoint, we need to mark individual messages
    // This would typically be handled by the backend when user enters the conversation
    // For now, we'll return success and let the backend handle it through last read time
    console.log(
      `📖 Conversation ${conversationUuid} read status will be updated by backend`
    );
    return {
      success: true,
      data: {
        conversation_uuid: conversationUuid,
        note: 'Read status updated via last read time tracking',
      },
    };
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    throw error;
  }
};

// Mark specific message as read (NEW API endpoint)
export const markMessageAsRead = async (
  messageId,
  conversationUuid,
  authCode
) => {
  try {
    if (USE_MOCK_DATA) {
      // Update mock message read status using new is_read field
      const currentUserId = await getCurrentUserId();
      const messages = mockMessages[conversationUuid] || [];
      const message = messages.find((msg) => msg.message_id === messageId);
      if (message) {
        // Update the message to be marked as read
        message.is_read = true;
        message.read_at = new Date().toISOString();

        // Also update legacy read_by array for backward compatibility
        if (!message.read_by) message.read_by = [];
        if (!message.read_by.includes(currentUserId)) {
          message.read_by.push(currentUserId);
        }

        console.log(
          `📖 MOCK: Marked message ${messageId} as read by user ${currentUserId}`
        );
        return {
          success: true,
          data: {
            message_id: messageId,
            is_read: true,
            read_at: message.read_at,
          },
        };
      }
      return { success: false, error: 'Message not found' };
    }

    // Use the new API endpoint for marking individual messages as read
    const url = buildApiUrl(`/mobile-api/messaging/mark-message-read`);
    const response = await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        message_id: messageId,
        conversation_uuid: conversationUuid,
        authCode,
      }),
    });
    return response;
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

/**
 * Clear message text (replace with "[Message Deleted]")
 * @param {number} messageId - ID of the message to clear
 * @param {string} userAuthCode - Optional authCode to use instead of getting from storage
 * @returns {Promise<Object>} - Response data
 */
export const clearMessageText = async (messageId, userAuthCode = null) => {
  try {
    const authCode = userAuthCode || (await getAuthCode());
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Mock implementation - find and clear message text
      console.log('🧹 Mock: Clearing message text for message ID:', messageId);

      // Find message in mock data and replace content
      for (const conversationUuid in mockMessages) {
        const messages = mockMessages[conversationUuid];
        const messageIndex = messages.findIndex(
          (msg) => msg.message_id === messageId
        );

        if (messageIndex !== -1) {
          const message = messages[messageIndex];
          const currentUserId = await getCurrentUserId();

          // Check if user owns the message
          if (message.sender_id !== currentUserId) {
            throw new Error('You can only clear your own messages');
          }

          // Check 24-hour time limit
          const messageAge =
            Date.now() - new Date(message.created_at).getTime();
          const twentyFourHours = 24 * 60 * 60 * 1000;

          if (messageAge > twentyFourHours) {
            throw new Error('Cannot clear messages older than 24 hours');
          }

          // Store original content and replace with deleted message
          const originalContent = message.content;
          message.content = '[Message Deleted]';
          message.original_content = originalContent;
          message.cleared_at = new Date().toISOString();

          return {
            success: true,
            message: 'Message text cleared successfully',
            data: {
              message_id: messageId,
              new_content: '[Message Deleted]',
              cleared_at: message.cleared_at,
            },
          };
        }
      }

      throw new Error('Message not found');
    }

    // Real API call
    const url = buildApiUrl('/messaging/message/clear');
    const response = await makeApiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authCode,
        message_id: messageId,
      }),
    });

    return response;
  } catch (error) {
    console.error('❌ Error clearing message text:', error);
    throw error;
  }
};

/**
 * Admin delete message (staff only)
 * @param {number} messageId - ID of the message to delete
 * @param {string} userAuthCode - Optional authCode to use instead of getting from storage
 * @returns {Promise<Object>} - Response data
 */
export const adminDeleteMessage = async (messageId, userAuthCode = null) => {
  try {
    const authCode = userAuthCode || (await getAuthCode());
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Mock implementation - admin delete any message
      console.log('🛡️ Mock: Admin deleting message ID:', messageId);

      // Find message in mock data and replace content
      for (const conversationUuid in mockMessages) {
        const messages = mockMessages[conversationUuid];
        const messageIndex = messages.findIndex(
          (msg) => msg.message_id === messageId
        );

        if (messageIndex !== -1) {
          const message = messages[messageIndex];

          // Store original content and replace with admin deleted message
          const originalContent = message.content;
          const originalSender = message.sender?.name || 'Unknown User';

          message.content = '[Message Deleted by Admin]';
          message.original_content = originalContent;
          message.deleted_by_admin = 'Mock Admin';
          message.original_sender = originalSender;
          message.admin_deleted_at = new Date().toISOString();

          return {
            success: true,
            message: 'Message deleted by admin successfully',
            data: {
              message_id: messageId,
              new_content: '[Message Deleted by Admin]',
              deleted_by_admin: 'Mock Admin',
              original_sender: originalSender,
              admin_deleted_at: message.admin_deleted_at,
            },
          };
        }
      }

      throw new Error('Message not found');
    }

    // Real API call
    const url = buildApiUrl('/messaging/message/admin-delete');
    const response = await makeApiRequest(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authCode,
        message_id: messageId,
      }),
    });

    return response;
  } catch (error) {
    console.error('❌ Error admin deleting message:', error);
    throw error;
  }
};

/**
 * Bulk delete multiple messages
 * @param {Array<number>} messageIds - Array of message IDs to delete
 * @param {string} deleteType - Type of delete ('soft' or 'hard')
 * @param {string} userAuthCode - Optional authCode to use instead of getting from storage
 * @returns {Promise<Object>} - Response data
 */
export const bulkDeleteMessages = async (
  messageIds,
  deleteType = 'soft',
  userAuthCode = null
) => {
  try {
    const authCode = userAuthCode || (await getAuthCode());
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Mock implementation - bulk delete messages
      console.log(
        '🗑️ Mock: Bulk deleting messages:',
        messageIds,
        'Type:',
        deleteType
      );

      const results = {
        total_requested: messageIds.length,
        successful_deletes: 0,
        failed_deletes: 0,
        delete_type: deleteType,
        deleted_by: 'Mock User',
        results: [],
      };

      const currentUserId = await getCurrentUserId();

      for (const messageId of messageIds) {
        try {
          // Find message in mock data
          let messageFound = false;

          for (const conversationUuid in mockMessages) {
            const messages = mockMessages[conversationUuid];
            const messageIndex = messages.findIndex(
              (msg) => msg.message_id === messageId
            );

            if (messageIndex !== -1) {
              const message = messages[messageIndex];
              messageFound = true;

              // Check permissions (user can only delete own messages unless admin)
              if (message.sender_id !== currentUserId) {
                results.failed_deletes++;
                results.results.push({
                  message_id: messageId,
                  success: false,
                  error: 'Permission denied - can only delete own messages',
                });
                continue;
              }

              // Check 24-hour time limit for regular users
              const messageAge =
                Date.now() - new Date(message.created_at).getTime();
              const twentyFourHours = 24 * 60 * 60 * 1000;

              if (messageAge > twentyFourHours) {
                results.failed_deletes++;
                results.results.push({
                  message_id: messageId,
                  success: false,
                  error: 'Cannot delete messages older than 24 hours',
                });
                continue;
              }

              // Perform delete based on type
              if (deleteType === 'hard') {
                // Remove message completely
                messages.splice(messageIndex, 1);
              } else {
                // Soft delete - replace content
                message.content = '[Message Deleted]';
                message.original_content = message.content;
                message.deleted_at = new Date().toISOString();
              }

              results.successful_deletes++;
              results.results.push({
                message_id: messageId,
                success: true,
                delete_type: deleteType,
              });

              break;
            }
          }

          if (!messageFound) {
            results.failed_deletes++;
            results.results.push({
              message_id: messageId,
              success: false,
              error: 'Message not found',
            });
          }
        } catch (error) {
          results.failed_deletes++;
          results.results.push({
            message_id: messageId,
            success: false,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        message: `Bulk delete completed: ${results.successful_deletes} successful, ${results.failed_deletes} failed`,
        data: results,
      };
    }

    // Real API call
    const url = buildApiUrl('/messaging/messages/bulk-delete');
    const response = await makeApiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authCode,
        message_ids: messageIds,
        delete_type: deleteType,
      }),
    });

    return response;
  } catch (error) {
    console.error('❌ Error bulk deleting messages:', error);
    throw error;
  }
};

/**
 * Edit message (1-minute time limit)
 * @param {number} messageId - ID of the message to edit
 * @param {string} newContent - New message content
 * @param {string} userAuthCode - Optional authCode to use instead of getting from storage
 * @returns {Promise<Object>} - Response data
 */
export const editMessage = async (
  messageId,
  newContent,
  userAuthCode = null
) => {
  try {
    const authCode = userAuthCode || (await getAuthCode());
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      // Mock implementation - edit message with 1-minute time limit
      console.log(
        '✏️ Mock: Editing message ID:',
        messageId,
        'New content:',
        newContent
      );

      // Find message in mock data
      for (const conversationUuid in mockMessages) {
        const messages = mockMessages[conversationUuid];
        const messageIndex = messages.findIndex(
          (msg) => msg.message_id === messageId
        );

        if (messageIndex !== -1) {
          const message = messages[messageIndex];
          const currentUserId = await getCurrentUserId();

          // Check if user owns the message
          if (message.sender_id !== currentUserId) {
            throw new Error('You can only edit your own messages');
          }

          // Check 1-minute time limit
          const messageAge =
            Date.now() - new Date(message.created_at).getTime();
          const oneMinute = 60 * 1000;

          if (messageAge > oneMinute) {
            const ageInMinutes = Math.floor(messageAge / (60 * 1000));
            return {
              success: false,
              error: 'Cannot edit messages older than 1 minute',
              message_age_minutes: ageInMinutes,
              edit_deadline_passed: true,
            };
          }

          // Store original content and update message
          const originalContent = message.content;
          message.original_content = originalContent;
          message.content = newContent;
          message.edited_at = new Date().toISOString();

          // Calculate remaining edit time
          const remainingTime = oneMinute - messageAge;
          const remainingSeconds = Math.floor(remainingTime / 1000);

          return {
            success: true,
            message: 'Message edited successfully',
            data: {
              message_id: messageId,
              original_content: originalContent,
              new_content: newContent,
              edited_at: message.edited_at,
              edit_window_remaining_seconds: remainingSeconds,
            },
          };
        }
      }

      throw new Error('Message not found');
    }

    // Real API call
    const url = buildApiUrl('/messaging/message/edit');
    const response = await makeApiRequest(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authCode,
        message_id: messageId,
        new_content: newContent,
      }),
    });

    return response;
  } catch (error) {
    console.error('❌ Error editing message:', error);
    throw error;
  }
};

// Get unread conversations count by fetching conversations and calculating from unread_count
export const getUnreadConversationsCount = async (authCode) => {
  try {
    if (USE_MOCK_DATA) {
      const currentUserId = await getCurrentUserId();

      // Calculate user-specific unread counts from mock data
      let unreadConversations = 0;
      let totalUnreadMessages = 0;

      mockConversations.forEach((conv) => {
        const messages = mockMessages[conv.conversation_uuid] || [];
        const unreadCount = messages.filter((msg) => {
          // Message is unread if:
          // 1. It's not from the current user
          // 2. Current user is not in the read_by array or is_read is false
          return (
            msg.sender.id !== currentUserId &&
            !msg.is_read &&
            (!msg.read_by || !msg.read_by.includes(currentUserId))
          );
        }).length;

        if (unreadCount > 0) {
          unreadConversations++;
          totalUnreadMessages += unreadCount;
        }
      });

      return {
        success: true,
        data: {
          unread_conversations: unreadConversations,
          total_unread_messages: totalUnreadMessages,
        },
      };
    }

    // Since there's no dedicated unread count endpoint, get it from conversations list
    console.log('📊 Getting unread counts from conversations list...');
    const conversationsResponse = await getConversations(authCode);

    if (
      conversationsResponse.success &&
      conversationsResponse.data?.conversations
    ) {
      const conversations = conversationsResponse.data.conversations;

      // Calculate unread counts from conversation data
      let unreadConversations = 0;
      let totalUnreadMessages = 0;

      conversations.forEach((conv) => {
        const unreadCount = conv.unread_count || 0;
        if (unreadCount > 0) {
          unreadConversations++;
          totalUnreadMessages += unreadCount;
        }
      });

      return {
        success: true,
        data: {
          unread_conversations: unreadConversations,
          total_unread_messages: totalUnreadMessages,
        },
      };
    } else {
      throw new Error(
        'Failed to get conversations for unread count calculation'
      );
    }
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};
