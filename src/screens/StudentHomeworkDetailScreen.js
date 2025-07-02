import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faUser,
  faCalendarAlt,
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faFileAlt,
  faExternalLinkAlt,
  faEye,
  faComment,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { processHtmlContent } from '../utils/htmlUtils';

export default function StudentHomeworkDetailScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { submission, homeworkTitle } = route.params || {};

  const styles = createStyles(theme);

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

  const getSubmissionStatusColor = () => {
    if (!submission.is_completed) return '#FF3B30'; // Not submitted
    if (submission.needs_review) return '#FF9500'; // Needs review
    if (submission.teacher_comment) return '#34C759'; // Reviewed
    return '#007AFF'; // Submitted
  };

  const getSubmissionStatusText = () => {
    if (!submission.is_completed) return 'Not Submitted';
    if (submission.needs_review) return 'Needs Review';
    if (submission.teacher_comment) return 'Reviewed';
    return 'Submitted';
  };

  const getSubmissionStatusIcon = () => {
    if (!submission.is_completed) return faClock;
    if (submission.needs_review) return faExclamationTriangle;
    if (submission.teacher_comment) return faCheckCircle;
    return faCheckCircle;
  };

  const openFileLink = (url) => {
    if (!url) return;

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open file link');
    });
  };

  const getFileExtension = (url) => {
    if (!url) return '';
    const extension = url.split('.').pop()?.toLowerCase();
    return extension || '';
  };

  const getFileTypeIcon = () => {
    // You could expand this to show different icons for different file types
    return faFileAlt;
  };

  const statusColor = getSubmissionStatusColor();
  const statusText = getSubmissionStatusText();
  const statusIcon = getSubmissionStatusIcon();

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
        <Text style={styles.headerTitle}>Student Submission</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Student Info Card */}
        <View style={styles.studentCard}>
          <View style={styles.studentHeader}>
            <View style={styles.studentInfo}>
              {submission.student_photo ? (
                <Image
                  source={{ uri: submission.student_photo }}
                  style={styles.studentPhoto}
                  resizeMode='cover'
                />
              ) : (
                <View style={styles.studentPhotoPlaceholder}>
                  <FontAwesomeIcon icon={faUser} size={24} color='#fff' />
                </View>
              )}
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>
                  {submission.student_name}
                </Text>
                <Text style={styles.homeworkTitle}>{homeworkTitle}</Text>
              </View>
            </View>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <FontAwesomeIcon icon={statusIcon} size={16} color='#fff' />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>
        </View>

        {/* Submission Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Submission Details</Text>

          {submission.viewed_at && (
            <View style={styles.detailRow}>
              <FontAwesomeIcon
                icon={faEye}
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.detailText}>
                Viewed: {formatDate(submission.viewed_at)}
              </Text>
            </View>
          )}

          {submission.submitted_date && (
            <View style={styles.detailRow}>
              <FontAwesomeIcon
                icon={faCalendarAlt}
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.detailText}>
                Submitted: {formatDate(submission.submitted_date)}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <FontAwesomeIcon
              icon={faCheckCircle}
              size={16}
              color={submission.is_completed ? '#34C759' : '#FF3B30'}
            />
            <Text style={styles.detailText}>
              Status: {submission.is_completed ? 'Completed' : 'Not Completed'}
            </Text>
          </View>
        </View>

        {/* Student Response */}
        {submission.is_completed && submission.reply_data && (
          <View style={styles.responseCard}>
            <Text style={styles.sectionTitle}>Student Response</Text>
            <Text style={styles.responseText}>
              {processHtmlContent(submission.reply_data)}
            </Text>
          </View>
        )}

        {/* Submitted File */}
        {submission.is_completed && submission.reply_file && (
          <View style={styles.fileCard}>
            <Text style={styles.sectionTitle}>Submitted File</Text>
            <TouchableOpacity
              style={styles.fileButton}
              onPress={() => openFileLink(submission.reply_file)}
            >
              <FontAwesomeIcon
                icon={getFileTypeIcon()}
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>File</Text>
                <Text style={styles.fileAction}>Tap to open in browser</Text>
              </View>
              <FontAwesomeIcon
                icon={faExternalLinkAlt}
                size={16}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Teacher Feedback */}
        {submission.teacher_comment && (
          <View style={styles.feedbackCard}>
            <Text style={styles.sectionTitle}>Teacher Feedback</Text>
            <View style={styles.feedbackContent}>
              <FontAwesomeIcon
                icon={faComment}
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.feedbackText}>
                {submission.teacher_comment}
              </Text>
            </View>
          </View>
        )}

        {/* No Submission Message */}
        {!submission.is_completed && (
          <View style={styles.noSubmissionCard}>
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              size={32}
              color='#FF9500'
            />
            <Text style={styles.noSubmissionTitle}>No Submission Yet</Text>
            <Text style={styles.noSubmissionText}>
              This student has not submitted their homework yet.
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
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    studentCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      ...theme.shadows.small,
    },
    studentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    studentPhoto: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginRight: 16,
    },
    studentPhotoPlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#ccc',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    studentDetails: {
      flex: 1,
    },
    studentName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    homeworkTitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    detailsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      ...theme.shadows.small,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 12,
    },
    detailText: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    responseCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      ...theme.shadows.small,
    },
    responseText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    fileCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      ...theme.shadows.small,
    },
    fileButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 12,
    },
    fileInfo: {
      flex: 1,
    },
    fileName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 2,
    },
    fileAction: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    feedbackCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      ...theme.shadows.small,
    },
    feedbackContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    feedbackText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
      flex: 1,
    },
    noSubmissionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      ...theme.shadows.small,
    },
    noSubmissionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 12,
      marginBottom: 8,
    },
    noSubmissionText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
