import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Config, buildApiUrl } from '../config/env';
import {
  faArrowLeft,
  faScaleBalanced,
  faClipboardList,
  faStar,
  faThumbsUp,
  faThumbsDown,
  faCheckCircle,
  faTimesCircle,
  faChevronRight,
  faChevronLeft,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { createMediumShadow } from '../utils/commonStyles';
import { getDemoStudentBPSData } from '../services/demoModeService';

export default function BehaviorScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const { authCode } = route.params || {};
  const [behaviorData, setBehaviorData] = useState([]);
  const [detentionData, setDetentionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('summary'); // 'summary', 'behavior', 'detention'
  const [selectedDetentionType, setSelectedDetentionType] = useState(null); // 'served', 'not_served'
  const [selectedBehaviorType, setSelectedBehaviorType] = useState(null); // 'PRS', 'DPS'

  const isLandscape = screenData.width > screenData.height;
  const styles = createStyles(theme);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (authCode) {
      fetchBehaviorData();
    }
  }, [authCode]);

  const fetchBehaviorData = async () => {
    if (!authCode) {
      Alert.alert('Error', 'Authentication code is missing');
      return;
    }

    setLoading(true);
    try {
      // Check if this is demo mode
      if (authCode && authCode.startsWith('DEMO_AUTH_')) {
        console.log('🎭 DEMO MODE: Using demo student BPS data');
        const demoData = getDemoStudentBPSData();
        setBehaviorData(demoData.behavior_records || []);
        setDetentionData(demoData.detention_records || []);
        setLoading(false);
        return;
      }

      const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_BPS, {
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

        // Handle API response with both behavior and detention data
        let behaviorArray = [];
        let detentionArray = [];

        if (data && typeof data === 'object') {
          // If data is directly an array, treat as behavior data
          if (Array.isArray(data)) {
            behaviorArray = data;
          } else {
            // Look through all properties to find arrays
            const dataKeys = Object.keys(data);

            for (const key of dataKeys) {
              if (Array.isArray(data[key])) {
                // Check if this array contains behavior data (has item_type field)
                if (data[key].length > 0 && data[key][0].item_type) {
                  behaviorArray = data[key];
                }
                // Check if this array contains detention data (has detention_type field)
                else if (data[key].length > 0 && data[key][0].detention_type) {
                  detentionArray = data[key];
                }
                // If we don't have behavior data yet and this is the first array, use it
                else if (behaviorArray.length === 0) {
                  behaviorArray = data[key];
                }
              }
            }
          }
        }

        setBehaviorData(behaviorArray);
        setDetentionData(detentionArray);
      } else {
        // For development, use dummy data if API fails
        const dummyBehavior = getDummyBehaviorData();
        const dummyDetention = getDummyDetentionData();
        setBehaviorData(dummyBehavior);
        setDetentionData(dummyDetention);
      }
    } catch (error) {
      console.error('Error fetching behavior data:', error);

      // For development, use dummy data if API fails
      setBehaviorData(getDummyBehaviorData());
      setDetentionData(getDummyDetentionData());
    } finally {
      setLoading(false);
    }
  };

  // Dummy data for development (matching API format)
  const getDummyBehaviorData = () => [
    {
      id: 52251,
      item_title: 'Excellent Class Performance',
      item_type: 'PRS',
      item_point: 1,
      date: '2025-01-15',
      note: '',
      teacher_name: 'Ms. Johnson',
      status: 1,
    },
    {
      id: 52252,
      item_title: 'Outstanding Project Presentation',
      item_type: 'PRS',
      item_point: 2,
      date: '2025-01-12',
      note: 'Excellent work on science project',
      teacher_name: 'Dr. Smith',
      status: 1,
    },
    {
      id: 52253,
      item_title: 'Late Homework Submission',
      item_type: 'DPS',
      item_point: -1,
      date: '2025-01-10',
      note: 'Assignment submitted 2 days late',
      teacher_name: 'Mr. Brown',
      status: 1,
    },
    {
      id: 52254,
      item_title: 'Helping Classmates',
      item_type: 'PRS',
      item_point: 1,
      date: '2025-01-08',
      note: 'Assisted struggling students with math problems',
      teacher_name: 'Ms. Davis',
      status: 1,
    },
    {
      id: 52255,
      item_title: 'Disruptive Behavior',
      item_type: 'DPS',
      item_point: -2,
      date: '2025-01-05',
      note: 'Talking during class instruction',
      teacher_name: 'Dr. Wilson',
      status: 1,
    },
  ];

  // Dummy detention data for development (matching API format)
  const getDummyDetentionData = () => [
    {
      id: 645,
      type: 'DETENTION',
      detention_type: 'LTD',
      served_detention_type: 'LTD',
      is_served: 1,
      system_note: 'Required to attend Lunch Time Detention',
      item_title: 'Disruptive Behaviour',
      item_point: -2,
      latest_point: -6,
      date: '2024-09-12',
      teacher_name: 'Elnur Alakbarov',
      academic_semester: 1,
    },
    {
      id: 646,
      type: 'DETENTION',
      detention_type: 'ATD',
      served_detention_type: null,
      is_served: 0,
      system_note: 'Required to attend After School Detention',
      item_title: 'Late to Class',
      item_point: -1,
      latest_point: -7,
      date: '2024-09-15',
      teacher_name: 'Sarah Johnson',
      academic_semester: 1,
    },
    {
      id: 647,
      type: 'DETENTION',
      detention_type: 'LTD',
      served_detention_type: 'LTD',
      is_served: 1,
      system_note: 'Required to attend Lunch Time Detention',
      item_title: 'Homework Not Completed',
      item_point: -1,
      latest_point: -8,
      date: '2024-09-18',
      teacher_name: 'Michael Brown',
      academic_semester: 1,
    },
  ];

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

  // Calculate total points
  const getTotalPoints = () => {
    return behaviorData.reduce((total, item) => {
      const points = parseInt(item.item_point || item.points) || 0;
      const typeCode = item.item_type?.toUpperCase() || ''; // Получаем код типа поведения

      // Суммируем только если тип 'PRS' и баллы положительные
      if (typeCode === 'PRS' && points > 0) {
        return total + points;
      }
      return total; // В противном случае не добавляем к сумме
    }, 0);
  };

  // Get behavior statistics
  const getBehaviorStats = () => {
    const positive = behaviorData.reduce((total, item) => {
      const points = parseInt(item.item_point || item.points) || 0;
      const type = (item.item_type || item.type || '').toUpperCase();
      if (type === 'PRS' || points > 0) {
        return total + points;
      }
      return total;
    }, 0);

    const negative = behaviorData.reduce((total, item) => {
      const points = parseInt(item.item_point || item.points) || 0;
      const type = (item.item_type || item.type || '').toUpperCase();
      if (type === 'DPS' || points < 0) {
        return total + Math.abs(points); // Use absolute value for display
      }
      return total;
    }, 0);

    const neutral = behaviorData.filter((item) => {
      const points = parseInt(item.item_point || item.points) || 0;
      const type = (item.item_type || item.type || '').toUpperCase();
      return type !== 'PRS' && type !== 'DPS' && points === 0;
    }).length;

    return { positive, negative, neutral, total: behaviorData.length };
  };

  // Get detention statistics
  const getDetentionStats = () => {
    const served = detentionData.filter((item) => item.is_served === 1).length;
    const notServed = detentionData.filter(
      (item) => item.is_served === 0
    ).length;
    return { served, notServed, total: detentionData.length };
  };

  // Handle detention card click
  const handleDetentionCardClick = (type) => {
    setSelectedDetentionType(type);
    setSelectedView('detention');
  };

  // Handle behavior card click
  const handleBehaviorCardClick = (type) => {
    setSelectedBehaviorType(type);
    setSelectedView('behavior');
  };

  // Get filtered detention data based on selected type
  const getFilteredDetentionData = () => {
    if (selectedDetentionType === 'served') {
      return detentionData.filter((item) => item.is_served === 1);
    } else if (selectedDetentionType === 'not_served') {
      return detentionData.filter((item) => item.is_served === 0);
    }
    return detentionData;
  };

  // Get filtered behavior data based on selected type
  const getFilteredBehaviorData = () => {
    if (selectedBehaviorType === 'PRS') {
      return behaviorData.filter((item) => {
        const type = (item.item_type || item.type || '').toUpperCase();
        const points = parseInt(item.item_point || item.points) || 0;
        return type === 'PRS' || points > 0;
      });
    } else if (selectedBehaviorType === 'DPS') {
      return behaviorData.filter((item) => {
        const type = (item.item_type || item.type || '').toUpperCase();
        const points = parseInt(item.item_point || item.points) || 0;
        return type === 'DPS' || points < 0;
      });
    }
    return behaviorData;
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
              if (selectedView === 'summary') {
                navigation.goBack();
              } else {
                setSelectedView('summary');
              }
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <FontAwesomeIcon icon={faScaleBalanced} size={18} color='#fff' />
            <Text style={styles.headerTitle}>{t('behaviorPoints')}</Text>
          </View>

          <View style={styles.headerRight} />
        </View>

        {/* View Context Subheader */}
        <View style={styles.subHeader}>
          <Text style={styles.viewContextText}>
            {selectedView === 'summary'
              ? 'Overview & Statistics'
              : selectedView === 'behavior'
              ? `${selectedBehaviorType} Records`
              : selectedView === 'detention'
              ? `${
                  selectedDetentionType === 'served' ? 'Served' : 'Not Served'
                } Detentions`
              : 'Behavior Points'}
          </Text>
        </View>
      </View>

      <View style={[styles.content, isLandscape && styles.landscapeContent]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color='#5856D6' />
            <Text style={styles.loadingText}>{t('loading')}</Text>
          </View>
        ) : selectedView === 'summary' ? (
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <FontAwesomeIcon icon={faStar} size={24} color='#FF9500' />
                  <Text style={styles.summaryTitle}>Reward Points</Text>
                </View>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: getTotalPoints() >= 0 ? '#34C759' : '#FF3B30' },
                  ]}
                >
                  {getTotalPoints()}
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <FontAwesomeIcon
                    icon={faClipboardList}
                    size={24}
                    color='#007AFF'
                  />
                  <Text style={styles.summaryTitle}>{t('totalRecords')}</Text>
                </View>
                <Text style={styles.summaryValue}>{behaviorData.length}</Text>
              </View>
            </View>

            {/* Behavior Points Cards */}
            <View style={styles.behaviorContainer}>
              <Text style={styles.sectionTitle}>{t('behaviorPoints')}</Text>
              <View style={styles.behaviorGrid}>
                <TouchableOpacity
                  style={styles.behaviorCard}
                  onPress={() => handleBehaviorCardClick('PRS')}
                >
                  <View style={styles.behaviorCardHeader}>
                    <View
                      style={[
                        styles.behaviorIconContainer,
                        { backgroundColor: '#34C75915' },
                      ]}
                    >
                      <FontAwesomeIcon
                        icon={faThumbsUp}
                        size={24}
                        color='#34C759'
                      />
                    </View>
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      size={16}
                      color='#999'
                    />
                  </View>
                  <View style={styles.behaviorCardBody}>
                    <Text style={styles.behaviorCardTitle}>PRS</Text>
                    <Text style={styles.behaviorCardNumber}>
                      +{getBehaviorStats().positive}
                    </Text>
                  </View>

                  <Text style={styles.behaviorCardSubtext}>
                    Positive Reinforcement System
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.behaviorCard}
                  onPress={() => handleBehaviorCardClick('DPS')}
                >
                  <View style={styles.behaviorCardHeader}>
                    <View
                      style={[
                        styles.behaviorIconContainer,
                        { backgroundColor: '#FF3B3015' },
                      ]}
                    >
                      <FontAwesomeIcon
                        icon={faThumbsDown}
                        size={24}
                        color='#FF3B30'
                      />
                    </View>
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      size={16}
                      color='#999'
                    />
                  </View>
                  <View style={styles.behaviorCardBody}>
                    <Text style={styles.behaviorCardTitle}>DPS</Text>
                    <Text style={styles.behaviorCardNumber}>
                      -{getBehaviorStats().negative}
                    </Text>
                  </View>

                  <Text style={styles.behaviorCardSubtext}>
                    Disciplinary Points System
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Detention Cards */}
            <View style={styles.detentionContainer}>
              <Text style={styles.sectionTitle}>Detentions</Text>
              <View style={styles.detentionGrid}>
                <TouchableOpacity
                  style={styles.detentionCard}
                  onPress={() => handleDetentionCardClick('served')}
                >
                  <View style={styles.detentionCardHeader}>
                    <View
                      style={[
                        styles.detentionIconContainer,
                        { backgroundColor: '#34C75915' },
                      ]}
                    >
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        size={24}
                        color='#34C759'
                      />
                    </View>
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      size={16}
                      color='#999'
                    />
                  </View>
                  <View style={styles.behaviorCardBody}>
                    <Text style={styles.detentionCardTitle}>Served</Text>
                    <Text style={styles.detentionCardNumber}>
                      {getDetentionStats().served}
                    </Text>
                  </View>

                  <Text style={styles.detentionCardSubtext}>
                    Detentions completed
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detentionCard}
                  onPress={() => handleDetentionCardClick('not_served')}
                >
                  <View style={styles.detentionCardHeader}>
                    <View
                      style={[
                        styles.detentionIconContainer,
                        { backgroundColor: '#FF3B3015' },
                      ]}
                    >
                      <FontAwesomeIcon
                        icon={faTimesCircle}
                        size={24}
                        color='#FF3B30'
                      />
                    </View>
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      size={16}
                      color='#999'
                    />
                  </View>
                  <View style={styles.behaviorCardBody}>
                    <Text style={styles.detentionCardTitle}>Not Served</Text>
                    <Text style={styles.detentionCardNumber}>
                      {getDetentionStats().notServed}
                    </Text>
                  </View>

                  <Text style={styles.detentionCardSubtext}>
                    Pending detentions
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : selectedView === 'behavior' ? (
          <View style={styles.behaviorDetailContainer}>
            {/* Behavior Details List */}
            <ScrollView
              style={styles.behaviorDetailScroll}
              showsVerticalScrollIndicator={false}
            >
              {getFilteredBehaviorData().length === 0 ? (
                <View style={styles.emptyContainer}>
                  <FontAwesomeIcon
                    icon={faClipboardList}
                    size={48}
                    color='#8E8E93'
                  />
                  <Text style={styles.emptyText}>No behavior points found</Text>
                  <Text style={styles.emptySubtext}>
                    {selectedBehaviorType === 'PRS'
                      ? 'No positive behavior points to display'
                      : 'No negative behavior points to display'}
                  </Text>
                </View>
              ) : (
                getFilteredBehaviorData().map((item) => (
                  <View key={item.id} style={styles.behaviorDetailCard}>
                    <View style={styles.behaviorDetailCardHeader}>
                      <View style={styles.behaviorDetailLeft}>
                        <Text style={styles.behaviorDetailItemTitle}>
                          {item.item_title}
                        </Text>
                        <Text style={styles.behaviorDetailDate}>
                          {formatDate(item.date)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.behaviorPointsBadge,
                          {
                            backgroundColor:
                              parseInt(item.item_point || item.points) >= 0
                                ? '#34C759'
                                : '#FF3B30',
                          },
                        ]}
                      >
                        <Text style={styles.behaviorPointsText}>
                          {item.item_point || item.points}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.behaviorDetailBody}>
                      <View style={styles.behaviorDetailRow}>
                        <Text style={styles.behaviorDetailLabel}>Type:</Text>
                        <Text style={styles.behaviorDetailValue}>
                          {item.item_type || item.type}
                        </Text>
                      </View>

                      <View style={styles.behaviorDetailRow}>
                        <Text style={styles.behaviorDetailLabel}>Points:</Text>
                        <Text
                          style={[
                            styles.behaviorDetailValue,
                            {
                              color:
                                parseInt(item.item_point || item.points) >= 0
                                  ? '#34C759'
                                  : '#FF3B30',
                              fontWeight: 'bold',
                            },
                          ]}
                        >
                          {item.item_point || item.points}
                        </Text>
                      </View>

                      <View style={styles.behaviorDetailRow}>
                        <Text style={styles.behaviorDetailLabel}>Teacher:</Text>
                        <Text style={styles.behaviorDetailValue}>
                          {item.teacher_name}
                        </Text>
                      </View>

                      {item.note && (
                        <View style={styles.behaviorDetailRow}>
                          <Text style={styles.behaviorDetailLabel}>Note:</Text>
                          <Text style={styles.behaviorDetailValue}>
                            {item.note}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        ) : selectedView === 'detention' ? (
          <View style={styles.detentionDetailContainer}>
            {/* Detention Details List */}
            <ScrollView style={styles.detentionDetailScroll}>
              {getFilteredDetentionData().length === 0 ? (
                <View style={styles.emptyContainer}>
                  <FontAwesomeIcon
                    icon={faScaleBalanced}
                    size={48}
                    color='#8E8E93'
                  />
                  <Text style={styles.emptyText}>No detentions found</Text>
                  <Text style={styles.emptySubtext}>
                    {selectedDetentionType === 'served'
                      ? 'No served detentions to display'
                      : 'No pending detentions to display'}
                  </Text>
                </View>
              ) : (
                getFilteredDetentionData().map((item) => (
                  <View key={item.id} style={styles.detentionDetailCard}>
                    <View style={styles.detentionDetailCardHeader}>
                      <View style={styles.detentionDetailLeft}>
                        <Text style={styles.detentionDetailItemTitle}>
                          {item.item_title}
                        </Text>
                        <Text style={styles.detentionDetailDate}>
                          {formatDate(item.date)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.detentionStatusBadge,
                          {
                            backgroundColor: item.is_served
                              ? '#34C759'
                              : '#FF3B30',
                          },
                        ]}
                      >
                        <FontAwesomeIcon
                          icon={item.is_served ? faCheckCircle : faTimesCircle}
                          size={16}
                          color='#fff'
                        />
                      </View>
                    </View>

                    <View style={styles.detentionDetailBody}>
                      <View style={styles.detentionDetailRow}>
                        <Text style={styles.detentionDetailLabel}>Type:</Text>
                        <Text style={styles.detentionDetailValue}>
                          {item.detention_type}
                        </Text>
                      </View>

                      <View style={styles.detentionDetailRow}>
                        <Text style={styles.detentionDetailLabel}>Points:</Text>
                        <Text
                          style={[
                            styles.detentionDetailValue,
                            { color: '#FF3B30', fontWeight: 'bold' },
                          ]}
                        >
                          {item.item_point}
                        </Text>
                      </View>

                      <View style={styles.detentionDetailRow}>
                        <Text style={styles.detentionDetailLabel}>
                          Teacher:
                        </Text>
                        <Text style={styles.detentionDetailValue}>
                          {item.teacher_name}
                        </Text>
                      </View>

                      {item.system_note && (
                        <View style={styles.detentionDetailRow}>
                          <Text style={styles.detentionDetailLabel}>Note:</Text>
                          <Text style={styles.detentionDetailValue}>
                            {item.system_note}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        ) : null}
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
      paddingVertical: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      borderBottomEndRadius: 16,
      borderBottomStartRadius: 16,
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
      color: theme.colors.headerText,
      fontSize: 20,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    headerRight: {
      width: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Subheader styles
    viewContextText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },

    content: {
      flex: 1,
      paddingTop: 10,
      paddingHorizontal: 5,
    },
    landscapeContent: {
      paddingHorizontal: 20,
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

    // Summary Cards
    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 20,
      marginHorizontal: 10,
    },
    summaryCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      paddingVertical: 15,
      width: '48%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      alignItems: 'center',
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 5,
    },
    summaryValue: {
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
      color: theme.colors.text,
    },

    // Statistics
    statsContainer: {
      marginBottom: 20,
      marginHorizontal: 5,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 15,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    statItem: {
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
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: '#666',
      fontWeight: '600',
    },

    // Records
    recordsContainer: {
      marginBottom: 20,
    },
    evenCard: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 15,
    },
    cardLeft: {
      flexDirection: 'row',
      flex: 1,
      marginRight: 15,
    },
    typeIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    cardInfo: {
      flex: 1,
    },
    cardReason: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    cardDate: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    cardRight: {
      alignItems: 'flex-end',
    },
    pointsBadge: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      minWidth: 50,
      alignItems: 'center',
    },
    pointsText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
    cardBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardDetails: {
      flex: 1,
    },
    cardDetailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    cardDetailText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 8,
    },
    cardTypeContainer: {
      alignItems: 'flex-end',
    },
    typeBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    typeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },

    // Empty State
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
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

    // Pagination
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 10,
    },
    paginationButton: {
      backgroundColor: '#5856D6',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    disabledButton: {
      backgroundColor: '#ccc',
    },
    paginationButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    disabledButtonText: {
      color: '#999',
    },
    paginationInfo: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '600',
    },

    // Behavior Styles
    behaviorContainer: {
      marginBottom: 20,
      marginHorizontal: 10,
    },
    behaviorGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    behaviorCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      width: '48%',
      ...theme.shadows.medium,
    },
    behaviorCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },

    behaviorCardBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },

    behaviorIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    behaviorCardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    behaviorCardNumber: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    behaviorCardSubtext: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },

    // Behavior Detail Styles
    behaviorDetailContainer: {
      flex: 1,
    },
    behaviorDetailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginBottom: 15,
      marginHorizontal: 15,
      justifyContent: 'space-between',
    },
    behaviorBackButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 15,
    },
    behaviorBackText: {
      fontSize: 16,
      color: '#5856D6',
      marginLeft: 5,
    },
    behaviorDetailTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    behaviorDetailScroll: {
      flex: 1,
    },
    behaviorDetailCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 15,
      marginHorizontal: 10,
      ...theme.shadows.medium,
    },
    behaviorDetailCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 15,
    },
    behaviorDetailLeft: {
      flex: 1,
      marginRight: 15,
    },
    behaviorDetailItemTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    behaviorDetailDate: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    behaviorPointsBadge: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      minWidth: 50,
      alignItems: 'center',
    },
    behaviorPointsText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
    behaviorDetailBody: {
      gap: 12,
    },
    behaviorDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    behaviorDetailLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      flex: 1,
    },
    behaviorDetailValue: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 2,
      textAlign: 'right',
    },

    // Detention Styles
    detentionContainer: {
      marginBottom: 20,
      marginHorizontal: 10,
    },
    detentionGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    detentionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      width: '48%',
      ...createMediumShadow(theme),
    },
    detentionCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    detentionIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    detentionCardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    detentionCardNumber: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    detentionCardSubtext: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },

    // Detention Detail Styles
    detentionDetailContainer: {
      flex: 1,
      paddingHorizontal: 10,
    },
    detentionDetailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginBottom: 15,
    },
    detentionBackButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 15,
    },
    detentionBackText: {
      fontSize: 16,
      color: '#5856D6',
      marginLeft: 5,
    },
    detentionDetailTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    detentionDetailScroll: {
      flex: 1,
    },
    detentionDetailCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 15,
      ...theme.shadows.medium,
    },
    detentionDetailCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 15,
    },
    detentionDetailLeft: {
      flex: 1,
      marginRight: 15,
    },
    detentionDetailItemTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    detentionDetailDate: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    detentionStatusBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    detentionDetailBody: {
      gap: 12,
    },
    detentionDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    detentionDetailLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      flex: 1,
    },
    detentionDetailValue: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 2,
      textAlign: 'right',
    },
  });
