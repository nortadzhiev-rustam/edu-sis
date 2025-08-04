/**
 * AttendanceScreen - Displays student attendance records
 *
 * Features:
 * - Summary view with overall statistics
 * - Daily statistics view showing attendance by day
 * - Detailed views for absent and late records
 * - Responsive design for landscape/portrait modes
 * - Pagination for large datasets
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faClipboardCheck,
  faBell,
} from '@fortawesome/free-solid-svg-icons';
import { useScreenOrientation } from '../hooks/useScreenOrientation';
import { Config, buildApiUrl } from '../config/env';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationBadge from '../components/NotificationBadge';
import { useFocusEffect } from '@react-navigation/native';
import {
  isIPad,
  isTablet,
  getIPadLayoutConfig,
  getResponsiveFontSizes,
  getResponsiveSpacing,
} from '../utils/deviceDetection';
import { lockOrientationForDevice } from '../utils/orientationLock';
import { createCustomShadow } from '../utils/commonStyles';
import { getDemoStudentAttendanceData } from '../services/demoModeService';

export default function AttendanceScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { refreshNotifications } = useNotifications();

  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const { studentName, authCode } = route.params || {};
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState('summary'); // 'summary', 'daily', 'absent', 'late'

  // Pagination state for detail views
  const [currentPage, setCurrentPage] = useState(1);

  const styles = createStyles(theme);

  // Enable rotation for this screen
  useScreenOrientation(true);

  // Listen for orientation changes and lock orientation
  useEffect(() => {
    // Lock orientation based on device type
    lockOrientationForDevice();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
      // Reset to first page when screen size changes to avoid pagination issues
      setCurrentPage(1);
    });

    return () => subscription?.remove();
  }, []);

  const isLandscape = screenData.width > screenData.height;
  const isIPadDevice = isIPad();
  const isTabletDevice = isTablet();
  const iPadConfig = getIPadLayoutConfig();
  const responsiveFonts = getResponsiveFontSizes();
  const responsiveSpacing = getResponsiveSpacing();

  // Calculate optimal items per page based on screen size and device type
  const getItemsPerPage = () => {
    const screenHeight = screenData.height;
    const screenWidth = screenData.width;

    // Use iPad configuration if available
    if (isIPadDevice && iPadConfig) {
      const availableHeight = screenHeight - (iPadConfig.headerHeight + 200); // Reserve space for UI
      const calculatedRows = Math.floor(
        availableHeight / iPadConfig.tableRowHeight
      );
      const itemsPerPage = Math.max(
        iPadConfig.minItemsPerPage,
        Math.min(iPadConfig.maxItemsPerPage, calculatedRows)
      );

      return itemsPerPage;
    }

    // Fallback calculation for non-iPad devices
    const reservedHeight = isLandscape ? 230 : 310;
    const availableHeight = screenHeight - reservedHeight;
    const estimatedRowHeight = isLandscape ? 45 : 50;
    const calculatedRows = Math.floor(availableHeight / estimatedRowHeight);

    // Set bounds based on device type
    let minRows, maxRows;
    if (isTabletDevice) {
      minRows = 12;
      maxRows = 25;
    } else if (screenWidth >= 414) {
      minRows = 8;
      maxRows = 15;
    } else if (screenWidth >= 375) {
      minRows = 6;
      maxRows = 12;
    } else {
      minRows = 5;
      maxRows = 10;
    }

    const itemsPerPage = Math.max(minRows, Math.min(maxRows, calculatedRows));
    return itemsPerPage;
  };

  const itemsPerPage = getItemsPerPage();

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);

      // Check if this is demo mode
      if (authCode && authCode.startsWith('DEMO_AUTH_')) {
        console.log('🎭 DEMO MODE: Using demo student attendance data');
        const demoData = getDemoStudentAttendanceData();
        setAttendanceData(demoData);
        setLoading(false);
        return;
      }

      const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_ATTENDANCE, {
        authCode,
      });
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAttendanceData(data);
        }
      } else {
        // Handle error silently
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshNotifications();
    }, [refreshNotifications])
  );

  useEffect(() => {
    // Load dummy data for now
    fetchAttendanceData();
  }, []);

  // Get attendance statistics from API data
  const getAttendanceStats = () => {
    if (!attendanceData?.summary_statistics) {
      return {
        totalDays: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        attendanceRate: 0,
      };
    }

    const stats = attendanceData.summary_statistics;
    return {
      totalDays: stats.total_school_days || 0,
      presentCount: stats.total_present || 0,
      absentCount: stats.total_absent || 0,
      lateCount: stats.total_late || 0,
      excusedCount: 0, // Not provided in new API
      attendanceRate: stats.overall_attendance_percentage || 0,
    };
  };

  // Filter data based on selected view
  const getFilteredData = () => {
    const attendanceRecords = attendanceData?.attendance_records || [];

    switch (selectedView) {
      case 'absent':
        return attendanceRecords.filter((item) => item.status === 'ABSENT');
      case 'late':
        return attendanceRecords.filter((item) => item.status === 'LATE');
      case 'daily':
        return attendanceData?.daily_statistics || [];
      default:
        return attendanceRecords;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PRESENT':
        return '#34C759';
      case 'ABSENT':
        return '#FF3B30';
      case 'LATE':
        return '#FF9500';
      case 'EXCUSED':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'PRESENT':
        return '✓';
      case 'ABSENT':
        return '✗';
      case 'LATE':
        return '⏰';
      case 'EXCUSED':
        return '📝';
      default:
        return '?';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get current data and stats
  const stats = getAttendanceStats();
  const filteredData = getFilteredData();

  // Pagination logic for detail views
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === 1 && styles.disabledButton,
          ]}
          onPress={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Text
            style={[
              styles.paginationButtonText,
              currentPage === 1 && styles.disabledButtonText,
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <Text style={styles.paginationInfo}>
          Page {currentPage} of {totalPages}
          {__DEV__ && (
            <Text style={styles.debugInfo}> ({itemsPerPage}/page)</Text>
          )}
        </Text>

        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === totalPages && styles.disabledButton,
          ]}
          onPress={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Text
            style={[
              styles.paginationButtonText,
              currentPage === totalPages && styles.disabledButtonText,
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTableHeader = () => (
    <View
      style={[styles.tableHeader, isLandscape && styles.landscapeTableHeader]}
    >
      <Text style={[styles.headerText, styles.dateColumn]}>Date</Text>
      {isLandscape && (
        <Text style={[styles.headerText, styles.weekdayColumn]}>Day</Text>
      )}
      <Text style={[styles.headerText, styles.subjectColumn]}>Subject</Text>
      {isLandscape && (
        <Text style={[styles.headerText, styles.periodColumn]}>Period</Text>
      )}
      <Text style={[styles.headerText, styles.statusColumn]}>Status</Text>
    </View>
  );

  const renderAttendanceRow = ({ item }) => (
    <View style={[styles.tableRow, isLandscape && styles.landscapeTableRow]}>
      <Text style={[styles.cellText, styles.dateColumn]}>
        {formatDate(item.date)}
      </Text>
      {isLandscape && (
        <Text style={[styles.cellText, styles.weekdayColumn]}>
          {item.weekday}
        </Text>
      )}
      <Text style={[styles.cellText, styles.subjectColumn]} numberOfLines={2}>
        {item.subject} {item.grade && `(${item.grade})`}
      </Text>
      {isLandscape && (
        <Text style={[styles.cellText, styles.periodColumn]}>
          {item.period}
        </Text>
      )}
      <View style={[styles.statusContainer, styles.statusColumn]}>
        <Text
          style={[styles.statusIcon, { color: getStatusColor(item.status) }]}
        >
          {getStatusIcon(item.status)}
        </Text>
        <Text
          style={[styles.statusText, { color: getStatusColor(item.status) }]}
        >
          {item.status}
        </Text>
      </View>
    </View>
  );

  // Render summary statistics cards
  const renderSummaryView = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.statsGrid}>
        {/* Total Days Card */}
        <View style={[styles.statCard, styles.totalDaysCard]}>
          <Text style={styles.statNumber}>{stats.totalDays}</Text>
          <Text style={styles.statLabel}>Total Days</Text>
        </View>

        {/* Present Card */}
        <View style={[styles.statCard, styles.presentCard]}>
          <Text style={styles.statNumber}>{stats.presentCount}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>

        {/* Absent Card - Clickable */}
        <TouchableOpacity
          style={[styles.statCard, styles.absentCard]}
          onPress={() => {
            if (stats.absentCount > 0) {
              setSelectedView('absent');
              setCurrentPage(1);
            }
          }}
          disabled={stats.absentCount === 0}
        >
          <Text style={styles.statNumber}>{stats.absentCount}</Text>
          <Text style={styles.statLabel}>Absent</Text>
          {stats.absentCount > 0 && (
            <Text style={styles.clickHint}>Tap to view</Text>
          )}
        </TouchableOpacity>

        {/* Late Card - Clickable */}
        <TouchableOpacity
          style={[styles.statCard, styles.lateCard]}
          onPress={() => {
            if (stats.lateCount > 0) {
              setSelectedView('late');
              setCurrentPage(1);
            }
          }}
          disabled={stats.lateCount === 0}
        >
          <Text style={styles.statNumber}>{stats.lateCount}</Text>
          <Text style={styles.statLabel}>Late</Text>
          {stats.lateCount > 0 && (
            <Text style={styles.clickHint}>Tap to view</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Daily Statistics Button */}
      <TouchableOpacity
        style={styles.dailyStatsButton}
        onPress={() => {
          setSelectedView('daily');
          setCurrentPage(1);
        }}
      >
        <Text style={styles.dailyStatsButtonText}>View Daily Statistics</Text>
      </TouchableOpacity>

      {/* Attendance Rate */}
      <View style={styles.attendanceRateCard}>
        <Text style={styles.attendanceRateLabel}>Attendance Rate</Text>
        <Text style={styles.attendanceRateValue}>{stats.attendanceRate}%</Text>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${stats.attendanceRate}%` }]}
          />
        </View>
      </View>
    </View>
  );

  const renderDailyTableHeader = () => (
    <View
      style={[styles.tableHeader, isLandscape && styles.landscapeTableHeader]}
    >
      <Text style={[styles.headerText, styles.dateColumn]}>Date</Text>
      {isLandscape && (
        <Text style={[styles.headerText, styles.weekdayColumn]}>Day</Text>
      )}
      <Text style={[styles.headerText, styles.subjectColumn]}>Present</Text>
      <Text style={[styles.headerText, styles.periodColumn]}>Absent</Text>
      <Text style={[styles.headerText, styles.statusColumn]}>Rate %</Text>
    </View>
  );

  const renderDailyRow = ({ item }) => (
    <View style={[styles.tableRow, isLandscape && styles.landscapeTableRow]}>
      <Text style={[styles.cellText, styles.dateColumn]}>
        {formatDate(item.date)}
      </Text>
      {isLandscape && (
        <Text style={[styles.cellText, styles.weekdayColumn]}>
          {item.weekday}
        </Text>
      )}
      <Text style={[styles.cellText, styles.subjectColumn]}>
        {item.present_count}
      </Text>
      <Text style={[styles.cellText, styles.periodColumn]}>
        {item.absent_count}
      </Text>
      <View style={[styles.statusContainer, styles.statusColumn]}>
        <Text
          style={[
            styles.statusText,
            {
              color:
                item.attendance_percentage >= 80
                  ? '#34C759'
                  : item.attendance_percentage >= 60
                  ? '#FF9500'
                  : '#FF3B30',
            },
          ]}
        >
          {item.attendance_percentage}%
        </Text>
      </View>
    </View>
  );

  const renderDailyView = () => (
    <View style={styles.tableWithPagination}>
      <View style={styles.tableSection}>
        <View
          style={[
            styles.tableContainer,
            isLandscape && styles.landscapeTableContainer,
            isIPadDevice && styles.iPadTableContainer,
            isTabletDevice && styles.tabletTableContainer,
          ]}
        >
          {renderDailyTableHeader()}
          <FlatList
            data={paginatedData}
            renderItem={renderDailyRow}
            keyExtractor={(item, index) => `daily-${index}`}
            showsVerticalScrollIndicator={false}
            style={styles.tableBody}
            nestedScrollEnabled={true}
          />
        </View>
      </View>
      <View
        style={[
          styles.paginationSection,
          isLandscape && styles.landscapePaginationSection,
          isIPadDevice && styles.iPadPaginationSection,
          isTabletDevice && styles.tabletPaginationSection,
        ]}
      >
        {renderPaginationControls()}
      </View>
    </View>
  );

  const renderDetailView = () => (
    <View style={styles.tableWithPagination}>
      <View style={styles.tableSection}>
        <View
          style={[
            styles.tableContainer,
            isLandscape && styles.landscapeTableContainer,
            isIPadDevice && styles.iPadTableContainer,
            isTabletDevice && styles.tabletTableContainer,
          ]}
        >
          {renderTableHeader()}
          <FlatList
            data={paginatedData}
            renderItem={renderAttendanceRow}
            keyExtractor={(item, index) => `attendance-${index}`}
            showsVerticalScrollIndicator={false}
            style={styles.tableBody}
            nestedScrollEnabled={true}
          />
        </View>
      </View>
      <View
        style={[
          styles.paginationSection,
          isLandscape && styles.landscapePaginationSection,
          isIPadDevice && styles.iPadPaginationSection,
          isTabletDevice && styles.tabletPaginationSection,
        ]}
      >
        {renderPaginationControls()}
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#007AFF' />
          <Text style={styles.loadingText}>{t('loadingAttendanceData')}</Text>
        </View>
      );
    }

    if (
      !attendanceData?.attendance_records ||
      attendanceData.attendance_records.length === 0
    ) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesomeIcon icon={faClipboardCheck} size={48} color='#8E8E93' />
          <Text style={styles.emptyText}>No attendance records found</Text>
          <Text style={styles.emptySubtext}>
            Attendance data will appear here once available
          </Text>
        </View>
      );
    }

    // Show summary view by default, detail views when specific status is selected
    if (selectedView === 'summary') {
      return renderSummaryView();
    } else if (selectedView === 'daily') {
      return renderDailyView();
    } else {
      return renderDetailView();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Compact Header */}
      <View style={styles.compactHeaderContainer}>
        {/* Navigation Header */}
        <View style={styles.navigationHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (selectedView === 'summary') {
                navigation.goBack();
              } else {
                setSelectedView('summary');
              }
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('attendance')}</Text>

          <View style={styles.headerRight} />
        </View>

        {/* Student Info Subheader - Hidden in landscape mode */}
        {!isLandscape && (
          <View style={styles.subHeader}>
            <Text style={styles.studentName}>
              {studentName || t('student')}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {selectedView === 'summary'
                ? t('attendanceSummary')
                : selectedView === 'daily'
                ? t('dailyStatistics')
                : selectedView === 'absent'
                ? t('absentRecords')
                : t('lateRecords')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {isLandscape ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scrollContainer}
          >
            {renderContent()}
          </ScrollView>
        ) : (
          <View style={styles.scrollContainer}>{renderContent()}</View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    // Compact Header Styles
    compactHeaderContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      overflow: 'hidden',
      zIndex: 1,
    },
    navigationHeader: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    subHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    // Legacy header style (keeping for compatibility)
    header: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
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
      fontSize: isIPad ? getResponsiveFontSizes().title : 20,
      fontWeight: 'bold',
      marginLeft: 20,
    },
    notificationButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    studentSection: {
      backgroundColor: theme.colors.surface,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    studentName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 5,
    },
    sectionSubtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    scrollContainer: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 20,
      marginBottom: 10,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    tableWithPagination: {
      flex: 1,
      justifyContent: 'space-between',
    },
    tableSection: {
      flex: 1,
      minHeight: 0, // Important for flex children
    },
    tableContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.1,
        radius: 3,
        elevation: 3,
      }),
      flex: 1,
    },
    landscapeTableContainer: {
      minWidth: 700,
    },
    tabletTableContainer: {
      minHeight: 500, // Ensure minimum height on tablets
    },
    iPadTableContainer: {
      minHeight: 600, // iPad gets even more height
      borderRadius: 16, // Larger border radius for iPad
      ...createCustomShadow(theme, {
        height: 4,
        opacity: 0.15,
        radius: 6,
        elevation: 6,
      }),
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#34C759',
      paddingVertical: 15,
      paddingHorizontal: 10,
    },
    landscapeTableHeader: {
      paddingHorizontal: 15,
    },
    headerText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    tableBody: {
      flex: 1,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      alignItems: 'center',
    },
    landscapeTableRow: {
      paddingHorizontal: 15,
    },
    cellText: {
      fontSize: 13,
      color: theme.colors.text,
      textAlign: 'center',
    },
    dateColumn: {
      flex: 2,
    },
    weekdayColumn: {
      flex: 1.5,
    },
    subjectColumn: {
      flex: 2.5,
    },
    periodColumn: {
      flex: 1,
    },
    statusColumn: {
      flex: 2,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusIcon: {
      fontSize: 16,
      marginRight: 5,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    paginationSection: {
      marginTop: 15,
    },
    landscapePaginationSection: {
      marginTop: 20,
    },
    tabletPaginationSection: {
      marginTop: 25,
      paddingHorizontal: 20,
    },
    iPadPaginationSection: {
      marginTop: 30,
      paddingHorizontal: 30,
      paddingVertical: 20,
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: 15,
      borderRadius: 40,
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.1,
        radius: 2,
        elevation: 2,
      }),
    },
    paginationButton: {
      backgroundColor: '#34C759',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    disabledButton: {
      backgroundColor: '#ccc',
    },
    paginationButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    disabledButtonText: {
      color: '#999',
    },
    paginationInfo: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    debugInfo: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '400',
    },
    // Summary View Styles
    summaryContainer: {
      flex: 1,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    statCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      width: '48%',
      marginBottom: 15,
      alignItems: 'center',
      ...theme.shadows.small,
    },
    totalDaysCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#007AFF',
    },
    presentCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#34C759',
    },
    absentCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#FF3B30',
    },
    lateCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#FF9500',
    },
    statNumber: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 5,
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    clickHint: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      marginTop: 5,
      fontStyle: 'italic',
    },
    attendanceRateCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      ...theme.shadows.small,
    },
    attendanceRateLabel: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 10,
    },
    attendanceRateValue: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#34C759',
      marginBottom: 15,
    },
    progressBar: {
      width: '100%',
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#34C759',
      borderRadius: 4,
    },
    backToSummaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 20,
      marginBottom: 15,
      alignSelf: 'flex-start', // This ensures the button only takes the width it needs
      ...theme.shadows.small,
    },
    backToSummaryText: {
      marginLeft: 8,
      fontSize: 16,
      color: '#34C759',
      fontWeight: '600',
    },
    dailyStatsButton: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 15,
      alignItems: 'center',
      marginTop: 10,
      ...theme.shadows.small,
      marginBottom: 15,
    },
    dailyStatsButtonText: {
      fontSize: 16,
      color: '#007AFF',
      fontWeight: '600',
    },
  });
