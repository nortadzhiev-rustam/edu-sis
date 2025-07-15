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
  Image,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faUser,
  faCalendarAlt,
  faComment,
  faFileAlt,
  faPaperPlane,
  faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { buildApiUrl } from '../config/env';
import { processHtmlContent } from '../utils/htmlUtils';

export default function TeacherHomeworkDetailScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { homeworkId, authCode } = route.params || {};

  const [homeworkDetail, setHomeworkDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const styles = createStyles(theme);

  useEffect(() => {
    if (authCode && homeworkId) {
      fetchHomeworkDetail();
    }
  }, [authCode, homeworkId]);

  const fetchHomeworkDetail = async () => {
    try {
      const response = await fetch(
        buildApiUrl(
          `/teacher/homework/details?auth_code=${authCode}&homework_id=${homeworkId}`
        ),
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
          setHomeworkDetail(data.data);
        } else {
          Alert.alert('Error', 'Failed to fetch homework details');
        }
      } else {
        Alert.alert('Error', `Failed to fetch homework: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching homework detail:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeworkDetail();
  };

  const submitFeedback = async (detailId) => {
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter feedback comment');
      return;
    }

    setSubmittingFeedback(true);
    try {
      const response = await fetch(buildApiUrl('/teacher/homework/feedback'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          auth_code: authCode,
          detail_id: detailId,
          comment: feedbackText.trim(),
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Feedback submitted successfully!');
        setFeedbackText('');
        setSelectedSubmission(null);
        fetchHomeworkDetail(); // Refresh data
      } else {
        Alert.alert('Error', 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSubmissionStatusColor = (submission) => {
    if (!submission.is_completed) return '#FF3B30'; // Not submitted
    if (submission.needs_review) return '#FF9500'; // Needs review
    if (submission.teacher_comment) return '#34C759'; // Reviewed
    return '#007AFF'; // Submitted
  };

  const getSubmissionStatusText = (submission) => {
    if (!submission.is_completed) return 'Not Submitted';
    if (submission.needs_review) return 'Needs Review';
    if (submission.teacher_comment) return 'Reviewed';
    return 'Submitted';
  };

  const navigateToStudentDetail = (submission) => {
    navigation.navigate('StudentHomeworkDetail', {
      submission,
      homeworkTitle: homeworkDetail?.homework?.title || 'Homework',
    });
  };

  const openFileLink = (url) => {
    if (!url) return;

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open file link');
    });
  };

  const renderSubmissionCard = (submission) => {
    const statusColor = getSubmissionStatusColor(submission);
    const statusText = getSubmissionStatusText(submission);

    return (
      <TouchableOpacity
        key={submission.detail_id}
        style={styles.submissionCard}
        onPress={() => navigateToStudentDetail(submission)}
        activeOpacity={0.7}
      >
        <View style={styles.submissionHeader}>
          <View style={styles.studentInfo}>
            {submission.student_photo ? (
              <Image
                source={{ uri: submission.student_photo }}
                style={styles.studentPhoto}
                resizeMode='cover'
              />
            ) : (
              <View style={styles.studentPhotoPlaceholder}>
                <FontAwesomeIcon icon={faUser} size={16} color='#fff' />
              </View>
            )}
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>{submission.student_name}</Text>
              <Text style={[styles.submissionStatus, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </View>
          <View
            style={[styles.statusIndicator, { backgroundColor: statusColor }]}
          />
        </View>

        {submission.is_completed && (
          <View style={styles.submissionContent}>
            {submission.reply_data && (
              <View style={styles.responseSection}>
                <Text style={styles.sectionLabel}>Student Response:</Text>
                <Text style={styles.responseText}>
                  {processHtmlContent(submission.reply_data)}
                </Text>
              </View>
            )}

            {submission.reply_file && (
              <View style={styles.fileSection}>
                <Text style={styles.sectionLabel}>Submitted File:</Text>
                <TouchableOpacity
                  style={styles.fileButton}
                  onPress={() => openFileLink(submission.reply_file)}
                >
                  <FontAwesomeIcon
                    icon={faFileAlt}
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.fileName}>Open File</Text>
                  <FontAwesomeIcon
                    icon={faExternalLinkAlt}
                    size={14}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}

            {submission.teacher_comment && (
              <View style={styles.feedbackSection}>
                <Text style={styles.sectionLabel}>Your Feedback:</Text>
                <Text style={styles.feedbackText}>
                  {submission.teacher_comment}
                </Text>
              </View>
            )}

            {submission.needs_review && !submission.teacher_comment && (
              <View style={styles.feedbackInputSection}>
                {selectedSubmission === submission.detail_id ? (
                  <View style={styles.feedbackForm}>
                    <TextInput
                      style={styles.feedbackInput}
                      multiline
                      numberOfLines={4}
                      placeholder='Enter your feedback...'
                      placeholderTextColor={theme.colors.textSecondary}
                      value={feedbackText}
                      onChangeText={setFeedbackText}
                      textAlignVertical='top'
                    />
                    <View style={styles.feedbackActions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setSelectedSubmission(null);
                          setFeedbackText('');
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.submitButton}
                        onPress={() => submitFeedback(submission.detail_id)}
                        disabled={submittingFeedback}
                      >
                        {submittingFeedback ? (
                          <ActivityIndicator size='small' color='#fff' />
                        ) : (
                          <>
                            <FontAwesomeIcon
                              icon={faPaperPlane}
                              size={14}
                              color='#fff'
                            />
                            <Text style={styles.submitButtonText}>Submit</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addFeedbackButton}
                    onPress={() => setSelectedSubmission(submission.detail_id)}
                  >
                    <FontAwesomeIcon
                      icon={faComment}
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.addFeedbackText}>Add Feedback</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
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

            <Text style={styles.headerTitle}>Homework Details</Text>

            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#007AFF' />
          <Text style={styles.loadingText}>Loading homework details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!homeworkDetail) {
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

            <Text style={styles.headerTitle}>Homework Details</Text>

            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load homework details</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { homework, submissions, statistics } = homeworkDetail;

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

          <Text style={styles.headerTitle}>Homework Details</Text>

          <View style={styles.headerRight} />
        </View>
      </View>

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
        {/* Homework Info */}
        <View style={styles.homeworkInfoCard}>
          <Text style={styles.homeworkTitle}>{homework.title}</Text>
          <Text style={styles.homeworkDescription}>
            {homework.homework_data
              ? processHtmlContent(homework.homework_data)
              : 'No description provided'}
          </Text>

          <View style={styles.homeworkMeta}>
            <View style={styles.metaItem}>
              <FontAwesomeIcon
                icon={faCalendarAlt}
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.metaText}>
                Due: {formatDate(homework.deadline)}
              </Text>
            </View>

            {(homework.homework_files || homework.homework_file) && (
              <TouchableOpacity
                style={styles.metaItem}
                onPress={() =>
                  openFileLink(
                    homework.homework_file || homework.homework_files
                  )
                }
              >
                <FontAwesomeIcon
                  icon={faFileAlt}
                  size={16}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.metaText, { color: theme.colors.primary }]}
                >
                  Reference File - Tap to open
                </Text>
                <FontAwesomeIcon
                  icon={faExternalLinkAlt}
                  size={12}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statisticsCard}>
          <Text style={styles.sectionTitle}>Submission Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{statistics.total_students}</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#34C759' }]}>
                {statistics.submitted_count}
              </Text>
              <Text style={styles.statLabel}>Submitted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#FF9500' }]}>
                {statistics.needs_review_count}
              </Text>
              <Text style={styles.statLabel}>Needs Review</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#007AFF' }]}>
                {statistics.submission_rate.toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
          </View>
        </View>

        {/* Submissions */}
        <View style={styles.submissionsSection}>
          <Text style={styles.sectionTitle}>
            Student Submissions ({submissions.length})
          </Text>
          {submissions.map(renderSubmissionCard)}
        </View>
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
    headerRight: {
      width: 36,
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
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
    },
    content: {
      flex: 1,
      padding: 20,
    },

    // Homework Info Card
    homeworkInfoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      ...theme.shadows.medium,
    },
    homeworkTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    homeworkDescription: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      lineHeight: 22,
      marginBottom: 8,
    },
    htmlIndicator: {
      fontSize: 12,
      color: theme.colors.primary,
      fontStyle: 'italic',
      marginBottom: 16,
    },
    htmlIndicatorSmall: {
      fontSize: 11,
      color: theme.colors.primary,
      fontStyle: 'italic',
      marginTop: 4,
    },
    homeworkMeta: {
      gap: 8,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 8,
    },

    // Statistics Card
    statisticsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      ...theme.shadows.medium,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },

    // Submissions Section
    submissionsSection: {
      marginBottom: 20,
    },
    submissionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      ...theme.shadows.small,
    },
    submissionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    studentPhoto: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    studentPhotoPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#ccc',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    studentDetails: {
      flex: 1,
    },
    studentName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    submissionStatus: {
      fontSize: 14,
      fontWeight: '500',
    },
    statusIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    submissionContent: {
      gap: 12,
    },
    responseSection: {
      backgroundColor: theme.colors.background,
      padding: 12,
      borderRadius: 8,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 6,
    },
    responseText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    fileSection: {
      backgroundColor: theme.colors.background,
      padding: 12,
      borderRadius: 8,
    },
    fileButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 8,
    },
    fileName: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
      flex: 1,
    },
    feedbackSection: {
      backgroundColor: '#34C75920',
      padding: 12,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: '#34C759',
    },
    feedbackText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    feedbackInputSection: {
      marginTop: 8,
    },
    addFeedbackButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    addFeedbackText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
      marginLeft: 8,
    },
    feedbackForm: {
      backgroundColor: theme.colors.background,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    feedbackInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
      marginBottom: 12,
      minHeight: 80,
    },
    feedbackActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    cancelButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      backgroundColor: theme.colors.border,
    },
    cancelButtonText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      backgroundColor: theme.colors.primary,
      gap: 6,
    },
    submitButtonText: {
      fontSize: 14,
      color: '#fff',
      fontWeight: '500',
    },
  });
