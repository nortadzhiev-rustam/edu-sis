import React, { useState, useEffect, useRef } from 'react';
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

export default function TeacherTimetable({ route, navigation }) {
  const { theme } = useTheme(); // Get theme object
  const styles = createStyles(theme); // Pass theme to styles
  const { authCode, timetableData: initialData } = route.params || {};

  const [timetableData, setTimetableData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(0);
  // Removed unused state variables since we now navigate to separate screen

  // Get current day of week (1 = Monday, 5=Friday) if Saturday or Sunday, set it to Monday
  const getCurrentDay = () => {
    const today = new Date().getDay();
    return today === 0 || today === 6 ? 1 : today;
  };

  const [selectedDay, setSelectedDay] = useState(getCurrentDay());

  // Animation values
  const todayTabAnimation = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
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

  // Animated day change function
  const animateToDay = (newDay) => {
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

    // Animate content transition
    Animated.sequence([
      Animated.timing(contentOpacity, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Change the selected day
    setSelectedDay(newDay);
  };

  // Fetch fresh timetable data
  const fetchTimetableData = async () => {
    if (!authCode) return;

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
  };

  // Take attendance for a class
  const takeAttendance = (timetableId, subjectName, gradeName) => {
    navigation.navigate('TeacherAttendance', {
      timetableId,
      subjectName,
      gradeName,
      authCode,
      isUpdate: false,
    });
  };

  // Removed fetchAttendanceDetails function since we now navigate to separate screen

  // View attendance details for a class
  const viewAttendanceDetails = (classItem) => {
    navigation.navigate('TeacherAttendance', {
      timetableId: classItem.timetable_id,
      subjectName: classItem.subject_name,
      gradeName: classItem.grade_name,
      authCode,
      isUpdate: true,
    });
  };

  // Get current branch data
  const getCurrentBranch = () => {
    if (!timetableData?.branches || timetableData.branches.length === 0)
      return null;
    return timetableData.branches[selectedBranch] || timetableData.branches[0];
  };

  // Get classes for selected day
  const getClassesForDay = () => {
    const branch = getCurrentBranch();
    if (!branch) return [];

    return branch.timetable.filter((item) => item.week_day === selectedDay);
  };

  // Get day name
  const getDayName = (dayNumber) => {
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
  };

  useEffect(() => {
    if (!initialData) {
      fetchTimetableData();
    }
  }, []);

  const todayClasses = getClassesForDay();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              size={20}
              color={theme.colors.headerText}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Timetable</Text>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={fetchTimetableData}
        >
          <FontAwesomeIcon
            icon={faRefresh}
            size={20}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>
      </View>

      {/* Fixed Selectors Header */}
      <View style={styles.fixedSelectorsHeader}>
        {/* Branch Selector */}
        {timetableData?.branches && timetableData.branches.length > 1 && (
          <View style={styles.compactBranchSelector}>
            <Text style={styles.compactSectionTitle}>Branch</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {timetableData.branches.map((branch, index) => (
                <TouchableOpacity
                  key={branch.branch_id}
                  style={[
                    styles.compactBranchTab,
                    selectedBranch === index && styles.compactBranchTabSelected,
                  ]}
                  onPress={() => setSelectedBranch(index)}
                >
                  <Text
                    style={[
                      styles.compactBranchTabText,
                      selectedBranch === index &&
                        styles.compactBranchTabTextSelected,
                    ]}
                  >
                    {branch.branch_name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
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
        <Animated.View
          style={[styles.classesListContainer, { opacity: contentOpacity }]}
        >
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
        </Animated.View>
      </ScrollView>

      {/* Redesigned Day Selector */}
      <View style={styles.daySelector}>
        <View style={styles.daySelectorBackground}>
          <View style={styles.dayTabsRow}>
            {[1, 2, 3, 4, 5].map((day) => {
              const isSelected = selectedDay === day;
              const isToday = day === getCurrentDay();
              const dayAbbr = getDayName(day).substring(0, 3);

              return (
                <View key={day} style={styles.dayTabContainer}>
                  <Animated.View
                    style={[
                      { transform: [{ scale: tabScaleAnimations[day - 1] }] },
                    ]}
                  >
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
            })}
          </View>
          {/* Animated sliding indicator */}
          <Animated.View
            style={[
              styles.slidingIndicator,
              {
                left: tabIndicatorPosition.interpolate({
                  inputRange: [0, 1, 2, 3, 4],
                  outputRange: ['10%', '30%', '50%', '70%', '90%'],
                }),
              },
            ]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background, // Changed from '#f8f9fa'
    },
    header: {
      backgroundColor: theme.colors.headerBackground, // Changed from '#007AFF'
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: theme.colors.shadow, // Changed from '#000'
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
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
      color: theme.colors.headerText, // Changed from '#fff'
      fontSize: 22,
      fontWeight: 'bold',
    },
    scrollView: {
      flex: 1,
    },

    // Fixed Selectors Header
    fixedSelectorsHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },

    // Compact Branch Selector
    compactBranchSelector: {
      marginBottom: 10,
    },
    compactSectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    compactBranchTab: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      marginRight: 8,
    },
    compactBranchTabSelected: {
      backgroundColor: theme.colors.primary,
    },
    compactBranchTabText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    compactBranchTabTextSelected: {
      color: theme.colors.headerText,
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
