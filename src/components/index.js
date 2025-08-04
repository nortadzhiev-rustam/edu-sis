/**
 * Components Index
 *
 * Central export file for all reusable components.
 * This allows for cleaner imports throughout the application.
 */

// UI Components
export { default as SwipeableRecord } from './SwipeableRecord';
export { default as CommonHeader } from './CommonHeader';
export { default as CommonButton } from './CommonButton';
export { CommonCard, StatCard, RecordCard, InfoCard } from './CommonCard';

// Form Components
export {
  SearchBar,
  FormInput,
  FilterTabs,
  SelectionModeToggle,
} from './CommonForm';

// Modal Components
export { CommonModal, StepModal, ConfirmationModal } from './CommonModal';

// Layout Components
export { default as ActionTile } from './ActionTile';
export { default as QuickActionTile } from './QuickActionTile';
export { default as ComingSoonBadge } from './ComingSoonBadge';
export { default as UserProfile } from './UserProfile';
export { EmptyState, LoadingState, ErrorState } from './EmptyState';
export { StatsRow, StatCard as StatsCard } from './StatsRow';
export { MenuGrid, QuickActions, FeatureGrid } from './MenuGrid';

// Chart Components
export {
  BarChart,
  DoughnutChart,
  chartColors,
  defaultChartColors,
  chartPresets,
  formatChartData,
  calculatePercentages,
} from './charts';
export {
  ResponsiveLayout,
  ResponsiveGrid,
  ResponsiveRow,
  SafeAreaLayout,
} from './ResponsiveLayout';

// Notification Components
export { default as NotificationBadge } from './NotificationBadge';
export { default as NotificationItem } from './NotificationItem';
export { default as NotificationManager } from './NotificationManager';
export { default as ParentNotificationBadge } from './ParentNotificationBadge';

// Demo Mode Components
export { default as DemoModeIndicator } from './DemoModeIndicator';
export { default as DemoCredentialsCard } from './DemoCredentialsCard';
