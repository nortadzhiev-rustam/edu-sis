# Expo Updates Implementation

## Overview
This document describes the implementation of expo-updates to automatically check for OTA (Over-The-Air) updates and alert users to restart the app when an update is available.

## Implementation Details

### Files Modified/Created

1. **`src/utils/appUpdates.js`** (NEW)
   - Utility module for handling expo-updates functionality
   - Contains functions for checking, downloading, and applying updates

2. **`App.js`** (MODIFIED)
   - Integrated update checking into app initialization
   - Runs update check on app launch (non-blocking)

### Key Features

#### 1. Automatic Update Check on Launch
- Checks for updates when the app starts
- Non-blocking: doesn't delay app initialization
- Only runs in production builds (skipped in development)

#### 2. User Alert System
When an update is available:
- Downloads the update automatically
- Shows an alert dialog to the user with two options:
  - **"Later"**: User can continue using the app and update later
  - **"Restart Now"**: Immediately restarts the app to apply the update

#### 3. Update Information Logging
- Logs current update information on app launch
- Includes: channel, runtime version, update ID, etc.
- Useful for debugging and monitoring

### Functions Available

#### `checkForUpdates()`
Main function that:
1. Checks if updates are enabled
2. Checks for available updates
3. Downloads the update if available
4. Shows alert to user
5. Returns update status

```javascript
const result = await checkForUpdates();
// result: { isAvailable: boolean, update?: object, reason?: string, error?: string }
```

#### `checkForUpdatesSilently()`
Background update check without user alert:
- Checks and downloads updates silently
- Useful for periodic background checks
- Returns update status without showing UI

```javascript
const result = await checkForUpdatesSilently();
```

#### `reloadApp()`
Manually reload the app to apply updates:
```javascript
await reloadApp();
```

#### `getCurrentUpdateInfo()`
Get current update information:
```javascript
const info = getCurrentUpdateInfo();
// Returns: { isEnabled, channel, runtimeVersion, updateId, createdAt, isEmbeddedLaunch }
```

#### `logUpdateInfo()`
Log current update information to console:
```javascript
logUpdateInfo();
```

## Configuration

### Current Settings (from app.json and native configs)

**iOS** (`ios/BFI/Supporting/Expo.plist`):
```xml
<key>EXUpdatesCheckOnLaunch</key>
<string>ALWAYS</string>
<key>EXUpdatesEnabled</key>
<true/>
<key>EXUpdatesLaunchWaitMs</key>
<integer>0</integer>
<key>EXUpdatesRuntimeVersion</key>
<string>1.0.2</string>
```

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<meta-data android:name="expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH" android:value="ALWAYS"/>
<meta-data android:name="expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS" android:value="0"/>
<meta-data android:name="expo.modules.updates.EXPO_RUNTIME_VERSION" android:value="@string/expo_runtime_version"/>
```

**app.json**:
```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/5c37501a-d3f1-49d2-bf38-28446fc1b0bb"
    },
    "runtimeVersion": "1.0.2"
  }
}
```

### Configuration Options

- **`EXUpdatesCheckOnLaunch`**: `ALWAYS` - Check for updates on every app launch
- **`EXUpdatesLaunchWaitMs`**: `0` - Don't wait for update check to complete before showing app
- **`runtimeVersion`**: `1.0.2` - Current runtime version for compatibility checking

## How It Works

### Update Flow

1. **App Launch**
   - App starts and begins initialization
   - `logUpdateInfo()` logs current update status
   - `checkForUpdates()` is called (non-blocking)

2. **Update Check**
   - Checks if running in production (skips in dev mode)
   - Verifies updates are enabled
   - Calls `Updates.checkForUpdateAsync()`

3. **Update Available**
   - If update found, calls `Updates.fetchUpdateAsync()` to download
   - Shows alert dialog to user
   - User can choose to restart now or later

4. **Apply Update**
   - If user chooses "Restart Now", calls `Updates.reloadAsync()`
   - App restarts with new version
   - If user chooses "Later", update is ready for next app restart

### Publishing Updates

To publish an OTA update:

```bash
# For production channel
npm run update:production
# or
eas update --branch production

# For preview channel
npm run update:preview
# or
eas update --branch preview
```

## Testing

### Testing in Development
The update check is automatically skipped in development mode (`__DEV__` is true).

### Testing in Production Build
1. Build a production version:
   ```bash
   eas build --profile production --platform ios
   # or
   eas build --profile production --platform android
   ```

2. Install the production build on a device

3. Publish an update:
   ```bash
   eas update --branch production
   ```

4. Restart the app - you should see the update alert

## Best Practices

1. **Non-Blocking**: Update checks don't block app initialization
2. **User Choice**: Users can choose when to apply updates
3. **Error Handling**: Gracefully handles update check failures
4. **Logging**: Comprehensive logging for debugging
5. **Production Only**: Skips update checks in development

## Troubleshooting

### Updates Not Working

1. **Check if updates are enabled**:
   ```javascript
   import * as Updates from 'expo-updates';
   console.log('Updates enabled:', Updates.isEnabled);
   ```

2. **Verify runtime version matches**:
   - Check `app.json` runtimeVersion
   - Check native config files (Expo.plist, AndroidManifest.xml)
   - Updates only work if runtime versions are compatible

3. **Check update channel**:
   ```javascript
   console.log('Update channel:', Updates.channel);
   ```

4. **View logs**:
   - Look for `📱 UPDATES:` prefixed logs in console
   - Check for error messages

### Common Issues

- **"Updates are not enabled"**: Running in development mode or expo-dev-client
- **"App is up to date"**: No new updates published to the channel
- **Runtime version mismatch**: Update published with different runtime version

## Future Enhancements

Possible improvements:
1. Periodic background update checks (e.g., every hour)
2. Update notification badge in settings
3. Manual "Check for Updates" button in settings
4. Update download progress indicator
5. Automatic update on app background/foreground transition

## References

- [Expo Updates Documentation](https://docs.expo.dev/versions/latest/sdk/updates/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Runtime Versions](https://docs.expo.dev/eas-update/runtime-versions/)

