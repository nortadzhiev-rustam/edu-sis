import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
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
} from '@fortawesome/free-solid-svg-icons';
import { useScreenOrientation } from '../hooks/useScreenOrientation';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationBadge from '../components/NotificationBadge';

// Simple separator component - only shows in portrait mode
const GradeSeparator = () => null; // We'll use marginVertical on cards instead

export default function GradesScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { unreadCount } = useNotifications();

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

  const styles = createStyles(theme);

  // Fetch grades data
  const fetchGrades = async () => {
    if (!authCode) {
      return;
    }

    try {
      setLoading(true);

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
        console.log('Grades data:', data);
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

  // Utility function to calculate and format score display
  const formatScore = (score, percentage) => {
    if (!score) return 'N/A';

    if (score && percentage && percentage > 0) {
      // Calculate max score: score = (percentage/100) * maxScore
      // Therefore: maxScore = (score * 100) / percentage
      const maxScore = Math.round((score * 100) / percentage);

      // Validate the calculation makes sense
      if (maxScore > 0 && maxScore >= score) {
        return `${score}/${maxScore}`;
      }
    }

    // Fallback to just showing the score if percentage calculation doesn't work
    return `${score}`;
  };

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
        if (grade.subject_name === subject && grade.score_percentage) {
          subjectGrades.push(grade.score_percentage);
        }
      });
    }
    if (grades.formative) {
      grades.formative.forEach((grade) => {
        if (grade.subject_name === subject && grade.score_percentage) {
          subjectGrades.push(grade.score_percentage);
        }
      });
    }

    if (subjectGrades.length === 0) return null;
    return Math.round(
      subjectGrades.reduce((a, b) => a + b, 0) / subjectGrades.length
    );
  };

  const renderSubjectCard = (subject) => {
    const subjectColor = getSubjectColor(subject);
    const subjectIcon = getSubjectIcon(subject);
    const average = getSubjectAverage(subject);

    return (
      <TouchableOpacity
        key={subject}
        style={[styles.modernSubjectCard, { borderLeftColor: subjectColor }]}
        onPress={() => handleSubjectSelect(subject)}
      >
        <View style={styles.subjectCardHeader}>
          <View
            style={[
              styles.subjectIconContainer,
              { backgroundColor: `${subjectColor}15` },
            ]}
          >
            <FontAwesomeIcon
              icon={subjectIcon}
              size={24}
              color={subjectColor}
            />
          </View>
          <View style={styles.subjectInfo}>
            <Text style={styles.modernSubjectTitle}>{subject}</Text>
            <Text style={styles.subjectGradeCount}>
              {grades
                ? `${
                    (
                      grades.summative?.filter(
                        (g) => g.subject_name === subject
                      ) || []
                    ).length +
                    (
                      grades.formative?.filter(
                        (g) => g.subject_name === subject
                      ) || []
                    ).length
                  } grades`
                : 'View grades'}
            </Text>
          </View>
          <View style={styles.subjectCardRight}>
            {!!average && (
              <View style={styles.averageContainer}>
                <Text style={[styles.averageText, { color: subjectColor }]}>
                  {average}%
                </Text>
                <Text style={styles.averageLabel}>Average</Text>
              </View>
            )}
          </View>
          <FontAwesomeIcon icon={faChevronRight} size={16} color='#999' />
        </View>
      </TouchableOpacity>
    );
  };

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
      summativeData = grades.summative.map((item, index) => ({
        id: index + 1,
        date: item.date || 'N/A',
        subject: item.subject_name || 'N/A',
        strand: item.strand_name || 'N/A', // Not provided in API response
        title: item.assessment_name || 'N/A',
        score: formatScore(item.score, item.score_percentage),
        percentage: item.score_percentage ? `${item.score_percentage}%` : 'N/A',
        type: item.type_title || 'N/A',
        teacher: item.teacher_name || 'N/A',
      }));
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
      formativeData = grades.formative.map((item, index) => ({
        id: item.assessment_id || index + 1,
        date: item.date || 'N/A',
        subject: item.subject_name || 'N/A',
        title: item.assessment_name || 'N/A',
        teacher: item.teacher_name || 'N/A',
        // Assessment criteria fields
        tt1: item.tt1 || '', // EE
        tt2: item.tt2 || '', // ME
        tt3: item.tt3 || '', // AE
        tt4: item.tt4 || '', // BE
      }));
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
              ? `No formative grades available for ${selectedSubject}`
              : 'No formative grades available'}
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={20} color='#fff' />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <FontAwesomeIcon icon={faChartLine} size={20} color='#fff' />
          <Text style={styles.headerTitle}>
            {showSubjectList
              ? `${t('grades')} - Select Subject`
              : isLandscape
              ? `${selectedSubject} - ${
                  activeTab === 'summative' ? 'Summative' : 'Formative'
                }`
              : selectedSubject || t('grades')}
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
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('NotificationScreen')}
          >
            <FontAwesomeIcon icon={faBell} size={18} color='#fff' />
            <NotificationBadge />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.content, isLandscape && styles.landscapeContent]}>
        {showSubjectList ? (
          // Show subject selection screen
          <View style={styles.subjectListContainer}>
            <Text style={styles.subjectListTitle}>Select a Subject</Text>
            <ScrollView
              style={{ width: '100%' }}
              contentContainerStyle={styles.subjectGrid}
            >
              {availableSubjects.map((subject) => renderSubjectCard(subject))}
            </ScrollView>
          </View>
        ) : (
          // Show grades table for selected subject
          <View style={styles.gradesContainer}>
            {/* Back button and subject info */}
            <View style={styles.subjectHeader}>
              <TouchableOpacity
                style={styles.backToSubjectsButton}
                onPress={handleBackToSubjects}
              >
                <Text style={styles.backToSubjectsText}>
                  ← Back to Subjects
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Buttons - Hidden in landscape mode */}
            {!isLandscape && (
              <View style={styles.tabContainer}>
                {renderTabButton('summative', 'Summative')}
                {renderTabButton('formative', 'Formative')}
              </View>
            )}

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
      padding: 15,
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
    subjectListTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 30,
      textAlign: 'center',
    },
    subjectGrid: {
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: 20,
    },

    // Modern Subject Card Styles
    modernSubjectCard: {
      backgroundColor: '#fff',
      width: '100%',
      marginVertical: 8,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderLeftWidth: 4,
    },
    subjectCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
      color: '#333',
      marginBottom: 4,
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
    // Grades Screen Styles
    gradesContainer: {
      flex: 1,
    },
    subjectHeader: {
      marginBottom: 15,
    },
    backToSubjectsButton: {
      alignSelf: 'flex-start',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: '#fff',
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    backToSubjectsText: {
      fontSize: 14,
      color: '#FF9500',
      fontWeight: '600',
    },
    selectedSubjectTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center',
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: '#fff',
      borderRadius: 25,
      padding: 4,
      marginBottom: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 20,
      alignItems: 'center',
    },
    activeTabButton: {
      backgroundColor: '#FF9500',
    },
    tabButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#666',
    },
    activeTabButtonText: {
      color: '#fff',
    },
    scrollContainer: {
      flex: 1,
    },
    // Modern Grades Container Styles
    modernGradesContainer: {
      flex: 1,
      width: '100%', // Ensure full width usage
    },
    gradesList: {
      paddingBottom: 20,
      paddingHorizontal: 2, // Minimal horizontal padding to maximize width usage
    },
    gradeSeparator: {
      height: 12,
    },

    // Modern Grade Card Styles
    gradeCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 2, // Minimal horizontal margin for better width usage
      marginVertical: 6, // Add vertical margin for better spacing in two-column layout
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      flex: 1, // Allow cards to expand in landscape mode
    },
    evenGradeCard: {
      backgroundColor: '#fafafa',
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
      color: '#333',
      marginBottom: 6,
    },
    gradeDate: {
      fontSize: 14,
      color: '#666',
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
      color: '#666',
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
      backgroundColor: '#fff',
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
      paddingVertical: 12,
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
      marginTop: 20,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
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
      color: '#333',
    },
    itemsInfoText: {
      fontSize: 12,
      color: '#666',
      marginTop: 2,
    },
  });
