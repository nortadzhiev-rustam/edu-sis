import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faPlus,
  faClipboardList,
  faUsers,
  faCheckCircle,
  faClock,
  faChevronRight,
  faCalendarAlt,
  faExclamationTriangle,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { buildApiUrl } from '../config/env';
import { getDemoTeacherHomeworkData } from '../services/demoModeService';
import { getResponsiveHeaderFontSize } from '../utils/commonStyles';

export default function TeacherHomeworkScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { authCode, teacherName, selectedBranchId } = route.params || {};

  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const styles = createStyles(theme);

  useEffect(() => {
    if (authCode) {
      fetchHomeworkList();
    }
  }, [authCode]);

  const fetchHomeworkList = async () => {
    // Check if this is a demo authCode
    if (authCode && authCode.startsWith('DEMO_AUTH_')) {
      console.log('🎭 DEMO MODE: Using demo teacher homework data');
      const demoData = getDemoTeacherHomeworkData();
      setHomeworkList(demoData.data || []);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await fetch(
        buildApiUrl(`/teacher/homework/list?auth_code=${authCode}`),
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHomeworkList(data.data || []);
        } else {
          Alert.alert('Error', 'Failed to fetch homework list');
        }
      } else {
        Alert.alert('Error', `Failed to fetch homework: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching homework list:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeworkList();
  };

  // Close homework function
  const closeHomework = async (homeworkId) => {
    try {
      setDeleting(true);

      const requestBody = {
        auth_code: authCode,
        homework_id: homeworkId,
      };

      const response = await fetch(buildApiUrl('/teacher/homework/close'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Remove closed homework from the list
          setHomeworkList((prev) =>
            prev.filter((item) => item.homework_id !== homeworkId)
          );

          Alert.alert('Success', 'Homework assignment closed successfully');
        } else {
          Alert.alert('Error', data.message || 'Failed to close homework');
        }
      } else {
        Alert.alert('Error', `Failed to close homework: ${response.status}`);
      }
    } catch (error) {
      console.error('Error closing homework:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setDeleting(false);
    }
  };

  const confirmSingleClose = (homework) => {
    Alert.alert(
      'Close Homework',
      `Are you sure you want to close "${homework.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: () => closeHomework(homework.homework_id),
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#34C759';
      case 'expired':
        return '#FF3B30';
      case 'draft':
        return '#FF9500';
      default:
        return '#007AFF';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return faCheckCircle;
      case 'expired':
        return faExclamationTriangle;
      case 'draft':
        return faClock;
      default:
        return faClipboardList;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHomeworkCard = (homework) => {
    const statusColor = getStatusColor(homework.status);
    const statusIcon = getStatusIcon(homework.status);
    const submissionRate = homework.statistics?.submission_rate || 0;

    const handleCardPress = () => {
      navigation.navigate('TeacherHomeworkDetail', {
        homeworkId: homework.homework_id,
        authCode,
        teacherName,
      });
    };

    return (
      <TouchableOpacity
        key={homework.homework_id}
        style={styles.homeworkCard}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <Text style={styles.homeworkTitle}>{homework.title}</Text>
            <Text style={styles.subjectInfo}>
              {homework.subject_name} • {homework.grade_name}
            </Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => confirmSingleClose(homework)}
            >
              <FontAwesomeIcon icon={faTimes} size={14} color='#fff' />
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <FontAwesomeIcon icon={statusIcon} size={16} color='#fff' />
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.deadlineInfo}>
            <FontAwesomeIcon
              icon={faCalendarAlt}
              size={14}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.deadlineText}>
              Due: {formatDate(homework.deadline)}
            </Text>
          </View>

          <View style={styles.statisticsRow}>
            <View style={styles.statItem}>
              <FontAwesomeIcon
                icon={faUsers}
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.statText}>
                {homework.statistics?.total_students || 0} students
              </Text>
            </View>

            <View style={styles.statItem}>
              <FontAwesomeIcon
                icon={faCheckCircle}
                size={14}
                color={theme.colors.success}
              />
              <Text style={styles.statText}>
                {homework.statistics?.submitted_count || 0} submitted
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${submissionRate}%`,
                    backgroundColor:
                      submissionRate > 70
                        ? '#34C759'
                        : submissionRate > 40
                        ? '#FF9500'
                        : '#FF3B30',
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {submissionRate.toFixed(0)}% submitted
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.statusText}>{homework.status.toUpperCase()}</Text>
          <FontAwesomeIcon
            icon={faChevronRight}
            size={14}
            color={theme.colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesomeIcon icon={faClipboardList} size={64} color='#ccc' />
      <Text style={styles.emptyTitle}>No Homework Assignments</Text>
      <Text style={styles.emptySubtitle}>
        Create your first homework assignment to get started
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() =>
          navigation.navigate('TeacherHomeworkCreate', {
            authCode,
            teacherName,
            selectedBranchId,
          })
        }
      >
        <FontAwesomeIcon icon={faPlus} size={16} color='#fff' />
        <Text style={styles.createButtonText}>Create Homework</Text>
      </TouchableOpacity>
    </View>
  );

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

          <Text
            style={[
              styles.headerTitle,
              { fontSize: getResponsiveHeaderFontSize(2, 'Homework') },
            ]}
          >
            Homework
          </Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              navigation.navigate('TeacherHomeworkCreate', {
                authCode,
                teacherName,
                selectedBranchId,
              })
            }
          >
            <FontAwesomeIcon icon={faPlus} size={18} color='#fff' />
          </TouchableOpacity>
        </View>

        {/* Homework Overview Subheader */}
        {!loading && homeworkList.length > 0 && (
          <View style={styles.subHeader}>
            <View style={styles.overviewItem}>
              <FontAwesomeIcon
                icon={faClipboardList}
                size={16}
                color='#007AFF'
              />
              <Text style={styles.overviewNumber}>{homeworkList.length}</Text>
              <Text style={styles.overviewLabel}>Total</Text>
            </View>

            <View style={styles.overviewDivider} />

            <View style={styles.overviewItem}>
              <FontAwesomeIcon icon={faCheckCircle} size={16} color='#34C759' />
              <Text style={styles.overviewNumber}>
                {homeworkList.filter((hw) => hw.status === 'active').length}
              </Text>
              <Text style={styles.overviewLabel}>Active</Text>
            </View>

            <View style={styles.overviewDivider} />

            <View style={styles.overviewItem}>
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                size={16}
                color='#FF3B30'
              />
              <Text style={styles.overviewNumber}>
                {homeworkList.filter((hw) => hw.status === 'expired').length}
              </Text>
              <Text style={styles.overviewLabel}>Expired</Text>
            </View>

            <View style={styles.overviewDivider} />

            <View style={styles.overviewItem}>
              <FontAwesomeIcon icon={faClock} size={16} color='#FF9500' />
              <Text style={styles.overviewNumber}>
                {homeworkList.filter((hw) => hw.status === 'draft').length}
              </Text>
              <Text style={styles.overviewLabel}>Draft</Text>
            </View>
          </View>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#007AFF' />
          <Text style={styles.loadingText}>
            Loading homework assignments...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor='#007AFF'
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {homeworkList.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.homeworkList}>
              {homeworkList.map(renderHomeworkCard)}
            </View>
          )}
        </ScrollView>
      )}
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
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    overviewItem: {
      flex: 1,
      alignItems: 'center',
    },
    overviewNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 4,
      marginBottom: 2,
    },
    overviewLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    overviewDivider: {
      width: 1,
      height: 32,
      backgroundColor: theme.colors.border,
      marginHorizontal: 8,
    },
    // Legacy header style (keeping for compatibility)
    header: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
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
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 8, // Reduced top padding since header is compact
      paddingBottom: 20,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
    },
    homeworkList: {
      flex: 1,
    },

    // Homework Card Styles
    homeworkCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 15,
      ...theme.shadows.medium,
    },

    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    closeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: '#FF3B30',
      marginRight: 8,
      gap: 4,
    },
    closeButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 15,
    },
    cardLeft: {
      flex: 1,
      marginRight: 15,
    },
    homeworkTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    subjectInfo: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    statusBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardBody: {
      marginBottom: 15,
    },
    deadlineInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    deadlineText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 8,
    },
    statisticsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    statText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 6,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    progressBar: {
      flex: 1,
      height: 6,
      backgroundColor: theme.colors.border,
      borderRadius: 3,
      marginRight: 12,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },

    // Empty State Styles
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 20,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 30,
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 25,
      ...theme.shadows.small,
    },
    createButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });
