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
import { faArrowLeft, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { useScreenOrientation } from '../hooks/useScreenOrientation';

export default function GradesScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState('summative');
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const { studentName, authCode } = route.params || {};
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

  // Fetch grades data
  const fetchGrades = async () => {
    if (!authCode) {
      console.log('No authCode provided');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching grades with authCode:', authCode);
      const url = `https://sis.bfi.edu.mm/mobile-api/get-student-grades?authCode=${authCode}`;
      console.log('Request URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Raw grades data:', data);
        setGrades(data);
      } else {
        console.error(
          'Failed to fetch grades:',
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error('Error response body:', errorText);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
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
    console.log(
      `Pagination: Page ${currentPage}, Items ${startIndex + 1}-${Math.min(
        endIndex,
        data.length
      )} of ${data.length}`
    );
    return paginatedData;
  };

  const getTotalPages = (data) => {
    if (!data || data.length === 0) return 0;
    return Math.ceil(data.length / itemsPerPage);
  };

  const goToPage = (page) => {
    console.log(`Going to page: ${page}`);
    setCurrentPage(page);
  };

  const goToNextPage = (totalPages) => {
    if (currentPage < totalPages) {
      console.log(`Going to next page: ${currentPage + 1}`);
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      console.log(`Going to previous page: ${currentPage - 1}`);
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

  const renderSubjectCard = (subject) => (
    <TouchableOpacity
      key={subject}
      style={styles.subjectCard}
      onPress={() => handleSubjectSelect(subject)}
    >
      <Text style={styles.subjectCardTitle}>{subject}</Text>
      <Text style={styles.subjectCardSubtitle}>View grades</Text>
    </TouchableOpacity>
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

  const renderSummativeTableHeader = () => {
    if (isLandscape) {
      // Show all columns in landscape mode
      return (
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.dateColumn]}>Date</Text>
          <Text style={[styles.headerCell, styles.strandColumn]}>Strand</Text>
          <Text style={[styles.headerCell, styles.titleColumn]}>Title</Text>
          <Text style={[styles.headerCell, styles.scoreColumn]}>Score</Text>
          <Text style={[styles.headerCell, styles.percentageColumn]}>%</Text>
          <Text style={[styles.headerCell, styles.typeColumn]}>Type</Text>
          <Text style={[styles.headerCell, styles.teacherColumn]}>Teacher</Text>
        </View>
      );
    } else {
      // Show only important columns in portrait mode
      return (
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.portraitDateColumn]}>
            Date
          </Text>
          <Text style={[styles.headerCell, styles.portraitTitleColumn]}>
            Title
          </Text>
          <Text style={[styles.headerCell, styles.portraitScoreColumn]}>
            Score
          </Text>
          <Text style={[styles.headerCell, styles.portraitPercentageColumn]}>
            %
          </Text>
        </View>
      );
    }
  };

  const renderSummativeRow = ({ item, index }) => {
    if (isLandscape) {
      // Show all columns in landscape mode
      return (
        <View style={[styles.tableRow, index % 2 === 0 && styles.evenRow]}>
          <Text style={[styles.cell, styles.dateColumn]}>
            {item.date || 'N/A'}
          </Text>
          <Text style={[styles.cell, styles.strandColumn]}>
            {item.strand || 'N/A'}
          </Text>
          <Text style={[styles.cell, styles.titleColumn]}>
            {item.title || 'N/A'}
          </Text>
          <Text style={[styles.cell, styles.scoreColumn]}>
            {item.score || 'N/A'}
          </Text>
          <Text style={[styles.cell, styles.percentageColumn]}>
            {item.percentage || 'N/A'}
          </Text>
          <Text style={[styles.cell, styles.typeColumn]}>
            {item.type || 'N/A'}
          </Text>
          <Text style={[styles.cell, styles.teacherColumn]}>
            {item.teacher || 'N/A'}
          </Text>
        </View>
      );
    } else {
      // Show only important columns in portrait mode
      return (
        <View style={[styles.tableRow, index % 2 === 0 && styles.evenRow]}>
          <Text style={[styles.cell, styles.portraitDateColumn]}>
            {item.date || 'N/A'}
          </Text>
          <Text style={[styles.cell, styles.portraitTitleColumn]}>
            {item.title || 'N/A'}
          </Text>
          <Text style={[styles.cell, styles.portraitScoreColumn]}>
            {item.score || 'N/A'}
          </Text>
          <Text style={[styles.cell, styles.portraitPercentageColumn]}>
            {item.percentage || 'N/A'}
          </Text>
        </View>
      );
    }
  };

  const renderPaginationControls = (data) => {
    const totalPages = getTotalPages(data);

    console.log(
      `Rendering pagination: ${data.length} items, ${totalPages} pages, current page: ${currentPage}`
    );

    // Show pagination if there's any data
    if (!data || data.length === 0) {
      console.log('No data for pagination');
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
        strand: 'N/A', // Not provided in API response
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

    console.log(
      `Summative: Total items: ${summativeData.length}, Total pages: ${totalPages}, Current page: ${currentPage}, Paginated items: ${paginatedData.length}`
    );

    return (
      <View style={styles.tableWithPagination}>
        <View style={styles.tableSection}>
          <View
            style={[
              styles.tableContainer,
              isLandscape && styles.landscapeTableContainer,
            ]}
          >
            {renderSummativeTableHeader()}
            <FlatList
              data={paginatedData}
              renderItem={renderSummativeRow}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              style={styles.tableBody}
              nestedScrollEnabled={true}
            />
          </View>
        </View>
        <View
          style={[
            styles.paginationSection,
            isLandscape && styles.landscapePaginationSection,
          ]}
        >
          {renderPaginationControls(summativeData)}
        </View>
      </View>
    );
  };

  const renderFormativeContent = () => {
    // Use real API data if available, otherwise show message
    let formativeData = [];

    if (grades?.formative && Array.isArray(grades.formative)) {
      // Transform API data to match our table format
      formativeData = grades.formative.map((item, index) => {
        // Calculate max score based on score and percentage
        let scoreDisplay = 'N/A';
        if (item.score && item.score_percentage) {
          const maxScore = Math.round(
            (item.score * 100) / item.score_percentage
          );
          scoreDisplay = `${item.score}/${maxScore}`;
        } else if (item.score) {
          scoreDisplay = `${item.score}`;
        }

        return {
          id: index + 1,
          date: item.date || 'N/A',
          subject: item.subject_name || 'N/A',
          strand: 'N/A', // Not provided in API response
          title: item.assessment_name || 'N/A',
          score: scoreDisplay,
          percentage: item.score_percentage
            ? `${item.score_percentage}%`
            : 'N/A',
          type: item.type_title || 'N/A',
          teacher: item.teacher_name || 'N/A',
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

    console.log(
      `Formative: Total items: ${formativeData.length}, Total pages: ${totalPages}, Current page: ${currentPage}, Paginated items: ${paginatedData.length}`
    );

    return (
      <View style={styles.tableWithPagination}>
        <View style={styles.tableSection}>
          <View
            style={[
              styles.tableContainer,
              isLandscape && styles.landscapeTableContainer,
            ]}
          >
            {renderSummativeTableHeader()}
            <FlatList
              data={paginatedData}
              renderItem={renderSummativeRow}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              style={styles.tableBody}
              nestedScrollEnabled={true}
            />
          </View>
        </View>
        <View
          style={[
            styles.paginationSection,
            isLandscape && styles.landscapePaginationSection,
          ]}
        >
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
              ? 'Grades - Select Subject'
              : isLandscape
              ? `${selectedSubject} - ${
                  activeTab === 'summative' ? 'Summative' : 'Formative'
                }`
              : selectedSubject || 'Grades'}
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

      {/* {!isLandscape && studentName && (
        <View style={styles.studentInfo}>
          <Text style={styles.studentNameText}>Grades for {studentName}</Text>
        </View>
      )} */}

      <View style={styles.content}>
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
            {isLandscape ? (
              // In landscape mode, show content with horizontal scroll based on active tab
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollContainer}
              >
                {activeTab === 'summative'
                  ? renderSummativeContent()
                  : renderFormativeContent()}
              </ScrollView>
            ) : (
              // In portrait mode, show content based on selected tab
              <View style={styles.scrollContainer}>
                {activeTab === 'summative'
                  ? renderSummativeContent()
                  : renderFormativeContent()}
              </View>
            )}
          </View>
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
    backgroundColor: '#FF9500',
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
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
  // Subject List Screen Styles
  subjectListContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  subjectListTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  subjectGrid: {
    // flexDirection: 'row', // Removed for list view
    // flexWrap: 'wrap', // Removed for list view
    // justifyContent: 'center', // Adjusted for list view
    alignItems: 'center', // Center items in the list
    width: '100%',
  },
  subjectCard: {
    backgroundColor: '#fff',
    width: '90%', // Make cards take most of the width
    minHeight: 80, // Adjust height as needed for list items
    marginVertical: 8, // Add vertical margin for spacing
    // margin: '4%', // Removed, using marginVertical instead
    borderRadius: 15,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // Adjusted shadow for a flatter list item look
    shadowOpacity: 0.05, // Reduced opacity
    shadowRadius: 4, // Adjusted radius
    elevation: 3,
    borderWidth: 1, // Adjusted border
    borderColor: '#e0e0e0', // Softer border color
  },
  subjectCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subjectCardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    
  },
  backToSubjectsText: {
    fontSize: 14,
    color: '#666',
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
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    minHeight: 180,
  },
  landscapeTableContainer: {
    minWidth: Dimensions.get('window'), // Make table scrollable horizontally in landscape
    width: '100%'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FF9500',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCell: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  tableBody: {
    maxHeight: 500, // Constrain table height to ensure pagination is visible
    minHeight: 120, // Ensure minimum visible height
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  evenRow: {
    backgroundColor: '#f9f9f9',
  },
  cell: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  // Column widths
  dateColumn: {
    width: 80,
  },
  strandColumn: {
    width: 90,
  },
  titleColumn: {
    width: 150,
  },
  scoreColumn: {
    width: 60,
  },
  percentageColumn: {
    width: 50,
  },
  typeColumn: {
    width: 80,
  },
  teacherColumn: {
    width: 170,
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
  // Portrait mode column widths (important columns only)
  portraitDateColumn: {
    width: 90,
  },
  portraitTitleColumn: {
    width: 150,
  },
  portraitScoreColumn: {
    width: 60,
  },
  portraitPercentageColumn: {
    width: 50,
  },
  // Pagination styles
  tableWithPagination: {
    flex: 1,
    flexDirection: 'column',
    width: Dimensions.get('window'),
  },
  tableSection: {
    flex: 1,
    minHeight: 160, // Ensure minimum height for table visibility
  },
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
