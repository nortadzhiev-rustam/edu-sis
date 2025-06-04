# Configuration Management Guide

This project uses a centralized configuration system to manage all API endpoints, URLs, and app settings.

## Current Setup

The configuration is managed through a centralized config file at `src/config/env.js`. This approach provides:

- **Centralized Management**: All configuration in one place
- **Type Safety**: No runtime errors from missing environment variables
- **Easy Modification**: Simple to update for different environments
- **No External Dependencies**: No need for additional packages

## Configuration Structure

The configuration is organized into several sections:

### API Configuration
- `API_BASE_URL`: Base URL for all API calls (currently: `https://sis.bfi.edu.mm/mobile-api`)
- `API_DOMAIN`: Domain name for the API server
- `API_ENDPOINTS`: Object containing all API endpoint paths

### Web Resources
- `WEB_ENDPOINTS`: Paths for web-based resources (calendar, contacts, about, FAQ)

### App Configuration
- `APP.NAME`: Application display name
- `APP.VERSION`: Current version number
- `APP.BUNDLE_ID`: Bundle identifier for the app

### Development Configuration
- `DEV.USE_DUMMY_DATA`: Set to `true` to use mock data instead of real API calls
- `DEV.ENABLE_LOGGING`: Enable/disable console logging

### Network Configuration
- `NETWORK.TIMEOUT`: Request timeout in milliseconds
- `NETWORK.ENABLE_CLEARTEXT_TRAFFIC`: Allow HTTP traffic (for development)

### Device Configuration
- `DEVICE.DEFAULT_TYPE`: Default device type for API calls

## Usage in Code

Configuration values are accessed through the centralized config:

```javascript
import { Config, buildApiUrl, buildWebUrl } from '../config/env';

// Build API URLs with parameters
const apiUrl = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_TIMETABLE, {
  authCode: 'your-auth-code'
});

// Build web URLs
const calendarUrl = buildWebUrl(Config.WEB_ENDPOINTS.CALENDAR);

// Access app configuration
const appName = Config.APP.NAME;
const isDummyDataEnabled = Config.DEV.USE_DUMMY_DATA;
```

## Modifying Configuration

To change configuration for different environments:

1. **Edit `src/config/env.js`** directly for the values you want to change
2. **For API URLs**: Update `API_BASE_URL` and `API_DOMAIN`
3. **For development**: Toggle `DEV.USE_DUMMY_DATA` and `DEV.ENABLE_LOGGING`
4. **For app info**: Update values in the `APP` section

## Benefits of Current Approach

- **No Build Issues**: No dependency on external packages
- **Immediate Changes**: Modify config and restart Metro bundler
- **Type Safety**: All values are defined and typed
- **Easy Debugging**: Clear error messages if config is missing
- **Team Friendly**: No need for team members to set up `.env` files

## Files Updated

All hardcoded URLs and configuration values have been replaced in:

- `src/services/authService.js` - Authentication API calls
- `src/utils/globals.js` - Global constants
- `src/screens/TimetableScreen.js` - Student timetable API
- `src/screens/ParentScreen.js` - Parent dashboard API
- `src/screens/HomeScreen.js` - Web resource URLs
- `src/screens/GradesScreen.js` - Grades API
- `src/screens/AttendanceScreen.js` - Attendance API
- `src/screens/AssignmentsScreen.js` - Assignments API
- `src/screens/BehaviorScreen.js` - Behavior API
- `src/screens/TeacherScreen.js` - Teacher dashboard APIs
- `src/screens/TeacherTimetable.js` - Teacher timetable APIs
- `src/screens/TeacherBPS.js` - Teacher BPS management APIs
