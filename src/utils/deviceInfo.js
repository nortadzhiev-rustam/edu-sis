import { Platform } from 'react-native';
import * as Device from 'expo-device';

/**
 * Get comprehensive device information for API calls
 * @returns {Promise<Object>} Device information object
 */
export async function getDeviceInfo() {
  try {
    console.log('📱 DEVICE INFO: Collecting device information...');

    const deviceInfo = {
      // Basic platform info
      platform: Platform.OS,
      platformVersion: Platform.Version,

      // Device identification
      deviceType: getDeviceType(),
      deviceName: Device.deviceName || 'Unknown Device',
      deviceModel: Device.modelName || 'Unknown Model',
      deviceBrand: Device.brand || 'Unknown Brand',

      // Device characteristics
      isDevice: Device.isDevice,
      isEmulator: !Device.isDevice,

      // System info
      osName: Device.osName || Platform.OS,
      osVersion: Device.osVersion || Platform.Version.toString(),

      // App info
      appVersion: '1.0.0', // You can get this from app.json or package.json

      // Additional Android/iOS specific info
      ...(Platform.OS === 'android' && {
        androidId: Device.osBuildId || 'Unknown',
        manufacturer: Device.manufacturer || 'Unknown',
      }),

      ...(Platform.OS === 'ios' && {
        deviceYearClass: Device.deviceYearClass || 'Unknown',
        totalMemory: Device.totalMemory || 'Unknown',
      }),
    };

    console.log('📱 DEVICE INFO: Collected device information:', deviceInfo);
    return deviceInfo;
  } catch (error) {
    console.error('❌ DEVICE INFO ERROR:', error);

    // Return fallback device info
    return {
      platform: Platform.OS,
      platformVersion: Platform.Version,
      deviceType: getDeviceType(),
      deviceName: 'Unknown Device',
      deviceModel: 'Unknown Model',
      deviceBrand: 'Unknown Brand',
      isDevice: Device.isDevice || false,
      isEmulator: !Device.isDevice,
      osName: Platform.OS,
      osVersion: Platform.Version.toString(),
      appVersion: '1.0.0',
      error: 'Failed to collect complete device info',
    };
  }
}

/**
 * Get device type for API compatibility
 * @returns {string} Device type (ios, android, tablet, etc.)
 */
export function getDeviceType() {
  return Platform.OS; // fallback
}

/**
 * Get formatted device name for display
 * @returns {string} Formatted device name
 */
export function getFormattedDeviceName() {
  const brand = Device.brand || '';
  const model = Device.modelName || Device.deviceName || 'Unknown Device';

  if (brand && model && !model.toLowerCase().includes(brand.toLowerCase())) {
    return `${brand} ${model}`;
  }

  return model;
}

/**
 * Get device info specifically formatted for login API
 * @returns {Promise<Object>} Device info for login API
 */
export async function getLoginDeviceInfo() {
  const deviceInfo = await getDeviceInfo();

  return {
    deviceType: deviceInfo.deviceType,
    deviceName: deviceInfo.deviceName,
    deviceModel: deviceInfo.deviceModel,
    deviceBrand: deviceInfo.deviceBrand,
    platform: deviceInfo.platform,
    osVersion: deviceInfo.osVersion,
    appVersion: deviceInfo.appVersion,
    isEmulator: deviceInfo.isEmulator,
  };
}

/**
 * Log device information for debugging
 */
export async function logDeviceInfo() {
  console.log('🔍 DEVICE DEBUG: Starting device info collection...');

  const deviceInfo = await getDeviceInfo();

  console.log('📱 Platform:', deviceInfo.platform);
  console.log('📱 Device Type:', deviceInfo.deviceType);
  console.log('📱 Device Name:', deviceInfo.deviceName);
  console.log('📱 Device Model:', deviceInfo.deviceModel);
  console.log('📱 Device Brand:', deviceInfo.deviceBrand);
  console.log('📱 OS Version:', deviceInfo.osVersion);
  console.log('📱 Is Real Device:', deviceInfo.isDevice);
  console.log('📱 Is Emulator:', deviceInfo.isEmulator);

  if (deviceInfo.error) {
    console.warn('⚠️ DEVICE INFO WARNING:', deviceInfo.error);
  }

  return deviceInfo;
}
