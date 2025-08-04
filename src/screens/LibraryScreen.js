import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faBook,
  faBookOpen,
  faCalendarAlt,
  faClock,
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faRedo,
  faUser,
  faBarcode,
  faBell,
} from '@fortawesome/free-solid-svg-icons';
import { Config, buildApiUrl } from '../config/env';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { createSmallShadow, createMediumShadow } from '../utils/commonStyles';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationBadge from '../components/NotificationBadge';
import { getDemoStudentLibraryData } from '../services/demoModeService';
import { useFocusEffect } from '@react-navigation/native';

export default function LibraryScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { unreadCount, refreshNotifications } = useNotifications();

  const [libraryData, setLibraryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview'); // 'overview', 'borrowed', 'history', 'available'
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  const { studentName, authCode } = route.params || {};
  const styles = createStyles(theme);

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  const isLandscape = screenData.width > screenData.height;

  // Fetch library data from API
  const fetchLibraryData = async () => {
    if (!authCode) {
      Alert.alert(t('error'), t('authenticationRequired'));
      return;
    }

    try {
      setLoading(true);

      // Check if this is demo mode
      if (authCode && authCode.startsWith('DEMO_AUTH_')) {
        console.log('🎭 DEMO MODE: Using demo student library data');
        const demoData = getDemoStudentLibraryData();
        setLibraryData(demoData);
        setLoading(false);
        return;
      }

      const url = buildApiUrl('/student/library-data', {
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
        if (data.success) {
          setLibraryData(data);
        } else {
          Alert.alert(t('error'), t('failedToLoadLibraryData'));
        }
      } else {
        Alert.alert(t('error'), t('failedToConnectLibrarySystem'));
      }
    } catch (error) {
      console.error('Library data fetch error:', error);
      Alert.alert(t('error'), t('networkErrorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLibraryData();
    setRefreshing(false);
  };

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

  // Load data on component mount
  useEffect(() => {
    fetchLibraryData();
  }, [authCode]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate days overdue
  const getDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'current':
        return '#007AFF';
      case 'returned_late':
        return '#FF3B30';
      case 'returned_on_time':
        return '#34C759';
      case 'renewed':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  // author name split by comma and separated by 'and' if more than one
  const renderAuthorName = (authorName) => {
    if (!authorName) return null;
    console.log('Original author name:', authorName);

    // Split by comma (with or without space) and clean up any extra spaces
    const authors = authorName.split(',').map((author) => author.trim());
    console.log('Split authors:', authors);

    let result;
    if (authors.length === 1) {
      result = authors[0];
    } else if (authors.length === 2) {
      result = authors.join(' & ');
    } else {
      const lastAuthor = authors.pop();
      result = `${authors.join(' & ')} & ${lastAuthor}`;
    }

    console.log('Final result:', result);
    return result;
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'current':
        return 'Current';
      case 'returned_late':
        return 'Returned Late';
      case 'returned_on_time':
        return 'Returned';
      case 'renewed':
        return 'Renewed';
      default:
        return 'Unknown';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'current':
        return faBookOpen;
      case 'returned_late':
        return faExclamationTriangle;
      case 'returned_on_time':
        return faCheckCircle;
      case 'renewed':
        return faRedo;
      default:
        return faBook;
    }
  };

  // Render tab buttons
  const renderTabButton = (tabKey, label, icon) => {
    const isActive = selectedTab === tabKey;
    return (
      <TouchableOpacity
        key={tabKey}
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => setSelectedTab(tabKey)}
      >
        <FontAwesomeIcon
          icon={icon}
          size={16}
          color={isActive ? '#fff' : theme.colors.textSecondary}
        />
        <Text
          style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render overview statistics
  const renderOverview = () => {
    if (!libraryData?.library_statistics) return null;

    const stats = libraryData.library_statistics;

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Student Info Card */}
        <View style={styles.studentCard}>
          <View style={styles.studentInfo}>
            {libraryData.student_info?.student_photo ? (
              <Image
                source={{
                  uri: `https://${Config.API_DOMAIN}/${libraryData.student_info.student_photo}`,
                }}
                style={styles.studentPhoto}
              />
            ) : (
              <View style={styles.studentPhotoPlaceholder}>
                <FontAwesomeIcon icon={faUser} size={24} color='#fff' />
              </View>
            )}
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>
                {libraryData.student_info?.student_name ||
                  studentName ||
                  'Student'}
              </Text>
              <Text style={styles.studentId}>
                ID: {libraryData.student_info?.student_id || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Statistics Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.borrowingLimitCard]}>
            <FontAwesomeIcon icon={faBook} size={24} color='#007AFF' />
            <Text style={styles.statNumber}>{stats.borrowing_limit}</Text>
            <Text style={styles.statLabel}>Borrowing Limit</Text>
          </View>

          <View style={[styles.statCard, styles.currentlyBorrowedCard]}>
            <FontAwesomeIcon icon={faBookOpen} size={24} color='#FF9500' />
            <Text style={styles.statNumber}>{stats.currently_borrowed}</Text>
            <Text style={styles.statLabel}>Currently Borrowed</Text>
          </View>

          <View style={[styles.statCard, styles.remainingLimitCard]}>
            <FontAwesomeIcon icon={faCheckCircle} size={24} color='#34C759' />
            <Text style={styles.statNumber}>{stats.remaining_limit}</Text>
            <Text style={styles.statLabel}>Remaining Limit</Text>
          </View>

          <View style={[styles.statCard, styles.overdueCard]}>
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              size={24}
              color='#FF3B30'
            />
            <Text style={styles.statNumber}>{stats.total_overdue}</Text>
            <Text style={styles.statLabel}>Overdue Books</Text>
          </View>
        </View>

        {/* Borrowing Rate */}
        <View style={styles.borrowingRateCard}>
          <Text style={styles.borrowingRateLabel}>Borrowing Rate</Text>
          <Text style={styles.borrowingRateValue}>{stats.borrowing_rate}%</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${stats.borrowing_rate}%` },
              ]}
            />
          </View>
          <Text style={styles.borrowingRateSubtext}>
            {stats.total_borrowed_this_year} books borrowed this year
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => setSelectedTab('borrowed')}
            >
              <FontAwesomeIcon icon={faBookOpen} size={20} color='#007AFF' />
              <Text style={styles.quickActionText}>View Borrowed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => setSelectedTab('history')}
            >
              <FontAwesomeIcon icon={faClock} size={20} color='#8E8E93' />
              <Text style={styles.quickActionText}>View History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => setSelectedTab('available')}
            >
              <FontAwesomeIcon icon={faBook} size={20} color='#34C759' />
              <Text style={styles.quickActionText}>Browse Books</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Render borrowed books
  const renderBorrowedBooks = () => {
    const borrowedBooks = [
      ...(libraryData?.currently_borrowed || []),
      ...(libraryData?.overdue_books || []),
    ];

    if (borrowedBooks.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesomeIcon icon={faBookOpen} size={48} color='#ccc' />
          <Text style={styles.emptyText}>No borrowed books</Text>
          <Text style={styles.emptySubtext}>
            You haven't borrowed any books yet
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        {borrowedBooks.map((book, index) => (
          <View key={index} style={styles.bookCard}>
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>
                {book.title || 'Unknown Title'}
              </Text>
              <Text style={styles.bookAuthor}>
                {renderAuthorName(book.author_name || book.author) ||
                  'Unknown Author'}
              </Text>
              <Text style={styles.bookAuthor}>
                Category: {book.category_name || 'Unknown Category'}
              </Text>
              <Text style={styles.bookISBN}>ISBN: {book.isbn || 'N/A'}</Text>

              <View style={styles.bookDates}>
                <View style={styles.dateItem}>
                  <FontAwesomeIcon
                    icon={faCalendarAlt}
                    size={12}
                    color='#8E8E93'
                  />
                  <Text style={styles.dateText}>
                    Borrowed: {formatDate(book.issue_date)}
                  </Text>
                </View>
                <View style={styles.dateItem}>
                  <FontAwesomeIcon icon={faClock} size={12} color='#8E8E93' />
                  <Text style={styles.dateText}>
                    Due: {formatDate(book.should_return_date)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bookStatus}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(book.status) },
                ]}
              >
                <FontAwesomeIcon
                  icon={getStatusIcon(book.status)}
                  size={12}
                  color='#fff'
                />
                <Text style={styles.statusText}>
                  {book.status || 'Borrowed'}
                </Text>
              </View>

              {book.status === 'overdue' && (
                <Text style={styles.overdueText}>
                  {getDaysOverdue(book.due_date)} days overdue
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  // Render library history
  const renderHistory = () => {
    const history = libraryData?.library_history || [];

    if (history.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesomeIcon icon={faClock} size={48} color='#ccc' />
          <Text style={styles.emptyText}>No library history</Text>
          <Text style={styles.emptySubtext}>
            Your borrowing history will appear here
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        {history.map((record, index) => (
          <View key={index} style={styles.historyCard}>
            <View style={styles.historyInfo}>
              <Text style={styles.historyTitle}>
                {record.title || 'Unknown Title'}
              </Text>
              <Text style={styles.historyAuthor}>
                {renderAuthorName(record.author_name || record.author) ||
                  'Unknown Author'}
              </Text>
              {/* category */}
              <Text style={styles.historyAuthor}>
                Category: {record.category_name || 'Unknown Category'}
              </Text>

              <View style={styles.historyDates}>
                <Text style={styles.historyDate}>
                  Borrowed: {formatDate(record.issue_date)}
                </Text>
                <Text style={styles.historyDate}>
                  Returned: {formatDate(record.return_date)}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.historyStatus,
                { backgroundColor: getStatusColor(record.status) },
              ]}
            >
              <FontAwesomeIcon
                icon={getStatusIcon(record.status)}
                size={12}
                color='#fff'
              />
              <Text style={styles.historyStatusText}>
                {getStatusLabel(record.status) || 'Returned'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  // Render available books
  const renderAvailableBooks = () => {
    const availableBooks = libraryData?.available_books || [];

    if (availableBooks.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesomeIcon icon={faBook} size={48} color='#ccc' />
          <Text style={styles.emptyText}>No available books</Text>
          <Text style={styles.emptySubtext}>
            Check back later for new arrivals
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        {availableBooks.map((book, index) => (
          <View key={index} style={styles.availableBookCard}>
            <View style={styles.availableBookInfo}>
              <Text style={styles.availableBookTitle}>
                {book.title || 'Unknown Title'}
              </Text>
              <Text style={styles.availableBookAuthor}>
                Author:{' '}
                {renderAuthorName(book.author_name || book.author) ||
                  'Unknown Author'}
              </Text>
              {/* book category */}
              <Text style={styles.availableBookAuthor}>
                Category: {book.category_name || 'Unknown Category'}
              </Text>
              <Text style={styles.availableBookISBN}>
                ISBN: {book.isbn || 'N/A'}
              </Text>

              {book.description && (
                <Text style={styles.availableBookDescription} numberOfLines={2}>
                  {book.description}
                </Text>
              )}
            </View>

            <View style={styles.availableBookActions}>
              <View style={styles.availabilityBadge}>
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  size={12}
                  color='#34C759'
                />
                <Text style={styles.availabilityText}>Available</Text>
              </View>

              <TouchableOpacity style={styles.borrowButton}>
                <Text style={styles.borrowButtonText}>Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  if (loading && !libraryData) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.compactHeaderContainer}>
          {/* Navigation Header */}
          <View style={styles.navigationHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Library</Text>

            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading library data...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

          <Text style={styles.headerTitle}>Library</Text>

          <View style={styles.headerRight} />
        </View>

        {/* Tab Navigation Subheader */}
        <View style={styles.subHeader}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {renderTabButton('overview', t('overview'), faBook)}
            {renderTabButton('borrowed', t('borrowed'), faBookOpen)}
            {renderTabButton('history', t('history'), faClock)}
            {renderTabButton('available', t('available'), faCheckCircle)}
          </ScrollView>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {selectedTab === 'overview' && renderOverview()}
          {selectedTab === 'borrowed' && renderBorrowedBooks()}
          {selectedTab === 'history' && renderHistory()}
          {selectedTab === 'available' && renderAvailableBooks()}
        </ScrollView>
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
    // Legacy header style (keeping for compatibility)
    header: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
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
    headerTitle: {
      color: '#fff',
      fontSize: 22,
      fontWeight: 'bold',
      marginLeft: 20,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 10,
    },

    // Tab Navigation (now integrated in subheader)
    tabContainer: {
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tabScrollContent: {
      paddingHorizontal: 8,
      paddingVertical: 12,
    },
    tabButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginHorizontal: 4,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    activeTabButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
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
      marginLeft: 6,
    },
    activeTabButtonText: {
      color: '#fff',
      fontWeight: '600',
    },

    // Content
    content: {
      flex: 1,
    },
    scrollContainer: {
      flex: 1,
    },
    tabContent: {
      flex: 1,
      padding: 20,
    },

    // Empty States
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      marginTop: 20,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },

    // Student Card
    studentCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      ...theme.shadows.medium,
    },
    studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    studentPhoto: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginRight: 15,
    },
    studentPhotoPlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    studentDetails: {
      flex: 1,
    },
    studentName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    studentId: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },

    // Statistics Grid
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    statCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      width: '48%',
      marginBottom: 12,
      alignItems: 'center',
      ...createSmallShadow(theme),
    },
    borrowingLimitCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#007AFF',
    },
    currentlyBorrowedCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#FF9500',
    },
    remainingLimitCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#34C759',
    },
    overdueCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#FF3B30',
    },
    statNumber: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginVertical: 8,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontWeight: '600',
    },

    // Borrowing Rate Card
    borrowingRateCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      alignItems: 'center',
      ...theme.shadows.medium,
    },
    borrowingRateLabel: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 10,
    },
    borrowingRateValue: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#34C759',
      marginBottom: 15,
    },
    progressBar: {
      width: '100%',
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 10,
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#34C759',
      borderRadius: 4,
    },
    borrowingRateSubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },

    // Quick Actions
    quickActionsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      ...createMediumShadow(theme),
    },
    quickActionsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    quickActionButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      marginHorizontal: 4,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    quickActionText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 6,
      fontWeight: '600',
    },

    // Book Cards
    bookCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      ...theme.shadows.small,
    },
    bookInfo: {
      flex: 1,
      marginRight: 12,
    },
    bookTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    bookAuthor: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    bookISBN: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    bookDates: {
      marginTop: 8,
    },
    dateItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    dateText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: 6,
    },
    bookStatus: {
      alignItems: 'flex-end',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 4,
    },
    statusText: {
      fontSize: 12,
      color: '#fff',
      fontWeight: '600',
      marginLeft: 4,
    },
    overdueText: {
      fontSize: 10,
      color: '#FF3B30',
      fontWeight: '600',
    },

    // History Cards
    historyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      ...theme.shadows.small,
    },
    historyInfo: {
      flex: 1,
      marginRight: 12,
    },
    historyTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    historyAuthor: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    historyDates: {
      marginTop: 4,
    },
    historyDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    historyStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 14,
      height: 28,
    },
    historyStatusText: {
      fontSize: 12,
      color: '#fff',
      fontWeight: '600',
      marginLeft: 4,
    },

    // Available Books
    availableBookCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      ...theme.shadows.small,
    },
    availableBookInfo: {
      marginBottom: 12,
    },
    availableBookTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    availableBookAuthor: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    availableBookISBN: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    availableBookDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    availableBookActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    availabilityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: 'rgba(52, 199, 89, 0.1)',
      borderRadius: 12,
    },
    availabilityText: {
      fontSize: 12,
      color: '#34C759',
      fontWeight: '600',
      marginLeft: 4,
    },
    borrowButton: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
    },
    borrowButtonText: {
      fontSize: 14,
      color: '#fff',
      fontWeight: '600',
    },
  });
