import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import ActionTile from './ActionTile';

const { width: screenWidth } = Dimensions.get('window');

/**
 * MenuGrid Component
 * 
 * A reusable grid component for displaying menu items with responsive layout.
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of menu item objects
 * @param {Function} props.onItemPress - Callback when item is pressed
 * @param {Object} props.theme - Theme object containing colors and styles
 * @param {Object} props.style - Additional styles for container
 * @param {number} props.columns - Number of columns (auto-calculated if not provided)
 * @param {string} props.spacing - Spacing between items: 'tight', 'normal', 'loose'
 * @param {boolean} props.scrollable - Whether the grid should be scrollable
 * @param {string} props.tileSize - Size of tiles: 'small', 'medium', 'large'
 * @param {string} props.tileVariant - Variant of tiles: 'filled', 'outlined', 'minimal'
 * @param {boolean} props.responsive - Whether to use responsive column layout
 */
const MenuGrid = ({
  items = [],
  onItemPress,
  theme,
  style = {},
  columns,
  spacing = 'normal',
  scrollable = false,
  tileSize = 'medium',
  tileVariant = 'filled',
  responsive = true,
}) => {
  const styles = createStyles(theme, spacing);

  // Calculate responsive columns based on screen width and device type
  const getColumns = () => {
    if (columns) return columns;
    
    if (!responsive) return 2;

    // Responsive column calculation
    if (screenWidth >= 1024) return 6; // Large tablets/desktop
    if (screenWidth >= 768) return 4;  // Tablets
    if (screenWidth >= 480) return 3;  // Large phones
    return 2; // Small phones
  };

  const numColumns = getColumns();
  const itemWidth = (100 / numColumns) - (spacing === 'tight' ? 1 : spacing === 'loose' ? 3 : 2);

  const renderItem = (item, index) => {
    const itemStyle = {
      width: `${itemWidth}%`,
      marginBottom: spacing === 'tight' ? 8 : spacing === 'loose' ? 20 : 12,
    };

    return (
      <View key={item.id || index} style={itemStyle}>
        <ActionTile
          title={item.title}
          subtitle={item.subtitle}
          icon={item.icon}
          backgroundColor={item.backgroundColor}
          iconColor={item.iconColor}
          onPress={() => onItemPress?.(item, index)}
          theme={theme}
          size={tileSize}
          disabled={item.disabled}
          badge={item.badge}
          variant={tileVariant}
        />
      </View>
    );
  };

  const renderGrid = () => {
    return (
      <View style={[styles.grid, style]}>
        {items.map(renderItem)}
      </View>
    );
  };

  if (scrollable) {
    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderGrid()}
      </ScrollView>
    );
  }

  return renderGrid();
};

/**
 * QuickActions Component
 * 
 * A specialized grid component for dashboard quick actions.
 */
const QuickActions = ({
  actions = [],
  onActionPress,
  theme,
  style = {},
  maxColumns = 4,
  showAll = false,
  maxVisible = 8,
}) => {
  const styles = createStyles(theme);

  // Determine how many actions to show
  const visibleActions = showAll ? actions : actions.slice(0, maxVisible);

  // Calculate responsive columns for quick actions
  const getQuickActionColumns = () => {
    const actionCount = visibleActions.length;
    
    if (screenWidth >= 768) {
      // Tablet: show more columns
      return Math.min(maxColumns + 2, actionCount);
    }
    
    // Phone: standard columns
    return Math.min(maxColumns, actionCount);
  };

  return (
    <MenuGrid
      items={visibleActions}
      onItemPress={onActionPress}
      theme={theme}
      style={style}
      columns={getQuickActionColumns()}
      spacing="normal"
      scrollable={false}
      tileSize="medium"
      tileVariant="filled"
      responsive={false}
    />
  );
};

/**
 * FeatureGrid Component
 * 
 * A specialized grid component for feature showcases.
 */
const FeatureGrid = ({
  features = [],
  onFeaturePress,
  theme,
  style = {},
  layout = 'auto', // 'auto', 'list', 'grid'
}) => {
  const styles = createStyles(theme);

  const getLayout = () => {
    if (layout !== 'auto') return layout;
    
    // Auto-determine layout based on screen size
    return screenWidth >= 768 ? 'grid' : 'list';
  };

  const currentLayout = getLayout();

  if (currentLayout === 'list') {
    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listContainer}>
          {features.map((feature, index) => (
            <View key={feature.id || index} style={styles.listItem}>
              <ActionTile
                title={feature.title}
                subtitle={feature.subtitle}
                icon={feature.icon}
                backgroundColor={feature.backgroundColor}
                iconColor={feature.iconColor}
                onPress={() => onFeaturePress?.(feature, index)}
                theme={theme}
                size="large"
                disabled={feature.disabled}
                badge={feature.badge}
                variant="outlined"
                style={styles.listTile}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <MenuGrid
      items={features}
      onItemPress={onFeaturePress}
      theme={theme}
      style={style}
      spacing="loose"
      scrollable={true}
      tileSize="large"
      tileVariant="outlined"
      responsive={true}
    />
  );
};

const createStyles = (theme, spacing = 'normal') =>
  StyleSheet.create({
    // Grid styles
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: spacing === 'tight' ? 8 : spacing === 'loose' ? 20 : 12,
    },

    // Scroll container styles
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },

    // List layout styles
    listContainer: {
      paddingHorizontal: 16,
    },
    listItem: {
      marginBottom: 12,
    },
    listTile: {
      width: '100%',
    },
  });

export { MenuGrid, QuickActions, FeatureGrid };
export default MenuGrid;
