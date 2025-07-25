# App Review Testing Guide

## For App Store Reviewers

This guide provides information for testing the BFI Education SIS mobile application during the app review process.

## Test Credentials

### Teacher Login
- **Username**: [Contact developer for test credentials]
- **Password**: [Contact developer for test credentials]

### Student Login
- **Username**: [Contact developer for test credentials]  
- **Password**: [Contact developer for test credentials]

## Troubleshooting Login Issues

If you encounter login issues, please check the following:

### 1. Network Connection
- Ensure the device has a stable internet connection
- The app requires access to `https://sis.bfi.edu.mm`
- Check if corporate firewalls might be blocking the connection

### 2. Debug Information
- When debug mode is enabled, you'll see debug information below the login button
- This shows:
  - API URL being used
  - Device token availability
  - Platform information
  - Network timeout settings

### 3. Common Issues and Solutions

#### "Network connection error"
- Check internet connectivity
- Try switching between WiFi and cellular data
- Ensure the API server is accessible from your network

#### "Unable to connect to server"
- The API server might be temporarily unavailable
- Check if the URL `https://sis.bfi.edu.mm/mobile-api` is accessible from a web browser

#### "Connection timeout"
- The network connection might be slow
- Try again with a better network connection
- The app has a 10-second timeout for API requests

#### Device Token Issues
- The app uses Firebase for push notifications
- If device token is not available, login should still work
- This is not a blocking issue for basic functionality

## Expected Behavior

### Successful Login
1. Enter valid credentials
2. Tap login button
3. Loading indicator appears
4. User is redirected to the appropriate dashboard (Teacher/Student)

### Failed Login
1. Enter invalid credentials
2. Tap login button
3. Loading indicator appears
4. Error message is displayed with specific details

## Contact Information

If you continue to experience issues during the review process, please contact:
- **Developer**: [Your contact information]
- **Support Email**: [Your support email]

## Technical Details

- **API Base URL**: https://sis.bfi.edu.mm/mobile-api
- **Supported Platforms**: iOS, Android
- **Network Timeout**: 10 seconds
- **Required Permissions**: Internet access, Push notifications (optional)

## Notes for Reviewers

- The app is designed for educational institutions
- Real user data is protected and not accessible without proper credentials
- Test credentials provide access to a sandbox environment
- All API calls are logged for debugging purposes when debug mode is enabled
