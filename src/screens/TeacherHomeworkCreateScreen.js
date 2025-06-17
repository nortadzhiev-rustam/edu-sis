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
import { faArrowLeft, faPlus, faSave } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { buildApiUrl } from '../config/env';

export default function TeacherHomeworkCreateScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { authCode } = route.params || {};

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [deadline, setDeadline] = useState('');

  const styles = createStyles(theme);

  useEffect(() => {
    if (authCode) {
      fetchClasses();
    }
  }, [authCode]);

  const fetchClasses = async () => {
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
          setClasses(data.data || []);
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

    if (!deadline.trim()) {
      Alert.alert('Error', 'Please enter deadline');
      return;
    }

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
          deadline: deadline.trim(),
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

  if (loading) {
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        {/* Class Selection */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Select Class *</Text>
          {classes.map((classItem) => (
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

            <View style={styles.studentsList}>
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
          </View>
        )}

        {/* Deadline Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Deadline *</Text>
          <TextInput
            style={styles.textInput}
            placeholder='YYYY-MM-DD HH:MM:SS (e.g., 2024-01-20 23:59:59)'
            placeholderTextColor={theme.colors.textSecondary}
            value={deadline}
            onChangeText={setDeadline}
          />
          <Text style={styles.inputHint}>Format: YYYY-MM-DD HH:MM:SS</Text>
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
      padding: 20,
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
    studentsList: {
      maxHeight: 200,
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
      marginBottom: 40,
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
