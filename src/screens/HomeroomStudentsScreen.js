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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faUser,
  faPhone,
  faBirthdayCake,
  faVenusMars,
  faUserMd,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Config, buildApiUrl } from '../config/env';

export default function HomeroomStudentsScreen({ route, navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { authCode, classroomData } = route.params || {};

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    if (!authCode || !classroomData?.classroom_id) {
      setError('Missing required data');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = buildApiUrl(Config.API_ENDPOINTS.GET_HOMEROOM_STUDENTS, {
        classroom_id: classroomData.classroom_id,
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
        console.log('Students API response:', JSON.stringify(data, null, 2));
        if (data.success) {
          // Handle different possible data structures
          let studentsArray = [];
          if (Array.isArray(data.data)) {
            studentsArray = data.data;
          } else if (data.data && Array.isArray(data.data.students)) {
            studentsArray = data.data.students;
          } else if (
            data.data &&
            data.data.data &&
            Array.isArray(data.data.data)
          ) {
            studentsArray = data.data.data;
          } else {
            console.log('Unexpected data structure:', data.data);
            studentsArray = [];
          }
          console.log('Setting students array:', studentsArray);
          setStudents(studentsArray);
        } else {
          setError('Failed to load students');
        }
      } else {
        setError(`Failed to load students: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  const viewStudentProfile = async (studentId) => {
    try {
      const url = buildApiUrl(
        Config.API_ENDPOINTS.GET_HOMEROOM_STUDENT_PROFILE,
        {
          auth_code: authCode,
          student_id: studentId,
        }
      );

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(
          'Student profile API response:',
          JSON.stringify(data, null, 2)
        );
        if (data.success) {
          console.log('Navigating to profile with data:', data.data);
          navigation.navigate('HomeroomStudentProfile', {
            studentData: data.data,
            authCode,
          });
        } else {
          console.log('API returned success: false', data.message);
          Alert.alert(
            'Error',
            data.message || 'Failed to load student profile'
          );
        }
      } else {
        console.log('HTTP error:', response.status, response.statusText);
        Alert.alert(
          'Error',
          `Failed to load student profile: ${response.status}`
        );
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
      Alert.alert('Error', 'Failed to connect to server');
    }
  };

  const renderStudentCard = (student) => (
    <TouchableOpacity
      key={student.student_id}
      style={styles.studentCard}
      onPress={() => viewStudentProfile(student.student_id)}
    >
      <View style={styles.studentAvatar}>
        {student.photo ? (
          <Image
            source={{ uri: student.photo }}
            style={styles.avatarImage}
            resizeMode='cover'
          />
        ) : (
          <FontAwesomeIcon
            icon={faUser}
            size={24}
            color={theme.colors.primary}
          />
        )}
      </View>

      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{student.name}</Text>

        <View style={styles.studentDetails}>
          <View style={styles.detailRow}>
            <FontAwesomeIcon
              icon={faVenusMars}
              size={12}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.detailText}>{student.gender}</Text>
          </View>

          {student.birth_date && (
            <View style={styles.detailRow}>
              <FontAwesomeIcon
                icon={faBirthdayCake}
                size={12}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.detailText}>{student.birth_date}</Text>
            </View>
          )}
        </View>

        {student.parent_name && (
          <View style={styles.parentInfo}>
            <Text style={styles.parentLabel}>Parent:</Text>
            <Text style={styles.parentName}>{student.parent_name}</Text>
          </View>
        )}

        {student.parent_phone && (
          <View style={styles.contactInfo}>
            <FontAwesomeIcon
              icon={faPhone}
              size={12}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.contactText}>{student.parent_phone}</Text>
          </View>
        )}

        {student.medical_conditions && (
          <View style={styles.medicalInfo}>
            <FontAwesomeIcon icon={faUserMd} size={12} color='#FF9500' />
            <Text style={styles.medicalText}>{student.medical_conditions}</Text>
          </View>
        )}
      </View>

      <View style={styles.chevron}>
        <Text style={styles.chevronText}>›</Text>
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
          <Text style={styles.headerTitle}>Students</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading students...</Text>
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
          <Text style={styles.headerTitle}>Students</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStudents}>
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
        <Text style={styles.headerTitle}>
          Students ({Array.isArray(students) ? students.length : 0})
        </Text>
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
        {classroomData && (
          <View style={styles.classroomInfo}>
            <Text style={styles.classroomName}>
              {classroomData.classroom_name}
            </Text>
            <Text style={styles.classroomStats}>
              {classroomData.total_students} students •{' '}
              {classroomData.male_students} male •{' '}
              {classroomData.female_students} female
            </Text>
          </View>
        )}

        <View style={styles.studentsContainer}>
          {Array.isArray(students) ? (
            students.map(renderStudentCard)
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                Invalid students data format. Expected array, got:{' '}
                {typeof students}
              </Text>
              <Text style={styles.errorText}>
                Data: {JSON.stringify(students, null, 2)}
              </Text>
            </View>
          )}
        </View>

        {Array.isArray(students) && students.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        )}
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
    classroomInfo: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      margin: 16,
      borderRadius: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
    },
    classroomName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    classroomStats: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    studentsContainer: {
      paddingHorizontal: 16,
    },
    studentCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
    },
    studentAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    avatarImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    studentInfo: {
      flex: 1,
    },
    studentName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 6,
    },
    studentDetails: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    detailText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: 4,
    },
    parentInfo: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    parentLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginRight: 4,
    },
    parentName: {
      fontSize: 12,
      color: theme.colors.text,
      fontWeight: '500',
    },
    contactInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    contactText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: 4,
    },
    medicalInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    medicalText: {
      fontSize: 12,
      color: '#FF9500',
      marginLeft: 4,
      fontWeight: '500',
    },
    chevron: {
      marginLeft: 8,
    },
    chevronText: {
      fontSize: 20,
      color: theme.colors.textSecondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
