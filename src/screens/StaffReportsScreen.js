/**
 * Staff Reports Screen
 * Displays comprehensive reports for staff including class attendance, assessment, behavioral analytics, and homework analytics
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
  faUsers,
  faTasks,
  faRefresh,
  faChevronDown,
  faChalkboardTeacher,
} from '@fortawesome/free-solid-svg-icons';

import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getStaffClasses,
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

export default function StaffReportsScreen({ navigation, route }) {
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
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedReport, setSelectedReport] = useState('class-attendance');
  const [reportData, setReportData] = useState(null);
  const [showClassPicker, setShowClassPicker] = useState(false);

  // Report types for staff
  const reportTypes = [
    {
      id: 'class-attendance',
      name: t('classAttendance'),
      icon: faCalendarCheck,
      requiresClass: true,
    },
    {
      id: 'class-assessment',
      name: t('classAssessment'),
      icon: faChartBar,
      requiresClass: true,
    },
    {
      id: 'behavioral-analytics',
      name: t('behavioralAnalytics'),
      icon: faUsers,
      requiresClass: false,
    },
    {
      id: 'homework-analytics',
      name: t('homeworkAnalytics'),
      icon: faTasks,
      requiresClass: false,
    },
  ];

  // Load available classes on mount
  useEffect(() => {
    loadAvailableClasses();
  }, []);

  // Load specific report when selection changes
  useEffect(() => {
    if (selectedReport && userData?.authCode) {
      loadReportData(selectedReport);
    }
  }, [selectedReport, selectedClass]);

  // Safety check for theme
  if (!theme?.colors) {
    console.error('Theme not properly initialized in StaffReportsScreen');
    return null;
  }

  const loadAvailableClasses = async () => {
    try {
      setLoading(true);
      const response = await getStaffClasses(userData?.authCode);

      if (response?.success) {
        setAvailableClasses(response.classes || []);
        // Set first available class as default
        if (response.classes?.length > 0) {
          setSelectedClass(response.classes[0]);
        }
      }
    } catch (error) {
      console.error('Error loading available classes:', error);
      Alert.alert(t('error'), t('failedToLoadClasses'));
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async (reportType) => {
    try {
      setLoading(true);
      let response = null;

      switch (reportType) {
        case 'class-attendance':
          if (!selectedClass) return;
          response = await getClassAttendanceReport(
            userData?.authCode,
            selectedClass.classroom_id
          );
          break;
        case 'class-assessment':
          if (!selectedClass) return;
          response = await getClassAssessmentReport(
            userData?.authCode,
            selectedClass.classroom_id
          );
          break;
        case 'behavioral-analytics':
          response = await getBehavioralAnalyticsReport(
            userData?.authCode,
            selectedClass?.classroom_id
          );
          break;
        case 'homework-analytics':
          if (!selectedClass) return;
          response = await getHomeworkAnalyticsReport(
            userData?.authCode,
            selectedClass.classroom_id
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

  const renderClassPicker = () => {
    if (!theme?.colors) return null;

    const currentReport = reportTypes.find((r) => r.id === selectedReport);
    if (!currentReport?.requiresClass || availableClasses.length === 0)
      return null;

    return (
      <View style={styles.compactClassPickerContainer}>
        <TouchableOpacity
          style={styles.compactClassPicker}
          onPress={() => setShowClassPicker(!showClassPicker)}
        >
          <Text style={styles.compactClassPickerText}>
            {selectedClass?.classroom_name || t('selectClass')}
          </Text>
          <FontAwesomeIcon
            icon={faChevronDown}
            size={12}
            color={theme.colors.textSecondary}
            style={{
              transform: [{ rotate: showClassPicker ? '180deg' : '0deg' }],
            }}
          />
        </TouchableOpacity>

        {showClassPicker && (
          <View style={styles.compactClassDropdown}>
            {availableClasses.map((classItem) => (
              <TouchableOpacity
                key={classItem.classroom_id}
                style={[
                  styles.compactClassOption,
                  selectedClass?.classroom_id === classItem.classroom_id &&
                    styles.selectedCompactClassOption,
                ]}
                onPress={() => {
                  setSelectedClass(classItem);
                  setShowClassPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.compactClassOptionText,
                    selectedClass?.classroom_id === classItem.classroom_id &&
                      styles.selectedCompactClassOptionText,
                  ]}
                >
                  {classItem.classroom_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderSummaryStats = () => {
    if (!theme?.colors) return null;
    if (!reportData?.data?.summary) return null;

    const summary = reportData.data.summary;
    let stats = [];

    switch (selectedReport) {
      case 'class-attendance':
        stats = [
          {
            label: t('totalStudents'),
            value: summary.total_students,
            color: theme.colors.info,
          },
          {
            label: t('attendanceRate'),
            value: `${summary.attendance_rate}%`,
            color: theme.colors.primary,
          },
          {
            label: t('presentCount'),
            value: summary.present_count,
            color: theme.colors.success,
          },
          {
            label: t('absentCount'),
            value: summary.absent_count,
            color: theme.colors.danger,
          },
        ];
        break;
      case 'class-assessment':
        stats = [
          {
            label: t('classAverage'),
            value: summary.class_average?.toFixed(1),
            color: theme.colors.primary,
          },
          {
            label: t('highestScore'),
            value: summary.highest_score?.toFixed(1),
            color: theme.colors.success,
          },
          {
            label: t('lowestScore'),
            value: summary.lowest_score?.toFixed(1),
            color: theme.colors.warning,
          },
          {
            label: t('totalStudents'),
            value: summary.total_students,
            color: theme.colors.info,
          },
        ];
        break;
      case 'behavioral-analytics':
        stats = [
          {
            label: t('totalRecords'),
            value: summary.total_records,
            color: theme.colors.info,
          },
          {
            label: t('positiveRecords'),
            value: summary.positive_records,
            color: theme.colors.success,
          },
          {
            label: t('negativeRecords'),
            value: summary.negative_records,
            color: theme.colors.danger,
          },
          {
            label: t('positivePercentage'),
            value: `${summary.positive_percentage}%`,
            color: theme.colors.primary,
          },
        ];
        break;
      case 'homework-analytics':
        stats = [
          {
            label: t('totalAssigned'),
            value: summary.total_homework_assigned,
            color: theme.colors.info,
          },
          {
            label: t('completionRate'),
            value: `${summary.completion_rate}%`,
            color: theme.colors.primary,
          },
          {
            label: t('totalSubmissions'),
            value: summary.total_submissions,
            color: theme.colors.success,
          },
          {
            label: t('completedSubmissions'),
            value: summary.completed_submissions,
            color: theme.colors.success,
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

          <Text style={styles.headerTitle}>{t('staffReports')}</Text>

          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <FontAwesomeIcon icon={faRefresh} size={18} color='#fff' />
          </TouchableOpacity>
        </View>

        {/* Sub Header with User Info, Tabs, and Class Picker */}
        <View style={styles.subHeader}>
          {/* User Info Header */}
          <View style={styles.userInfoHeader}>
            <View style={styles.userAvatar}>
              <FontAwesomeIcon
                icon={faChalkboardTeacher}
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userData?.name}</Text>
              <Text style={styles.userRole}>{t('teacher')}</Text>
            </View>
          </View>

          {/* Report Tabs - Compact */}
          <View style={styles.compactTabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.compactTabsContent}
            >
              {reportTypes.map((report) => (
                <TouchableOpacity
                  key={report.id}
                  style={[
                    styles.compactTab,
                    selectedReport === report.id && styles.activeCompactTab,
                  ]}
                  onPress={() => setSelectedReport(report.id)}
                >
                  <FontAwesomeIcon
                    icon={report.icon}
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

          {/* Class Picker - Compact */}
          {renderClassPicker()}
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
            message={t('selectClassAndReport')}
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
    marginBottom: 8,
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
  // Compact Class Picker (inside subHeader)
  compactClassPickerContainer: {
    marginTop: 8,
  },
  compactClassPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  compactClassPickerText: {
    fontSize: fontSizes.small,
    color: theme.colors.text,
    flex: 1,
    fontWeight: '500',
  },
  compactClassDropdown: {
    marginTop: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: createSmallShadow(theme),
      android: { elevation: 3 },
    }),
  },
  compactClassOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedCompactClassOption: {
    backgroundColor: theme.colors.primaryLight,
  },
  compactClassOptionText: {
    fontSize: fontSizes.small,
    color: theme.colors.text,
  },
  selectedCompactClassOptionText: {
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
