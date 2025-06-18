import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faUser,
  faClipboardList,
  faExclamationTriangle,
  faStar,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Config, buildApiUrl } from '../config/env';

export default function HomeroomDisciplineScreen({ route, navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { authCode, classroomData } = route.params || {};

  const [disciplineData, setDisciplineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedStudents, setExpandedStudents] = useState(new Set());

  useEffect(() => {
    loadDisciplineData();
  }, []);

  const loadDisciplineData = async () => {
    if (!authCode || !classroomData?.classroom_id) {
      setError('Missing required data');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const url = buildApiUrl(Config.API_ENDPOINTS.GET_HOMEROOM_DISCIPLINE, {
        classroom_id: classroomData.classroom_id,
        start_date: startDate,
        end_date: endDate,
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
          setDisciplineData(data.data);
        } else {
          setError('Failed to load discipline data');
        }
      } else {
        setError(`Failed to load discipline data: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading discipline data:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDisciplineData();
  };

  const toggleStudentExpansion = (studentId) => {
    setExpandedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const renderRecordItem = (record, index) => (
    <View key={`${record.date}-${index}`} style={styles.recordItem}>
      <View style={styles.recordHeader}>
        <View
          style={[
            styles.recordIcon,
            {
              backgroundColor:
                record.item_type === 'dps' ? '#FF3B3015' : '#34C75915',
            },
          ]}
        >
          <FontAwesomeIcon
            icon={record.item_type === 'dps' ? faExclamationTriangle : faStar}
            size={16}
            color={record.item_type === 'dps' ? '#FF3B30' : '#34C759'}
          />
        </View>
        <View style={styles.recordInfo}>
          <Text style={styles.recordTitle}>{record.item_title}</Text>
          <Text style={styles.recordDate}>{record.date}</Text>
        </View>
        <View style={styles.recordPoints}>
          <Text
            style={[
              styles.pointsText,
              { color: record.item_type === 'dps' ? '#FF3B30' : '#34C759' },
            ]}
          >
            {record.item_point > 0 ? '+' : ''}
            {record.item_point}
          </Text>
        </View>
      </View>
      {record.note && <Text style={styles.recordNote}>{record.note}</Text>}
    </View>
  );

  const renderStudentCard = (student) => {
    const isExpanded = expandedStudents.has(student.student_id);
    const hasRecords =
      student.all_records && student.all_records.length > 0;

    return (
      <View key={student.student_id} style={styles.studentCard}>
        <TouchableOpacity
          style={styles.studentHeader}
          onPress={() => toggleStudentExpansion(student.student_id)}
          disabled={!hasRecords}
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
                size={20}
                color={theme.colors.primary}
              />
            )}
          </View>

          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{student.name}</Text>
            <View style={styles.pointsRow}>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsLabel}>DPS:</Text>
                <Text style={[styles.pointsValue, { color: '#FF3B30' }]}>
                  {student.dps_points}
                </Text>
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsLabel}>PRS:</Text>
                <Text style={[styles.pointsValue, { color: '#34C759' }]}>
                  {student.prs_points}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.recordCount}>
            <Text style={styles.recordCountText}>{student.total_records}</Text>
            <Text style={styles.recordCountLabel}>Records</Text>
          </View>

          {hasRecords && (
            <View style={styles.expandIcon}>
              <FontAwesomeIcon
                icon={isExpanded ? faChevronUp : faChevronDown}
                size={16}
                color={theme.colors.textSecondary}
              />
            </View>
          )}
        </TouchableOpacity>

        {hasRecords && isExpanded && (
          <View style={styles.recentRecords}>
            <Text style={styles.recentRecordsTitle}>Recent Records</Text>
            {student.all_records.map(renderRecordItem)}
          </View>
        )}

        {!hasRecords && (
          <View style={styles.noRecordsContainer}>
            <Text style={styles.noRecordsText}>No discipline records</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discipline Records</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading discipline data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discipline Records</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadDisciplineData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discipline Records</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Fixed Summary Card */}
      {disciplineData && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <FontAwesomeIcon
              icon={faClipboardList}
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.summaryTitle}>
              {classroomData.classroom_name} - Last 30 Days
            </Text>
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {disciplineData.summary.total_records}
              </Text>
              <Text style={styles.statLabel}>Total Records</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#FF3B30' }]}>
                {disciplineData.summary.total_dps_points}
              </Text>
              <Text style={styles.statLabel}>DPS Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#34C759' }]}>
                {disciplineData.summary.total_prs_points}
              </Text>
              <Text style={styles.statLabel}>PRS Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {disciplineData.summary.students_with_records}
              </Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
          </View>

          <Text style={styles.dateRange}>
            {disciplineData.date_range.start_date} to{' '}
            {disciplineData.date_range.end_date}
          </Text>
        </View>
      )}

      {/* Scrollable Students List */}
      <ScrollView
        style={styles.studentsScrollView}
        contentContainerStyle={styles.studentsContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={true}
      >
        {disciplineData?.students?.map(renderStudentCard)}

        {(!disciplineData?.students ||
          disciplineData.students.length === 0) && (
          <View style={styles.emptyContainer}>
            <FontAwesomeIcon
              icon={faClipboardList}
              size={48}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyText}>No discipline records found</Text>
            <Text style={styles.emptySubtext}>
              This class has no discipline records in the last 30 days
            </Text>
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.headerBackground,
      paddingHorizontal: 16,
      paddingVertical: 12,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
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
    summaryCard: {
      backgroundColor: theme.colors.surface,
      margin: 16,
      marginBottom: 8,
      borderRadius: 12,
      padding: 20,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    studentsScrollView: {
      marginTop: 15,
      flex: 1,
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 8,
    },
    summaryStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
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
      textAlign: 'center',
    },
    dateRange: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    studentsContainer: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    studentCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 16,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
    },
    studentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    studentAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
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
    pointsRow: {
      flexDirection: 'row',
    },
    pointsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    pointsLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginRight: 4,
    },
    pointsValue: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    recordCount: {
      alignItems: 'center',
    },
    recordCountText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    recordCountLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
    },
    expandIcon: {
      marginLeft: 8,
      padding: 4,
    },
    noRecordsContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    noRecordsText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    recentRecords: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 12,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    recentRecordsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    recordItem: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    recordHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    recordIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    recordInfo: {
      flex: 1,
    },
    recordTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 2,
    },
    recordDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    recordPoints: {
      alignItems: 'center',
    },
    pointsText: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    recordNote: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 8,
      marginLeft: 44,
      fontStyle: 'italic',
    },
    emptyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      marginTop: 40,
      minHeight: 200,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
