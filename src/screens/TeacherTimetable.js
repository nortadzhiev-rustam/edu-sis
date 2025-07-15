import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Config, buildApiUrl } from '../config/env';
import {
  faArrowLeft,
  faCalendarAlt,
  faCheckCircle,
  faRefresh,
  faUserCheck,
  faEye,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { isDemoMode } from '../services/authService';
import { getDemoTimetableData } from '../services/demoModeService';

export default function TeacherTimetable({ route, navigation }) {
  const { theme } = useTheme(); // Get theme object

  // Memoize styles to prevent recreation on every render
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    authCode,
    timetableData: initialData,
    selectedBranch: initialSelectedBranch, // For backward compatibility
    selectedBranchId: initialSelectedBranchId, // New branch_id parameter
  } = route.params || {};

  const [timetableData, setTimetableData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize selectedBranchId - prioritize new parameter, fallback to index-based
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    // First priority: use the new selectedBranchId parameter
    if (initialSelectedBranchId) {
      return initialSelectedBranchId;
    }

    // Fallback: convert old selectedBranch index to branch_id
    if (initialData?.branches && initialSelectedBranch !== undefined) {
      const branch = initialData.branches[initialSelectedBranch];
      return branch ? branch.branch_id : null;
    }

    return null;
  });
  // Removed unused state variables since we now navigate to separate screen

  // Get current day of week (1 = Monday, 5=Friday) if Saturday or Sunday, set it to Monday
  const getCurrentDay = useCallback(() => {
    const today = new Date().getDay();
    return today === 0 || today === 6 ? 1 : today;
  }, []);

  const [selectedDay, setSelectedDay] = useState(getCurrentDay());

  // Animation values for day tabs only
  const todayTabAnimation = useRef(new Animated.Value(1)).current;
  const tabIndicatorPosition = useRef(
    new Animated.Value(getCurrentDay() - 1)
  ).current;
  const tabScaleAnimations = useRef(
    [1, 2, 3, 4, 5].map(() => new Animated.Value(1))
  ).current;

  // Start pulsing animation for today tab
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(todayTabAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(todayTabAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [todayTabAnimation]);

  // Animate tab indicator position when selected day changes
  useEffect(() => {
    const targetPosition = selectedDay - 1; // 0, 1, 2, 3, 4 for days 1-5
    Animated.spring(tabIndicatorPosition, {
      toValue: targetPosition,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [selectedDay, tabIndicatorPosition]);

  // Animated day change function for day tabs
  const animateToDay = useCallback(
    (newDay) => {
      if (newDay === selectedDay) return;

      // Animate tab scale
      const tabIndex = newDay - 1;
      Animated.sequence([
        Animated.timing(tabScaleAnimations[tabIndex], {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(tabScaleAnimations[tabIndex], {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Change the selected day (no content animation)
      setSelectedDay(newDay);
    },
    [selectedDay, tabScaleAnimations]
  );

  // Fetch fresh timetable data
  const fetchTimetableData = useCallback(async () => {
    if (!authCode) return;

    // Check if this is a demo authCode
    if (authCode.startsWith('DEMO_AUTH_')) {
      console.log(
        '🎭 DEMO MODE: Using demo timetable data in TeacherTimetable'
      );
      const demoData = getDemoTimetableData('teacher');
      setTimetableData(demoData);
      setRefreshing(false);
      return;
    }

    try {
      setRefreshing(true);
      const url = buildApiUrl(Config.API_ENDPOINTS.GET_TEACHER_TIMETABLE, {
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
        setTimetableData(data);
      } else {
        Alert.alert('Error', 'Failed to fetch timetable data');
      }
    } catch (error) {
      console.error('Error fetching timetable data:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setRefreshing(false);
    }
  }, [authCode]);

  // Take attendance for a class
  const takeAttendance = useCallback(
    (timetableId, subjectName, gradeName) => {
      navigation.navigate('TeacherAttendance', {
        timetableId,
        subjectName,
        gradeName,
        authCode,
        isUpdate: false,
        onAttendanceSubmitted: fetchTimetableData, // Refresh timetable after attendance
      });
    },
    [navigation, authCode, fetchTimetableData]
  );

  // Removed fetchAttendanceDetails function since we now navigate to separate screen

  // View attendance details for a class
  const viewAttendanceDetails = useCallback(
    (classItem) => {
      navigation.navigate('TeacherAttendance', {
        timetableId: classItem.timetable_id,
        subjectName: classItem.subject_name,
        gradeName: classItem.grade_name,
        authCode,
        isUpdate: true,
        onAttendanceSubmitted: fetchTimetableData, // Refresh timetable after attendance update
      });
    },
    [navigation, authCode, fetchTimetableData]
  );

  // Get current branch data
  const getCurrentBranch = useCallback(() => {
    if (!timetableData?.branches || timetableData.branches.length === 0)
      return null;

    if (selectedBranchId) {
      const branch = timetableData.branches.find(
        (b) => b.branch_id === selectedBranchId
      );
      return branch || timetableData.branches[0];
    }

    return timetableData.branches[0];
  }, [timetableData, selectedBranchId]);

  // Get classes for selected day
  const getClassesForDay = useCallback(() => {
    const branch = getCurrentBranch();
    if (!branch) return [];

    return branch.timetable.filter((item) => item.week_day === selectedDay);
  }, [getCurrentBranch, selectedDay]);

  // Get day name - memoized since it's used frequently
  const getDayName = useCallback((dayNumber) => {
    const days = [
      '',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return days[dayNumber] || '';
  }, []);

  useEffect(() => {
    if (!initialData) {
      fetchTimetableData();
    }
  }, [fetchTimetableData, initialData]);

  // Initialize selectedBranchId when timetableData changes
  useEffect(() => {
    if (timetableData?.branches && !selectedBranchId) {
      // First priority: use the new selectedBranchId parameter
      if (initialSelectedBranchId) {
        const branchExists = timetableData.branches.find(
          (b) => b.branch_id === initialSelectedBranchId
        );
        if (branchExists) {
          setSelectedBranchId(initialSelectedBranchId);
          return;
        }
      }

      // Fallback: convert old selectedBranch index to branch_id
      if (
        initialSelectedBranch !== undefined &&
        timetableData.branches[initialSelectedBranch]
      ) {
        setSelectedBranchId(
          timetableData.branches[initialSelectedBranch].branch_id
        );
      } else if (timetableData.branches.length > 0) {
        setSelectedBranchId(timetableData.branches[0].branch_id);
      }
    }
  }, [
    timetableData,
    selectedBranchId,
    initialSelectedBranch,
    initialSelectedBranchId,
  ]);

  // Memoize today's classes to prevent recalculation on every render
  const todayClasses = useMemo(() => getClassesForDay(), [getClassesForDay]);

  // Memoize sliding indicator style for day tabs
  const slidingIndicatorStyle = useMemo(
    () => [
      styles.slidingIndicator,
      {
        left: tabIndicatorPosition.interpolate({
          inputRange: [0, 1, 2, 3, 4],
          outputRange: ['10%', '30%', '50%', '70%', '90%'],
        }),
      },
    ],
    [styles.slidingIndicator, tabIndicatorPosition]
  );

  // Memoize day tab render function to prevent recreation
  const renderDayTab = useCallback(
    (day) => {
      const isSelected = selectedDay === day;
      const isToday = day === getCurrentDay();
      const dayAbbr = getDayName(day).substring(0, 3);
      const tabIndex = day - 1;

      const animatedTabStyle = {
        transform: [{ scale: tabScaleAnimations[tabIndex] }],
      };

      return (
        <View key={day} style={styles.dayTabContainer}>
          <Animated.View style={animatedTabStyle}>
            <TouchableOpacity
              style={[
                styles.dayTab,
                isSelected && styles.selectedDayTab,
                isToday && !isSelected && styles.todayDayTab,
              ]}
              onPress={() => animateToDay(day)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dayTabText,
                  isSelected && styles.selectedDayTabText,
                  isToday && !isSelected && styles.todayDayTabText,
                ]}
              >
                {dayAbbr}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    },
    [
      selectedDay,
      getCurrentDay,
      getDayName,
      styles,
      tabScaleAnimations,
      animateToDay,
    ]
  );

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

          <Text style={styles.headerTitle}>My Timetable</Text>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchTimetableData}
          >
            <FontAwesomeIcon icon={faRefresh} size={18} color='#fff' />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Classes List */}
      <ScrollView
        style={styles.classesScrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchTimetableData}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.classesListContainer}>
          <View style={styles.classesHeader}>
            <Text style={styles.classesTitle}>
              {getDayName(selectedDay)} Classes
            </Text>
            <View style={styles.classesCount}>
              <Text style={styles.classesCountText}>{todayClasses.length}</Text>
            </View>
          </View>

          {todayClasses.length > 0 ? (
            todayClasses
              .sort((a, b) => a.week_time - b.week_time)
              .map((classItem, index) => (
                <View
                  key={`${classItem.timetable_id}-${index}`}
                  style={styles.classCard}
                >
                  <View style={styles.classHeader}>
                    <View style={styles.periodBadge}>
                      <Text style={styles.periodText}>
                        P{classItem.week_time}
                      </Text>
                    </View>
                    <View style={styles.classInfo}>
                      <Text style={styles.subjectName}>
                        {classItem.subject_name}
                      </Text>
                      <Text style={styles.gradeName}>
                        {classItem.grade_name}
                      </Text>
                    </View>
                  </View>

                  {!classItem.attendance_taken && (
                    <View style={styles.classCardBody}>
                      <TouchableOpacity
                        style={styles.takeAttendanceButton}
                        onPress={() =>
                          takeAttendance(
                            classItem.timetable_id,
                            classItem.subject_name,
                            classItem.grade_name
                          )
                        }
                      >
                        <FontAwesomeIcon
                          icon={faUserCheck}
                          size={18}
                          color={theme.colors.headerText}
                        />
                        <Text style={styles.buttonText}>Take Attendance</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {classItem.attendance_taken && (
                    <View style={styles.attendanceDetailsContainer}>
                      <View style={styles.attendanceStatusInfo}>
                        <View style={styles.statusIconContainer}>
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            size={18}
                            color='#fff'
                          />
                        </View>
                        <View style={styles.statusTextContainer}>
                          <Text style={styles.attendanceCompletedText}>
                            Attendance Completed
                          </Text>
                          <Text style={styles.attendanceTimestamp}>
                            Tap to view details
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.modernViewButton}
                        onPress={() => viewAttendanceDetails(classItem)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.viewButtonContent}>
                          <FontAwesomeIcon
                            icon={faEye}
                            size={16}
                            color={theme.colors.headerText}
                          />
                          <Text style={styles.viewButtonText}>
                            View Details
                          </Text>
                        </View>
                        <View style={styles.viewButtonArrow}>
                          <FontAwesomeIcon
                            icon={faChevronRight}
                            size={12}
                            color={theme.colors.headerText}
                          />
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesomeIcon
                icon={faCalendarAlt}
                size={48}
                color={theme.colors.textLight}
              />
              <Text style={styles.emptyStateText}>No classes scheduled</Text>
              <Text style={styles.emptyStateSubtext}>
                No classes found for {getDayName(selectedDay)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Redesigned Day Selector */}
      <View style={styles.daySelector}>
        <View style={styles.daySelectorBackground}>
          <View style={styles.dayTabsRow}>
            {[1, 2, 3, 4, 5].map(renderDayTab)}
          </View>
          {/* Animated sliding indicator */}
          <Animated.View style={slidingIndicatorStyle} />
        </View>
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
    refreshButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },

    // Redesigned Day Selector
    daySelector: {
      backgroundColor: 'transparent',
      paddingHorizontal: 20,
      paddingVertical: 15,
      marginBottom: 0,
    },
    daySelectorBackground: {
      backgroundColor: theme.colors.surface,
      borderRadius: 25,
      paddingVertical: 8,
      paddingHorizontal: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    dayTabsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dayTabContainer: {
      flex: 1,
      alignItems: 'center',
      position: 'relative',
    },

    dayTab: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 18,
      minWidth: 50,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    selectedDayTab: {
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    todayDayTab: {
      backgroundColor: theme.colors.success + '20',
      borderWidth: 1,
      borderColor: theme.colors.success + '40',
    },
    dayTabText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    selectedDayTabText: {
      color: theme.colors.headerText,
      fontWeight: '700',
    },
    todayDayTabText: {
      color: theme.colors.success,
      fontWeight: '700',
    },
    selectedIndicator: {
      position: 'absolute',
      bottom: -12,
      width: 20,
      height: 3,
      borderRadius: 2,
      backgroundColor: theme.colors.primary,
    },
    slidingIndicator: {
      position: 'absolute',
      bottom: -12,
      width: 20,
      height: 3,
      borderRadius: 2,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 3,
      marginLeft: -1, // Center the indicator by offsetting half its width
    },

    // Scrollable Classes
    classesScrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    classesListContainer: {
      padding: 15,
    },
    classesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    classesTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    classesCount: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    classesCountText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.headerText,
    },

    classCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 0,
      marginBottom: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
      borderWidth: 1,
      borderColor: theme.colors.border + '40',
    },
    classHeader: {
      backgroundColor: theme.colors.primary + '08',
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '20',
    },
    periodBadge: {
      width: 48,
      height: 48,
      backgroundColor: theme.colors.primary,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    periodText: {
      color: theme.colors.headerText,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    classInfo: {
      flex: 1,
    },
    subjectName: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    gradeName: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      opacity: 0.8,
    },
    attendanceStatus: {
      alignItems: 'center',
    },
    attendanceTaken: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    attendanceText: {
      fontSize: 12,
      color: theme.colors.success, // Changed from '#34C759'
      marginLeft: 6,
      fontWeight: '600',
    },
    takeAttendanceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.success,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      minWidth: 140,
      shadowColor: theme.colors.success,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    buttonText: {
      color: theme.colors.headerText,
      fontSize: 14,
      fontWeight: '700',
      marginLeft: 8,
      letterSpacing: 0.5,
    },
    // Card Body Section
    classCardBody: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },

    // Redesigned Attendance Details Section
    attendanceDetailsContainer: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
      backgroundColor: theme.colors.background + '40',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + '30',
    },
    attendanceStatusInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      backgroundColor: theme.colors.success + '10',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.success + '20',
    },
    statusIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.success,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
      shadowColor: theme.colors.success,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    statusTextContainer: {
      flex: 1,
    },
    attendanceCompletedText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.success,
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    attendanceTimestamp: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      opacity: 0.8,
    },

    // Modern View Button
    modernViewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 14,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 5,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    viewButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    viewButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.headerText,
      marginLeft: 10,
      letterSpacing: 0.3,
    },
    viewButtonArrow: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },

    // Empty State
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.textSecondary, // Changed from '#666'
      marginTop: 15,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: theme.colors.textLight, // Changed from '#999'
      textAlign: 'center',
    },
  });
