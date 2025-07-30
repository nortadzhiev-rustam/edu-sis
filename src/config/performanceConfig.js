/**
 * Performance Monitor Configuration
 * Use this file to control performance monitoring behavior
 */

import { Platform } from 'react-native';

const PerformanceConfig = {
  // Global enable/disable switch
  ENABLED: false, // Set to false to disable all performance monitoring

  // Platform-specific settings
  IOS: {
    FREEZE_THRESHOLD: 20000, // 20 seconds for iOS (increased from 15s)
    HEARTBEAT_INTERVAL: 5000, // 5 seconds between heartbeats
    CHECK_INTERVAL: 15000, // 15 seconds between freeze checks
    MAX_CONSECUTIVE_FREEZES: 3, // Require 3 consecutive detections before alerting
  },

  ANDROID: {
    FREEZE_THRESHOLD: 25000, // 25 seconds for Android
    HEARTBEAT_INTERVAL: 5000, // 5 seconds between heartbeats
    CHECK_INTERVAL: 15000, // 15 seconds between freeze checks
    MAX_CONSECUTIVE_FREEZES: 3, // Require 3 consecutive detections before alerting
  },

  // Alert settings
  ALERTS: {
    ENABLED: false, // Set to false to disable all alerts
    SHOW_RECOVERY_MESSAGES: false, // Set to false to hide recovery console messages
  },

  // Development settings
  DEV: {
    LOG_METRICS: false, // Set to true to log performance metrics
    VERBOSE_LOGGING: false, // Set to true for detailed logging
  },
};

/**
 * Get platform-specific configuration
 */
export const getPlatformConfig = () => {
  return Platform.OS === 'ios' ? PerformanceConfig.IOS : PerformanceConfig.ANDROID;
};

/**
 * Check if performance monitoring is enabled
 */
export const isPerformanceMonitoringEnabled = () => {
  return PerformanceConfig.ENABLED;
};

/**
 * Check if alerts are enabled
 */
export const areAlertsEnabled = () => {
  return PerformanceConfig.ENABLED && PerformanceConfig.ALERTS.ENABLED;
};

/**
 * Get development settings
 */
export const getDevSettings = () => {
  return PerformanceConfig.DEV;
};

export default PerformanceConfig;
