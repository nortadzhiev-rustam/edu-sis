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
  faBuilding,
  faRefresh,
  faUserCheck,
  faEye,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function TeacherTimetable({ route, navigation }) {
  const { theme } = useTheme(); // Get theme object
  const styles = createStyles(theme); // Pass theme to styles
  const {
    authCode,
    teacherName,
    timetableData: initialData,
  } = route.params || {};

  const [timetableData, setTimetableData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(0);
  // Removed unused state variables since we now navigate to separate screen

  // Animation for today tab
  const todayTabAnimation = useRef(new Animated.Value(1)).current;

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

  // Get current day of week (1 = Monday, 5=Friday) if Saturday or Sunday, set it to Monday
  const getCurrentDay = () => {
    const today = new Date().getDay();
    return today === 0 || today === 6 ? 1 : today;
  };

  const [selectedDay, setSelectedDay] = useState(getCurrentDay());

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
        console.log('Teacher timetable data:', data);
        setTimetableData(data);
      } else {
        Alert.alert('Error', 'Failed to fetch timetable data');
      }
    } catch (error) {
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

  const currentBranch = getCurrentBranch();
  const todayClasses = getClassesForDay();

  return (
    <SafeAreaView style={styles.container}>
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

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchTimetableData}
            colors={[theme.colors.primary]} // Use theme color
            tintColor={theme.colors.primary} // Use theme color
          />
        }
      >
        {/* Teacher Info */}
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherName}>{teacherName}</Text>
          <Text style={styles.teacherSubtitle}>Teacher Dashboard</Text>
        </View>

        {/* Branch Selector */}
        {timetableData?.branches && timetableData.branches.length > 1 && (
          <View style={styles.branchSelector}>
            <Text style={styles.sectionTitle}>Select Branch</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {timetableData.branches.map((branch, index) => (
                <TouchableOpacity
                  key={branch.branch_id}
                  style={[
                    styles.branchTab,
                    selectedBranch === index && styles.selectedBranchTab,
                  ]}
                  onPress={() => setSelectedBranch(index)}
                >
                  <FontAwesomeIcon
                    icon={faBuilding}
                    size={16}
                    color={
                      selectedBranch === index
                        ? theme.colors.headerText
                        : theme.colors.textSecondary
                    } // Use theme colors
                  />
                  <Text
                    style={[
                      styles.branchTabText,
                      selectedBranch === index && styles.selectedBranchTabText,
                    ]}
                  >
                    {branch.branch_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Current Branch Info */}
        {currentBranch && (
          <View style={styles.branchInfo}>
            <View style={styles.branchHeader}>
              <View style={styles.branchIconContainer}>
                <FontAwesomeIcon
                  icon={faBuilding}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.branchDetails}>
                <Text style={styles.branchName}>
                  {currentBranch.branch_name}
                </Text>
                <Text style={styles.branchSubtitle}>
                  Academic Year:{' '}
                  {timetableData.global_academic_year.academic_year} • Week:{' '}
                  {currentBranch.current_week}
                </Text>
              </View>
            </View>

            <View style={styles.branchStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {currentBranch.timetable.length}
                </Text>
                <Text style={styles.statLabel}>Total Classes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {
                    currentBranch.timetable.filter(
                      (item) => item.attendance_taken
                    ).length
                  }
                </Text>
                <Text style={styles.statLabel}>Attended</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {
                    currentBranch.timetable.filter(
                      (item) => !item.attendance_taken
                    ).length
                  }
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </View>
        )}

        {/* Day Selector */}
        <View style={styles.daySelector}>
          <Text style={styles.sectionTitle}>Select Day</Text>
          <ScrollView
            style={{ padding: 2 }}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {[1, 2, 3, 4, 5].map((day) => {
              const isToday = day === getCurrentDay();

              if (isToday) {
                return (
                  <Animated.View
                    key={day}
                    style={{
                      transform: [{ scale: todayTabAnimation }],
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.dayTab,
                        selectedDay === day && styles.selectedDayTab,
                        styles.todayTab,
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text
                        style={[
                          styles.dayTabText,
                          selectedDay === day && styles.selectedDayTabText,
                        ]}
                      >
                        {getDayName(day).substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              }

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayTab,
                    selectedDay === day && styles.selectedDayTab,
                  ]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text
                    style={[
                      styles.dayTabText,
                      selectedDay === day && styles.selectedDayTabText,
                    ]}
                  >
                    {getDayName(day).substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Classes List */}
        <View style={styles.classesContainer}>
          <Text style={styles.sectionTitle}>
            {getDayName(selectedDay)} Classes ({todayClasses.length})
          </Text>

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
                    <View style={styles.attendanceStatus}>
                      {classItem.attendance_taken ? (
                        <View style={styles.attendanceTaken}>
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            size={20}
                            color={theme.colors.success} // Use theme color
                          />
                          <Text style={styles.attendanceText}>Taken</Text>
                        </View>
                      ) : (
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
                            size={16}
                            color={theme.colors.headerText} // Use theme color
                          />
                          <Text style={styles.buttonText}>Take</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {classItem.attendance_taken && (
                    <View style={styles.attendanceDetailsContainer}>
                      <View style={styles.attendanceStatusInfo}>
                        <View style={styles.statusIconContainer}>
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            size={16}
                            color={theme.colors.success}
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
    teacherInfo: {
      backgroundColor: theme.colors.surface, // Changed from '#fff'
      margin: 20,
      marginBottom: 15,
      padding: 20,
      borderRadius: 16,
      shadowColor: theme.colors.shadow, // Changed from '#000'
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      alignItems: 'center',
    },
    teacherName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 4,
    },
    teacherSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary, // Changed from '#666'
    },

    // Section Titles
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 15,
    },

    // Branch Selector
    branchSelector: {
      marginHorizontal: 20,
      marginBottom: 15,
    },
    branchTab: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface, // Changed from '#fff'
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      marginRight: 10,
      shadowColor: theme.colors.shadow, // Changed from '#000'
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    selectedBranchTab: {
      backgroundColor: theme.colors.primary, // Changed from '#007AFF'
    },
    branchTabText: {
      fontSize: 14,
      color: theme.colors.textSecondary, // Changed from '#666'
      marginLeft: 6,
      fontWeight: '500',
    },
    selectedBranchTabText: {
      color: theme.colors.headerText, // Changed from '#fff'
    },

    // Branch Info
    branchInfo: {
      backgroundColor: theme.colors.surface, // Changed from '#fff'
      marginHorizontal: 20,
      marginBottom: 15,
      padding: 20,
      borderRadius: 16,
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
      backgroundColor: theme.colors.primary + '15', // Changed from '#007AFF15'
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    branchDetails: {
      flex: 1,
    },
    branchName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 4,
    },
    branchSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary, // Changed from '#666'
    },
    branchStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary, // Changed from '#666'
      fontWeight: '500',
    },

    // Day Selector
    daySelector: {
      marginHorizontal: 20,
      marginBottom: 15,
    },
    dayTab: {
      backgroundColor: theme.colors.surface, // Changed from '#fff'
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      marginRight: 10,
      alignItems: 'center',
      shadowColor: theme.colors.shadow, // Changed from '#000'
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      position: 'relative',
    },
    selectedDayTab: {
      backgroundColor: theme.colors.primary, // Changed from '#007AFF'
    },
    todayTab: {
      borderWidth: 2,
      borderColor: theme.colors.success, // Changed from '#34C759'
    },
    dayTabText: {
      fontSize: 14,
      color: theme.colors.textSecondary, // Changed from '#666'
      fontWeight: '600',
    },
    selectedDayTabText: {
      color: theme.colors.headerText, // Changed from '#fff'
    },
    todayTabText: {
      color: theme.colors.success, // Changed from '#34C759'
    },

    // Classes Container
    classesContainer: {
      marginHorizontal: 20,
      marginBottom: 25,
    },
    classCard: {
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
    classHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    periodBadge: {
      backgroundColor: theme.colors.primary, // Changed from '#007AFF'
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginRight: 15,
    },
    periodText: {
      color: theme.colors.headerText, // Changed from '#fff'
      fontSize: 12,
      fontWeight: 'bold',
    },
    classInfo: {
      flex: 1,
    },
    subjectName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 4,
    },
    gradeName: {
      fontSize: 14,
      color: theme.colors.textSecondary, // Changed from '#666'
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
      backgroundColor: theme.colors.success, // Changed from '#34C759'
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
    },
    buttonText: {
      color: theme.colors.headerText, // Changed from '#fff'
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 6,
    },
    // Redesigned Attendance Details Section
    attendanceDetailsContainer: {
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    attendanceStatusInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.success + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    statusTextContainer: {
      flex: 1,
    },
    attendanceCompletedText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.success,
      marginBottom: 3,
      letterSpacing: 0.2,
    },
    attendanceTimestamp: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontWeight: '500',
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

    // Legacy styles (keeping for backward compatibility)
    attendanceDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    attendanceCount: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 8,
      flex: 1,
    },
    viewIcon: {
      marginLeft: 8,
    },
    viewText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 6,
    },
    viewIconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
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

    // Loading Overlay
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: theme.colors.headerText, // Changed from '#fff'
      fontSize: 16,
      marginTop: 10,
      fontWeight: '500',
    },

    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background, // Changed from '#f8f9fa'
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.colors.surface, // Changed from '#fff'
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border, // Changed from '#f0f0f0'
    },
    modalCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.border, // Changed from '#f0f0f0'
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text, // Changed from '#1a1a1a'
    },
    modalHeaderRight: {
      width: 40,
    },
    modalContent: {
      flex: 1,
      padding: 20,
    },

    // Class Info Card
    classInfoCard: {
      backgroundColor: theme.colors.surface, // Changed from '#fff'
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: theme.colors.shadow, // Changed from '#000'
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    classInfoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    classInfoDetails: {
      flex: 1,
      marginLeft: 15,
    },
    modalSubjectName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 4,
    },
    modalGradeName: {
      fontSize: 14,
      color: theme.colors.textSecondary, // Changed from '#666'
    },

    // Attendance Summary
    attendanceSummary: {
      backgroundColor: theme.colors.surface, // Changed from '#fff'
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: theme.colors.shadow, // Changed from '#000'
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 15,
    },
    summaryStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    summaryItem: {
      alignItems: 'center',
    },
    summaryNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 4,
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary, // Changed from '#666'
      fontWeight: '500',
    },

    // Students List
    studentsListContainer: {
      backgroundColor: theme.colors.surface, // Changed from '#fff'
      borderRadius: 16,
      padding: 20,
      shadowColor: theme.colors.shadow, // Changed from '#000'
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    studentsListTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 15,
    },
    studentItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border, // Changed from '#f0f0f0'
    },
    studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    studentPhoto: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.border, // Changed from '#f0f0f0'
    },
    defaultPhotoContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.border, // Changed from '#f0f0f0'
      justifyContent: 'center',
      alignItems: 'center',
    },
    studentName: {
      fontSize: 16,
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginLeft: 10,
      fontWeight: '500',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: theme.colors.border, // Changed from '#f0f0f0'
    },
    presentBadge: {
      backgroundColor: theme.colors.success + '15',
    },
    absentBadge: {
      backgroundColor: theme.colors.error + '15',
    },
    lateBadge: {
      backgroundColor: theme.colors.warning + '15',
    },
    statusText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.textSecondary, // Changed from '#666'
    },
    presentText: {
      color: theme.colors.success,
    },
    absentText: {
      color: theme.colors.error,
    },
    lateText: {
      color: theme.colors.warning,
    },

    // Loading and No Data States
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    noDataText: {
      fontSize: 14,
      color: theme.colors.textLight, // Changed from '#999'
      textAlign: 'center',
      paddingVertical: 20,
      fontStyle: 'italic',
    },
  });
