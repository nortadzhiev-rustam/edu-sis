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
  faGavel,
  faChartLine,
  faRefresh,
  faBuilding,
  faChevronRight,
  faUserCheck,
  faBookOpen,
  faUsers,
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
  const [studentCounts, setStudentCounts] = useState({}); // Store student counts per timetable ID
  const [branchStudentCounts, setBranchStudentCounts] = useState({}); // Store unique student counts per branch

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
    if (!userData.authCode) return null;

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

          // Immediately fetch student counts with the fresh data
          await fetchAllStudentCounts(data);
        }

        return data;
      }
    } catch (error) {
      console.log('Error fetching teacher timetable:', error);
    }

    return null;
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
      }
    } catch (error) {
      // Handle error silently
    }
  };

  // Fetch student list for a specific timetable entry
  const fetchStudentListForTimetable = async (timetableId) => {
    if (!userData.authCode || !timetableId) {
      console.log(
        'fetchStudentListForTimetable: Missing authCode or timetableId',
        {
          hasAuthCode: !!userData.authCode,
          timetableId,
        }
      );
      return [];
    }

    try {
      const url = buildApiUrl(Config.API_ENDPOINTS.GET_ATTENDANCE_DETAILS, {
        authCode: userData.authCode,
        timetableId: timetableId,
      });

      console.log(`Fetching students for timetable ${timetableId} from:`, url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Response for timetable ${timetableId}:`, {
          success: data.success,
          studentCount: data.students?.length || 0,
          hasStudents: !!data.students,
        });

        if (data.success && data.students) {
          return data.students; // Return the full student list
        } else {
          console.log(`No students found for timetable ${timetableId}:`, data);
        }
      } else {
        console.log(
          `HTTP error for timetable ${timetableId}:`,
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.log(
        `Error fetching students for timetable ${timetableId}:`,
        error
      );
    }

    return [];
  };

  // Fetch student lists for all timetable entries and count unique students
  const fetchAllStudentCounts = async (currentTimetableData = null) => {
    // Use passed data or current state
    const dataToUse = currentTimetableData || timetableData;

    if (!dataToUse?.branches || !userData.authCode) {
      console.log('fetchAllStudentCounts: Missing data or authCode', {
        hasBranches: !!dataToUse?.branches,
        hasAuthCode: !!userData.authCode,
        branchCount: dataToUse?.branches?.length || 0,
      });
      return;
    }

    console.log(
      'fetchAllStudentCounts: Starting to fetch student counts for',
      dataToUse.branches.length,
      'branches'
    );

    const counts = {};
    const allUniqueStudents = new Set(); // Track unique students across all classes
    const branchStudents = {}; // Track unique students per branch

    // Collect all timetable IDs and fetch student lists
    const timetablePromises = [];
    dataToUse.branches.forEach((branch) => {
      branchStudents[branch.branch_id] = new Set();

      branch.timetable.forEach((classItem) => {
        if (classItem.timetable_id) {
          timetablePromises.push(
            fetchStudentListForTimetable(classItem.timetable_id)
              .then((students) => {
                counts[classItem.timetable_id] = students.length;
                console.log(
                  `Timetable ${classItem.timetable_id}: ${students.length} students`
                );

                // Add students to unique sets
                students.forEach((student) => {
                  if (student.student_id) {
                    allUniqueStudents.add(student.student_id);
                    branchStudents[branch.branch_id].add(student.student_id);
                  }
                });

                return {
                  timetableId: classItem.timetable_id,
                  count: students.length,
                  branchId: branch.branch_id,
                  students: students,
                };
              })
              .catch((error) => {
                console.log(
                  `Error fetching students for timetable ${classItem.timetable_id}:`,
                  error
                );
                counts[classItem.timetable_id] = 0;
                return {
                  timetableId: classItem.timetable_id,
                  count: 0,
                  branchId: branch.branch_id,
                  students: [],
                };
              })
          );
        }
      });
    });

    // Wait for all requests to complete
    try {
      await Promise.all(timetablePromises);

      // Convert branch student sets to counts
      const branchCounts = Object.fromEntries(
        Object.entries(branchStudents).map(([branchId, studentSet]) => [
          branchId,
          studentSet.size,
        ])
      );

      console.log('Student count results:', {
        totalUniqueStudents: allUniqueStudents.size,
        branchCounts,
        timetableCounts: counts,
      });

      setStudentCounts(counts);
      setBranchStudentCounts(branchCounts);
      setDashboardStats((prev) => ({
        ...prev,
        totalStudents: allUniqueStudents.size,
      }));
    } catch (error) {
      console.log('Error in fetchAllStudentCounts:', error);
    }
  };

  // Debug function to log current state
  const logCurrentState = () => {
    console.log('Current state debug:', {
      hasUserData: !!userData.authCode,
      hasTimetableData: !!timetableData?.branches,
      timetableBranchCount: timetableData?.branches?.length || 0,
      studentCountsKeys: Object.keys(studentCounts).length,
      branchStudentCountsKeys: Object.keys(branchStudentCounts).length,
      totalStudents: dashboardStats.totalStudents,
      refreshing,
    });
  };

  // Load all teacher data
  const loadTeacherData = async () => {
    setRefreshing(true);

    try {
      // Load timetable and BPS data - timetable will automatically fetch student counts
      await Promise.all([fetchTeacherTimetable(), fetchTeacherBPS()]);
    } catch (error) {
      console.log('Error loading teacher data:', error);
    } finally {
      setRefreshing(false);
    }
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
          // Handle error silently
        }
      }
      setLoading(false);
    };

    getUserData();
  }, [userData]);

  // Load teacher data when userData is available
  useEffect(() => {
    if (userData.authCode && !loading) {
      loadTeacherData();
    }
  }, [userData.authCode, loading]);

  // Calculate unique students taught per branch using API data
  const calculateStudentsPerBranch = (branchId) => {
    if (!timetableData?.branches) return 0;

    // If we have the accurate branch student count from API, use that
    if (branchStudentCounts[branchId] !== undefined) {
      return branchStudentCounts[branchId];
    }

    // Find the branch for fallback calculation
    const targetBranch = timetableData.branches.find(
      (b) => b.branch_id === branchId
    );
    if (!targetBranch) return 0;

    // Fallback: estimate based on average class size
    // This is not accurate but better than summing all periods
    const classCount = targetBranch.timetable.length;
    if (classCount > 0 && Object.keys(studentCounts).length > 0) {
      // Get average students per class for this branch
      let totalStudentsInPeriods = 0;
      let periodsWithData = 0;

      targetBranch.timetable.forEach((classItem) => {
        if (classItem.timetable_id && studentCounts[classItem.timetable_id]) {
          totalStudentsInPeriods += studentCounts[classItem.timetable_id];
          periodsWithData++;
        }
      });

      if (periodsWithData > 0) {
        // Estimate unique students (assuming some overlap between periods)
        const avgStudentsPerPeriod = totalStudentsInPeriods / periodsWithData;
        // Rough estimate: if teacher has multiple periods, assume 70% overlap
        const estimatedUniqueStudents = Math.round(
          avgStudentsPerPeriod * Math.min(periodsWithData, 2)
        );
        return estimatedUniqueStudents;
      }
    }

    return 0;
  };

  // Note: Student counts are now fetched directly in fetchTeacherTimetable
  // This eliminates race conditions and ensures data consistency

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
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => {
                  logCurrentState();
                  loadTeacherData();
                }}
              >
                <FontAwesomeIcon icon={faRefresh} size={18} color='#007AFF' />
              </TouchableOpacity>
              {__DEV__ && (
                <TouchableOpacity
                  style={[styles.refreshButton, { backgroundColor: '#FF9500' }]}
                  onPress={() => {
                    console.log('Manual student count refresh');
                    fetchAllStudentCounts();
                  }}
                >
                  <FontAwesomeIcon icon={faUsers} size={16} color='#fff' />
                </TouchableOpacity>
              )}
            </View>
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
                        Academic Year:{' '}
                        {timetableData.global_academic_year.academic_year} •
                        Week: {branch.current_week}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.branchStats}>
                    <View style={styles.branchStat}>
                      <Text style={styles.branchStatNumber}>
                        {branch.timetable.length}
                      </Text>
                      <Text style={styles.branchStatLabel}>Weekly Classes</Text>
                    </View>
                    <View style={styles.branchStat}>
                      <Text style={styles.branchStatNumber}>
                        {Object.keys(branchStudentCounts).length === 0 &&
                        Object.keys(studentCounts).length === 0
                          ? '...'
                          : calculateStudentsPerBranch(branch.branch_id)}
                      </Text>
                      <Text style={styles.branchStatLabel}>My Students</Text>
                    </View>
                    <View style={styles.branchStat}>
                      <Text style={styles.branchStatNumber}>
                        {
                          branch.timetable.filter(
                            (item) => item.attendance_taken
                          ).length
                        }
                      </Text>
                      <Text style={styles.branchStatLabel}>
                        Attendance Taken
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
            <View style={styles.actionTilesGrid}>
              {/* Timetable Tile */}
              <TouchableOpacity
                style={[
                  styles.actionTile,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() =>
                  navigation.navigate('TeacherTimetable', {
                    authCode: userData.authCode,
                    teacherName: userData.name,
                    timetableData: timetableData,
                  })
                }
                activeOpacity={0.8}
              >
                <View style={styles.tileIconContainer}>
                  <FontAwesomeIcon
                    icon={faCalendarAlt}
                    size={28}
                    color={theme.colors.headerText}
                  />
                </View>
                <Text style={styles.tileTitle}>{t('viewTimetable')}</Text>
                <Text style={styles.tileSubtitle}>Schedule & Attendance</Text>
                {dashboardStats.totalClasses - dashboardStats.attendanceTaken >
                  0 && (
                  <View style={styles.tileBadge}>
                    <Text style={styles.tileBadgeText}>
                      {dashboardStats.totalClasses -
                        dashboardStats.attendanceTaken}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* BPS Management Tile */}
              <TouchableOpacity
                style={[styles.actionTile, { backgroundColor: '#AF52DE' }]}
                onPress={() =>
                  navigation.navigate('TeacherBPS', {
                    authCode: userData.authCode,
                    teacherName: userData.name,
                    bpsData: bpsData,
                  })
                }
                activeOpacity={0.8}
              >
                <View style={styles.tileIconContainer}>
                  <FontAwesomeIcon icon={faGavel} size={28} color='#fff' />
                </View>
                <Text style={styles.tileTitle}>{t('manageBPS')}</Text>
                <Text style={styles.tileSubtitle}>Behavior Points</Text>
                {dashboardStats.totalBpsRecords > 0 && (
                  <View style={styles.tileBadge}>
                    <Text style={styles.tileBadgeText}>
                      {dashboardStats.totalBpsRecords}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Students Overview Tile */}
              <TouchableOpacity
                style={[styles.actionTile, { backgroundColor: '#34C759' }]}
                onPress={() => {
                  // Navigate to students overview or show alert for now
                  Alert.alert('Students Overview', 'Feature coming soon!');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.tileIconContainer}>
                  <FontAwesomeIcon icon={faUsers} size={28} color='#fff' />
                </View>
                <Text style={styles.tileTitle}>My Students</Text>
                <Text style={styles.tileSubtitle}>Overview & Reports</Text>
                {dashboardStats.totalStudents > 0 && (
                  <View style={styles.tileBadge}>
                    <Text style={styles.tileBadgeText}>
                      {dashboardStats.totalStudents}
                    </Text>
                  </View>
                )}
               
              </TouchableOpacity>

              {/* Quick Attendance Tile */}
              <TouchableOpacity
                style={[styles.actionTile, { backgroundColor: '#FF9500' }]}
                onPress={() => {
                  // Navigate to quick attendance or show alert for now
                  Alert.alert('Quick Attendance', 'Feature coming soon!');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.tileIconContainer}>
                  <FontAwesomeIcon icon={faUserCheck} size={28} color='#fff' />
                </View>
                <Text style={styles.tileTitle}>Quick Attendance</Text>
                <Text style={styles.tileSubtitle}>Mark Present/Absent</Text>
              </TouchableOpacity>

              {/* Reports Tile */}
              <TouchableOpacity
                style={[styles.actionTile, { backgroundColor: '#007AFF' }]}
                onPress={() => {
                  // Navigate to reports or show alert for now
                  Alert.alert('Reports', 'Feature coming soon!');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.tileIconContainer}>
                  <FontAwesomeIcon icon={faChartLine} size={28} color='#fff' />
                </View>
                <Text style={styles.tileTitle}>Reports</Text>
                <Text style={styles.tileSubtitle}>Analytics & Stats</Text>
              </TouchableOpacity>

              {/* Class Materials Tile */}
              <TouchableOpacity
                style={[styles.actionTile, { backgroundColor: '#FF3B30' }]}
                onPress={() => {
                  // Navigate to class materials or show alert for now
                  Alert.alert('Class Materials', 'Feature coming soon!');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.tileIconContainer}>
                  <FontAwesomeIcon icon={faBookOpen} size={28} color='#fff' />
                </View>
                <Text style={styles.tileTitle}>Materials</Text>
                <Text style={styles.tileSubtitle}>Resources & Files</Text>
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
    teacherStats: {
      fontSize: 12,
      color: theme.colors.textLight,
      fontWeight: '400',
      marginTop: 4,
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

    // Quick Actions - Tile Layout
    quickActionsContainer: {
      marginHorizontal: 20,
      marginBottom: 25,
    },
    actionTilesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
    },
    actionTile: {
      width: (screenWidth - 56) / 2, // 2 tiles per row with margins and gap
      aspectRatio: 1, // Square tiles
      borderRadius: 24,
      padding: 20,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
      position: 'relative',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    tileIconContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    tileTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    tileSubtitle: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      fontWeight: '500',
      marginBottom: 8,
    },
    tileBadge: {
      position: 'absolute',
      top: 16,
      right: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 14,
      minWidth: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    tileBadgeText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#333',
      letterSpacing: 0.2,
    },

    // Legacy Quick Actions (keeping for backward compatibility)
    actionGrid: {
      gap: 15,
    },
    actionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: theme.colors.shadow,
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
      color: theme.colors.text,
      marginBottom: 6,
    },
    actionSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    actionBadge: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start',
      borderColor: theme.colors.info,
      borderWidth: 1,
    },
    actionBadgeText: {
      fontSize: 12,
      color: theme.colors.info,
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
