import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faUser,
  faCheckCircle,
  faClock,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Config, buildApiUrl } from '../config/env';

export default function HomeroomAttendanceDetailsScreen({ route, navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { authCode, classroomData, attendanceData: initialAttendanceData } = route.params || {};

  const [attendanceData, setAttendanceData] = useState(initialAttendanceData);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAttendanceDetails = async () => {
    if (!classroomData?.classroom_id) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const url = buildApiUrl(Config.API_ENDPOINTS.GET_HOMEROOM_ATTENDANCE, {
        auth_code: authCode,
        classroom_id: classroomData.classroom_id,
        date: today,
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
          setAttendanceData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendanceDetails();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return '#34C759';
      case 'late':
        return '#FF9500';
      case 'absent':
        return '#FF3B30';
      case 'not_marked':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return faCheckCircle;
      case 'late':
        return faClock;
      case 'absent':
        return faTimesCircle;
      case 'not_marked':
        return faUser;
      default:
        return faUser;
    }
  };

  const renderStudentCard = (student) => {
    const statusColor = getStatusColor(student.attendance_status);
    const statusIcon = getStatusIcon(student.attendance_status);

    return (
      <View key={student.student_id} style={styles.studentCard}>
        <View style={styles.studentInfo}>
          <View style={styles.studentAvatar}>
            {student.photo ? (
              <Image
                source={{ uri: student.photo }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <FontAwesomeIcon
                icon={faUser}
                size={20}
                color={theme.colors.primary}
              />
            )}
          </View>
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.studentClass}>{attendanceData.classroom.classroom_name}</Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <FontAwesomeIcon
            icon={statusIcon}
            size={14}
            color="#fff"
          />
          <Text style={styles.statusText}>
            {student.attendance_status === 'not_marked' 
              ? 'Not Marked' 
              : student.attendance_status?.charAt(0).toUpperCase() + student.attendance_status?.slice(1)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Details</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Summary */}
      {attendanceData?.summary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <View style={styles.summaryStats}>
            <View style={[styles.summaryCard, { backgroundColor: '#34C759' }]}>
              <Text style={styles.summaryNumber}>{attendanceData.summary.present}</Text>
              <Text style={styles.summaryLabel}>Present</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#FF9500' }]}>
              <Text style={styles.summaryNumber}>{attendanceData.summary.late}</Text>
              <Text style={styles.summaryLabel}>Late</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#FF3B30' }]}>
              <Text style={styles.summaryNumber}>{attendanceData.summary.absent}</Text>
              <Text style={styles.summaryLabel}>Absent</Text>
            </View>
          </View>
          <Text style={styles.attendanceRate}>
            Attendance Rate: {attendanceData.summary.attendance_rate}%
          </Text>
        </View>
      )}

      {/* Students List */}
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
          <Text style={styles.sectionTitle}>Students ({attendanceData?.students?.length || 0})</Text>
          {attendanceData?.students?.map(renderStudentCard)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    justifyContent: 'space-between',
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 36,
  },
  summaryContainer: {
    backgroundColor: theme.colors.surface,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    ...theme.shadows.small,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  summaryCard: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 60,
  },
  summaryNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 2,
  },
  attendanceRate: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  studentsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.small,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  studentClass: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
