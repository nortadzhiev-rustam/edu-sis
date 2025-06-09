import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faUsers,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faSave,
  faEdit,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Config, buildApiUrl } from '../config/env';

export default function TeacherAttendanceScreen({ route, navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const {
    timetableId,
    subjectName,
    gradeName,
    authCode,
    isUpdate = false, // Whether this is updating existing attendance
  } = route.params || {};

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState({
    present_count: 0,
    late_count: 0,
    absent_count: 0,
    not_taken_count: 0,
  });

  // Load students data
  useEffect(() => {
    fetchAttendanceDetails();
  }, []);

  //fetch attendance details
  const fetchAttendanceDetails = async () => {
    try {
      setLoading(true);
      const url = buildApiUrl(Config.API_ENDPOINTS.GET_ATTENDANCE_DETAILS, {
        authCode,
        timetableId,
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
        console.log('Attendance details:', data);

        if (data.success) {
          // Set students data
          setStudents(
            data.students.map((student) => ({
              ...student,
              student_id: student.student_id,
              student_name: student.student_name,
              student_photo: student.student_photo || null,
              roll_number: student.roll_number || student.student_id,
              classroom_name: student.classroom_name,
              attendance_status: student.attendance_status || null,
            }))
          );

          // Set attendance summary
          if (data.attendance_summary) {
            setAttendanceSummary(data.attendance_summary);
          }

          // Set timetable info if needed
          if (data.timetable_info) {
            // You can use this data if needed
            console.log('Timetable info:', data.timetable_info);
          }
        } else {
          Alert.alert('Error', 'Failed to load attendance details');
          loadStudents(); // Fallback
        }
      } else {
        Alert.alert('Error', 'Failed to load attendance details');
        loadStudents(); // Fallback
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred while loading attendance');
      loadStudents(); // Fallback
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);

      // Fetch BPS data to get students for this class
      const url = buildApiUrl(Config.API_ENDPOINTS.GET_TEACHER_BPS, {
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
        const bpsData = await response.json();
        console.log('BPS data:', bpsData);

        // Find students for this grade/classroom
        let studentsData = [];

        if (bpsData?.branches) {
          bpsData.branches.forEach((branch) => {
            if (branch.students) {
              // Filter students by classroom name matching the grade name
              const classStudents = branch.students.filter(
                (student) =>
                  student.classroom_name &&
                  student.classroom_name.trim() !== '' &&
                  student.classroom_name === gradeName
              );

              // Transform to attendance format
              const transformedStudents = classStudents.map((student) => ({
                student_id: student.student_id,
                student_name: student.name,
                student_photo: student.photo || null,
                roll_number: student.roll_number || student.student_id,
                classroom_name: student.classroom_name,
                attendance_status: isUpdate
                  ? getRandomAttendanceStatus()
                  : null,
              }));

              studentsData = [...studentsData, ...transformedStudents];
            }
          });
        }

        // Sort students by name
        studentsData.sort((a, b) =>
          a.student_name.localeCompare(b.student_name)
        );

        setStudents(studentsData);
      } else {
        Alert.alert('Error', 'Failed to load students data');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred while loading students');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to simulate existing attendance for updates
  const getRandomAttendanceStatus = () => {
    const statuses = ['present', 'absent', 'late'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  // Update student attendance status
  const updateStudentStatus = (studentId, status) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.student_id === studentId
          ? { ...student, attendance_status: status }
          : student
      )
    );
    setHasChanges(true);
  };

  // Submit attendance
  const handleSubmitAttendance = async () => {
    // Check if all students have attendance marked
    const unmarkedStudents = students.filter((s) => !s.attendance_status);
    if (unmarkedStudents.length > 0) {
      Alert.alert(
        'Incomplete Attendance',
        `Please mark attendance for all students. ${unmarkedStudents.length} student(s) remaining.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setSubmitting(true);

      // Format attendance data according to backend expectations
      // Format: studentId|attendanceStatus|attendanceNote
      const formattedAttendance = students
        .map((student) => `${student.student_id}|${student.attendance_status}|`)
        .join('/');

      // Prepare API request
      const endpoint = Config.API_ENDPOINTS.TAKE_ATTENDANCE;
      const url = buildApiUrl(endpoint, { authCode });

      console.log('Submitting attendance to URL:', url);

      const requestPayload = {
        auth_code: authCode,
        timetable: timetableId,
        attendance: formattedAttendance,
        topic: '', // Optional topic field
      };

      console.log('Request payload:', JSON.stringify(requestPayload));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      console.log('Response status:', response.status);

      // Check if response is successful (200 status)
      if (response.status === 200) {
        // Get the raw response text first
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        let result = null;

        // Try to parse JSON if there's content
        if (responseText && responseText.trim()) {
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            // For 200 status, even if JSON parsing fails, we can treat as success
            console.log(
              'Treating as successful submission despite JSON parse error'
            );
          }
        }

        // For 200 status, treat as success regardless of response content
        // Some APIs return empty responses on successful operations
        const isSuccessful = !result || result.success !== false;

        if (isSuccessful) {
          // Fetch updated attendance details to refresh the state
          console.log('Fetching updated attendance details...');
          await fetchAttendanceDetails();

          Alert.alert(
            'Success',
            isUpdate
              ? 'Attendance updated successfully!'
              : 'Attendance submitted successfully!',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } else {
          Alert.alert(
            'Error',
            (result && result.message) || 'Failed to submit attendance'
          );
        }
      } else {
        // Handle non-200 status codes
        const responseText = await response.text();
        console.log('Error response:', responseText);

        let errorMessage = 'Failed to submit attendance';
        try {
          const result = JSON.parse(responseText);
          errorMessage = result.message || errorMessage;
        } catch (parseError) {
          // Use default error message if JSON parsing fails
          errorMessage = `Server error (${
            response.status
          }): ${responseText.substring(0, 100)}`;
        }

        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Submit attendance error:', error);
      Alert.alert(
        'Error',
        `Network error: ${error.message || 'Unknown error'}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Get attendance summary
  const getAttendanceSummary = () => {
    // If we have attendance summary from API, use it
    if (isUpdate && attendanceSummary) {
      return {
        present: attendanceSummary.present_count,
        absent: attendanceSummary.absent_count,
        late: attendanceSummary.late_count,
        total: students.length,
      };
    }

    // Otherwise calculate from current students state
    const present = students.filter(
      (s) => s.attendance_status === 'present'
    ).length;
    const absent = students.filter(
      (s) => s.attendance_status === 'absent'
    ).length;
    const late = students.filter((s) => s.attendance_status === 'late').length;
    const total = students.length;

    return { present, absent, late, total };
  };

  const summary = getAttendanceSummary();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
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
          <Text style={styles.headerTitle}>
            {isUpdate ? 'Update Attendance' : 'Take Attendance'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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
        <Text style={styles.headerTitle}>
          {isUpdate ? 'Update Attendance' : 'Take Attendance'}
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSubmitAttendance}
          disabled={submitting || !hasChanges}
        >
          <FontAwesomeIcon
            icon={isUpdate ? faEdit : faSave}
            size={20}
            color={
              hasChanges ? theme.colors.headerText : theme.colors.textLight
            }
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Class Info */}
        <View style={styles.classInfo}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'baseline',
            }}
          >
            <Text style={styles.subjectName}>{subjectName} </Text>
            <Text style={styles.gradeName}>- {gradeName}</Text>
          </View>

          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Attendance Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Attendance Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{summary.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text
                style={[styles.statNumber, { color: theme.colors.success }]}
              >
                {summary.present}
              </Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.error }]}>
                {summary.absent}
              </Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <Text
                style={[styles.statNumber, { color: theme.colors.warning }]}
              >
                {summary.late}
              </Text>
              <Text style={styles.statLabel}>Late</Text>
            </View>
          </View>
        </View>

        {/* Students List */}
        <View style={styles.studentsContainer}>
          <Text style={styles.studentsTitle}>Students ({students.length})</Text>

          {students.map((student) => (
            <View key={student.student_id} style={styles.studentCard}>
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
                      color={theme.colors.textSecondary}
                    />
                  </View>
                )}
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName}>{student.student_name}</Text>
                  <Text style={styles.rollNumber}>
                    Roll: {student.roll_number}
                  </Text>
                </View>
              </View>

              {/* Attendance Options */}
              <View style={styles.attendanceOptions}>
                <TouchableOpacity
                  style={[
                    styles.attendanceButton,
                    styles.presentButton,
                    student.attendance_status === 'present' &&
                      styles.selectedButton,
                  ]}
                  onPress={() =>
                    updateStudentStatus(student.student_id, 'present')
                  }
                >
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    size={16}
                    color={
                      student.attendance_status === 'present'
                        ? '#fff'
                        : theme.colors.success
                    }
                  />
                  <Text
                    style={[
                      styles.buttonText,
                      student.attendance_status === 'present' &&
                        styles.selectedButtonText,
                    ]}
                  >
                    Present
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.attendanceButton,
                    styles.lateButton,
                    student.attendance_status === 'late' &&
                      styles.selectedButton,
                  ]}
                  onPress={() =>
                    updateStudentStatus(student.student_id, 'late')
                  }
                >
                  <FontAwesomeIcon
                    icon={faClock}
                    size={16}
                    color={
                      student.attendance_status === 'late'
                        ? '#fff'
                        : theme.colors.warning
                    }
                  />
                  <Text
                    style={[
                      styles.buttonText,
                      student.attendance_status === 'late' &&
                        styles.selectedButtonText,
                    ]}
                  >
                    Late
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.attendanceButton,
                    styles.absentButton,
                    student.attendance_status === 'absent' &&
                      styles.selectedButton,
                  ]}
                  onPress={() =>
                    updateStudentStatus(student.student_id, 'absent')
                  }
                >
                  <FontAwesomeIcon
                    icon={faTimesCircle}
                    size={16}
                    color={
                      student.attendance_status === 'absent'
                        ? '#fff'
                        : theme.colors.error
                    }
                  />
                  <Text
                    style={[
                      styles.buttonText,
                      student.attendance_status === 'absent' &&
                        styles.selectedButtonText,
                    ]}
                  >
                    Absent
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!hasChanges || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitAttendance}
          disabled={submitting || !hasChanges}
        >
          {submitting ? (
            <ActivityIndicator size='small' color='#fff' />
          ) : (
            <>
              <FontAwesomeIcon
                icon={isUpdate ? faEdit : faSave}
                size={16}
                color='#fff'
              />
              <Text style={styles.submitButtonText}>
                {isUpdate ? 'Update Attendance' : 'Submit Attendance'}
              </Text>
            </>
          )}
        </TouchableOpacity>
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
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      color: theme.colors.headerText,
      fontSize: 18,
      fontWeight: 'bold',
      flex: 1,
      textAlign: 'center',
    },
    headerRight: {
      width: 40,
    },
    scrollView: {
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
      color: theme.colors.textSecondary,
    },
    classInfo: {
      backgroundColor: theme.colors.surface,
      margin: 20,
      marginBottom: 15,
      padding: 20,
      borderRadius: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      alignItems: 'center',
    },
    subjectName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    gradeName: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    dateText: {
      fontSize: 14,
      color: theme.colors.textLight,
    },
    summaryContainer: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 20,
      marginBottom: 15,
      padding: 20,
      borderRadius: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    summaryStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    studentsContainer: {
      marginHorizontal: 20,
      marginBottom: 100, // Space for submit button
    },
    studentsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    studentCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 15,
      marginBottom: 12,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    studentPhoto: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.border,
    },
    defaultPhotoContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    studentDetails: {
      flex: 1,
      marginLeft: 12,
    },
    studentName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    rollNumber: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    attendanceOptions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    attendanceButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginHorizontal: 2,
      borderWidth: 1,
    },
    presentButton: {
      backgroundColor: theme.colors.success + '15',
      borderColor: theme.colors.success,
    },
    lateButton: {
      backgroundColor: theme.colors.warning + '15',
      borderColor: theme.colors.warning,
    },
    absentButton: {
      backgroundColor: theme.colors.error + '15',
      borderColor: theme.colors.error,
    },
    selectedButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    buttonText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
      color: theme.colors.text,
    },
    selectedButtonText: {
      color: '#fff',
    },
    submitContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface,
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      borderRadius: 12,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    submitButtonDisabled: {
      backgroundColor: theme.colors.textLight,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
  });
