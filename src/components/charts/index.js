/**
 * Chart Components Export
 * Centralized export for all chart components
 */

export { default as BarChart } from './BarChart';
export { default as DoughnutChart } from './DoughnutChart';

// Chart utilities and helpers
export const chartColors = {
  primary: '#3498db',
  success: '#2ecc71',
  warning: '#f39c12',
  danger: '#e74c3c',
  info: '#17a2b8',
  purple: '#9b59b6',
  orange: '#e67e22',
  teal: '#20c997',
  pink: '#e83e8c',
  indigo: '#6610f2',
};

export const defaultChartColors = [
  chartColors.primary,
  chartColors.success,
  chartColors.warning,
  chartColors.danger,
  chartColors.info,
  chartColors.purple,
  chartColors.orange,
  chartColors.teal,
];

// Chart configuration presets
export const chartPresets = {
  attendance: {
    colors: [chartColors.success, chartColors.danger, chartColors.warning],
    labels: ['Present', 'Absent', 'Late'],
  },
  grades: {
    colors: [chartColors.success, chartColors.primary, chartColors.warning, chartColors.orange, chartColors.danger],
    labels: ['A (90-100)', 'B (80-89)', 'C (70-79)', 'D (60-69)', 'F (<60)'],
  },
  behavior: {
    colors: [chartColors.success, chartColors.danger],
    labels: ['Positive', 'Negative'],
  },
  homework: {
    colors: [chartColors.success, chartColors.warning],
    labels: ['Completed', 'Pending'],
  },
};

// Helper function to format chart data
export const formatChartData = (data, type = 'default') => {
  if (!data || !Array.isArray(data)) return { data: [], labels: [], colors: defaultChartColors };
  
  const preset = chartPresets[type];
  
  return {
    data: data.map(item => typeof item === 'object' ? item.value : item),
    labels: data.map((item, index) => {
      if (typeof item === 'object' && item.label) return item.label;
      if (preset && preset.labels[index]) return preset.labels[index];
      return `Item ${index + 1}`;
    }),
    colors: preset ? preset.colors : defaultChartColors,
  };
};

// Helper function to calculate percentages
export const calculatePercentages = (data) => {
  const total = data.reduce((sum, value) => sum + value, 0);
  return data.map(value => ({
    value,
    percentage: total > 0 ? (value / total) * 100 : 0,
  }));
};
