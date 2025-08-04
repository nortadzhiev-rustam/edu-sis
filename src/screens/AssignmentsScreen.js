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
import { Config, buildApiUrl } from '../config/env';
import {
  faArrowLeft,
  faClipboardList,
  faCalculator,
  faFlask,
  faMicroscope,
  faAtom,
  faRunning,
  faLaptopCode,
  faGlobe,
  faPalette,
  faLandmark,
  faMapMarkedAlt,
  faLanguage,
  faMusic,
  faTheaterMasks,
  faCameraRetro,
  faTools,
  faBusinessTime,
  faBalanceScale,
  faHeartbeat,
  faLeaf,
  faBook,
  faChevronRight,
  faUser,
  faClock,
  faCalendarAlt,
  faCheckCircle,
  faExclamationTriangle,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useScreenOrientation } from '../hooks/useScreenOrientation';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getHtmlPreview } from '../utils/htmlUtils';
import { createSmallShadow, createMediumShadow } from '../utils/commonStyles';
import { getDemoStudentHomeworkData } from '../services/demoModeService';
import { getStudentHomeworkList } from '../services/homeworkService';

export default function AssignmentsScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const { studentName, authCode } = route.params || {};
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const styles = createStyles(theme);

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

  // Helper function to get specific subject icon (same as GradesScreen)
  const getSubjectIcon = (subject) => {
    const subjectLower = subject.toLowerCase();

    // Mathematics
    if (
      subjectLower.includes('math') ||
      subjectLower.includes('algebra') ||
      subjectLower.includes('geometry') ||
      subjectLower.includes('calculus') ||
      subjectLower.includes('statistics')
    ) {
      return faCalculator;
    }

    // Sciences
    if (subjectLower.includes('physics')) return faAtom;
    if (subjectLower.includes('chemistry')) return faFlask;
    if (
      subjectLower.includes('biology') ||
      subjectLower.includes('life science')
    )
      return faMicroscope;
    if (subjectLower.includes('science') && !subjectLower.includes('computer'))
      return faFlask;

    // Languages
    if (
      subjectLower.includes('english') ||
      subjectLower.includes('language arts') ||
      subjectLower.includes('literature') ||
      subjectLower.includes('writing')
    ) {
      return faLanguage;
    }

    // Social Studies
    if (subjectLower.includes('history')) return faLandmark;
    if (subjectLower.includes('geography') || subjectLower.includes('geo'))
      return faMapMarkedAlt;
    if (
      subjectLower.includes('global perspective') ||
      subjectLower.includes('global studies') ||
      subjectLower.includes('world studies')
    )
      return faGlobe;

    // Technology & Computing
    if (
      subjectLower.includes('ict') ||
      subjectLower.includes('computer') ||
      subjectLower.includes('computing') ||
      subjectLower.includes('technology') ||
      subjectLower.includes('programming') ||
      subjectLower.includes('coding')
    ) {
      return faLaptopCode;
    }

    // Arts
    if (
      subjectLower.includes('art') ||
      subjectLower.includes('drawing') ||
      subjectLower.includes('painting') ||
      subjectLower.includes('design')
    ) {
      return faPalette;
    }
    if (
      subjectLower.includes('music') ||
      subjectLower.includes('band') ||
      subjectLower.includes('orchestra') ||
      subjectLower.includes('choir')
    ) {
      return faMusic;
    }
    if (
      subjectLower.includes('drama') ||
      subjectLower.includes('theater') ||
      subjectLower.includes('theatre') ||
      subjectLower.includes('acting')
    ) {
      return faTheaterMasks;
    }
    if (
      subjectLower.includes('photography') ||
      subjectLower.includes('media')
    ) {
      return faCameraRetro;
    }

    // Physical Education & Health
    if (
      subjectLower.includes('physical education') ||
      subjectLower.includes('pe') ||
      subjectLower.includes('sport') ||
      subjectLower.includes('fitness') ||
      subjectLower.includes('gym') ||
      subjectLower.includes('athletics')
    ) {
      return faRunning;
    }
    if (subjectLower.includes('health') || subjectLower.includes('wellness')) {
      return faHeartbeat;
    }

    // Business & Economics
    if (
      subjectLower.includes('business') ||
      subjectLower.includes('economics') ||
      subjectLower.includes('finance') ||
      subjectLower.includes('accounting')
    ) {
      return faBusinessTime;
    }

    // Law & Government
    if (
      subjectLower.includes('law') ||
      subjectLower.includes('government') ||
      subjectLower.includes('civics') ||
      subjectLower.includes('politics')
    ) {
      return faBalanceScale;
    }

    // Environmental Studies
    if (
      subjectLower.includes('environmental') ||
      subjectLower.includes('ecology') ||
      subjectLower.includes('earth science')
    ) {
      return faLeaf;
    }

    // Technical/Vocational
    if (
      subjectLower.includes('engineering') ||
      subjectLower.includes('technical') ||
      subjectLower.includes('workshop') ||
      subjectLower.includes('construction')
    ) {
      return faTools;
    }

    // Default fallback
    return faBook;
  };

  // Helper function to get random but consistent color for each subject (same as GradesScreen)
  const getSubjectColor = (subject) => {
    // Array of beautiful colors
    const colors = [
      '#FF9500', // Orange
      '#007AFF', // Blue
      '#34C759', // Green
      '#AF52DE', // Purple
      '#FF3B30', // Red
      '#5856D6', // Indigo
      '#FF2D92', // Pink
      '#FF9F0A', // Amber
      '#30D158', // Mint
      '#64D2FF', // Cyan
      '#BF5AF2', // Violet
      '#FF6482', // Rose
      '#32ADE6', // Light Blue
      '#FFD60A', // Yellow
      '#AC8E68', // Brown
    ];

    // Generate a consistent hash from the subject name
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      const char = subject.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Use the hash to pick a color consistently
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  useEffect(() => {
    if (authCode) {
      fetchAssignmentsData();
    }
  }, [authCode]);

  // Helper function to group assignments by subject
  const getSubjectGroups = () => {
    // Handle different possible API response structures
    let assignmentsArray = [];

    if (Array.isArray(assignments)) {
      assignmentsArray = assignments;
    } else if (assignments?.data && Array.isArray(assignments.data)) {
      assignmentsArray = assignments.data;
    } else if (assignments && typeof assignments === 'object') {
      // If assignments is an object, try to find an array property
      const possibleArrays = Object.values(assignments).filter((val) =>
        Array.isArray(val)
      );
      if (possibleArrays.length > 0) {
        assignmentsArray = possibleArrays[0];
      }
    }

    if (!assignmentsArray || assignmentsArray.length === 0) {
      return [];
    }

    const groups = assignmentsArray.reduce((acc, assignment) => {
      // Try different possible field names for subject
      const subject =
        assignment.subject ||
        assignment.subject_name ||
        assignment.subjectName ||
        assignment.Subject ||
        t('unknownSubject');

      if (!acc[subject]) {
        acc[subject] = [];
      }
      acc[subject].push(assignment);
      return acc;
    }, {});

    // Convert to array and add counts
    const result = Object.keys(groups).map((subject) => ({
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

    return result;
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
    if (!dateString) return t('noDate');
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Helper function to get assignment status with modern icons
  const getAssignmentStatus = (assignment) => {
    // Since API doesn't provide completion status, we'll determine based on deadline
    const deadline = new Date(assignment.deadline || 0);
    const today = new Date();

    if (assignment.completed || assignment.is_completed) {
      return {
        status: 'completed',
        color: '#34C759',
        icon: faCheckCircle,
        label: t('assignmentCompleted'),
      };
    } else if (deadline < today) {
      return {
        status: 'overdue',
        color: '#FF3B30',
        icon: faExclamationTriangle,
        label: t('assignmentOverdue'),
      };
    } else if (deadline.toDateString() === today.toDateString()) {
      return {
        status: 'due_today',
        color: '#FF9500',
        icon: faCalendarAlt,
        label: t('assignmentDueToday'),
      };
    } else {
      return {
        status: 'pending',
        color: '#007AFF',
        icon: faClock,
        label: t('assignmentPending'),
      };
    }
  };

  const fetchAssignmentsData = async () => {
    if (!authCode) {
      Alert.alert(t('error'), t('authCodeMissing'));
      return;
    }

    setLoading(true);
    try {
      // Check if this is demo mode
      if (authCode && authCode.startsWith('DEMO_AUTH_')) {
        console.log('🎭 DEMO MODE: Using demo student homework data');
        const demoData = getDemoStudentHomeworkData();
        setAssignments(demoData);
        setLoading(false);
        return;
      }

      // Use homework assignment API
      const response = await getStudentHomeworkList(authCode);

      if (response.success && Array.isArray(response.data)) {
        // The API returns assignments directly in the data array
        // Transform the data to ensure compatibility with existing UI components
        const transformedData = response.data.map((assignment) => ({
          ...assignment,
          // Ensure compatibility with existing component expectations
          subject: assignment.subject_name,
          completed: assignment.is_completed === 1,
          // Add any missing fields that the UI might expect
          days_remaining: assignment.is_overdue ? 0 : null,
        }));

        setAssignments(transformedData);
      } else {
        Alert.alert(t('error'), response.message || t('failedToFetchClasses'));
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      Alert.alert(t('error'), t('failedToConnect'));
    } finally {
      setLoading(false);
    }
  };

  // Mark assignment as done
  const markAssignmentAsDone = (assignment) => {
    const handleMarkDone = async () => {
      try {
        const response = await fetch(buildApiUrl('/homework/mark-done'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            auth_code: authCode,
            detail_id: assignment.detail_id,
          }),
        });

        if (response.ok) {
          // Update the assignment in the local state
          setAssignments((prevAssignments) => {
            const updateAssignmentInArray = (arr) => {
              return arr.map((item) =>
                item.detail_id === assignment.detail_id
                  ? {
                      ...item,
                      is_completed: 1,
                      submitted_date: new Date().toISOString(),
                    }
                  : item
              );
            };

            if (Array.isArray(prevAssignments)) {
              return updateAssignmentInArray(prevAssignments);
            } else if (
              prevAssignments?.data &&
              Array.isArray(prevAssignments.data)
            ) {
              return {
                ...prevAssignments,
                data: updateAssignmentInArray(prevAssignments.data),
              };
            }
            return prevAssignments;
          });

          Alert.alert(t('success'), t('assignmentMarkedCompleted'));
        } else {
          const errorResponse = await response.text();

          try {
            const errorData = JSON.parse(errorResponse);

            if (errorData.error === 'Homework has already been submitted') {
              Alert.alert(
                t('alreadyCompleted'),
                t('assignmentAlreadySubmitted'),
                [{ text: 'OK', style: 'default' }]
              );
            } else {
              Alert.alert(t('error'), errorData.error || t('failedToMarkDone'));
            }
          } catch (parseError) {
            Alert.alert(t('error'), t('failedToMarkDone'));
          }
        }
      } catch (error) {
        Alert.alert(t('error'), t('failedToConnect'));
      }
    };

    Alert.alert(
      t('markAsDone'),
      t('confirmMarkDone').replace('{title}', assignment.title),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('markDone'),
          style: 'default',
          onPress: () => {
            handleMarkDone();
          },
        },
      ]
    );
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
          {subjectGroups.map((group) => {
            const subjectColor = getSubjectColor(group.subject);
            const subjectIcon = getSubjectIcon(group.subject);

            return (
              <TouchableOpacity
                key={group.subject}
                style={styles.redesignedCard}
                onPress={() => setSelectedSubject(group)}
              >
                {/* Top Section */}
                <View style={styles.cardTopSection}>
                  <View style={styles.subjectHeader}>
                    <View
                      style={[
                        styles.modernIcon,
                        { backgroundColor: subjectColor },
                      ]}
                    >
                      <FontAwesomeIcon
                        icon={subjectIcon}
                        size={20}
                        color='#fff'
                      />
                    </View>
                    <View style={styles.titleSection}>
                      <Text style={styles.subjectName}>{group.subject}</Text>
                      <Text style={styles.totalAssignments}>
                        {group.totalCount} assignments
                      </Text>
                    </View>
                    <View style={styles.arrowContainer}>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        size={14}
                        color={subjectColor}
                      />
                    </View>
                  </View>
                </View>

                {/* Bottom Section */}
                <View style={styles.cardBottomSection}>
                  <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                      <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
                        {group.incompleteCount}
                      </Text>
                      <Text style={styles.statText}>Pending</Text>
                    </View>

                    <View style={styles.verticalDivider} />

                    <View style={styles.statBox}>
                      <Text style={[styles.statValue, { color: '#51CF66' }]}>
                        {group.completedCount}
                      </Text>
                      <Text style={styles.statText}>Completed</Text>
                    </View>
                  </View>

                  {/* Progress Indicator */}
                  <View style={styles.progressIndicator}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${
                              (group.completedCount / group.totalCount) * 100
                            }%`,
                            backgroundColor: subjectColor,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {Math.round(
                        (group.completedCount / group.totalCount) * 100
                      )}
                      % done
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
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
        {/* Header with filter */}
        <View style={styles.assignmentsHeader}>
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
              {showCompleted ? t('showAll') : t('showCompleted')}
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
                ? t('noCompletedAssignments')
                : t('noPendingAssignments')}
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
                <TouchableOpacity
                  key={assignment.uuid || assignment.id || index}
                  style={styles.modernAssignmentCard}
                  onPress={() =>
                    navigation.navigate('AssignmentDetail', {
                      assignment,
                      authCode,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.assignmentCardHeader}>
                    <View style={styles.assignmentCardLeft}>
                      <Text style={styles.modernAssignmentTitle}>
                        {assignment.title || t('untitledAssignment')}
                      </Text>
                      <Text style={styles.assignmentDate}>
                        Due: {formatDate(assignment.deadline)}
                      </Text>
                    </View>
                    <View style={styles.assignmentCardRight}>
                      <View
                        style={[
                          styles.modernStatusBadge,
                          { backgroundColor: status.color },
                        ]}
                      >
                        <FontAwesomeIcon
                          icon={status.icon}
                          size={16}
                          color='#fff'
                        />
                      </View>
                    </View>
                  </View>

                  {assignment.homework_data && (
                    <Text
                      style={styles.assignmentDescription}
                      numberOfLines={3}
                    >
                      {getHtmlPreview(assignment.homework_data, 3)}
                    </Text>
                  )}

                  <View style={styles.assignmentCardBody}>
                    <View style={styles.assignmentDetails}>
                      {assignment.teacher_name && (
                        <View style={styles.assignmentDetailItem}>
                          <FontAwesomeIcon
                            icon={faUser}
                            size={14}
                            color='#666'
                          />
                          <Text style={styles.assignmentDetailText}>
                            {assignment.teacher_name}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.assignmentActions}>
                      {!assignment.is_completed && (
                        <TouchableOpacity
                          style={styles.markDoneButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            markAssignmentAsDone(assignment);
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faCheck}
                            size={14}
                            color='#fff'
                          />
                          <Text style={styles.markDoneButtonText}>Done</Text>
                        </TouchableOpacity>
                      )}

                      <View
                        style={[
                          styles.assignmentStatusBadge,
                          { backgroundColor: status.color },
                        ]}
                      >
                        <Text style={styles.assignmentStatusText}>
                          {status.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
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
          <Text style={styles.loadingText}>{t('loadingAssignments')}</Text>
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
      {/* Compact Header */}
      <View style={styles.compactHeaderContainer}>
        {/* Navigation Header */}
        <View style={styles.navigationHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (!selectedSubject) {
                navigation.goBack();
              } else {
                setSelectedSubject(null);
              }
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Homework</Text>

          <View style={styles.headerRight} />
        </View>

        {/* Student Info Subheader - Hidden in landscape mode */}
        {!isLandscape && (
          <View style={styles.subHeader}>
            <Text style={styles.studentName}>
              {studentName || t('student')}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {t('assignmentsHomework')}
            </Text>
          </View>
        )}
      </View>

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
    studentSection: {
      backgroundColor: theme.colors.surface,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    studentName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 5,
    },
    sectionSubtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingVertical: 20,
      marginHorizontal: 5,
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
      color: theme.colors.textSecondary,
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
      color: theme.colors.text,
      marginTop: 20,
      marginBottom: 10,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    // Subjects view styles
    subjectsContainer: {
      flex: 1,
      width: '100%',
    },
    subjectsGrid: {
      width: '95%',
      paddingRight: 5,
    },

    // Modern Subject Card Styles (similar to GradesScreen)
    modernSubjectCard: {
      backgroundColor: theme.colors.surface,
      width: '100%',
      marginVertical: 10,
      borderRadius: 16,
      padding: 20,
      borderLeftWidth: 4,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    subjectCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 15,
    },
    subjectIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    subjectInfo: {
      flex: 1,
    },
    modernSubjectTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    subjectAssignmentCount: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },

    // Modern Stats Styles
    modernSubjectStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    modernStatItem: {
      alignItems: 'center',
    },
    statBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    statBadgeText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
    modernStatLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },

    // Redesigned Card Styles
    redesignedCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginBottom: 16,
      marginHorizontal: 16,
      elevation: 6,
      width: '100%',
      ...createMediumShadow(theme),
    },
    cardTopSection: {
      padding: 16,
      paddingBottom: 12,
      overflow: 'hidden',
    },
    subjectHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    modernIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    titleSection: {
      flex: 1,
    },
    subjectName: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 4,
      flexShrink: 1,
    },
    totalAssignments: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    arrowContainer: {
      padding: 4,
    },
    cardBottomSection: {
      backgroundColor: theme.colors.background,
      padding: 16,
      paddingTop: 12,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      overflow: 'hidden',
    },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    statBox: {
      flex: 1,
      alignItems: 'center',
      minWidth: 80,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    statText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      textAlign: 'center',
      minWidth: 60,
    },
    verticalDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.colors.border,
      marginHorizontal: 20,
    },
    progressIndicator: {
      alignItems: 'center',
    },
    progressTrack: {
      width: '100%',
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 6,
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    progressText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    // Assignments view styles
    assignmentsContainer: {
      flex: 1,
      marginHorizontal: 5,
    },
    assignmentsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 10,
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
      color: theme.colors.text,
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
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    assignmentsList: {
      flex: 1,
      paddingHorizontal: 10,
    },

    // Modern Assignment Card Styles
    modernAssignmentCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginTop: 15,
      ...createMediumShadow(theme),
    },
    assignmentCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 15,
    },
    assignmentCardLeft: {
      flex: 1,
      marginRight: 15,
    },
    modernAssignmentTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 6,
    },
    assignmentDate: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    assignmentCardRight: {
      alignItems: 'flex-end',
    },
    modernStatusBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    assignmentDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: 15,
    },
    assignmentCardBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    assignmentDetails: {
      flex: 1,
    },
    assignmentDetailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    assignmentDetailText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 8,
    },
    assignmentActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    markDoneButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#34C759',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      shadowColor: '#34C759',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    markDoneButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
      marginLeft: 4,
    },
    assignmentStatusContainer: {
      alignItems: 'flex-end',
    },
    assignmentStatusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    assignmentStatusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },
  });
