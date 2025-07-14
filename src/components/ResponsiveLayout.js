import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { isIPad, isTablet } from '../utils/deviceDetection';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * ResponsiveLayout Component
 *
 * A layout component that adapts to different screen sizes and orientations.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.theme - Theme object containing colors and styles
 * @param {Object} props.style - Additional styles for container
 * @param {string} props.maxWidth - Maximum width for content
 * @param {boolean} props.centerContent - Whether to center content horizontally
 * @param {Object} props.padding - Padding configuration { phone, tablet, desktop }
 * @param {string} props.direction - Flex direction: 'row', 'column'
 * @param {boolean} props.responsive - Whether to apply responsive behavior
 */
const ResponsiveLayout = ({
  children,
  theme,
  style = {},
  maxWidth,
  centerContent = false,
  padding,
  direction = 'column',
  responsive = true,
}) => {
  const styles = createStyles(theme);

  const isIPadDevice = isIPad();
  const isTabletDevice = isTablet();
  const isLandscape = screenWidth > screenHeight;

  const getResponsiveStyle = () => {
    if (!responsive) return {};

    const baseStyle = {};

    // Apply responsive padding
    if (padding) {
      if (isIPadDevice || isTabletDevice) {
        baseStyle.paddingHorizontal = padding.tablet || padding.phone || 16;
      } else {
        baseStyle.paddingHorizontal = padding.phone || 16;
      }
    }

    // Apply max width
    if (maxWidth && (isIPadDevice || isTabletDevice)) {
      baseStyle.maxWidth = maxWidth;
    }

    // Center content if requested
    if (centerContent && (isIPadDevice || isTabletDevice)) {
      baseStyle.alignSelf = 'center';
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  const containerStyle = [
    styles.container,
    { flexDirection: direction },
    getResponsiveStyle(),
    style,
  ];

  return <View style={containerStyle}>{children}</View>;
};

/**
 * ResponsiveGrid Component
 *
 * A grid component that adapts column count based on screen size.
 */
const ResponsiveGrid = ({
  children,
  theme,
  style = {},
  minItemWidth = 150,
  spacing = 12,
  maxColumns = 6,
}) => {
  const styles = createStyles(theme);

  const getColumns = () => {
    const availableWidth = screenWidth - spacing * 2;
    const itemsPerRow = Math.floor(availableWidth / (minItemWidth + spacing));
    return Math.min(Math.max(itemsPerRow, 1), maxColumns);
  };

  const columns = getColumns();
  const itemWidth = (screenWidth - spacing * (columns + 1)) / columns;

  const renderItems = () => {
    const items = React.Children.toArray(children);
    const rows = [];

    for (let i = 0; i < items.length; i += columns) {
      const rowItems = items.slice(i, i + columns);

      rows.push(
        <View key={i} style={styles.gridRow}>
          {rowItems.map((item, index) => (
            <View
              key={index}
              style={[
                styles.gridItem,
                {
                  width: itemWidth,
                  marginRight: index < rowItems.length - 1 ? spacing : 0,
                },
              ]}
            >
              {item}
            </View>
          ))}

          {/* Fill remaining space if last row is incomplete */}
          {rowItems.length < columns &&
            Array.from({ length: columns - rowItems.length }).map(
              (_, index) => (
                <View
                  key={`empty-${index}`}
                  style={{
                    width: itemWidth,
                    marginRight:
                      index < columns - rowItems.length - 1 ? spacing : 0,
                  }}
                />
              )
            )}
        </View>
      );
    }

    return rows;
  };

  return (
    <View style={[styles.gridContainer, { paddingHorizontal: spacing }, style]}>
      {renderItems()}
    </View>
  );
};

/**
 * ResponsiveRow Component
 *
 * A row component that stacks items vertically on small screens.
 */
const ResponsiveRow = ({
  children,
  theme,
  style = {},
  breakpoint = 768,
  spacing = 12,
  stackOnSmall = true,
}) => {
  const styles = createStyles(theme);
  const shouldStack = stackOnSmall && screenWidth < breakpoint;

  const containerStyle = [
    styles.rowContainer,
    shouldStack ? styles.stackedContainer : styles.horizontalContainer,
    style,
  ];

  const renderChildren = () => {
    return React.Children.map(children, (child, index) => (
      <View
        key={index}
        style={[
          shouldStack ? styles.stackedItem : styles.horizontalItem,
          {
            marginBottom:
              shouldStack && index < React.Children.count(children) - 1
                ? spacing
                : 0,
            marginRight:
              !shouldStack && index < React.Children.count(children) - 1
                ? spacing
                : 0,
          },
        ]}
      >
        {child}
      </View>
    ));
  };

  return <View style={containerStyle}>{renderChildren()}</View>;
};

/**
 * SafeAreaLayout Component
 *
 * A layout component that provides consistent safe area handling with edge-to-edge support.
 * Default edges configuration is optimized for Android 15+ edge-to-edge display.
 */
const SafeAreaLayout = ({
  children,
  theme,
  style = {},
  edges = ['top', 'left', 'right'], // Default excludes bottom for edge-to-edge
  backgroundColor,
  edgeToEdge = true, // Enable edge-to-edge by default
}) => {
  const SafeAreaView = require('react-native-safe-area-context').SafeAreaView;
  const styles = createStyles(theme);

  // For edge-to-edge display, we typically want to exclude bottom edge
  // to allow content to extend behind navigation bar
  const safeAreaEdges = edgeToEdge ? edges : ['top', 'left', 'right', 'bottom'];

  return (
    <SafeAreaView
      style={[
        styles.safeAreaContainer,
        backgroundColor && { backgroundColor },
        style,
      ]}
      edges={safeAreaEdges}
    >
      {children}
    </SafeAreaView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    // ResponsiveLayout styles
    container: {
      flex: 1,
    },

    // ResponsiveGrid styles
    gridContainer: {
      flex: 1,
    },
    gridRow: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    gridItem: {
      // Dynamic width set in component
    },

    // ResponsiveRow styles
    rowContainer: {
      // Base container styles
    },
    horizontalContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stackedContainer: {
      flexDirection: 'column',
    },
    horizontalItem: {
      flex: 1,
    },
    stackedItem: {
      width: '100%',
    },

    // SafeAreaLayout styles
    safeAreaContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });

export { ResponsiveLayout, ResponsiveGrid, ResponsiveRow, SafeAreaLayout };
export default ResponsiveLayout;
