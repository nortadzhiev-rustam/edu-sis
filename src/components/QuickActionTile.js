import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { isIPad, isTablet } from '../utils/deviceDetection';

/**
 * QuickActionTile Component
 *
 * A reusable tile component for teacher dashboard quick actions.
 * Uses the existing responsive grid system from TeacherScreen.
 *
 * @param {Object} props
 * @param {string} props.title - The main title text
 * @param {string} props.subtitle - The subtitle text
 * @param {Object} props.icon - FontAwesome icon object
 * @param {string} props.backgroundColor - Background color for the tile
 * @param {string} props.iconColor - Color for the icon (default: '#fff')
 * @param {Function} props.onPress - Callback function when tile is pressed
 * @param {Object} props.styles - Styles object from parent component (TeacherScreen)
 * @param {boolean} props.disabled - Whether the tile is disabled
 * @param {React.ReactNode} props.badge - Optional badge component (e.g., "Coming Soon")
 * @param {boolean} props.isLandscape - Whether device is in landscape orientation
 * @param {Object} props.additionalStyle - Additional styles for the tile container
 */
const QuickActionTile = ({
  title,
  subtitle,
  icon,
  backgroundColor,
  iconColor = '#fff',
  onPress,
  styles, // Use styles from parent component
  disabled = false,
  badge,
  isLandscape = false,
  additionalStyle = {},
}) => {
  const isIPadDevice = isIPad();
  const isTabletDevice = isTablet();

  // Calculate responsive icon size
  const getIconSize = () => {
    if (isIPadDevice && isLandscape) return 16;
    if (isTabletDevice && isLandscape) return 18;
    if (isIPadDevice) return 20;
    if (isTabletDevice) return 24;
    return 28;
  };

  // Get tile container styles - use existing responsive styles from parent component
  const getTileStyles = () => [
    styles.actionTile || styles.menuItem, // Use actionTile for TeacherScreen, menuItem for ParentScreen
    // Only apply backgroundColor if using actionTile style (TeacherScreen)
    styles.actionTile && {
      backgroundColor: disabled ? '#B0B0B0' : backgroundColor,
    },
    disabled && (styles.disabledTile || styles.disabledMenuItem),
    isIPadDevice && (styles.iPadActionTile || styles.iPadMenuItem),
    isIPadDevice &&
      isLandscape &&
      (styles.iPadLandscapeActionTile || styles.iPadLandscapeMenuItem),
    isTabletDevice && (styles.tabletActionTile || styles.tabletMenuItem),
    isTabletDevice &&
      isLandscape &&
      (styles.tabletLandscapeActionTile || styles.tabletLandscapeMenuItem),
    additionalStyle,
  ];

  // Get icon container styles - use existing responsive styles from TeacherScreen
  const getIconContainerStyles = () => [
    styles.tileIconContainer,
    isIPadDevice && styles.iPadTileIconContainer,
    isIPadDevice && isLandscape && styles.iPadLandscapeTileIconContainer,
    isTabletDevice && styles.tabletTileIconContainer,
    isTabletDevice && isLandscape && styles.tabletLandscapeTileIconContainer,
  ];

  // Get title styles - use existing responsive styles from TeacherScreen
  const getTitleStyles = () => [
    styles.tileTitle,
    isIPadDevice && styles.iPadTileTitle,
    isIPadDevice && isLandscape && styles.iPadLandscapeTileTitle,
    isTabletDevice && styles.tabletTileTitle,
    isTabletDevice && isLandscape && styles.tabletLandscapeTileTitle,
  ];

  // Get subtitle styles - use existing responsive styles from TeacherScreen
  const getSubtitleStyles = () => [
    styles.tileSubtitle,
    isIPadDevice && styles.iPadTileSubtitle,
    isIPadDevice && isLandscape && styles.iPadLandscapeTileSubtitle,
    isTabletDevice && styles.tabletTileSubtitle,
    isTabletDevice && isLandscape && styles.tabletLandscapeTileSubtitle,
  ];

  return (
    <TouchableOpacity
      style={getTileStyles()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.8}
    >
      <View style={getIconContainerStyles()}>
        <FontAwesomeIcon icon={icon} size={getIconSize()} color={iconColor} />
      </View>

      <Text style={getTitleStyles()}>{title}</Text>

      <Text style={getSubtitleStyles()}>{subtitle}</Text>

      {badge && badge}
    </TouchableOpacity>
  );
};

export default QuickActionTile;
