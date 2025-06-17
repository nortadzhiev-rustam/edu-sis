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
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { buildApiUrl } from '../config/env';

export default function TeacherHomeworkScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { authCode, teacherName } = route.params || {};

  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = createStyles(theme);

  useEffect(() => {
    if (authCode) {
      fetchHomeworkList();
    }
  }, [authCode]);

  const fetchHomeworkList = async () => {
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

    return (
      <TouchableOpacity
        key={homework.homework_id}
        style={styles.homeworkCard}
        onPress={() =>
          navigation.navigate('TeacherHomeworkDetail', {
            homeworkId: homework.homework_id,
            authCode,
            teacherName,
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <Text style={styles.homeworkTitle}>{homework.title}</Text>
            <Text style={styles.subjectInfo}>
              {homework.subject_name} • {homework.grade_name}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <FontAwesomeIcon icon={statusIcon} size={16} color='#fff' />
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Homework Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            navigation.navigate('TeacherHomeworkCreate', {
              authCode,
              teacherName,
            })
          }
        >
          <FontAwesomeIcon icon={faPlus} size={18} color='#fff' />
        </TouchableOpacity>
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
              <Text style={styles.sectionTitle}>
                Homework Assignments ({homeworkList.length})
              </Text>
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
      padding: 20,
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
