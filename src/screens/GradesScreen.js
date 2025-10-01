import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SectionList,
  ScrollView,
  Dimensions,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Config, buildApiUrl } from '../config/env';
import {
  faArrowLeft,
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
  faChevronDown,
  faChevronUp,
  faChartBar,
} from '@fortawesome/free-solid-svg-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useScreenOrientation } from '../hooks/useScreenOrientation';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';

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
  const { refreshNotifications } = useNotifications();

  const [activeTab, setActiveTab] = useState('summative');
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const { authCode } = route.params || {};
  const [grades, setGrades] = useState(null);
  const [calculatedGrades, setCalculatedGrades] = useState(null);
  const [strandGrades, setStrandGrades] = useState(null);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [selectedStrand, setSelectedStrand] = useState(null);
  const [strandAssessments, setStrandAssessments] = useState([]); // Advanced calculation results
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

  // Fetch grades data (legacy details + advanced calculation summary)
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
        setCalculatedGrades(null);
        setLoading(false);
        return;
      }

      const legacyUrl = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_GRADES, {
        authCode,
      });
      const calcUrl = buildApiUrl(
        Config.API_ENDPOINTS.GET_STUDENT_CALCULATED_GRADES,
        { authCode }
      );
      const strandUrl = buildApiUrl(
        Config.API_ENDPOINTS.GET_STUDENT_GRADES_BY_STRANDS,
        { authCode }
      );

      console.log('🔍 GRADES: Fetching from URLs:', {
        legacy: legacyUrl,
        calculated: calcUrl,
        strands: strandUrl,
      });

      const [legacyRes, calcRes, strandRes] = await Promise.all([
        fetch(legacyUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }),
        fetch(calcUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }),
        fetch(strandUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (legacyRes.ok) {
        const legacyData = await legacyRes.json();
        setGrades(legacyData);
      } else {
        console.error('Failed to fetch grades (legacy):', legacyRes.status);
      }

      if (calcRes.ok) {
        const calcData = await calcRes.json();
        console.log('🔍 GRADES: Advanced calculation API response:', calcData);
        if (calcData?.success && calcData?.data) {
          console.log('✅ GRADES: Advanced calculation data received:', {
            hasSummary: !!calcData.data.summary,
            hasSubjectAverages: !!calcData.data.subject_averages,
            subjectCount: calcData.data.subject_averages?.length || 0,
          });
          setCalculatedGrades(calcData.data);
        } else {
          console.warn(
            '⚠️ GRADES: Advanced calculation API returned invalid format:',
            calcData
          );
          setCalculatedGrades(null);
        }
      } else {
        console.error(
          '❌ GRADES: Failed to fetch calculated grades:',
          calcRes.status
        );
        setCalculatedGrades(null);
      }

      // Handle strand-based grades response
      if (strandRes.ok) {
        const strandData = await strandRes.json();
        console.log('🔍 GRADES: Strand-based API response:', strandData);
        if (strandData?.success && strandData?.data) {
          console.log('✅ GRADES: Strand-based data received:', {
            calculationMethod: strandData.calculation_method,
            subjectsWithStrands:
              strandData.data.subjects_with_strands?.length || 0,
          });
          setStrandGrades(strandData.data);
        } else {
          console.warn(
            '⚠️ GRADES: Strand-based API returned invalid format:',
            strandData
          );
          setStrandGrades(null);
        }
      } else {
        console.error(
          '❌ GRADES: Failed to fetch strand-based grades:',
          strandRes.status
        );
        setStrandGrades(null);
      }
    } catch (error) {
      // Handle error silently
      console.error('Failed to fetch grades:', error);
      setCalculatedGrades(null);
      setStrandGrades(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, [authCode]);

  // Extract unique subjects from grades data (union of legacy + advanced results)
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

    // Include subjects from advanced calculation if present
    if (
      calculatedGrades?.subject_averages &&
      Array.isArray(calculatedGrades.subject_averages)
    ) {
      calculatedGrades.subject_averages.forEach((s) => {
        if (s.subject_name) {
          subjects.add(s.subject_name);
        }
      });
    }

    // If no API data, extract from dummy data
    if (
      (!gradesData?.summative || gradesData.summative.length === 0) &&
      (!gradesData?.formative || gradesData.formative.length === 0) &&
      (!calculatedGrades?.subject_averages ||
        calculatedGrades.subject_averages.length === 0)
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

  // Get summary data (only from advanced API)
  const getSummaryData = useCallback(() => {
    return calculatedGrades?.summary || null;
  }, [calculatedGrades]);

  // Prepare section list data from strand grades
  const getSectionListData = useCallback(() => {
    if (!strandGrades?.subjects_with_strands) {
      return [];
    }

    return strandGrades.subjects_with_strands.map((subject) => ({
      title: subject.subject_name,
      data: expandedSections.has(subject.subject_name) ? subject.strands : [],
      subjectId: subject.subject_id,
      // Include the full subject data for header calculations
      subjectData: subject,
    }));
  }, [strandGrades, expandedSections]);

  // Prepare formative data in section list format
  const getFormativeSectionListData = useCallback(() => {
    if (!grades?.formative) {
      return [];
    }

    // Group formative assessments by subject
    const subjectGroups = {};
    grades.formative.forEach((assessment) => {
      const subject = assessment.subject_name;
      if (!subjectGroups[subject]) {
        subjectGroups[subject] = [];
      }
      subjectGroups[subject].push(assessment);
    });

    // Convert to section list format
    return Object.entries(subjectGroups).map(([subjectName, assessments]) => ({
      title: subjectName,
      data: expandedSections.has(subjectName) ? assessments : [],
      subjectId: assessments[0]?.subject_id || subjectName,
      // Calculate subject summary for formative
      subjectData: {
        total_assessments: assessments.length,
        subject_name: subjectName,
      },
    }));
  }, [grades, expandedSections]);

  // Toggle section expansion (accordion style - only one open at a time)
  const toggleSection = useCallback((sectionTitle) => {
    setExpandedSections((prev) => {
      const newSet = new Set();
      // If the clicked section is already expanded, collapse it (empty set)
      // If it's not expanded, expand only this section
      if (!prev.has(sectionTitle)) {
        newSet.add(sectionTitle);
      }
      return newSet;
    });
  }, []);

  // Get assessments for a specific strand
  const getStrandAssessments = useCallback(
    (subjectName, strandName) => {
      if (!grades) {
        console.log('🚫 STRAND: No grades data available');
        return [];
      }

      // Combine summative and formative assessments
      const allAssessments = [
        ...(grades.summative || []),
        ...(grades.formative || []),
      ];

      console.log(
        `🔍 STRAND: Total assessments available: ${allAssessments.length}`
      );
      console.log('🔍 STRAND: Sample assessment structure:', allAssessments[0]);

      // Filter assessments by subject and strand
      const subjectAssessments = allAssessments.filter(
        (assessment) => assessment.subject_name === subjectName
      );

      console.log(
        `🔍 STRAND: Assessments for ${subjectName}: ${subjectAssessments.length}`
      );

      // Filter assessments by strand logic:
      // - ONLY summative assessments that match the strand_name
      // - ONLY graded assessments (have a score)
      // - Formative assessments should NOT appear in strand modals
      const strandAssessments = subjectAssessments.filter((assessment) => {
        // Check if this is a summative assessment (from grades.summative array)
        const isSummative = grades.summative?.some((s) => s === assessment);

        if (isSummative) {
          // For summative assessments, filter by strand_name
          if (assessment.strand_name) {
            const matches = assessment.strand_name === strandName;

            // Also check if the assessment is graded (has a score)
            const isGraded =
              assessment.score !== null &&
              assessment.score !== undefined &&
              assessment.score !== '';

            console.log(
              `🔍 STRAND: Summative assessment ${assessment.assessment_name}: strand_match=${matches}, is_graded=${isGraded} (score: ${assessment.score})`
            );

            return matches && isGraded;
          } else {
            console.log(
              `⚠️ STRAND: Summative assessment ${assessment.assessment_name} missing strand_name`
            );
            return false;
          }
        } else {
          // Formative assessments should NOT appear in strand modals
          console.log(
            `❌ STRAND: Excluding formative assessment ${assessment.assessment_name} (formative assessments don't belong to strands)`
          );
          return false;
        }
      });

      console.log(
        `🔍 STRAND: Final assessments to show: ${strandAssessments.length}`
      );

      // Sort assessments by date (newest first)
      return strandAssessments.sort((a, b) => {
        const dateA = new Date(a.date || a.date_created || 0);
        const dateB = new Date(b.date || b.date_created || 0);
        return dateB - dateA;
      });
    },
    [grades]
  );

  // Handle strand selection
  const handleStrandPress = useCallback(
    (strand, subjectName) => {
      console.log(
        `🔍 STRAND: Selected ${strand.strand_name} in ${subjectName}`
      );
      console.log('🔍 STRAND: Current grades data:', grades);

      const assessments = getStrandAssessments(subjectName, strand.strand_name);
      console.log(
        `📊 STRAND: Found ${assessments.length} assessments:`,
        assessments
      );

      setSelectedStrand({
        ...strand,
        subjectName,
        assessments,
      });
      setStrandAssessments(assessments);
    },
    [getStrandAssessments, grades]
  );

  // Close strand details
  const closeStrandDetails = useCallback(() => {
    setSelectedStrand(null);
    setStrandAssessments([]);
  }, []);

  // Refresh assessments when grades data changes and modal is open
  useEffect(() => {
    if (selectedStrand && grades) {
      console.log('🔄 STRAND: Refreshing assessments due to data change');
      const refreshedAssessments = getStrandAssessments(
        selectedStrand.subjectName,
        selectedStrand.strand_name
      );
      console.log(
        `🔄 STRAND: Refreshed to ${refreshedAssessments.length} assessments`
      );

      // Only update if the assessments have actually changed
      if (
        JSON.stringify(refreshedAssessments) !==
        JSON.stringify(strandAssessments)
      ) {
        setStrandAssessments(refreshedAssessments);
        setSelectedStrand((prev) => ({
          ...prev,
          assessments: refreshedAssessments,
        }));
      }
    }
  }, [
    selectedStrand?.strand_name,
    selectedStrand?.subjectName,
    grades,
    getStrandAssessments,
    strandAssessments,
  ]);

  // Render section header for SectionList
  const renderSectionHeader = useCallback(
    ({ section }) => {
      const subjectColor = getSubjectColor(section.title);
      const subjectIcon = getSubjectIcon(section.title);
      const isExpanded = expandedSections.has(section.title);

      // Use API-provided subject data instead of calculating from strands
      const subjectData = section.subjectData;
      const overallAverage = subjectData?.subject_overall_average
        ? Math.round(subjectData.subject_overall_average)
        : '--';
      const overallGrade = subjectData?.subject_letter_grade || '--';
      const totalStrands =
        subjectData?.total_strands || subjectData?.strands?.length || 0;

      return (
        <TouchableOpacity
          style={[
            styles.sectionHeader,
            { backgroundColor: `${subjectColor}15` },
          ]}
          onPress={() => toggleSection(section.title)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <View
              style={[
                styles.sectionHeaderIcon,
                { backgroundColor: subjectColor },
              ]}
            >
              <FontAwesomeIcon icon={subjectIcon} size={16} color='#fff' />
            </View>
            <View style={styles.sectionHeaderInfo}>
              <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
              <Text style={styles.sectionHeaderSubtitle}>
                {totalStrands} strand
                {totalStrands !== 1 ? 's' : ''}
                {isExpanded ? ' • Expanded' : ' • Tap to expand'}
              </Text>
            </View>
          </View>
          <View style={styles.sectionHeaderRight}>
            <View style={styles.sectionHeaderGrades}>
              <Text
                style={[styles.sectionHeaderAverage, { color: subjectColor }]}
              >
                {overallAverage === '--' ? '--' : `${overallAverage}%`}
              </Text>
              <Text
                style={[
                  styles.sectionHeaderGrade,
                  { backgroundColor: subjectColor },
                ]}
              >
                {overallGrade}
              </Text>
            </View>
            <View style={styles.expandIcon}>
              <FontAwesomeIcon
                icon={isExpanded ? faChevronUp : faChevronDown}
                size={12}
                color={subjectColor}
              />
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [expandedSections, toggleSection]
  );

  // Render formative section header
  const renderFormativeSectionHeader = useCallback(
    ({ section }) => {
      const subjectColor = getSubjectColor(section.title);
      const subjectIcon = getSubjectIcon(section.title);
      const isExpanded = expandedSections.has(section.title);

      const subjectData = section.subjectData;
      const totalAssessments = subjectData?.total_assessments || 0;

      return (
        <TouchableOpacity
          style={[
            styles.sectionHeader,
            { backgroundColor: `${subjectColor}15` },
          ]}
          onPress={() => toggleSection(section.title)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <View
              style={[
                styles.sectionHeaderIcon,
                { backgroundColor: subjectColor },
              ]}
            >
              <FontAwesomeIcon icon={subjectIcon} size={16} color='#fff' />
            </View>
            <View style={styles.sectionHeaderInfo}>
              <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
              <Text style={styles.sectionHeaderSubtitle}>
                {totalAssessments} assessment{totalAssessments !== 1 ? 's' : ''}
                {isExpanded ? ' • Expanded' : ' • Tap to expand'}
              </Text>
            </View>
          </View>
          <View style={styles.sectionHeaderRight}>
            <View style={styles.sectionHeaderGrades}>
              <Text
                style={[styles.sectionHeaderAverage, { color: subjectColor }]}
              >
                Life Skill
              </Text>
            </View>
            <View style={styles.expandIcon}>
              <FontAwesomeIcon
                icon={isExpanded ? faChevronUp : faChevronDown}
                size={12}
                color={subjectColor}
              />
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [expandedSections, toggleSection]
  );

  // Render strand item for SectionList
  const renderStrandItem = useCallback(({ item, section }) => {
    const subjectColor = getSubjectColor(section.title);

    return (
      <TouchableOpacity
        style={styles.strandItem}
        onPress={() => handleStrandPress(item, section.title)}
        activeOpacity={0.7}
      >
        <View style={styles.strandItemLeft}>
          <Text style={styles.strandName}>{item.strand_name}</Text>
          <Text style={styles.strandDetails}>
            {item.total_assessments} assessment
            {item.total_assessments !== 1 ? 's' : ''}
            {item.calculation_details && (
              <Text style={styles.strandBreakdown}>
                {' '}
                • {item.calculation_details.normal_assessments} normal,{' '}
                {item.calculation_details.final_assessments} final
              </Text>
            )}
          </Text>
        </View>
        <View style={styles.strandItemRight}>
          <Text style={[styles.strandAverage, { color: subjectColor }]}>
            {item.strand_average}%
          </Text>
          <Text style={[styles.strandGrade, { backgroundColor: subjectColor }]}>
            {item.strand_letter_grade}
          </Text>
         
        </View>
        <FontAwesomeIcon
            icon={faChevronRight}
            size={12}
            color={subjectColor}
          />
      </TouchableOpacity>
    );
  }, []);

  // Render formative assessment item
  const renderFormativeItem = useCallback(({ item, section }) => {
    const subjectColor = getSubjectColor(section.title);

    // Assessment criteria with colors
    const criteria = [
      {
        label: 'EE',
        value: item.tt1 || '',
        color: '#34C759',
        name: 'Exceeding Expectations',
      },
      {
        label: 'ME',
        value: item.tt2 || '',
        color: '#FF9500',
        name: 'Meeting Expectations',
      },
      {
        label: 'AE',
        value: item.tt3 || '',
        color: '#007AFF',
        name: 'Approaching Expectations',
      },
      {
        label: 'BE',
        value: item.tt4 || '',
        color: '#FF3B30',
        name: 'Below Expectations',
      },
    ];

    return (
      <TouchableOpacity
        style={styles.formativeItem}
        onPress={() => {
          console.log(
            `Selected formative assessment: ${item.assessment_name} in ${section.title}`
          );
        }}
        activeOpacity={0.7}
      >
        <View style={styles.formativeItemLeft}>
          <Text style={styles.formativeAssessmentName}>
            {item.assessment_name}
          </Text>
          <Text style={styles.formativeAssessmentDetails}>
            {item.assessment_type || 'Assessment'} •{' '}
            {(() => {
              const dateField = item.date || item.date_created;
              if (!dateField) return 'No date';

              const dateStr = dateField.toString();
              if (dateStr.includes('/') || dateStr.includes('-')) {
                try {
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString();
                  }
                } catch (error) {
                  return dateStr;
                }
              }
              return dateStr;
            })()}
          </Text>
          {item.feedback && (
            <Text style={styles.formativeFeedback} numberOfLines={2}>
              {item.feedback}
            </Text>
          )}
        </View>
        <View style={styles.formativeItemRight}>
          <View style={styles.criteriaContainer}>
            {criteria.map((criterion, index) => (
              <View key={index} style={styles.criterionItem}>
                <View
                  style={[
                    styles.criterionIndicator,
                    {
                      backgroundColor: criterion.value
                        ? criterion.color
                        : '#E5E5EA',
                      borderColor: criterion.color,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.criterionLabel,
                      { color: criterion.value ? '#fff' : '#8E8E93' },
                    ]}
                  >
                    {criterion.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, []);

  // Update available subjects when grades or calculated data changes
  useEffect(() => {
    const subjects = extractSubjects(grades || {});
    setAvailableSubjects(subjects);
  }, [grades, calculatedGrades]);

  // Debug when calculatedGrades changes
  useEffect(() => {
    console.log('🔄 GRADES: calculatedGrades updated:', calculatedGrades);
    if (calculatedGrades?.subject_averages) {
      console.log(
        '📊 GRADES: Subject averages available:',
        calculatedGrades.subject_averages.map(
          (s) => `${s.subject_name}: ${s.overall_average}%`
        )
      );
    }
  }, [calculatedGrades]);

  // Debug when strandGrades changes
  useEffect(() => {
    console.log('🔄 GRADES: strandGrades updated:', strandGrades);
    if (strandGrades?.subjects_with_strands) {
      console.log('🧬 GRADES: Strand-based subjects available:');
      strandGrades.subjects_with_strands.forEach((subject) => {
        console.log(`  ${subject.subject_name}:`);
        subject.strands.forEach((strand) => {
          console.log(
            `    - ${strand.strand_name}: ${strand.strand_average}% (${strand.strand_letter_grade})`
          );
        });
      });
    }
  }, [strandGrades]);

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

  const renderSubjectCard = useCallback(
    (subject) => {
      const subjectColor = getSubjectColor(subject);
      const subjectIcon = getSubjectIcon(subject);
      // Check for strand-based data first, then fall back to calculated grades
      const strandEntry = strandGrades?.subjects_with_strands?.find(
        (s) => s.subject_name === subject
      );
      const advEntry = calculatedGrades?.subject_averages?.find(
        (s) => s.subject_name === subject
      );

      // Calculate overall average from strands if available
      let average = null;
      let gradeLetter = null;

      if (strandEntry?.strands?.length > 0) {
        // Use strand-based calculation
        const strandAverages = strandEntry.strands.map((s) => s.strand_average);
        average = Math.round(
          strandAverages.reduce((a, b) => a + b, 0) / strandAverages.length
        );
        gradeLetter = strandEntry.strands[0]?.strand_letter_grade; // Use first strand's letter grade as representative
      } else if (advEntry?.overall_average != null) {
        // Fall back to advanced calculation
        average = Math.round(advEntry.overall_average);
        gradeLetter = advEntry.letter_grade;
      }

      // Debug logging
      console.log(
        `🔍 SUBJECT CARD: ${subject}`,
        'strandEntry:',
        strandEntry,
        'advEntry:',
        advEntry,
        'average:',
        average,
        'gradeLetter:',
        gradeLetter
      );

      // Calculate grade counts
      const summativeCount =
        grades?.summative?.filter((g) => g.subject_name === subject)?.length ||
        0;
      const formativeCount =
        grades?.formative?.filter((g) => g.subject_name === subject)?.length ||
        0;
      const totalGrades = summativeCount + formativeCount;

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
                <FontAwesomeIcon icon={subjectIcon} size={18} color='#fff' />
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
                  {gradeLetter || '--'}
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
                    {formativeCount} Life Skill
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
    [grades, calculatedGrades, strandGrades, styles]
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
            : t('notGraded');
        const percentageDisplay =
          percentage !== null && percentage !== undefined
            ? `${percentage}%`
            : t('notGraded');

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
              ? t('loadingFormativeGrades')
              : selectedSubject
              ? t('noLifeSkillsGradesForSubject').replace(
                  '{subject}',
                  selectedSubject
                )
              : t('noLifeSkillsGrades')}
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
        {/* Grade Codes Explanation */}
        <View style={styles.gradeCodesContainer}>
          <Text style={styles.gradeCodesTitle}>
            {t('gradeCodesExplanation')}
          </Text>
          <View style={styles.gradeCodesGrid}>
            <View style={styles.gradeCodeItem}>
              <View
                style={[styles.gradeCodeDot, { backgroundColor: '#34C759' }]}
              />
              <Text style={styles.gradeCodeLabel}>EE</Text>
              <Text style={styles.gradeCodeDescription}>
                {t('exceedingExpectations')}
              </Text>
            </View>
            <View style={styles.gradeCodeItem}>
              <View
                style={[styles.gradeCodeDot, { backgroundColor: '#FF9500' }]}
              />
              <Text style={styles.gradeCodeLabel}>ME</Text>
              <Text style={styles.gradeCodeDescription}>
                {t('meetingExpectations')}
              </Text>
            </View>
            <View style={styles.gradeCodeItem}>
              <View
                style={[styles.gradeCodeDot, { backgroundColor: '#007AFF' }]}
              />
              <Text style={styles.gradeCodeLabel}>AE</Text>
              <Text style={styles.gradeCodeDescription}>
                {t('approachingExpectations')}
              </Text>
            </View>
            <View style={styles.gradeCodeItem}>
              <View
                style={[styles.gradeCodeDot, { backgroundColor: '#FF3B30' }]}
              />
              <Text style={styles.gradeCodeLabel}>BE</Text>
              <Text style={styles.gradeCodeDescription}>
                {t('belowExpectations')}
              </Text>
            </View>
          </View>
        </View>

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
        <View
          style={[
            styles.navigationHeader,
            {
              borderBottomLeftRadius: loading ? 16 : 0,
              borderBottomRightRadius: loading ? 16 : 0,
            },
          ]}
        >
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
            <Text style={styles.headerTitle}>
              {showSubjectList
                ? `${t('assessments')}`
                : isLandscape
                ? `${selectedSubject} - ${
                    activeTab === 'summative' ? t('summative') : t('lifeSkills')
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
              {renderTabButton('summative', t('summative'))}
              {renderTabButton('formative', t('lifeSkills'))}
            </View>
          </View>
        )}

        {/* Performance Overview - Tabs + Stats Cards */}
        {showSubjectList && !loading && (
          <View style={styles.performanceOverview}>
            {/* Header with Icon and Title */}
            <View style={styles.performanceHeader}>
              <View style={styles.performanceIconContainer}>
                <FontAwesomeIcon
                  icon={faChartBar}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.performanceTitle}>Performance Overview</Text>
            </View>

            {/* Tab Navigation */}
            <View style={styles.performanceTabs}>
              <TouchableOpacity
                style={[
                  styles.performanceTab,
                  activeTab === 'summative' && styles.activePerformanceTab,
                ]}
                onPress={() => setActiveTab('summative')}
              >
                <Text
                  style={[
                    styles.performanceTabText,
                    activeTab === 'summative' &&
                      styles.activePerformanceTabText,
                  ]}
                >
                  Summative
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.performanceTab,
                  activeTab === 'formative' && styles.activePerformanceTab,
                ]}
                onPress={() => setActiveTab('formative')}
              >
                <Text
                  style={[
                    styles.performanceTabText,
                    activeTab === 'formative' &&
                      styles.activePerformanceTabText,
                  ]}
                >
                  Life Skill
                </Text>
              </TouchableOpacity>
            </View>

            {/* Stats Cards based on active tab */}
            {activeTab === 'summative' &&
              (() => {
                const summaryData = getSummaryData();
                const totalAssessments = grades?.summative?.length || 0;
                const gradedAssessments =
                  grades?.summative?.filter(
                    (a) =>
                      a.score !== null &&
                      a.score !== undefined &&
                      a.score !== ''
                  ).length || 0;

                return summaryData ? (
                  <View style={styles.statsCardsContainer}>
                    {/* Overall Card */}
                    <View style={styles.statsCard}>
                      <Text style={styles.statsCardLabel}>OVERALL</Text>
                      <Text style={styles.statsCardValue}>
                        {Math.round(summaryData.overall_average) || 0}%
                      </Text>
                      <Text style={styles.statsCardSubtitle}>
                        Average Performance
                      </Text>
                      <View style={styles.statsCardDetails}>
                        <View style={styles.statsDetailRow}>
                          <Text style={styles.statsDetailIcon}>📝</Text>
                          <Text style={styles.statsDetailText}>
                            {totalAssessments} Total
                          </Text>
                        </View>
                        <View style={styles.statsDetailRow}>
                          <Text style={styles.statsDetailIcon}>✅</Text>
                          <Text style={styles.statsDetailText}>
                            {(
                              (gradedAssessments / totalAssessments) *
                              100
                            ).toFixed(1)}
                            % Complete
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Summative Card */}
                    <View style={styles.statsCard}>
                      <Text style={styles.statsCardLabel}>SUMMATIVE</Text>
                      <Text style={styles.statsCardValue}>
                        {Math.round(summaryData.overall_average) || 0}%
                      </Text>
                      <Text style={styles.statsCardSubtitle}>
                        Average Grade
                      </Text>
                      <View style={styles.statsCardDetails}>
                        <View style={styles.statsDetailRow}>
                          <Text style={styles.statsDetailIcon}>📈</Text>
                          <Text style={styles.statsDetailText}>
                            High: {summaryData.highest_grade || 0}%
                          </Text>
                        </View>
                        <View style={styles.statsDetailRow}>
                          <Text style={styles.statsDetailIcon}>📉</Text>
                          <Text style={styles.statsDetailText}>
                            Low: {summaryData.lowest_grade || 0}%
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Subjects Card */}
                    <View style={styles.statsCard}>
                      <Text style={styles.statsCardLabel}>SUBJECTS</Text>
                      <Text style={styles.statsCardValue}>
                        {summaryData.total_subjects || 0}
                      </Text>
                      <Text style={styles.statsCardSubtitle}>
                        Total Subjects
                      </Text>
                      <View style={styles.statsCardDetails}>
                        <View style={styles.statsDetailRow}>
                          <Text style={styles.statsDetailIcon}>📊</Text>
                          <Text style={styles.statsDetailText}>
                            {strandGrades?.subjects_with_strands?.length || 0}{' '}
                            With Strands
                          </Text>
                        </View>
                        <View style={styles.statsDetailRow}>
                          <Text style={styles.statsDetailIcon}>🎯</Text>
                          <Text style={styles.statsDetailText}>
                            {gradedAssessments} Graded
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : null;
              })()}

            {/* Formative Stats */}
            {activeTab === 'formative' &&
              (() => {
                const totalFormative = grades?.formative?.length || 0;
                const gradedFormative =
                  grades?.formative?.filter(
                    (a) => a.tt1 || a.tt2 || a.tt3 || a.tt4
                  ).length || 0;

                return (
                  <View style={styles.statsCardsContainer}>
                    {/* Formative Card */}
                    <View style={styles.statsCard}>
                      <Text style={styles.statsCardLabel}>FORMATIVE</Text>
                      <Text style={styles.statsCardValue}>
                        {totalFormative}
                      </Text>
                      <Text style={styles.statsCardSubtitle}>
                        Graded Assessments
                      </Text>
                      <View style={styles.statsCardDetails}>
                        <View style={styles.statsDetailRow}>
                          <Text style={styles.statsDetailIcon}>📊</Text>
                          <Text style={styles.statsDetailText}>
                            {totalFormative} Total
                          </Text>
                        </View>
                        <View style={styles.statsDetailRow}>
                          <Text style={styles.statsDetailIcon}>⏳</Text>
                          <Text style={styles.statsDetailText}>
                            {totalFormative - gradedFormative} Pending
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Criteria Legend Card */}
                    <View style={[styles.statsCard, styles.criteriaLegendCard]}>
                      <Text style={styles.statsCardLabel}>CRITERIA</Text>
                      <View style={styles.criteriaLegendGrid}>
                        <View style={styles.criteriaLegendItem}>
                          <View
                            style={[
                              styles.criteriaLegendDot,
                              { backgroundColor: '#34C759' },
                            ]}
                          >
                            <Text style={styles.criteriaLegendDotText}>EE</Text>
                          </View>
                          <Text style={styles.criteriaLegendText}>
                            Exceeding
                          </Text>
                        </View>
                        <View style={styles.criteriaLegendItem}>
                          <View
                            style={[
                              styles.criteriaLegendDot,
                              { backgroundColor: '#FF9500' },
                            ]}
                          >
                            <Text style={styles.criteriaLegendDotText}>ME</Text>
                          </View>
                          <Text style={styles.criteriaLegendText}>Meeting</Text>
                        </View>
                        <View style={styles.criteriaLegendItem}>
                          <View
                            style={[
                              styles.criteriaLegendDot,
                              { backgroundColor: '#007AFF' },
                            ]}
                          >
                            <Text style={styles.criteriaLegendDotText}>AE</Text>
                          </View>
                          <Text style={styles.criteriaLegendText}>
                            Approaching
                          </Text>
                        </View>
                        <View style={styles.criteriaLegendItem}>
                          <View
                            style={[
                              styles.criteriaLegendDot,
                              { backgroundColor: '#FF3B30' },
                            ]}
                          >
                            <Text style={styles.criteriaLegendDotText}>BE</Text>
                          </View>
                          <Text style={styles.criteriaLegendText}>Below</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })()}
          </View>
        )}
      </View>

      <View style={[styles.content, isLandscape && styles.landscapeContent]}>
        {showSubjectList ? (
          // Show subject selection screen
          <View style={styles.subjectListContainer}>
            {/* <View style={styles.headerSection}>
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
            </View> */}

            {loading ? (
              // Show loading indicator while data is being fetched
              <View style={styles.loadingContainer}>
                <ActivityIndicator size='large' color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading grades...</Text>
                <Text style={styles.loadingSubtext}>
                  Please wait while we fetch your academic data
                </Text>
              </View>
            ) : activeTab === 'summative' &&
              strandGrades?.subjects_with_strands ? (
              // Show strand-based section list for summative
              <SectionList
                sections={getSectionListData()}
                keyExtractor={(item, index) => `${item.strand_id}-${index}`}
                renderItem={renderStrandItem}
                renderSectionHeader={renderSectionHeader}
                style={styles.fullWidth}
                contentContainerStyle={styles.sectionListContainer}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
              />
            ) : activeTab === 'formative' && grades?.formative ? (
              // Show formative section list for life skill
              <SectionList
                sections={getFormativeSectionListData()}
                keyExtractor={(item, index) =>
                  `${item.id || index}-${item.assessment_name}`
                }
                renderItem={renderFormativeItem}
                renderSectionHeader={renderFormativeSectionHeader}
                style={styles.fullWidth}
                contentContainerStyle={styles.sectionListContainer}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
              />
            ) : (
              // Fallback to original subject cards
              <ScrollView
                style={styles.fullWidth}
                contentContainerStyle={styles.subjectGrid}
                showsVerticalScrollIndicator={false}
              >
                {availableSubjects.map((subject) => renderSubjectCard(subject))}
              </ScrollView>
            )}
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

      {/* Strand Details Modal */}
      <Modal
        visible={selectedStrand !== null}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={closeStrandDetails}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeStrandDetails}
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>
            <View style={styles.modalHeaderInfo}>
              <Text style={styles.modalTitle}>
                {selectedStrand?.strand_name}
              </Text>
              <Text style={styles.modalSubtitle}>
                {selectedStrand?.subjectName} •{' '}
                {selectedStrand?.total_assessments} assessments
              </Text>
            </View>
            <View style={styles.modalHeaderGrade}>
              <Text
                style={[
                  styles.modalGradeText,
                  { color: getSubjectColor(selectedStrand?.subjectName || '') },
                ]}
              >
                {selectedStrand?.strand_average}%
              </Text>
              <Text
                style={[
                  styles.modalGradeLetter,
                  {
                    backgroundColor: getSubjectColor(
                      selectedStrand?.subjectName || ''
                    ),
                  },
                ]}
              >
                {selectedStrand?.strand_letter_grade}
              </Text>
            </View>
          </View>

          <ScrollView style={styles.modalContent}>
            {(() => {
              console.log(
                `🎯 MODAL: Rendering with ${strandAssessments.length} assessments`
              );
              console.log('🎯 MODAL: strandAssessments:', strandAssessments);
              console.log('🎯 MODAL: selectedStrand:', selectedStrand);
              return strandAssessments.length > 0;
            })() ? (
              <View style={styles.assessmentsList}>
                <Text style={styles.assessmentsTitle}>Assessments</Text>
                {strandAssessments.map((assessment, index) => {
                  // Determine if this is summative or formative
                  const isFormative = grades?.formative?.includes(assessment);
                  const assessmentCategory = isFormative
                    ? 'Formative'
                    : 'Summative';

                  return (
                    <View
                      key={`${assessment.id || index}-${
                        assessment.assessment_name
                      }`}
                      style={styles.assessmentItem}
                    >
                      <View style={styles.assessmentLeft}>
                        <View style={styles.assessmentHeader}>
                          <Text style={styles.assessmentName}>
                            {assessment.assessment_name}
                          </Text>
                          <View
                            style={[
                              styles.assessmentCategoryBadge,
                              {
                                backgroundColor: isFormative
                                  ? '#4CAF50'
                                  : '#FF9500',
                              },
                            ]}
                          >
                            <Text style={styles.assessmentCategoryText}>
                              {assessmentCategory}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.assessmentDetails}>
                          {assessment.assessment_type} •{' '}
                          {(() => {
                            const dateField =
                              assessment.date || assessment.date_created;
                            if (!dateField) return 'No date';

                            // Handle string dates - try different formats
                            const dateStr = dateField.toString();

                            // If it's already a formatted date string, return as is
                            if (
                              dateStr.includes('/') ||
                              dateStr.includes('-')
                            ) {
                              try {
                                const date = new Date(dateStr);
                                if (!isNaN(date.getTime())) {
                                  return date.toLocaleDateString();
                                }
                              } catch (error) {
                                // If parsing fails, return the original string
                                return dateStr;
                              }
                            }

                            // Return the original string if it doesn't look like a date
                            return dateStr;
                          })()}
                        </Text>
                        {assessment.description && (
                          <Text style={styles.assessmentDescription}>
                            {assessment.description}
                          </Text>
                        )}
                      </View>
                      <View style={styles.assessmentRight}>
                        <Text
                          style={[
                            styles.assessmentScore,
                            {
                              color: getSubjectColor(
                                selectedStrand?.subjectName || ''
                              ),
                            },
                          ]}
                        >
                          {assessment.score || 0}/{assessment.max_score || 0}
                        </Text>
                        <Text style={styles.assessmentPercentage}>
                          {assessment.max_score && assessment.max_score > 0
                            ? Math.round(
                                (assessment.score / assessment.max_score) * 100
                              )
                            : 0}
                          %
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.noAssessmentsContainer}>
                <Text style={styles.noAssessmentsText}>
                  No assessments found for this strand
                </Text>
                <Text style={styles.noAssessmentsSubtext}>
                  Assessments may be categorized differently or not yet
                  available
                </Text>
              </View>
            )}

            {/* Calculation Details */}
            {selectedStrand?.calculation_details && (
              <View style={styles.calculationDetails}>
                <Text style={styles.calculationTitle}>
                  Calculation Breakdown
                </Text>
                <View style={styles.calculationGrid}>
                  <View style={styles.calculationItem}>
                    <Text style={styles.calculationLabel}>
                      Normal Assessments
                    </Text>
                    <Text style={styles.calculationValue}>
                      {selectedStrand.calculation_details.normal_assessments}
                    </Text>
                  </View>
                  <View style={styles.calculationItem}>
                    <Text style={styles.calculationLabel}>
                      Final Assessments
                    </Text>
                    <Text style={styles.calculationValue}>
                      {selectedStrand.calculation_details.final_assessments}
                    </Text>
                  </View>
                  <View style={styles.calculationItem}>
                    <Text style={styles.calculationLabel}>Normal Score</Text>
                    <Text style={styles.calculationValue}>
                      {selectedStrand.calculation_details.normal_score}
                    </Text>
                  </View>
                  <View style={styles.calculationItem}>
                    <Text style={styles.calculationLabel}>Final Score</Text>
                    <Text style={styles.calculationValue}>
                      {selectedStrand.calculation_details.final_score}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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

      zIndex: 1,
    },
    navigationHeader: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    subHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    // Summary SubHeader Styles (integrated with navigation header)
    summarySubHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
    summarySubHeaderTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    summarySubHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
    },
    summarySubHeaderMetric: {
      alignItems: 'center',
      flex: 1,
      paddingHorizontal: 8,
    },
    summarySubHeaderValue: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.text,
    },
    summarySubHeaderLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    summarySubHeaderPill: {
      backgroundColor: theme.colors.headerBackground,
      color: '#fff',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      overflow: 'hidden',
      fontWeight: '700',
      fontSize: 16,
      textAlign: 'center',
      minWidth: 28,
    },
    summarySubHeaderSecondaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + '20', // Very light border
    },
    summarySubHeaderSecondaryMetric: {
      alignItems: 'center',
      flex: 1,
      paddingHorizontal: 8,
    },
    summarySubHeaderSecondaryValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    summarySubHeaderSecondaryLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      marginTop: 2,
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
    // Summary (Advanced Calculation) Styles
    summaryCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      marginTop: 10,
      marginBottom: 16,
      marginHorizontal: 16,
      minHeight: 100,
      ...createCardShadow(theme),
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
    },
    summaryMetric: {
      alignItems: 'center',
      flex: 1,
      paddingHorizontal: 8,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.colors.text,
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    summaryPill: {
      backgroundColor: theme.colors.headerBackground,
      color: '#fff',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 12,
      overflow: 'hidden',
      fontWeight: '700',
      fontSize: 18,
      textAlign: 'center',
      minWidth: 30,
    },
    // Secondary metrics row styles
    summarySecondaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + '30', // Semi-transparent border
    },
    summarySecondaryMetric: {
      alignItems: 'center',
      flex: 1,
      paddingHorizontal: 8,
    },
    summarySecondaryValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    summarySecondaryLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },

    subjectGrid: {
      alignItems: 'center',
      width: '100%',
      padding: 10,
    },
    // SectionList Styles
    sectionListContainer: {
      padding: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      marginVertical: 8,
      borderRadius: 12,
      ...createCardShadow(theme),
    },
    sectionHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    sectionHeaderIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    sectionHeaderInfo: {
      flex: 1,
    },
    sectionHeaderTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 2,
    },
    sectionHeaderSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    sectionHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionHeaderGrades: {
      alignItems: 'flex-end',
      marginRight: 12,
    },
    sectionHeaderAverage: {
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 4,
    },
    sectionHeaderGrade: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      textAlign: 'center',
      minWidth: 24,
    },
    expandIcon: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Strand Item Styles
    strandItem: {
      backgroundColor: theme.colors.card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.border,
      ...createSmallShadow(theme),
    },
    strandItemLeft: {
      flex: 1,
      marginRight: 12,
    },
    strandName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    strandDetails: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    strandBreakdown: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    strandItemRight: {
      alignItems: 'flex-end',
      marginRight: 12,
    },
    strandAverage: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
    },
    strandGrade: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      textAlign: 'center',
      minWidth: 20,
    },
    fullWidth: {
      width: '100%',
    },

    // Modern Subject Card Styles - Dashboard Design
    modernSubjectCard: {
      backgroundColor: theme.colors.card,
      width: '100%',
      marginVertical: 6,
      borderRadius: 16,
      padding: 14,
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
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      // Enhanced shadow using platform-specific utilities
      ...createMediumShadow(theme),
    },
    subjectInfo: {
      flex: 1,
    },
    modernSubjectTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 2,
      letterSpacing: 0.2,
    },
    subjectGradeCount: {
      fontSize: 13,
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
      marginBottom: 10,
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
      marginBottom: 10,
      paddingVertical: 4,
    },
    gradeSection: {
      alignItems: 'center',
      flex: 1,
    },
    gradeCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      backgroundColor: theme.colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
      // Enhanced shadow using platform-specific utilities
      ...createSmallShadow(theme),
    },
    gradeLetterText: {
      fontSize: 14,
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
      marginBottom: 4,
    },
    percentageNumber: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    percentageSymbol: {
      fontSize: 14,
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
      marginBottom: 8,
    },
    progressInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
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
    // Grade Codes Explanation Styles
    gradeCodesContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    gradeCodesTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    gradeCodesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    gradeCodeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '48%',
      marginBottom: 8,
    },
    gradeCodeDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    gradeCodeLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      minWidth: 24,
      marginRight: 8,
    },
    gradeCodeDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    modalCloseButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    modalHeaderInfo: {
      flex: 1,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 2,
    },
    modalSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    modalHeaderGrade: {
      alignItems: 'flex-end',
    },
    modalGradeText: {
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 4,
    },
    modalGradeLetter: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      textAlign: 'center',
      minWidth: 28,
    },
    modalContent: {
      flex: 1,
      padding: 16,
    },
    assessmentsList: {
      marginBottom: 24,
    },
    assessmentsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },
    assessmentItem: {
      backgroundColor: theme.colors.card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      marginBottom: 8,
      borderRadius: 12,
      ...createCardShadow(theme),
    },
    assessmentLeft: {
      flex: 1,
      marginRight: 12,
    },
    assessmentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    assessmentName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      marginRight: 8,
    },
    assessmentCategoryBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    assessmentCategoryText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#fff',
    },
    assessmentDetails: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    assessmentDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    assessmentRight: {
      alignItems: 'flex-end',
    },
    assessmentScore: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 2,
    },
    assessmentPercentage: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    noAssessmentsContainer: {
      alignItems: 'center',
      padding: 32,
    },
    noAssessmentsText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    noAssessmentsSubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    calculationDetails: {
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: 12,
      ...createCardShadow(theme),
    },
    calculationTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },
    calculationGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    calculationItem: {
      width: '48%',
      marginBottom: 12,
    },
    calculationLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    calculationValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    // Subject List Tab Styles
    subjectListTabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 12,
      padding: 4,
      ...createCardShadow(theme),
    },
    subjectListTab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    activeSubjectListTab: {
      backgroundColor: theme.colors.primary,
    },
    subjectListTabText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    activeSubjectListTabText: {
      color: '#fff',
    },
    // Criteria Explanation Styles
    criteriaExplanation: {
      backgroundColor: theme.colors.card,
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      borderRadius: 12,
      ...createCardShadow(theme),
    },
    criteriaTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },
    criteriaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    criteriaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '48%',
      marginBottom: 8,
    },
    criteriaIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    criteriaLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: '#fff',
    },
    criteriaText: {
      fontSize: 12,
      color: theme.colors.text,
      flex: 1,
    },
    // Formative Item Styles
    formativeItem: {
      backgroundColor: theme.colors.card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.border,
      ...createSmallShadow(theme),
    },
    formativeItemLeft: {
      flex: 1,
      marginRight: 12,
    },
    formativeAssessmentName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    formativeAssessmentDetails: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    formativeFeedback: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    formativeItemRight: {
      alignItems: 'flex-end',
    },
    criteriaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    criterionItem: {
      marginLeft: 4,
    },
    criterionIndicator: {
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    criterionLabel: {
      fontSize: 8,
      fontWeight: '700',
    },
    // Subheader Tab Styles
    subHeaderTabs: {
      flexDirection: 'row',
      marginBottom: 16,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 2,
    },
    subHeaderTab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
    },
    activeSubHeaderTab: {
      backgroundColor: theme.colors.primary,
    },
    subHeaderTabText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    activeSubHeaderTabText: {
      color: '#fff',
    },
    // Criteria Subheader Styles
    criteriaSubHeaderGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
      alignSelf: 'center',
    },
    criteriaSubHeaderItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginHorizontal: 2,
    },
    criteriaSubHeaderIndicator: {
      width: 16,
      height: 16,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 4,
    },
    criteriaSubHeaderLabel: {
      fontSize: 8,
      fontWeight: '700',
      color: '#fff',
    },
    criteriaSubHeaderText: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    // Loading Styles
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 20,
    },
    loadingText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 16,
      textAlign: 'center',
    },
    loadingSubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
      lineHeight: 20,
    },
    // Performance Overview Styles
    performanceOverview: {
      backgroundColor: theme.colors.card,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      padding: 12,
      ...createCardShadow(theme),
    },
    performanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    performanceIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: `${theme.colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    performanceTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
    },
    performanceTabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 2,
      marginBottom: 10,
    },
    performanceTab: {
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
    },
    activePerformanceTab: {
      backgroundColor: theme.colors.primary,
    },
    performanceTabText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    activePerformanceTabText: {
      color: '#fff',
    },
    // Stats Cards Styles
    statsCardsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
    },
    statsCard: {
      flex: 1,
      minWidth: '30%',
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      padding: 10,
      margin: 4,
      ...createSmallShadow(theme),
    },
    criteriaLegendCard: {
      flex: 2,
      minWidth: '60%',
    },
    statsCardLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    statsCardValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 2,
    },
    statsCardSubtitle: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 8,
    },
    statsCardDetails: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 8,
    },
    statsDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    statsDetailIcon: {
      fontSize: 12,
      marginRight: 4,
    },
    statsDetailText: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    // Criteria Legend Styles
    criteriaLegendGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 4,
    },
    criteriaLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '50%',
      marginBottom: 6,
    },
    criteriaLegendDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    },
    criteriaLegendDotText: {
      fontSize: 8,
      fontWeight: '700',
      color: '#fff',
    },
    criteriaLegendText: {
      fontSize: 10,
      color: theme.colors.text,
      fontWeight: '500',
    },
  });
