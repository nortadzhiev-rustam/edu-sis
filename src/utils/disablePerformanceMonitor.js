/**
 * Utility to quickly disable performance monitoring
 * Use this when users are experiencing too many false positive alerts
 */

import { setPerformanceMonitoringEnabled } from './performanceMonitor';

/**
 * Disable performance monitoring completely
 * Call this function to stop all performance monitoring and alerts
 */
export const disablePerformanceMonitoring = () => {
  console.log('🔇 DISABLING PERFORMANCE MONITORING: Stopping all monitoring due to user complaints');
  setPerformanceMonitoringEnabled(false);
};

/**
 * Re-enable performance monitoring
 * Call this function to restart performance monitoring
 */
export const enablePerformanceMonitoring = () => {
  console.log('🔊 ENABLING PERFORMANCE MONITORING: Restarting monitoring');
  setPerformanceMonitoringEnabled(true);
};

/**
 * Quick fix for iOS performance issues
 * Disables monitoring and provides console instructions
 */
export const quickFixIOSPerformance = () => {
  console.log('🍎 iOS PERFORMANCE QUICK FIX: Disabling performance monitoring');
  console.log('📝 To permanently disable, set ENABLED: false in src/config/performanceConfig.js');
  console.log('📝 To disable alerts only, set ALERTS.ENABLED: false in src/config/performanceConfig.js');
  
  disablePerformanceMonitoring();
  
  // Show instructions in console
  setTimeout(() => {
    console.log('');
    console.log('='.repeat(60));
    console.log('🔧 PERFORMANCE MONITORING DISABLED');
    console.log('='.repeat(60));
    console.log('The performance monitor has been disabled to prevent false alerts.');
    console.log('');
    console.log('To permanently disable:');
    console.log('1. Open src/config/performanceConfig.js');
    console.log('2. Set ENABLED: false');
    console.log('');
    console.log('To disable alerts only:');
    console.log('1. Open src/config/performanceConfig.js');
    console.log('2. Set ALERTS.ENABLED: false');
    console.log('='.repeat(60));
  }, 1000);
};

export default {
  disablePerformanceMonitoring,
  enablePerformanceMonitoring,
  quickFixIOSPerformance,
};
