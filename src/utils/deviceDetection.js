import React from 'react';
import { Dimensions, Platform } from 'react-native';
import * as Device from 'expo-device';

/**
 * Comprehensive device detection utility for iPad-specific optimizations
 */

// Get current screen dimensions
const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

/**
 * Detect if the current device is an iPad
 * @returns {boolean} True if device is iPad
 */
export const isIPad = () => {
  if (Platform.OS !== 'ios') return false;

  const { width, height } = getScreenDimensions();
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);

  // iPad detection based on screen dimensions and device type
  const isTabletBySize = minDimension >= 768; // iPad minimum width
  const isTabletByDeviceType = Device.deviceType === Device.DeviceType.TABLET;

  // Additional iPad-specific dimension checks
  const isIPadMini = minDimension >= 768 && maxDimension >= 1024; // iPad Mini and up
  const isIPadPro = minDimension >= 834 && maxDimension >= 1194; // iPad Pro sizes

  return isTabletByDeviceType || isTabletBySize || isIPadMini || isIPadPro;
};

/**
 * Detect if device is a large tablet (any platform)
 * @returns {boolean} True if device is a tablet
 */
export const isTablet = () => {
  const { width, height } = getScreenDimensions();
  const minDimension = Math.min(width, height);

  // Universal tablet detection
  return minDimension >= 768 || Device.deviceType === Device.DeviceType.TABLET;
};

/**
 * Get iPad-specific layout configurations
 * @returns {Object} iPad layout configuration
 */
export const getIPadLayoutConfig = () => {
  if (!isIPad()) return null;

  const { width, height } = getScreenDimensions();
  const isLandscape = width > height;

  return {
    isIPad: true,
    isLandscape,
    screenWidth: width,
    screenHeight: height,

    // Layout configurations
    contentPadding: isLandscape ? 40 : 30,
    cardSpacing: 20,
    headerHeight: 80,

    // Grid configurations
    gridColumns: isLandscape ? 4 : 3,
    cardMinWidth: 280,

    // Typography
    titleFontSize: 28,
    subtitleFontSize: 18,
    bodyFontSize: 16,

    // Table configurations
    tableRowHeight: 50,
    tableHeaderHeight: 60,
    maxItemsPerPage: isLandscape ? 30 : 25,
    minItemsPerPage: 15,

    // Navigation
    tabBarHeight: 70,
    buttonHeight: 50,
    buttonMinWidth: 120,
  };
};

/**
 * Get responsive font sizes based on device type
 * @returns {Object} Font size configuration
 */
export const getResponsiveFontSizes = () => {
  const isIPadDevice = isIPad();
  const isTabletDevice = isTablet();

  if (isIPadDevice) {
    return {
      tiny: 12,
      small: 14,
      body: 16,
      subtitle: 18,
      title: 24,
      largeTitle: 28,
      hero: 32,
    };
  } else if (isTabletDevice) {
    return {
      tiny: 11,
      small: 13,
      body: 15,
      subtitle: 17,
      title: 22,
      largeTitle: 26,
      hero: 30,
    };
  } else {
    // Phone sizes
    return {
      tiny: 10,
      small: 12,
      body: 14,
      subtitle: 16,
      title: 20,
      largeTitle: 24,
      hero: 28,
    };
  }
};

/**
 * Get responsive spacing based on device type
 * @returns {Object} Spacing configuration
 */
export const getResponsiveSpacing = () => {
  const isIPadDevice = isIPad();
  const isTabletDevice = isTablet();

  if (isIPadDevice) {
    return {
      xs: 8,
      sm: 12,
      md: 20,
      lg: 30,
      xl: 40,
      xxl: 50,
    };
  } else if (isTabletDevice) {
    return {
      xs: 6,
      sm: 10,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 40,
    };
  } else {
    // Phone spacing
    return {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 20,
      xl: 24,
      xxl: 32,
    };
  }
};

/**
 * Get optimal grid columns for current device
 * @param {number} minItemWidth Minimum width per item
 * @returns {number} Number of columns
 */
export const getOptimalColumns = (minItemWidth = 280) => {
  const { width } = getScreenDimensions();
  const spacing = getResponsiveSpacing();
  const contentPadding = spacing.lg * 2; // Left and right padding

  const availableWidth = width - contentPadding;
  const columnsFloat = availableWidth / (minItemWidth + spacing.md);
  const columns = Math.floor(columnsFloat);

  // Ensure minimum 1 column, maximum based on device
  if (isIPad()) {
    return Math.max(1, Math.min(4, columns));
  } else if (isTablet()) {
    return Math.max(1, Math.min(3, columns));
  } else {
    return Math.max(1, Math.min(2, columns));
  }
};

/**
 * Hook for responsive dimensions that updates on orientation change
 * @returns {Object} Current device information
 */
export const useResponsiveDevice = () => {
  const [dimensions, setDimensions] = React.useState(getScreenDimensions());

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  return {
    ...dimensions,
    isIPad: isIPad(),
    isTablet: isTablet(),
    isLandscape: dimensions.width > dimensions.height,
    layoutConfig: getIPadLayoutConfig(),
    fontSizes: getResponsiveFontSizes(),
    spacing: getResponsiveSpacing(),
    optimalColumns: getOptimalColumns(),
  };
};

export default {
  isIPad,
  isTablet,
  getIPadLayoutConfig,
  getResponsiveFontSizes,
  getResponsiveSpacing,
  getOptimalColumns,
  useResponsiveDevice,
};
