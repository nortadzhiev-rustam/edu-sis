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
import {
  faArrowLeft,
  faGavel,
  faPlus,
  faBuilding,
  faRefresh,
  faThumbsUp,
  faThumbsDown,
  faTrash,
  faCalendarAlt,
  faUser,
  faTimes,
  faCheck,
  faSearch,
  faChevronDown,
  faChevronRight,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';

export default function TeacherBPS({ route, navigation }) {
  const { authCode, teacherName, bpsData: initialData } = route.params || {};

  const [bpsData, setBpsData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [note, setNote] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'dps', 'prs'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClasses, setExpandedClasses] = useState(new Set());
  const [modalStep, setModalStep] = useState(1); // 1: Student, 2: Behavior, 3: Review

  // Fetch fresh BPS data
  const fetchBPSData = async () => {
    if (!authCode) return;

    try {
      setRefreshing(true);
      const url = `https://sis.bfi.edu.mm/mobile-api/get-teacher-bps-data/?authCode=${authCode}`;

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
      console.error('Error fetching BPS data:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setRefreshing(false);
    }
  };

  // Add new BPS record
  const addBPSRecord = async () => {
    if (!selectedStudent || !selectedItem) {
      Alert.alert('Error', 'Please select a student and discipline item');
      return;
    }

    setLoading(true);
    try {
      const url = 'https://sis.bfi.edu.mm/mobile-api/discipline/store-bps';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authCode: authCode,
          student_id: selectedStudent.student_id,
          discipline_item_id: selectedItem.discipline_item_id,
          note: note.trim(),
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'BPS record added successfully!');
        setShowAddModal(false);
        resetForm();
        await fetchBPSData();
      } else {
        Alert.alert('Error', 'Failed to add BPS record');
      }
    } catch (error) {
      console.error('Error adding BPS record:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Delete BPS record
  const deleteBPSRecord = async (recordId) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this BPS record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const url =
                'https://sis.bfi.edu.mm/mobile-api/discipline/delete-bps';

              const response = await fetch(url, {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  authCode: authCode,
                  discipline_record_id: recordId,
                }),
              });

              if (response.ok) {
                Alert.alert('Success', 'BPS record deleted successfully!');
                await fetchBPSData();
              } else {
                Alert.alert('Error', 'Failed to delete BPS record');
              }
            } catch (error) {
              console.error('Error deleting BPS record:', error);
              Alert.alert('Error', 'Network error occurred');
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
    setSelectedItem(null);
    setNote('');
    setSearchQuery('');
    setModalStep(1);

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
        return selectedStudent !== null;
      case 2:
        return selectedItem !== null;
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

  // Get discipline items by type
  const getDisciplineItems = (type) => {
    if (!bpsData?.discipline_items) return [];
    return type === 'dps'
      ? bpsData.discipline_items.dps_items
      : bpsData.discipline_items.prs_items;
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
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() =>
                        deleteBPSRecord(record.discipline_record_id)
                      }
                    >
                      <FontAwesomeIcon
                        icon={faTrash}
                        size={14}
                        color='#FF3B30'
                      />
                    </TouchableOpacity>
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
                  <Text style={styles.stepTitle}>Choose a Student</Text>
                  <Text style={styles.stepDescription}>
                    Select the student you want to add a behavior record for
                  </Text>
                </View>

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
                          <TouchableOpacity
                            style={styles.classHeader}
                            onPress={() => toggleClassExpansion(className)}
                          >
                            <FontAwesomeIcon
                              icon={isExpanded ? faChevronDown : faChevronRight}
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

                          {/* Students List */}
                          {isExpanded && (
                            <View style={styles.studentsContainer}>
                              {students.map((student) => (
                                <TouchableOpacity
                                  key={student.student_id}
                                  style={[
                                    styles.studentItem,
                                    selectedStudent?.student_id ===
                                      student.student_id &&
                                      styles.selectedStudentItem,
                                  ]}
                                  onPress={() => setSelectedStudent(student)}
                                >
                                  <FontAwesomeIcon
                                    icon={faUser}
                                    size={14}
                                    color={
                                      selectedStudent?.student_id ===
                                      student.student_id
                                        ? '#007AFF'
                                        : '#999'
                                    }
                                  />
                                  <Text
                                    style={[
                                      styles.modalStudentName,
                                      selectedStudent?.student_id ===
                                        student.student_id &&
                                        styles.selectedModalStudentName,
                                    ]}
                                  >
                                    {student.name}
                                  </Text>
                                  {selectedStudent?.student_id ===
                                    student.student_id && (
                                    <FontAwesomeIcon
                                      icon={faCheck}
                                      size={14}
                                      color='#007AFF'
                                    />
                                  )}
                                </TouchableOpacity>
                              ))}
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

                {/* Selected Student Info */}
                {selectedStudent && (
                  <View style={styles.selectedStudentInfo}>
                    <FontAwesomeIcon icon={faUser} size={16} color='#007AFF' />
                    <Text style={styles.selectedStudentText}>
                      {selectedStudent.name} - {selectedStudent.classroom_name}
                    </Text>
                  </View>
                )}

                {/* Behavior Type Tabs */}
                <View style={styles.behaviorTypeTabs}>
                  <TouchableOpacity
                    style={[styles.behaviorTypeTab, styles.positiveTab]}
                    onPress={() => {
                      /* Will show positive items */
                    }}
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
                      Reward good behavior
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.behaviorTypeTab, styles.negativeTab]}
                    onPress={() => {
                      /* Will show negative items */
                    }}
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

                {/* Behavior Items */}
                <View style={styles.behaviorItemsContainer}>
                  {/* Positive Items */}
                  <Text style={styles.itemCategoryTitle}>
                    Positive Behaviors
                  </Text>
                  {getDisciplineItems('prs').map((item) => (
                    <TouchableOpacity
                      key={`prs-${item.discipline_item_id}`}
                      style={[
                        styles.behaviorItem,
                        selectedItem?.discipline_item_id ===
                          item.discipline_item_id &&
                          styles.selectedBehaviorItem,
                      ]}
                      onPress={() => setSelectedItem(item)}
                    >
                      <View style={styles.behaviorItemIcon}>
                        <FontAwesomeIcon
                          icon={faThumbsUp}
                          size={16}
                          color='#34C759'
                        />
                      </View>
                      <View style={styles.behaviorItemInfo}>
                        <Text style={styles.behaviorItemTitle}>
                          {item.item_title}
                        </Text>
                        <Text style={styles.behaviorItemPoints}>
                          +{item.item_point} points
                        </Text>
                      </View>
                      {selectedItem?.discipline_item_id ===
                        item.discipline_item_id && (
                        <FontAwesomeIcon
                          icon={faCheck}
                          size={16}
                          color='#34C759'
                        />
                      )}
                    </TouchableOpacity>
                  ))}

                  {/* Negative Items */}
                  <Text style={styles.itemCategoryTitle}>
                    Negative Behaviors
                  </Text>
                  {getDisciplineItems('dps').map((item) => (
                    <TouchableOpacity
                      key={`dps-${item.discipline_item_id}`}
                      style={[
                        styles.behaviorItem,
                        selectedItem?.discipline_item_id ===
                          item.discipline_item_id &&
                          styles.selectedBehaviorItem,
                      ]}
                      onPress={() => setSelectedItem(item)}
                    >
                      <View style={styles.behaviorItemIcon}>
                        <FontAwesomeIcon
                          icon={faThumbsDown}
                          size={16}
                          color='#FF3B30'
                        />
                      </View>
                      <View style={styles.behaviorItemInfo}>
                        <Text style={styles.behaviorItemTitle}>
                          {item.item_title}
                        </Text>
                        <Text style={styles.behaviorItemPoints}>
                          {item.item_point} points
                        </Text>
                      </View>
                      {selectedItem?.discipline_item_id ===
                        item.discipline_item_id && (
                        <FontAwesomeIcon
                          icon={faCheck}
                          size={16}
                          color='#FF3B30'
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
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
                    <Text style={styles.reviewLabel}>Student:</Text>
                    <Text style={styles.reviewValue}>
                      {selectedStudent?.name} ({selectedStudent?.classroom_name}
                      )
                    </Text>
                  </View>

                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewLabel}>Behavior:</Text>
                    <Text style={styles.reviewValue}>
                      {selectedItem?.item_title}
                    </Text>
                  </View>

                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewLabel}>Points:</Text>
                    <Text
                      style={[
                        styles.reviewValue,
                        styles.reviewPoints,
                        {
                          color:
                            selectedItem?.item_point > 0
                              ? '#34C759'
                              : '#FF3B30',
                        },
                      ]}
                    >
                      {selectedItem?.item_point > 0 ? '+' : ''}
                      {selectedItem?.item_point}
                    </Text>
                  </View>
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
  behaviorItemInfo: {
    flex: 1,
  },
  behaviorItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  behaviorItemPoints: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
