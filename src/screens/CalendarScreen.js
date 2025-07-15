/**
 * Calendar Screen
 * Multi-tenant calendar with Google Calendar integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faCalendarAlt,
  faCalendarDay,
  faList,
  faArrowLeft,
  faSync,
  faCog,
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getLanguageFontSizes } from '../contexts/ThemeContext';
import { createSmallShadow } from '../utils/commonStyles';

import CalendarService from '../services/calendarService';
import SchoolConfigService from '../services/schoolConfigService';

import CalendarView from '../components/CalendarView';
import { showCalendarDiagnostics } from '../utils/calendarDiagnostics';

export default function CalendarScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);

  // Get calendar mode from route params (default to 'combined' for backward compatibility)
  const calendarMode = route?.params?.mode || 'combined';
  const isPersonalCalendarEnabled = calendarMode === 'combined';

  // Utility function to strip HTML tags from text
  const stripHtmlTags = (html) => {
    if (!html || typeof html !== 'string') return '';

    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, '');

    // Decode common HTML entities
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&hellip;/g, '...')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–');

    // Clean up extra whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  };

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schoolConfig, setSchoolConfig] = useState(null);
  const [calendarService, setCalendarService] = useState(null);
  const [events, setEvents] = useState([]);
  const [userData, setUserData] = useState(null);
  const [googleSignedIn, setGoogleSignedIn] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  // Initialize screen
  useEffect(() => {
    initializeCalendar();

    // Cleanup function to clear temporary calendar data when component unmounts
    return () => {
      // Clear teacher calendar data when leaving the screen to prevent data persistence
      if (route?.params?.userType === 'teacher') {
        AsyncStorage.removeItem('teacherCalendarData').catch((error) => {
          console.warn('Failed to clear teacher calendar data:', error);
        });
      }
    };
  }, [route?.params?.userType]);

  const initializeCalendar = async () => {
    try {
      setLoading(true);

      // Get user data - check multiple sources with proper priority
      let userDataStr = await AsyncStorage.getItem('userData');
      const calendarUserDataStr = await AsyncStorage.getItem(
        'calendarUserData'
      );
      const teacherCalendarDataStr = await AsyncStorage.getItem(
        'teacherCalendarData'
      );
      const selectedStudentStr = await AsyncStorage.getItem('selectedStudent');

      console.log('🔍 CALENDAR: User data check:', {
        hasUserData: !!userDataStr,
        hasCalendarUserData: !!calendarUserDataStr,
        hasTeacherCalendarData: !!teacherCalendarDataStr,
        hasSelectedStudent: !!selectedStudentStr,
        routeUserType: route?.params?.userType,
      });

      // Priority order based on navigation source:
      // 1. teacherCalendarData (from teacher dashboard) - highest priority for teacher navigation
      // 2. calendarUserData (from parent screen) - for student-specific access
      // 3. selectedStudent - fallback for student selection
      // 4. direct login userData - fallback for direct access

      if (teacherCalendarDataStr && route?.params?.userType === 'teacher') {
        console.log(
          '📅 CALENDAR: Using teacher calendar data (from teacher dashboard)'
        );
        userDataStr = teacherCalendarDataStr;
      } else if (calendarUserDataStr) {
        console.log(
          '📅 CALENDAR: Using calendar user data (from parent screen navigation)'
        );
        userDataStr = calendarUserDataStr;
      } else if (selectedStudentStr) {
        console.log(
          '📅 CALENDAR: Using selected student data for calendar access'
        );
        userDataStr = selectedStudentStr;
      } else if (userDataStr) {
        console.log('📅 CALENDAR: Using direct login user data');
        // userDataStr is already set, no need to change it
      }

      if (!userDataStr) {
        console.log('❌ CALENDAR: No user data found in AsyncStorage');
        Alert.alert(
          'Login Required',
          'Please log in as a teacher or student to access the calendar.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            {
              text: 'Login as Teacher',
              onPress: () =>
                navigation.navigate('Login', { loginType: 'teacher' }),
            },
            {
              text: 'Login as Student',
              onPress: () =>
                navigation.navigate('Login', { loginType: 'student' }),
            },
          ]
        );
        return;
      }

      const user = JSON.parse(userDataStr);
      setUserData(user);

      console.log('📅 CALENDAR: Initializing calendar for user:', {
        userType: user.userType,
        userId: user.id,
        username: user.username || user.name,
        hasAuthCode: !!user.authCode,
        authCodePreview: user.authCode
          ? `${user.authCode.substring(0, 8)}...`
          : 'none',
        dataSource: calendarUserDataStr
          ? 'parent_screen'
          : selectedStudentStr
          ? 'selected_student'
          : 'direct_login',
      });

      // Get school configuration
      const config = await SchoolConfigService.getCurrentSchoolConfig();
      if (!config) {
        Alert.alert('Error', 'School configuration not found');
        navigation.goBack();
        return;
      }

      setSchoolConfig(config);
      console.log('📅 CALENDAR: Initialized for school:', config.name);
      console.log(
        '🔧 CALENDAR: Google Calendar available:',
        config.hasGoogleWorkspace
      );

      // Initialize calendar service with mode
      console.log(
        `📅 CALENDAR: Initializing calendar service in ${calendarMode} mode`
      );
      const service = await CalendarService.initialize(user, {
        mode: calendarMode,
      });
      setCalendarService(service);

      // Load initial events
      await loadEvents(service);
    } catch (error) {
      console.error('❌ CALENDAR: Initialization error:', error);
      Alert.alert('Error', 'Failed to initialize calendar');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async (service = calendarService) => {
    try {
      if (!service) return;

      // Use getEventsUntilMarch20 to fetch events until March 20 instead of just 30 days
      const calendarEvents = await service.getEventsUntilMarch20();

      setEvents(calendarEvents);
      console.log(
        `📅 CALENDAR: Loaded ${calendarEvents.length} events until March 20`
      );
    } catch (error) {
      console.error('❌ CALENDAR: Error loading events:', error);
      Alert.alert('Error', 'Failed to load calendar events');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleEventPress = (event) => {
    const cleanDescription =
      stripHtmlTags(event.description) || 'No description';
    Alert.alert(
      event.title,
      `${cleanDescription}\n\nTime: ${new Date(
        event.startTime
      ).toLocaleString()}\nType: ${event.calendarType}${
        event.location ? `\nLocation: ${event.location}` : ''
      }`,
      [{ text: 'OK' }]
    );
  };

  const handleDatePress = (date) => {
    console.log('📅 Date selected:', date.toDateString());
  };

  const handleTestConnection = async () => {
    try {
      if (!calendarService) {
        Alert.alert('Error', 'Calendar service not initialized');
        return;
      }

      if (
        !userData ||
        (userData.userType !== 'staff' && userData.userType !== 'teacher')
      ) {
        Alert.alert(
          'Access Denied',
          'Calendar connection test is only available for staff users'
        );
        return;
      }

      const branchId = userData.branchId || userData.branches?.[0]?.id;
      if (!branchId) {
        Alert.alert('Error', 'No branch ID available for testing');
        return;
      }

      Alert.alert(
        'Testing Calendar Connection',
        'Testing Google Calendar connection... Please wait.',
        [{ text: 'OK' }]
      );

      const testResults = await calendarService.testCalendarConnection(
        branchId
      );

      if (testResults.success) {
        const data = testResults.data;
        const successRate = `${data.successful_connections}/${data.total_calendars}`;

        Alert.alert(
          'Calendar Connection Test Results',
          `Branch: ${data.branch_id}\n` +
            `Academic Year: ${data.academic_year_id}\n` +
            `Calendars Tested: ${data.total_calendars}\n` +
            `Successful Connections: ${data.successful_connections}\n` +
            `Failed Connections: ${data.failed_connections}\n\n` +
            `Success Rate: ${successRate}\n` +
            `Test completed at: ${new Date(data.tested_at).toLocaleString()}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Test Failed',
          testResults.message || 'Calendar connection test failed'
        );
      }
    } catch (error) {
      console.error('❌ Calendar connection test error:', error);
      Alert.alert(
        'Test Error',
        `Failed to test calendar connection: ${error.message}`
      );
    }
  };

  const handleDiagnostics = async () => {
    try {
      await showCalendarDiagnostics(userData, schoolConfig);
    } catch (error) {
      console.error('❌ Diagnostics error:', error);
      Alert.alert('Error', `Failed to run diagnostics: ${error.message}`);
    }
  };

  const renderEvent = (event, index) => {
    const eventDate = new Date(event.startTime);
    const isToday = eventDate.toDateString() === new Date().toDateString();

    return (
      <TouchableOpacity
        key={event.id || index}
        style={[
          styles.eventCard,
          { backgroundColor: theme.colors.surface },
          isToday && {
            borderLeftColor: getEventTypeColor(getEventType(event)),
            borderLeftWidth: 4,
          },
        ]}
        onPress={() => showEventDetails(event)}
      >
        <View style={styles.eventHeader}>
          <Text style={[styles.eventTitle, { color: theme.colors.text }]}>
            {event.title}
          </Text>
          <View
            style={[
              styles.eventTypeTag,
              { backgroundColor: getEventTypeColor(getEventType(event)) },
            ]}
          >
            <Text style={styles.eventTypeText}>{getEventType(event)}</Text>
          </View>
        </View>

        <Text style={[styles.eventTime, { color: theme.colors.textSecondary }]}>
          {formatEventTime(event)}
        </Text>

        {event.description && (
          <Text
            style={[
              styles.eventDescription,
              { color: theme.colors.textSecondary },
            ]}
            numberOfLines={2}
          >
            {stripHtmlTags(event.description)}
          </Text>
        )}

        {event.location && (
          <Text
            style={[styles.eventLocation, { color: theme.colors.textLight }]}
          >
            📍 {event.location}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const showEventDetails = (event) => {
    const cleanDescription =
      stripHtmlTags(event.description) || 'No description';
    Alert.alert(
      event.title,
      `${formatEventTime(event)}\n\n${cleanDescription}\n\nType: ${getEventType(
        event
      )}`,
      [{ text: 'OK' }]
    );
  };

  const formatEventTime = (event) => {
    const startDate = new Date(event.startTime);
    const endDate = event.endTime ? new Date(event.endTime) : null;

    if (event.isAllDay) {
      return startDate.toLocaleDateString();
    }

    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const dateOptions = { month: 'short', day: 'numeric' };

    let timeStr = startDate.toLocaleDateString(undefined, dateOptions);
    timeStr += ' ' + startDate.toLocaleTimeString(undefined, timeOptions);

    if (endDate && !event.isAllDay) {
      timeStr += ' - ' + endDate.toLocaleTimeString(undefined, timeOptions);
    }

    return timeStr;
  };

  // Determine event type based on description and title
  const getEventType = (event) => {
    const cleanDescription = stripHtmlTags(
      event.description || ''
    ).toLowerCase();
    const title = (event.title || '').toLowerCase();
    const combined = `${title} ${cleanDescription}`;

    // Academic/Class related
    if (
      combined.match(
        /(class|lesson|subject|math|science|english|history|literature|physics|chemistry|biology|geography|art|music|pe|physical education)/
      )
    ) {
      return 'Academic';
    }

    // Exams and Tests
    if (
      combined.match(/(exam|test|quiz|assessment|evaluation|midterm|final)/)
    ) {
      return 'Exam';
    }

    // Meetings
    if (
      combined.match(/(meeting|conference|discussion|parent|teacher|staff)/)
    ) {
      return 'Meeting';
    }

    // Events and Activities
    if (
      combined.match(
        /(event|festival|celebration|ceremony|assembly|sports|competition|tournament|field trip|excursion)/
      )
    ) {
      return 'Event';
    }

    // Assignments and Homework
    if (
      combined.match(/(assignment|homework|project|submission|deadline|due)/)
    ) {
      return 'Assignment';
    }

    // Holidays and Breaks
    if (combined.match(/(holiday|break|vacation|off|closed|no school)/)) {
      return 'Holiday';
    }

    // Health related
    if (combined.match(/(health|medical|checkup|vaccination|doctor|nurse)/)) {
      return 'Health';
    }

    // Library related
    if (combined.match(/(library|book|reading|borrow|return)/)) {
      return 'Library';
    }

    // Default fallback - use source or generic type
    if (event.source) {
      return event.source.charAt(0).toUpperCase() + event.source.slice(1);
    }

    return 'General';
  };

  // Get color for event type
  const getEventTypeColor = (eventType) => {
    const colors = {
      Academic: '#4CAF50', // Green - learning/growth
      Exam: '#F44336', // Red - important/urgent
      Meeting: '#2196F3', // Blue - communication
      Event: '#FF9800', // Orange - activities/fun
      Assignment: '#9C27B0', // Purple - tasks/work
      Holiday: '#FFC107', // Amber - celebration/break
      Health: '#E91E63', // Pink - health/care
      Library: '#795548', // Brown - books/knowledge
      General: '#607D8B', // Blue Grey - default
    };

    return colors[eventType] || colors['General'];
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
    },
    // Compact Header Styles
    compactHeaderContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginHorizontal: 0,
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
    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    // Legacy header style (keeping for compatibility)
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: theme.colors.headerBackground,
      ...createSmallShadow(theme),
    },
    headerLeft: {
      flexDirection: 'row',
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
      marginLeft: 8,
    },
    headerRight: {
      width: 36,
    },
    // View Mode Styles
    viewModeContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 4,
    },
    viewModeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      marginHorizontal: 2,
      backgroundColor: 'transparent',
    },
    activeViewModeButton: {
      backgroundColor: theme.colors.primary,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    viewModeButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      marginLeft: 6,
    },
    activeViewModeButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    // Legacy header button styles (keeping for compatibility)
    headerButton: {
      marginLeft: 15,
      padding: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerButtonActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    schoolInfo: {
      padding: 20,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    schoolName: {
      fontSize: fontSizes.subtitle,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 5,
    },
    schoolFeatures: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 10,
    },
    featureTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      marginRight: 8,
      marginBottom: 4,
    },
    featureText: {
      fontSize: fontSizes.caption,
      color: '#fff',
    },
    googleSection: {
      padding: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      backgroundColor: '#4285F4',
    },
    googleButtonText: {
      color: '#fff',
      fontSize: fontSizes.body,
      fontWeight: '600',
      marginLeft: 8,
    },
    readOnlyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    readOnlyTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 8,
    },
    readOnlySubtitle: {
      fontSize: fontSizes.caption,
      color: theme.colors.textSecondary,
      marginLeft: 8,
      fontStyle: 'italic',
    },
    readOnlyDescription: {
      fontSize: fontSizes.body,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    calendarTypes: {
      marginTop: 8,
    },
    calendarTypesTitle: {
      fontSize: fontSizes.body,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    calendarTypesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    calendarTypeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    calendarTypeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    calendarTypeText: {
      fontSize: fontSizes.caption,
      color: theme.colors.textSecondary,
    },
    eventsContainer: {
      flex: 1,
    },
    eventsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    eventsTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: '600',
      color: theme.colors.text,
    },
    eventsCount: {
      fontSize: fontSizes.caption,
      color: theme.colors.textSecondary,
    },
    eventsList: {
      paddingHorizontal: 20,
    },
    eventCard: {
      padding: 15,
      borderRadius: 12,
      marginBottom: 12,
      ...createSmallShadow(theme),
    },
    eventHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    eventTitle: {
      fontSize: fontSizes.body,
      fontWeight: '600',
      flex: 1,
      marginRight: 10,
    },
    eventTypeTag: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    eventTypeText: {
      fontSize: fontSizes.caption,
      color: '#fff',
      fontWeight: '500',
    },
    eventTime: {
      fontSize: fontSizes.caption,
      marginBottom: 4,
    },
    eventDescription: {
      fontSize: fontSizes.caption,
      marginBottom: 4,
    },
    eventLocation: {
      fontSize: fontSizes.caption,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: fontSizes.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 20,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
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
              <Text style={styles.headerTitle}>Calendar</Text>
            </View>

            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={[styles.emptyText, { marginTop: 20 }]}>
            Loading calendar...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.headerTitle}>Calendar</Text>
          </View>

          <View style={styles.headerRight} />
        </View>

        {/* View Mode Subheader */}
        <View style={styles.subHeader}>
          <View style={styles.viewModeContainer}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'calendar' && styles.activeViewModeButton,
              ]}
              onPress={() => setViewMode('calendar')}
            >
              <FontAwesomeIcon
                icon={faCalendarDay}
                size={14}
                color={
                  viewMode === 'calendar' ? '#fff' : theme.colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.viewModeButtonText,
                  viewMode === 'calendar' && styles.activeViewModeButtonText,
                ]}
              >
                Calendar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'list' && styles.activeViewModeButton,
              ]}
              onPress={() => setViewMode('list')}
            >
              <FontAwesomeIcon
                icon={faList}
                size={14}
                color={
                  viewMode === 'list' ? '#fff' : theme.colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.viewModeButtonText,
                  viewMode === 'list' && styles.activeViewModeButtonText,
                ]}
              >
                List
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading calendar events...</Text>
        </View>
      ) : viewMode === 'calendar' ? (
        <CalendarView
          events={events}
          onEventPress={handleEventPress}
          onDatePress={handleDatePress}
        />
      ) : (
        <ScrollView
          style={styles.eventsContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Google Calendar Section */}
          {calendarService?.isGoogleCalendarAvailable() && (
            <View style={styles.googleSection}>
              <View style={styles.calendarTypes}>
                <Text style={styles.calendarTypesTitle}>Event Types:</Text>
                <View style={styles.calendarTypesList}>
                  <View style={styles.calendarTypeItem}>
                    <View
                      style={[
                        styles.calendarTypeDot,
                        { backgroundColor: getEventTypeColor('Academic') },
                      ]}
                    />
                    <Text style={styles.calendarTypeText}>Academic</Text>
                  </View>
                  <View style={styles.calendarTypeItem}>
                    <View
                      style={[
                        styles.calendarTypeDot,
                        { backgroundColor: getEventTypeColor('Exam') },
                      ]}
                    />
                    <Text style={styles.calendarTypeText}>Exam</Text>
                  </View>
                  <View style={styles.calendarTypeItem}>
                    <View
                      style={[
                        styles.calendarTypeDot,
                        { backgroundColor: getEventTypeColor('Meeting') },
                      ]}
                    />
                    <Text style={styles.calendarTypeText}>Meeting</Text>
                  </View>
                  <View style={styles.calendarTypeItem}>
                    <View
                      style={[
                        styles.calendarTypeDot,
                        { backgroundColor: getEventTypeColor('Event') },
                      ]}
                    />
                    <Text style={styles.calendarTypeText}>Event</Text>
                  </View>
                  <View style={styles.calendarTypeItem}>
                    <View
                      style={[
                        styles.calendarTypeDot,
                        { backgroundColor: getEventTypeColor('Assignment') },
                      ]}
                    />
                    <Text style={styles.calendarTypeText}>Assignment</Text>
                  </View>
                  <View style={styles.calendarTypeItem}>
                    <View
                      style={[
                        styles.calendarTypeDot,
                        { backgroundColor: getEventTypeColor('Holiday') },
                      ]}
                    />
                    <Text style={styles.calendarTypeText}>Holiday</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Events List */}
          <View style={styles.eventsHeader}>
            <Text style={styles.eventsTitle}>Upcoming Events</Text>
            <Text style={styles.eventsCount}>{events.length} events</Text>
          </View>

          <View style={styles.eventsList}>
            {events.length > 0 ? (
              events.map((event, index) => renderEvent(event, index))
            ) : (
              <View style={styles.emptyContainer}>
                <FontAwesomeIcon
                  icon={faCalendarAlt}
                  size={48}
                  color={theme.colors.textLight}
                />
                <Text style={styles.emptyText}>
                  No upcoming events found.{'\n'}
                  {calendarService?.isGoogleCalendarAvailable() &&
                  !googleSignedIn
                    ? 'Sign in to Google Calendar to see more events.'
                    : 'Check back later for new events.'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
