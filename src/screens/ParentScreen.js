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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  getResponsiveHeaderFontSize,
  createCustomShadow,
  createMediumShadow,
} from '../utils/commonStyles';

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
  faScaleBalanced,
  faBell,
  faBookOpen,
  faFileAlt,
  faHeartbeat,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useParentNotifications } from '../hooks/useParentNotifications';
import ParentNotificationBadge from '../components/ParentNotificationBadge';
import MessageBadge from '../components/MessageBadge';
import { QuickActionTile, ComingSoonBadge } from '../components';
import { cleanupStudentData } from '../services/logoutService';
import { isIPad, isTablet } from '../utils/deviceDetection';
import DemoModeIndicator from '../components/DemoModeIndicator';
import { updateLastLogin } from '../services/deviceService';

import { useFocusEffect } from '@react-navigation/native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Menu items configuration
const getMenuItems = (t) => [
  {
    id: 'assessments',
    title: t('assessments'),
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
    title: t('homework'),
    icon: faBook,
    backgroundColor: '#007AFF',
    iconColor: '#fff',
    action: 'assignments',
  },
  {
    id: 'schedule',
    title: t('timetable'),
    icon: faClock,
    backgroundColor: '#AF52DE',
    iconColor: '#fff',
    action: 'schedule',
  },
  {
    id: 'calendar',
    title: t('calendar'),
    icon: faCalendarAlt,
    backgroundColor: '#5856D6',
    iconColor: '#fff',
    action: 'calendar',
  },
  {
    id: 'discipline',
    title: t('behavior'),
    icon: faScaleBalanced,
    backgroundColor: '#5856D6',
    iconColor: '#fff',
    action: 'discipline',
  },
  {
    id: 'library',
    title: t('library'),
    icon: faBookOpen,
    backgroundColor: '#FF6B35',
    iconColor: '#fff',
    action: 'library',
  },
  // Health
  {
    id: 'health',
    title: t('health'),
    icon: faHeartbeat,
    backgroundColor: '#028090',
    iconColor: '#fff',
    action: 'health',
    disabled: false,
    comingSoon: false,
  },
  // Messaging
  {
    id: 'messages',
    title: t('messages'),
    icon: faComments,
    backgroundColor: '#d90429',
    iconColor: '#fff',
    disabled: false,
    action: 'messages',
    comingSoon: false,
  },
  {
    id: 'materials',
    title: t('materials'),
    icon: faFileAlt,
    backgroundColor: '#4CAF50',
    iconColor: '#fff',
    action: 'materials',
    disabled: false,
    comingSoon: false,
  },
  // {
  //   id: 'reports',
  //   title: t('reports'),
  //   icon: faChartLine,
  //   backgroundColor: '#3498db',
  //   iconColor: '#fff',
  //   action: 'reports',
  //   disabled: false,
  //   comingSoon: false,
  // },
  
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
  const [currentUserData, setCurrentUserData] = useState(null);
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
      await AsyncStorage.setItem('selectedStudent', JSON.stringify(student));
    } catch (error) {
      console.error('Error saving selected student:', error);
    }

    // Update last login timestamp when student is selected/starts using the app
    console.log('⏰ PARENT: Updating last login for selected student...');
    try {
      const authCode = student.authCode || student.auth_code;
      if (authCode) {
        const updateResult = await updateLastLogin(authCode);
        if (updateResult.success) {
          console.log(
            '✅ PARENT: Last login updated successfully for student:',
            student.name
          );
        } else {
          console.warn(
            '⚠️ PARENT: Failed to update last login for student:',
            updateResult.error
          );
          // Continue with selection even if update fails
        }
      } else {
        console.warn(
          '⚠️ PARENT: No auth code found for student:',
          student.name
        );
      }
    } catch (updateError) {
      console.error(
        '❌ PARENT: Error updating last login for student:',
        updateError
      );
      // Continue with selection even if update fails
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
      case 'health':
        navigation.navigate('StudentHealthScreen', {
          studentName: selectedStudent.name,
          authCode: selectedStudent.authCode,
        });
        break;
      case 'calendar':
        // Save selected student as temporary calendar user data (don't overwrite main userData)
        try {
          await AsyncStorage.setItem(
            'calendarUserData',
            JSON.stringify(selectedStudent)
          );
          // Navigate to combined calendar from parent screen (includes personal events)
          navigation.navigate('UserCalendar', { mode: 'combined' });
        } catch (error) {
          console.error('Error saving student data for calendar:', error);
          Alert.alert(t('error'), t('failedToAccessCalendar'));
        }
        break;
      case 'materials':
        if (selectedStudent) {
          navigation.navigate('WorkspaceScreen', {
            userData: {
              ...selectedStudent,
              userType: 'parent',
            },
            studentData: selectedStudent,
          });
        }
        break;
      case 'reports':
        navigation.navigate('StudentReports', {
          userData: {
            ...selectedStudent,
            name: selectedStudent.name,
            authCode: selectedStudent.authCode,
          },
        });
        break;
      default:
        break;
    }
  };

  // Extract loadStudents function to make it reusable
  const loadStudents = React.useCallback(async () => {
    try {
      // Check if we're in demo mode
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        setCurrentUserData(parsedUserData); // Set current user data for demo mode indicator

        if (parsedUserData.demo_mode && parsedUserData.userType === 'student') {
          console.log('🎭 DEMO MODE: Loading demo parent children data');

          // Update last login timestamp for demo student user
          console.log(
            '⏰ PARENT: Updating last login for existing demo student user...'
          );
          try {
            const updateResult = await updateLastLogin(
              parsedUserData.authCode || parsedUserData.auth_code
            );
            if (updateResult.success) {
              console.log('✅ PARENT: Last login updated successfully');
            } else {
              console.warn(
                '⚠️ PARENT: Failed to update last login:',
                updateResult.error
              );
              // Continue with loading even if update fails
            }
          } catch (updateError) {
            console.error('❌ PARENT: Error updating last login:', updateError);
            // Continue with loading even if update fails
          }

          // Load demo children data
          setStudents(parsedUserData.children || []);
          setLoading(false);
          return;
        }
      }

      // Normal mode: load from AsyncStorage
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

  // Restore the previously selected student or select first student automatically
  const restoreSelectedStudent = React.useCallback(async () => {
    try {
      if (students.length === 0) return;

      const savedSelectedStudentId = await AsyncStorage.getItem(
        'selectedStudentId'
      );

      let studentToSelect = null;

      // Try to restore previously selected student
      if (savedSelectedStudentId) {
        studentToSelect = students.find(
          (s) => s.id.toString() === savedSelectedStudentId
        );
      }

      // If no previously selected student found, automatically select the first one
      if (!studentToSelect) {
        studentToSelect = students[0];
        console.log(
          '📋 PARENT: Auto-selecting first student:',
          studentToSelect.name
        );
      } else {
        console.log(
          '📋 PARENT: Restored previously selected student:',
          studentToSelect.name
        );
      }

      if (studentToSelect) {
        setSelectedStudent(studentToSelect);
        // Save the selection for next time
        await AsyncStorage.setItem(
          'selectedStudentId',
          studentToSelect.id.toString()
        );
        // Also select student for notifications to ensure badges show correct counts
        selectStudent(studentToSelect);
      }
    } catch (error) {
      console.error('Error restoring selected student:', error);
    }
  }, [students]);

  // Student cleanup is now handled by the logoutService

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
              }

              // Comprehensive cleanup of student-related data from AsyncStorage
              console.log('🧹 PARENT: Starting student data cleanup...');
              const cleanupResult = await cleanupStudentData(studentToDelete);

              if (cleanupResult.success) {
                console.log(
                  '✅ PARENT: Student data cleanup completed successfully'
                );
              } else {
                console.error(
                  '❌ PARENT: Student data cleanup failed:',
                  cleanupResult.error
                );
              }

              // Update student accounts list in AsyncStorage
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
            {item.name || t('student')}
          </Text>
          <Text style={styles.studentDetails}>
            {t('id')}: {item.id || t('notAvailable')}
          </Text>

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

          <Text
            style={[
              styles.headerTitle,
              {
                fontSize: getResponsiveHeaderFontSize(2, t('parentDashboard')),
              },
            ]}
          >
            {t('parentDashboard')}
          </Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => {
                // Navigate to appropriate messaging screen based on user type
                // For parents, we'll navigate to a general messaging screen or student messaging
                if (selectedStudent) {
                  navigation.navigate('StudentMessagingScreen', {
                    authCode: selectedStudent.authCode,
                    studentName: selectedStudent.name,
                  });
                } else {
                  // If no student selected, show alert or navigate to first student
                  if (students.length > 0) {
                    navigation.navigate('StudentMessagingScreen', {
                      authCode: students[0].authCode,
                      studentName: students[0].name,
                    });
                  }
                }
              }}
            >
              <FontAwesomeIcon icon={faComments} size={18} color='#fff' />
              <MessageBadge
                userType='parent'
                selectedStudent={selectedStudent}
                showAllStudents={false}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => {
                // Navigate to notification screen with selected student context
                if (selectedStudent) {
                  navigation.navigate('NotificationScreen', {
                    userType: 'parent',
                    authCode: selectedStudent.authCode,
                    studentName: selectedStudent.name,
                    studentId: selectedStudent.id,
                  });
                } else {
                  // If no student selected, show alert or navigate to first student
                  if (students.length > 0) {
                    navigation.navigate('NotificationScreen', {
                      userType: 'parent',
                      authCode: students[0].authCode,
                      studentName: students[0].name,
                      studentId: students[0].id,
                    });
                  } else {
                    Alert.alert(t('noStudents'), t('pleaseAddStudent'));
                  }
                }
              }}
            >
              <FontAwesomeIcon icon={faBell} size={18} color='#fff' />
              <ParentNotificationBadge
                selectedStudent={selectedStudent}
                showAllStudents={false}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleAddStudent}
            >
              <FontAwesomeIcon icon={faPlus} size={18} color='#fff' />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Demo Mode Indicator */}
      {currentUserData?.demo_mode && (
        <DemoModeIndicator
          userData={currentUserData}
          style={{ marginHorizontal: 16 }}
        />
      )}

      <View style={styles.content}>
        <View style={styles.childrenSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {students.length > 1 ? t('yourChildren') : t('yourChild')}
            </Text>
            {students.length > 2 && (
              <TouchableOpacity
                style={styles.scrollIndicator}
                onPress={() => {
                  if (students.length > 2 && flatListRef.current) {
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
                  {t('scrollForMore')}
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
              { alignItems: 'center' }, // Centers the content horizontally within the scroll view
            ]}
            showsVerticalScrollIndicator={false}
          >
            {getMenuItems(t).map((item, index) => {
              const menuItems = getMenuItems(t);
              const totalItems = menuItems.length;

              // Calculate columns per row based on device type
              let itemsPerRow = 3; // Default for mobile
              if (isIPadDevice && isLandscape) {
                itemsPerRow = 6;
              } else if (isTabletDevice && isLandscape) {
                itemsPerRow = 6;
              } else if (isIPadDevice) {
                itemsPerRow = 4;
              } else if (isTabletDevice) {
                itemsPerRow = 4;
              }

              // Check if this is the last item in an incomplete row
              const isLastRow =
                Math.floor(index / itemsPerRow) ===
                Math.floor((totalItems - 1) / itemsPerRow);
              const isLastInRow =
                (index + 1) % itemsPerRow === 0 || index === totalItems - 1;
              const isIncompleteRow = totalItems % itemsPerRow !== 0;
              const shouldExpand = isLastRow && isLastInRow && isIncompleteRow;

              // Calculate minimum height based on device type
              let minHeight = (screenWidth - 30) / 3 - 8; // Default mobile
              if (isIPadDevice && isLandscape) {
                minHeight = (screenWidth - 100) / 6 - 6;
              } else if (isTabletDevice && isLandscape) {
                minHeight = (screenWidth - 90) / 6 - 8;
              } else if (isIPadDevice) {
                minHeight = (screenWidth - 80) / 4 - 8;
              } else if (isTabletDevice) {
                minHeight = (screenWidth - 70) / 4 - 10;
              }

              return (
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
                        text={t('soon')}
                        theme={theme}
                        fontSizes={fontSizes}
                      />
                    ) : undefined
                  }
                  styles={styles}
                  isLandscape={isLandscape}
                  additionalStyle={
                    shouldExpand
                      ? {
                          flex: 1,
                          marginRight: 0,
                          aspectRatio: undefined, // Remove aspect ratio constraint for expanding tiles
                          height: minHeight, // Set exact height to match other tiles
                        }
                      : {}
                  }
                />
              );
            })}
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
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    headerActionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    messageButton: {
      // width: 36,
      // height: 36,
      // borderRadius: 18,
      // backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    messageBadge: {
      badge: {
        backgroundColor: '#FF3B30',
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',

        position: 'absolute',
        top: -10,
        right: -10,
        borderWidth: 2,
        borderColor: theme.colors.background,
      },
    },
    messageBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    notificationButton: {
      // width: 36,
      // height: 36,
      // borderRadius: 18,
      // backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
      padding: 10,
    },
    childrenSection: {
      marginBottom: 5,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
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
      marginRight: 10,
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
      marginBottom: 10,
      color: theme.colors.text,
      marginLeft: 15,
    },
    listContainer: {
      paddingBottom: 10,
      paddingLeft: 10,
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
      justifyContent: 'flex-start', // Changed from space-between to support flex expansion
      paddingBottom: 50, // Add padding for scrollable content
      paddingHorizontal: 5, // Add padding for scrollable content
    },
    // iPad-specific grid layout - 4 tiles per row, wraps to next row for additional tiles
    iPadActionTilesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: Math.max(8, (screenWidth - 80 - ((screenWidth - 80) / 4) * 4) / 3), // Dynamic gap calculation
    },
    // Tablet-specific grid layout - 4 tiles per row, wraps to next row for additional tiles
    tabletActionTilesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: Math.max(10, (screenWidth - 80 - ((screenWidth - 80) / 4) * 4) / 3), // Dynamic gap calculation
    },
    // iPad landscape-specific grid layout - 6 tiles per row, wraps for additional tiles
    iPadLandscapeActionTilesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: Math.max(6, (screenWidth - 80 - ((screenWidth - 80) / 6) * 6) / 5), // Dynamic gap for 6 tiles
    },
    // Tablet landscape-specific grid layout - 6 tiles per row, wraps for additional tiles
    tabletLandscapeActionTilesGrid: {
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: Math.max(8, (screenWidth - 90 - ((screenWidth - 90) / 6) * 6) / 5), // Dynamic gap for 6 tiles
    },
    actionTile: {
      width: (screenWidth - 30) / 3 - 8, // 3 tiles per row: screen width - padding (24*2) - margins (8*3) / 3
      minWidth: (screenWidth - 30) / 3 - 8, // Minimum width for flex expansion
      aspectRatio: 1, // Square tiles
      borderRadius: 20, // Slightly smaller border radius for smaller tiles
      padding: 14, // Reduced padding for smaller tiles
      justifyContent: 'center', // Center content vertically for better balance
      alignItems: 'center', // Center content horizontally for smaller tiles
      position: 'relative',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      marginHorizontal: 4, // Add horizontal margin for spacing
      marginBottom: 8, // Add bottom margin for vertical spacing
      ...createMediumShadow(theme),
    },
    // iPad-specific action tile - optimized for 4 per row, wraps for additional tiles
    iPadActionTile: {
      width: (screenWidth - 80) / 4 - 8, // Optimized for 4 tiles per row with wrapping support
      minWidth: (screenWidth - 80) / 4 - 8, // Minimum width for flex expansion
      aspectRatio: 1, // Square tiles
      borderRadius: 16,
      padding: 12,
      marginHorizontal: 4,
      marginBottom: 8,
      ...createCustomShadow(theme, {
        height: 3,
        opacity: 0.15,
        radius: 8,
        elevation: 4,
      }),
    },
    // Tablet-specific action tile - optimized for 4 per row, wraps for additional tiles
    tabletActionTile: {
      width: (screenWidth - 70) / 4 - 10, // Optimized for 4 tiles per row with wrapping support
      minWidth: (screenWidth - 70) / 4 - 10, // Minimum width for flex expansion
      aspectRatio: 1, // Square tiles
      borderRadius: 18,
      padding: 14,
      marginHorizontal: 5,
      marginBottom: 10,
      ...createCustomShadow(theme, {
        height: 4,
        opacity: 0.18,
        radius: 10,
        elevation: 6,
      }),
    },
    // iPad landscape-specific action tile - optimized for 6 per row
    iPadLandscapeActionTile: {
      width: (screenWidth - 100) / 6 - 6, // 6 tiles per row in landscape with wrapping support
      minWidth: (screenWidth - 100) / 6 - 6, // Minimum width for flex expansion
      aspectRatio: 1, // Square tiles
      borderRadius: 14,
      padding: 10,
      marginHorizontal: 3,
      marginBottom: 6,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.12,
        radius: 6,
        elevation: 3,
      }),
    },
    // Tablet landscape-specific action tile - optimized for 6 per row
    tabletLandscapeActionTile: {
      width: (screenWidth - 90) / 6 - 8, // 6 tiles per row in landscape with wrapping support
      minWidth: (screenWidth - 90) / 6 - 8, // Minimum width for flex expansion
      aspectRatio: 1, // Square tiles
      borderRadius: 16,
      padding: 12,
      marginHorizontal: 4,
      marginBottom: 8,
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
      width: (screenWidth - 48) / 3 - 8, // 3 tiles per row: screen width - padding (24*2) - margins (8*3) / 3
      aspectRatio: 1, // Square items
      alignItems: 'center',
      justifyContent: 'center', // Center content vertically
      marginHorizontal: 4, // Add horizontal margin for spacing
      marginBottom: 8, // Add bottom margin for vertical spacing
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
      width: (screenWidth - 80) / 4 - 8, // Optimized for 4 items per row with wrapping support
      minWidth: 160, // Minimum width to ensure items don't get too small
      aspectRatio: 1, // Square items
      borderRadius: 10,
      padding: 12,
      marginHorizontal: 4,
      marginBottom: 8,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.06,
        radius: 4,
        elevation: 2,
      }),
    },
    // Tablet-specific menu item - optimized for 4 per row, wraps for additional items
    tabletMenuItem: {
      width: (screenWidth - 70) / 4 - 10, // Optimized for 4 items per row with wrapping support
      minWidth: 150, // Minimum width to ensure items don't get too small
      aspectRatio: 1, // Square items
      borderRadius: 11,
      padding: 13,
      marginHorizontal: 5,
      marginBottom: 10,
      ...createCustomShadow(theme, {
        height: 1.5,
        opacity: 0.07,
        radius: 3.5,
        elevation: 1.5,
      }),
    },
    // iPad landscape-specific menu item - optimized for 6 per row
    iPadLandscapeMenuItem: {
      width: (screenWidth - 100) / 6 - 6, // 6 items per row in landscape with wrapping support
      minWidth: 120, // Minimum width for landscape items
      aspectRatio: 1, // Square items
      borderRadius: 8,
      padding: 10,
      marginHorizontal: 3,
      marginBottom: 6,
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.05,
        radius: 3,
        elevation: 1,
      }),
    },
    // Tablet landscape-specific menu item - optimized for 6 per row
    tabletLandscapeMenuItem: {
      width: (screenWidth - 90) / 6 - 8, // 6 items per row in landscape with wrapping support
      minWidth: 110, // Minimum width for landscape items
      aspectRatio: 1, // Square items
      borderRadius: 9,
      padding: 11,
      marginHorizontal: 4,
      marginBottom: 8,
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
