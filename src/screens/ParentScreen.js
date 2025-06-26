import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Config } from '../config/env';
import {
  faPlus,
  faChild,
  faArrowLeft,
  faTrash,
  faBook,
  faCalendarAlt,
  faChartLine,
  faClipboardCheck,
  faComments,
  faGavel,
  faBell,
  faBookOpen,
  faFileAlt,
  faHeartbeat,
} from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useParentNotifications } from '../hooks/useParentNotifications';
import ParentNotificationBadge from '../components/ParentNotificationBadge';
import { QuickActionTile, ComingSoonBadge } from '../components';
import { isIPad, isTablet } from '../utils/deviceDetection';
import { useFocusEffect } from '@react-navigation/native';
import { createCustomShadow, createMediumShadow } from '../utils/commonStyles';
import { validateComplianceForAccess } from '../services/familiesPolicyService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Menu items configuration
const getMenuItems = (t) => [
  {
    id: 'grades',
    title: t('grades'),
    icon: faChartLine,
    backgroundColor: '#FF9500',
    iconColor: '#fff',
    action: 'grades',
  },
  {
    id: 'attendance',
    title: t('attendance'),
    icon: faClipboardCheck,
    backgroundColor: '#34C759',
    iconColor: '#fff',
    action: 'attendance',
  },
  {
    id: 'assignments',
    title: t('assignments'),
    icon: faBook,
    backgroundColor: '#007AFF',
    iconColor: '#fff',
    action: 'assignments',
  },
  {
    id: 'schedule',
    title: t('timetable'),
    icon: faCalendarAlt,
    backgroundColor: '#AF52DE',
    iconColor: '#fff',
    action: 'schedule',
  },
  {
    id: 'discipline',
    title: t('behavior'),
    icon: faGavel,
    backgroundColor: '#5856D6',
    iconColor: '#fff',
    action: 'discipline',
  },
  {
    id: 'library',
    title: 'Library',
    icon: faBookOpen,
    backgroundColor: '#FF6B35',
    iconColor: '#fff',
    action: 'library',
  },
  {
    id: 'messages',
    title: 'Messages',
    icon: faComments,
    backgroundColor: '#007AFF',
    iconColor: '#fff',
    disabled: true,
    action: 'messages',
    comingSoon: true,
  },
  {
    id: 'materials',
    title: 'Materials',
    icon: faFileAlt,
    backgroundColor: '#B0B0B0',
    iconColor: '#fff',
    action: 'materials',
    disabled: true,
    comingSoon: true,
  },
  // Health
  {
    id: 'health',
    title: 'Health',
    icon: faHeartbeat,
    backgroundColor: '#FF3B30',
    iconColor: '#fff',
    action: 'health',
    disabled: true,
    comingSoon: true,
  },
];

export default function ParentScreen({ navigation }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);

  // Device and orientation detection
  const isIPadDevice = isIPad();
  const isTabletDevice = isTablet();
  const isLandscape = screenWidth > screenHeight;

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const flatListRef = React.useRef(null);
  const notificationsLoadedRef = React.useRef(new Set());

  // Parent notifications hook
  const { selectStudent, refreshAllStudents } = useParentNotifications();

  const styles = createStyles(theme, fontSizes);

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if we have students and they haven't been loaded recently
      if (students.length > 0) {
        const studentIds = students
          .map((s) => s.id)
          .sort()
          .join(',');
        if (!notificationsLoadedRef.current.has(studentIds)) {
          // Add a small delay to prevent immediate execution
          const timeoutId = setTimeout(() => {
            refreshAllStudents(students);
          }, 500);

          return () => clearTimeout(timeoutId);
        }
      }
    }, [students, refreshAllStudents])
  );

  useEffect(() => {
    // Load saved student accounts
    loadStudents();

    // Add listener for when we come back from adding a student
    const unsubscribe = navigation.addListener('focus', () => {
      loadStudents();
    });

    return unsubscribe;
  }, [navigation]);

  // Restore selected student when students are loaded
  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      restoreSelectedStudent();
    }
  }, [students, selectedStudent, restoreSelectedStudent]);

  // Load notifications when students are loaded (only once per student set)
  useEffect(() => {
    if (students.length > 0) {
      // Create a unique key for this set of students
      const studentIds = students
        .map((s) => s.id)
        .sort()
        .join(',');

      // Only load if we haven't loaded for this exact set of students
      if (!notificationsLoadedRef.current.has(studentIds)) {
        notificationsLoadedRef.current.add(studentIds);
        // Use a timeout to prevent immediate execution during render
        const timeoutId = setTimeout(() => {
          refreshAllStudents(students);
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [students, refreshAllStudents]);

  const handleAddStudent = () => {
    // Navigate to login screen with student type
    navigation.navigate('Login', {
      loginType: 'student',
      isAddingStudent: true, // Flag to indicate we're adding a student account
    });
  };

  const handleStudentPress = async (student) => {
    // Set the selected student
    setSelectedStudent(student);

    // Save selected student to AsyncStorage for persistence
    try {
      await AsyncStorage.setItem('selectedStudentId', student.id.toString());
    } catch (error) {
      console.error('Error saving selected student:', error);
    }

    // Also select student for notifications
    selectStudent(student);
  };

  const handleMenuItemPress = async (action) => {
    if (!selectedStudent) {
      Alert.alert(t('noStudentSelected'), t('pleaseSelectStudent'));
      return;
    }

    // Check if student has an authCode
    if (!selectedStudent.authCode) {
      Alert.alert(t('authenticationError'), t('unableToAuthenticate'));
      return;
    }

    // Check families policy compliance for student
    try {
      const isCompliant = await validateComplianceForAccess(selectedStudent.id);
      if (!isCompliant) {
        Alert.alert(
          t('parentalConsentRequired'),
          'This student account requires additional verification. Please contact support.',
          [{ text: t('ok') }]
        );
        return;
      }
    } catch (error) {
      console.error('Compliance check error:', error);
      // Continue with normal flow if compliance check fails
    }

    // Handle different menu actions
    switch (action) {
      case 'grades':
        navigation.navigate('GradesScreen', {
          studentName: selectedStudent.name,
          authCode: selectedStudent.authCode,
        });
        break;
      case 'attendance':
        navigation.navigate('AttendanceScreen', {
          studentName: selectedStudent.name,
          authCode: selectedStudent.authCode,
        });
        break;
      case 'assignments':
        navigation.navigate('AssignmentsScreen', {
          studentName: selectedStudent.name,
          authCode: selectedStudent.authCode,
        });
        break;
      case 'schedule':
        navigation.navigate('TimetableScreen', {
          studentName: selectedStudent.name,
          authCode: selectedStudent.authCode,
        });
        break;
      case 'discipline':
        navigation.navigate('BehaviorScreen', {
          studentName: selectedStudent.name,
          authCode: selectedStudent.authCode,
        });
        break;
      case 'messages':
        navigation.navigate('StudentMessagingScreen', {
          authCode: selectedStudent.authCode,
          studentName: selectedStudent.name,
        });
        break;
      case 'library':
        navigation.navigate('LibraryScreen', {
          studentName: selectedStudent.name,
          authCode: selectedStudent.authCode,
        });
        break;
      default:
        break;
    }
  };

  // Extract loadStudents function to make it reusable
  const loadStudents = React.useCallback(async () => {
    try {
      const savedStudents = await AsyncStorage.getItem('studentAccounts');
      if (savedStudents) {
        setStudents(JSON.parse(savedStudents));
      }
    } catch (error) {
      // Handle error silently
      console.error('Error loading student accounts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Restore the previously selected student
  const restoreSelectedStudent = React.useCallback(async () => {
    try {
      const savedSelectedStudentId = await AsyncStorage.getItem(
        'selectedStudentId'
      );
      if (savedSelectedStudentId && students.length > 0) {
        const student = students.find(
          (s) => s.id.toString() === savedSelectedStudentId
        );
        if (student) {
          setSelectedStudent(student);
          // Don't call selectStudent here to avoid triggering notifications loading
          // selectStudent(student);
        }
      }
    } catch (error) {
      console.error('Error restoring selected student:', error);
    }
  }, [students]);

  const handleDeleteStudent = (studentToDelete) => {
    Alert.alert(
      t('deleteStudent'),
      `${t('areYouSure')} ${studentToDelete.name || t('student')}?`,
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove from state first for immediate UI update
              const updatedStudents = students.filter(
                (s) => s.id !== studentToDelete.id
              );
              setStudents(updatedStudents);

              // If the deleted student was selected, clear selection
              if (
                selectedStudent &&
                selectedStudent.id === studentToDelete.id
              ) {
                setSelectedStudent(null);
                // Also clear from AsyncStorage
                await AsyncStorage.removeItem('selectedStudentId');
              }

              // Update AsyncStorage
              await AsyncStorage.setItem(
                'studentAccounts',
                JSON.stringify(updatedStudents)
              );

              // Show success message
              Alert.alert(t('success'), t('studentRemoved'));
            } catch (error) {
              Alert.alert(t('error'), t('failedToRemove'));

              // Reload the original list if there was an error
              console.error('Error removing student:', error);
              loadStudents();
            }
          },
        },
      ]
    );
  };

  const renderStudentItem = ({ item }) => {
    const isSelected = selectedStudent && selectedStudent.id === item.id;

    return (
      <View style={styles.studentTileContainer}>
        <TouchableOpacity
          style={[styles.studentTile, isSelected && styles.selectedStudentTile]}
          onPress={() => handleStudentPress(item)}
        >
          {item.photo ? (
            <Image
              source={{ uri: item.photo }}
              style={[
                styles.studentPhoto,
                isSelected && styles.selectedStudentPhoto,
              ]}
              resizeMode='cover'
            />
          ) : (
            <View
              style={[
                styles.studentIconContainer,
                isSelected && styles.selectedStudentIcon,
              ]}
            >
              <FontAwesomeIcon icon={faChild} size={30} color='#fff' />
            </View>
          )}
          <Text
            style={[
              styles.studentName,
              isSelected && styles.selectedStudentText,
            ]}
          >
            {item.name || 'Student'}
          </Text>
          <Text style={styles.studentDetails}>ID: {item.id || 'N/A'}</Text>

          {isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>{t('selected')}</Text>
            </View>
          )}
        </TouchableOpacity>

        {isSelected && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteStudent(item)}
          >
            <FontAwesomeIcon icon={faTrash} size={16} color='#FF3B30' />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>{t('noStudentAccounts')}</Text>
        <Text style={styles.emptySubtext}>{t('tapToAdd')}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('parentDashboard')}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() =>
              navigation.navigate('NotificationScreen', { userType: 'parent' })
            }
          >
            <FontAwesomeIcon icon={faBell} size={18} color='#fff' />
            <ParentNotificationBadge />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAddStudent}>
            <FontAwesomeIcon icon={faPlus} size={18} color='#fff' />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.childrenSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('yourChildren')}</Text>
            {students.length > 0 && (
              <TouchableOpacity
                style={styles.scrollIndicator}
                onPress={() => {
                  if (students.length > 1 && flatListRef.current) {
                    // Scroll to the next item
                    const currentIndex = selectedStudent
                      ? students.findIndex((s) => s.id === selectedStudent.id)
                      : 0;
                    const nextIndex = (currentIndex + 1) % students.length;
                    flatListRef.current.scrollToIndex({
                      index: nextIndex,
                      animated: true,
                    });
                  }
                }}
              >
                <Text style={styles.scrollIndicatorText}>
                  {students.length > 1 ? t('scrollForMore') : t('yourChild')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading student accounts...</Text>
            </View>
          ) : students.length === 0 ? (
            <EmptyListComponent />
          ) : (
            <FlatList
              ref={flatListRef}
              data={students}
              renderItem={renderStudentItem}
              keyExtractor={(_, index) => `student-${index}`}
              contentContainerStyle={styles.listContainer}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              snapToAlignment='start'
              decelerationRate='fast'
              snapToInterval={176} // Width of tile (160) + margin (16)
              onScrollToIndexFailed={(info) => {
                // Handle the failure by scrolling to a nearby item
                setTimeout(() => {
                  if (flatListRef.current && students.length > 0) {
                    flatListRef.current.scrollToIndex({
                      index: Math.min(
                        info.highestMeasuredFrameIndex,
                        students.length - 1
                      ),
                      animated: true,
                    });
                  }
                }, 100);
              }}
            />
          )}
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{t('menu')}</Text>

          <ScrollView
            style={styles.menuScrollView}
            contentContainerStyle={[
              styles.actionTilesGrid,
              isIPadDevice && styles.iPadActionTilesGrid,
              isIPadDevice &&
                isLandscape &&
                styles.iPadLandscapeActionTilesGrid,
              isTabletDevice && styles.tabletActionTilesGrid,
              isTabletDevice &&
                isLandscape &&
                styles.tabletLandscapeActionTilesGrid,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {getMenuItems(t).map((item) => (
              <QuickActionTile
                key={item.id}
                title={item.title}
                subtitle='' // Parent menu items don't have subtitles
                icon={item.icon}
                backgroundColor={item.backgroundColor}
                iconColor={item.iconColor}
                onPress={
                  item.disabled
                    ? undefined
                    : () => handleMenuItemPress(item.action)
                }
                disabled={item.disabled}
                badge={
                  item.comingSoon ? (
                    <ComingSoonBadge
                      text='Soon'
                      theme={theme}
                      fontSizes={fontSizes}
                    />
                  ) : undefined
                }
                styles={styles}
                isLandscape={isLandscape}
              />
            ))}
          </ScrollView>
        </View>
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
    header: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
      marginRight: 10,
    },
    headerTitle: {
      color: theme.colors.headerText,
      fontSize: fontSizes.headerTitle,
      fontWeight: 'bold',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    notificationButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // No longer needed with FontAwesome icon
    content: {
      flex: 1,
      padding: 20,
    },
    childrenSection: {
      marginBottom: 5,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    scrollIndicator: {
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.primary + '50',
    },
    scrollIndicatorText: {
      color: theme.colors.primary,
      fontSize: fontSizes.caption,
      fontWeight: '600',
    },
    menuSection: {
      flex: 1,
    },
    menuScrollView: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: '600',
      marginBottom: 20,
      color: theme.colors.text,
    },
    listContainer: {
      paddingBottom: 20,
      paddingLeft: 12,
      paddingRight: 40,
    },
    studentTileContainer: {
      position: 'relative',
      margin: 8,
      width: 160,
      height: 180,
    },
    studentTile: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 15,
      width: '100%',
      height: '100%',
      alignItems: 'center',
      // Platform-specific shadow
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.08,
        radius: 3,
        elevation: 1,
      }),
      borderWidth: 2,
      borderColor: 'transparent',
      position: 'relative',
      overflow: 'hidden',
    },
    deleteButton: {
      position: 'absolute',
      top: 5,
      right: 5,
      backgroundColor: theme.colors.surface,
      width: 30,
      height: 30,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      // Platform-specific shadow
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.08,
        radius: 3,
        elevation: 1,
      }),
    },
    selectedStudentTile: {
      borderColor: theme.colors.primary,
      // Platform-specific background: semi-transparent on iOS, clean on Android
      backgroundColor:
        Platform.OS === 'ios'
          ? theme.colors.primary + '0D'
          : theme.colors.surface,
      // Add a subtle inner glow effect for Android
      ...(Platform.OS === 'android' && {
        elevation: 3,
      }),
      // iOS-specific glow effect
      ...(Platform.OS === 'ios' && {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      }),
    },
    selectedStudentIcon: {
      backgroundColor: theme.colors.primary,
    },
    selectedStudentText: {
      color: theme.colors.primary,
    },
    selectedBadge: {
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 10,
    },
    selectedBadgeText: {
      color: '#fff',
      fontSize: fontSizes.badgeText,
      fontWeight: 'bold',
    },
    studentIconContainer: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
    },
    studentPhoto: {
      width: 90,
      height: 90,
      borderRadius: 50,
      marginTop: 5,
      marginBottom: 15,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedStudentPhoto: {
      borderColor: theme.colors.primary,
    },
    // No longer needed with FontAwesome icon
    studentName: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    studentDetails: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
      textAlign: 'center',
    },
    emptyContainer: {
      width: '100%',
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    emptyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      // Platform-specific shadow
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.08,
        radius: 3,
        elevation: 1,
      }),
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 10,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Quick Actions - Tile Layout (3 per row on mobile)
    actionTilesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start', // Better distribution for 3 tiles per row
      gap: 8, // Smaller gap for 3-per-row layout
      paddingBottom: 20, // Add padding for scrollable content
    },
    // iPad-specific grid layout - 4 tiles per row, wraps to next row for additional tiles
    iPadActionTilesGrid: {
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: 8,
    },
    // Tablet-specific grid layout - 4 tiles per row, wraps to next row for additional tiles
    tabletActionTilesGrid: {
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: 10,
    },
    // iPad landscape-specific grid layout - 6 tiles per row, wraps for additional tiles
    iPadLandscapeActionTilesGrid: {
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 6,
    },
    // Tablet landscape-specific grid layout - 6 tiles per row, wraps for additional tiles
    tabletLandscapeActionTilesGrid: {
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 8,
    },
    actionTile: {
      width: (screenWidth - 64) / 3, // 3 tiles per row on mobile with margins and gap
      aspectRatio: 1, // Square tiles
      borderRadius: 20, // Slightly smaller border radius for smaller tiles
      padding: 14, // Reduced padding for smaller tiles
      justifyContent: 'center', // Center content vertically for better balance
      alignItems: 'center', // Center content horizontally for smaller tiles
      position: 'relative',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      ...createMediumShadow(theme),
    },
    // iPad-specific action tile - optimized for 4 per row, wraps for additional tiles
    iPadActionTile: {
      width: (screenWidth - 80) / 4 - 2, // Optimized for 4 tiles per row with wrapping support
      minWidth: 160, // Minimum width to ensure tiles don't get too small
      aspectRatio: 1, // Square tiles
      borderRadius: 16,
      padding: 12,
      ...createCustomShadow(theme, {
        height: 3,
        opacity: 0.15,
        radius: 8,
        elevation: 4,
      }),
    },
    // Tablet-specific action tile - optimized for 4 per row, wraps for additional tiles
    tabletActionTile: {
      width: (screenWidth - 70) / 4 - 2, // Optimized for 4 tiles per row with wrapping support
      minWidth: 150, // Minimum width to ensure tiles don't get too small
      aspectRatio: 1, // Square tiles
      borderRadius: 18,
      padding: 14,
      ...createCustomShadow(theme, {
        height: 4,
        opacity: 0.18,
        radius: 10,
        elevation: 6,
      }),
    },
    // iPad landscape-specific action tile - optimized for 6 per row
    iPadLandscapeActionTile: {
      width: (screenWidth - 100) / 6 - 2, // 6 tiles per row in landscape with wrapping support
      minWidth: 120, // Minimum width for landscape tiles
      aspectRatio: 1, // Square tiles
      borderRadius: 14,
      padding: 10,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.12,
        radius: 6,
        elevation: 3,
      }),
    },
    // Tablet landscape-specific action tile - optimized for 6 per row
    tabletLandscapeActionTile: {
      width: (screenWidth - 90) / 6 - 2, // 6 tiles per row in landscape with wrapping support
      minWidth: 110, // Minimum width for landscape tiles
      aspectRatio: 1, // Square tiles
      borderRadius: 16,
      padding: 12,
      ...createCustomShadow(theme, {
        height: 3,
        opacity: 0.15,
        radius: 8,
        elevation: 4,
      }),
    },
    disabledTile: {
      opacity: 0.7,
    },
    tileIconContainer: {
      width: 44, // Smaller icon container for 3-per-row layout
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 5, // Reduced margin for smaller tiles
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      marginTop: 20,
    },
    tileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 5, 10), // Smaller font for 3-per-row layout
      fontWeight: '700',
      color: '#fff',
      marginBottom: 3, // Reduced margin
      letterSpacing: 0.2,
      textAlign: 'center', // Center text for better balance in smaller tiles
    },
    tileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 1, 10), // Smaller subtitle font
      color: 'rgba(255, 255, 255, 0.8)',
      fontWeight: '500',
      marginBottom: 6, // Reduced margin
      textAlign: 'center', // Center text for better balance
    },
    // iPad-specific tile text styles - smaller
    iPadTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 2, 12),
      marginBottom: 2,
    },
    iPadTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 1, 10),
      marginBottom: 4,
    },
    // Tablet-specific tile text styles
    tabletTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 1, 13),
      marginBottom: 3,
    },
    tabletTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 0.5, 11),
      marginBottom: 6,
    },
    // iPad landscape-specific tile text styles - even smaller for 6 per row
    iPadLandscapeTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 3, 10),
      marginBottom: 1,
    },
    iPadLandscapeTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 2, 8),
      marginBottom: 2,
    },
    // Tablet landscape-specific tile text styles
    tabletLandscapeTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 2, 11),
      marginBottom: 2,
    },
    tabletLandscapeTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 1.5, 9),
      marginBottom: 3,
    },
    // iPad-specific tile icon container - smaller
    iPadTileIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginBottom: 8,
    },
    // Tablet-specific tile icon container
    tabletTileIconContainer: {
      width: 42,
      height: 42,
      borderRadius: 21,
      marginBottom: 10,
    },
    // iPad landscape-specific tile icon container - even smaller for 6 per row
    iPadLandscapeTileIconContainer: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginBottom: 6,
    },
    // Tablet landscape-specific tile icon container
    tabletLandscapeTileIconContainer: {
      width: 34,
      height: 34,
      borderRadius: 17,
      marginBottom: 8,
    },
    menuItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 15,
      width: '48%',
      aspectRatio: 1, // Square items
      alignItems: 'center',
      justifyContent: 'center', // Center content vertically
      // Platform-specific shadow
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.08,
        radius: 3,
        elevation: 1,
      }),
    },
    // iPad-specific menu item - optimized for 4 per row, wraps for additional items
    iPadMenuItem: {
      width: (screenWidth - 80) / 4 - 2, // Optimized for 4 items per row with wrapping support
      minWidth: 160, // Minimum width to ensure items don't get too small
      aspectRatio: 1, // Square items
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.06,
        radius: 4,
        elevation: 2,
      }),
    },
    // Tablet-specific menu item - optimized for 4 per row, wraps for additional items
    tabletMenuItem: {
      width: (screenWidth - 70) / 4 - 2, // Optimized for 4 items per row with wrapping support
      minWidth: 150, // Minimum width to ensure items don't get too small
      aspectRatio: 1, // Square items
      borderRadius: 11,
      padding: 13,
      marginBottom: 13,
      ...createCustomShadow(theme, {
        height: 1.5,
        opacity: 0.07,
        radius: 3.5,
        elevation: 1.5,
      }),
    },
    // iPad landscape-specific menu item - optimized for 6 per row
    iPadLandscapeMenuItem: {
      width: (screenWidth - 100) / 6 - 2, // 6 items per row in landscape with wrapping support
      minWidth: 120, // Minimum width for landscape items
      aspectRatio: 1, // Square items
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.05,
        radius: 3,
        elevation: 1,
      }),
    },
    // Tablet landscape-specific menu item - optimized for 6 per row
    tabletLandscapeMenuItem: {
      width: (screenWidth - 90) / 6 - 2, // 6 items per row in landscape with wrapping support
      minWidth: 110, // Minimum width for landscape items
      aspectRatio: 1, // Square items
      borderRadius: 9,
      padding: 11,
      marginBottom: 11,
      ...createCustomShadow(theme, {
        height: 1.2,
        opacity: 0.06,
        radius: 3.2,
        elevation: 1.2,
      }),
    },
    menuIconContainer: {
      width: 45,
      height: 45,
      borderRadius: 22.5,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    // iPad-specific menu icon container - smaller
    iPadMenuIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginBottom: 8,
    },
    // Tablet-specific menu icon container
    tabletMenuIconContainer: {
      width: 45,
      height: 45,
      borderRadius: 22.5,
      marginBottom: 9,
    },
    // iPad landscape-specific menu icon container - even smaller for 6 per row
    iPadLandscapeMenuIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginBottom: 6,
    },
    // Tablet landscape-specific menu icon container
    tabletLandscapeMenuIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginBottom: 7,
    },
    menuItemText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: 16,
    },
    // iPad-specific menu item text - smaller
    iPadMenuItemText: {
      fontSize: Math.max(fontSizes.bodySmall - 2, 11),
      marginBottom: 2,
    },
    // Tablet-specific menu item text
    tabletMenuItemText: {
      fontSize: Math.max(fontSizes.bodySmall - 1, 12),
      marginBottom: 3,
    },
    // iPad landscape-specific menu item text - even smaller for 6 per row
    iPadLandscapeMenuItemText: {
      fontSize: Math.max(fontSizes.bodySmall - 3, 9),
      marginBottom: 1,
    },
    // Tablet landscape-specific menu item text
    tabletLandscapeMenuItemText: {
      fontSize: Math.max(fontSizes.bodySmall - 2, 10),
      marginBottom: 2,
    },
    disabledMenuItem: {
      opacity: 0.6,
      backgroundColor: theme.colors.disabled,
    },
    disabledMenuText: {
      color: theme.colors.textSecondary,
    },
    comingSoonBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: '#FF9500',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    comingSoonText: {
      color: '#fff',
      fontSize: 3,
      fontWeight: 'bold',
    },
  });
