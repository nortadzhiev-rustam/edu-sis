import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Config, buildApiUrl } from '../config/env';
import {
  faArrowLeft,
  faChartLine,
  faBook,
  faTrophy,
  faUser,
  faChevronRight,
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
  faBell,
  faGraduationCap,
} from '@fortawesome/free-solid-svg-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useScreenOrientation } from '../hooks/useScreenOrientation';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationBadge from '../components/NotificationBadge';
import {
  createSmallShadow,
  createMediumShadow,
  createCardShadow,
} from '../utils/commonStyles';
import { getDemoStudentGradesData } from '../services/demoModeService';

// Simple separator component - only shows in portrait mode
const GradeSeparator = () => null; // We'll use marginVertical on cards instead

export default function GradesScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { unreadCount, refreshNotifications } = useNotifications();

  const [activeTab, setActiveTab] = useState('summative');
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const { authCode } = route.params || {};
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(false);

  // Subject filtering state
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [showSubjectList, setShowSubjectList] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Number of items per page

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshNotifications();
    }, [refreshNotifications])
  );

  // Enable rotation for this screen
  useScreenOrientation(true);

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  // Determine if device is in landscape mode
  const isLandscape = screenData.width > screenData.height;

  // Memoize styles to prevent recreation on every render
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Fetch grades data
  const fetchGrades = async () => {
    if (!authCode) {
      return;
    }

    try {
      setLoading(true);

      // Check if this is demo mode
      if (authCode && authCode.startsWith('DEMO_AUTH_')) {
        console.log('🎭 DEMO MODE: Using demo student grades data');
        const demoData = getDemoStudentGradesData();
        setGrades(demoData);
        setLoading(false);
        return;
      }

      const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_GRADES, {
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
        setGrades(data);
      } else {
        // Handle error silently
        console.error('Failed to fetch grades:', response.status);
      }
    } catch (error) {
      // Handle error silently
      console.error('Failed to fetch grades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, [authCode]);

  // Extract unique subjects from grades data
  const extractSubjects = (gradesData) => {
    const subjects = new Set();

    if (gradesData?.summative && Array.isArray(gradesData.summative)) {
      gradesData.summative.forEach((item) => {
        if (item.subject_name) {
          subjects.add(item.subject_name);
        }
      });
    }

    if (gradesData?.formative && Array.isArray(gradesData.formative)) {
      gradesData.formative.forEach((item) => {
        if (item.subject_name) {
          subjects.add(item.subject_name);
        }
      });
    }

    // If no API data, extract from dummy data
    if (
      (!gradesData?.summative || gradesData.summative.length === 0) &&
      (!gradesData?.formative || gradesData.formative.length === 0)
    ) {
      // Add dummy subjects for testing
      ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'].forEach(
        (subject) => {
          subjects.add(subject);
        }
      );
    }

    return Array.from(subjects);
  };

  // Update available subjects when grades data changes
  useEffect(() => {
    if (grades) {
      const subjects = extractSubjects(grades);
      setAvailableSubjects(subjects);
    }
  }, [grades]);

  // Reset pagination when tab or subject changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedSubject, showSubjectList]);

  // Pagination utility functions
  const getPaginatedData = (data) => {
    if (!data || data.length === 0) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);
    return paginatedData;
  };

  const getTotalPages = (data) => {
    if (!data || data.length === 0) return 0;
    return Math.ceil(data.length / itemsPerPage);
  };

  const goToNextPage = (totalPages) => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setShowSubjectList(false);
    setCurrentPage(1); // Reset pagination when selecting a subject
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setShowSubjectList(true);
    setCurrentPage(1);
  };

  // Helper function to get specific subject icon
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

  // Helper function to get random but consistent color for each subject
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

  // Helper function to calculate average grade for a subject
  const getSubjectAverage = (subject) => {
    if (!grades) return null;

    const subjectGrades = [];
    if (grades.summative) {
      grades.summative.forEach((grade) => {
        if (
          grade.subject_name === subject &&
          (grade.score_percentage || grade.percentage)
        ) {
          subjectGrades.push(grade.score_percentage || grade.percentage);
        }
      });
    }
    if (grades.formative) {
      grades.formative.forEach((grade) => {
        if (
          grade.subject_name === subject &&
          (grade.score_percentage || grade.percentage)
        ) {
          subjectGrades.push(grade.score_percentage || grade.percentage);
        }
      });
    }

    if (subjectGrades.length === 0) return null;
    return Math.round(
      subjectGrades.reduce((a, b) => a + b, 0) / subjectGrades.length
    );
  };

  const renderSubjectCard = useCallback(
    (subject) => {
      const subjectColor = getSubjectColor(subject);
      const subjectIcon = getSubjectIcon(subject);
      const average = getSubjectAverage(subject);

      // Calculate grade counts
      const summativeCount =
        grades?.summative?.filter((g) => g.subject_name === subject)?.length ||
        0;
      const formativeCount =
        grades?.formative?.filter((g) => g.subject_name === subject)?.length ||
        0;
      const totalGrades = summativeCount + formativeCount;

      // Get grade letter based on average
      const getGradeLetter = (avg) => {
        if (!avg) return 'N/A';
        if (avg >= 90) return 'A*';
        if (avg >= 80) return 'A';
        if (avg >= 70) return 'B';
        if (avg >= 60) return 'C';
        if (avg >= 50) return 'D';
        return 'F';
      };

      const gradeLetter = getGradeLetter(average);

      // Create dynamic styles (these are lightweight and subject-specific)
      const cardBackgroundStyle = { backgroundColor: `${subjectColor}08` };
      const iconContainerStyle = { backgroundColor: subjectColor };
      const gradeCircleStyle = { borderColor: subjectColor };
      const coloredTextStyle = { color: subjectColor };
      const typeDotStyle = { backgroundColor: subjectColor };
      const typeDotFadedStyle = { backgroundColor: `${subjectColor}60` };
      const progressFillStyle = {
        width: `${Math.min(average || 0, 100)}%`,
        backgroundColor: subjectColor,
      };

      return (
        <TouchableOpacity
          key={subject}
          style={[styles.modernSubjectCard, cardBackgroundStyle]}
          onPress={() => handleSubjectSelect(subject)}
          activeOpacity={0.9}
        >
          {/* Header with Icon and Title */}
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.subjectIconContainer, iconContainerStyle]}>
                <FontAwesomeIcon icon={subjectIcon} size={22} color='#fff' />
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.modernSubjectTitle} numberOfLines={2}>
                  {subject.length > 16
                    ? `${subject.substring(0, 16)}...`
                    : subject}
                </Text>
                <View style={styles.assessmentInfo}>
                  <FontAwesomeIcon icon={faBook} size={10} color='#666' />
                  <Text style={styles.assessmentCount}>
                    {totalGrades} assessments
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => handleSubjectSelect(subject)}
            >
              <FontAwesomeIcon
                icon={faChevronRight}
                size={14}
                color={subjectColor}
              />
            </TouchableOpacity>
          </View>

          {/* Main Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.gradeSection}>
              <View style={[styles.gradeCircle, gradeCircleStyle]}>
                <Text style={[styles.gradeLetterText, coloredTextStyle]}>
                  {gradeLetter}
                </Text>
              </View>
              <Text style={styles.gradeLabel}>Grade</Text>
            </View>

            <View style={styles.percentageSection}>
              <View style={styles.percentageDisplay}>
                <Text style={[styles.percentageNumber, coloredTextStyle]}>
                  {average || '--'}
                </Text>
                <Text style={[styles.percentageSymbol, coloredTextStyle]}>
                  %
                </Text>
              </View>
              <Text style={styles.percentageLabel}>Average</Text>
            </View>
          </View>

          {/* Progress Bar */}
          {average && (
            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={[styles.progressValue, coloredTextStyle]}>
                  {average}%
                </Text>
              </View>
              <View style={styles.progressBarWrapper}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, progressFillStyle]} />
                </View>
              </View>
            </View>
          )}

          {/* Bottom Info */}
          <View style={styles.bottomInfo}>
            <View style={styles.typeBreakdown}>
              {summativeCount > 0 && (
                <View style={styles.typeItem}>
                  <View style={[styles.typeDot, typeDotStyle]} />
                  <Text style={styles.typeText}>
                    {summativeCount} Summative
                  </Text>
                </View>
              )}
              {formativeCount > 0 && (
                <View style={styles.typeItem}>
                  <View style={[styles.typeDot, typeDotFadedStyle]} />
                  <Text style={styles.typeText}>
                    {formativeCount} Life Skills
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Floating Badge */}
          <View style={[styles.floatingBadge, iconContainerStyle]}>
            <FontAwesomeIcon icon={faTrophy} size={10} color='#fff' />
          </View>
        </TouchableOpacity>
      );
    },
    [grades, styles]
  );

  const renderTabButton = (tabName, title) => (
    <TouchableOpacity
      key={tabName}
      style={[
        styles.tabButton,
        activeTab === tabName && styles.activeTabButton,
      ]}
      onPress={() => setActiveTab(tabName)}
    >
      <Text
        style={[
          styles.tabButtonText,
          activeTab === tabName && styles.activeTabButtonText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Helper function to get grade performance color
  const getGradeColor = (percentage) => {
    if (percentage >= 90) return '#34C759'; // Green for excellent
    if (percentage >= 80) return '#007AFF'; // Blue for good
    if (percentage >= 70) return '#FF9500'; // Orange for average
    if (percentage >= 60) return '#FF3B30'; // Red for below average
    return '#8E8E93'; // Gray for poor
  };

  // Helper function to get grade performance label
  const getGradeLabel = (percentage) => {
    if (percentage === null || percentage === undefined || isNaN(percentage)) {
      return 'N/A'; // Not Applicable or Ungraded if no percentage
    }
    if (percentage >= 90) return 'A*'; // Outstanding
    if (percentage >= 80) return 'A'; // Excellent
    if (percentage >= 70) return 'B'; // Good
    if (percentage >= 60) return 'C'; // Satisfactory
    if (percentage >= 50) return 'D'; // Passing
    if (percentage >= 40) return 'E'; // Minimum Passing / Needs Improvement
    return 'U'; // Ungraded / Fail
  };

  // Modern grade card component
  const renderGradeCard = ({ item, index }) => {
    const isFormative = activeTab === 'formative';

    // Calculate card width based on orientation
    const cardStyle = isLandscape
      ? [
          styles.gradeCard,
          styles.landscapeGradeCard,
          index % 2 === 0 && styles.evenGradeCard,
        ]
      : [styles.gradeCard, index % 2 === 0 && styles.evenGradeCard];

    // For formative grades, use the new assessment criteria layout
    if (isFormative) {
      // Get assessment criteria from the item - only show criteria that have values
      const assessmentCriteria = [
        { label: 'EE', value: item.tt1 || '', color: '#34C759' }, // Green for Exceeding Expectations
        { label: 'ME', value: item.tt2 || '', color: '#FF9500' }, // Orange for Meeting Expectations
        { label: 'AE', value: item.tt3 || '', color: '#007AFF' }, // Blue for Approaching Expectations
        { label: 'BE', value: item.tt4 || '', color: '#FF3B30' }, // Red for Below Expectations
      ].filter((criteria) => criteria.value.trim() !== ''); // Only show criteria with values

      return (
        <View style={cardStyle}>
          <View style={styles.gradeCardHeader}>
            <View style={styles.gradeCardLeft}>
              <Text
                style={[
                  styles.gradeTitle,
                  isLandscape && styles.landscapeGradeTitle,
                ]}
                numberOfLines={isLandscape ? 2 : 3}
              >
                {item.title}
              </Text>
              <Text style={styles.gradeDate}>{item.date}</Text>
            </View>
            <View style={styles.gradeCardRight}>
              <View style={styles.assessmentCriteriaContainer}>
                {assessmentCriteria.map((criteria) => (
                  <View
                    key={criteria.label}
                    style={[
                      styles.criteriaItem,
                      { backgroundColor: criteria.color },
                    ]}
                  >
                    <Text style={styles.criteriaLabel}>{criteria.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.gradeCardBody}>
            <View style={styles.gradeDetails}>
              <View style={styles.gradeDetailItem}>
                <FontAwesomeIcon
                  icon={faUser}
                  size={isLandscape ? 12 : 14}
                  color='#666'
                />
                <Text
                  style={[
                    styles.gradeDetailText,
                    isLandscape && styles.landscapeDetailText,
                  ]}
                  numberOfLines={1}
                >
                  {item.teacher}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    // For summative grades, use the existing logic
    const percentage = parseFloat(item.percentage?.replace('%', '')) || 0;
    const gradeColor = getGradeColor(percentage);
    const gradeLabel = getGradeLabel(percentage);

    return (
      <View style={cardStyle}>
        <View style={styles.gradeCardHeader}>
          <View style={styles.gradeCardLeft}>
            <Text
              style={[
                styles.gradeTitle,
                isLandscape && styles.landscapeGradeTitle,
              ]}
              numberOfLines={isLandscape ? 2 : 3}
            >
              {item.title}
            </Text>
            <Text style={styles.gradeDate}>Strand: {item.strand}</Text>
            <Text style={styles.gradeDate}>Date: {item.date}</Text>
          </View>
          <View style={styles.gradeCardRight}>
            <View
              style={[
                styles.gradeScoreContainer,
                { backgroundColor: `${gradeColor}15` },
                isLandscape && styles.landscapeScoreContainer,
              ]}
            >
              <Text
                style={[
                  styles.gradeScore,
                  { color: gradeColor },
                  isLandscape && styles.landscapeGradeScore,
                ]}
              >
                {item.score}
              </Text>
              <Text
                style={[
                  styles.gradePercentage,
                  { color: gradeColor },
                  isLandscape && styles.landscapeGradePercentage,
                ]}
              >
                {item.percentage}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.gradeCardBody}>
          <View style={styles.gradeDetails}>
            <View style={styles.gradeDetailItem}>
              <FontAwesomeIcon
                icon={faUser}
                size={isLandscape ? 12 : 14}
                color='#666'
              />
              <Text
                style={[
                  styles.gradeDetailText,
                  isLandscape && styles.landscapeDetailText,
                ]}
                numberOfLines={1}
              >
                {item.teacher}
              </Text>
            </View>
            <View style={styles.gradeDetailItem}>
              <FontAwesomeIcon
                icon={faTrophy}
                size={isLandscape ? 12 : 14}
                color='#666'
              />
              <Text
                style={[
                  styles.gradeDetailText,
                  isLandscape && styles.landscapeDetailText,
                ]}
                numberOfLines={1}
              >
                {item.type}
              </Text>
            </View>
          </View>

          <View style={styles.gradePerformanceContainer}>
            <View
              style={[
                styles.gradePerformanceBadge,
                { backgroundColor: gradeColor },
                isLandscape && styles.landscapePerformanceBadge,
              ]}
            >
              <Text
                style={[
                  styles.gradePerformanceText,
                  isLandscape && styles.landscapePerformanceText,
                ]}
              >
                {gradeLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderPaginationControls = (data) => {
    const totalPages = getTotalPages(data);

    // Show pagination if there's any data
    if (!data || data.length === 0) {
      return null;
    }

    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage === totalPages;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            isFirstPage && styles.disabledButton,
          ]}
          onPress={goToPreviousPage}
          disabled={isFirstPage}
        >
          <Text
            style={[
              styles.paginationButtonText,
              isFirstPage && styles.disabledText,
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.pageInfo}>
          <Text style={styles.pageInfoText}>
            Page {currentPage} of {totalPages}
          </Text>
          <Text style={styles.itemsInfoText}>
            Showing{' '}
            {Math.min(
              itemsPerPage,
              data.length - (currentPage - 1) * itemsPerPage
            )}{' '}
            of {data.length} items
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.paginationButton, isLastPage && styles.disabledButton]}
          onPress={() => goToNextPage(totalPages)}
          disabled={isLastPage}
        >
          <Text
            style={[
              styles.paginationButtonText,
              isLastPage && styles.disabledText,
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSummativeContent = () => {
    // Use real API data if available, otherwise show dummy data
    let summativeData = [];

    if (grades?.summative && Array.isArray(grades.summative)) {
      // Transform API data to match our table format
      summativeData = grades.summative.map((item, index) => {
        // Handle different possible field names for score data
        // API uses: score, score_percentage (not obtained_marks, percentage)
        const obtainedMarks =
          item.score ||
          item.obtained_marks ||
          item.marks_obtained ||
          item.student_marks;
        const maxMarks =
          item.max_score ||
          item.total_marks ||
          item.maximum_marks ||
          item.full_marks ||
          100;
        const percentage =
          item.score_percentage || item.percentage || item.percent;

        // Create score display - check for null/undefined, not falsy values (0 is valid)
        // If score is null/undefined, show "Not Graded" instead of "N/A"
        const scoreDisplay =
          obtainedMarks !== null && obtainedMarks !== undefined && maxMarks
            ? `${obtainedMarks}/${maxMarks}`
            : 'Not Graded';
        const percentageDisplay =
          percentage !== null && percentage !== undefined
            ? `${percentage}%`
            : 'Not Graded';

        return {
          id: item.id || index + 1,
          date: item.date || 'N/A',
          subject: item.subject_name || 'N/A',
          strand: item.strand_name || item.category || 'N/A', // Use category as fallback for strand
          title: item.assessment_name || 'N/A',
          score: scoreDisplay,
          percentage: percentageDisplay,
          type: item.type_title || item.category || 'N/A', // Use category as fallback for type
          teacher: item.teacher_name || item.teacher || 'N/A', // Use teacher as fallback
        };
      });
    } else {
      // Fallback dummy data for testing with different max scores
      summativeData = [
        {
          id: 1,
          date: '2025-03-19',
          subject: 'Mathematics',
          strand: 'Geometry',
          title: 'Geometry Exam',
          score: '93/100', // 93% of 100 = 93/100
          percentage: '93%',
          type: 'Major',
          teacher: 'Su Su Htwe',
        },
        {
          id: 2,
          date: '2024-01-20',
          subject: 'English',
          strand: 'Literature',
          title: 'Essay Writing',
          score: '46/50', // 92% of 50 = 46/50
          percentage: '92%',
          type: 'Assignment',
          teacher: 'Ms. Johnson',
        },
        {
          id: 3,
          date: '2024-01-25',
          subject: 'Physics',
          strand: 'Mechanics',
          title: 'Motion & Forces',
          score: '39/50', // 78% of 50 = 39/50
          percentage: '78%',
          type: 'Quiz',
          teacher: 'Dr. Brown',
        },
        {
          id: 4,
          date: '2024-02-01',
          subject: 'Chemistry',
          strand: 'Organic',
          title: 'Lab Report',
          score: '21/25', // 84% of 25 = 21/25
          percentage: '84%',
          type: 'Lab',
          teacher: 'Ms. Davis',
        },
        // Add more dummy data to test pagination (consistent data)
        {
          id: 5,
          date: '2024-02-05',
          subject: 'Biology',
          strand: 'Genetics',
          title: 'DNA Structure',
          score: '95/100',
          percentage: '95%',
          type: 'Project',
          teacher: 'Mr. Wilson',
        },
        {
          id: 6,
          date: '2024-02-10',
          subject: 'Mathematics',
          strand: 'Calculus',
          title: 'Derivatives Test',
          score: '88/100',
          percentage: '88%',
          type: 'Test',
          teacher: 'Ms. Smith',
        },
        {
          id: 7,
          date: '2024-02-15',
          subject: 'Physics',
          strand: 'Thermodynamics',
          title: 'Heat Transfer',
          score: '82/100',
          percentage: '82%',
          type: 'Quiz',
          teacher: 'Dr. Brown',
        },
        {
          id: 8,
          date: '2024-02-20',
          subject: 'Chemistry',
          strand: 'Inorganic',
          title: 'Periodic Table',
          score: '90/100',
          percentage: '90%',
          type: 'Assignment',
          teacher: 'Ms. Davis',
        },
        {
          id: 9,
          date: '2024-02-25',
          subject: 'English',
          strand: 'Grammar',
          title: 'Sentence Structure',
          score: '85/100',
          percentage: '85%',
          type: 'Test',
          teacher: 'Ms. Johnson',
        },
        {
          id: 10,
          date: '2024-03-01',
          subject: 'Biology',
          strand: 'Ecology',
          title: 'Ecosystem Study',
          score: '92/100',
          percentage: '92%',
          type: 'Project',
          teacher: 'Mr. Wilson',
        },
        {
          id: 11,
          date: '2024-03-05',
          subject: 'Mathematics',
          strand: 'Statistics',
          title: 'Data Analysis',
          score: '87/100',
          percentage: '87%',
          type: 'Assignment',
          teacher: 'Ms. Smith',
        },
        {
          id: 12,
          date: '2024-03-10',
          subject: 'Physics',
          strand: 'Optics',
          title: 'Light Refraction',
          score: '89/100',
          percentage: '89%',
          type: 'Lab',
          teacher: 'Dr. Brown',
        },
        {
          id: 13,
          date: '2024-03-15',
          subject: 'Chemistry',
          strand: 'Organic',
          title: 'Functional Groups',
          score: '91/100',
          percentage: '91%',
          type: 'Test',
          teacher: 'Ms. Davis',
        },
        {
          id: 14,
          date: '2024-03-20',
          subject: 'English',
          strand: 'Literature',
          title: 'Poetry Analysis',
          score: '86/100',
          percentage: '86%',
          type: 'Essay',
          teacher: 'Ms. Johnson',
        },
        {
          id: 15,
          date: '2024-03-25',
          subject: 'Biology',
          strand: 'Anatomy',
          title: 'Human Body Systems',
          score: '94/100',
          percentage: '94%',
          type: 'Test',
          teacher: 'Mr. Wilson',
        },
      ];
    }

    // Filter by selected subject
    if (selectedSubject) {
      summativeData = summativeData.filter(
        (item) => item.subject === selectedSubject
      );
    }

    // Safety check: ensure currentPage doesn't exceed totalPages
    const totalPages = getTotalPages(summativeData);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
      return null; // Re-render will happen with correct page
    }

    // Get paginated data
    const paginatedData = getPaginatedData(summativeData);

    return (
      <View style={styles.modernGradesContainer}>
        <FlatList
          data={paginatedData}
          renderItem={renderGradeCard}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.gradesList,
            isLandscape && { paddingHorizontal: 0 }, // Remove padding in landscape for full width
          ]}
          ItemSeparatorComponent={GradeSeparator}
          numColumns={isLandscape ? 2 : 1}
          key={isLandscape ? 'landscape' : 'portrait'} // Force re-render when orientation changes
        />
        <View style={styles.paginationSection}>
          {renderPaginationControls(summativeData)}
        </View>
      </View>
    );
  };

  const renderFormativeContent = () => {
    // Use real API data if available, otherwise show message
    let formativeData = [];

    if (grades?.formative && Array.isArray(grades.formative)) {
      // Transform API data to match our formative card format
      formativeData = grades.formative.map((item, index) => {
        return {
          id: item.id || index + 1,
          date: item.date || 'N/A',
          subject: item.subject_name || 'N/A',
          title: item.assessment_name || 'N/A',
          teacher: item.teacher_name || item.teacher || 'N/A',
          grade: item.grade || 'N/A',
          percentage: item.percentage || 0,
          feedback: item.feedback || '',
          category: item.category || 'N/A',
          // Assessment criteria fields
          tt1: item.tt1 || '', // EE
          tt2: item.tt2 || '', // ME
          tt3: item.tt3 || '', // AE
          tt4: item.tt4 || '', // BE
        };
      });
    }

    // Filter by selected subject
    if (selectedSubject) {
      formativeData = formativeData.filter(
        (item) => item.subject === selectedSubject
      );
    }

    if (formativeData.length === 0) {
      return (
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>
            {loading
              ? 'Loading formative grades...'
              : selectedSubject
              ? `No Life Skills grades available for ${selectedSubject}`
              : 'No Life Skills grades available'}
          </Text>
        </View>
      );
    }

    // Safety check: ensure currentPage doesn't exceed totalPages
    const totalPages = getTotalPages(formativeData);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
      return null; // Re-render will happen with correct page
    }

    // Get paginated data
    const paginatedData = getPaginatedData(formativeData);

    return (
      <View style={styles.modernGradesContainer}>
        <FlatList
          data={paginatedData}
          renderItem={renderGradeCard}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.gradesList,
            isLandscape && { paddingHorizontal: 0 }, // Remove padding in landscape for full width
          ]}
          ItemSeparatorComponent={GradeSeparator}
          numColumns={isLandscape ? 2 : 1}
          key={isLandscape ? 'landscape' : 'portrait'} // Force re-render when orientation changes
        />
        <View style={styles.paginationSection}>
          {renderPaginationControls(formativeData)}
        </View>
      </View>
    );
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
              if (showSubjectList) {
                navigation.goBack();
              } else {
                setShowSubjectList(true);
              }
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <FontAwesomeIcon icon={faChartLine} size={18} color='#fff' />
            <Text style={styles.headerTitle}>
              {showSubjectList
                ? `${t('grades')} - Select Subject`
                : isLandscape
                ? `${selectedSubject} - ${
                    activeTab === 'summative' ? 'Summative' : 'Life Skills'
                  }`
                : selectedSubject.substring(0, 16) || t('grades')}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {isLandscape && (
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() =>
                  setActiveTab(
                    activeTab === 'summative' ? 'formative' : 'summative'
                  )
                }
              >
                <Text style={styles.switchButtonText}>
                  {activeTab === 'summative' ? 'F' : 'S'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab Navigation Subheader - Only show when not in subject list and not landscape */}
        {!showSubjectList && !isLandscape && (
          <View style={styles.subHeader}>
            <View style={styles.tabContainer}>
              {renderTabButton('summative', 'Summative')}
              {renderTabButton('formative', 'Life Skills')}
            </View>
          </View>
        )}
      </View>

      <View style={[styles.content, isLandscape && styles.landscapeContent]}>
        {showSubjectList ? (
          // Show subject selection screen
          <View style={styles.subjectListContainer}>
            <View style={styles.headerSection}>
              <View style={styles.headerIconContainer}>
                <FontAwesomeIcon
                  icon={faGraduationCap}
                  size={32}
                  color='#FF9500'
                />
              </View>
              <Text style={styles.subjectListTitle}>Select a Subject</Text>
              <Text style={styles.subjectListSubtitle}>
                Choose a subject to view your grades and performance
              </Text>
            </View>
            <ScrollView
              style={styles.fullWidth}
              contentContainerStyle={styles.subjectGrid}
              showsVerticalScrollIndicator={false}
            >
              {availableSubjects.map((subject) => renderSubjectCard(subject))}
            </ScrollView>
          </View>
        ) : (
          // Show grades table for selected subject
          <View style={styles.gradesContainer}>
           

            {/* Tab Content */}
            <View style={styles.scrollContainer}>
              {activeTab === 'summative'
                ? renderSummativeContent()
                : renderFormativeContent()}
            </View>
          </View>
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
    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    headerTitle: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    notificationButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    switchButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    switchButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    studentInfo: {
      backgroundColor: '#fff',
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    studentNameText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      textAlign: 'center',
    },
    content: {
      flex: 1,
      paddingHorizontal: 5,
      paddingVertical: 10,
    },
    landscapeContent: {
      paddingHorizontal: 20, // More padding in landscape for better use of space
    },
    // Subject List Screen Styles
    subjectListContainer: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 20,
    },
    // Enhanced Header Section
    headerSection: {
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    headerIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 149, 0, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: theme.colors.warning,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: 2,
      borderColor: 'rgba(255, 149, 0, 0.2)',
    },
    subjectListTitle: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.colors.textSecondary,
      marginBottom: 12,
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    subjectListSubtitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 280,
    },
    subjectGrid: {
      alignItems: 'center',
      width: '100%',
      padding: 10,
    },
    fullWidth: {
      width: '100%',
    },

    // Modern Subject Card Styles - Dashboard Design
    modernSubjectCard: {
      backgroundColor: theme.colors.card,
      width: '100%',
      marginVertical: 10,
      borderRadius: 24,
      padding: 20,
      // Removed overflow: 'hidden' to prevent shadow clipping on Android
      // Only show border on iOS - Android elevation provides sufficient visual separation
      ...(Platform.OS === 'ios' && {
        borderWidth: 1,
        borderColor: theme.colors.border,
      }),
      // Enhanced shadow with border fallback for Android (no elevation to prevent clipping)
      ...createCardShadow(theme),
    },
    subjectCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    subjectIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      // Enhanced shadow using platform-specific utilities
      ...createMediumShadow(theme),
    },
    subjectInfo: {
      flex: 1,
    },
    modernSubjectTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 4,
      letterSpacing: 0.2,
    },
    subjectGradeCount: {
      fontSize: 14,
      color: '#666',
    },
    subjectCardRight: {
      alignItems: 'flex-end',
    },
    averageContainer: {
      alignItems: 'center',
      marginRight: 10,
    },
    averageText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    averageLabel: {
      fontSize: 12,
      color: '#666',
      marginTop: 2,
    },

    // Dashboard-style Subject Card Styles
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    titleContainer: {
      flex: 1,
    },
    assessmentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    assessmentCount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      marginLeft: 4,
    },
    expandButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Stats Row Section
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginBottom: 16,
      paddingVertical: 8,
    },
    gradeSection: {
      alignItems: 'center',
      flex: 1,
    },
    gradeCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      backgroundColor: theme.colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
      // Enhanced shadow using platform-specific utilities
      ...createSmallShadow(theme),
    },
    gradeLetterText: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    gradeLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
    },
    percentageSection: {
      alignItems: 'center',
      flex: 1,
    },
    percentageDisplay: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 6,
    },
    percentageNumber: {
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    percentageSymbol: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 2,
    },
    percentageLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
    },
    assessmentsSection: {
      alignItems: 'center',
      flex: 1,
    },
    assessmentsIndicator: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    assessmentsNumber: {
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    assessmentsLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
    },

    // Progress Section
    progressSection: {
      marginBottom: 16,
    },
    progressInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    progressValue: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
    },
    progressBarWrapper: {
      width: '100%',
    },
    progressTrack: {
      width: '100%',
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },

    // Bottom Info Section
    bottomInfo: {
      marginTop: 4,
    },
    typeBreakdown: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
    },
    typeItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    typeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 6,
    },
    typeText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },

    // Floating Badge
    floatingBadge: {
      position: 'absolute',
      top: 32,
      right: 56, // Move left to avoid overlapping with chevron button (32px width + 24px margin)
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      // Enhanced shadow using platform-specific utilities
      ...createSmallShadow(theme),
    },

    // Grades Screen Styles
    gradesContainer: {
      flex: 1,
    },
    subjectHeader: {
      margin: 10,
    },
   
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 4,
      marginHorizontal: 0,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 2,
    },
    activeTabButton: {
      backgroundColor: theme.colors.primary,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    tabButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    activeTabButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    scrollContainer: {
      flex: 1,
      paddingHorizontal: 5,
    },
    // Modern Grades Container Styles
    modernGradesContainer: {
      flex: 1,
      width: '100%', // Ensure full width usage
    },
    gradesList: {
      paddingBottom: 20,
      paddingHorizontal: 5, // Minimal horizontal padding to maximize width usage
    },
    gradeSeparator: {
      height: 12,
    },

    // Modern Grade Card Styles
    gradeCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 2, // Minimal horizontal margin for better width usage
      marginVertical: 6, // Add vertical margin for better spacing in two-column layout
      ...createSmallShadow(theme), // Enhanced shadow with border fallback for Android
      flex: 1, // Allow cards to expand in landscape mode
    },
    evenGradeCard: {
      backgroundColor: theme.colors.card,
    },
    gradeCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 15,
    },
    gradeCardLeft: {
      flex: 1,
      marginRight: 15,
    },
    gradeTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 6,
    },
    gradeDate: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    gradeCardRight: {
      alignItems: 'flex-end',
    },
    gradeScoreContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      minWidth: 80,
    },
    gradeScore: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    gradePercentage: {
      fontSize: 14,
      fontWeight: '600',
    },
    gradeCardBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    gradeDetails: {
      flex: 1,
    },
    gradeDetailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    gradeDetailText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 8,
    },
    gradePerformanceContainer: {
      alignItems: 'flex-end',
    },
    gradePerformanceBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    gradePerformanceText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },

    // Landscape-specific styles for grade cards
    landscapeGradeCard: {
      width: '49%', // Two cards per row with minimal margin for full width usage
      marginHorizontal: '0.5%',
    },
    landscapeGradeTitle: {
      fontSize: 16, // Slightly smaller for landscape
    },
    landscapeScoreContainer: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      minWidth: 70,
    },
    landscapeGradeScore: {
      fontSize: 14,
    },
    landscapeGradePercentage: {
      fontSize: 12,
    },
    landscapeDetailText: {
      fontSize: 12,
    },
    landscapePerformanceBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    landscapePerformanceText: {
      fontSize: 10,
    },

    // Assessment Criteria Styles for Formative Grades
    assessmentCriteriaContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      alignItems: 'center',
      maxWidth: 140,
    },
    criteriaItem: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginLeft: 6,
      marginBottom: 6,
      minWidth: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    criteriaLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
      textAlign: 'center',
    },
    comingSoon: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      padding: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    comingSoonText: {
      fontSize: 16,
      color: '#666',
      fontStyle: 'italic',
    },
    // Pagination styles
    paginationSection: {
      flexShrink: 0, // Prevent pagination from shrinking
    },
    landscapePaginationSection: {
      marginBottom: 20, // Add bottom margin in landscape mode
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 5,
      backgroundColor: theme.colors.card,
      // Only show top border on iOS - Android elevation provides sufficient visual separation
      ...(Platform.OS === 'ios' && {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      }),

      margin: 10,
      borderRadius: 30,
      ...createSmallShadow(theme),
      minHeight: 60, // Ensure minimum height for pagination
    },
    paginationButton: {
      paddingHorizontal: 15,
      paddingVertical: 8,
      backgroundColor: '#FF9500',
      borderRadius: 20,
      minWidth: 80,
      alignItems: 'center',
    },
    disabledButton: {
      backgroundColor: '#ccc',
    },
    paginationButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    disabledText: {
      color: '#999',
    },
    pageInfo: {
      alignItems: 'center',
    },
    pageInfoText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    itemsInfoText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  });
