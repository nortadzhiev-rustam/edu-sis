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
  Modal,
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
  faBuilding,
  faChevronRight,
  faBookOpen,
  faBell,
  faClipboardList,
  faHome,
  faComments,
} from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationBadge from '../components/NotificationBadge';
import { QuickActionTile, ComingSoonBadge } from '../components';
import { isIPad, isTablet } from '../utils/deviceDetection';
import { useFocusEffect } from '@react-navigation/native';
import {
  createSmallShadow,
  createMediumShadow,
  createCustomShadow,
} from '../utils/commonStyles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function TeacherScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const { refreshNotifications } = useNotifications();
  const fontSizes = getLanguageFontSizes(currentLanguage);

  // Device and orientation detection
  const isIPadDevice = isIPad();
  const isTabletDevice = isTablet();
  const isLandscape = screenWidth > screenHeight;

  // Helper function to format user roles
  const formatUserRoles = (userData) => {
    // If user has roles array, format it
    if (
      userData.roles &&
      Array.isArray(userData.roles) &&
      userData.roles.length > 0
    ) {
      // Get unique role names across all branches
      const uniqueRoles = [
        ...new Set(userData.roles.map((role) => role.role_name)),
      ];

      if (uniqueRoles.length === 1) {
        // Single unique role - just show the role name
        return uniqueRoles[0];
      } else {
        // Multiple unique roles - show them separated by dashes
        return uniqueRoles.join(' - ');
      }
    }

    // Fallback to position field
    return userData.position || 'Teacher';
  };

  // Function to handle role tap - show all roles if multiple
  const handleRoleTap = () => {
    if (
      userData.roles &&
      Array.isArray(userData.roles) &&
      userData.roles.length > 1
    ) {
      // Get unique role names to check if there are multiple unique roles
      const uniqueRoles = [
        ...new Set(userData.roles.map((role) => role.role_name)),
      ];
      if (uniqueRoles.length > 1) {
        setShowAllRoles(true);
      }
    }
  };

  // Function to render all roles modal
  const renderAllRolesModal = () => {
    if (
      !userData.roles ||
      !Array.isArray(userData.roles) ||
      userData.roles.length <= 1
    ) {
      return null;
    }

    // Group roles by branch for display
    const rolesByBranch = userData.roles.reduce((acc, role) => {
      const branchName = role.branch_name || 'Unknown Branch';
      if (!acc[branchName]) {
        acc[branchName] = [];
      }
      acc[branchName].push(role);
      return acc;
    }, {});

    return (
      <Modal
        visible={showAllRoles}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowAllRoles(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>All Roles</Text>
            <ScrollView
              style={styles.rolesContainer}
              showsVerticalScrollIndicator={false}
            >
              {Object.entries(rolesByBranch).map(([branchName, roles]) => (
                <View key={branchName} style={styles.branchRoleGroup}>
                  <Text style={styles.branchRoleGroupTitle}>{branchName}</Text>
                  {roles.map((role, index) => (
                    <View
                      key={`${branchName}-${index}`}
                      style={styles.roleItem}
                    >
                      <Text style={styles.roleName}>{role.role_name}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAllRoles(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };
  // Get user data from navigation params or AsyncStorage
  const [userData, setUserData] = useState(route?.params?.userData || {});
  const [loading, setLoading] = useState(true);
  const [showAllRoles, setShowAllRoles] = useState(false);

  // Teacher dashboard data
  const [timetableData, setTimetableData] = useState(null);
  const [teacherClassesData, setTeacherClassesData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [branchStudentCounts, setBranchStudentCounts] = useState({}); // Store unique student counts per branch
  const [dashboardStats, setDashboardStats] = useState({
    totalClasses: 0,
    attendanceTaken: 0,
    branches: 0,
  });

  // Branch selection state - now using branch_id instead of array index
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [showBranchSelector, setShowBranchSelector] = useState(false);

  const styles = createStyles(theme, fontSizes);

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
        }

        return data;
      }
    } catch (error) {
      // Handle error silently
    }

    return null;
  };

  // Fetch teacher classes with comprehensive student data
  const fetchTeacherClasses = async () => {
    if (!userData.authCode) return null;

    try {
      const response = await fetch(
        buildApiUrl(Config.API_ENDPOINTS.GET_TEACHER_CLASSES, {
          auth_code: userData.authCode,
        }),
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTeacherClassesData(data.data);

          // Calculate student counts from the comprehensive data
          if (data.data?.branches) {
            const branchCounts = {};
            let totalUniqueStudents = new Set();

            data.data.branches.forEach((branch) => {
              let branchUniqueStudents = new Set();

              branch.classes.forEach((classItem) => {
                if (classItem.students && Array.isArray(classItem.students)) {
                  classItem.students.forEach((student) => {
                    if (student.student_id) {
                      branchUniqueStudents.add(student.student_id);
                      totalUniqueStudents.add(student.student_id);
                    }
                  });
                }
              });

              branchCounts[branch.branch_id] = branchUniqueStudents.size;
            });

            setBranchStudentCounts(branchCounts);
          }

          return data.data;
        } else {
          console.error('Failed to fetch teacher classes:', data.message);
        }
      } else {
        console.error('Failed to fetch teacher classes:', response.status);
      }
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
    }

    return null;
  };

  // Load all teacher data
  const loadTeacherData = async () => {
    setRefreshing(true);
    try {
      // Load comprehensive teacher classes data (includes student counts)
      const classesData = await fetchTeacherClasses();

      // Also load timetable data for attendance information
      if (classesData) {
        await fetchTeacherTimetable();
      }
    } catch (error) {
      // Handle error silently
      console.error('Error loading teacher data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Refresh notifications when screen comes into focus (with debouncing)
  const lastNotificationRefresh = React.useRef(0);
  const isRefreshingNotifications = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // Only refresh notifications if:
      // 1. It's been more than 30 seconds since last refresh
      // 2. We're not currently refreshing notifications
      if (
        now - lastNotificationRefresh.current > 30000 &&
        !isRefreshingNotifications.current
      ) {
        lastNotificationRefresh.current = now;
        isRefreshingNotifications.current = true;

        refreshNotifications().finally(() => {
          isRefreshingNotifications.current = false;
        });
      }
    }, [refreshNotifications])
  );

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
          console.error('Error loading user data:', error);
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

  // Load saved branch selection when branch data is available
  useEffect(() => {
    const branches = teacherClassesData?.branches || timetableData?.branches;
    if (branches && branches.length > 0) {
      loadSavedBranchSelection();
    }
  }, [teacherClassesData, timetableData]);

  // Get current branch data (prioritize teacher classes data, fallback to timetable)
  const getCurrentBranch = () => {
    // Try teacher classes data first (more comprehensive)
    if (
      teacherClassesData?.branches &&
      teacherClassesData.branches.length > 0
    ) {
      if (selectedBranchId) {
        const branch = teacherClassesData.branches.find(
          (b) => b.branch_id === selectedBranchId
        );
        return branch || teacherClassesData.branches[0];
      }
      return teacherClassesData.branches[0];
    }

    // Fallback to timetable data
    if (timetableData?.branches && timetableData.branches.length > 0) {
      if (selectedBranchId) {
        const branch = timetableData.branches.find(
          (b) => b.branch_id === selectedBranchId
        );
        return branch || timetableData.branches[0];
      }
      return timetableData.branches[0];
    }

    return null;
  };

  // Handle branch selection - now using branch_id instead of index
  const handleBranchSelection = async (branchId) => {
    setSelectedBranchId(branchId);
    setShowBranchSelector(false);

    // Save selected branch ID to AsyncStorage for persistence
    try {
      await AsyncStorage.setItem('selectedBranchId', branchId.toString());
    } catch (error) {
      console.error('Error saving selected branch:', error);
    }

    // Refresh data for the new branch
    await loadTeacherData();
  };

  // Load saved branch selection - now using branch_id
  const loadSavedBranchSelection = async () => {
    try {
      // First try to load by branch_id (new method)
      const savedBranchId = await AsyncStorage.getItem('selectedBranchId');
      if (savedBranchId !== null) {
        const branches =
          teacherClassesData?.branches || timetableData?.branches;
        if (branches) {
          const branchExists = branches.find(
            (branch) => branch.branch_id.toString() === savedBranchId
          );
          if (branchExists) {
            setSelectedBranchId(parseInt(savedBranchId, 10));
            return;
          }
        }
      }

      // Fallback: try to load by old index method and convert to branch_id
      const savedBranchIndex = await AsyncStorage.getItem(
        'selectedBranchIndex'
      );
      if (savedBranchIndex !== null) {
        const branches =
          teacherClassesData?.branches || timetableData?.branches;
        if (branches) {
          const branchIndex = parseInt(savedBranchIndex, 10);
          if (branchIndex >= 0 && branchIndex < branches.length) {
            const branchId = branches[branchIndex].branch_id;
            setSelectedBranchId(branchId);
            // Save the new format and remove old format
            await AsyncStorage.setItem('selectedBranchId', branchId.toString());
            await AsyncStorage.removeItem('selectedBranchIndex');
            return;
          }
        }
      }

      // If no saved selection, default to first branch
      const branches = teacherClassesData?.branches || timetableData?.branches;
      if (branches && branches.length > 0) {
        setSelectedBranchId(branches[0].branch_id);
      }
    } catch (error) {
      console.error('Error loading saved branch selection:', error);
    }
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
            console.error('Error logging out:', error);
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

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() =>
              navigation.navigate('NotificationScreen', { userType: 'teacher' })
            }
          >
            <FontAwesomeIcon icon={faBell} size={20} color='#fff' />
            <NotificationBadge />
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} size={22} color='#fff' />
          </TouchableOpacity>
        </View>
      </View>
      {/* Compact Teacher & Branch Info Header */}
      <View style={styles.compactTeacherHeader}>
        {/* Teacher Info Section */}
        <View style={styles.teacherSection}>
          <View style={styles.teacherAvatar}>
            {userData.photo ? (
              <Image
                source={{ uri: userData.photo }}
                style={styles.avatarImage}
                resizeMode='cover'
              />
            ) : (
              <FontAwesomeIcon
                icon={faUser}
                size={20}
                color={theme.colors.primary}
              />
            )}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('TeacherProfile')}>
            <View style={styles.teacherInfo}>
              <Text style={styles.compactTeacherName}>
                {userData.name || 'Teacher'}
              </Text>
              <TouchableOpacity
                onPress={handleRoleTap}
                activeOpacity={(() => {
                  if (
                    userData.roles &&
                    Array.isArray(userData.roles) &&
                    userData.roles.length > 1
                  ) {
                    const uniqueRoles = [
                      ...new Set(userData.roles.map((role) => role.role_name)),
                    ];
                    return uniqueRoles.length > 1 ? 0.7 : 1;
                  }
                  return 1;
                })()}
              >
                <Text
                  style={[
                    styles.compactTeacherRole,
                    (() => {
                      if (
                        userData.roles &&
                        Array.isArray(userData.roles) &&
                        userData.roles.length > 1
                      ) {
                        const uniqueRoles = [
                          ...new Set(
                            userData.roles.map((role) => role.role_name)
                          ),
                        ];
                        return uniqueRoles.length > 1
                          ? styles.clickableRole
                          : null;
                      }
                      return null;
                    })(),
                  ]}
                >
                  {formatUserRoles(userData)} • ID: {userData.id || 'N/A'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* Branch Summary Section */}
        {((teacherClassesData?.branches &&
          teacherClassesData.branches.length > 0) ||
          (timetableData?.branches && timetableData.branches.length > 0)) && (
          <View style={styles.branchSummarySection}>
            <View style={styles.branchSummaryHeader}>
              <View style={styles.branchIconWrapper}>
                <FontAwesomeIcon
                  icon={faBuilding}
                  size={16}
                  color={theme.colors.success}
                />
              </View>
              <View style={styles.branchSummaryInfo}>
                <TouchableOpacity
                  onPress={() => {
                    const branches =
                      teacherClassesData?.branches ||
                      timetableData?.branches ||
                      [];
                    if (branches.length > 1) {
                      setShowBranchSelector(!showBranchSelector);
                    }
                  }}
                  activeOpacity={(() => {
                    const branches =
                      teacherClassesData?.branches ||
                      timetableData?.branches ||
                      [];
                    return branches.length > 1 ? 0.7 : 1;
                  })()}
                  style={styles.branchTitleContainer}
                >
                  <Text style={styles.branchSummaryTitle}>
                    {(() => {
                      const branches =
                        teacherClassesData?.branches ||
                        timetableData?.branches ||
                        [];
                      if (branches.length === 1) {
                        return branches[0].branch_name;
                      }
                      return getCurrentBranch()?.branch_name || 'Select Branch';
                    })()}
                  </Text>
                  {(() => {
                    const branches =
                      teacherClassesData?.branches ||
                      timetableData?.branches ||
                      [];
                    return (
                      branches.length > 1 && (
                        <FontAwesomeIcon
                          icon={faChevronRight}
                          size={12}
                          color={theme.colors.textSecondary}
                          style={[
                            styles.branchChevron,
                            showBranchSelector && styles.branchChevronRotated,
                          ]}
                        />
                      )
                    );
                  })()}
                </TouchableOpacity>
                <Text style={styles.branchSummarySubtitle}>
                  Academic Year:{' '}
                  {timetableData?.global_academic_year?.academic_year || 'N/A'}{' '}
                  / Week: {timetableData?.branches?.[0]?.current_week || 'N/A'}
                  {(() => {
                    const branches =
                      teacherClassesData?.branches ||
                      timetableData?.branches ||
                      [];
                    if (branches.length > 1 && selectedBranchId) {
                      const currentIndex = branches.findIndex(
                        (b) => b.branch_id === selectedBranchId
                      );
                      return (
                        <Text style={styles.branchCount}>
                          {' '}
                          • {currentIndex + 1} of {branches.length}
                        </Text>
                      );
                    }
                    return null;
                  })()}
                </Text>
              </View>
            </View>

            {/* Branch Selector Dropdown */}
            {showBranchSelector &&
              (() => {
                const branches =
                  teacherClassesData?.branches || timetableData?.branches || [];
                return (
                  branches.length > 1 && (
                    <View style={styles.branchSelectorDropdown}>
                      <ScrollView
                        style={styles.branchSelectorScroll}
                        showsVerticalScrollIndicator={false}
                      >
                        {branches.map((branch) => (
                          <TouchableOpacity
                            key={branch.branch_id}
                            style={[
                              styles.branchSelectorItem,
                              selectedBranchId === branch.branch_id &&
                                styles.branchSelectorItemSelected,
                            ]}
                            onPress={() =>
                              handleBranchSelection(branch.branch_id)
                            }
                          >
                            <View style={styles.branchSelectorItemContent}>
                              <Text
                                style={[
                                  styles.branchSelectorItemText,
                                  selectedBranchId === branch.branch_id &&
                                    styles.branchSelectorItemTextSelected,
                                ]}
                              >
                                {branch.branch_name}
                              </Text>
                              {selectedBranchId === branch.branch_id && (
                                <FontAwesomeIcon
                                  icon={faChevronRight}
                                  size={14}
                                  color={theme.colors.primary}
                                />
                              )}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )
                );
              })()}

            {/* Quick Stats Row */}
            <View style={styles.quickStatsRow}>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatNumber}>
                  {dashboardStats.totalClasses}
                </Text>
                <Text style={styles.quickStatLabel}>Weekly Lessons</Text>
              </View>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatNumber}>
                  {(() => {
                    const currentBranch = getCurrentBranch();
                    if (!currentBranch) return 0;
                    const branchStudentCount =
                      branchStudentCounts[currentBranch.branch_id];
                    return branchStudentCount !== undefined
                      ? branchStudentCount
                      : '...';
                  })()}
                </Text>
                <Text style={styles.quickStatLabel}>Students</Text>
              </View>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatNumber}>
                  {(() => {
                    // Get attendance taken from current branch
                    const currentBranch = getCurrentBranch();
                    if (currentBranch?.timetable) {
                      return currentBranch.timetable.filter(
                        (item) => item.attendance_taken
                      ).length;
                    } else if (currentBranch?.classes) {
                      // For teacherClassesData, we don't have attendance_taken info
                      // So we'll show the timetable data if available
                      const timetableBranch = timetableData?.branches?.find(
                        (b) => b.branch_id === currentBranch.branch_id
                      );
                      if (timetableBranch?.timetable) {
                        return timetableBranch.timetable.filter(
                          (item) => item.attendance_taken
                        ).length;
                      }
                    }
                    return 0;
                  })()}
                </Text>
                <Text style={styles.quickStatLabel}>Attendance Taken</Text>
              </View>
            </View>
          </View>
        )}
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
          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
            <View
              style={[
                styles.actionTilesGrid,
                isIPadDevice && styles.iPadActionTilesGrid,
                isIPadDevice &&
                  isLandscape &&
                  styles.iPadLandscapeActionTilesGrid,
                isTabletDevice && styles.tabletActionTilesGrid,
                isTabletDevice &&
                  isLandscape &&
                  styles.tabletLandscapeActionTilesGrid,
              ]}
            >
              {/* Timetable Tile */}
              <QuickActionTile
                title={t('viewTimetable')}
                subtitle='Schedule & Attendance'
                icon={faCalendarAlt}
                backgroundColor={theme.colors.primary}
                iconColor={theme.colors.headerText}
                onPress={() =>
                  navigation.navigate('TeacherTimetable', {
                    authCode: userData.authCode,
                    teacherName: userData.name,
                    timetableData: timetableData,
                    selectedBranchId: selectedBranchId,
                  })
                }
                styles={styles}
                isLandscape={isLandscape}
              />

              {/* BPS Management Tile */}
              <QuickActionTile
                title={t('manageBPS')}
                subtitle='Behavior Points'
                icon={faGavel}
                backgroundColor='#AF52DE'
                iconColor='#fff'
                onPress={() =>
                  navigation.navigate('TeacherBPS', {
                    authCode: userData.authCode,
                    teacherName: userData.name,
                    selectedBranchId: selectedBranchId,
                  })
                }
                styles={styles}
                isLandscape={isLandscape}
              />

              {/* Homework Management Tile */}
              <QuickActionTile
                title='Homework'
                subtitle='Assignments & Review'
                icon={faClipboardList}
                backgroundColor='#34C759'
                iconColor='#fff'
                onPress={() =>
                  navigation.navigate('TeacherHomework', {
                    authCode: userData.authCode,
                    teacherName: userData.name,
                    selectedBranchId: selectedBranchId,
                  })
                }
                styles={styles}
                isLandscape={isLandscape}
              />

              {/* Messaging Tile */}
              <QuickActionTile
                title='Messages'
                subtitle='Chat & Communication'
                icon={faComments}
                backgroundColor='#007AFF'
                iconColor='#fff'
                onPress={() =>
                  navigation.navigate('TeacherMessagingScreen', {
                    authCode: userData.authCode,
                    teacherName: userData.name,
                  })
                }
                styles={styles}
                isLandscape={isLandscape}
              />

              {/* Homeroom Tile - Conditional */}
              {userData.is_homeroom && (
                <QuickActionTile
                  title='Homeroom'
                  subtitle='Class Management'
                  icon={faHome}
                  backgroundColor='#FF6B35'
                  iconColor='#fff'
                  onPress={() =>
                    navigation.navigate('HomeroomScreen', {
                      authCode: userData.authCode,
                      teacherName: userData.name,
                      selectedBranchId: selectedBranchId,
                    })
                  }
                  styles={styles}
                  isLandscape={isLandscape}
                />
              )}

              {/* Reports Tile - Disabled */}
              <QuickActionTile
                title={t('reports')}
                subtitle={t('analyticsStats')}
                icon={faChartLine}
                backgroundColor='#B0B0B0'
                iconColor='#fff'
                disabled={true}
                badge={
                  <ComingSoonBadge
                    text={t('comingSoon')}
                    theme={theme}
                    fontSizes={fontSizes}
                  />
                }
                styles={styles}
                isLandscape={isLandscape}
              />

              {/* Class Materials Tile - Disabled */}
              <QuickActionTile
                title={t('materials')}
                subtitle={t('resourcesFiles')}
                icon={faBookOpen}
                backgroundColor='#B0B0B0'
                iconColor='#fff'
                disabled={true}
                badge={
                  <ComingSoonBadge
                    text={t('comingSoon')}
                    theme={theme}
                    fontSizes={fontSizes}
                  />
                }
                styles={styles}
                isLandscape={isLandscape}
              />
            </View>
          </View>
        </ScrollView>
      )}

      {/* All Roles Modal */}
      {renderAllRolesModal()}
    </SafeAreaView>
  );
}

const createStyles = (theme, fontSizes) =>
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
      fontSize: fontSizes.headerTitle,
      fontWeight: 'bold',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    notificationButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
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

    // Compact Teacher & Branch Header
    compactTeacherHeader: {
      backgroundColor: theme.colors.surface,
      margin: 20,
      marginBottom: 15,
      borderRadius: 16,
      padding: 16,
      ...createSmallShadow(theme),
    },

    // Teacher Section
    teacherSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    teacherAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarImage: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    teacherInfo: {
      flex: 1,
    },
    compactTeacherName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    compactTeacherRole: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    clickableRole: {
      color: theme.colors.textSecondary,
    },

    // Branch Summary Section
    branchSummarySection: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 16,
    },
    branchSummaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    branchIconWrapper: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.success + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    branchSummaryInfo: {
      flex: 1,
    },
    branchTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    branchSummaryTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    branchChevron: {
      marginLeft: 6,
      transform: [{ rotate: '0deg' }],
    },
    branchChevronRotated: {
      transform: [{ rotate: '90deg' }],
    },
    branchSummarySubtitle: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    branchCount: {
      fontSize: 10,
      color: theme.colors.primary,
      fontWeight: '600',
    },

    // Branch Selector Dropdown
    branchSelectorDropdown: {
      marginTop: 12,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      maxHeight: 200,
      ...createSmallShadow(theme),
    },
    branchSelectorScroll: {
      maxHeight: 200,
    },
    branchSelectorItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    branchSelectorItemSelected: {
      backgroundColor: theme.colors.primary + '10',
    },
    branchSelectorItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    branchSelectorItemText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
      flex: 1,
    },
    branchSelectorItemTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },

    // Quick Stats Row
    quickStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    quickStat: {
      alignItems: 'center',
      flex: 1,
    },
    quickStatNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    quickStatLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      textAlign: 'center',
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
      ...createMediumShadow(theme),
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
    // iPad-specific grid layout - 4 tiles per row, wraps to next row for additional tiles
    iPadActionTilesGrid: {
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: 8,
    },
    // Tablet-specific grid layout - 4 tiles per row, wraps to next row for additional tiles
    tabletActionTilesGrid: {
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: 10,
    },
    // iPad landscape-specific grid layout - 6 tiles per row, wraps for additional tiles
    iPadLandscapeActionTilesGrid: {
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 6,
    },
    // Tablet landscape-specific grid layout - 6 tiles per row, wraps for additional tiles
    tabletLandscapeActionTilesGrid: {
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 8,
    },
    actionTile: {
      width: (screenWidth - 56) / 2, // 2 tiles per row with margins and gap
      aspectRatio: 1, // Square tiles
      borderRadius: 24,
      padding: 20,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      ...createMediumShadow(theme),
      position: 'relative',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    // iPad-specific action tile - optimized for 4 per row, wraps for additional tiles
    iPadActionTile: {
      width: (screenWidth - 80) / 4 - 2, // Optimized for 4 tiles per row with wrapping support
      minWidth: 160, // Minimum width to ensure tiles don't get too small
      aspectRatio: 1, // Square tiles
      borderRadius: 16,
      padding: 12,
      ...createCustomShadow(theme, {
        height: 3,
        opacity: 0.15,
        radius: 8,
        elevation: 4,
      }),
    },
    // Tablet-specific action tile - optimized for 4 per row, wraps for additional tiles
    tabletActionTile: {
      width: (screenWidth - 70) / 4 - 2, // Optimized for 4 tiles per row with wrapping support
      minWidth: 150, // Minimum width to ensure tiles don't get too small
      aspectRatio: 1, // Square tiles
      borderRadius: 18,
      padding: 14,
      ...createCustomShadow(theme, {
        height: 4,
        opacity: 0.18,
        radius: 10,
        elevation: 6,
      }),
    },
    // iPad landscape-specific action tile - optimized for 6 per row
    iPadLandscapeActionTile: {
      width: (screenWidth - 100) / 6 - 2, // 6 tiles per row in landscape with wrapping support
      minWidth: 120, // Minimum width for landscape tiles
      aspectRatio: 1, // Square tiles
      borderRadius: 14,
      padding: 10,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.12,
        radius: 6,
        elevation: 3,
      }),
    },
    // Tablet landscape-specific action tile - optimized for 6 per row
    tabletLandscapeActionTile: {
      width: (screenWidth - 90) / 6 - 2, // 6 tiles per row in landscape with wrapping support
      minWidth: 110, // Minimum width for landscape tiles
      aspectRatio: 1, // Square tiles
      borderRadius: 16,
      padding: 12,
      ...createCustomShadow(theme, {
        height: 3,
        opacity: 0.15,
        radius: 8,
        elevation: 4,
      }),
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
    // iPad-specific tile icon container - smaller
    iPadTileIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginBottom: 8,
    },
    // Tablet-specific tile icon container
    tabletTileIconContainer: {
      width: 42,
      height: 42,
      borderRadius: 21,
      marginBottom: 10,
    },
    // iPad landscape-specific tile icon container - even smaller for 6 per row
    iPadLandscapeTileIconContainer: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginBottom: 6,
    },
    // Tablet landscape-specific tile icon container
    tabletLandscapeTileIconContainer: {
      width: 34,
      height: 34,
      borderRadius: 17,
      marginBottom: 8,
    },
    tileTitle: {
      fontSize: fontSizes.tileTitle,
      fontWeight: '700',
      color: '#fff',
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    tileSubtitle: {
      fontSize: fontSizes.tileSubtitle,
      color: 'rgba(255, 255, 255, 0.8)',
      fontWeight: '500',
      marginBottom: 8,
    },
    // iPad-specific tile text styles - smaller
    iPadTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 2, 12),
      marginBottom: 2,
    },
    iPadTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 1, 10),
      marginBottom: 4,
    },
    // Tablet-specific tile text styles
    tabletTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 1, 13),
      marginBottom: 3,
    },
    tabletTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 0.5, 11),
      marginBottom: 6,
    },
    // iPad landscape-specific tile text styles - even smaller for 6 per row
    iPadLandscapeTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 3, 10),
      marginBottom: 1,
    },
    iPadLandscapeTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 2, 8),
      marginBottom: 2,
    },
    // Tablet landscape-specific tile text styles
    tabletLandscapeTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 2, 11),
      marginBottom: 2,
    },
    tabletLandscapeTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 1.5, 9),
      marginBottom: 3,
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
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.1,
        radius: 4,
        elevation: 3,
      }),
    },
    tileBadgeText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#333',
      letterSpacing: 0.2,
    },

    // Disabled tile styles
    disabledTile: {
      opacity: 0.7,
    },
    comingSoonBadge: {
      position: 'absolute',
      top: 5,
      right: 5,
      backgroundColor: '#FF9500',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.2,
        radius: 4,
        elevation: 3,
      }),
    },
    comingSoonText: {
      color: '#fff',
      fontSize: fontSizes.comingSoonText,
      fontWeight: 'bold',
      letterSpacing: 0.3,
    },

    // Legacy Quick Actions (keeping for backward compatibility)
    actionGrid: {
      gap: 15,
    },
    actionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.1,
        radius: 8,
        elevation: 4,
      }),
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
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.1,
        radius: 8,
        elevation: 4,
      }),
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
      fontSize: fontSizes.featureTitle,
      fontWeight: '600',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 4,
    },
    featureSubtitle: {
      fontSize: fontSizes.featureSubtitle,
      color: theme.colors.textSecondary, // Changed from '#666'
    },

    // Disabled feature styles
    disabledFeatureItem: {
      opacity: 0.6,
    },
    disabledFeatureText: {
      color: '#B0B0B0',
    },
    featureComingSoonBadge: {
      backgroundColor: '#FF9500',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      marginLeft: 8,
    },
    featureComingSoonText: {
      color: '#fff',
      fontSize: fontSizes.comingSoonText,
      fontWeight: 'bold',
    },

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    rolesContainer: {
      maxHeight: 300,
    },
    branchRoleGroup: {
      marginBottom: 16,
    },
    branchRoleGroupTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    roleItem: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 6,
      marginLeft: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    roleName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
    },
    modalCloseButton: {
      backgroundColor: '#007AFF',
      borderRadius: 12,
      padding: 16,
      marginTop: 20,
      alignItems: 'center',
    },
    modalCloseText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
