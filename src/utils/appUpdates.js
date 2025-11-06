import * as Updates from 'expo-updates';
import { Alert, Platform } from 'react-native';

/**
 * Check for available updates and prompt user to restart if update is available
 * @returns {Promise<Object>} Update check result
 */
export async function checkForUpdates() {
  try {
    // Only check for updates in production builds
    if (__DEV__) {
      console.log('📱 UPDATES: Skipping update check in development mode');
      return { isAvailable: false, reason: 'development' };
    }

    // Check if updates are enabled
    if (!Updates.isEnabled) {
      console.log('📱 UPDATES: Updates are not enabled for this build');
      return { isAvailable: false, reason: 'not_enabled' };
    }

    console.log('📱 UPDATES: Checking for updates...');
    
    // Check for updates
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      console.log('✅ UPDATES: Update is available!');
      
      // Fetch the update
      console.log('📥 UPDATES: Fetching update...');
      await Updates.fetchUpdateAsync();
      
      console.log('✅ UPDATES: Update downloaded successfully');
      
      // Show alert to user
      showUpdateAlert();
      
      return { isAvailable: true, update };
    } else {
      console.log('📱 UPDATES: App is up to date');
      return { isAvailable: false, reason: 'up_to_date' };
    }
  } catch (error) {
    console.error('❌ UPDATES: Error checking for updates:', error);
    return { isAvailable: false, error: error.message };
  }
}

/**
 * Show alert to user about available update
 */
function showUpdateAlert() {
  Alert.alert(
    'Update Available',
    'A new version of the app is available. Please restart the app to apply the update.',
    [
      {
        text: 'Later',
        style: 'cancel',
        onPress: () => {
          console.log('📱 UPDATES: User chose to update later');
        },
      },
      {
        text: 'Restart Now',
        onPress: async () => {
          console.log('🔄 UPDATES: Restarting app to apply update...');
          await Updates.reloadAsync();
        },
      },
    ],
    { cancelable: false }
  );
}

/**
 * Check for updates silently (without alert) and return result
 * Useful for background checks
 * @returns {Promise<Object>} Update check result
 */
export async function checkForUpdatesSilently() {
  try {
    if (__DEV__ || !Updates.isEnabled) {
      return { isAvailable: false };
    }

    console.log('📱 UPDATES: Checking for updates silently...');
    
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      console.log('✅ UPDATES: Update is available (silent check)');
      // Fetch the update in background
      await Updates.fetchUpdateAsync();
      console.log('✅ UPDATES: Update downloaded in background');
      return { isAvailable: true, update };
    }

    return { isAvailable: false };
  } catch (error) {
    console.error('❌ UPDATES: Error in silent update check:', error);
    return { isAvailable: false, error: error.message };
  }
}

/**
 * Reload the app to apply downloaded update
 */
export async function reloadApp() {
  try {
    console.log('🔄 UPDATES: Reloading app...');
    await Updates.reloadAsync();
  } catch (error) {
    console.error('❌ UPDATES: Error reloading app:', error);
  }
}

/**
 * Get current update information
 * @returns {Object} Current update info
 */
export function getCurrentUpdateInfo() {
  try {
    return {
      isEnabled: Updates.isEnabled,
      channel: Updates.channel,
      runtimeVersion: Updates.runtimeVersion,
      updateId: Updates.updateId,
      createdAt: Updates.createdAt,
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    };
  } catch (error) {
    console.error('❌ UPDATES: Error getting update info:', error);
    return null;
  }
}

/**
 * Log current update information for debugging
 */
export function logUpdateInfo() {
  const info = getCurrentUpdateInfo();
  if (info) {
    console.log('📱 UPDATES: Current update information:');
    console.log('  - Enabled:', info.isEnabled);
    console.log('  - Channel:', info.channel);
    console.log('  - Runtime Version:', info.runtimeVersion);
    console.log('  - Update ID:', info.updateId);
    console.log('  - Created At:', info.createdAt);
    console.log('  - Embedded Launch:', info.isEmbeddedLaunch);
  }
}

