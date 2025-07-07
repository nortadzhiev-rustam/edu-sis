/**
 * Update Last Login API Test
 * Tests the implementation of the update last login functionality
 */

import { updateLastLogin, updateCurrentUserLastLogin } from '../services/deviceService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock fetch for testing
global.fetch = jest.fn();

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock buildApiUrl
jest.mock('../config/env', () => ({
  buildApiUrl: jest.fn((endpoint) => `https://api.example.com/mobile-api${endpoint}`),
}));

describe('Update Last Login API', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('updateLastLogin', () => {
    it('should successfully update last login with valid authCode', async () => {
      // Mock successful API response
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Last login updated successfully',
          timestamp: '2025-01-07T10:30:00Z',
        }),
      });

      const result = await updateLastLogin('TEST_AUTH_CODE_123');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/mobile-api/update-last-login/',
        {
          method: 'POST',
          signal: expect.any(AbortSignal),
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            authCode: 'TEST_AUTH_CODE_123',
          }),
        }
      );

      expect(result).toEqual({
        success: true,
        data: {
          success: true,
          message: 'Last login updated successfully',
          timestamp: '2025-01-07T10:30:00Z',
        },
        message: 'Last login updated successfully',
      });
    });

    it('should handle missing authCode', async () => {
      const result = await updateLastLogin(null);

      expect(fetch).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: 'No auth code provided',
      });
    });

    it('should handle API error response', async () => {
      // Mock API error response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid auth code',
        }),
      });

      const result = await updateLastLogin('INVALID_AUTH_CODE');

      expect(result).toEqual({
        success: false,
        error: 'Invalid auth code',
        status: 400,
      });
    });

    it('should handle network error', async () => {
      // Mock network error
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await updateLastLogin('TEST_AUTH_CODE_123');

      expect(result).toEqual({
        success: false,
        error: 'Network error during last login update',
      });
    });

    it('should handle timeout error', async () => {
      // Mock timeout error
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      fetch.mockRejectedValueOnce(timeoutError);

      const result = await updateLastLogin('TEST_AUTH_CODE_123');

      expect(result).toEqual({
        success: false,
        error: 'Request timeout - server did not respond within 10 seconds',
      });
    });
  });

  describe('updateCurrentUserLastLogin', () => {
    it('should successfully update last login for current user', async () => {
      // Mock AsyncStorage to return user data
      AsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({
          id: 'USER_123',
          name: 'Test User',
          authCode: 'TEST_AUTH_CODE_123',
          userType: 'teacher',
        })
      );

      // Mock successful API response
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Last login updated successfully',
        }),
      });

      const result = await updateCurrentUserLastLogin();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('userData');
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/mobile-api/update-last-login/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            authCode: 'TEST_AUTH_CODE_123',
          }),
        })
      );

      expect(result.success).toBe(true);
    });

    it('should handle missing user data in storage', async () => {
      // Mock AsyncStorage to return null
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await updateCurrentUserLastLogin();

      expect(result).toEqual({
        success: false,
        error: 'No user data found in storage',
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle missing authCode in user data', async () => {
      // Mock AsyncStorage to return user data without authCode
      AsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({
          id: 'USER_123',
          name: 'Test User',
          userType: 'teacher',
          // No authCode field
        })
      );

      const result = await updateCurrentUserLastLogin();

      expect(result).toEqual({
        success: false,
        error: 'No auth code found in user data',
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle alternative auth_code field name', async () => {
      // Mock AsyncStorage to return user data with auth_code instead of authCode
      AsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({
          id: 'USER_123',
          name: 'Test User',
          auth_code: 'TEST_AUTH_CODE_123', // Alternative field name
          userType: 'teacher',
        })
      );

      // Mock successful API response
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Last login updated successfully',
        }),
      });

      const result = await updateCurrentUserLastLogin();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/mobile-api/update-last-login/',
        expect.objectContaining({
          body: JSON.stringify({
            authCode: 'TEST_AUTH_CODE_123',
          }),
        })
      );

      expect(result.success).toBe(true);
    });
  });
});

/**
 * Integration Test Scenarios
 * These describe how the update last login should work in real app scenarios
 */
describe('Update Last Login Integration Scenarios', () => {
  it('should describe teacher login flow', () => {
    console.log(`
    TEACHER LOGIN FLOW:
    1. User opens app and taps "Teacher" button
    2. HomeScreen checks AsyncStorage for existing userData
    3. If teacher userData exists, calls updateCurrentUserLastLogin()
    4. API call: POST /mobile-api/update-last-login/ with authCode
    5. Navigate to TeacherScreen
    
    OR
    
    1. User goes to LoginScreen and enters credentials
    2. After successful login, proceedWithLogin() is called
    3. User data is saved to AsyncStorage
    4. updateLastLogin() is called with user's authCode
    5. Navigate to TeacherScreen
    `);
  });

  it('should describe student login flow', () => {
    console.log(`
    STUDENT LOGIN FLOW (via Parent):
    1. User opens app and taps "Parent" button
    2. ParentScreen loads and checks for existing demo student
    3. If demo student exists, calls updateLastLogin() with student authCode
    4. Display student list
    
    OR
    
    1. Parent adds new student via LoginScreen
    2. After successful student login, updateLastLogin() is called
    3. Student is added to studentAccounts list
    4. When student is selected in ParentScreen, updateLastLogin() is called again
    `);
  });
});
