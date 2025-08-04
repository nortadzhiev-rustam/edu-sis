/**
 * Report Detail Screen
 * Generic screen for displaying detailed report analysis with date filtering and export capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faCalendar,
  faDownload,
  faRefresh,
  faFilter,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';

import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getStudentAttendanceReport,
  getStudentGradesReport,
  getStudentBPSReport,
  getStudentHomeworkReport,
  getClassAttendanceReport,
  getClassAssessmentReport,
  getBehavioralAnalyticsReport,
  getHomeworkAnalyticsReport,
} from '../services/reportsService';
import {
  DoughnutChart,
  BarChart,
  StatsRow,
  EmptyState,
  LoadingState,
} from '../components';
import { isIPad, isTablet } from '../utils/deviceDetection';
import { createSmallShadow, createMediumShadow } from '../utils/commonStyles';

export default function ReportDetailScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);

  // Device detection
  const isIPadDevice = isIPad();
  const isTabletDevice = isTablet();

  // Route params
  const { reportType, reportTitle, userData, classData, initialDateRange } =
    route.params || {};

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dateRange] = useState(
    initialDateRange || {
      startDate: null,
      endDate: null,
    }
  );
  const [showFilters, setShowFilters] = useState(false);

  // Load report data on mount and when filters change
  useEffect(() => {
    if (reportType && userData?.authCode) {
      loadReportData();
    }
  }, [reportType, dateRange]);

  // Safety check for theme
  if (!theme?.colors) {
    console.error('Theme not properly initialized in ReportDetailScreen');
    return null;
  }

  const loadReportData = async () => {
    try {
      setLoading(true);
      let response = null;

      // Determine which API function to call based on report type
      switch (reportType) {
        // Student reports
        case 'student-attendance':
          response = await getStudentAttendanceReport(
            userData?.authCode,
            dateRange.startDate,
            dateRange.endDate
          );
          break;
        case 'student-grades':
          response = await getStudentGradesReport(
            userData?.authCode,
            dateRange.startDate,
            dateRange.endDate
          );
          break;
        case 'student-bps':
          response = await getStudentBPSReport(
            userData?.authCode,
            dateRange.startDate,
            dateRange.endDate
          );
          break;
        case 'student-homework':
          response = await getStudentHomeworkReport(
            userData?.authCode,
            dateRange.startDate,
            dateRange.endDate
          );
          break;

        // Staff reports
        case 'class-attendance':
          response = await getClassAttendanceReport(
            userData?.authCode,
            classData?.classroom_id,
            null,
            dateRange.startDate,
            dateRange.endDate
          );
          break;
        case 'class-assessment':
          response = await getClassAssessmentReport(
            userData?.authCode,
            classData?.classroom_id,
            null,
            dateRange.startDate,
            dateRange.endDate
          );
          break;
        case 'behavioral-analytics':
          response = await getBehavioralAnalyticsReport(
            userData?.authCode,
            classData?.classroom_id,
            dateRange.startDate,
            dateRange.endDate
          );
          break;
        case 'homework-analytics':
          response = await getHomeworkAnalyticsReport(
            userData?.authCode,
            classData?.classroom_id,
            dateRange.startDate,
            dateRange.endDate
          );
          break;

        default:
          throw new Error('Unknown report type');
      }

      if (response?.success) {
        setReportData(response);
      } else {
        throw new Error(response?.error || 'Failed to load report data');
      }
    } catch (error) {
      console.error(`Error loading ${reportType} report:`, error);
      Alert.alert(t('error'), t('failedToLoadReportData'));
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReportData();
    setRefreshing(false);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    Alert.alert(t('export'), t('exportFeatureComingSoon'));
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <FontAwesomeIcon
          icon={faArrowLeft}
          size={20}
          color={theme.colors.text}
        />
      </TouchableOpacity>

      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{reportTitle}</Text>
        <Text style={styles.headerSubtitle}>
          {classData?.classroom_name || userData?.name}
        </Text>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <FontAwesomeIcon
            icon={faFilter}
            size={16}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerButton} onPress={handleExport}>
          <FontAwesomeIcon
            icon={faDownload}
            size={16}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerButton} onPress={onRefresh}>
          <FontAwesomeIcon
            icon={faRefresh}
            size={16}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>{t('filters')}</Text>

        <TouchableOpacity
          style={styles.dateRangeButton}
          onPress={() => {
            /* TODO: Implement date picker */
          }}
        >
          <FontAwesomeIcon
            icon={faCalendar}
            size={16}
            color={theme.colors.primary}
          />
          <Text style={styles.dateRangeText}>
            {dateRange.startDate && dateRange.endDate
              ? `${dateRange.startDate} - ${dateRange.endDate}`
              : t('selectDateRange')}
          </Text>
          <FontAwesomeIcon
            icon={faChevronDown}
            size={14}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderDetailedStats = () => {
    if (!reportData?.data) return null;

    const data = reportData.data;

    return (
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>{t('detailedAnalysis')}</Text>

        {/* Summary Stats */}
        {data.summary && (
          <View style={styles.summarySection}>
            <Text style={styles.subsectionTitle}>{t('summary')}</Text>
            <StatsRow
              stats={getStatsForReportType(data.summary)}
              theme={theme}
              variant='detailed'
              showDividers={true}
            />
          </View>
        )}

        {/* Chart Visualization */}
        {data.chart_data && (
          <View style={styles.chartSection}>
            <Text style={styles.subsectionTitle}>{t('visualization')}</Text>
            {renderChart(data.chart_data)}
          </View>
        )}

        {/* Additional Data Sections */}
        {renderAdditionalSections(data)}
      </View>
    );
  };

  const getStatsForReportType = (summary) => {
    // This function maps summary data to stats based on report type
    // Implementation would vary based on the specific report type
    const commonStats = Object.keys(summary).map((key) => ({
      label: t(key) || key.replace(/_/g, ' '),
      value:
        typeof summary[key] === 'number'
          ? summary[key] % 1 === 0
            ? summary[key]
            : summary[key].toFixed(1)
          : summary[key],
      color: theme.colors.primary,
    }));

    return commonStats.slice(0, 6); // Limit to 6 stats for better display
  };

  const renderChart = (chartData) => {
    const chartSize = isIPadDevice ? 300 : isTabletDevice ? 260 : 220;

    if (chartData.type === 'doughnut') {
      return (
        <DoughnutChart
          data={chartData.datasets[0].data}
          labels={chartData.labels}
          colors={chartData.datasets[0].backgroundColor}
          size={chartSize}
          theme={theme}
          showLabels={true}
          showValues={true}
          showCenterPercentage={true}
        />
      );
    }

    if (chartData.type === 'bar') {
      return (
        <BarChart
          data={chartData.datasets[0].data}
          labels={chartData.labels}
          colors={chartData.datasets[0].backgroundColor}
          height={220}
          theme={theme}
          showValues={true}
          scrollable={chartData.labels.length > 6}
        />
      );
    }

    return null;
  };

  const renderAdditionalSections = (data) => {
    const sections = [];

    // Subject breakdown for grades
    if (data.subject_breakdown) {
      sections.push(
        <View key='subject-breakdown' style={styles.additionalSection}>
          <Text style={styles.subsectionTitle}>{t('subjectBreakdown')}</Text>
          {data.subject_breakdown.map((subject, index) => (
            <View
              key={`subject-${subject.subject_id || index}`}
              style={styles.subjectItem}
            >
              <Text style={styles.subjectName}>{subject.subject_name}</Text>
              <Text style={styles.subjectValue}>
                {subject.overall_average?.toFixed(1) ||
                  subject.completion_rate?.toFixed(1) ||
                  subject.average?.toFixed(1)}
                {subject.completion_rate ? '%' : ''}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    // Top items for BPS
    if (data.top_items) {
      sections.push(
        <View key='top-items' style={styles.additionalSection}>
          <Text style={styles.subsectionTitle}>{t('topItems')}</Text>
          {data.top_items.map((item, index) => (
            <View
              key={`item-${item.item_title}-${index}`}
              style={styles.topItem}
            >
              <Text style={styles.itemTitle}>{item.item_title}</Text>
              <View style={styles.itemStats}>
                <Text style={styles.itemCount}>
                  {t('count')}: {item.count}
                </Text>
                <Text
                  style={[
                    styles.itemPoints,
                    {
                      color:
                        item.total_points >= 0
                          ? theme.colors.success
                          : theme.colors.danger,
                    },
                  ]}
                >
                  {item.total_points >= 0 ? '+' : ''}
                  {item.total_points} {t('points')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      );
    }

    return sections;
  };

  if (loading && !reportData) {
    return <LoadingState message={t('loadingReportDetails')} theme={theme} />;
  }

  const styles = createStyles(theme, fontSizes);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {renderHeader()}
      {renderFilters()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {reportData ? (
          renderDetailedStats()
        ) : (
          <EmptyState
            title={t('noReportData')}
            message={t('noReportDataMessage')}
            theme={theme}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme, fontSizes) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...Platform.select({
      ios: createSmallShadow(theme),
      android: { elevation: 2 },
    }),
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSizes.large,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: fontSizes.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  filtersContainer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filtersTitle: {
    fontSize: fontSizes.medium,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateRangeText: {
    fontSize: fontSizes.medium,
    color: theme.colors.text,
    flex: 1,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  detailsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: fontSizes.large,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  summarySection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: createMediumShadow(theme),
      android: { elevation: 3 },
    }),
  },
  chartSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: createMediumShadow(theme),
      android: { elevation: 3 },
    }),
  },
  additionalSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: createMediumShadow(theme),
      android: { elevation: 3 },
    }),
  },
  subsectionTitle: {
    fontSize: fontSizes.medium,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  subjectName: {
    fontSize: fontSizes.medium,
    color: theme.colors.text,
    flex: 1,
  },
  subjectValue: {
    fontSize: fontSizes.medium,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  topItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemTitle: {
    fontSize: fontSizes.medium,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemCount: {
    fontSize: fontSizes.small,
    color: theme.colors.textSecondary,
  },
  itemPoints: {
    fontSize: fontSizes.small,
    fontWeight: '600',
  },
});
