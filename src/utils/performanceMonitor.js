/**
 * Performance Monitor Utility
 * Helps detect and prevent app freezing issues
 */
import React from 'react';
import { Alert, Platform } from 'react-native';
import PerformanceConfig, {
  getPlatformConfig,
  isPerformanceMonitoringEnabled,
  areAlertsEnabled,
  getDevSettings,
} from '../config/performanceConfig';

/**
 * Monitor for app freezing and provide recovery options
 */
class PerformanceMonitor {
  constructor() {
    this.isMonitoring = false;
    this.isEnabled = isPerformanceMonitoringEnabled(); // Use config setting

    // Get platform-specific configuration
    const platformConfig = getPlatformConfig();
    this.freezeThreshold = platformConfig.FREEZE_THRESHOLD;
    this.heartbeatInterval = null;
    this.freezeCheckInterval = null;
    this.heartbeatIntervalMs = platformConfig.HEARTBEAT_INTERVAL;
    this.checkIntervalMs = platformConfig.CHECK_INTERVAL;
    this.maxConsecutiveFreezes = platformConfig.MAX_CONSECUTIVE_FREEZES;

    this.lastHeartbeat = Date.now();
    this.operationTimeouts = new Map();
    this.iosSpecificIssues = [];
    this.alertShown = false; // Prevent multiple alerts
    this.consecutiveFreezeCount = 0; // Track consecutive freezes

    const devSettings = getDevSettings();
    this.verboseLogging = devSettings.VERBOSE_LOGGING;
    this.logMetricsEnabled = devSettings.LOG_METRICS;
  }

  /**
   * Enable or disable the performance monitor
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled && this.isMonitoring) {
      this.stopMonitoring();
    }
    console.log(`🔍 PERFORMANCE: Monitor ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Start monitoring for app freezes
   */
  startMonitoring() {
    if (!this.isEnabled || this.isMonitoring) return;

    console.log('🔍 PERFORMANCE: Starting freeze detection monitoring...');
    this.isMonitoring = true;
    this.lastHeartbeat = Date.now();

    // Send heartbeat using configured interval
    this.heartbeatInterval = setInterval(() => {
      this.lastHeartbeat = Date.now();
    }, this.heartbeatIntervalMs);

    // Check for freezes using configured interval
    this.freezeCheckInterval = setInterval(() => {
      this.checkForFreeze();
    }, this.checkIntervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    console.log('🔍 PERFORMANCE: Stopping freeze detection monitoring...');
    this.isMonitoring = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.freezeCheckInterval) {
      clearInterval(this.freezeCheckInterval);
      this.freezeCheckInterval = null;
    }
  }

  /**
   * Check if app appears to be frozen
   */
  checkForFreeze() {
    const now = Date.now();
    const timeSinceLastHeartbeat = now - this.lastHeartbeat;

    if (timeSinceLastHeartbeat > this.freezeThreshold) {
      this.consecutiveFreezeCount++;
      console.warn(
        `⚠️ PERFORMANCE: Potential freeze detected (${this.consecutiveFreezeCount}/${this.maxConsecutiveFreezes})`
      );
      console.warn(`⏰ Time since last heartbeat: ${timeSinceLastHeartbeat}ms`);

      // Only handle freeze after multiple consecutive detections
      if (
        this.consecutiveFreezeCount >= this.maxConsecutiveFreezes &&
        !this.alertShown
      ) {
        this.handleFreeze();
      }
    } else if (this.consecutiveFreezeCount > 0) {
      // Reset counter if heartbeat is normal
      console.log(
        '✅ PERFORMANCE: Heartbeat recovered, resetting freeze counter'
      );
      this.consecutiveFreezeCount = 0;
    }
  }

  /**
   * Handle detected freeze
   */
  handleFreeze() {
    // Prevent multiple alerts
    if (this.alertShown) return;
    this.alertShown = true;

    console.error(
      '❌ PERFORMANCE: Confirmed app freeze after multiple detections'
    );

    // Check if alerts are enabled in configuration
    if (!areAlertsEnabled()) {
      console.log(
        '🔇 PERFORMANCE: Alerts disabled in configuration, skipping alert'
      );
      this.alertShown = false; // Reset since we're not showing alert
      this.consecutiveFreezeCount = 0; // Reset counter
      return;
    }

    // iOS-specific freeze handling
    const isIOS = Platform.OS === 'ios';
    const title = isIOS ? 'iOS Performance Issue' : 'App Performance Issue';
    const message = isIOS
      ? 'The app appears to be frozen on iOS. This might be due to Firebase initialization, notification permissions, or memory constraints on iOS devices.'
      : 'The app appears to be frozen or running slowly. This might be due to heavy operations or memory issues.';

    Alert.alert(title, message, [
      {
        text: 'Continue', // TODO: Replace with t('continue') when context is available
        style: 'default',
        onPress: () => {
          this.alertShown = false; // Allow future alerts
          this.consecutiveFreezeCount = 0; // Reset counter
        },
      },
      {
        text: 'Force Restart', // TODO: Replace with t('forceRestart')
        style: 'destructive',
        onPress: () => {
          // Clear all timeouts and intervals
          this.clearAllOperations();
          // iOS-specific cleanup
          if (isIOS) {
            this.clearIOSSpecificIssues();
          }
          // Reset alert state
          this.alertShown = false;
          this.consecutiveFreezeCount = 0;
          // Restart monitoring
          this.stopMonitoring();
          setTimeout(() => this.startMonitoring(), 1000);
        },
      },
    ]);
  }

  /**
   * Clear iOS-specific issues
   */
  clearIOSSpecificIssues() {
    console.log('🍎 iOS: Clearing iOS-specific performance issues...');
    this.iosSpecificIssues = [];

    // Force garbage collection if available (iOS specific)
    if (global.gc) {
      try {
        global.gc();
        console.log('🗑️ iOS: Forced garbage collection');
      } catch (error) {
        console.warn('⚠️ iOS: Could not force garbage collection:', error);
      }
    }
  }

  /**
   * Wrap async operations with timeout protection
   * @param {Function} operation - Async operation to wrap
   * @param {number} timeout - Timeout in milliseconds
   * @param {string} operationName - Name for logging
   * @returns {Promise} - Promise that resolves or rejects with timeout
   */
  async wrapWithTimeout(operation, timeout = 30000, operationName = 'Unknown') {
    const operationId = Date.now().toString();

    console.log(
      `⏱️ PERFORMANCE: Starting operation "${operationName}" with ${timeout}ms timeout`
    );

    let timeoutId;
    let isCompleted = false;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        if (!isCompleted) {
          console.error(
            `❌ PERFORMANCE: Operation "${operationName}" timed out after ${timeout}ms`
          );
          reject(
            new Error(
              `Operation "${operationName}" timed out after ${timeout}ms`
            )
          );
        }
      }, timeout);

      this.operationTimeouts.set(operationId, timeoutId);
    });

    try {
      const result = await Promise.race([operation(), timeoutPromise]);

      // Mark as completed and clear timeout
      isCompleted = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.operationTimeouts.delete(operationId);
      }

      console.log(
        `✅ PERFORMANCE: Operation "${operationName}" completed successfully`
      );
      return result;
    } catch (error) {
      // Mark as completed and clear timeout on error
      isCompleted = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.operationTimeouts.delete(operationId);
      }

      console.error(
        `❌ PERFORMANCE: Operation "${operationName}" failed:`,
        error
      );
      throw error;
    }
  }

  /**
   * Clear all pending operations
   */
  clearAllOperations() {
    console.log('🧹 PERFORMANCE: Clearing all pending operations...');

    this.operationTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });

    this.operationTimeouts.clear();
    console.log('✅ PERFORMANCE: All operations cleared');
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      isMonitoring: this.isMonitoring,
      lastHeartbeat: this.lastHeartbeat,
      timeSinceLastHeartbeat: Date.now() - this.lastHeartbeat,
      pendingOperations: this.operationTimeouts.size,
      freezeThreshold: this.freezeThreshold,
    };
  }

  /**
   * Log performance metrics
   */
  logMetrics() {
    const metrics = this.getMetrics();
    console.log('📊 PERFORMANCE METRICS:', metrics);
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

/**
 * Convenience functions for easy use
 */
export const startPerformanceMonitoring = () =>
  performanceMonitor.startMonitoring();
export const stopPerformanceMonitoring = () =>
  performanceMonitor.stopMonitoring();
export const setPerformanceMonitoringEnabled = (enabled) =>
  performanceMonitor.setEnabled(enabled);
export const wrapWithTimeout = (operation, timeout, name) =>
  performanceMonitor.wrapWithTimeout(operation, timeout, name);
export const getPerformanceMetrics = () => performanceMonitor.getMetrics();
export const logPerformanceMetrics = () => performanceMonitor.logMetrics();

/**
 * React hook for performance monitoring
 */
export const usePerformanceMonitoring = () => {
  React.useEffect(() => {
    startPerformanceMonitoring();

    return () => {
      stopPerformanceMonitoring();
    };
  }, []);

  return {
    getMetrics: getPerformanceMetrics,
    logMetrics: logPerformanceMetrics,
    wrapWithTimeout,
  };
};
