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
      console.log('No authCode provided');
      setError('No authentication code provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Loading homeroom data with authCode:', authCode);

      // First fetch classrooms to get classroom_id
      const classroom = await fetchClassrooms();
      console.log('Fetched classroom:', classroom);

      if (classroom) {
        // Then fetch other data that depends on classroom_id
        console.log(
          'Fetching additional data for classroom:',
          classroom.classroom_id
        );
        await Promise.all([
          fetchTodayAttendance(classroom),
          fetchStudents(classroom),
          fetchDisciplineRecords(classroom),
        ]);
        console.log('All data loaded successfully');
      } else {
        console.log('No classroom data found');
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
      console.log('Fetching classrooms from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('Classrooms response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Classrooms response data:', data);

        if (data.success && data.data && data.data.length > 0) {
          const classroom = data.data[0]; // Assuming teacher has one homeroom
          setClassroomData(classroom);
          return classroom;
        } else {
          console.log('No classroom data in response or empty array');
        }
      } else {
        console.log('Failed to fetch classrooms, status:', response.status);
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
        console.log('Students response data:', data);
        if (data.success) {
          setStudentsData(data.data || []);
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
        console.log('Discipline response data:', data);
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Homeroom</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading homeroom data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Homeroom</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadHomeroomData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Homeroom</Text>
        <View style={styles.headerRight} />
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
        {/* Classroom Overview */}
        {classroomData && (
          <View style={styles.overviewCard}>
            <View style={styles.classroomHeader}>
              <View style={styles.classroomIconContainer}>
                <FontAwesomeIcon icon={faUserGraduate} size={24} color='#fff' />
              </View>
              <View style={styles.classroomTitleContainer}>
                <Text style={styles.classroomTitle}>
                  {classroomData.classroom_name}
                </Text>
                <Text style={styles.classroomSubtitle}>Homeroom Class</Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: '#007AFF15' },
                  ]}
                >
                  <FontAwesomeIcon icon={faUsers} size={20} color='#007AFF' />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statNumber}>
                    {classroomData.total_students}
                  </Text>
                  <Text style={styles.statLabel}>Total Students</Text>
                </View>
              </View>

              <View style={styles.genderStatsRow}>
                <View style={[styles.statCard, styles.genderStatCard]}>
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: '#34C75915' },
                    ]}
                  >
                    <FontAwesomeIcon icon={faMars} size={20} color='#34C759' />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statNumber}>
                      {classroomData.male_students}
                    </Text>
                    <Text style={styles.statLabel}>Male</Text>
                  </View>
                </View>

                <View style={[styles.statCard, styles.genderStatCard]}>
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: '#FF9F0A15' },
                    ]}
                  >
                    <FontAwesomeIcon icon={faVenus} size={20} color='#FF9F0A' />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statNumber}>
                      {classroomData.female_students}
                    </Text>
                    <Text style={styles.statLabel}>Female</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

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
            `${studentsData.students.length} students in class`,
            faUsers,
            '#007AFF',
            () =>
              navigation.navigate('HomeroomStudentsScreen', {
                authCode,
                classroomData,
              }),
            studentsData.students.length
          )}

          {renderActionButton(
            'Attendance Details',
            attendanceData
              ? `${attendanceData.summary.present} present today`
              : 'No data',
            faCalendarCheck,
            '#34C759',
            () =>
              Alert.alert(
                'Attendance',
                attendanceData
                  ? `Present: ${attendanceData.summary.present}, Absent: ${attendanceData.summary.absent}`
                  : 'No attendance data'
              ),
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
    header: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      ...theme.shadows.medium,
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
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
    },
    headerRight: {
      width: 34,
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
    overviewCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      margin: 16,
      marginBottom: 12,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      overflow: 'hidden',
    },
    classroomHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      padding: 20,
      paddingBottom: 16,
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
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
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
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
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
