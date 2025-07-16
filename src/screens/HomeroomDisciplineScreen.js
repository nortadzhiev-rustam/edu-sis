import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        // start_date: startDate,
        // end_date: endDate,
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
          <Text style={styles.recordDate}>
            Teacher: {record.teacher_name} • Date: {record.date}
          </Text>
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
    const hasRecords = student.all_records && student.all_records.length > 0;

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

            <Text style={styles.headerTitle}>Discipline Records</Text>

            <View style={styles.headerRight} />
          </View>

          {/* Subheader with classroom info */}
          {classroomData && (
            <View style={styles.subHeader}>
              <View style={styles.classroomInfoSection}>
                <View style={styles.compactIconContainer}>
                  <FontAwesomeIcon
                    icon={faClipboardList}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.compactTitleContainer}>
                  <Text style={styles.compactClassroomTitle}>
                    {classroomData.classroom_name}
                  </Text>
                  <Text style={styles.compactClassroomSubtitle}>
                    Discipline Records - Last 30 Days
                  </Text>
                </View>
              </View>
            </View>
          )}
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

            <Text style={styles.headerTitle}>Discipline Records</Text>

            <View style={styles.headerRight} />
          </View>

          {/* Subheader with classroom info */}
          {classroomData && (
            <View style={styles.subHeader}>
              <View style={styles.classroomInfoSection}>
                <View style={styles.compactIconContainer}>
                  <FontAwesomeIcon
                    icon={faClipboardList}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.compactTitleContainer}>
                  <Text style={styles.compactClassroomTitle}>
                    {classroomData.classroom_name}
                  </Text>
                  <Text style={styles.compactClassroomSubtitle}>
                    Discipline Records - Last 30 Days
                  </Text>
                </View>
              </View>
            </View>
          )}
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

          <Text style={styles.headerTitle}>Discipline Records</Text>

          <View style={styles.headerRight} />
        </View>

        {/* Subheader with classroom info */}
        {classroomData && (
          <View style={styles.subHeader}>
            <View style={styles.classroomInfoSection}>
              <View style={styles.compactIconContainer}>
                <FontAwesomeIcon
                  icon={faClipboardList}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.compactTitleContainer}>
                <Text style={styles.compactClassroomTitle}>
                  {classroomData.classroom_name}
                </Text>
                <Text style={styles.compactClassroomSubtitle}>
                  Discipline Records - Last 30 Days
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Stats section */}
        {disciplineData && (
          <View style={styles.compactStatsContainer}>
            <View style={styles.compactStatItem}>
              <FontAwesomeIcon
                icon={faClipboardList}
                size={16}
                color='#007AFF'
              />
              <Text style={styles.compactStatNumber}>
                {disciplineData.summary.total_records}
              </Text>
              <Text style={styles.compactStatLabel}>Total</Text>
            </View>

            <View style={styles.compactStatDivider} />

            <View style={styles.compactStatItem}>
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                size={16}
                color='#FF3B30'
              />
              <Text style={[styles.compactStatNumber, { color: '#FF3B30' }]}>
                {disciplineData.summary.total_dps_points}
              </Text>
              <Text style={styles.compactStatLabel}>DPS</Text>
            </View>

            <View style={styles.compactStatDivider} />

            <View style={styles.compactStatItem}>
              <FontAwesomeIcon icon={faStar} size={16} color='#34C759' />
              <Text style={[styles.compactStatNumber, { color: '#34C759' }]}>
                {disciplineData.summary.total_prs_points}
              </Text>
              <Text style={styles.compactStatLabel}>PRS</Text>
            </View>

            <View style={styles.compactStatDivider} />

            <View style={styles.compactStatItem}>
              <FontAwesomeIcon icon={faUser} size={16} color='#FF9500' />
              <Text style={styles.compactStatNumber}>
                {disciplineData.summary.students_with_records}
              </Text>
              <Text style={styles.compactStatLabel}>Students</Text>
            </View>
          </View>
        )}
      </View>

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
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    subHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    classroomInfoSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    // Legacy header style (keeping for compatibility)
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

    compactIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0, 122, 255, 0.2)',
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
      color: theme.colors.text,
    },
    compactClassroomSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    compactStatsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
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
    studentsScrollView: {
      flex: 1,
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
