import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faPlus,
  faSave,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { buildApiUrl } from '../config/env';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useFocusEffect } from '@react-navigation/native';
import HomeworkFileUpload from '../components/homework/HomeworkFileUpload';
import {
  createHomeworkAssignment,
  getOrCreateHomeworkFolder,
  uploadHomeworkFile,
} from '../services/homeworkService';

export default function TeacherHomeworkCreateScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const {
    authCode,
    selectedBranchId: initialSelectedBranchId, // Get selected branch from params
  } = route.params || {};

  const [branchData, setBranchData] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(
    initialSelectedBranchId
  );
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileLink, setFileLink] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [deadline, setDeadline] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);

  const styles = createStyles(theme);

  useEffect(() => {
    if (authCode) {
      fetchBranchData();
    }
  }, [authCode]);

  // Initialize selectedBranchId when branchData loads or when route params change
  useEffect(() => {
    if (branchData?.branches) {
      if (initialSelectedBranchId) {
        const branchExists = branchData.branches.find(
          (b) => b.branch_id === initialSelectedBranchId
        );
        if (branchExists) {
          setSelectedBranchId(initialSelectedBranchId);
          return;
        }
      }

      // Fallback to first branch if no valid selectedBranchId
      if (branchData.branches.length > 0 && !selectedBranchId) {
        setSelectedBranchId(branchData.branches[0].branch_id);
      }
    }
  }, [branchData, initialSelectedBranchId]);

  // Reset class and student selection when branch changes
  useEffect(() => {
    setSelectedClass(null);
    setSelectedStudents([]);
  }, [selectedBranchId]);

  // Update selectedBranchId when screen comes into focus with new params
  useFocusEffect(
    React.useCallback(() => {
      // Always update if we have a valid initialSelectedBranchId and it's different
      if (
        initialSelectedBranchId &&
        initialSelectedBranchId !== selectedBranchId
      ) {
        setSelectedBranchId(initialSelectedBranchId);
      }
      // If initialSelectedBranchId is undefined but we have branchData, set to first branch
      else if (
        !initialSelectedBranchId &&
        branchData?.branches?.length > 0 &&
        !selectedBranchId
      ) {
        setSelectedBranchId(branchData.branches[0].branch_id);
      }
    }, [initialSelectedBranchId, selectedBranchId, branchData])
  );

  const fetchBranchData = async () => {
    try {
      const response = await fetch(
        buildApiUrl(`/teacher/homework/classes?auth_code=${authCode}`),
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
          // Check if the response has the new branches structure
          if (data?.data.branches && Array.isArray(data.data.branches)) {
            setBranchData(data.data);
          } else if (data.branches && Array.isArray(data.branches)) {
            // Old branches format (direct branches array)
            setBranchData(data);
          } else {
            // Legacy format - convert to branch structure
            setBranchData({
              success: true,
              branches: [
                {
                  branch_id: 1,
                  branch_name: 'Main Branch',
                  branch_description: 'Main Branch',
                  classes: data.data || [],
                },
              ],
            });
          }
        } else {
          Alert.alert(t('error'), t('failedToFetchClasses'));
        }
      } else {
        Alert.alert(
          t('error'),
          `${t('failedToFetchClasses')}: ${response.status}`
        );
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      Alert.alert(t('error'), t('failedToConnect'));
    } finally {
      setLoading(false);
    }
  };

  const createHomework = async () => {
    if (!title.trim()) {
      Alert.alert(t('error'), t('pleaseEnterHomeworkTitle'));
      return;
    }

    if (!description.trim()) {
      Alert.alert(t('error'), t('pleaseEnterHomeworkDescription'));
      return;
    }

    if (!selectedClass) {
      Alert.alert(t('error'), t('pleaseSelectClass'));
      return;
    }

    if (selectedStudents.length === 0) {
      Alert.alert(t('error'), t('pleaseSelectStudents'));
      return;
    }

    if (!deadline) {
      Alert.alert(t('error'), t('pleaseSelectDeadline'));
      return;
    }

    setCreating(true);
    try {
      console.log('📝 Creating homework assignment with data:', {
        title: title.trim(),
        description: description.trim(),
        gradeId: selectedClass.grade_id,
        studentIds: selectedStudents,
        deadline: deadline.toISOString().split('T')[0],
      });

      // Create homework assignment using assignment API
      const assignmentResponse = await createHomeworkAssignment(
        title.trim(),
        description.trim(),
        selectedClass.grade_id,
        selectedStudents, // selectedStudents already contains student IDs
        deadline.toISOString().split('T')[0], // Format date as YYYY-MM-DD
        authCode
      );

      if (assignmentResponse.success) {
        const homeworkId =
          assignmentResponse.data.homework_id || assignmentResponse.data.id;

        // Upload file if selected (first create folder, then upload file)
        if (selectedFile) {
          try {
            const className =
              selectedClass.grade_name || selectedClass.class_name;

            console.log('📁 Getting or creating homework folder...');

            // Step 1: Get existing folder or create new one
            const folderResponse = await getOrCreateHomeworkFolder(
              `${title.trim()} - ${className}`, // folder name
              'class', // assignment type
              description.trim(), // description
              [selectedClass.grade_id], // assigned classes
              [], // assigned students (empty for class assignment)
              null, // homeworkParentFolderId (will be auto-detected)
              authCode // authCode
            );

            if (folderResponse.success) {
              // Extract folder ID from response - try different possible structures
              const folderId =
                folderResponse.data?.google_drive_folder_id ||
                folderResponse.google_drive_folder_id ||
                folderResponse.data?.folder_id ||
                folderResponse.data?.homework_folder_id ||
                folderResponse.folder_id ||
                folderResponse.homework_folder_id;

              console.log('📁 Folder response:', folderResponse);
              console.log('📁 Extracted folder ID:', folderId);

              if (folderResponse.data?.existing_folder) {
                console.log('📁 Using existing folder');
              } else {
                console.log('📁 Created new folder');
              }

              if (folderId) {
                // Step 2: Upload file to the created/found folder
                await uploadHomeworkFile(
                  folderId,
                  selectedFile,
                  `Assignment file for ${title.trim()}`, // file description
                  homeworkId, // homework assignment ID for context
                  authCode
                );

                console.log('📤 File uploaded successfully to folder');
              } else {
                console.error(
                  '📁 No folder ID found in response:',
                  folderResponse
                );
                throw new Error('No folder ID returned from folder operation');
              }
            } else {
              throw new Error('Failed to create or access homework folder');
            }
          } catch (uploadError) {
            console.error('File upload error:', uploadError);
            Alert.alert(t('warning'), t('fileUploadWarning'));
          }
        }

        Alert.alert(t('success'), t('homeworkCreatedSuccessfully'), [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert(
          t('error'),
          assignmentResponse.message || t('failedToCreateHomework')
        );
      }
    } catch (error) {
      console.error('Error creating homework:', error);
      Alert.alert(t('error'), t('failedToConnect'));
    } finally {
      setCreating(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const selectAllStudents = () => {
    if (!selectedClass?.students || selectedClass.students.length === 0) return;
    const allStudentIds = selectedClass.students.map(
      (student) => student.student_id
    );
    setSelectedStudents(allStudentIds);
  };

  const clearStudentSelection = () => {
    setSelectedStudents([]);
  };

  // Date picker handlers
  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (selectedDate) => {
    setDeadline(selectedDate);
    hideDatePicker();
  };

  const formatDisplayDateTime = (date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Helper functions for branch management
  const getCurrentBranch = () => {
    if (!branchData?.branches || branchData.branches.length === 0) return null;

    if (selectedBranchId) {
      const branch = branchData.branches.find(
        (b) => b.branch_id === selectedBranchId
      );
      return branch || branchData.branches[0];
    }

    return branchData.branches[0];
  };

  const getCurrentClasses = () => {
    const branch = getCurrentBranch();
    return branch?.classes || [];
  };

  // Memoize current classes to ensure re-render when branch changes
  const currentClasses = useMemo(() => {
    return getCurrentClasses();
  }, [branchData, selectedBranchId]);

  // File upload handlers
  const handleFileSelected = (file) => {
    setSelectedFile(file);
  };

  const handleFileUploaded = (result) => {
    console.log('File uploaded successfully:', result);
  };

  if (loading || !branchData) {
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

            <Text style={styles.headerTitle}>{t('createHomework')}</Text>

            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#007AFF' />
          <Text style={styles.loadingText}>{t('loadingClasses')}</Text>
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

          <Text style={styles.headerTitle}>{t('createHomework')}</Text>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={createHomework}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator size='small' color='#fff' />
            ) : (
              <FontAwesomeIcon icon={faSave} size={18} color='#fff' />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>{t('homeworkTitle')} *</Text>
          <TextInput
            style={styles.textInput}
            placeholder={t('enterHomeworkTitle')}
            placeholderTextColor={theme.colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Description *</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            multiline
            numberOfLines={6}
            placeholder={t('enterHomeworkDescription')}
            placeholderTextColor={theme.colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            textAlignVertical='top'
          />
        </View>

        {/* File Upload Section */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Assignment Files (Optional)</Text>
          <HomeworkFileUpload
            onFileSelected={handleFileSelected}
            onFileUploaded={handleFileUploaded}
            maxFileSize={50 * 1024 * 1024} // 50MB for teachers
            userType='teacher'
            buttonText={t('addAssignmentFile')}
            allowedTypes={[
              'pdf',
              'doc',
              'docx',
              'ppt',
              'pptx',
              'xls',
              'xlsx',
              'jpg',
              'png',
              'zip',
            ]}
          />
          <Text style={styles.inputHint}>
            Upload reference materials, documents, or files for this homework
            assignment
          </Text>
        </View>

        {/* File Link Input (Alternative) */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Or Add File Link (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder={t('enterFileUrl')}
            placeholderTextColor={theme.colors.textSecondary}
            value={fileLink}
            onChangeText={setFileLink}
            keyboardType='url'
            autoCapitalize='none'
            autoCorrect={false}
          />
          <Text style={styles.inputHint}>
            Add a link to reference materials, documents, or files for this
            homework
          </Text>
        </View>

        {/* Class Selection */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>{t('selectClass')} *</Text>
          {currentClasses.map((classItem) => (
            <TouchableOpacity
              key={classItem.grade_id}
              style={[
                styles.classOption,
                selectedClass?.grade_id === classItem.grade_id &&
                  styles.selectedClassOption,
              ]}
              onPress={() => {
                setSelectedClass(classItem);
                setSelectedStudents([]); // Reset student selection
              }}
            >
              <Text
                style={[
                  styles.classOptionText,
                  selectedClass?.grade_id === classItem.grade_id &&
                    styles.selectedClassOptionText,
                ]}
              >
                {classItem.grade_name}
                {classItem.subject_name && ` - ${classItem.subject_name}`}
              </Text>
            </TouchableOpacity>
          ))}

          {currentClasses.length === 0 && (
            <View style={styles.noClassesContainer}>
              <Text style={styles.noClassesText}>
                No classes available for the selected branch
              </Text>
            </View>
          )}
        </View>

        {/* Student Selection */}
        {selectedClass && (
          <View style={styles.inputSection}>
            <View style={styles.studentSelectionHeader}>
              <Text style={styles.inputLabel}>{t('selectStudents')} *</Text>
              {selectedClass.students && selectedClass.students.length > 0 && (
                <View style={styles.selectionActions}>
                  <TouchableOpacity
                    style={styles.selectionButton}
                    onPress={selectAllStudents}
                  >
                    <Text style={styles.selectionButtonText}>Select All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.selectionButton}
                    onPress={clearStudentSelection}
                  >
                    <Text style={styles.selectionButtonText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {selectedClass.students && selectedClass.students.length > 0 && (
              <>
                <Text style={styles.selectionCount}>
                  {selectedStudents.length} of {selectedClass.students.length}{' '}
                  students selected
                </Text>

                {selectedClass.students.map((student) => (
                  <TouchableOpacity
                    key={student.student_id}
                    style={[
                      styles.studentOption,
                      selectedStudents.includes(student.student_id) &&
                        styles.selectedStudentOption,
                    ]}
                    onPress={() => toggleStudentSelection(student.student_id)}
                  >
                    <Text
                      style={[
                        styles.studentOptionText,
                        selectedStudents.includes(student.student_id) &&
                          styles.selectedStudentOptionText,
                      ]}
                    >
                      {student.student_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {(!selectedClass.students ||
              selectedClass.students.length === 0) && (
              <View style={styles.noStudentsContainer}>
                <Text style={styles.noStudentsText}>
                  No students found for this class
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Deadline Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Deadline *</Text>

          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={showDatePicker}
            activeOpacity={0.7}
          >
            <FontAwesomeIcon
              icon={faCalendarAlt}
              size={16}
              color={theme.colors.primary}
              style={styles.dateTimeIcon}
            />
            <View style={styles.dateTimeTextContainer}>
              <Text style={styles.dateTimeValue}>
                {formatDisplayDateTime(deadline)}
              </Text>
              <Text style={styles.dateTimeLabel}>Tap to change deadline</Text>
            </View>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode='datetime'
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
            minimumDate={new Date()}
            date={deadline}
            is24Hour={false}
            display='spinner'
            // Theme support
            isDarkModeEnabled={theme.mode === 'dark'}
            // iOS Modal Styling - Bottom sheet style
            modalStyleIOS={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              marginTop: 'auto',
              marginBottom: 0,
              marginHorizontal: 0,
              maxHeight: '50%',
              ...theme.shadows.large,
            }}
            backdropStyleIOS={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
            pickerContainerStyleIOS={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 20,
            }}
            // iOS Button Styling
            confirmTextIOS={t('setDeadline')}
            cancelTextIOS='Cancel'
            buttonTextColorIOS={theme.colors.primary}
            // Test IDs for automation
            confirmButtonTestID='confirm-date-button'
            cancelButtonTestID='cancel-date-button'
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, creating && styles.disabledButton]}
          onPress={createHomework}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator size='small' color='#fff' />
          ) : (
            <>
              <FontAwesomeIcon icon={faPlus} size={16} color='#fff' />
              <Text style={styles.createButtonText}>{t('createHomework')}</Text>
            </>
          )}
        </TouchableOpacity>
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
    saveButton: {
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
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },

    // Form Styles
    inputSection: {
      marginBottom: 24,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },
    multilineInput: {
      minHeight: 120,
    },
    inputHint: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
      fontStyle: 'italic',
    },
    dateTimeButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      ...theme.shadows.small,
      // Add subtle hover/press effect
      transform: [{ scale: 1 }],
    },
    dateTimeIcon: {
      marginRight: 12,
    },
    dateTimeTextContainer: {
      flex: 1,
    },
    dateTimeValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    dateTimeLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },

    // Date Picker Modal Styles
    modalStyle: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      marginTop: 'auto',
      marginBottom: 0,
      marginHorizontal: 0,
      maxHeight: '40%',
      ...theme.shadows.large,
    },
    backdropStyle: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    pickerContainerStyle: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 10,
      minHeight: 200,
      maxHeight: 200,
    },
    confirmButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 16,
      fontWeight: '500',
    },

    // Class Selection
    classOption: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
    },
    selectedClassOption: {
      backgroundColor: theme.colors.primary + '20',
      borderColor: theme.colors.primary,
    },
    classOptionText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    selectedClassOptionText: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    noClassesContainer: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      marginTop: 8,
    },
    noClassesText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },

    noStudentsContainer: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      marginTop: 8,
    },
    noStudentsText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },

    // Student Selection
    studentSelectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    selectionActions: {
      flexDirection: 'row',
      gap: 8,
    },
    selectionButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    selectionButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '500',
    },
    selectionCount: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    studentOption: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 6,
    },
    selectedStudentOption: {
      backgroundColor: theme.colors.success + '20',
      borderColor: theme.colors.success,
    },
    studentOptionText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    selectedStudentOptionText: {
      color: theme.colors.success,
      fontWeight: '500',
    },

    // Create Button
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      padding: 16,
      borderRadius: 12,
      marginTop: 20,
      ...theme.shadows.medium,
    },
    disabledButton: {
      backgroundColor: theme.colors.border,
    },
    createButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });
