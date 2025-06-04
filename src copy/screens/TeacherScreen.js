import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Config, buildApiUrl } from '../config/env';
import {
  faUser,
  faSignOutAlt,
  faArrowLeft,
  faCalendarAlt,
  faUsers,
  faGavel,
  faChartLine,
  faCheckCircle,
  faRefresh,
  faBuilding,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const { width: screenWidth } = Dimensions.get('window');

export default function TeacherScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  // Get user data from navigation params or AsyncStorage
  const [userData, setUserData] = useState(route?.params?.userData || {});
  const [loading, setLoading] = useState(true);

  // Teacher dashboard data
  const [timetableData, setTimetableData] = useState(null);
  const [bpsData, setBpsData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [dashboardStats, setDashboardStats] = useState({
    totalClasses: 0,
    attendanceTaken: 0,
    totalStudents: 0,
    totalBpsRecords: 0,
    branches: 0,
  });

  const styles = createStyles(theme);

  // Fetch teacher timetable data
  const fetchTeacherTimetable = async () => {
    if (!userData.authCode) return;

    try {
      const url = buildApiUrl(Config.API_ENDPOINTS.GET_TEACHER_TIMETABLE, {
        authCode: userData.authCode,
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
        setTimetableData(data);
        console.log('Teacher timetable data:', data);

        // Calculate stats
        if (data.success && data.branches) {
          const totalClasses = data.branches.reduce(
            (sum, branch) => sum + branch.timetable.length,
            0
          );
          const attendanceTaken = data.branches.reduce(
            (sum, branch) =>
              sum +
              branch.timetable.filter((item) => item.attendance_taken).length,
            0
          );

          setDashboardStats((prev) => ({
            ...prev,
            totalClasses,
            attendanceTaken,
            branches: data.total_branches,
          }));
        }
      } else {
        console.error('Failed to fetch teacher timetable:', response.status);
      }
    } catch (error) {
      console.error('Error fetching teacher timetable:', error);
    }
  };

  // Fetch teacher BPS data
  const fetchTeacherBPS = async () => {
    if (!userData.authCode) return;

    try {
      const url = buildApiUrl(Config.API_ENDPOINTS.GET_TEACHER_BPS, {
        authCode: userData.authCode,
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
        console.log('Teacher BPS data:', data);
        setBpsData(data);

        // Calculate stats
        if (data.success && data.branches) {
          const totalBpsRecords = data.branches.reduce(
            (sum, branch) => sum + branch.total_bps_records,
            0
          );

          setDashboardStats((prev) => ({
            ...prev,
            totalBpsRecords,
          }));
        }
      } else {
        console.error('Failed to fetch teacher BPS:', response.status);
      }
    } catch (error) {
      console.error('Error fetching teacher BPS:', error);
    }
  };

  // Calculate students taught by this teacher
  const calculateStudentsTaught = () => {
    if (!timetableData?.branches || !bpsData?.branches) return 0;

    const taughtStudents = new Set();

    // Get all classes/grades the teacher teaches from timetable
    const taughtClasses = new Set();
    timetableData.branches.forEach((branch) => {
      branch.timetable.forEach((classItem) => {
        if (classItem.grade) {
          taughtClasses.add(classItem.grade.toLowerCase().trim());
        }
      });
    });

    // Find students in those classes from BPS data
    bpsData.branches.forEach((branch) => {
      if (branch.students) {
        branch.students.forEach((student) => {
          // Only count students with valid classrooms
          if (student.classroom_name && student.classroom_name.trim() !== '') {
            // Extract grade/class from classroom name (e.g., "Grade 5A" -> "grade 5")
            const classroomLower = student.classroom_name.toLowerCase();

            // Check if this student's class matches any class the teacher teaches
            for (const taughtClass of taughtClasses) {
              if (classroomLower.includes(taughtClass)) {
                taughtStudents.add(student.student_id);
                break;
              }
            }
          }
        });
      }
    });

    return taughtStudents.size;
  };

  // Load all teacher data
  const loadTeacherData = async () => {
    setRefreshing(true);
    await Promise.all([fetchTeacherTimetable(), fetchTeacherBPS()]);
    setRefreshing(false);
  };

  useEffect(() => {
    // If no userData from params, try to get from AsyncStorage
    const getUserData = async () => {
      if (Object.keys(userData).length === 0) {
        try {
          const storedUserData = await AsyncStorage.getItem('userData');
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            // Only set if it's a teacher account
            if (parsedData.userType === 'teacher') {
              setUserData(parsedData);
            } else {
              // If not a teacher account, redirect to home
              navigation.replace('Home');
            }
          }
        } catch (error) {
          console.error('Error retrieving user data:', error);
        }
      }
      setLoading(false);
    };

    getUserData();
    console.log(userData);
  }, [userData]);

  // Load teacher data when userData is available
  useEffect(() => {
    if (userData.authCode && !loading) {
      loadTeacherData();
    }
  }, [userData.authCode, loading]);

  // Calculate students taught when both datasets are available
  useEffect(() => {
    if (timetableData && bpsData) {
      const studentsTaught = calculateStudentsTaught();
      setDashboardStats((prev) => ({
        ...prev,
        totalStudents: studentsTaught,
      }));
    }
  }, [timetableData, bpsData]);

  const handleLogout = () => {
    Alert.alert(t('logout'), 'Are you sure you want to logout?', [
      {
        text: t('cancel'),
        style: 'cancel',
      },
      {
        text: t('logout'),
        onPress: async () => {
          try {
            // Clear user data from AsyncStorage
            await AsyncStorage.removeItem('userData');
            // Navigate back to home screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          } catch (error) {
            // Handle error silently
          }
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={20} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('teacherDashboard')}</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} size={22} color='#fff' />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#007AFF' />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadTeacherData}
              colors={['#007AFF']}
              tintColor='#007AFF'
            />
          }
        >
          {/* Teacher Info Header */}
          <View style={styles.teacherInfoHeader}>
            <View style={styles.teacherInfoLeft}>
              <View style={styles.photoContainer}>
                {userData.photo ? (
                  <Image
                    source={{ uri: userData.photo }}
                    style={styles.userPhoto}
                    resizeMode='cover'
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <FontAwesomeIcon icon={faUser} size={24} color='#007AFF' />
                  </View>
                )}
              </View>
              <View style={styles.teacherInfoText}>
                <Text style={styles.teacherName}>
                  {userData.name || 'Teacher'}
                </Text>
                <Text style={styles.teacherRole}>
                  {userData.position || 'Teacher'} • ID: {userData.id || 'N/A'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadTeacherData}
            >
              <FontAwesomeIcon icon={faRefresh} size={18} color='#007AFF' />
            </TouchableOpacity>
          </View>

          {/* Dashboard Stats */}
          {/* Branch Information */}
          {timetableData?.branches && timetableData.branches.length > 0 && (
            <View style={styles.branchContainer}>
              <Text style={styles.sectionTitle}>Branch Information</Text>
              {timetableData.branches.map((branch) => (
                <View key={branch.branch_id} style={styles.branchCard}>
                  <View style={styles.branchHeader}>
                    <View
                      style={[
                        styles.branchIconContainer,
                        { backgroundColor: '#34C75915' },
                      ]}
                    >
                      <FontAwesomeIcon
                        icon={faBuilding}
                        size={18}
                        color='#34C759'
                      />
                    </View>
                    <View style={styles.branchInfo}>
                      <Text style={styles.branchName}>
                        {branch.branch_name}
                      </Text>
                      <Text style={styles.branchDetails}>
                        Academic Year: {timetableData.global_academic_year.academic_year} • Week:{' '}
                        {branch.current_week}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.branchStats}>
                    <View style={styles.branchStat}>
                      <Text style={styles.branchStatNumber}>
                        {branch.timetable.length}
                      </Text>
                      <Text style={styles.branchStatLabel}>Classes</Text>
                    </View>
                    <View style={styles.branchStat}>
                      <Text style={styles.branchStatNumber}>
                        {
                          branch.timetable.filter(
                            (item) => item.attendance_taken
                          ).length
                        }
                      </Text>
                      <Text style={styles.branchStatLabel}>Attended</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Dashboard Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: '#34C75915' },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={faCalendarAlt}
                    size={20}
                    color='#34C759'
                  />
                </View>
                <Text style={styles.statNumber}>
                  {dashboardStats.totalClasses}
                </Text>
                <Text style={styles.statLabel}>Total Classes</Text>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: '#007AFF15' },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    size={20}
                    color='#007AFF'
                  />
                </View>
                <Text style={styles.statNumber}>
                  {dashboardStats.attendanceTaken}
                </Text>
                <Text style={styles.statLabel}>Attendance Taken</Text>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: '#FF950015' },
                  ]}
                >
                  <FontAwesomeIcon icon={faUsers} size={20} color='#FF9500' />
                </View>
                <Text style={styles.statNumber}>
                  {dashboardStats.totalStudents}
                </Text>
                <Text style={styles.statLabel}>My Students</Text>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: '#AF52DE15' },
                  ]}
                >
                  <FontAwesomeIcon icon={faGavel} size={20} color='#AF52DE' />
                </View>
                <Text style={styles.statNumber}>
                  {dashboardStats.totalBpsRecords}
                </Text>
                <Text style={styles.statLabel}>BPS Records</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() =>
                  navigation.navigate('TeacherTimetable', {
                    authCode: userData.authCode,
                    teacherName: userData.name,
                    timetableData: timetableData,
                  })
                }
              >
                <View
                  style={[
                    styles.actionIconContainer,
                    { backgroundColor: '#34C75915' },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={faCalendarAlt}
                    size={24}
                    color='#34C759'
                  />
                </View>
                <Text style={styles.actionTitle}>{t('viewTimetable')}</Text>
                <Text style={styles.actionSubtitle}>
                  View schedule & take attendance
                </Text>
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>
                    {dashboardStats.totalClasses -
                      dashboardStats.attendanceTaken}{' '}
                    pending
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() =>
                  navigation.navigate('TeacherBPS', {
                    authCode: userData.authCode,
                    teacherName: userData.name,
                    bpsData: bpsData,
                  })
                }
              >
                <View
                  style={[
                    styles.actionIconContainer,
                    { backgroundColor: '#AF52DE15' },
                  ]}
                >
                  <FontAwesomeIcon icon={faGavel} size={24} color='#AF52DE' />
                </View>
                <Text style={styles.actionTitle}>{t('manageBPS')}</Text>
                <Text style={styles.actionSubtitle}>
                  Manage student behavior points
                </Text>
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>
                    {dashboardStats.totalBpsRecords} records
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Features */}
          <View style={styles.featuresContainer}>
            <Text style={styles.sectionTitle}>{t('features')}</Text>
            <View style={styles.featuresList}>
              <TouchableOpacity style={styles.featureItem}>
                <View
                  style={[
                    styles.featureIconContainer,
                    { backgroundColor: '#007AFF15' },
                  ]}
                >
                  <FontAwesomeIcon icon={faUser} size={20} color='#007AFF' />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>My Profile</Text>
                  <Text style={styles.featureSubtitle}>
                    View and edit profile information
                  </Text>
                </View>
                <FontAwesomeIcon icon={faChevronRight} size={16} color='#ccc' />
              </TouchableOpacity>

              <TouchableOpacity style={styles.featureItem}>
                <View
                  style={[
                    styles.featureIconContainer,
                    { backgroundColor: '#FF950015' },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={faChartLine}
                    size={20}
                    color='#FF9500'
                  />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Analytics</Text>
                  <Text style={styles.featureSubtitle}>
                    View teaching performance metrics
                  </Text>
                </View>
                <FontAwesomeIcon icon={faChevronRight} size={16} color='#ccc' />
              </TouchableOpacity>
            </View>
          </View>

          
        </ScrollView>
      )}
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
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTitle: {
      color: theme.colors.headerText,
      fontSize: 22,
      fontWeight: 'bold',
    },
    logoutButton: {
      paddingHorizontal: 10,
    },

    // Loading
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: 15,
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },

    // Scroll View
    scrollView: {
      flex: 1,
    },

    // Teacher Info Header
    teacherInfoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      margin: 20,
      marginBottom: 15,
      padding: 20,
      borderRadius: 16,
      ...theme.shadows.medium,
    },
    teacherInfoLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    photoContainer: {
      marginRight: 15,
    },
    userPhoto: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    photoPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.border, // Changed from '#f0f0f0'
      justifyContent: 'center',
      alignItems: 'center',
    },
    teacherInfoText: {
      flex: 1,
    },
    teacherName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    teacherRole: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    refreshButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface, // Changed from '#f0f9ff'
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: theme.colors.primary,
      borderWidth: 1,
    },

    // Stats Container
    statsContainer: {
      marginHorizontal: 20,
      marginBottom: 25,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statCard: {
      width: (screenWidth - 60) / 2,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 15,
      alignItems: 'center',
      ...theme.shadows.medium,
    },
    statIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary, // Changed from '#666'
      fontWeight: '500',
      textAlign: 'center',
    },

    // Quick Actions
    quickActionsContainer: {
      marginHorizontal: 20,
      marginBottom: 25,
    },
    actionGrid: {
      gap: 15,
    },
    actionCard: {
      backgroundColor: theme.colors.surface, // Changed from '#fff'
      borderRadius: 16,
      padding: 20,
      shadowColor: theme.colors.shadow, // Changed from '#000'
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    actionIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
    },
    actionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 6,
    },
    actionSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary, // Changed from '#666'
      marginBottom: 12,
    },
    actionBadge: {
      backgroundColor: theme.colors.surface, // Changed from '#f0f9ff'
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start',
      borderColor: theme.colors.info,
      borderWidth: 1,
    },
    actionBadgeText: {
      fontSize: 12,
      color: theme.colors.info, // Changed from '#0369a1'
      fontWeight: '600',
    },

    // Features
    featuresContainer: {
      marginHorizontal: 20,
      marginBottom: 25,
    },
    featuresList: {
      backgroundColor: theme.colors.surface, // Changed from '#fff'
      borderRadius: 16,
      shadowColor: theme.colors.shadow, // Changed from '#000'
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border, // Changed from '#f0f0f0'
    },
    featureIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 4,
    },
    featureSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary, // Changed from '#666'
    },

    // Branch Information
    branchContainer: {
      marginHorizontal: 20,
      marginBottom: 25,
    },
    branchCard: {
      backgroundColor: theme.colors.surface, // Changed from '#fff'
      borderRadius: 16,
      padding: 20,
      marginBottom: 15,
      shadowColor: theme.colors.shadow, // Changed from '#000'
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    branchHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    branchIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    branchInfo: {
      flex: 1,
    },
    branchName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 4,
    },
    branchDetails: {
      fontSize: 14,
      color: theme.colors.textSecondary, // Changed from '#666'
    },
    branchStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    branchStat: {
      alignItems: 'center',
    },
    branchStatNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 4,
    },
    branchStatLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary, // Changed from '#666'
      fontWeight: '500',
    },
  });
