import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faCalendarAlt,
  faCheckCircle,
  faBuilding,
  faRefresh,
  faUserCheck,
  faUsers,
  faTimes,
  faEye,
} from '@fortawesome/free-solid-svg-icons';

export default function TeacherTimetable({ route, navigation }) {
  const {
    authCode,
    teacherName,
    timetableData: initialData,
  } = route.params || {};

  const [timetableData, setTimetableData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedClassAttendance, setSelectedClassAttendance] = useState(null);
  const [attendanceDetails, setAttendanceDetails] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

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

  // Get current day of week (1 = Monday, 7 = Sunday)
  const getCurrentDay = () => {
    const today = new Date().getDay();
    return today === 0 ? 7 : today; // Convert Sunday from 0 to 7
  };

  const [selectedDay, setSelectedDay] = useState(getCurrentDay());

  // Fetch fresh timetable data
  const fetchTimetableData = async () => {
    if (!authCode) return;

    try {
      setRefreshing(true);
      const url = `https://sis.bfi.edu.mm/mobile-api/get-teacher-timetable-data/?authCode=${authCode}`;

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
      console.error('Error fetching timetable:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setRefreshing(false);
    }
  };

  // Take attendance for a class
  const takeAttendance = async (timetableId, subjectName, gradeName) => {
    Alert.alert(
      'Take Attendance',
      `Take attendance for ${subjectName} - ${gradeName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Attendance',
          onPress: async () => {
            setLoading(true);
            try {
              // Here you would call the attendance API
              // For now, we'll simulate success and refresh data
              await new Promise((resolve) => setTimeout(resolve, 1000));

              Alert.alert('Success', 'Attendance taken successfully!');
              await fetchTimetableData();
            } catch (error) {
              Alert.alert('Error', 'Failed to take attendance');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Fetch attendance details for a specific class
  const fetchAttendanceDetails = async (timetableId) => {
    try {
      setLoadingAttendance(true);
      const url = `https://sis.bfi.edu.mm/mobile-api/get-attendance-details/?authCode=${authCode}&timetableId=${timetableId}`;
      console.log('Fetching attendance details with URL:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Attendance details:', data);
        return data;
      } else {
        console.error('Failed to fetch attendance details:', response);
        return null;
      }
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      return null;
    } finally {
      setLoadingAttendance(false);
    }
  };

  // View attendance details for a class
  const viewAttendanceDetails = async (classItem) => {
    setSelectedClassAttendance(classItem);
    setShowAttendanceModal(true);

    // Fetch real attendance data
    const details = await fetchAttendanceDetails(classItem.timetable_id);
    if (details) {
      setAttendanceDetails(details);
    }
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
            <FontAwesomeIcon icon={faArrowLeft} size={20} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Timetable</Text>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={fetchTimetableData}
        >
          <FontAwesomeIcon icon={faRefresh} size={20} color='#fff' />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchTimetableData}
            colors={['#007AFF']}
            tintColor='#007AFF'
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
                    color={selectedBranch === index ? '#fff' : '#666'}
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
                <FontAwesomeIcon icon={faBuilding} size={20} color='#007AFF' />
              </View>
              <View style={styles.branchDetails}>
                <Text style={styles.branchName}>
                  {currentBranch.branch_name}
                </Text>
                <Text style={styles.branchSubtitle}>
                  Academic Year: {currentBranch.academic_year_id} • Week:{' '}
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
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
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
                            color='#34C759'
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
                          disabled={loading}
                        >
                          {loading ? (
                            <ActivityIndicator size='small' color='#fff' />
                          ) : (
                            <>
                              <FontAwesomeIcon
                                icon={faUserCheck}
                                size={16}
                                color='#fff'
                              />
                              <Text style={styles.buttonText}>Take</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {classItem.attendance_taken && (
                    <TouchableOpacity
                      style={styles.attendanceDetails}
                      onPress={() => viewAttendanceDetails(classItem)}
                    >
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        size={14}
                        color='#34C759'
                      />
                      <Text style={styles.attendanceCount}>
                        Attendance completed
                      </Text>
                      <FontAwesomeIcon
                        icon={faEye}
                        size={14}
                        color='#007AFF'
                        style={styles.viewIcon}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesomeIcon icon={faCalendarAlt} size={48} color='#ccc' />
              <Text style={styles.emptyStateText}>No classes scheduled</Text>
              <Text style={styles.emptyStateSubtext}>
                No classes found for {getDayName(selectedDay)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size='large' color='#007AFF' />
          <Text style={styles.loadingText}>Taking attendance...</Text>
        </View>
      )}

      {/* Attendance Details Modal */}
      <Modal
        visible={showAttendanceModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => {
          setShowAttendanceModal(false);
          setAttendanceDetails(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowAttendanceModal(false);
                setAttendanceDetails(null);
              }}
            >
              <FontAwesomeIcon icon={faTimes} size={20} color='#666' />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Attendance Details</Text>
            <View style={styles.modalHeaderRight} />
          </View>

          {selectedClassAttendance && (
            <ScrollView style={styles.modalContent}>
              {/* Class Info */}
              <View style={styles.classInfoCard}>
                <View style={styles.classInfoHeader}>
                  <View style={styles.periodBadge}>
                    <Text style={styles.periodText}>
                      P{selectedClassAttendance.week_time}
                    </Text>
                  </View>
                  <View style={styles.classInfoDetails}>
                    <Text style={styles.modalSubjectName}>
                      {selectedClassAttendance.subject_name}
                    </Text>
                    <Text style={styles.modalGradeName}>
                      {selectedClassAttendance.grade_name}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Attendance Summary */}
              <View style={styles.attendanceSummary}>
                <Text style={styles.summaryTitle}>Attendance Summary</Text>
                {loadingAttendance ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size='small' color='#007AFF' />
                    <Text style={styles.loadingText}>
                      Loading attendance data...
                    </Text>
                  </View>
                ) : attendanceDetails ? (
                  <View style={styles.summaryStats}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryNumber}>
                        {attendanceDetails.total_students || 0}
                      </Text>
                      <Text style={styles.summaryLabel}>Total Students</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text
                        style={[styles.summaryNumber, { color: '#34C759' }]}
                      >
                        {attendanceDetails.attendance_summary.present_count ||
                          0}
                      </Text>
                      <Text style={styles.summaryLabel}>Present</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text
                        style={[styles.summaryNumber, { color: '#FF3B30' }]}
                      >
                        {attendanceDetails.attendance_summary.absent_count || 0}
                      </Text>
                      <Text style={styles.summaryLabel}>Absent</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text
                        style={[styles.summaryNumber, { color: '#FF9500' }]}
                      >
                        {attendanceDetails.attendance_summary.late_count || 0}
                      </Text>
                      <Text style={styles.summaryLabel}>Late</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noDataText}>
                    No attendance data available
                  </Text>
                )}
              </View>

              {/* Students List */}
              <View style={styles.studentsListContainer}>
                <Text style={styles.studentsListTitle}>Students</Text>

                {loadingAttendance ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size='small' color='#007AFF' />
                    <Text style={styles.loadingText}>
                      Loading student data...
                    </Text>
                  </View>
                ) : attendanceDetails?.students ? (
                  attendanceDetails.students.map((student) => (
                    <View
                      key={student.student_id || student.id}
                      style={styles.studentItem}
                    >
                      <View style={styles.studentInfo}>
                        {student.student_photo ? (
                          <Image
                            source={{
                              uri: `https://sis.bfi.edu.mm/${student.student_photo}`,
                            }}
                            style={styles.studentPhoto}
                          />
                        ) : (
                          <View style={styles.defaultPhotoContainer}>
                            <FontAwesomeIcon
                              icon={faUsers}
                              size={16}
                              color='#666'
                            />
                          </View>
                        )}
                        <Text style={styles.studentName}>
                          {student.student_name || student.name}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          student.attendance_status === 'present' &&
                            styles.presentBadge,
                          student.attendance_status === 'absent' &&
                            styles.absentBadge,
                          student.attendance_status === 'late' &&
                            styles.lateBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            student.attendance_status === 'present' &&
                              styles.presentText,
                            student.attendance_status === 'absent' &&
                              styles.absentText,
                            student.attendance_status === 'late' &&
                              styles.lateText,
                          ]}
                        >
                          {student.attendance_status || 'Unknown'}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>
                    No student data available
                  </Text>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
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
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  teacherInfo: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  teacherName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  teacherSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  // Section Titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedBranchTab: {
    backgroundColor: '#007AFF',
  },
  branchTabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  selectedBranchTabText: {
    color: '#fff',
  },

  // Branch Info
  branchInfo: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
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
    backgroundColor: '#007AFF15',
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
    color: '#1a1a1a',
    marginBottom: 4,
  },
  branchSubtitle: {
    fontSize: 14,
    color: '#666',
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
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  // Day Selector
  daySelector: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  dayTab: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  selectedDayTab: {
    backgroundColor: '#007AFF',
  },
  todayTab: {
    borderWidth: 2,
    borderColor: '#34C759',
  },
  dayTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  selectedDayTabText: {
    color: '#fff',
  },
  todayTabText: {
    color: '#34C759',
  },

  // Classes Container
  classesContainer: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
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
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 15,
  },
  periodText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  classInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  gradeName: {
    fontSize: 14,
    color: '#666',
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
    color: '#34C759',
    marginLeft: 6,
    fontWeight: '600',
  },
  takeAttendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  attendanceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  attendanceCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  viewIcon: {
    marginLeft: 8,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
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
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
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
    color: '#1a1a1a',
    marginBottom: 4,
  },
  modalGradeName: {
    fontSize: 14,
    color: '#666',
  },

  // Attendance Summary
  attendanceSummary: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
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
    color: '#1a1a1a',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  // Students List
  studentsListContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  studentsListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  studentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    backgroundColor: '#f0f0f0',
  },
  defaultPhotoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 10,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  presentBadge: {
    backgroundColor: '#34C75915',
  },
  absentBadge: {
    backgroundColor: '#FF3B3015',
  },
  lateBadge: {
    backgroundColor: '#FF950015',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  presentText: {
    color: '#34C759',
  },
  absentText: {
    color: '#FF3B30',
  },
  lateText: {
    color: '#FF9500',
  },

  // Loading and No Data States
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
});
