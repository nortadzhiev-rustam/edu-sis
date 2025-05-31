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
import {
  faArrowLeft,
  faGavel,
  faPlus,
  faBuilding,
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
  faUserCheck,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons';

export default function TeacherBPS({ route, navigation }) {
  const { authCode, teacherName, bpsData: initialData } = route.params || {};

  const [bpsData, setBpsData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]); // For multiple selection
  const [selectedItem, setSelectedItem] = useState(null); // For single behavior (legacy)
  const [selectedItems, setSelectedItems] = useState([]); // For multiple behaviors
  const [note, setNote] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'dps', 'prs'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClasses, setExpandedClasses] = useState(new Set());
  const [modalStep, setModalStep] = useState(1); // 1: Student, 2: Behavior, 3: Review
  const [isMultipleSelection, setIsMultipleSelection] = useState(false);
  const [submissionErrors, setSubmissionErrors] = useState([]);
  const [selectedBehaviorType, setSelectedBehaviorType] = useState(null); // 'prs' or 'dps'
  const [isMultipleBehaviorMode, setIsMultipleBehaviorMode] = useState(true); // Enable multiple behavior selection by default

  // Fetch fresh BPS data
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
      } else {
        Alert.alert('Error', 'Failed to fetch BPS data');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setRefreshing(false);
    }
  };

  // Add new BPS record(s)
  const addBPSRecord = async () => {
    const studentsToProcess = isMultipleSelection
      ? selectedStudents
      : [selectedStudent];

    // Check if we have selected behaviors (support both single and multiple)
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

    setLoading(true);
    setSubmissionErrors([]);

    const errors = [];
    let successCount = 0;
    const totalExpectedRecords =
      studentsToProcess.length * behaviorsToSubmit.length;

    try {
      const url = buildApiUrl(Config.API_ENDPOINTS.STORE_BPS);

      // Process each student with each behavior
      for (const student of studentsToProcess) {
        for (const behavior of behaviorsToSubmit) {
          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                authCode: authCode,
                student_id: student.student_id,
                discipline_item_id: behavior.discipline_item_id,
                note: note.trim(),
              }),
            });

            if (response.ok) {
              successCount++;
            } else {
              const errorText = await response.text();
              errors.push(
                `${student.name} - ${behavior.item_title}: ${
                  errorText || 'Failed to add record'
                }`
              );
            }
          } catch (studentError) {
            errors.push(
              `${student.name} - ${behavior.item_title}: Network error`
            );
          }
        }
      }

      // Show results
      if (errors.length === 0) {
        Alert.alert(
          'Success',
          `All ${successCount} BPS record(s) added successfully!`
        );
        setShowAddModal(false);
        resetForm();
        await fetchBPSData();
      } else if (successCount > 0) {
        Alert.alert(
          'Partial Success',
          `${successCount} record(s) added successfully.\n\nErrors:\n${errors.join(
            '\n'
          )}`,
          [
            {
              text: 'Continue',
              onPress: () => {
                setShowAddModal(false);
                resetForm();
                fetchBPSData();
              },
            },
            { text: 'Review Errors', style: 'cancel' },
          ]
        );
        setSubmissionErrors(errors);
      } else {
        Alert.alert(
          'All Failed',
          `Failed to add any records:\n\n${errors.join('\n')}`,
          [{ text: 'OK' }]
        );
        setSubmissionErrors(errors);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred while processing requests');
      setSubmissionErrors(['Network error occurred']);
    } finally {
      setLoading(false);
    }
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
    setSubmissionErrors([]);
    setSelectedBehaviorType(null);

    // Auto-expand the first class when modal opens
    const groupedStudents = getGroupedStudents();
    const firstClassName = Object.keys(groupedStudents).sort((a, b) =>
      a.localeCompare(b)
    )[0];
    if (firstClassName) {
      setExpandedClasses(new Set([firstClassName]));
    } else {
      setExpandedClasses(new Set());
    }
  };

  // Group students by classroom
  const getGroupedStudents = () => {
    const branch = getCurrentBranch();
    if (!branch?.students) return {};

    const grouped = {};
    branch.students.forEach((student) => {
      // Filter out students without a valid classroom
      if (!student.classroom_name || student.classroom_name.trim() === '') {
        return; // Skip this student
      }

      const className = student.classroom_name;
      if (!grouped[className]) {
        grouped[className] = [];
      }
      grouped[className].push(student);
    });

    // Sort students within each class by name
    Object.keys(grouped).forEach((className) => {
      grouped[className].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  };

  // Filter students by search query
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

  // Toggle class expansion
  const toggleClassExpansion = (className) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(className)) {
      newExpanded.delete(className);
    } else {
      newExpanded.add(className);
    }
    setExpandedClasses(newExpanded);
  };

  // Handle student selection (single or multiple)
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

  // Select all students in a class
  const selectWholeClass = (className) => {
    const groupedStudents = getFilteredStudents();
    const classStudents = groupedStudents[className] || [];

    if (isMultipleSelection) {
      // Check if all students in this class are already selected
      const allSelected = classStudents.every((student) =>
        selectedStudents.some((s) => s.student_id === student.student_id)
      );

      if (allSelected) {
        // Deselect all students from this class
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
        // Select all students from this class (avoiding duplicates)
        const newSelections = classStudents.filter(
          (student) =>
            !selectedStudents.some((s) => s.student_id === student.student_id)
        );
        setSelectedStudents([...selectedStudents, ...newSelections]);
      }
    }
  };

  // Check if a student is selected
  const isStudentSelected = (student) => {
    if (isMultipleSelection) {
      return selectedStudents.some((s) => s.student_id === student.student_id);
    } else {
      return selectedStudent?.student_id === student.student_id;
    }
  };

  // Check if all students in a class are selected
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

  // Handle behavior category selection
  const handleBehaviorCategorySelect = (behaviorType) => {
    setSelectedBehaviorType(behaviorType);
    // Don't use separate modal, just show the list inline
  };

  // Handle behavior item selection (supports multiple selection)
  const handleBehaviorItemSelect = (item) => {
    // Check if item is already selected
    const isAlreadySelected = selectedItems.some(
      (selectedItem) =>
        selectedItem.discipline_item_id === item.discipline_item_id
    );

    if (isAlreadySelected) {
      // Remove from selection
      setSelectedItems(
        selectedItems.filter(
          (selectedItem) =>
            selectedItem.discipline_item_id !== item.discipline_item_id
        )
      );
    } else {
      // Add to selection
      setSelectedItems([...selectedItems, item]);
    }

    // Keep legacy single selection for backward compatibility
    setSelectedItem(item);
  };

  // Check if a behavior item is selected
  const isBehaviorItemSelected = (item) => {
    return selectedItems.some(
      (selectedItem) =>
        selectedItem.discipline_item_id === item.discipline_item_id
    );
  };

  // Clear all selected behaviors
  const clearSelectedBehaviors = () => {
    setSelectedItems([]);
    setSelectedItem(null);
    setSelectedBehaviorType(null);
  };

  // Calculate total points from selected behaviors
  const getTotalPoints = () => {
    if (selectedItems.length > 0) {
      return selectedItems.reduce(
        (total, behavior) => total + (behavior.item_point || 0),
        0
      );
    }
    return selectedItem?.item_point || 0;
  };

  // Get filtered behavior items by type
  const getFilteredBehaviorItems = () => {
    if (!selectedBehaviorType) return [];

    // Try multiple sources for discipline items
    let disciplineItems = null;

    // 1. Try current branch discipline_items
    const branch = getCurrentBranch();
    if (branch?.discipline_items) {
      disciplineItems = branch.discipline_items;
    }
    // 2. Try global bpsData discipline_items
    else if (bpsData?.discipline_items) {
      disciplineItems = bpsData.discipline_items;
    }
    // 3. Try first branch if available
    else if (bpsData?.branches?.[0]?.discipline_items) {
      disciplineItems = bpsData.branches[0].discipline_items;
    }

    // If we have discipline items, filter by type
    if (disciplineItems) {
      // Handle array structure (most common)
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

      // Handle object structure with separate arrays
      if (typeof disciplineItems === 'object') {
        if (selectedBehaviorType === 'dps' && disciplineItems.dps_items) {
          return disciplineItems.dps_items;
        }

        if (selectedBehaviorType === 'prs' && disciplineItems.prs_items) {
          return disciplineItems.prs_items;
        }
      }
    }

    // Log when falling back to dummy data (can be removed in production)
    console.log(
      'No discipline items found in API data, using fallback dummy data'
    );

    // Fallback to dummy data if no real data is available
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

  // Get count of students with valid classrooms
  const getValidStudentsCount = () => {
    const branch = getCurrentBranch();
    if (!branch?.students) return 0;

    return branch.students.filter(
      (student) =>
        student.classroom_name && student.classroom_name.trim() !== ''
    ).length;
  };

  // Modal step navigation
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

  // Get current branch data
  const getCurrentBranch = () => {
    if (!bpsData?.branches || bpsData.branches.length === 0) return null;
    return bpsData.branches[selectedBranch] || bpsData.branches[0];
  };

  // Get filtered records
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={20} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BPS Management</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={fetchBPSData}>
            <FontAwesomeIcon icon={faRefresh} size={20} color='#fff' />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <FontAwesomeIcon icon={faPlus} size={20} color='#fff' />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchBPSData}
            colors={['#007AFF']}
            tintColor='#007AFF'
          />
        }
      >
        {/* Teacher Info */}
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherName}>{teacherName}</Text>
          <Text style={styles.teacherSubtitle}>BPS Management Dashboard</Text>
        </View>

        {/* Branch Selector */}
        {bpsData?.branches && bpsData.branches.length > 1 && (
          <View style={styles.branchSelector}>
            <Text style={styles.sectionTitle}>Select Branch</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {bpsData.branches.map((branch, index) => (
                <TouchableOpacity
                  key={branch.branch_id}
                  style={[
                    styles.branchTab,
                    selectedBranch === index && styles.selectedBranchTab,
                  ]}
                  onPress={() => setSelectedBranch(index)}
                >
                  <FontAwesomeIcon
                    icon={faBuilding}
                    size={16}
                    color={selectedBranch === index ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.branchTabText,
                      selectedBranch === index && styles.selectedBranchTabText,
                    ]}
                  >
                    {branch.branch_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Current Branch Info */}
        {currentBranch && (
          <View style={styles.branchInfo}>
            <View style={styles.branchHeader}>
              <View style={styles.branchIconContainer}>
                <FontAwesomeIcon icon={faBuilding} size={20} color='#007AFF' />
              </View>
              <View style={styles.branchDetails}>
                <Text style={styles.branchName}>
                  {currentBranch.branch_name}
                </Text>
                <Text style={styles.branchSubtitle}>
                  Academic Year: {currentBranch.academic_year_id}
                </Text>
              </View>
            </View>

            <View style={styles.branchStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{getValidStudentsCount()}</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {currentBranch.total_bps_records}
                </Text>
                <Text style={styles.statLabel}>BPS Records</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {
                    (currentBranch.bps_records || []).filter(
                      (r) => r.item_type === 'prs'
                    ).length
                  }
                </Text>
                <Text style={styles.statLabel}>Positive</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {
                    (currentBranch.bps_records || []).filter(
                      (r) => r.item_type === 'dps'
                    ).length
                  }
                </Text>
                <Text style={styles.statLabel}>Negative</Text>
              </View>
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <Text style={styles.sectionTitle}>Filter Records</Text>
          <View style={styles.filterTabs}>
            {[
              { key: 'all', label: 'All Records', icon: faGavel },
              { key: 'prs', label: 'Positive', icon: faThumbsUp },
              { key: 'dps', label: 'Negative', icon: faThumbsDown },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterTab,
                  filterType === filter.key && styles.selectedFilterTab,
                ]}
                onPress={() => setFilterType(filter.key)}
              >
                <FontAwesomeIcon
                  icon={filter.icon}
                  size={16}
                  color={filterType === filter.key ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    filterType === filter.key && styles.selectedFilterTabText,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* BPS Records List */}
        <View style={styles.recordsContainer}>
          <Text style={styles.sectionTitle}>
            BPS Records ({filteredRecords.length})
          </Text>

          {filteredRecords.length > 0 ? (
            filteredRecords.map((record, index) => (
              <View
                key={`${record.discipline_record_id}-${index}`}
                style={styles.recordCard}
              >
                <View style={styles.recordHeader}>
                  <View
                    style={[
                      styles.recordTypeIcon,
                      {
                        backgroundColor:
                          record.item_type === 'prs'
                            ? '#34C75915'
                            : '#FF3B3015',
                      },
                    ]}
                  >
                    <FontAwesomeIcon
                      icon={
                        record.item_type === 'prs' ? faThumbsUp : faThumbsDown
                      }
                      size={16}
                      color={record.item_type === 'prs' ? '#34C759' : '#FF3B30'}
                    />
                  </View>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordTitle}>{record.item_title}</Text>
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
                            record.item_type === 'prs' ? '#34C759' : '#FF3B30',
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
                      color='#666'
                    />
                    <Text style={styles.recordDate}>{record.date}</Text>
                  </View>
                  {record.note && (
                    <Text style={styles.recordNote}>{record.note}</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesomeIcon icon={faGavel} size={48} color='#ccc' />
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
        </View>
      </ScrollView>

      {/* Add BPS Modal */}
      <Modal
        visible={showAddModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAddModal(false)}
            >
              <FontAwesomeIcon icon={faTimes} size={20} color='#666' />
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
                    <ActivityIndicator size='small' color='#fff' />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Progress Indicator */}
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

          {/* Back Button */}
          {modalStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={previousStep}>
              <FontAwesomeIcon icon={faArrowLeft} size={16} color='#007AFF' />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Step 1: Student Selection */}
            {modalStep === 1 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <FontAwesomeIcon icon={faUser} size={24} color='#007AFF' />
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

                {/* Selection Mode Toggle */}
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
                      color={!isMultipleSelection ? '#fff' : '#666'}
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
                      color={isMultipleSelection ? '#fff' : '#666'}
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

                {/* Selected Students Summary */}
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

                {/* Search Input */}
                <View style={styles.searchContainer}>
                  <FontAwesomeIcon icon={faSearch} size={16} color='#666' />
                  <TextInput
                    style={styles.searchInput}
                    placeholder='Search students by name...'
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize='words'
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearSearchButton}
                      onPress={() => setSearchQuery('')}
                    >
                      <FontAwesomeIcon icon={faTimes} size={14} color='#666' />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Grouped Students */}
                {Object.keys(getFilteredStudents()).length > 0 ? (
                  Object.keys(getFilteredStudents())
                    .sort((a, b) => a.localeCompare(b))
                    .map((className) => {
                      const students = getFilteredStudents()[className];
                      const isExpanded = expandedClasses.has(className);

                      return (
                        <View key={className} style={styles.classGroup}>
                          {/* Class Header */}
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
                                color='#666'
                              />
                              <FontAwesomeIcon
                                icon={faUsers}
                                size={16}
                                color='#007AFF'
                                style={styles.classIcon}
                              />
                              <Text style={styles.className}>{className}</Text>
                              <View style={styles.studentCount}>
                                <Text style={styles.studentCountText}>
                                  {students.length}
                                </Text>
                              </View>
                            </TouchableOpacity>

                            {/* Select All Class Button */}
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
                                      ? '#007AFF'
                                      : '#666'
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

                          {/* Students List */}
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
                                        color={isSelected ? '#007AFF' : '#999'}
                                      />
                                    ) : (
                                      <FontAwesomeIcon
                                        icon={faUser}
                                        size={14}
                                        color={isSelected ? '#007AFF' : '#999'}
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
                                        color='#007AFF'
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
                    <FontAwesomeIcon icon={faSearch} size={32} color='#ccc' />
                    <Text style={styles.noStudentsText}>
                      {searchQuery
                        ? 'No students found matching your search'
                        : 'No students with valid classrooms available'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Step 2: Behavior Selection */}
            {modalStep === 2 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <FontAwesomeIcon icon={faGavel} size={24} color='#007AFF' />
                  <Text style={styles.stepTitle}>Choose Behavior Type</Text>
                  <Text style={styles.stepDescription}>
                    Select the type of behavior you want to record
                  </Text>
                </View>

                {/* Selected Student(s) Info */}
                {(selectedStudent || selectedStudents.length > 0) && (
                  <View style={styles.selectedStudentInfo}>
                    <FontAwesomeIcon
                      icon={isMultipleSelection ? faUsers : faUser}
                      size={16}
                      color='#007AFF'
                    />
                    <Text style={styles.selectedStudentText}>
                      {isMultipleSelection
                        ? `${selectedStudents.length} students selected`
                        : `${selectedStudent.name} - ${selectedStudent.classroom_name}`}
                    </Text>
                  </View>
                )}

                {/* Selected Behaviors Display */}
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
                                ? '#34C759'
                                : '#FF3B30'
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
                              color='#666'
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Behavior Type Selection or Behavior List */}
                {!selectedBehaviorType && (
                  <View style={styles.behaviorTypeContainer}>
                    <TouchableOpacity
                      style={[styles.behaviorTypeTab, styles.positiveTab]}
                      onPress={() => handleBehaviorCategorySelect('prs')}
                    >
                      <FontAwesomeIcon
                        icon={faThumbsUp}
                        size={20}
                        color='#34C759'
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
                        color='#FF3B30'
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

                {/* Behavior Items List */}
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
                          color='#007AFF'
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
                      {getFilteredBehaviorItems().map((item) => {
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
                                    ? '#fff'
                                    : selectedBehaviorType === 'prs'
                                    ? '#34C759'
                                    : '#FF3B30'
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
                              color={isSelected ? '#34C759' : '#666'}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Step 3: Review & Submit */}
            {modalStep === 3 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <FontAwesomeIcon icon={faCheck} size={24} color='#34C759' />
                  <Text style={styles.stepTitle}>Review & Submit</Text>
                  <Text style={styles.stepDescription}>
                    Review the details and add an optional note
                  </Text>
                </View>

                {/* Review Summary */}
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

                  {/* Show selected students list in multiple mode */}
                  {isMultipleSelection && selectedStudents.length > 0 && (
                    <View style={styles.selectedStudentsList}>
                      {selectedStudents.slice(0, 3).map((student) => (
                        <Text
                          key={student.student_id}
                          style={styles.selectedStudentItem}
                        >
                          • {student.name} ({student.classroom_name})
                        </Text>
                      ))}
                      {selectedStudents.length > 3 && (
                        <Text style={styles.moreStudentsText}>
                          ... and {selectedStudents.length - 3} more
                        </Text>
                      )}
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
                                  ? '#34C759'
                                  : '#FF3B30'
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
                              ? '#34C759'
                              : getTotalPoints() < 0
                              ? '#FF3B30'
                              : '#666',
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
                                ? '#34C759'
                                : getTotalPoints() < 0
                                ? '#FF3B30'
                                : '#666',
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

                {/* Note Input */}
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
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size='large' color='#007AFF' />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  teacherInfo: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  teacherName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  teacherSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  // Section Titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },

  // Branch Selector
  branchSelector: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  branchTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedBranchTab: {
    backgroundColor: '#007AFF',
  },
  branchTabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  selectedBranchTabText: {
    color: '#fff',
  },

  // Branch Info
  branchInfo: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  branchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  branchDetails: {
    flex: 1,
  },
  branchName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  branchSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  branchStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  // Filter Container
  filterContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  filterTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedFilterTab: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontWeight: '600',
  },
  selectedFilterTabText: {
    color: '#fff',
  },

  // Records Container
  recordsContainer: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    color: '#1a1a1a',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  classroomName: {
    fontSize: 12,
    color: '#999',
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
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B3015',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  recordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  recordNote: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
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
    color: '#1a1a1a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalHeaderRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledButtonText: {
    color: '#999',
  },

  // Progress Indicator
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  progressDotActive: {
    backgroundColor: '#007AFF',
  },
  progressDotCurrent: {
    backgroundColor: '#007AFF',
    transform: [{ scale: 1.2 }],
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#007AFF',
  },

  // Back Button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },

  modalContent: {
    flex: 1,
    padding: 20,
  },

  // Step Container
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
    color: '#1a1a1a',
    marginTop: 15,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Selected Student Info
  selectedStudentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF15',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  selectedStudentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 10,
  },

  // Behavior Type Tabs
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
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  positiveTab: {
    borderWidth: 2,
    borderColor: '#34C75920',
  },
  negativeTab: {
    borderWidth: 2,
    borderColor: '#FF3B3020',
  },
  behaviorTypeTabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 10,
    marginBottom: 5,
  },
  behaviorTypeSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // Behavior Items
  behaviorItemsContainer: {
    flex: 1,
  },
  itemCategoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
    marginTop: 10,
  },
  behaviorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  behaviorItemSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#007AFF05',
  },
  selectedBehaviorItem: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#007AFF05',
  },
  behaviorItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  behaviorItemIconSelected: {
    backgroundColor: '#007AFF',
  },
  behaviorItemInfo: {
    flex: 1,
  },
  behaviorItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  behaviorItemTitleSelected: {
    color: '#007AFF',
  },
  behaviorItemPoints: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  behaviorItemPointsSelected: {
    color: '#007AFF',
  },

  modalSection: {
    marginBottom: 25,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  itemTypeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    marginBottom: 10,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  selectionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  selectedText: {
    color: '#007AFF',
  },
  selectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  // Review Section
  reviewSummary: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
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
    borderBottomColor: '#f0f0f0',
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'right',
    marginLeft: 15,
  },
  reviewPoints: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reviewBehaviorsList: {
    marginTop: 8,
  },
  reviewBehaviorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 4,
  },
  reviewBehaviorText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 6,
    fontWeight: '500',
  },

  // Note Section
  noteSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noteSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  noteInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Search Container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 10,
  },
  clearSearchButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  // Class Groups
  classGroup: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
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
    color: '#1a1a1a',
  },
  studentCount: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  studentCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  studentsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedStudentItem: {
    backgroundColor: '#007AFF15',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  modalStudentName: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    marginLeft: 10,
    fontWeight: '500',
  },
  selectedModalStudentName: {
    color: '#007AFF',
    fontWeight: '600',
  },

  // No Students Found
  noStudentsFound: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
  },
  noStudentsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },

  // Selection Mode
  selectionModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#007AFF',
  },
  selectionModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  selectedModeText: {
    color: '#fff',
  },

  // Selected Summary
  selectedSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#007AFF15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  selectedSummaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  clearAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Class Header Container
  classHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  // Select All Button
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  selectAllButtonSelected: {
    backgroundColor: '#007AFF15',
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginLeft: 4,
  },
  selectAllTextSelected: {
    color: '#007AFF',
  },

  // Selected Students List
  selectedStudentsList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  moreStudentsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Selected Behaviors Display (Multiple)
  selectedBehaviorsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
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
    borderBottomColor: '#f0f0f0',
  },
  selectedBehaviorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  clearAllBehaviorsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  clearAllBehaviorsText: {
    color: '#fff',
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
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedBehaviorChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1a1a1a',
    marginLeft: 6,
    marginRight: 8,
  },
  removeBehaviorButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Selected Behavior Display (Legacy Single)
  selectedBehaviorDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedBehaviorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
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
    color: '#1a1a1a',
    marginBottom: 4,
  },
  selectedBehaviorPoints: {
    fontSize: 14,
    color: '#666',
  },
  changeBehaviorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  changeBehaviorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Behavior Type Container
  behaviorTypeContainer: {
    gap: 15,
  },

  // Behavior Selection Container
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
    backgroundColor: '#007AFF15',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  backToCategoriesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
  behaviorSelectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  behaviorSelectionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },

  // No Behavior Items
  noBehaviorItems: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
  },
  noBehaviorItemsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
});
