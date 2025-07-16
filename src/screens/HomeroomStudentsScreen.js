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
  faUserGraduate,
  faUsers,
  faMars,
  faVenus,
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
        if (data.success) {
          // Handle different possible data structures
          let studentsArray = [];
          if (Array.isArray(data.data)) {
            studentsArray = data.data;
          } else if (data.data && Array.isArray(data.data.students)) {
            studentsArray = data.data.students;
          } else if (data?.data?.data && Array.isArray(data.data.data)) {
            studentsArray = data.data.data;
          } else {
            studentsArray = [];
          }
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
        if (data.success) {
          navigation.navigate('HomeroomStudentProfile', {
            studentData: data.data,
            authCode,
          });
        } else {
          Alert.alert(
            'Error',
            data.message || 'Failed to load student profile'
          );
        }
      } else {
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

      {/* Fixed Compact Classroom Overview */}
      {classroomData && (
        <View style={styles.compactOverviewCard}>
          <View style={styles.compactHeader}>
            <View style={styles.compactIconContainer}>
              <FontAwesomeIcon icon={faUserGraduate} size={20} color='#fff' />
            </View>
            <View style={styles.compactTitleContainer}>
              <Text style={styles.compactClassroomTitle}>
                {classroomData.classroom_name}
              </Text>
              <Text style={styles.compactClassroomSubtitle}>
                Homeroom Class
              </Text>
            </View>
          </View>

          <View style={styles.compactStatsContainer}>
            <View style={styles.compactStatItem}>
              <FontAwesomeIcon icon={faUsers} size={16} color='#007AFF' />
              <Text style={styles.compactStatNumber}>
                {classroomData.total_students}
              </Text>
              <Text style={styles.compactStatLabel}>Total</Text>
            </View>

            <View style={styles.compactStatDivider} />

            <View style={styles.compactStatItem}>
              <FontAwesomeIcon icon={faMars} size={16} color='#34C759' />
              <Text style={styles.compactStatNumber}>
                {classroomData.male_students}
              </Text>
              <Text style={styles.compactStatLabel}>Male</Text>
            </View>

            <View style={styles.compactStatDivider} />

            <View style={styles.compactStatItem}>
              <FontAwesomeIcon icon={faVenus} size={16} color='#FF9F0A' />
              <Text style={styles.compactStatNumber}>
                {classroomData.female_students}
              </Text>
              <Text style={styles.compactStatLabel}>Female</Text>
            </View>
          </View>
        </View>
      )}

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
      marginHorizontal: 16,
      borderRadius: 16,
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
    // Compact Overview Card Styles - Fixed at top
    compactOverviewCard: {
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
    compactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    compactIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    compactTitleContainer: {
      flex: 1,
    },
    compactClassroomTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
    },
    compactClassroomSubtitle: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 2,
    },
    compactStatsContainer: {
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
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 4,
      marginBottom: 2,
    },
    compactStatLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    compactStatDivider: {
      width: 1,
      height: 32,
      backgroundColor: theme.colors.border,
      marginHorizontal: 8,
    },
    // Legacy styles (keeping for compatibility)
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
      paddingTop: 8, // Reduced top padding since header is fixed
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
