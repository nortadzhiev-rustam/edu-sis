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
import { buildApiUrl } from '../config/env';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export default function TeacherHomeworkCreateScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { authCode } = route.params || {};

  const [branchData, setBranchData] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [deadline, setDeadline] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const styles = createStyles(theme);

  useEffect(() => {
    if (authCode) {
      fetchBranchData();
    }
  }, [authCode]);

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
          // Check if the response has branches structure
          if (data.branches && Array.isArray(data.branches)) {
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
          Alert.alert('Error', 'Failed to fetch classes');
        }
      } else {
        Alert.alert('Error', `Failed to fetch classes: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const createHomework = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter homework title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter homework description');
      return;
    }

    if (!selectedClass) {
      Alert.alert('Error', 'Please select a class');
      return;
    }

    if (selectedStudents.length === 0) {
      Alert.alert('Error', 'Please select at least one student');
      return;
    }

    if (!deadline) {
      Alert.alert('Error', 'Please select deadline');
      return;
    }

    // Format deadline for API
    const combinedDeadline = formatDateTime(deadline);

    setCreating(true);
    try {
      const response = await fetch(buildApiUrl('/teacher/homework/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          auth_code: authCode,
          title: title.trim(),
          grade_id: selectedClass.grade_id,
          students: selectedStudents,
          deadline: combinedDeadline,
          homework_data: description.trim(),
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Homework created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to create homework');
      }
    } catch (error) {
      console.error('Error creating homework:', error);
      Alert.alert('Error', 'Failed to connect to server');
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
    if (!selectedClass) return;
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

  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
    return branchData.branches[selectedBranch] || branchData.branches[0];
  };

  const getCurrentClasses = () => {
    const branch = getCurrentBranch();
    return branch?.classes || [];
  };

  if (loading || !branchData) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Homework</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#007AFF' />
          <Text style={styles.loadingText}>Loading classes...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Create Homework</Text>
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Homework Title *</Text>
          <TextInput
            style={styles.textInput}
            placeholder='Enter homework title...'
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
            placeholder='Enter homework description and instructions...'
            placeholderTextColor={theme.colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            textAlignVertical='top'
          />
        </View>

        {/* Branch Selection */}
        {branchData?.branches && branchData.branches.length > 1 && (
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Select Branch</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.branchSelector}
            >
              {branchData.branches.map((branch, index) => (
                <TouchableOpacity
                  key={branch.branch_id}
                  style={[
                    styles.branchTab,
                    selectedBranch === index && styles.branchTabSelected,
                  ]}
                  onPress={() => {
                    setSelectedBranch(index);
                    setSelectedClass(null); // Reset class selection when branch changes
                    setSelectedStudents([]); // Reset student selection
                  }}
                >
                  <Text
                    style={[
                      styles.branchTabText,
                      selectedBranch === index && styles.branchTabTextSelected,
                    ]}
                  >
                    {branch.branch_description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Class Selection */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Select Class *</Text>
          {getCurrentClasses().map((classItem) => (
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
                {classItem.grade_name} ({classItem.students.length} students)
              </Text>
            </TouchableOpacity>
          ))}

          {getCurrentClasses().length === 0 && (
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
              <Text style={styles.inputLabel}>Select Students *</Text>
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
            </View>

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
            confirmTextIOS='Set Deadline'
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
              <Text style={styles.createButtonText}>Create Homework</Text>
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

    // Branch Selection
    branchSelector: {
      marginTop: 8,
    },
    branchTab: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 8,
      minWidth: 80,
      alignItems: 'center',
    },
    branchTabSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    branchTabText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    branchTabTextSelected: {
      color: '#fff',
      fontWeight: '600',
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
