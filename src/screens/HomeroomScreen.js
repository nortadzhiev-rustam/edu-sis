import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faUsers,
  faClipboardList,
  faCalendarCheck,
  faUserGraduate,
  faMars,
  faVenus,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Config, buildApiUrl } from '../config/env';

export default function HomeroomScreen({ route, navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { authCode } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classroomData, setClassroomData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [studentsData, setStudentsData] = useState([]);
  const [disciplineData, setDisciplineData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHomeroomData();
  }, []);

  const loadHomeroomData = async () => {
    if (!authCode) {
      setError('No authentication code provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First fetch classrooms to get classroom_id
      const classroom = await fetchClassrooms();

      if (classroom) {
        // Then fetch other data that depends on classroom_id
        await Promise.all([
          fetchTodayAttendance(classroom),
          fetchStudents(classroom),
          fetchDisciplineRecords(classroom),
        ]);
      } else {
        setError('No homeroom classroom found for this teacher');
      }
    } catch (error) {
      console.error('Error loading homeroom data:', error);
      setError('Failed to load homeroom data: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const url = buildApiUrl(Config.API_ENDPOINTS.GET_HOMEROOM_CLASSROOMS, {
        auth_code: authCode,
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

        if (data.success && data.data && data.data.length > 0) {
          const classroom = data.data[0]; // Assuming teacher has one homeroom
          setClassroomData(classroom);
          return classroom;
        }
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
    return null;
  };

  const fetchTodayAttendance = async (currentClassroomData = null) => {
    const classroom = currentClassroomData || classroomData;
    if (!classroom?.classroom_id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const url = buildApiUrl(Config.API_ENDPOINTS.GET_HOMEROOM_ATTENDANCE, {
        auth_code: authCode,
        classroom_id: classroom.classroom_id,
        date: today,
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
          setAttendanceData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchStudents = async (currentClassroomData = null) => {
    const classroom = currentClassroomData || classroomData;
    if (!classroom?.classroom_id) return;

    try {
      const url = buildApiUrl(Config.API_ENDPOINTS.GET_HOMEROOM_STUDENTS, {
        classroom_id: classroom.classroom_id,
        auth_code: authCode,
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
          // Handle different possible data structures
          let studentsData = {};
          if (Array.isArray(data.data)) {
            studentsData = { students: data.data };
          } else if (data.data && Array.isArray(data.data.students)) {
            studentsData = data.data;
          } else if (data.data?.data && Array.isArray(data.data.data)) {
            studentsData = { students: data.data.data };
          } else {
            studentsData = { students: [] };
          }
          setStudentsData(studentsData);
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchDisciplineRecords = async (currentClassroomData = null) => {
    const classroom = currentClassroomData || classroomData;
    if (!classroom?.classroom_id) return;

    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const url = buildApiUrl(Config.API_ENDPOINTS.GET_HOMEROOM_DISCIPLINE, {
        classroom_id: classroom.classroom_id,
        start_date: startDate,
        end_date: endDate,
        auth_code: authCode,
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
          setDisciplineData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching discipline records:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeroomData();
  };

  const renderActionButton = (
    title,
    subtitle,
    icon,
    color,
    onPress,
    count = null
  ) => (
    <TouchableOpacity
      style={[styles.actionButton, { borderLeftColor: color }]}
      onPress={onPress}
    >
      <View style={styles.actionButtonContent}>
        <View
          style={[styles.actionButtonIcon, { backgroundColor: color + '15' }]}
        >
          <FontAwesomeIcon icon={icon} size={24} color={color} />
        </View>
        <View style={styles.actionButtonText}>
          <Text style={styles.actionButtonTitle}>{title}</Text>
          <Text style={styles.actionButtonSubtitle}>{subtitle}</Text>
        </View>
        {count !== null && (
          <View style={[styles.actionButtonBadge, { backgroundColor: color }]}>
            <Text style={styles.actionButtonBadgeText}>{count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
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

            <Text style={styles.headerTitle}>Homeroom</Text>

            <View style={styles.headerRight} />
          </View>

          {/* Loading Subheader */}
          <View style={styles.subHeader}>
            <View style={styles.loadingSubheader}>
              <ActivityIndicator size='small' color={theme.colors.primary} />
              <Text style={styles.loadingSubheaderText}>
                Loading homeroom data...
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
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

            <Text style={styles.headerTitle}>Homeroom</Text>

            <View style={styles.headerRight} />
          </View>

          {/* Error Subheader */}
          <View style={styles.subHeader}>
            <View style={styles.errorSubheader}>
              <Text style={styles.errorSubheaderText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadHomeroomData}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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

          <Text style={styles.headerTitle}>Homeroom</Text>

          <View style={styles.headerRight} />
        </View>

        {/* Classroom Overview Subheader */}
        {classroomData && (
          <View style={styles.subHeader}>
            <View style={styles.classroomInfoSection}>
              <View style={styles.compactIconContainer}>
                <FontAwesomeIcon icon={faUserGraduate} size={20} color={theme.mode === 'dark' ? '#fff' : theme.colors.primary} />
              </View>
              <View style={styles.compactTitleContainer}>
                <Text style={styles.compactClassroomTitle}>
                  {classroomData.classroom_name}
                </Text>
                <Text style={styles.compactClassroomSubtitle}>
                  Homeroom Class
                </Text>
              </View>
            </View>

            <View style={styles.compactStatsContainer}>
              <View style={styles.compactStatItem}>
                <FontAwesomeIcon icon={faUsers} size={16} color='#007AFF' />
                <Text style={styles.compactStatNumber}>
                  {classroomData.total_students}
                </Text>
                <Text style={styles.compactStatLabel}>Total</Text>
              </View>

              <View style={styles.compactStatDivider} />

              <View style={styles.compactStatItem}>
                <FontAwesomeIcon icon={faMars} size={16} color='#34C759' />
                <Text style={styles.compactStatNumber}>
                  {classroomData.male_students}
                </Text>
                <Text style={styles.compactStatLabel}>Male</Text>
              </View>

              <View style={styles.compactStatDivider} />

              <View style={styles.compactStatItem}>
                <FontAwesomeIcon icon={faVenus} size={16} color='#FF9F0A' />
                <Text style={styles.compactStatNumber}>
                  {classroomData.female_students}
                </Text>
                <Text style={styles.compactStatLabel}>Female</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Today's Attendance Summary */}
        {attendanceData && (
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Today's Attendance</Text>
            <View style={styles.attendanceStats}>
              <View
                style={[styles.attendanceStat, { backgroundColor: '#34C759' }]}
              >
                <Text style={styles.attendanceNumber}>
                  {attendanceData.summary.present}
                </Text>
                <Text style={styles.attendanceLabel}>Present</Text>
              </View>
              <View
                style={[styles.attendanceStat, { backgroundColor: '#FF9500' }]}
              >
                <Text style={styles.attendanceNumber}>
                  {attendanceData.summary.late}
                </Text>
                <Text style={styles.attendanceLabel}>Late</Text>
              </View>
              <View
                style={[styles.attendanceStat, { backgroundColor: '#FF3B30' }]}
              >
                <Text style={styles.attendanceNumber}>
                  {attendanceData.summary.absent}
                </Text>
                <Text style={styles.attendanceLabel}>Absent</Text>
              </View>
            </View>
            <Text style={styles.attendanceRate}>
              Attendance Rate: {attendanceData.summary.attendance_rate}%
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Homeroom Management</Text>

          {renderActionButton(
            'View Students',
            `${studentsData?.students?.length || 0} students in class`,
            faUsers,
            '#007AFF',
            () =>
              navigation.navigate('HomeroomStudentsScreen', {
                authCode,
                classroomData,
              }),
            studentsData?.students?.length || 0
          )}

          {renderActionButton(
            'Attendance Details',
            attendanceData
              ? `${attendanceData.summary.present} present today`
              : 'No data',
            faCalendarCheck,
            '#34C759',
            () =>
              navigation.navigate('HomeroomAttendanceDetails', {
                authCode,
                classroomData,
                attendanceData,
              }),
            attendanceData?.summary.present || 0
          )}

          {renderActionButton(
            'Discipline Records',
            disciplineData
              ? `${disciplineData.summary.total_records} records`
              : 'No data',
            faClipboardList,
            '#FF9500',
            () =>
              navigation.navigate('HomeroomDisciplineScreen', {
                authCode,
                classroomData,
              }),
            disciplineData?.summary.total_records || 0
          )}
        </View>
      </ScrollView>
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
      ...theme.shadows.small,
     
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
    subHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
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
    // Loading and Error Subheader Styles
    loadingSubheader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
    },
    loadingSubheaderText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 8,
      fontStyle: 'italic',
    },
    errorSubheader: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    errorSubheaderText: {
      fontSize: 14,
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: 'center',
    },
    // Classroom Info Section
    classroomInfoSection: {
      flexDirection: 'row',
      alignItems: 'center',
      
      paddingHorizontal: 4,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: '#FF3B30',
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    // Compact Overview Card Styles
    compactOverviewCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      margin: 5,
      marginBottom: 12,
      ...theme.shadows.large,
      elevation: 3,
    },
    compactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    compactIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      // '#007AFF' change the trancparency to 0.2
      backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 122, 255, 0.2)',
      //backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    compactTitleContainer: {
      flex: 1,
    },
    compactClassroomTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    compactClassroomSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    compactStatsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 10,
      backgroundColor: theme.colors.surface,
    },
    compactStatItem: {
      flex: 1,
      alignItems: 'center',
    },
    compactStatNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 4,
      marginBottom: 2,
    },
    compactStatLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    compactStatDivider: {
      width: 1,
      height: 32,
      backgroundColor: theme.colors.border,
      marginHorizontal: 8,
    },
    // Legacy Overview Card Styles (keeping for compatibility)
    overviewCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      margin: 16,
      marginBottom: 12,
      ...theme.shadows.samll,
      // overflow: 'hidden',
    },
    classroomHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      padding: 20,
      paddingBottom: 5,
    },
    classroomIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    classroomTitleContainer: {
      flex: 1,
    },
    classroomSubtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 2,
    },
    statsContainer: {
      padding: 20,
      paddingTop: 16,
    },
    statCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    statContent: {
      flex: 1,
    },
    genderStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    genderStatCard: {
      flex: 1,
      marginBottom: 0,
    },
    summaryCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      marginHorizontal: 16,
      marginBottom: 12,
      ...theme.shadows.small,
      elevation: 3,
    },
    actionsContainer: {
      marginHorizontal: 16,
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    actionButton: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 12,
      borderLeftWidth: 4,
      ...theme.shadows.small,
      elevation: 3,
    },
    actionButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    actionButtonIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    actionButtonText: {
      flex: 1,
    },
    actionButtonTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    actionButtonSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    actionButtonBadge: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    actionButtonBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    debugContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      marginTop: 24,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    debugTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    debugText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    classroomTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 2,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    attendanceStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 12,
    },
    attendanceStat: {
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    attendanceNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
    },
    attendanceLabel: {
      fontSize: 12,
      color: '#fff',
      marginTop: 2,
    },
    attendanceRate: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
  });
