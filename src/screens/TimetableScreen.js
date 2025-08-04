import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Config, buildApiUrl } from '../config/env';
import {
  faArrowLeft,
  faCalendarAlt,
  faClock,
  faUser,
  faChevronRight,
  faCircle,
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
  faBell,
} from '@fortawesome/free-solid-svg-icons';
import timetableData from '../data/dummyTimetable.json';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { createCustomShadow, createMediumShadow } from '../utils/commonStyles';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationBadge from '../components/NotificationBadge';
import { useFocusEffect } from '@react-navigation/native';
import { getDemoTimetableData } from '../services/demoModeService';

export default function TimetableScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);
  const { unreadCount, refreshNotifications } = useNotifications();

  const [timetable, setTimetable] = useState(null);
  const [availableDays, setAvailableDays] = useState([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]);
  const { authCode } = route.params || {};

  const styles = createStyles(theme, fontSizes);

  // Refresh notifications when screen comes into focus (with debouncing)
  const lastNotificationRefresh = React.useRef(0);
  const isRefreshingNotifications = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // Only refresh notifications if:
      // 1. It's been more than 30 seconds since last refresh
      // 2. We're not currently refreshing notifications
      if (
        now - lastNotificationRefresh.current > 30000 &&
        !isRefreshingNotifications.current
      ) {
        lastNotificationRefresh.current = now;
        isRefreshingNotifications.current = true;

        refreshNotifications().finally(() => {
          isRefreshingNotifications.current = false;
        });
      }
    }, [refreshNotifications])
  );

  // Enable rotation for this screen (optional - you can remove this if you want timetable to stay portrait)
  // useScreenOrientation(true);

  const baseDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  // Helper function to convert object response to array format
  const convertObjectToArrayFormat = (data) => {
    // If data is already in the correct format (object with day keys containing arrays), return as is
    if (
      data &&
      typeof data === 'object' &&
      data.Monday &&
      Array.isArray(data.Monday)
    ) {
      return data;
    }

    // If data is an object that needs conversion to day-based structure
    if (data && typeof data === 'object') {
      const convertedData = {};

      // Handle your specific API format with numeric keys (1=Monday, 2=Tuesday, etc.)
      const dayMapping = {
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday',
      };

      // Convert numeric keys to day names
      Object.keys(data).forEach((key) => {
        const dayName = dayMapping[key];
        if (dayName && Array.isArray(data[key])) {
          // Sort by week_time to ensure proper order, then by created_at to get latest first
          const sortedEntries = data[key].sort((a, b) => {
            if (a.week_time === b.week_time) {
              // If same period, sort by created_at (latest first)
              return new Date(b.created_at) - new Date(a.created_at);
            }
            return a.week_time - b.week_time;
          });

          // Remove duplicates - keep only the latest entry for each week_time
          const uniqueEntries = [];
          const seenPeriods = new Set();

          sortedEntries.forEach((item) => {
            if (!seenPeriods.has(item.week_time)) {
              seenPeriods.add(item.week_time);
              uniqueEntries.push(item);
            }
          });

          // Transform the data to match your component's expected format
          convertedData[dayName] = uniqueEntries.map((item) => ({
            subject:
              item.subject?.name ||
              item.subject?.subject_name ||
              t('unknownSubject'),
            teacher:
              item.user?.name || item.user?.full_name || t('unknownTeacher'),
            period: item.week_time,
            time: t('period') + ` ${item.week_time}`, // You can customize this format
            // Keep original data for reference
            originalData: item,
          }));
        }
      });

      // Determine which days have data and update available days
      const daysWithData = Object.keys(convertedData).filter(
        (day) => convertedData[day] && convertedData[day].length > 0
      );

      // Set available days based on what's in the data
      const finalAvailableDays = baseDays.filter(
        (day) =>
          daysWithData.includes(day) ||
          ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)
      );

      // Initialize empty arrays for days that don't have data but should be shown
      finalAvailableDays.forEach((day) => {
        if (!convertedData[day]) {
          convertedData[day] = [];
        }
      });

      // Update available days state
      setAvailableDays(finalAvailableDays);

      return convertedData;
    }

    return data;
  };

  const fetchTimetable = async () => {
    try {
      // Check if this is demo mode
      if (authCode && authCode.startsWith('DEMO_AUTH_')) {
        console.log('🎭 DEMO MODE: Using demo student timetable data');
        const demoData = getDemoTimetableData('student');
        if (demoData.success) {
          // Convert demo data to the expected format
          const convertedData = convertObjectToArrayFormat(demoData);
          return convertedData;
        }
      }

      const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_TIMETABLE, {
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
        // Convert object to array format if needed
        const convertedData = convertObjectToArrayFormat(data);
        return convertedData;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
      return null;
    }
  };
  useEffect(() => {
    const fetchAndSetTimetable = async () => {
      const data = await fetchTimetable();
      if (data) {
        setTimetable(data);
      }
    };

    fetchAndSetTimetable();
  }, []);

  const getCurrentDay = () => {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const currentDayName = dayNames[today];

    // Return current day if it's in available days, otherwise return first available day
    return availableDays.includes(currentDayName)
      ? currentDayName
      : availableDays[0] || 'Monday';
  };

  const [selectedDay, setSelectedDay] = useState('Monday');

  // Update selected day when available days change
  useEffect(() => {
    const currentDay = getCurrentDay();
    setSelectedDay(currentDay);
  }, [availableDays]);

  // Modern gradient colors for periods
  const getPeriodGradient = (period) => {
    const gradients = {
      1: { start: '#FF6B6B', end: '#FF8E8E' }, // Red gradient
      2: { start: '#4ECDC4', end: '#6EDDD6' }, // Teal gradient
      3: { start: '#45B7D1', end: '#67C5DD' }, // Blue gradient
      4: { start: '#96CEB4', end: '#A8D6C2' }, // Green gradient
      5: { start: '#FFEAA7', end: '#FFEFB8' }, // Yellow gradient
      6: { start: '#DDA0DD', end: '#E5B3E5' }, // Purple gradient
      7: { start: '#98D8C8', end: '#A6DFD1' }, // Light Green gradient
      8: { start: '#F7DC6F', end: '#F9E285' }, // Light Yellow gradient
      9: { start: '#BB8FCE', end: '#C7A2D6' }, // Light Purple gradient
      10: { start: '#85C1E9', end: '#9BCAED' }, // Light Blue gradient
    };
    return gradients[period] || { start: '#BDC3C7', end: '#D5DBDB' };
  };

  // Get subject icon based on subject name (same as GradesScreen)
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

  const renderTimeSlot = ({ item, index }) => {
    const period = item.period || index + 1;
    const gradient = getPeriodGradient(period);
    const isLastItem =
      index ===
      (timetable
        ? timetable[selectedDay]?.length - 1
        : timetableData[selectedDay]?.length - 1);

    return (
      <View style={styles.modernTimeSlotContainer}>
        {/* Timeline connector */}
        <View style={styles.timelineContainer}>
          <View
            style={[styles.timelineDot, { backgroundColor: gradient.start }]}
          >
            <Text style={styles.periodNumber}>{period}</Text>
          </View>
          {!isLastItem && <View style={styles.timelineLine} />}
        </View>

        {/* Subject card */}
        <View
          style={[
            styles.modernSubjectCard,
            { borderLeftColor: gradient.start },
          ]}
        >
          <View style={styles.subjectCardHeader}>
            <View style={styles.subjectInfo}>
              <Text style={styles.modernSubjectText}>
                {item.subject.length > 16
                  ? `${item.subject.substring(0, 16)}...`
                  : item.subject}
              </Text>
              <View style={styles.teacherRow}>
                <FontAwesomeIcon icon={faUser} size={14} color='#666' />
                <Text style={styles.modernTeacherText}>{item.teacher}</Text>
              </View>
            </View>
            <View style={styles.periodBadgeContainer}>
              <View
                style={[
                  styles.periodBadge,
                  { backgroundColor: gradient.start },
                ]}
              >
                <FontAwesomeIcon icon={faClock} size={12} color='#fff' />
              </View>
              <FontAwesomeIcon icon={faChevronRight} size={16} color='#ccc' />
            </View>
          </View>

          {/* Subject icon and additional info */}
          <View style={styles.subjectCardFooter}>
            <View
              style={[
                styles.subjectIconContainer,
                { backgroundColor: `${gradient.start}15` },
              ]}
            >
              <FontAwesomeIcon
                icon={getSubjectIcon(item.subject)}
                size={16}
                color={gradient.start}
              />
            </View>
            <Text style={styles.periodLabel}>Period {period}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderDayTab = (day, index) => {
    const isSelected = selectedDay === day;
    const dayAbbr = day.substring(0, 3);
    return (
      <TouchableOpacity
        key={index}
        style={[styles.modernDayTab, isSelected && styles.selectedModernDayTab]}
        onPress={() => setSelectedDay(day)}
      >
        <View
          style={[
            styles.dayTabIndicator,
            isSelected && styles.selectedDayTabIndicator,
          ]}
        />
        <Text
          style={[
            styles.modernDayTabText,
            isSelected && styles.selectedModernDayTabText,
          ]}
        >
          {dayAbbr}
        </Text>
        {isSelected && <View style={styles.dayTabGlow} />}
      </TouchableOpacity>
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
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <FontAwesomeIcon icon={faCalendarAlt} size={18} color='#fff' />
            <Text style={styles.headerTitle}>{t('timetable')}</Text>
          </View>

          <View style={styles.headerRight} />
        </View>

        {/* Day Info Subheader */}
        <View style={styles.subHeader}>
          <View style={styles.modernDayHeader}>
            <View style={styles.dayHeaderLeft}>
              <Text style={styles.modernDayTitle}>{selectedDay}</Text>
              <Text style={styles.daySubtitle}>
                {new Date().toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.dayHeaderRight}>
              <View style={styles.scheduleIndicator}>
                <FontAwesomeIcon icon={faCircle} size={8} color='#34C759' />
                <Text style={styles.scheduleIndicatorText}>
                  {(timetable
                    ? timetable[selectedDay]
                    : timetableData[selectedDay]
                  )?.length || 0}{' '}
                  periods
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Timeline Schedule */}
        <ScrollView
          style={styles.modernScheduleContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.modernScheduleList}
        >
          {(timetable ? timetable[selectedDay] : timetableData[selectedDay])
            ?.length > 0 ? (
            (timetable
              ? timetable[selectedDay]
              : timetableData[selectedDay]
            ).map((item, index) => (
              <View
                key={`${selectedDay}-${item.period || index}-${item.subject}`}
              >
                {renderTimeSlot({ item, index })}
              </View>
            ))
          ) : (
            <View style={styles.emptyScheduleContainer}>
              <FontAwesomeIcon icon={faCalendarAlt} size={48} color='#ccc' />
              <Text style={styles.emptyScheduleText}>No classes scheduled</Text>
              <Text style={styles.emptyScheduleSubtext}>
                Enjoy your free day!
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Day Tabs at Bottom */}
      <View style={styles.bottomTabsContainer}>
        {availableDays.map((day, index) => renderDayTab(day, index))}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme, fontSizes) =>
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
    // Legacy header style (keeping for compatibility)
    header: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      ...theme.shadows.small,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerRight: {
      width: 36,
    },
    subHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    headerTitle: {
      color: '#fff',
      fontSize: fontSizes.headerTitle,
      fontWeight: 'bold',
      marginLeft: 10,
    },
    notificationButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    content: {
      flex: 1,
      paddingTop: 20,
      paddingHorizontal: 10,
    },

    // Modern Day Header
    modernDayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 5,
      paddingHorizontal: 5,
    },
    dayHeaderLeft: {
      flex: 1,
    },
    modernDayTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    daySubtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    dayHeaderRight: {
      alignItems: 'flex-end',
    },
    scheduleIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    scheduleIndicatorText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
      marginLeft: 6,
    },

    // Modern Schedule Container
    modernScheduleContainer: {
      flex: 1,
    },
    modernScheduleList: {
      width: '100%',
      paddingTop: 20,
      paddingRight: 10,
    },

    // Timeline Styles
    modernTimeSlotContainer: {
      flexDirection: 'row',
      marginBottom: 20,
      alignItems: 'flex-start',
    },
    timelineContainer: {
      alignItems: 'center',
      marginRight: 20,
      width: 60,
    },
    timelineDot: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.1,
        radius: 4,
        elevation: 3,
      }),
    },
    periodNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
    timelineLine: {
      width: 3,
      height: 40,
      backgroundColor: theme.colors.border,
      marginTop: 10,
    },

    // Modern Subject Card
    modernSubjectCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      borderLeftWidth: 4,
      ...createMediumShadow(theme),
    },
    subjectCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 15,
    },
    subjectInfo: {
      flex: 1,
      marginRight: 15,
    },
    modernSubjectText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    teacherRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    modernTeacherText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 6,
      fontWeight: '500',
    },
    periodBadgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    periodBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    subjectCardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    subjectIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    periodLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },

    // Modern Day Tabs
    bottomTabsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      ...theme.shadows.large,
    },
    modernDayTab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 20,
      marginHorizontal: 4,
      position: 'relative',
    },
    selectedModernDayTab: {
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    dayTabIndicator: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: 'transparent',
      marginBottom: 6,
    },
    selectedDayTabIndicator: {
      backgroundColor: '#fff',
    },
    modernDayTabText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    selectedModernDayTabText: {
      color: '#fff',
      fontWeight: '700',
    },
    dayTabGlow: {
      position: 'absolute',
      top: -2,
      left: -2,
      right: -2,
      bottom: -2,
      borderRadius: 22,
      backgroundColor: 'rgba(0, 106, 253, 0.2)',
      zIndex: -1,
    },

    // Empty State
    emptyScheduleContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyScheduleText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      marginTop: 20,
      marginBottom: 8,
    },
    emptyScheduleSubtext: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
