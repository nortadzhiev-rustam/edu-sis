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
import { useLanguage } from '../contexts/LanguageContext';
import { Config, buildApiUrl } from '../config/env';
import { getDemoTeacherAttendanceData } from '../services/demoModeService';

export default function TeacherAttendanceScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  const {
    timetableId,
    subjectName,
    gradeName,
    authCode,
    isUpdate = false, // Whether this is updating existing attendance
    onAttendanceSubmitted, // Callback to refresh parent screen
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

  // Enable submit button when students are loaded for new attendance
  useEffect(() => {
    if (students.length > 0 && !isUpdate && !loading) {
      // For new attendance, all students default to 'present', so enable submit
      setHasChanges(true);
    }
  }, [students, isUpdate, loading]);

  //fetch attendance details
  const fetchAttendanceDetails = async () => {
    try {
      setLoading(true);

      // Check if this is demo mode
      if (authCode && authCode.startsWith('DEMO_AUTH_')) {
        console.log(
          '🎭 DEMO MODE: Using demo attendance data for timetable ID:',
          timetableId
        );
        const demoData = getDemoTeacherAttendanceData(timetableId);

        if (demoData.success) {
          // Set students data with demo data
          const studentsWithDefaults = demoData.students.map((student) => ({
            ...student,
            student_id: student.student_id,
            student_name: student.student_name,
            student_photo: student.student_photo || null,
            roll_number: student.roll_number || student.student_id,
            classroom_name: student.classroom_name,
            // For new attendance, force 'present' status; for updates, keep existing or default to 'present'
            attendance_status: isUpdate
              ? student.attendance_status || 'present'
              : 'present',
          }));

          setStudents(studentsWithDefaults);

          // If this is new attendance (not update), enable submit since students have default 'present' status
          if (!isUpdate && studentsWithDefaults.length > 0) {
            setHasChanges(true);
          }

          // Set demo attendance summary
          const summary = {
            present_count: studentsWithDefaults.filter(
              (s) => s.attendance_status === 'present'
            ).length,
            late_count: studentsWithDefaults.filter(
              (s) => s.attendance_status === 'late'
            ).length,
            absent_count: studentsWithDefaults.filter(
              (s) => s.attendance_status === 'absent'
            ).length,
            not_taken_count: 0,
          };
          setAttendanceSummary(summary);
          setLoading(false);
          return;
        }
      }

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

        if (data.success) {
          // Set students data
          const studentsWithDefaults = data.students.map((student) => ({
            ...student,
            student_id: student.student_id,
            student_name: student.student_name,
            student_photo: student.student_photo || null,
            roll_number: student.roll_number || student.student_id,
            classroom_name: student.classroom_name,
            // For new attendance, force 'present' status; for updates, keep existing or default to 'present'
            attendance_status: isUpdate
              ? student.attendance_status || 'present'
              : 'present',
          }));

          setStudents(studentsWithDefaults);

          // If this is new attendance (not update), enable submit since students have default 'present' status
          if (!isUpdate && studentsWithDefaults.length > 0) {
            setHasChanges(true);
          }

          // Set attendance summary
          if (data.attendance_summary) {
            setAttendanceSummary(data.attendance_summary);
          }
        } else {
          Alert.alert(t('error'), t('failedToLoadAttendanceDetails'));
          loadStudents(); // Fallback
        }
      } else {
        Alert.alert(t('error'), t('failedToLoadAttendanceDetails'));
        loadStudents(); // Fallback
      }
    } catch (error) {
      Alert.alert(t('error'), t('networkErrorLoadingAttendance'));
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
                // Set default to 'present' for new attendance, keep existing for updates
                attendance_status: isUpdate
                  ? getRandomAttendanceStatus()
                  : 'present',
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

        // If this is new attendance (not update), enable submit since all students default to 'present'
        if (!isUpdate && studentsData.length > 0) {
          setHasChanges(true);
        }
      } else {
        Alert.alert(t('error'), t('failedToLoadStudentsData'));
      }
    } catch (error) {
      Alert.alert(t('error'), t('networkErrorLoadingStudents'));
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
        t('incompleteAttendance'),
        t('pleaseMarkAttendanceForAllStudents').replace(
          '{count}',
          unmarkedStudents.length
        ),
        [{ text: t('ok') }]
      );
      return;
    }

    try {
      setSubmitting(true);

      // Handle demo mode submission
      if (authCode && authCode.startsWith('DEMO_AUTH_')) {
        console.log('🎭 DEMO MODE: Simulating attendance submission');

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        Alert.alert(t('success'), t('attendanceSubmittedSuccessfullyDemo'), [
          {
            text: t('ok'),
            onPress: () => {
              // Call the callback if provided
              if (onAttendanceSubmitted) {
                onAttendanceSubmitted();
              }
              navigation.goBack();
            },
          },
        ]);
        setSubmitting(false);
        return;
      }

      // Format attendance data according to backend expectations
      // Format: studentId|attendanceStatus|attendanceNote
      const formattedAttendance = students
        .map((student) => `${student.student_id}|${student.attendance_status}|`)
        .join('/');

      // Prepare API request
      const endpoint = Config.API_ENDPOINTS.TAKE_ATTENDANCE;
      const url = buildApiUrl(endpoint, { authCode });

      const requestPayload = {
        auth_code: authCode,
        timetable: timetableId,
        attendance: formattedAttendance,
        topic: '', // Optional topic field
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      // Check if response is successful (200 status)
      if (response.status === 200) {
        // Get the raw response text first
        const responseText = await response.text();

        let result = null;

        // Try to parse JSON if there's content
        if (responseText && responseText.trim()) {
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            // For 200 status, even if JSON parsing fails, we can treat as success
          }
        }

        // For 200 status, treat as success regardless of response content
        // Some APIs return empty responses on successful operations
        const isSuccessful = !result || result.success !== false;

        if (isSuccessful) {
          // Fetch updated attendance details to refresh the state
          await fetchAttendanceDetails();

          // Call the callback to refresh the parent screen
          if (onAttendanceSubmitted) {
            onAttendanceSubmitted();
          }

          Alert.alert(
            t('success'),
            isUpdate
              ? t('attendanceUpdatedSuccessfully')
              : t('attendanceSubmittedSuccessfully'),
            [
              {
                text: t('ok'),
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } else {
          Alert.alert(
            t('error'),
            result?.message || t('failedToSubmitAttendance')
          );
        }
      } else {
        // Handle non-200 status codes
        const responseText = await response.text();

        let errorMessage = 'Failed to submit attendance';
        try {
          const result = JSON.parse(responseText);
          errorMessage = result.message || errorMessage;
        } catch (parseError) {
          // Use default error message if JSON parsing fails
          console.error('Error message:', errorMessage);
          errorMessage = `Server error (${
            response.status
          }): ${responseText.substring(0, 100)}`;
        }

        Alert.alert(t('error'), errorMessage);
      }
    } catch (error) {
      console.error('Submit attendance error:', error);
      Alert.alert(
        t('error'),
        t('networkError') + `: ${error.message || t('unknownError')}`
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

            <Text style={styles.headerTitle}>
              {isUpdate ? t('updateAttendance') : t('takeAttendance')}
            </Text>

            <View style={styles.headerRight} />
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('loadingStudents')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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

          <Text style={styles.headerTitle}>
            {isUpdate ? t('updateAttendance') : t('takeAttendance')}
          </Text>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSubmitAttendance}
            disabled={submitting || !hasChanges}
          >
            <FontAwesomeIcon
              icon={isUpdate ? faEdit : faSave}
              size={18}
              color={hasChanges ? '#fff' : 'rgba(255, 255, 255, 0.5)'}
            />
          </TouchableOpacity>
        </View>

        {/* Class Info & Attendance Summary Subheader */}
        <View style={styles.subHeader}>
          <View style={styles.classInfoSection}>
            <Text style={styles.compactSubjectName}>{gradeName}</Text>
            <Text style={styles.compactDateText}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.compactSummarySection}>
            <View style={styles.compactStatItem}>
              <Text style={styles.compactStatNumber}>{summary.total}</Text>
              <Text style={styles.compactStatLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.compactStatItem}>
              <Text
                style={[
                  styles.compactStatNumber,
                  { color: theme.colors.success },
                ]}
              >
                {summary.present}
              </Text>
              <Text style={styles.compactStatLabel}>Present</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.compactStatItem}>
              <Text
                style={[
                  styles.compactStatNumber,
                  { color: theme.colors.warning },
                ]}
              >
                {summary.late}
              </Text>
              <Text style={styles.compactStatLabel}>Late</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.compactStatItem}>
              <Text
                style={[
                  styles.compactStatNumber,
                  { color: theme.colors.error },
                ]}
              >
                {summary.absent}
              </Text>
              <Text style={styles.compactStatLabel}>Absent</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Students List */}
        <View style={styles.studentsContainer}>
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
                    Roll: {student.roll_number} | Status:{' '}
                    {student.attendance_status || 'none'}
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
                      styles.selectedPresentButton,
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
                    {t('present')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.attendanceButton,
                    styles.lateButton,
                    student.attendance_status === 'late' &&
                      styles.selectedLateButton,
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
                    {t('late')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.attendanceButton,
                    styles.absentButton,
                    student.attendance_status === 'absent' &&
                      styles.selectedAbsentButton,
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
                    {t('absent')}
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
                {isUpdate ? t('updateAttendance') : t('submitAttendance')}
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
    subHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 16,
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
      flex: 1,
      textAlign: 'center',
    },
    headerRight: {
      width: 36,
    },
    saveButton: {
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
    // Compact Info Container - Fixed at top
    compactInfoContainer: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      borderRadius: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      overflow: 'hidden',
      zIndex: 1,
    },
    classInfoSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    compactSubjectName: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
    },
    compactDateText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    compactSummarySection: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    compactStatItem: {
      flex: 1,
      alignItems: 'center',
    },
    compactStatNumber: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 2,
    },
    compactStatLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statDivider: {
      width: 1,
      height: 32,
      backgroundColor: theme.colors.border,
      marginHorizontal: 8,
    },
    // Legacy styles (keeping for compatibility)
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
      marginTop: 8, // Reduced top margin since header is fixed
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
    selectedPresentButton: {
      backgroundColor: theme.colors.success,
      borderColor: theme.colors.success,
    },
    selectedLateButton: {
      backgroundColor: theme.colors.warning,
      borderColor: theme.colors.warning,
    },
    selectedAbsentButton: {
      backgroundColor: theme.colors.error,
      borderColor: theme.colors.error,
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
