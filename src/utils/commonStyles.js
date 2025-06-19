import { StyleSheet } from 'react-native';

/**
 * Common Styles Utility
 * 
 * Provides reusable style objects and functions to reduce code duplication
 * and maintain consistency across the application.
 */

/**
 * Creates common layout styles based on theme
 */
export const createCommonStyles = (theme) => StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.header,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 56,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.headerText,
    textAlign: 'center',
  },

  // Card styles
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    ...theme.shadows?.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // Button styles
  button: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  dangerButton: {
    backgroundColor: theme.colors.error,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: theme.colors.headerText,
  },
  secondaryButtonText: {
    color: theme.colors.headerText,
  },
  outlineButtonText: {
    color: theme.colors.primary,
  },
  dangerButtonText: {
    color: theme.colors.headerText,
  },

  // Form styles
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    marginVertical: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 44,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // List styles
  listContainer: {
    paddingHorizontal: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginVertical: 4,
  },
  listItemText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  listItemSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // Empty state styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 12,
  },

  // Badge styles
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.headerText,
  },
  errorBadge: {
    backgroundColor: theme.colors.error,
  },
  successBadge: {
    backgroundColor: theme.colors.success,
  },
  warningBadge: {
    backgroundColor: theme.colors.warning,
  },

  // Separator styles
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 8,
  },
  sectionSeparator: {
    height: 8,
    backgroundColor: theme.colors.background,
  },

  // Shadow styles
  shadowSmall: {
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shadowMedium: {
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  shadowLarge: {
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },

  // Utility styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  spaceAround: {
    justifyContent: 'space-around',
  },
  spaceEvenly: {
    justifyContent: 'space-evenly',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
  absolute: {
    position: 'absolute',
  },
  relative: {
    position: 'relative',
  },
});

/**
 * Common spacing values
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

/**
 * Common border radius values
 */
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 50,
};

/**
 * Common font sizes
 */
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

/**
 * Common font weights
 */
export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

/**
 * Helper function to create responsive styles based on device type
 */
export const createResponsiveStyles = (isTablet, isLandscape) => ({
  container: {
    paddingHorizontal: isTablet ? (isLandscape ? 64 : 32) : 16,
  },
  maxWidth: isTablet ? 800 : '100%',
  columns: isTablet ? (isLandscape ? 3 : 2) : 1,
});

/**
 * Helper function to get icon size based on context
 */
export const getIconSize = (context = 'default') => {
  switch (context) {
    case 'small':
      return 14;
    case 'medium':
      return 18;
    case 'large':
      return 24;
    case 'header':
      return 20;
    case 'tab':
      return 22;
    default:
      return 16;
  }
};

export default createCommonStyles;
