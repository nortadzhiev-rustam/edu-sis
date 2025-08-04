/**
 * Student Reports Screen
 * Displays comprehensive reports for students including attendance, grades, BPS, and homework
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
  faCalendarCheck,
  faChartBar,
  faStar,
  faBookOpen,
  faBook,
  faRefresh,
  faUserGraduate,
} from '@fortawesome/free-solid-svg-icons';

import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getAvailableReports,
  getStudentAttendanceReport,
  getStudentGradesReport,
  getStudentBPSReport,
  getStudentHomeworkReport,
  getStudentLibraryReport,
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

export default function StudentReportsScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);

  // Device detection
  const isIPadDevice = isIPad();
  const isTabletDevice = isTablet();

  // Route params
  const { userData } = route.params || {};

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableReports, setAvailableReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState('attendance');
  const [reportData, setReportData] = useState(null);
  const [dateRange] = useState({
    startDate: null,
    endDate: null,
  });

  // Load available reports on mount
  useEffect(() => {
    loadAvailableReports();
  }, []);

  // Load specific report when selection changes
  useEffect(() => {
    if (selectedReport && userData?.authCode) {
      loadReportData(selectedReport);
    }
  }, [selectedReport, dateRange]);

  // Safety check for theme
  if (!theme?.colors) {
    console.error('Theme not properly initialized in StudentReportsScreen');
    return null;
  }

  const loadAvailableReports = async () => {
    try {
      setLoading(true);
      const response = await getAvailableReports(userData?.authCode);

      if (response?.success) {
        setAvailableReports(response.available_reports || []);
        // Set first available report as default
        if (response.available_reports?.length > 0) {
          setSelectedReport(response.available_reports[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading available reports:', error);
      Alert.alert(t('error'), t('failedToLoadReports'));
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async (reportType) => {
    try {
      setLoading(true);
      let response = null;

      switch (reportType) {
        case 'attendance':
          response = await getStudentAttendanceReport(
            userData?.authCode,
            dateRange.startDate,
            dateRange.endDate
          );
          break;
        case 'grades':
          response = await getStudentGradesReport(
            userData?.authCode,
            dateRange.startDate,
            dateRange.endDate
          );
          break;
        case 'bps':
          response = await getStudentBPSReport(
            userData?.authCode,
            dateRange.startDate,
            dateRange.endDate
          );
          break;
        case 'homework':
          response = await getStudentHomeworkReport(
            userData?.authCode,
            dateRange.startDate,
            dateRange.endDate
          );
          break;
        case 'library':
          response = await getStudentLibraryReport(
            userData?.authCode,
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
    await loadReportData(selectedReport);
    setRefreshing(false);
  };

  const getReportIcon = (reportId) => {
    switch (reportId) {
      case 'attendance':
        return faCalendarCheck;
      case 'grades':
        return faChartBar;
      case 'bps':
        return faStar;
      case 'homework':
        return faBookOpen;
      case 'library':
        return faBook;
      default:
        return faChartBar;
    }
  };

  const renderSummaryStats = () => {
    if (!theme?.colors) return null;
    if (!reportData?.data?.summary) return null;

    const summary = reportData.data.summary;
    let stats = [];

    switch (selectedReport) {
      case 'attendance':
        stats = [
          {
            label: t('totalDays'),
            value: summary.total_days,
            color: theme.colors.info,
          },
          {
            label: t('present'),
            value: summary.present_days,
            color: theme.colors.success,
          },
          {
            label: t('absent'),
            value: summary.absent_days,
            color: theme.colors.danger,
          },
          {
            label: t('attendanceRate'),
            value: `${summary.attendance_rate}%`,
            color: theme.colors.primary,
          },
        ];
        break;
      case 'grades':
        stats = [
          {
            label: t('overallAverage'),
            value: summary.overall_average?.toFixed(1),
            color: theme.colors.primary,
          },
          {
            label: t('highestGrade'),
            value: summary.highest_grade?.toFixed(1),
            color: theme.colors.success,
          },
          {
            label: t('lowestGrade'),
            value: summary.lowest_grade?.toFixed(1),
            color: theme.colors.warning,
          },
          {
            label: t('totalSubjects'),
            value: summary.total_subjects,
            color: theme.colors.info,
          },
        ];
        break;
      case 'bps':
        stats = [
          {
            label: t('totalPoints'),
            value: summary.total_points,
            color: theme.colors.primary,
          },
          {
            label: t('positivePoints'),
            value: summary.positive_points,
            color: theme.colors.success,
          },
          {
            label: t('negativePoints'),
            value: summary.negative_points,
            color: theme.colors.danger,
          },
          {
            label: t('totalRecords'),
            value: summary.total_records,
            color: theme.colors.info,
          },
        ];
        break;
      case 'homework':
        stats = [
          {
            label: t('totalHomework'),
            value: summary.total_homework,
            color: theme.colors.info,
          },
          {
            label: t('completed'),
            value: summary.completed_homework,
            color: theme.colors.success,
          },
          {
            label: t('pending'),
            value: summary.pending_homework,
            color: theme.colors.warning,
          },
          {
            label: t('completionRate'),
            value: `${summary.completion_rate}%`,
            color: theme.colors.primary,
          },
        ];
        break;
      case 'library':
        stats = [
          {
            label: t('totalBooksRead'),
            value: summary.total_books_borrowed,
            color: theme.colors.info,
          },
          {
            label: t('booksReturned'),
            value: summary.books_returned,
            color: theme.colors.success,
          },
          {
            label: t('currentlyBorrowed'),
            value: summary.books_currently_borrowed,
            color: theme.colors.primary,
          },
          {
            label: t('readingHours'),
            value: summary.total_reading_hours,
            color: theme.colors.warning,
          },
        ];
        break;
    }

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>{t('summary')}</Text>
        <StatsRow
          stats={stats}
          theme={theme}
          variant='detailed'
          showDividers={true}
        />
      </View>
    );
  };

  const renderChart = () => {
    if (!theme?.colors) return null;
    if (!reportData?.data?.chart_data) return null;

    const chartData = reportData.data.chart_data;
    const chartSize = isIPadDevice ? 280 : isTabletDevice ? 240 : 200;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>{t('visualization')}</Text>

        {chartData.type === 'doughnut' && (
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
        )}

        {chartData.type === 'bar' && (
          <BarChart
            data={chartData.datasets[0].data}
            labels={chartData.labels}
            colors={chartData.datasets[0].backgroundColor}
            height={200}
            theme={theme}
            showValues={true}
            scrollable={chartData.labels.length > 6}
          />
        )}
      </View>
    );
  };

  if (loading && !reportData) {
    return <LoadingState message={t('loadingReports')} theme={theme} />;
  }

  const styles = createStyles(theme, fontSizes);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Compact Header */}
      <View style={styles.compactHeaderContainer}>
        {/* Navigation Header */}
        <View style={styles.navigationHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('myReports')}</Text>

          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <FontAwesomeIcon icon={faRefresh} size={18} color='#fff' />
          </TouchableOpacity>
        </View>

        {/* Sub Header with User Info and Tabs */}
        <View style={styles.subHeader}>
          {/* User Info Header */}
          <View style={styles.userInfoHeader}>
            <View style={styles.userAvatar}>
              <FontAwesomeIcon
                icon={faUserGraduate}
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userData?.name}</Text>
              <Text style={styles.userRole}>{t('student')}</Text>
            </View>
          </View>

          {/* Report Tabs - Compact */}
          <View style={styles.compactTabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.compactTabsContent}
            >
              {availableReports.map((report) => (
                <TouchableOpacity
                  key={report.id}
                  style={[
                    styles.compactTab,
                    selectedReport === report.id && styles.activeCompactTab,
                  ]}
                  onPress={() => setSelectedReport(report.id)}
                >
                  <FontAwesomeIcon
                    icon={getReportIcon(report.id)}
                    size={14}
                    color={
                      selectedReport === report.id
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.compactTabText,
                      selectedReport === report.id &&
                        styles.activeCompactTabText,
                    ]}
                  >
                    {report.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {reportData ? (
          <>
            {renderSummaryStats()}
            {renderChart()}
          </>
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
  // Compact Header Container
  compactHeaderContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    ...createSmallShadow(theme),
    zIndex: 1,
  },
  navigationHeader: {
    backgroundColor: theme.colors.headerBackground,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: fontSizes.large,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Sub Header (white background)
  subHeader: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  // User Info Section
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSizes.medium,
    fontWeight: '600',
    color: theme.colors.text,
  },
  userRole: {
    fontSize: fontSizes.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  // Compact Tabs (inside subHeader)
  compactTabsContainer: {
    paddingVertical: 8,
  },
  compactTabsContent: {
    paddingHorizontal: 12,
  },
  compactTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeCompactTab: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  compactTabText: {
    fontSize: fontSizes.small,
    color: theme.colors.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  activeCompactTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  // Content
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  summaryContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    ...Platform.select({
      ios: createMediumShadow(theme),
      android: { elevation: 3 },
    }),
  },
  chartContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: createMediumShadow(theme),
      android: { elevation: 3 },
    }),
  },
  sectionTitle: {
    fontSize: fontSizes.medium,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
});
