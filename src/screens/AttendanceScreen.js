/**
 * AttendanceScreen - Displays student attendance records
 *
 * Currently using dummy data for development.
 * To switch to real API:
 * 1. Uncomment the fetchAttendanceData function
 * 2. Replace loadDummyAttendanceData() call with fetchAttendanceData() in useEffect
 * 3. Add back authCode parameter usage
 * 4. Add back Alert import for error handling
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faClipboardCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useScreenOrientation } from '../hooks/useScreenOrientation';
import { Config, buildApiUrl } from '../config/env';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function AttendanceScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const { studentName, authCode } = route.params || {};
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState('summary'); // 'summary', 'absent', 'late'

  // Pagination state for detail views
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const styles = createStyles(theme);

  // Enable rotation for this screen
  useScreenOrientation(true);

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const isLandscape = screenData.width > screenData.height;

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
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
        setAttendance(data.data);
      } else {
        // Handle error silently
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load dummy data for now
    fetchAttendanceData();
  }, []);

  // Calculate attendance statistics
  const getAttendanceStats = () => {
    const totalDays = attendance.length;
    const presentCount = attendance.filter(
      (item) => item.status === 'PRESENT' || item.status === 'LATE'
    ).length;
    const absentCount = attendance.filter(
      (item) => item.status === 'ABSENT'
    ).length;
    const lateCount = attendance.filter(
      (item) => item.status === 'LATE'
    ).length;
    const excusedCount = attendance.filter(
      (item) => item.status === 'EXCUSED'
    ).length;

    return {
      totalDays,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate:
        totalDays > 0
          ? (((presentCount + lateCount) / totalDays) * 100).toFixed(1)
          : 0,
    };
  };

  // Filter data based on selected view
  const getFilteredData = () => {
    switch (selectedView) {
      case 'absent':
        return attendance.filter((item) => item.status === 'ABSENT');
      case 'late':
        return attendance.filter((item) => item.status === 'LATE');
      default:
        return attendance;
    }
  };

  // const loadDummyAttendanceData = () => {
  //   setLoading(true);

  //   // Simulate API loading delay
  //   setTimeout(() => {
  //     const dummyData = [
  //       {
  //         date: '2024-01-15',
  //         weekday: 'Monday',
  //         subject: 'Mathematics',
  //         period: '1',
  //         status: 'PRESENT',
  //         attendance_note: null,
  //       },
  //       {
  //         date: '2024-01-15',
  //         weekday: 'Monday',
  //         subject: 'English Literature',
  //         period: '2',
  //         status: 'PRESENT',
  //         attendance_note: null,
  //       },
  //       {
  //         date: '2024-01-15',
  //         weekday: 'Monday',
  //         subject: 'Physics',
  //         period: '3',
  //         status: 'LATE',
  //         attendance_note: 'Arrived 10 minutes late',
  //       },
  //       {
  //         date: '2024-01-16',
  //         weekday: 'Tuesday',
  //         subject: 'Chemistry',
  //         period: '1',
  //         status: 'PRESENT',
  //         attendance_note: null,
  //       },
  //       {
  //         date: '2024-01-16',
  //         weekday: 'Tuesday',
  //         subject: 'History',
  //         period: '2',
  //         status: 'ABSENT',
  //         attendance_note: 'Sick leave',
  //       },
  //       {
  //         date: '2024-01-16',
  //         weekday: 'Tuesday',
  //         subject: 'Biology',
  //         period: '3',
  //         status: 'ABSENT',
  //         attendance_note: 'Medical appointment',
  //       },
  //       {
  //         date: '2024-01-17',
  //         weekday: 'Wednesday',
  //         subject: 'Mathematics',
  //         period: '1',
  //         status: 'PRESENT',
  //         attendance_note: null,
  //       },
  //       {
  //         date: '2024-01-17',
  //         weekday: 'Wednesday',
  //         subject: 'Art',
  //         period: '2',
  //         status: 'PRESENT',
  //         attendance_note: null,
  //       },
  //       {
  //         date: '2024-01-17',
  //         weekday: 'Wednesday',
  //         subject: 'Physical Education',
  //         period: '3',
  //         status: 'PRESENT',
  //         attendance_note: null,
  //       },
  //       {
  //         date: '2024-01-18',
  //         weekday: 'Thursday',
  //         subject: 'Computer Science',
  //         period: '1',
  //         status: 'LATE',
  //         attendance_note: 'Traffic delay',
  //       },
  //       {
  //         date: '2024-01-18',
  //         weekday: 'Thursday',
  //         subject: 'Geography',
  //         period: '2',
  //         status: 'PRESENT',
  //         attendance_note: null,
  //       },
  //       {
  //         date: '2024-01-18',
  //         weekday: 'Thursday',
  //         subject: 'Music',
  //         period: '3',
  //         status: 'PRESENT',
  //         attendance_note: null,
  //       },
  //       {
  //         date: '2024-01-19',
  //         weekday: 'Friday',
  //         subject: 'Economics',
  //         period: '1',
  //         status: 'PRESENT',
  //         attendance_note: null,
  //       },
  //       {
  //         date: '2024-01-19',
  //         weekday: 'Friday',
  //         subject: 'French',
  //         period: '2',
  //         status: 'ABSENT',
  //         attendance_note: 'Family emergency',
  //       },
  //       {
  //         date: '2024-01-19',
  //         weekday: 'Friday',
  //         subject: 'Drama',
  //         period: '3',
  //         status: 'PRESENT',
  //         attendance_note: null,
  //       },
  //     ];

  //     setAttendance(dummyData);
  //     setLoading(false);
  //   }, 1000); // 1 second delay to simulate loading
  // };

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
        {item.subject}
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

  const renderDetailView = () => (
    <View style={styles.tableWithPagination}>
      {/* Back to Summary Button */}
      <TouchableOpacity
        style={styles.backToSummaryButton}
        onPress={() => setSelectedView('summary')}
      >
        <FontAwesomeIcon icon={faArrowLeft} size={16} color='#34C759' />
        <Text style={styles.backToSummaryText}>Back to Summary</Text>
      </TouchableOpacity>

      <View style={styles.tableSection}>
        <View
          style={[
            styles.tableContainer,
            isLandscape && styles.landscapeTableContainer,
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
          <Text style={styles.loadingText}>Loading attendance data...</Text>
        </View>
      );
    }

    if (attendance.length === 0) {
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
    } else {
      return renderDetailView();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('attendance')}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Student Name Section - Hidden in landscape mode */}
      {!isLandscape && (
        <View style={styles.studentSection}>
          <Text style={styles.studentName}>{studentName || 'Student'}</Text>
          <Text style={styles.sectionSubtitle}>
            {selectedView === 'summary'
              ? 'Attendance Summary'
              : selectedView === 'absent'
              ? 'Absent Records'
              : 'Late Records'}
          </Text>
        </View>
      )}

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
    header: {
      backgroundColor: theme.colors.success,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
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
      fontSize: 20,
      fontWeight: 'bold',
    },
    headerRight: {
      width: 36,
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
      color: '#666',
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
      color: '#333',
      marginTop: 20,
      marginBottom: 10,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
      lineHeight: 20,
    },
    tableWithPagination: {
      flex: 1,
    },
    tableSection: {
      flex: 1,
    },
    tableContainer: {
      backgroundColor: '#fff',
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    landscapeTableContainer: {
      minWidth: 700,
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
      maxHeight: 400,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
      alignItems: 'center',
    },
    landscapeTableRow: {
      paddingHorizontal: 15,
    },
    cellText: {
      fontSize: 13,
      color: '#333',
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
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: 15,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    paginationButton: {
      backgroundColor: '#34C759',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
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
      color: '#666',
      fontWeight: '500',
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
      ...theme.shadows.medium,
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
      ...theme.shadows.medium,
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
      padding: 12,
      borderRadius: 8,
      marginBottom: 15,
      ...theme.shadows.small,
    },
    backToSummaryText: {
      marginLeft: 8,
      fontSize: 16,
      color: '#34C759',
      fontWeight: '600',
    },
  });
