import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faCalendarAlt,
  faUser,
  faClock,
  faCheckCircle,
  faExclamationTriangle,
  faFileAlt,
  faUpload,
  faPaperPlane,
  faEye,
  faPlay,
  faDownload,
  faEdit,
  faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { buildApiUrl } from '../config/env';
import { createSmallShadow } from '../utils/commonStyles';
import { processHtmlContent, containsHtml } from '../utils/htmlUtils';

export default function AssignmentDetailScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { assignment, authCode } = route.params || {};

  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileLink, setFileLink] = useState('');
  const [assignmentData, setAssignmentData] = useState(assignment);
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const styles = createStyles(theme);

  useEffect(() => {
    if (assignment && authCode) {
      markAsViewed();
    }
  }, [assignment, authCode]);

  // Mark assignment as viewed
  const markAsViewed = async () => {
    if (assignmentData.is_viewed) return; // Already viewed

    try {
      const response = await fetch(buildApiUrl('/homework/mark-viewed'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          auth_code: authCode,
          detail_id: assignmentData.detail_id,
        }),
      });

      if (response.ok) {
        setAssignmentData((prev) => ({
          ...prev,
          is_viewed: true,
          viewed_at: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('Error marking assignment as viewed:', error);
    }
  };

  // Note: File upload functionality is disabled and replaced with file links
  // The pickFile function has been removed as file upload is coming soon

  // Submit assignment
  const submitAssignment = () => {
    if (!replyText.trim() && !selectedFile && !fileLink.trim()) {
      Alert.alert(
        'Error',
        'Please provide either a written response, attach a file, or add a file link'
      );
      return;
    }

    const handleSubmit = async () => {
      setSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('auth_code', authCode);
        formData.append('detail_id', assignmentData.detail_id.toString());
        formData.append('reply_data', replyText.trim());

        if (selectedFile) {
          formData.append('reply_file', {
            uri: selectedFile.uri,
            type: selectedFile.type,
            name: selectedFile.name,
          });
        } else if (fileLink.trim()) {
          // Send file link as reply_file when no physical file is selected
          formData.append('reply_file', fileLink.trim());
        }

        const url = buildApiUrl('/homework/submit');

        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          await response.json();

          setAssignmentData((prev) => ({
            ...prev,
            is_completed: 1,
            has_student_submission: true,
            submitted_date: new Date().toISOString(),
            reply_data: replyText.trim(),
            reply_file: selectedFile?.name || null,
          }));
          Alert.alert('Success', 'Assignment submitted successfully!');
          setReplyText('');
          setSelectedFile(null);
          setFileLink('');
          setShowUpdateForm(false);
        } else {
          const errorResponse = await response.text();

          try {
            const errorData = JSON.parse(errorResponse);

            // Handle specific error cases
            if (errorData.error === 'Homework has already been submitted') {
              Alert.alert(
                'Already Submitted',
                'This assignment has already been submitted. The backend will be updated soon to support assignment updates.',
                [
                  { text: 'OK', style: 'default' },
                  {
                    text: 'Contact Teacher',
                    style: 'default',
                    onPress: () => {
                      Alert.alert(
                        'Contact Teacher',
                        'Please contact your teacher if you need to update your submission.'
                      );
                    },
                  },
                ]
              );
            } else {
              Alert.alert(
                'Submission Error',
                errorData.error ||
                  `Failed to submit assignment: ${response.status}`
              );
            }
          } catch (parseError) {
            // If response is not JSON, show generic error
            Alert.alert(
              'Error',
              `Failed to submit assignment: ${response.status}`
            );
          }
        }
      } catch (error) {
        console.error('Submission error:', error);
        Alert.alert('Error', `Failed to connect to server: ${error.message}`);
      } finally {
        setSubmitting(false);
      }
    };

    Alert.alert(
      'Submit Assignment',
      'Are you sure you want to submit this assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'default',
          onPress: () => {
            handleSubmit();
          },
        },
      ]
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Open file link in browser
  const openFileLink = (url) => {
    if (!url) return;

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open file link');
    });
  };

  // Get file extension from URL
  const getFileExtension = (url) => {
    if (!url) return '';
    const extension = url.split('.').pop()?.toLowerCase();
    return extension || '';
  };

  // Get file name from URL with better extraction
  const getFileName = (url) => {
    if (!url) return 'Reference File';

    try {
      // Remove query parameters and fragments
      const cleanUrl = url.split('?')[0].split('#')[0];

      // Extract filename from URL
      let fileName = cleanUrl.split('/').pop();

      // If no filename or just extension, create a meaningful name
      if (!fileName || fileName.startsWith('.') || fileName.length < 3) {
        const extension = getFileExtension(url);
        return extension ? `Reference File.${extension}` : 'Reference File';
      }

      // Decode URL encoding
      fileName = decodeURIComponent(fileName);

      // If filename is too long, truncate it
      if (fileName.length > 30) {
        const extension = getFileExtension(fileName);
        const nameWithoutExt =
          fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        const truncatedName = nameWithoutExt.substring(0, 25) + '...';
        return extension ? `${truncatedName}.${extension}` : truncatedName;
      }

      return fileName;
    } catch (error) {
      return 'Reference File';
    }
  };

  // Get file type icon based on extension
  const getFileTypeIcon = (url) => {
    const extension = getFileExtension(url);

    // Return different icons based on file type
    switch (extension) {
      case 'pdf':
        return faFileAlt; // You could use a specific PDF icon
      case 'doc':
      case 'docx':
        return faFileAlt; // You could use a specific Word icon
      case 'xls':
      case 'xlsx':
        return faFileAlt; // You could use a specific Excel icon
      case 'ppt':
      case 'pptx':
        return faFileAlt; // You could use a specific PowerPoint icon
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return faFileAlt; // You could use an image icon
      case 'mp4':
      case 'avi':
      case 'mov':
        return faPlay; // Video icon
      case 'mp3':
      case 'wav':
        return faFileAlt; // You could use an audio icon
      default:
        return faFileAlt;
    }
  };

  // Get file type color based on extension
  const getFileTypeColor = (url) => {
    const extension = getFileExtension(url);

    switch (extension) {
      case 'pdf':
        return '#FF3B30'; // Red for PDF
      case 'doc':
      case 'docx':
        return '#007AFF'; // Blue for Word
      case 'xls':
      case 'xlsx':
        return '#34C759'; // Green for Excel
      case 'ppt':
      case 'pptx':
        return '#FF9500'; // Orange for PowerPoint
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '#AF52DE'; // Purple for images
      case 'mp4':
      case 'avi':
      case 'mov':
        return '#FF2D92'; // Pink for videos
      case 'mp3':
      case 'wav':
        return '#FF9500'; // Orange for audio
      default:
        return theme.colors.primary;
    }
  };

  // Get assignment status
  const getAssignmentStatus = () => {
    if (assignmentData.is_completed) {
      return {
        status: 'completed',
        color: '#34C759',
        icon: faCheckCircle,
        label: 'Completed',
      };
    } else if (assignmentData.is_overdue) {
      return {
        status: 'overdue',
        color: '#FF3B30',
        icon: faExclamationTriangle,
        label: 'Overdue',
      };
    } else {
      const deadline = new Date(assignmentData.deadline);
      const today = new Date();

      if (deadline.toDateString() === today.toDateString()) {
        return {
          status: 'due_today',
          color: '#FF9500',
          icon: faCalendarAlt,
          label: 'Due Today',
        };
      } else {
        return {
          status: 'pending',
          color: '#007AFF',
          icon: faClock,
          label: 'Pending',
        };
      }
    }
  };

  const status = getAssignmentStatus();

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
        <Text style={styles.headerTitle}>Assignment Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Assignment Header */}
        <View style={styles.assignmentHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.assignmentTitle}>{assignmentData.title}</Text>
            <View style={styles.subjectInfo}>
              <Text style={styles.subjectName}>
                {assignmentData.subject_name}
              </Text>
              <Text style={styles.gradeName}>{assignmentData.grade_name}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <FontAwesomeIcon icon={status.icon} size={20} color='#fff' />
          </View>
        </View>

        {/* Assignment Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <FontAwesomeIcon
              icon={faUser}
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.infoText}>
              Teacher: {assignmentData.teacher_name}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <FontAwesomeIcon
              icon={faCalendarAlt}
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.infoText}>
              Due: {formatDate(assignmentData.deadline)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <FontAwesomeIcon
              icon={faClock}
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.infoText}>
              Created: {formatDate(assignmentData.homework_created_at)}
            </Text>
          </View>

          {assignmentData.viewed_at && (
            <View style={styles.infoRow}>
              <FontAwesomeIcon
                icon={faEye}
                size={16}
                color={theme.colors.success}
              />
              <Text style={[styles.infoText, { color: theme.colors.success }]}>
                Viewed: {formatDate(assignmentData.viewed_at)} at{' '}
                {formatTime(assignmentData.viewed_at)}
              </Text>
            </View>
          )}
        </View>

        {/* Assignment Content */}
        <View style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Assignment Description</Text>
          <View style={styles.descriptionContainer}>
            <Text style={styles.assignmentDescription}>
              {assignmentData.homework_data
                ? processHtmlContent(assignmentData.homework_data)
                : 'No description provided'}
            </Text>
            {/* {containsHtml(assignmentData.homework_data) && (
              <Text style={styles.htmlIndicator}>📄 Formatted content</Text>
            )} */}
          </View>

          {/* Teacher Files */}
          {(assignmentData.homework_files || assignmentData.homework_file) && (
            <View style={styles.filesSection}>
              <Text style={styles.sectionSubtitle}>Reference Materials</Text>
              <TouchableOpacity
                style={styles.filePreviewCard}
                onPress={() =>
                  openFileLink(
                    assignmentData.homework_files ||
                      assignmentData.homework_file
                  )
                }
              >
                <View style={styles.filePreviewHeader}>
                  <View
                    style={[
                      styles.fileIconContainer,
                      {
                        backgroundColor:
                          getFileTypeColor(
                            assignmentData.homework_files ||
                              assignmentData.homework_file
                          ) + '20',
                      },
                    ]}
                  >
                    <FontAwesomeIcon
                      icon={getFileTypeIcon(
                        assignmentData.homework_files ||
                          assignmentData.homework_file
                      )}
                      size={20}
                      color={getFileTypeColor(
                        assignmentData.homework_files ||
                          assignmentData.homework_file
                      )}
                    />
                  </View>
                  <View style={styles.filePreviewInfo}>
                    <Text style={styles.filePreviewType}>
                      File • Tap to open
                    </Text>
                  </View>
                  <FontAwesomeIcon
                    icon={faExternalLinkAlt}
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Legacy Teacher Files Support */}
          {assignmentData.has_teacher_files &&
            !assignmentData.homework_files &&
            !assignmentData.homework_file && (
              <View style={styles.filesSection}>
                <Text style={styles.sectionSubtitle}>Teacher Files</Text>
                <TouchableOpacity style={styles.fileItem}>
                  <FontAwesomeIcon
                    icon={faDownload}
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.fileName}>Download Assignment Files</Text>
                </TouchableOpacity>
              </View>
            )}

          {/* Teacher Videos */}
          {assignmentData.has_teacher_videos && (
            <View style={styles.filesSection}>
              <Text style={styles.sectionSubtitle}>Video Resources</Text>
              <TouchableOpacity style={styles.fileItem}>
                <FontAwesomeIcon
                  icon={faPlay}
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={styles.fileName}>Watch Video Resources</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submission Status */}
        {assignmentData.is_completed ? (
          <View style={styles.submissionCard}>
            <View style={styles.submissionHeader}>
              <FontAwesomeIcon
                icon={faCheckCircle}
                size={24}
                color={theme.colors.success}
              />
              <Text style={styles.submissionTitle}>Assignment Completed</Text>
            </View>

            {assignmentData.submitted_date && (
              <Text style={styles.submissionDate}>
                Submitted on {formatDate(assignmentData.submitted_date)} at{' '}
                {formatTime(assignmentData.submitted_date)}
              </Text>
            )}

            {assignmentData.has_student_submission && (
              <View style={styles.submissionDetails}>
                {assignmentData.reply_data && (
                  <View style={styles.submissionSection}>
                    <Text style={styles.submissionSectionTitle}>
                      Your Response:
                    </Text>
                    <Text style={styles.submissionText}>
                      {assignmentData.reply_data}
                    </Text>
                  </View>
                )}

                {assignmentData.reply_file && (
                  <View style={styles.submissionSection}>
                    <Text style={styles.submissionSectionTitle}>
                      Submitted File:
                    </Text>
                    <View style={styles.submittedFile}>
                      <FontAwesomeIcon
                        icon={faFileAlt}
                        size={16}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.submittedFileName}>
                        {assignmentData.reply_file}
                      </Text>
                    </View>
                  </View>
                )}

                {assignmentData.teacher_comment && (
                  <View style={styles.submissionSection}>
                    <Text style={styles.submissionSectionTitle}>
                      Teacher Feedback:
                    </Text>
                    <Text style={styles.teacherComment}>
                      {assignmentData.teacher_comment}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Update Submission Button for completed assignments */}
            <TouchableOpacity
              style={[styles.actionButton, styles.updateButton]}
              onPress={() => setShowUpdateForm(!showUpdateForm)}
            >
              <FontAwesomeIcon icon={faEdit} size={16} color='#fff' />
              <Text style={styles.actionButtonText}>
                {showUpdateForm ? 'Cancel Update' : 'Update Submission'}
              </Text>
            </TouchableOpacity>

            {/* Info message about updates */}
            <View style={styles.updateInfoContainer}>
              <Text style={styles.updateInfoText}>
                💡 Note: Assignment updates are being implemented on the
                backend. For now, contact your teacher if you need to modify
                your submission.
              </Text>
            </View>

            {/* Update Form */}
            {showUpdateForm && (
              <View style={styles.updateFormContainer}>
                <Text style={styles.updateFormTitle}>
                  Update Your Submission
                </Text>

                {/* Text Response */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>
                    Written Response (Optional)
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    multiline
                    numberOfLines={6}
                    placeholder='Enter your updated response here...'
                    placeholderTextColor={theme.colors.textSecondary}
                    value={replyText}
                    onChangeText={setReplyText}
                    textAlignVertical='top'
                  />
                </View>

                {/* File Link Input */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>File Link (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder='Enter file URL (e.g., Google Drive, Dropbox link)...'
                    placeholderTextColor={theme.colors.textSecondary}
                    value={fileLink}
                    onChangeText={setFileLink}
                    keyboardType='url'
                    autoCapitalize='none'
                    autoCorrect={false}
                  />
                  <Text style={styles.inputHint}>
                    Add a link to your file hosted on Google Drive, Dropbox, or
                    other cloud services
                  </Text>
                </View>

                {/* File Upload - Disabled with Coming Soon Badge */}
                <View style={styles.inputSection}>
                  <View style={styles.labelWithBadge}>
                    <Text style={styles.inputLabel}>
                      Attach File (Optional)
                    </Text>
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Coming Soon</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.filePickerButton, styles.disabledButton]}
                    disabled={true}
                  >
                    <FontAwesomeIcon
                      icon={faUpload}
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                    <Text style={[styles.filePickerText, styles.disabledText]}>
                      File upload feature coming soon
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.inputHint}>
                    Direct file upload will be available in a future update. For
                    now, please use file links above.
                  </Text>
                </View>

                {/* Update Submit Button */}
                <TouchableOpacity
                  style={[styles.actionButton, styles.submitButton]}
                  onPress={submitAssignment}
                  disabled={
                    submitting ||
                    (!replyText.trim() && !selectedFile && !fileLink.trim())
                  }
                >
                  {submitting ? (
                    <ActivityIndicator size='small' color='#fff' />
                  ) : (
                    <>
                      <FontAwesomeIcon
                        icon={faPaperPlane}
                        size={16}
                        color='#fff'
                      />
                      <Text style={styles.actionButtonText}>
                        Update Submission
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          /* Submission Form */
          <View style={styles.submissionCard}>
            <Text style={styles.sectionTitle}>Submit Assignment</Text>

            {/* Text Response */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Written Response (Optional)</Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={6}
                placeholder='Enter your response here...'
                placeholderTextColor={theme.colors.textSecondary}
                value={replyText}
                onChangeText={setReplyText}
                textAlignVertical='top'
              />
            </View>

            {/* File Link Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>File Link (Optional)</Text>
              <TextInput
                style={styles.fileLinkTextIput}
                placeholder='Enter file URL (e.g., Google Drive, Dropbox link)...'
                placeholderTextColor={theme.colors.textSecondary}
                value={fileLink}
                onChangeText={setFileLink}
                keyboardType='url'
                autoCapitalize='none'
                autoCorrect={false}
              />
              <Text style={styles.inputHint}>
                Add a link to your file hosted on Google Drive, Dropbox, or
                other cloud services
              </Text>
            </View>

            {/* File Upload - Disabled with Coming Soon Badge */}
            <View style={styles.inputSection}>
              <View style={styles.labelWithBadge}>
                <Text style={styles.inputLabel}>Attach File (Optional)</Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.filePickerButton, styles.disabledButton]}
                disabled={true}
              >
                <FontAwesomeIcon
                  icon={faUpload}
                  size={16}
                  color={theme.colors.textSecondary}
                />
                <Text style={[styles.filePickerText, styles.disabledText]}>
                  File upload feature coming soon
                </Text>
              </TouchableOpacity>
              <Text style={styles.inputHint}>
                Direct file upload will be available in a future update. For
                now, please use file links above.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.submitButton]}
                onPress={submitAssignment}
                disabled={
                  submitting ||
                  (!replyText.trim() && !selectedFile && !fileLink.trim())
                }
              >
                {submitting ? (
                  <ActivityIndicator size='small' color='#fff' />
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon={faPaperPlane}
                      size={16}
                      color='#fff'
                    />
                    <Text style={styles.actionButtonText}>
                      Submit Assignment
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
      padding: 20,
    },

    // Assignment Header
    assignmentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
      backgroundColor: theme.colors.surface,
      padding: 20,
      borderRadius: 16,
      ...theme.shadows.medium,
    },
    titleSection: {
      flex: 1,
      marginRight: 15,
    },
    assignmentTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subjectInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    subjectName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
      marginRight: 10,
    },
    gradeName: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    statusBadge: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },

    // Info Card
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      ...theme.shadows.small,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    infoText: {
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 12,
      flex: 1,
    },

    // Content Card
    contentCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      ...theme.shadows.small,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    descriptionContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
    },
    assignmentDescription: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
      marginBottom: 8,
    },
    htmlIndicator: {
      fontSize: 12,
      color: theme.colors.primary,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    filesSection: {
      marginTop: 15,
    },
    sectionSubtitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 10,
    },
    fileItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    fileName: {
      fontSize: 14,
      color: theme.colors.primary,
      marginLeft: 10,
      fontWeight: '500',
    },

    // File Preview Card
    filePreviewCard: {
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 8,
    },
    filePreviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    fileIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filePreviewInfo: {
      flex: 1,
      marginLeft: 12,
    },
    filePreviewName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    filePreviewType: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    filePreviewAction: {
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + '30',
    },
    filePreviewActionText: {
      fontSize: 12,
      color: theme.colors.primary,
      textAlign: 'center',
      fontStyle: 'italic',
    },

    // Input hints and labels
    inputHint: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 6,
      fontStyle: 'italic',
      lineHeight: 16,
    },
    labelWithBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    comingSoonBadge: {
      backgroundColor: theme.colors.warning,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginLeft: 8,
    },
    comingSoonText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#fff',
      textTransform: 'uppercase',
    },
    disabledButton: {
      opacity: 0.5,
      backgroundColor: theme.colors.background,
    },
    disabledText: {
      color: theme.colors.textSecondary,
    },

    // Submission Card
    submissionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      ...createSmallShadow(theme),
    },
    submissionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    submissionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.success,
      marginLeft: 12,
    },
    submissionDate: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 15,
    },
    submissionDetails: {
      marginTop: 15,
    },
    submissionSection: {
      marginBottom: 15,
    },
    submissionSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    submissionText: {
      fontSize: 14,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      padding: 12,
      borderRadius: 8,
      lineHeight: 20,
    },
    submittedFile: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: 12,
      borderRadius: 8,
    },
    submittedFileName: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: 10,
      fontWeight: '500',
    },
    teacherComment: {
      fontSize: 14,
      color: theme.colors.text,
      backgroundColor: theme.colors.warning + '10',
      padding: 12,
      borderRadius: 8,
      lineHeight: 20,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.warning,
    },

    // Input Section
    inputSection: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 15,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 120,
    },
    fileLinkTextIput: {
      minHeight: 40,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 15,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filePickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 15,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
    },
    filePickerText: {
      fontSize: 16,
      color: theme.colors.primary,
      marginLeft: 10,
      fontWeight: '500',
    },
    selectedFileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.success + '10',
      padding: 12,
      borderRadius: 8,
      marginTop: 10,
      borderWidth: 1,
      borderColor: theme.colors.success + '30',
    },
    selectedFileName: {
      fontSize: 14,
      color: theme.colors.success,
      marginLeft: 10,
      flex: 1,
      fontWeight: '500',
    },
    removeFileText: {
      fontSize: 14,
      color: theme.colors.error,
      fontWeight: '600',
    },

    // Action Buttons
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginHorizontal: 5,
    },
    updateButton: {
      backgroundColor: theme.colors.warning,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
    },
    updateFormContainer: {
      marginTop: 20,
      padding: 20,
      backgroundColor: theme.colors.background + '40',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border + '30',
    },
    updateFormTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
      textAlign: 'center',
    },
    updateInfoContainer: {
      marginTop: 15,
      padding: 15,
      backgroundColor: theme.colors.warning + '20',
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.warning,
    },
    updateInfoText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
      fontStyle: 'italic',
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
      marginLeft: 8,
    },
  });
