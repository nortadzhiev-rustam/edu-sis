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
  Image,
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
  faPaperPlane,
  faEye,
  faPlay,
  faDownload,
  faEdit,
  faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { buildApiUrl } from '../config/env';
import { createSmallShadow } from '../utils/commonStyles';
import { processHtmlContent } from '../utils/htmlUtils';
import HomeworkFileUpload from '../components/homework/HomeworkFileUpload';
import {
  updateHomeworkSubmission,
  submitHomeworkFile,
  submitHomeworkTextWithFile,
} from '../services/homeworkService';

export default function AssignmentDetailScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { assignment, authCode } = route.params || {};

  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileLink, setFileLink] = useState('');
  const [assignmentData, setAssignmentData] = useState(assignment);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState({});

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
      Alert.alert(t('error'), t('pleaseProvideResponse'));
      return;
    }

    const handleSubmit = async () => {
      setSubmitting(true);
      try {
        // Determine if this is a new submission or an update
        const isUpdate =
          assignmentData.is_completed && assignmentData.has_student_submission;

        let response;

        if (isUpdate) {
          // For updates, always use updateHomeworkSubmission
          console.log('📝 Updating existing homework submission...');

          let fileLink = null;
          // Upload file first if provided
          if (selectedFile) {
            console.log('📤 Uploading homework file for update...');
            const fileUploadResponse = await submitHomeworkFile(
              assignmentData.homework_id, // Use homework_id for file upload
              selectedFile,
              replyText.trim(),
              authCode
            );

            if (fileUploadResponse.success) {
              fileLink =
                fileUploadResponse.data?.web_view_link ||
                fileUploadResponse.data?.file_url ||
                fileUploadResponse.data?.file_link ||
                fileUploadResponse.data?.url ||
                fileUploadResponse.web_view_link;
              console.log(
                '📤 File uploaded successfully for update, file link:',
                fileLink
              );
            } else {
              console.warn(
                '📤 File upload failed for update:',
                fileUploadResponse.message
              );
            }
          }

          response = await updateHomeworkSubmission(
            assignmentData.detail_id, // Use detail_id for submission update
            replyText.trim(),
            fileLink,
            authCode
          );
        } else {
          // For new submissions, use different endpoints based on whether there's a file
          if (selectedFile) {
            console.log('📝 Creating new homework submission with file...');
            // Use SUBMIT_HOMEWORK_FOLDER endpoint for file submissions
            response = await submitHomeworkFile(
              assignmentData.homework_id, // Use homework_id for file submission
              selectedFile,
              replyText.trim(),
              authCode
            );
          } else {
            console.log('📝 Creating new homework submission (text only)...');
            // Use SUBMIT_HOMEWORK endpoint for text-only submissions
            response = await submitHomeworkTextWithFile(
              assignmentData.detail_id, // Use detail_id for text submission
              replyText.trim(),
              null, // No file link
              authCode
            );
          }
        }

        if (response.success) {
          setAssignmentData((prev) => ({
            ...prev,
            is_completed: 1,
            has_student_submission: true,
            submitted_date: new Date().toISOString(),
            reply_data: replyText.trim(),
            reply_file: response.hasFile
              ? response.data?.file_name || 'uploaded_file'
              : null,
          }));

          // Show appropriate success message
          let alertMessage =
            response.message ||
            (isUpdate
              ? 'Assignment updated successfully!'
              : 'Assignment submitted successfully!');
          if (response.fileUploadFailed && response.hasText) {
            alertMessage +=
              '\n\nNote: File upload failed, but your text response was submitted successfully.';
          }

          Alert.alert(t('success'), alertMessage);
          setReplyText('');
          setSelectedFile(null);
          setFileLink('');
          setShowUpdateForm(false);
        } else {
          Alert.alert(
            t('error'),
            response.message ||
              (isUpdate
                ? t('failedToUpdateAssignment')
                : t('failedToSubmitAssignment'))
          );
        }
      } catch (error) {
        console.error('Submission error:', error);

        // Handle specific error cases
        if (error.message.includes('already been submitted')) {
          Alert.alert(t('alreadySubmitted'), t('assignmentAlreadySubmitted'), [
            { text: t('ok'), style: 'default' },
            {
              text: t('contactTeacher'),
              style: 'default',
              onPress: () => {
                Alert.alert(t('contactTeacher'), t('contactTeacherMessage'));
              },
            },
          ]);
        } else {
          Alert.alert(
            t('error'),
            t('failedToConnectServer').replace('{error}', error.message)
          );
        }
      } finally {
        setSubmitting(false);
      }
    };

    // Determine if this is an update or new submission for the alert
    const isUpdate =
      assignmentData.is_completed && assignmentData.has_student_submission;

    Alert.alert(
      isUpdate ? t('updateAssignment') : t('submitAssignment'),
      isUpdate ? t('confirmUpdateAssignment') : t('confirmSubmitAssignment'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: isUpdate ? t('update') : t('submit'),
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
    if (!dateString) return t('noDate');
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
      Alert.alert(t('error'), t('unableToOpenFileLink'));
    });
  };

  // Get file extension from URL
  const getFileExtension = (url) => {
    if (!url) return '';
    const extension = url.split('.').pop()?.toLowerCase();
    return extension || '';
  };

  // Parse Google Drive files from JSON string
  const parseGoogleDriveFiles = (googleDriveFilesString) => {
    if (!googleDriveFilesString) return [];

    try {
      // Handle if it's already an array
      if (Array.isArray(googleDriveFilesString)) {
        return googleDriveFilesString;
      }

      // Parse JSON string
      const files = JSON.parse(googleDriveFilesString);
      return Array.isArray(files) ? files : [];
    } catch (error) {
      console.error('Error parsing google_drive_files:', error);
      return [];
    }
  };

  // Get file name from URL with better extraction
  const getFileName = (url, originalName = null) => {
    // If we have the original name from the file object, use it
    if (originalName) {
      return decodeURIComponent(originalName);
    }
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

  // Check if file is an image
  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const extension = getFileExtension(fileName);
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension);
  };

  // Generate Google Drive thumbnail URL
  const getGoogleDriveThumbnailUrl = (webViewLink, fileId) => {
    if (!webViewLink && !fileId) return null;

    // Extract file ID from web_view_link if not provided directly
    let driveFileId = fileId;
    if (!driveFileId && webViewLink) {
      const match = webViewLink.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        driveFileId = match[1];
      }
    }

    if (driveFileId) {
      // Generate thumbnail URL for Google Drive files
      return `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w200-h200`;
    }

    return null;
  };

  // Get thumbnail URL for file
  const getFileThumbnailUrl = (file) => {
    // First check for explicit thumbnail data
    if (file.thumbnail?.has_thumbnail && file.thumbnail?.thumbnail_url?.small) {
      return file.thumbnail.thumbnail_url.small;
    }

    // For image files, try to generate Google Drive thumbnail
    const fileName = file.original_name || file.file_name || file.name;
    if (isImageFile(fileName)) {
      return getGoogleDriveThumbnailUrl(file.web_view_link, file.file_id);
    }

    return null;
  };

  // Get assignment status with approval information
  const getAssignmentStatus = () => {
    if (assignmentData.is_completed) {
      // Check approval status first
      if (assignmentData.approval_status === 'approved') {
        return {
          status: 'approved',
          color: '#34C759',
          icon: faCheckCircle,
          label: 'Approved',
        };
      } else if (assignmentData.approval_status === 'rejected') {
        return {
          status: 'rejected',
          color: '#FF3B30',
          icon: faExclamationTriangle,
          label: 'Needs Revision',
        };
      } else {
        return {
          status: 'completed',
          color: '#007AFF',
          icon: faCheckCircle,
          label: 'Submitted',
        };
      }
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

  // Check if assignment can be updated
  const canUpdateAssignment = () => {
    return (
      assignmentData.is_completed &&
      assignmentData.teacher_comment &&
      assignmentData.approval_status !== 'approved' &&
      (assignmentData.approval_status === 'rejected' ||
        !assignmentData.approval_status)
    );
  };

  const status = getAssignmentStatus();

  // File upload handlers
  const handleFileSelected = (file) => {
    setSelectedFile(file);
  };

  const handleFileUploaded = (result) => {
    console.log('File uploaded successfully:', result);
  };

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
          <Text style={styles.headerTitle}>Assignment Details</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Assignment Info Subheader */}
        <View style={styles.subHeader}>
          <View style={styles.assignmentHeaderCompact}>
            <View style={styles.titleSectionCompact}>
              <Text style={styles.assignmentTitleCompact}>
                {assignmentData.title}
              </Text>
              <View style={styles.subjectInfoCompact}>
                <Text style={styles.subjectNameCompact}>
                  {assignmentData.subject_name}
                </Text>
                <Text style={styles.gradeNameCompact}>
                  {assignmentData.grade_name}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.statusBadgeCompact,
                { backgroundColor: status.color },
              ]}
            >
              <FontAwesomeIcon icon={status.icon} size={16} color='#fff' />
            </View>
          </View>

          {/* Assignment Info Rows */}
          <View style={styles.infoRowsCompact}>
            <View style={styles.infoRowCompact}>
              <FontAwesomeIcon
                icon={faUser}
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.infoTextCompact}>
                {assignmentData.teacher_name}
              </Text>
            </View>

            <View style={styles.infoRowCompact}>
              <FontAwesomeIcon
                icon={faCalendarAlt}
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.infoTextCompact}>
                Due: {formatDate(assignmentData.deadline)}
              </Text>
            </View>

            {assignmentData.viewed_at && (
              <View style={styles.infoRowCompact}>
                <FontAwesomeIcon
                  icon={faEye}
                  size={14}
                  color={theme.colors.success}
                />
                <Text
                  style={[
                    styles.infoTextCompact,
                    { color: theme.colors.success },
                  ]}
                >
                  Viewed: {formatDate(assignmentData.viewed_at)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Assignment Content */}
        <View style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Assignment Description</Text>
          <View style={styles.descriptionContainer}>
            <Text style={styles.assignmentDescription}>
              {assignmentData.homework_data
                ? processHtmlContent(assignmentData.homework_data)
                : 'No description provided'}
            </Text>
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
                  <View style={styles.fileThumbnailContainer}>
                    {/* For homework_files/homework_file, we don't have file objects with thumbnail data,
                        so we'll show icons for now. This could be enhanced if the API provides more file details */}
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

          {/* Google Drive Files */}
          {assignmentData.google_drive_files && (
            <View style={styles.filesSection}>
              <Text style={styles.sectionSubtitle}>Reference Materials</Text>
              {parseGoogleDriveFiles(assignmentData.google_drive_files).map(
                (file, index) => {
                  const thumbnailUrl = getFileThumbnailUrl(file);
                  const fileName = file.original_name || file.file_name;
                  const fileKey = file.file_id || index;
                  const hasThumbnailError = thumbnailErrors[fileKey];

                  return (
                    <TouchableOpacity
                      key={fileKey}
                      style={styles.filePreviewCard}
                      onPress={() => openFileLink(file.web_view_link)}
                    >
                      <View style={styles.filePreviewHeader}>
                        <View style={styles.fileThumbnailContainer}>
                          {thumbnailUrl && !hasThumbnailError ? (
                            <Image
                              source={{ uri: thumbnailUrl }}
                              style={styles.fileThumbnail}
                              resizeMode='cover'
                              onError={() => {
                                console.log(
                                  'Failed to load thumbnail for:',
                                  getFileName(file.web_view_link, fileName)
                                );
                                setThumbnailErrors((prev) => ({
                                  ...prev,
                                  [fileKey]: true,
                                }));
                              }}
                            />
                          ) : (
                            <View
                              style={[
                                styles.fileIconContainer,
                                {
                                  backgroundColor:
                                    getFileTypeColor(fileName) + '20',
                                },
                              ]}
                            >
                              <FontAwesomeIcon
                                icon={getFileTypeIcon(fileName)}
                                size={20}
                                color={getFileTypeColor(fileName)}
                              />
                            </View>
                          )}
                        </View>
                        <View style={styles.filePreviewInfo}>
                          <Text style={styles.filePreviewName}>
                            {getFileName(file.web_view_link, fileName)}
                          </Text>
                          <Text style={styles.filePreviewType}>
                            {file.file_size
                              ? `${Math.round(file.file_size / 1024)} KB • `
                              : ''}
                            Tap to open
                          </Text>
                        </View>
                        <FontAwesomeIcon
                          icon={faExternalLinkAlt}
                          size={16}
                          color={theme.colors.textSecondary}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          )}

          {/* Legacy Teacher Files Support */}
          {assignmentData.has_teacher_files &&
            !assignmentData.homework_files &&
            !assignmentData.homework_file &&
            !assignmentData.google_drive_files && (
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

                {/* Approval Status Display */}
                {assignmentData.approval_status && (
                  <View style={styles.submissionSection}>
                    <Text style={styles.submissionSectionTitle}>
                      Review Status:
                    </Text>
                    <View
                      style={[
                        styles.approvalStatusContainer,
                        {
                          backgroundColor:
                            assignmentData.approval_status === 'approved'
                              ? '#34C759' + '20'
                              : '#FF3B30' + '20',
                          borderLeftColor:
                            assignmentData.approval_status === 'approved'
                              ? '#34C759'
                              : '#FF3B30',
                        },
                      ]}
                    >
                      <FontAwesomeIcon
                        icon={
                          assignmentData.approval_status === 'approved'
                            ? faCheckCircle
                            : faExclamationTriangle
                        }
                        size={20}
                        color={
                          assignmentData.approval_status === 'approved'
                            ? '#34C759'
                            : '#FF3B30'
                        }
                      />
                      <View style={styles.approvalStatusText}>
                        <Text
                          style={[
                            styles.approvalStatusLabel,
                            {
                              color:
                                assignmentData.approval_status === 'approved'
                                  ? '#34C759'
                                  : '#FF3B30',
                            },
                          ]}
                        >
                          {assignmentData.approval_status === 'approved'
                            ? 'Approved'
                            : 'Needs Revision'}
                        </Text>
                        <Text style={styles.approvalStatusDescription}>
                          {assignmentData.approval_status === 'approved'
                            ? 'Your homework has been approved by the teacher'
                            : 'Your homework needs revision. Please check the feedback and resubmit.'}
                        </Text>
                        {assignmentData.reviewed_at && (
                          <Text style={styles.reviewDate}>
                            Reviewed on {formatDate(assignmentData.reviewed_at)}
                          </Text>
                        )}
                      </View>
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

            {/* Update Submission Button - only show if assignment can be updated */}
            {canUpdateAssignment() && (
              <TouchableOpacity
                style={[styles.actionButton, styles.updateButton]}
                onPress={() => setShowUpdateForm(!showUpdateForm)}
              >
                <FontAwesomeIcon icon={faEdit} size={16} color='#fff' />
                <Text style={styles.actionButtonText}>
                  {showUpdateForm ? 'Cancel Update' : 'Update Submission'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Approved Assignment Notice */}
            {assignmentData.approval_status === 'approved' && (
              <View style={styles.approvedNotice}>
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  size={20}
                  color='#34C759'
                />
                <Text style={styles.approvedNoticeText}>
                  This assignment has been approved and cannot be modified.
                </Text>
              </View>
            )}

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

                {/* File Upload */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Attach File (Optional)</Text>
                  <HomeworkFileUpload
                    onFileSelected={handleFileSelected}
                    onFileUploaded={handleFileUploaded}
                    maxFileSize={10 * 1024 * 1024} // 10MB for students
                    userType='student'
                    buttonText='Upload Assignment File'
                    allowedTypes={['pdf', 'doc', 'docx', 'jpg', 'png', 'zip']}
                  />
                  <Text style={styles.inputHint}>
                    Upload your completed assignment file
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
            <Text style={styles.sectionTitle}>
              {assignmentData.is_completed &&
              assignmentData.has_student_submission
                ? 'Update Assignment'
                : 'Submit Assignment'}
            </Text>

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

            {/* File Upload */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Attach File (Optional)</Text>
              <HomeworkFileUpload
                onFileSelected={handleFileSelected}
                onFileUploaded={handleFileUploaded}
                maxFileSize={10 * 1024 * 1024} // 10MB for students
                userType='student'
                buttonText='Upload Assignment File'
                allowedTypes={['pdf', 'doc', 'docx', 'jpg', 'png', 'zip']}
              />
              <Text style={styles.inputHint}>
                Upload your completed assignment file
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
                      {assignmentData.is_completed &&
                      assignmentData.has_student_submission
                        ? 'Update Assignment'
                        : 'Submit Assignment'}
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
      paddingHorizontal: 16,
      paddingVertical: 16,
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
    headerRight: {
      width: 36,
    },
    content: {
      flex: 1,
      padding: 20,
    },

    // Compact Assignment Header Styles
    assignmentHeaderCompact: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    titleSectionCompact: {
      flex: 1,
      marginRight: 12,
    },
    assignmentTitleCompact: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    subjectInfoCompact: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    subjectNameCompact: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      marginRight: 8,
    },
    gradeNameCompact: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    statusBadgeCompact: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    infoRowsCompact: {
      marginTop: 8,
    },
    infoRowCompact: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    infoTextCompact: {
      fontSize: 13,
      color: theme.colors.text,
      marginLeft: 8,
      flex: 1,
    },

    // Legacy Assignment Header (keeping for compatibility)
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
    fileThumbnailContainer: {
      position: 'relative',
      marginRight: 12,
    },
    fileThumbnail: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: '#f8f9fa',
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

    // Approval System Styles
    approvalStatusContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.background,
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      gap: 12,
    },
    approvalStatusText: {
      flex: 1,
    },
    approvalStatusLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    approvalStatusDescription: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
      marginBottom: 4,
    },
    reviewDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    approvedNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#34C759' + '20',
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#34C759',
      gap: 12,
      marginTop: 16,
    },
    approvedNoticeText: {
      fontSize: 14,
      color: '#34C759',
      fontWeight: '600',
      flex: 1,
    },
  });
