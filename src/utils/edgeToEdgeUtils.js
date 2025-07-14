/**
 * Edge-to-Edge Display Utilities
 * 
 * Utilities to help with Android 15+ edge-to-edge display requirements
 */

import { Platform } from 'react-native';

/**
 * Get optimal status bar style for edge-to-edge display
 * @param {Object} theme - Current theme object
 * @param {string} backgroundColor - Background color of the screen
 * @returns {string} Status bar style ('light', 'dark', or 'auto')
 */
export const getEdgeToEdgeStatusBarStyle = (theme, backgroundColor = null) => {
  // For edge-to-edge, we want the status bar to adapt to content
  if (Platform.OS === 'ios') {
    return 'auto'; // iOS handles this well automatically
  }

  // Android edge-to-edge considerations
  if (theme.mode === 'dark') {
    return 'light'; // Light content on dark background
  }

  if (backgroundColor) {
    // If we have a specific background color, determine contrast
    const isLightBackground = isLightColor(backgroundColor);
    return isLightBackground ? 'dark' : 'light';
  }

  return 'auto'; // Let the system decide
};

/**
 * Get safe area edges configuration for edge-to-edge display
 * @param {boolean} includeBottom - Whether to include bottom edge (default: false for edge-to-edge)
 * @returns {Array} Array of edges to apply safe area to
 */
export const getEdgeToEdgeSafeAreaEdges = (includeBottom = false) => {
  const baseEdges = ['top', 'left', 'right'];
  return includeBottom ? [...baseEdges, 'bottom'] : baseEdges;
};

/**
 * Check if a color is light (for determining status bar content color)
 * @param {string} color - Color in hex format
 * @returns {boolean} True if color is light
 */
const isLightColor = (color) => {
  if (!color || typeof color !== 'string') return true;
  
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5;
};

/**
 * Get Android-specific edge-to-edge window flags
 * These should be applied in native Android code
 */
export const getAndroidEdgeToEdgeFlags = () => ({
  statusBarColor: 'transparent',
  navigationBarColor: 'transparent',
  windowLightStatusBar: true,
  windowLightNavigationBar: true,
  windowLayoutInDisplayCutoutMode: 'shortEdges',
});

/**
 * Check if device supports edge-to-edge display
 * @returns {boolean} True if edge-to-edge is supported
 */
export const supportsEdgeToEdge = () => {
  return Platform.OS === 'android' && Platform.Version >= 31; // Android 12+
};

/**
 * Get recommended padding for edge-to-edge content
 * @param {Object} insets - Safe area insets from useSafeAreaInsets
 * @param {boolean} includeBottom - Whether to include bottom padding
 * @returns {Object} Padding object
 */
export const getEdgeToEdgePadding = (insets, includeBottom = false) => {
  return {
    paddingTop: insets.top,
    paddingLeft: insets.left,
    paddingRight: insets.right,
    paddingBottom: includeBottom ? insets.bottom : 0,
  };
};

/**
 * Default edge-to-edge configuration
 */
export const EDGE_TO_EDGE_CONFIG = {
  safeAreaEdges: ['top', 'left', 'right'],
  statusBarStyle: 'auto',
  statusBarTranslucent: true,
  navigationBarTranslucent: true,
};
