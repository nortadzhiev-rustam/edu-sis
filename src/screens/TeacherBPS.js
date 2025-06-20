import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Config, buildApiUrl } from '../config/env';
import { useTheme } from '../contexts/ThemeContext';

// Import reusable components
import { SwipeableRecord } from '../components';

import {
  faArrowLeft,
  faGavel,
  faPlus,
  faRefresh,
  faThumbsUp,
  faThumbsDown,
  faCalendarAlt,
  faUser,
  faTimes,
  faCheck,
  faSearch,
  faChevronDown,
  faChevronRight,
  faUsers,
  faCheckSquare,
  faSquare,
} from '@fortawesome/free-solid-svg-icons';

export default function TeacherBPS({ route, navigation }) {
  const {
    authCode,
    bpsData: initialData,
    selectedBranch: initialSelectedBranch,
  } = route.params || {};
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [bpsData, setBpsData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(
    initialSelectedBranch || 0
  );
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [note, setNote] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClasses, setExpandedClasses] = useState(new Set());
  const [modalStep, setModalStep] = useState(1);
  const [isMultipleSelection, setIsMultipleSelection] = useState(false);

  const [selectedBehaviorType, setSelectedBehaviorType] = useState(null);

  const fetchBPSData = async () => {
    if (!authCode) return;

    try {
      setRefreshing(true);
      const url = buildApiUrl(Config.API_ENDPOINTS.GET_TEACHER_BPS, {
        authCode,
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
        setBpsData(data);
        console.log('BPS data:', data);
      } else {
        Alert.alert('Error', 'Failed to fetch BPS data');
      }
    } catch (error) {
      console.error('Error fetching BPS data:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setRefreshing(false);
    }
  };

  const addBPSRecord = async () => {
    const studentsToProcess = isMultipleSelection
      ? selectedStudents
      : [selectedStudent];

    const behaviorsToSubmit =
      selectedItems.length > 0
        ? selectedItems
        : selectedItem
        ? [selectedItem]
        : [];

    if (studentsToProcess.length === 0 || behaviorsToSubmit.length === 0) {
      Alert.alert(
        'Error',
        'Please select at least one student and at least one behavior'
      );
      return;
    }

    // Get current branch information
    const currentBranch = getCurrentBranch();
    if (!currentBranch) {
      Alert.alert('Error', 'No branch information available');
      return;
    }

    setLoading(true);

    try {
      const url = buildApiUrl(Config.API_ENDPOINTS.STORE_BPS);

      // Prepare student IDs
      const studentIds = studentsToProcess.map((student) => student.student_id);

      // Prepare item IDs
      const itemIds = behaviorsToSubmit.map(
        (behavior) => behavior.discipline_item_id
      );

      // Validate that all behaviors are of the same type
      const behaviorTypes = [
        ...new Set(behaviorsToSubmit.map((b) => b.item_type)),
      ];
      if (behaviorTypes.length > 1) {
        Alert.alert(
          'Error',
          'All selected behaviors must be of the same type (either all positive or all negative)'
        );
        setLoading(false);
        return;
      }

      // Determine case type from the behaviors and convert to numeric format
      // API expects: "0" for PRS (Positive Reinforcement System), "1" for DPS (Discipline Point System)
      const behaviorType =
        behaviorsToSubmit[0].item_type?.toUpperCase()?.trim() || 'PRS';

      // Convert behavior type to numeric case_type for API
      let caseType;
      if (behaviorType === 'PRS' || behaviorType === 'POSITIVE') {
        caseType = '0';
      } else if (behaviorType === 'DPS' || behaviorType === 'NEGATIVE') {
        caseType = '1';
      } else {
        // Default to PRS if unknown type
        caseType = '0';
      }

      // Get current date in YYYY-MM-DD format
      const currentDate = new Date().toISOString().split('T')[0];

      // Prepare request payload according to backend format
      const requestPayload = {
        auth_code: authCode,
        branch_id: currentBranch.branch_id,
        case_type: caseType,
        date: currentDate,
        note: note.trim() || '',
        students: studentIds,
        items: itemIds,
        // Include user_id if available from auth context
        user_id: authCode, // Using authCode as user identifier for now
      };

      console.log('Sending BPS request:', requestPayload);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('BPS response:', result);

        if (result.success) {
          const successMessage =
            result.message ||
            `${
              result.successful_records || 0
            } BPS record(s) created successfully`;

          Alert.alert('Success', successMessage);
          setShowAddModal(false);
          resetForm();
          await fetchBPSData();
        } else {
          // Handle partial success or errors from backend
          const errorMessage = result.message || 'Failed to create BPS records';

          if (result.successful_records && result.successful_records > 0) {
            Alert.alert(
              'Partial Success',
              `${result.successful_records} out of ${result.total_records_attempted} records created successfully.\n\n${errorMessage}`,
              [
                {
                  text: 'Continue',
                  onPress: () => {
                    setShowAddModal(false);
                    resetForm();
                    fetchBPSData();
                  },
                },
                { text: 'OK', style: 'cancel' },
              ]
            );
          } else {
            Alert.alert('Error', errorMessage);

            // Show detailed error information if available
            if (result.results && Array.isArray(result.results)) {
              const failedResults = result.results.filter(
                (r) => r.status === 'error'
              );
              if (failedResults.length > 0) {
                console.log('Failed BPS submissions:', failedResults);
              }
            }
          }
        }
      } else {
        const errorText = await response.text();
        console.error('BPS submission failed:', errorText);
        Alert.alert(
          'Error',
          `Failed to submit BPS records: ${errorText || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error during BPS record submission:', error);
      Alert.alert(
        'Error',
        `Network error occurred: ${error.message || 'Please try again.'}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Check if the teacher has permission to delete BPS records
  const canDeleteBPS = () => {
    return bpsData?.permissions?.can_delete_bps === true;
  };

  // Delete a BPS record
  const deleteBPSRecord = async (record) => {
    if (!canDeleteBPS()) {
      Alert.alert(
        'Permission Denied',
        'You do not have permission to delete BPS records.'
      );
      return;
    }

    Alert.alert(
      'Delete BPS Record',
      `Are you sure you want to delete this ${
        record.item_type === 'prs' ? 'positive' : 'negative'
      } behavior record for ${record.student_name}?\n\n"${
        record.item_title
      }" (${record.item_point > 0 ? '+' : ''}${record.item_point} points)`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const url = buildApiUrl(Config.API_ENDPOINTS.DELETE_BPS);

              const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  auth_code: authCode,
                  discipline_record_id: record.discipline_record_id,
                }),
              });

              if (response.ok) {
                const result = await response.json();
                if (result.success) {
                  Alert.alert('Success', 'BPS record deleted successfully');
                  await fetchBPSData(); // Refresh the data
                } else {
                  Alert.alert(
                    'Error',
                    result.message || 'Failed to delete BPS record'
                  );
                }
              } else {
                const errorText = await response.text();
                console.error('BPS deletion failed:', errorText);
                Alert.alert('Error', 'Failed to delete BPS record');
              }
            } catch (error) {
              console.error('Error deleting BPS record:', error);
              Alert.alert(
                'Error',
                'Network error occurred while deleting record'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setSelectedStudents([]);
    setSelectedItem(null);
    setSelectedItems([]);
    setNote('');
    setSearchQuery('');
    setModalStep(1);
    setIsMultipleSelection(false);
    setSelectedBehaviorType(null);

    // Start with no classes expanded
    setExpandedClasses(new Set());
  };

  // Optimized function to use structured BPS data instead of multiple API calls
  // Uses branches.classes array and total_students key when available
  const getGroupedStudents = () => {
    const branch = getCurrentBranch();

    // First try to use the structured classes array if available
    // This avoids the need to group students manually and reduces processing
    if (branch?.classes && Array.isArray(branch.classes)) {
      const grouped = {};

      branch.classes.forEach((classData) => {
        if (classData.students && Array.isArray(classData.students)) {
          classData.students.forEach((student) => {
            if (!student.student_name || student.student_name.trim() === '') {
              return; // Skip students without names
            }

            // Determine the group name based on classroom_name
            let groupName;
            if (
              !student.classroom_name ||
              student.classroom_name.trim() === '' ||
              student.classroom_name === 'No Classroom'
            ) {
              // Use grade_name from class object if no classroom or "No Classroom"
              groupName = classData.grade_name;
            } else {
              // Use the actual classroom_name (for batches)
              groupName = student.classroom_name;
            }

            // Initialize group if it doesn't exist
            if (!grouped[groupName]) {
              grouped[groupName] = [];
            }

            // Add student with proper classroom_name and name for compatibility
            grouped[groupName].push({
              ...student,
              name: student.student_name, // Add name property for compatibility
              classroom_name: groupName,
            });
          });
        }
      });

      // Sort students within each group
      Object.keys(grouped).forEach((groupName) => {
        grouped[groupName].sort((a, b) =>
          a.student_name.localeCompare(b.student_name)
        );
      });

      return grouped;
    }

    // Fallback to the original method if classes array is not available
    if (!branch?.students) return {};

    const grouped = {};
    branch.students.forEach((student) => {
      if (!student.classroom_name || student.classroom_name.trim() === '') {
        return;
      }

      const className = student.classroom_name;
      if (!grouped[className]) {
        grouped[className] = [];
      }
      grouped[className].push(student);
    });

    Object.keys(grouped).forEach((className) => {
      grouped[className].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  };

  const getFilteredStudents = () => {
    const groupedStudents = getGroupedStudents();
    if (!searchQuery.trim()) return groupedStudents;

    const filtered = {};
    Object.keys(groupedStudents).forEach((className) => {
      const filteredStudents = groupedStudents[className].filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filteredStudents.length > 0) {
        filtered[className] = filteredStudents;
      }
    });

    return filtered;
  };

  const toggleClassExpansion = (className) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(className)) {
      newExpanded.delete(className);
    } else {
      newExpanded.add(className);
    }
    setExpandedClasses(newExpanded);
  };

  const handleStudentSelection = (student) => {
    if (isMultipleSelection) {
      const isSelected = selectedStudents.some(
        (s) => s.student_id === student.student_id
      );
      if (isSelected) {
        setSelectedStudents(
          selectedStudents.filter((s) => s.student_id !== student.student_id)
        );
      } else {
        setSelectedStudents([...selectedStudents, student]);
      }
    } else {
      setSelectedStudent(student);
    }
  };

  const selectWholeClass = (className) => {
    const groupedStudents = getFilteredStudents();
    const classStudents = groupedStudents[className] || [];

    if (isMultipleSelection) {
      const allSelected = classStudents.every((student) =>
        selectedStudents.some((s) => s.student_id === student.student_id)
      );

      if (allSelected) {
        setSelectedStudents(
          selectedStudents.filter(
            (selected) =>
              !classStudents.some(
                (classStudent) =>
                  classStudent.student_id === selected.student_id
              )
          )
        );
      } else {
        const newSelections = classStudents.filter(
          (student) =>
            !selectedStudents.some((s) => s.student_id === student.student_id)
        );
        setSelectedStudents([...selectedStudents, ...newSelections]);
      }
    }
  };

  const isStudentSelected = (student) => {
    if (isMultipleSelection) {
      return selectedStudents.some((s) => s.student_id === student.student_id);
    } else {
      return selectedStudent?.student_id === student.student_id;
    }
  };

  const isWholeClassSelected = (className) => {
    if (!isMultipleSelection) return false;
    const groupedStudents = getFilteredStudents();
    const classStudents = groupedStudents[className] || [];
    return (
      classStudents.length > 0 &&
      classStudents.every((student) =>
        selectedStudents.some((s) => s.student_id === student.student_id)
      )
    );
  };

  const handleBehaviorCategorySelect = (behaviorType) => {
    setSelectedBehaviorType(behaviorType);
  };

  const handleBehaviorItemSelect = (item) => {
    const isAlreadySelected = selectedItems.some(
      (selectedItem) =>
        selectedItem.discipline_item_id === item.discipline_item_id
    );

    if (isAlreadySelected) {
      setSelectedItems(
        selectedItems.filter(
          (selectedItem) =>
            selectedItem.discipline_item_id !== item.discipline_item_id
        )
      );
    } else {
      // Check if this item type matches existing selections
      if (selectedItems.length > 0) {
        const existingType = selectedItems[0].item_type;
        if (item.item_type !== existingType) {
          Alert.alert(
            'Mixed Behavior Types',
            `You can only select behaviors of the same type. Currently selected: ${
              existingType === 'prs' ? 'Positive' : 'Negative'
            } behaviors.`,
            [
              {
                text: 'Clear All & Select This',
                onPress: () => {
                  setSelectedItems([item]);
                  setSelectedItem(item);
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
          return;
        }
      }
      setSelectedItems([...selectedItems, item]);
    }

    setSelectedItem(item);
  };

  const isBehaviorItemSelected = (item) => {
    return selectedItems.some(
      (selectedItem) =>
        selectedItem.discipline_item_id === item.discipline_item_id
    );
  };

  const getTotalPoints = () => {
    if (selectedItems.length > 0) {
      return selectedItems.reduce(
        (total, behavior) => total + (behavior.item_point || 0),
        0
      );
    }
    return selectedItem?.item_point || 0;
  };

  const getFilteredBehaviorItems = () => {
    if (!selectedBehaviorType) return [];

    let disciplineItems = null;

    const branch = getCurrentBranch();
    if (branch?.discipline_items) {
      disciplineItems = branch.discipline_items;
    } else if (bpsData?.discipline_items) {
      disciplineItems = bpsData.discipline_items;
    } else if (bpsData?.branches?.[0]?.discipline_items) {
      disciplineItems = bpsData.branches[0].discipline_items;
    }

    if (disciplineItems) {
      if (Array.isArray(disciplineItems)) {
        const filtered = disciplineItems.filter(
          (item) =>
            item.item_type &&
            item.item_type.toLowerCase() === selectedBehaviorType.toLowerCase()
        );
        if (filtered.length > 0) {
          return filtered;
        }
      }

      if (typeof disciplineItems === 'object') {
        if (selectedBehaviorType === 'dps' && disciplineItems.dps_items) {
          return disciplineItems.dps_items;
        }

        if (selectedBehaviorType === 'prs' && disciplineItems.prs_items) {
          return disciplineItems.prs_items;
        }
      }
    }

    const dummyItems =
      selectedBehaviorType === 'prs'
        ? [
            {
              discipline_item_id: 'dummy_prs_1',
              item_title: 'Good Behavior',
              item_point: 5,
              item_type: 'prs',
            },
            {
              discipline_item_id: 'dummy_prs_2',
              item_title: 'Helping Others',
              item_point: 3,
              item_type: 'prs',
            },
            {
              discipline_item_id: 'dummy_prs_3',
              item_title: 'Excellent Work',
              item_point: 10,
              item_type: 'prs',
            },
            {
              discipline_item_id: 'dummy_prs_4',
              item_title: 'Leadership',
              item_point: 8,
              item_type: 'prs',
            },
          ]
        : [
            {
              discipline_item_id: 'dummy_dps_1',
              item_title: 'Late to Class',
              item_point: -2,
              item_type: 'dps',
            },
            {
              discipline_item_id: 'dummy_dps_2',
              item_title: 'Disrupting Class',
              item_point: -5,
              item_type: 'dps',
            },
            {
              discipline_item_id: 'dummy_dps_3',
              item_title: 'Not Following Instructions',
              item_point: -3,
              item_type: 'dps',
            },
            {
              discipline_item_id: 'dummy_dps_4',
              item_title: 'Inappropriate Behavior',
              item_point: -8,
              item_type: 'dps',
            },
          ];

    return dummyItems;
  };

  const getValidStudentsCount = () => {
    const branch = getCurrentBranch();

    // First try to use the total_students key if available
    if (branch?.total_students && typeof branch.total_students === 'number') {
      return branch.total_students;
    }

    // If classes array is available, sum up students from all classes
    if (branch?.classes && Array.isArray(branch.classes)) {
      return branch.classes.reduce((total, classData) => {
        if (classData.students && Array.isArray(classData.students)) {
          return (
            total +
            classData.students.filter(
              (student) =>
                student.student_name && student.student_name.trim() !== ''
            ).length
          );
        }
        return total;
      }, 0);
    }

    // Fallback to the original method
    if (!branch?.students) return 0;

    return branch.students.filter(
      (student) =>
        student.classroom_name && student.classroom_name.trim() !== ''
    ).length;
  };

  const getClassStudentCount = (className) => {
    const branch = getCurrentBranch();

    // If classes array is available, count students properly considering batches
    if (branch?.classes && Array.isArray(branch.classes)) {
      let count = 0;

      branch.classes.forEach((classData) => {
        if (classData.students && Array.isArray(classData.students)) {
          classData.students.forEach((student) => {
            if (!student.student_name || student.student_name.trim() === '') {
              return; // Skip students without names
            }

            // Determine the group name based on classroom_name
            let groupName;
            if (
              !student.classroom_name ||
              student.classroom_name.trim() === '' ||
              student.classroom_name === 'No Classroom'
            ) {
              // Use grade_name from class object if no classroom or "No Classroom"
              groupName = classData.grade_name;
            } else {
              // Use the actual classroom_name (for batches)
              groupName = student.classroom_name;
            }

            if (groupName === className) {
              count++;
            }
          });
        }
      });

      return count;
    }

    // Fallback to counting from grouped students
    const groupedStudents = getGroupedStudents();
    return groupedStudents[className]?.length || 0;
  };

  const getTotalClassesCount = () => {
    const branch = getCurrentBranch();

    // If classes array is available, use its length
    if (branch?.classes && Array.isArray(branch.classes)) {
      return branch.classes.length;
    }

    // Fallback to counting unique classroom names
    const groupedStudents = getGroupedStudents();
    return Object.keys(groupedStudents).length;
  };

  const canProceedToNextStep = () => {
    switch (modalStep) {
      case 1:
        return isMultipleSelection
          ? selectedStudents.length > 0
          : selectedStudent !== null;
      case 2:
        return selectedItems.length > 0 || selectedItem !== null;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (modalStep) {
      case 1:
        return 'Select Student';
      case 2:
        return 'Choose Behavior';
      case 3:
        return 'Review & Submit';
      default:
        return 'Add BPS Record';
    }
  };

  const nextStep = () => {
    if (canProceedToNextStep() && modalStep < 3) {
      setModalStep(modalStep + 1);
    }
  };

  const previousStep = () => {
    if (modalStep > 1) {
      setModalStep(modalStep - 1);
    }
  };

  const getCurrentBranch = () => {
    if (!bpsData?.branches || bpsData.branches.length === 0) return null;
    return bpsData.branches[selectedBranch] || bpsData.branches[0];
  };

  const getFilteredRecords = () => {
    const branch = getCurrentBranch();
    if (!branch) return [];

    let records = branch.bps_records || [];

    if (filterType === 'dps') {
      records = records.filter((record) => record.item_type === 'dps');
    } else if (filterType === 'prs') {
      records = records.filter((record) => record.item_type === 'prs');
    }

    return records.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  useEffect(() => {
    if (!initialData) {
      fetchBPSData();
    }
  }, []);

  const currentBranch = getCurrentBranch();
  const filteredRecords = getFilteredRecords();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              size={20}
              color={theme.colors.headerText}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BPS Management</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={fetchBPSData}>
            <FontAwesomeIcon
              icon={faRefresh}
              size={20}
              color={theme.colors.headerText}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <FontAwesomeIcon
              icon={faPlus}
              size={20}
              color={theme.colors.headerText}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Compact Branch Info Header */}
      {currentBranch && (
        <View style={styles.compactBranchInfo}>
          <View style={styles.compactBranchHeader}>
            <View style={styles.compactBranchDetails}>
              <Text style={styles.compactBranchName}>
                {currentBranch.branch_name}
              </Text>
              <Text style={styles.compactBranchSubtitle}>
                {getValidStudentsCount()} Students • {getTotalClassesCount()}{' '}
                Classes
              </Text>
            </View>

            {/* Branch Selector for Multiple Branches */}
            {bpsData?.branches && bpsData.branches.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.compactBranchSelector}
              >
                {bpsData.branches.map((branch, index) => (
                  <TouchableOpacity
                    key={branch.branch_id}
                    style={[
                      styles.compactBranchTab,
                      selectedBranch === index &&
                        styles.compactBranchTabSelected,
                    ]}
                    onPress={() => setSelectedBranch(index)}
                  >
                    <Text
                      style={[
                        styles.compactBranchTabText,
                        selectedBranch === index &&
                          styles.compactBranchTabTextSelected,
                      ]}
                    >
                      {branch.branch_description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Filter Tabs */}
          <View style={styles.compactFilterTabs}>
            {[
              {
                key: 'all',
                label: 'All',
                count: currentBranch.total_bps_records,
              },
              {
                key: 'prs',
                label: 'Positive',
                count: (currentBranch.bps_records || []).filter(
                  (r) => r.item_type === 'prs'
                ).length,
              },
              {
                key: 'dps',
                label: 'Negative',
                count: (currentBranch.bps_records || []).filter(
                  (r) => r.item_type === 'dps'
                ).length,
              },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.compactFilterTab,
                  filterType === filter.key && styles.compactFilterTabSelected,
                ]}
                onPress={() => setFilterType(filter.key)}
              >
                <Text
                  style={[
                    styles.compactFilterTabText,
                    filterType === filter.key &&
                      styles.compactFilterTabTextSelected,
                  ]}
                >
                  {filter.label}
                </Text>
                <Text
                  style={[
                    styles.compactFilterTabCount,
                    filterType === filter.key &&
                      styles.compactFilterTabCountSelected,
                  ]}
                >
                  {filter.count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Scrollable BPS Records */}
      <ScrollView
        style={styles.recordsScrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchBPSData}
            colors={[theme.colors.secondary]}
            tintColor={theme.colors.secondary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredRecords.length > 0 ? (
          <View style={styles.recordsList}>
            {filteredRecords.map((record, index) => (
              <SwipeableRecord
                key={`${record.discipline_record_id}-${index}`}
                record={record}
                onDelete={deleteBPSRecord}
                canDelete={canDeleteBPS()}
                theme={theme}
              >
                <View
                  style={[
                    styles.recordCard,
                    { marginBottom: canDeleteBPS() ? 0 : 15 },
                  ]}
                >
                  <View style={styles.recordHeader}>
                    <View
                      style={[
                        styles.recordTypeIcon,
                        {
                          backgroundColor:
                            record.item_type === 'prs'
                              ? `${theme.colors.success}1A`
                              : `${theme.colors.error}1A`,
                        },
                      ]}
                    >
                      <FontAwesomeIcon
                        icon={
                          record.item_type === 'prs' ? faThumbsUp : faThumbsDown
                        }
                        size={16}
                        color={
                          record.item_type === 'prs'
                            ? theme.colors.success
                            : theme.colors.error
                        }
                      />
                    </View>
                    <View style={styles.recordInfo}>
                      <Text style={styles.recordTitle}>
                        {record.item_title}
                      </Text>
                      <Text style={styles.studentName}>
                        {record.student_name}
                      </Text>
                      <Text style={styles.classroomName}>
                        {record.classroom_name}
                      </Text>
                    </View>
                    <View style={styles.recordActions}>
                      <View
                        style={[
                          styles.pointsBadge,
                          {
                            backgroundColor:
                              record.item_type === 'prs'
                                ? theme.colors.success
                                : theme.colors.error,
                          },
                        ]}
                      >
                        <Text style={styles.pointsText}>
                          {record.item_point > 0 ? '+' : ''}
                          {record.item_point}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.recordDetails}>
                    <View style={styles.recordMeta}>
                      <FontAwesomeIcon
                        icon={faCalendarAlt}
                        size={12}
                        color={theme.colors.textSecondary}
                      />
                      <Text style={styles.recordDate}>{record.date}</Text>
                    </View>
                    {record.note && (
                      <Text style={styles.recordNote}>{record.note}</Text>
                    )}
                  </View>
                </View>
              </SwipeableRecord>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <FontAwesomeIcon
              icon={faGavel}
              size={48}
              color={theme.colors.textLight}
            />
            <Text style={styles.emptyStateText}>No BPS records found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filterType === 'all'
                ? 'No behavior records have been created yet'
                : `No ${
                    filterType === 'prs' ? 'positive' : 'negative'
                  } records found`}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAddModal(false)}
            >
              <FontAwesomeIcon
                icon={faTimes}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>{getStepTitle()}</Text>
              <Text style={styles.modalSubtitle}>Step {modalStep} of 3</Text>
            </View>
            <View style={styles.modalHeaderRight}>
              {modalStep < 3 ? (
                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    !canProceedToNextStep() && styles.disabledButton,
                  ]}
                  onPress={nextStep}
                  disabled={!canProceedToNextStep()}
                >
                  <Text
                    style={[
                      styles.nextButtonText,
                      !canProceedToNextStep() && styles.disabledButtonText,
                    ]}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    loading && styles.disabledButton,
                  ]}
                  onPress={addBPSRecord}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator
                      size='small'
                      color={theme.colors.headerText}
                    />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.progressContainer}>
            {[1, 2, 3].map((step) => (
              <View key={step} style={styles.progressStep}>
                <View
                  style={[
                    styles.progressDot,
                    modalStep >= step && styles.progressDotActive,
                    modalStep === step && styles.progressDotCurrent,
                  ]}
                />
                {step < 3 && (
                  <View
                    style={[
                      styles.progressLine,
                      modalStep > step && styles.progressLineActive,
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          {modalStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={previousStep}>
              <FontAwesomeIcon
                icon={faArrowLeft}
                size={16}
                color={theme.colors.secondary}
              />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {modalStep === 1 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <FontAwesomeIcon
                    icon={faUser}
                    size={24}
                    color={theme.colors.secondary}
                  />
                  <Text style={styles.stepTitle}>
                    {isMultipleSelection
                      ? 'Choose Students'
                      : 'Choose a Student'}
                  </Text>
                  <Text style={styles.stepDescription}>
                    {isMultipleSelection
                      ? 'Select multiple students to add behavior records for'
                      : 'Select the student you want to add a behavior record for'}
                  </Text>
                </View>

                <View style={styles.selectionModeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.selectionModeButton,
                      !isMultipleSelection && styles.selectedModeButton,
                    ]}
                    onPress={() => {
                      setIsMultipleSelection(false);
                      setSelectedStudents([]);
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faUser}
                      size={16}
                      color={
                        !isMultipleSelection
                          ? theme.colors.headerText
                          : theme.colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.selectionModeText,
                        !isMultipleSelection && styles.selectedModeText,
                      ]}
                    >
                      Single
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.selectionModeButton,
                      isMultipleSelection && styles.selectedModeButton,
                    ]}
                    onPress={() => {
                      setIsMultipleSelection(true);
                      setSelectedStudent(null);
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faUsers}
                      size={16}
                      color={
                        isMultipleSelection
                          ? theme.colors.headerText
                          : theme.colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.selectionModeText,
                        isMultipleSelection && styles.selectedModeText,
                      ]}
                    >
                      Multiple
                    </Text>
                  </TouchableOpacity>
                </View>

                {isMultipleSelection && selectedStudents.length > 0 && (
                  <View style={styles.selectedSummary}>
                    <Text style={styles.selectedSummaryText}>
                      {selectedStudents.length} student
                      {selectedStudents.length !== 1 ? 's' : ''} selected
                    </Text>
                    <TouchableOpacity
                      style={styles.clearAllButton}
                      onPress={() => setSelectedStudents([])}
                    >
                      <Text style={styles.clearAllText}>Clear All</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.searchContainer}>
                  <FontAwesomeIcon
                    icon={faSearch}
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder='Search students by name...'
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize='words'
                    placeholderTextColor={theme.colors.textLight}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearSearchButton}
                      onPress={() => setSearchQuery('')}
                    >
                      <FontAwesomeIcon
                        icon={faTimes}
                        size={14}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {Object.keys(getFilteredStudents()).length > 0 ? (
                  Object.keys(getFilteredStudents())
                    .sort((a, b) => {
                      // Natural sort for class names with numbers (e.g., Year 2, Year 10, Year 11)
                      return a.localeCompare(b, undefined, {
                        numeric: true,
                        sensitivity: 'base',
                      });
                    })
                    .map((className) => {
                      const students = getFilteredStudents()[className];
                      const isExpanded = expandedClasses.has(className);

                      return (
                        <View key={className} style={styles.classGroup}>
                          <View style={styles.classHeaderContainer}>
                            <TouchableOpacity
                              style={styles.classHeader}
                              onPress={() => toggleClassExpansion(className)}
                            >
                              <FontAwesomeIcon
                                icon={
                                  isExpanded ? faChevronDown : faChevronRight
                                }
                                size={14}
                                color={theme.colors.textSecondary}
                              />
                              <FontAwesomeIcon
                                icon={faUsers}
                                size={16}
                                color={theme.colors.secondary}
                                style={styles.classIcon}
                              />
                              <Text style={styles.className}>{className}</Text>
                              <View style={styles.studentCount}>
                                <Text style={styles.studentCountText}>
                                  {getClassStudentCount(className)}
                                </Text>
                              </View>
                            </TouchableOpacity>

                            {isMultipleSelection && (
                              <TouchableOpacity
                                style={[
                                  styles.selectAllButton,
                                  isWholeClassSelected(className) &&
                                    styles.selectAllButtonSelected,
                                ]}
                                onPress={() => selectWholeClass(className)}
                              >
                                <FontAwesomeIcon
                                  icon={
                                    isWholeClassSelected(className)
                                      ? faCheckSquare
                                      : faSquare
                                  }
                                  size={14}
                                  color={
                                    isWholeClassSelected(className)
                                      ? theme.colors.secondary
                                      : theme.colors.textSecondary
                                  }
                                />
                                <Text
                                  style={[
                                    styles.selectAllText,
                                    isWholeClassSelected(className) &&
                                      styles.selectAllTextSelected,
                                  ]}
                                >
                                  {isWholeClassSelected(className)
                                    ? 'Deselect All'
                                    : 'Select All'}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>

                          {isExpanded && (
                            <View style={styles.studentsContainer}>
                              {students.map((student) => {
                                const isSelected = isStudentSelected(student);
                                return (
                                  <TouchableOpacity
                                    key={student.student_id}
                                    style={[
                                      styles.studentItem,
                                      isSelected && styles.selectedStudentItem,
                                    ]}
                                    onPress={() =>
                                      handleStudentSelection(student)
                                    }
                                  >
                                    {isMultipleSelection ? (
                                      <FontAwesomeIcon
                                        icon={
                                          isSelected ? faCheckSquare : faSquare
                                        }
                                        size={16}
                                        color={
                                          isSelected
                                            ? theme.colors.secondary
                                            : theme.colors.textLight
                                        }
                                      />
                                    ) : (
                                      <FontAwesomeIcon
                                        icon={faUser}
                                        size={14}
                                        color={
                                          isSelected
                                            ? theme.colors.secondary
                                            : theme.colors.textLight
                                        }
                                      />
                                    )}
                                    <Text
                                      style={[
                                        styles.modalStudentName,
                                        isSelected &&
                                          styles.selectedModalStudentName,
                                      ]}
                                    >
                                      {student.name}
                                    </Text>
                                    {isSelected && !isMultipleSelection && (
                                      <FontAwesomeIcon
                                        icon={faCheck}
                                        size={14}
                                        color={theme.colors.secondary}
                                      />
                                    )}
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      );
                    })
                ) : (
                  <View style={styles.noStudentsFound}>
                    <FontAwesomeIcon
                      icon={faSearch}
                      size={32}
                      color={theme.colors.textLight}
                    />
                    <Text style={styles.noStudentsText}>
                      {searchQuery
                        ? 'No students found matching your search'
                        : 'No students with valid classrooms available'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {modalStep === 2 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <FontAwesomeIcon
                    icon={faGavel}
                    size={24}
                    color={theme.colors.secondary}
                  />
                  <Text style={styles.stepTitle}>Choose Behavior Type</Text>
                  <Text style={styles.stepDescription}>
                    Select the type of behavior you want to record
                  </Text>
                </View>

                {(selectedStudent || selectedStudents.length > 0) && (
                  <View style={styles.selectedStudentInfo}>
                    <FontAwesomeIcon
                      icon={isMultipleSelection ? faUsers : faUser}
                      size={16}
                      color={theme.colors.secondary}
                    />
                    <Text style={styles.selectedStudentText}>
                      {isMultipleSelection
                        ? `${selectedStudents.length} students selected`
                        : `${selectedStudent.name} - ${selectedStudent.classroom_name}`}
                    </Text>
                  </View>
                )}

                {selectedItems.length > 0 && (
                  <View style={styles.selectedBehaviorsContainer}>
                    <View style={styles.selectedBehaviorsHeader}>
                      <Text style={styles.selectedBehaviorsTitle}>
                        Selected Behaviors ({selectedItems.length})
                      </Text>
                      <TouchableOpacity
                        style={styles.clearAllBehaviorsButton}
                        onPress={() => {
                          setSelectedItems([]);
                          setSelectedItem(null);
                        }}
                      >
                        <Text style={styles.clearAllBehaviorsText}>
                          Clear All
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.selectedBehaviorsList}>
                      {selectedItems.map((behavior) => (
                        <View
                          key={behavior.discipline_item_id}
                          style={styles.selectedBehaviorChip}
                        >
                          <FontAwesomeIcon
                            icon={
                              behavior.item_type === 'prs'
                                ? faThumbsUp
                                : faThumbsDown
                            }
                            size={12}
                            color={
                              behavior.item_type === 'prs'
                                ? theme.colors.success
                                : theme.colors.error
                            }
                          />
                          <Text style={styles.selectedBehaviorChipText}>
                            {behavior.item_title} (
                            {behavior.item_point > 0 ? '+' : ''}
                            {behavior.item_point})
                          </Text>
                          <TouchableOpacity
                            style={styles.removeBehaviorButton}
                            onPress={() => {
                              setSelectedItems(
                                selectedItems.filter(
                                  (item) =>
                                    item.discipline_item_id !==
                                    behavior.discipline_item_id
                                )
                              );
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faTimes}
                              size={10}
                              color={theme.colors.textSecondary}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {!selectedBehaviorType && (
                  <View style={styles.behaviorTypeContainer}>
                    <TouchableOpacity
                      style={[styles.behaviorTypeTab, styles.positiveTab]}
                      onPress={() => handleBehaviorCategorySelect('prs')}
                    >
                      <FontAwesomeIcon
                        icon={faThumbsUp}
                        size={20}
                        color={theme.colors.success}
                      />
                      <Text style={styles.behaviorTypeTabText}>
                        Positive Behavior
                      </Text>
                      <Text style={styles.behaviorTypeSubtext}>
                        Recognize good conduct
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.behaviorTypeTab, styles.negativeTab]}
                      onPress={() => handleBehaviorCategorySelect('dps')}
                    >
                      <FontAwesomeIcon
                        icon={faThumbsDown}
                        size={20}
                        color={theme.colors.error}
                      />
                      <Text style={styles.behaviorTypeTabText}>
                        Negative Behavior
                      </Text>
                      <Text style={styles.behaviorTypeSubtext}>
                        Address misconduct
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedBehaviorType && (
                  <View style={styles.behaviorSelectionContainer}>
                    <View style={styles.behaviorSelectionHeader}>
                      <TouchableOpacity
                        style={styles.backToCategoriesButton}
                        onPress={() => setSelectedBehaviorType(null)}
                      >
                        <FontAwesomeIcon
                          icon={faArrowLeft}
                          size={16}
                          color={theme.colors.secondary}
                        />
                        <Text style={styles.backToCategoriesText}>
                          Back to Categories
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.behaviorSelectionTitle}>
                        {selectedBehaviorType === 'prs'
                          ? 'Positive Behaviors'
                          : 'Negative Behaviors'}
                      </Text>
                      <Text style={styles.behaviorSelectionSubtitle}>
                        Tap to select multiple behaviors
                      </Text>
                    </View>

                    <View style={styles.behaviorItemsContainer}>
                      {getFilteredBehaviorItems().length > 0 ? (
                        getFilteredBehaviorItems().map((item) => {
                          const isSelected = isBehaviorItemSelected(item);
                          return (
                            <TouchableOpacity
                              key={item.discipline_item_id}
                              style={[
                                styles.behaviorItem,
                                isSelected && styles.behaviorItemSelected,
                              ]}
                              onPress={() => handleBehaviorItemSelect(item)}
                            >
                              <View
                                style={[
                                  styles.behaviorItemIcon,
                                  isSelected && styles.behaviorItemIconSelected,
                                ]}
                              >
                                <FontAwesomeIcon
                                  icon={
                                    selectedBehaviorType === 'prs'
                                      ? faThumbsUp
                                      : faThumbsDown
                                  }
                                  size={16}
                                  color={
                                    isSelected
                                      ? theme.colors.headerText
                                      : selectedBehaviorType === 'prs'
                                      ? theme.colors.success
                                      : theme.colors.error
                                  }
                                />
                              </View>
                              <View style={styles.behaviorItemInfo}>
                                <Text
                                  style={[
                                    styles.behaviorItemTitle,
                                    isSelected &&
                                      styles.behaviorItemTitleSelected,
                                  ]}
                                >
                                  {item.item_title}
                                </Text>
                                <Text
                                  style={[
                                    styles.behaviorItemPoints,
                                    isSelected &&
                                      styles.behaviorItemPointsSelected,
                                  ]}
                                >
                                  {item.item_point > 0 ? '+' : ''}
                                  {item.item_point} points
                                </Text>
                              </View>
                              <FontAwesomeIcon
                                icon={isSelected ? faCheck : faChevronRight}
                                size={14}
                                color={
                                  isSelected
                                    ? theme.colors.success
                                    : theme.colors.textSecondary
                                }
                              />
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <View style={styles.noBehaviorItems}>
                          <FontAwesomeIcon
                            icon={
                              selectedBehaviorType === 'prs'
                                ? faThumbsUp
                                : faThumbsDown
                            }
                            size={32}
                            color={theme.colors.textLight}
                          />
                          <Text style={styles.noBehaviorItemsText}>
                            No{' '}
                            {selectedBehaviorType === 'prs'
                              ? 'positive'
                              : 'negative'}{' '}
                            behaviors found.
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            {modalStep === 3 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <FontAwesomeIcon
                    icon={faCheck}
                    size={24}
                    color={theme.colors.success}
                  />
                  <Text style={styles.stepTitle}>Review & Submit</Text>
                  <Text style={styles.stepDescription}>
                    Review the details and add an optional note
                  </Text>
                </View>

                <View style={styles.reviewSummary}>
                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewLabel}>
                      {isMultipleSelection ? 'Students:' : 'Student:'}
                    </Text>
                    <Text style={styles.reviewValue}>
                      {isMultipleSelection
                        ? `${selectedStudents.length} students selected`
                        : `${selectedStudent?.name} (${selectedStudent?.classroom_name})`}
                    </Text>
                  </View>

                  {isMultipleSelection && selectedStudents.length > 0 && (
                    <View style={styles.selectedStudentsList}>
                      <ScrollView
                        style={styles.allStudentsScrollView}
                        nestedScrollEnabled={true}
                      >
                        {selectedStudents.map((student) => (
                          <Text
                            key={student.student_id}
                            style={styles.selectedStudentItemText}
                          >
                            {student.name} ({student.classroom_name})
                          </Text>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewLabel}>
                      {selectedItems.length > 1 ? 'Behaviors:' : 'Behavior:'}
                    </Text>
                    {selectedItems.length > 0 ? (
                      <View style={styles.reviewBehaviorsList}>
                        {selectedItems.map((behavior) => (
                          <View
                            key={behavior.discipline_item_id}
                            style={styles.reviewBehaviorItem}
                          >
                            <FontAwesomeIcon
                              icon={
                                behavior.item_type === 'prs'
                                  ? faThumbsUp
                                  : faThumbsDown
                              }
                              size={12}
                              color={
                                behavior.item_type === 'prs'
                                  ? theme.colors.success
                                  : theme.colors.error
                              }
                            />
                            <Text style={styles.reviewBehaviorText}>
                              {behavior.item_title} (
                              {behavior.item_point > 0 ? '+' : ''}
                              {behavior.item_point} pts)
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.reviewValue}>
                        {selectedItem?.item_title || 'No behavior selected'}
                      </Text>
                    )}
                  </View>

                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewLabel}>
                      Total Points per Student:
                    </Text>
                    <Text
                      style={[
                        styles.reviewValue,
                        styles.reviewPoints,
                        {
                          color:
                            getTotalPoints() > 0
                              ? theme.colors.success
                              : getTotalPoints() < 0
                              ? theme.colors.error
                              : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {getTotalPoints() > 0 ? '+' : ''}
                      {getTotalPoints()}
                    </Text>
                  </View>

                  {(isMultipleSelection ? selectedStudents.length : 1) > 1 && (
                    <View style={styles.reviewItem}>
                      <Text style={styles.reviewLabel}>
                        Grand Total Points:
                      </Text>
                      <Text
                        style={[
                          styles.reviewValue,
                          styles.reviewPoints,
                          {
                            color:
                              getTotalPoints() > 0
                                ? theme.colors.success
                                : getTotalPoints() < 0
                                ? theme.colors.error
                                : theme.colors.textSecondary,
                          },
                        ]}
                      >
                        {getTotalPoints() > 0 ? '+' : ''}
                        {getTotalPoints() *
                          (isMultipleSelection ? selectedStudents.length : 1)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.noteSection}>
                  <Text style={styles.noteSectionTitle}>
                    Add Note (Optional)
                  </Text>
                  <TextInput
                    style={styles.noteInput}
                    placeholder='Add additional details about this behavior...'
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={4}
                    textAlignVertical='top'
                    placeholderTextColor={theme.colors.textLight}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size='large' color={theme.colors.secondary} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (theme) =>
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
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${theme.colors.headerText}33`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.success,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      color: theme.colors.headerText,
      fontSize: 22,
      fontWeight: 'bold',
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },

    // Compact Branch Info Styles
    compactBranchInfo: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 15,
      marginVertical: 10,
      borderRadius: 12,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    compactBranchHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      paddingBottom: 10,
    },
    compactBranchDetails: {
      flex: 1,
    },
    compactBranchName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    compactBranchSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    compactBranchSelector: {
      maxWidth: 150,
    },
    compactBranchTab: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      marginLeft: 8,
    },
    compactBranchTabSelected: {
      backgroundColor: theme.colors.secondary,
    },
    compactBranchTabText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    compactBranchTabTextSelected: {
      color: theme.colors.headerText,
    },
    compactFilterTabs: {
      flexDirection: 'row',
      paddingHorizontal: 15,
      paddingBottom: 15,
    },
    compactFilterTab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      marginHorizontal: 4,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
    },
    compactFilterTabSelected: {
      backgroundColor: theme.colors.secondary,
    },
    compactFilterTabText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      marginBottom: 2,
    },
    compactFilterTabTextSelected: {
      color: theme.colors.headerText,
    },
    compactFilterTabCount: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: 'bold',
    },
    compactFilterTabCountSelected: {
      color: theme.colors.headerText,
    },

    // Scrollable Records Styles
    recordsScrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    recordsList: {
      padding: 15,
    },

    recordCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 4,
    },
    recordHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    recordTypeIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    recordInfo: {
      flex: 1,
    },
    recordTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    studentName: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    classroomName: {
      fontSize: 12,
      color: theme.colors.textLight,
    },
    recordActions: {
      alignItems: 'center',
    },
    pointsBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 8,
    },
    pointsText: {
      color: theme.colors.headerText,
      fontSize: 12,
      fontWeight: 'bold',
    },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${theme.colors.error}1A`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    recordDetails: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    recordMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    recordDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: 6,
    },
    recordNote: {
      fontSize: 14,
      color: theme.colors.text,
      fontStyle: 'italic',
    },

    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      marginTop: 15,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: theme.colors.textLight,
      textAlign: 'center',
    },

    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalTitleContainer: {
      flex: 1,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    modalSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    modalHeaderRight: {
      width: 80,
      alignItems: 'flex-end',
    },
    nextButton: {
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    nextButtonText: {
      color: theme.colors.headerText,
      fontSize: 14,
      fontWeight: '600',
    },
    submitButton: {
      backgroundColor: theme.colors.success,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },
    submitButtonText: {
      color: theme.colors.headerText,
      fontSize: 14,
      fontWeight: '600',
    },
    disabledButton: {
      backgroundColor: theme.colors.border,
    },
    disabledButtonText: {
      color: theme.colors.textLight,
    },

    progressContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 20,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    progressStep: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    progressDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.border,
    },
    progressDotActive: {
      backgroundColor: theme.colors.secondary,
    },
    progressDotCurrent: {
      backgroundColor: theme.colors.secondary,
      transform: [{ scale: 1.2 }],
    },
    progressLine: {
      width: 40,
      height: 2,
      backgroundColor: theme.colors.border,
      marginHorizontal: 8,
    },
    progressLineActive: {
      backgroundColor: theme.colors.secondary,
    },

    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButtonText: {
      color: theme.colors.secondary,
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 8,
    },

    modalContent: {
      flex: 1,
      padding: 20,
    },

    stepContainer: {
      flex: 1,
    },
    stepHeader: {
      alignItems: 'center',
      marginBottom: 30,
      paddingVertical: 20,
    },
    stepTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 15,
      marginBottom: 8,
    },
    stepDescription: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },

    selectedStudentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${theme.colors.secondary}1A`,
      padding: 15,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.secondary,
    },
    selectedStudentText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.secondary,
      marginLeft: 10,
    },

    behaviorTypeTabs: {
      flexDirection: 'row',
      marginBottom: 25,
      gap: 15,
    },
    behaviorTypeTab: {
      flex: 1,
      alignItems: 'center',
      padding: 20,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    positiveTab: {
      borderWidth: 2,
      borderColor: `${theme.colors.success}33`,
    },
    negativeTab: {
      borderWidth: 2,
      borderColor: `${theme.colors.error}33`,
    },
    behaviorTypeTabText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 10,
      marginBottom: 5,
    },
    behaviorTypeSubtext: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },

    behaviorItemsContainer: {
      flex: 1,
    },
    itemCategoryTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
      marginTop: 10,
    },
    behaviorItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: 20,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    behaviorItemSelected: {
      borderWidth: 2,
      borderColor: theme.colors.secondary,
      backgroundColor: `${theme.colors.secondary}0D`,
    },
    selectedBehaviorItem: {
      borderWidth: 2,
      borderColor: theme.colors.secondary,
      backgroundColor: `${theme.colors.secondary}0D`,
    },
    behaviorItemIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    behaviorItemIconSelected: {
      backgroundColor: theme.colors.secondary,
    },
    behaviorItemInfo: {
      flex: 1,
    },
    behaviorItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    behaviorItemTitleSelected: {
      color: theme.colors.secondary,
    },
    behaviorItemPoints: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    behaviorItemPointsSelected: {
      color: theme.colors.secondary,
    },

    modalSection: {
      marginBottom: 25,
    },
    modalSectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    itemTypeTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginTop: 15,
      marginBottom: 10,
    },
    selectionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    selectedItem: {
      borderWidth: 2,
      borderColor: theme.colors.secondary,
    },
    selectionInfo: {
      flex: 1,
      marginLeft: 12,
    },
    selectionName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    selectedText: {
      color: theme.colors.secondary,
    },
    selectionSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },

    reviewSummary: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 25,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    reviewItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    reviewLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    reviewValue: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      flex: 1,
      textAlign: 'right',
      marginLeft: 15,
    },
    reviewPoints: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    reviewBehaviorsList: {
      flex: 1,
      alignItems: 'flex-end',
      marginLeft: 15,
    },
    reviewBehaviorItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      marginBottom: 4,
      alignSelf: 'flex-end',
    },
    reviewBehaviorText: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: 6,
      fontWeight: '500',
    },

    noteSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    noteSectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    noteInput: {
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 15,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 100,
      textAlignVertical: 'top',
    },

    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 10,
    },
    clearSearchButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
    },

    classGroup: {
      marginBottom: 15,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    classHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    classIcon: {
      marginLeft: 10,
      marginRight: 12,
    },
    className: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    studentCount: {
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    studentCountText: {
      color: theme.colors.headerText,
      fontSize: 12,
      fontWeight: 'bold',
    },
    studentsContainer: {
      paddingHorizontal: 15,
      paddingVertical: 15,
    },
    studentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: theme.colors.background,
    },
    selectedStudentItem: {
      backgroundColor: `${theme.colors.secondary}1A`,
      borderWidth: 1,
      borderColor: theme.colors.secondary,
    },
    selectedStudentItemText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4, // Adjusted slightly for better spacing in a list
      // Ensure this style provides enough distinction for each item
    },
    modalStudentName: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.text,
      marginLeft: 10,
      fontWeight: '500',
    },
    selectedModalStudentName: {
      color: theme.colors.secondary,
      fontWeight: '600',
    },

    noStudentsFound: {
      alignItems: 'center',
      paddingVertical: 40,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 20,
    },
    noStudentsText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 15,
      textAlign: 'center',
    },

    selectionModeContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
    },
    selectionModeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: 'transparent',
    },
    selectedModeButton: {
      backgroundColor: theme.colors.secondary,
    },
    selectionModeText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginLeft: 6,
    },
    selectedModeText: {
      color: theme.colors.headerText,
    },

    selectedSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: `${theme.colors.secondary}1A`,
      padding: 12,
      borderRadius: 8,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: theme.colors.secondary,
    },
    selectedSummaryText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.secondary,
    },
    clearAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.error,
      borderRadius: 6,
    },
    clearAllText: {
      color: theme.colors.headerText,
      fontSize: 12,
      fontWeight: '600',
    },

    classHeaderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },

    selectAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: theme.colors.background,
    },
    selectAllButtonSelected: {
      backgroundColor: `${theme.colors.secondary}1A`,
    },
    selectAllText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      marginLeft: 4,
    },
    selectAllTextSelected: {
      color: theme.colors.secondary,
    },

    selectedStudentsList: {
      marginTop: 5,
      // Add any existing padding/margin here if needed, e.g., paddingHorizontal: 10
    },
    allStudentsScrollView: {
      maxHeight: 120, // Adjust as needed, e.g., for 4-5 items
      paddingVertical: 5, // Optional: for some spacing within the scroll view
    },

    selectedBehaviorsContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 20,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    selectedBehaviorsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    selectedBehaviorsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    clearAllBehaviorsButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.error,
      borderRadius: 6,
    },
    clearAllBehaviorsText: {
      color: theme.colors.headerText,
      fontSize: 12,
      fontWeight: '600',
    },
    selectedBehaviorsList: {
      padding: 16,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    selectedBehaviorChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    selectedBehaviorChipText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.text,
      marginLeft: 6,
      marginRight: 8,
    },
    removeBehaviorButton: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },

    selectedBehaviorDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    selectedBehaviorIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    selectedBehaviorInfo: {
      flex: 1,
    },
    selectedBehaviorTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    selectedBehaviorPoints: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    changeBehaviorButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.secondary,
      borderRadius: 6,
    },
    changeBehaviorText: {
      color: theme.colors.headerText,
      fontSize: 12,
      fontWeight: '600',
    },

    behaviorTypeContainer: {
      gap: 15,
    },

    behaviorSelectionContainer: {
      flex: 1,
    },
    behaviorSelectionHeader: {
      marginBottom: 20,
    },
    backToCategoriesButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: `${theme.colors.secondary}1A`,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginBottom: 15,
    },
    backToCategoriesText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.secondary,
      marginLeft: 6,
    },
    behaviorSelectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    behaviorSelectionSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },

    noBehaviorItems: {
      alignItems: 'center',
      paddingVertical: 40,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 20,
    },
    noBehaviorItemsText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 15,
      textAlign: 'center',
    },

    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: `${theme.colors.shadow}80`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: theme.colors.headerText,
      fontSize: 16,
      marginTop: 10,
      fontWeight: '500',
    },
  });
