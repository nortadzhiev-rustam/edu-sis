import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faClipboardList,
} from '@fortawesome/free-solid-svg-icons';
import { useScreenOrientation } from '../hooks/useScreenOrientation';

export default function AssignmentsScreen({ navigation, route }) {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const { studentName, authCode } = route.params || {};
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // Enable rotation for this screen
  useScreenOrientation(true);

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const isLandscape = screenData.width > screenData.height;

  useEffect(() => {
    if (authCode) {
      fetchAssignmentsData();
    }
  }, [authCode]);

  // Helper function to group assignments by subject
  const getSubjectGroups = () => {
    if (!assignments || !Array.isArray(assignments)) return [];

    const groups = assignments.reduce((acc, assignment) => {
      const subject = assignment.subject || 'Unknown Subject';
      if (!acc[subject]) {
        acc[subject] = [];
      }
      acc[subject].push(assignment);
      return acc;
    }, {});

    // Convert to array and add counts
    return Object.keys(groups).map((subject) => ({
      subject,
      assignments: groups[subject],
      totalCount: groups[subject].length,
      incompleteCount: groups[subject].filter(
        (a) => !a.completed && !a.is_completed
      ).length,
      completedCount: groups[subject].filter(
        (a) => a.completed || a.is_completed
      ).length,
    }));
  };

  // Helper function to get filtered and sorted assignments for a subject
  const getFilteredAssignments = (subjectAssignments) => {
    let filtered = subjectAssignments;

    // Filter by completion status - since API doesn't provide completion status,
    // we'll assume all assignments are incomplete for now
    if (!showCompleted) {
      // For now, show all assignments since we don't have completion status
      // In the future, this could be based on a completion field from API
      filtered = filtered.filter(
        (assignment) => !assignment.completed && !assignment.is_completed
      );
    }

    // Sort by deadline (most recent first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.deadline || 0);
      const dateB = new Date(b.deadline || 0);
      return dateB - dateA;
    });

    return filtered;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Helper function to get assignment status
  const getAssignmentStatus = (assignment) => {
    // Since API doesn't provide completion status, we'll determine based on deadline
    const deadline = new Date(assignment.deadline || 0);
    const today = new Date();

    if (assignment.completed || assignment.is_completed) {
      return { status: 'completed', color: '#34C759', icon: '✓' };
    } else if (deadline < today) {
      return { status: 'overdue', color: '#FF3B30', icon: '⚠️' };
    } else if (deadline.toDateString() === today.toDateString()) {
      return { status: 'due_today', color: '#FF9500', icon: '📅' };
    } else {
      return { status: 'pending', color: '#007AFF', icon: '📝' };
    }
  };

  const fetchAssignmentsData = async () => {
    if (!authCode) {
      Alert.alert('Error', 'Authentication code is missing');
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching assignments with authCode:', authCode);
      const url = `https://sis.bfi.edu.mm/mobile-api/get-student-homework-data?authCode=${authCode}`;
      console.log('Request URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('Raw assignments data:', JSON.stringify(data, null, 2));

        // Log the structure of the data
        console.log('Data type:', typeof data);
        console.log('Data keys:', Object.keys(data));

        if (Array.isArray(data)) {
          console.log('Data is an array with length:', data.length);
          if (data.length > 0) {
            console.log('First item structure:', Object.keys(data[0]));
            console.log('First item:', JSON.stringify(data[0], null, 2));
          }
        } else if (data && typeof data === 'object') {
          console.log('Data is an object');
          if (data.data && Array.isArray(data.data)) {
            console.log('data.data is an array with length:', data.data.length);
            if (data.data.length > 0) {
              console.log(
                'First data item structure:',
                Object.keys(data.data[0])
              );
              console.log(
                'First data item:',
                JSON.stringify(data.data[0], null, 2)
              );
            }
          }
        }

        setAssignments(data);
      } else {
        console.error(
          'Failed to fetch assignments:',
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        Alert.alert('Error', `Failed to fetch assignments: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Render subject cards view
  const renderSubjectsView = () => {
    const subjectGroups = getSubjectGroups();

    if (subjectGroups.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesomeIcon icon={faClipboardList} size={48} color='#8E8E93' />
          <Text style={styles.emptyText}>No assignments found</Text>
          <Text style={styles.emptySubtext}>
            Assignments will appear here once available
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.subjectsContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.subjectsGrid}>
          {subjectGroups.map((group, index) => (
            <TouchableOpacity
              key={index}
              style={styles.subjectCard}
              onPress={() => setSelectedSubject(group)}
            >
              <View style={styles.subjectHeader}>
                <Text style={styles.subjectName}>{group.subject}</Text>
                <Text style={styles.subjectTotal}>
                  {group.totalCount} total
                </Text>
              </View>

              <View style={styles.subjectStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#FF3B30' }]}>
                    {group.incompleteCount}
                  </Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#34C759' }]}>
                    {group.completedCount}
                  </Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>

              <View style={styles.subjectFooter}>
                <Text style={styles.tapHint}>Tap to view assignments</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  // Render assignments list for selected subject
  const renderAssignmentsView = () => {
    const filteredAssignments = getFilteredAssignments(
      selectedSubject.assignments
    );

    return (
      <View style={styles.assignmentsContainer}>
        {/* Header with back button and filter */}
        <View style={styles.assignmentsHeader}>
          <TouchableOpacity
            style={styles.backToSubjectsButton}
            onPress={() => setSelectedSubject(null)}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={16} color='#007AFF' />
            <Text style={styles.backToSubjectsText}>Back to Subjects</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              showCompleted && styles.filterButtonActive,
            ]}
            onPress={() => setShowCompleted(!showCompleted)}
          >
            <Text
              style={[
                styles.filterButtonText,
                showCompleted && styles.filterButtonTextActive,
              ]}
            >
              {showCompleted ? 'Show All' : 'Show Completed'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subject title */}
        <Text style={styles.selectedSubjectTitle}>
          {selectedSubject.subject}
        </Text>

        {/* Assignments list */}
        {filteredAssignments.length === 0 ? (
          <View style={styles.emptyAssignmentsContainer}>
            <Text style={styles.emptyAssignmentsText}>
              {showCompleted
                ? 'No completed assignments'
                : 'No pending assignments'}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.assignmentsList}
            showsVerticalScrollIndicator={false}
          >
            {filteredAssignments.map((assignment, index) => {
              const status = getAssignmentStatus(assignment);
              return (
                <View key={index} style={styles.assignmentCard}>
                  <View style={styles.assignmentHeader}>
                    <Text style={styles.assignmentTitle}>
                      {assignment.title || 'Untitled Assignment'}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: status.color },
                      ]}
                    >
                      <Text style={styles.statusIcon}>{status.icon}</Text>
                    </View>
                  </View>

                  {assignment.homework_data && (
                    <Text
                      style={styles.assignmentDescription}
                      numberOfLines={2}
                    >
                      {assignment.homework_data.replace(/<[^>]*>/g, '')}{' '}
                      {/* Remove HTML tags */}
                    </Text>
                  )}

                  <View style={styles.assignmentFooter}>
                    <Text style={styles.assignmentDate}>
                      Due: {formatDate(assignment.deadline)}
                    </Text>
                    <Text
                      style={[styles.assignmentStatus, { color: status.color }]}
                    >
                      {status.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>

                  {assignment.teacher_name && (
                    <Text style={styles.teacherName}>
                      Teacher: {assignment.teacher_name}
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#007AFF' />
          <Text style={styles.loadingText}>Loading assignments data...</Text>
        </View>
      );
    }

    // Show assignments view if a subject is selected, otherwise show subjects
    if (selectedSubject) {
      return renderAssignmentsView();
    } else {
      return renderSubjectsView();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assignments</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Student Name Section - Hidden in landscape mode */}
      {!isLandscape && (
        <View style={styles.studentSection}>
          <Text style={styles.studentName}>{studentName || 'Student'}</Text>
          <Text style={styles.sectionSubtitle}>Assignments & Homework</Text>
        </View>
      )}

      <View style={styles.content}>
        {isLandscape ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scrollContainer}
          >
            {renderContent()}
          </ScrollView>
        ) : (
          <View style={styles.scrollContainer}>{renderContent()}</View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
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
  studentSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Subjects view styles
  subjectsContainer: {
    flex: 1,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  subjectHeader: {
    marginBottom: 15,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subjectTotal: {
    fontSize: 12,
    color: '#666',
  },
  subjectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  subjectFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  tapHint: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Assignments view styles
  assignmentsContainer: {
    flex: 1,
  },
  assignmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backToSubjectsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backToSubjectsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  selectedSubjectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyAssignmentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAssignmentsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  assignmentsList: {
    flex: 1,
  },
  assignmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 16,
    color: '#fff',
  },
  assignmentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  assignmentDate: {
    fontSize: 12,
    color: '#666',
  },
  assignmentStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  teacherName: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic',
  },
});
