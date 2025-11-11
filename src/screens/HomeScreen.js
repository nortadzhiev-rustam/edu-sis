import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
    AccessibilityInfo,
    PixelRatio,
    Animated,
    AppState,
    Linking,
    Modal,
    ScrollView,
    Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {StatusBar} from 'expo-status-bar';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
    faChalkboardTeacher,
    faUserGraduate,
    faCalendarAlt,
    faInfoCircle,
    faEnvelope,
    faQuestionCircle,
    faShareAlt,
    faCog,
    faTimes,
} from '@fortawesome/free-solid-svg-icons';
import {
    faFacebookF,
    faXTwitter,
    faInstagram,
    faYoutube,
} from '@fortawesome/free-brands-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReAnimated, {FadeInDown} from 'react-native-reanimated';
import {Platform} from 'expo-modules-core';
import {useTheme, getLanguageFontSizes} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import {useBranchLogo, useSchoolLogo} from '../hooks/useThemeLogo';
import {
    isIPad,
    getResponsiveFontSizes,
    getResponsiveSpacing,
} from '../utils/deviceDetection';
import {lockOrientationForDevice} from '../utils/orientationLock';
import {createSmallShadow, createMediumShadow} from '../utils/commonStyles';
import {updateCurrentUserLastLogin} from '../services/deviceService';
import {
    getValidatedUserData,
    getValidatedStudentAccounts,
    validateAndSanitizeAllData,
} from '../utils/dataValidation';
import {
    runHomescreenDiagnostics,
    generateUserFriendlyErrorMessage,
    logDiagnostics,
    clearAllUserData,
} from '../utils/homescreenDiagnostics';
import {
    wrapWithTimeout,
    usePerformanceMonitoring,
} from '../utils/performanceMonitor';
import {Config} from '../config/env';
import {getAllSocialMediaLinks} from '../services/schoolConfigService';

const {width, height} = Dimensions.get('window');

export default function HomeScreen({navigation}) {
    const {theme} = useTheme();
    const {t, currentLanguage} = useLanguage();
    const fontSizes = getLanguageFontSizes(currentLanguage);
    const logoData = useBranchLogo();
    const schoolLogo = useSchoolLogo();

    // Helper function to check if animations should be reduced (with null safety)
    const shouldReduceMotion = React.useMemo(() => {
        return (
            deviceState?.reduceMotion ||
            false ||
            (deviceState?.fontScale || 1) > 1.3 ||
            deviceState?.screenReader ||
            false
        );
    }, [
        deviceState?.reduceMotion,
        deviceState?.fontScale,
        deviceState?.screenReader,
    ]);

    // Animation values for smooth logo transition
    const appLogoOpacity = React.useRef(new Animated.Value(1)).current;
    const appLogoScale = React.useRef(new Animated.Value(1)).current;
    const branchLogoOpacity = React.useRef(new Animated.Value(0)).current;
    const branchLogoScale = React.useRef(new Animated.Value(1.2)).current;

    // Trigger logo transition animation (respecting accessibility settings)
    React.useEffect(() => {
        if (logoData.shouldTransition && logoData.hasBranchLogo) {
            if (shouldReduceMotion) {
                // Instant transition for accessibility
                console.log(
                    '🏠 LOGO: Skipping animation due to accessibility settings'
                );
                appLogoOpacity.setValue(0);
                appLogoScale.setValue(0.8);
                branchLogoOpacity.setValue(1);
                branchLogoScale.setValue(1);
            } else {
                // Liquid-like transition with spring animation
                Animated.parallel([
                    // Fade out and scale down app logo
                    Animated.timing(appLogoOpacity, {
                        toValue: 0,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.spring(appLogoScale, {
                        toValue: 0.8,
                        tension: 100,
                        friction: 8,
                        useNativeDriver: true,
                    }),
                    // Fade in and scale branch logo
                    Animated.timing(branchLogoOpacity, {
                        toValue: 1,
                        duration: 1000,
                        delay: 200,
                        useNativeDriver: true,
                    }),
                    Animated.spring(branchLogoScale, {
                        toValue: 1,
                        tension: 80,
                        friction: 6,
                        delay: 200,
                        useNativeDriver: true,
                    }),
                ]).start();
            }
        }
    }, [logoData.shouldTransition, logoData.hasBranchLogo, shouldReduceMotion]);

    // iOS fallback state to ensure content appears
    const [contentVisible, setContentVisible] = React.useState(
        Platform.OS !== 'ios'
    );

    // Device state tracking for debugging
    const [deviceState, setDeviceState] = React.useState({
        reduceMotion: false,
        fontScale: 1.0,
        screenReader: false,
        debugInfo: '',
    });

    // Social media modal state
    const [socialModalVisible, setSocialModalVisible] = React.useState(false);
    const [selectedPlatform, setSelectedPlatform] = React.useState(null);
    const [platformLinks, setPlatformLinks] = React.useState([]);
    const modalTranslateY = React.useRef(new Animated.Value(0)).current;

    // Pan responder for swipe down gesture
    const panResponder = React.useRef(
        React.useMemo(() => ({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only respond to vertical swipes
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                // Only allow downward swipes
                if (gestureState.dy > 0) {
                    modalTranslateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // If swiped down more than 100px, close the modal
                if (gestureState.dy > 100) {
                    Animated.timing(modalTranslateY, {
                        toValue: 500,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        setSocialModalVisible(false);
                        modalTranslateY.setValue(0);
                    });
                } else {
                    // Otherwise, spring back to original position
                    Animated.spring(modalTranslateY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        }), [])
    ).current;

    // Reset modal position when it opens
    React.useEffect(() => {
        if (socialModalVisible) {
            modalTranslateY.setValue(0);
        }
    }, [socialModalVisible]);

    // Debug logging for iOS content visibility
    React.useEffect(() => {
        if (Platform.OS === 'ios') {
            console.log('🍎 iOS: Content visibility state changed:', contentVisible);
            console.log('🍎 iOS: Device state:', deviceState);
        }
    }, [contentVisible, deviceState]);

    // Use performance monitoring
    const {logMetrics} = usePerformanceMonitoring();

    // Refresh branch logo when screen comes into focus (e.g., after login or adding student)
    useFocusEffect(
        React.useCallback(() => {
            console.log('🏠 HOME: Screen focused, refreshing branch logo');
            logoData.refreshBranchData();
        }, [logoData.refreshBranchData])
    );

    // Also listen for navigation state changes to catch immediate updates
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            console.log('🏠 HOME: Navigation focus event, refreshing branch logo');
            // Small delay to ensure AsyncStorage has been updated
            setTimeout(() => {
                logoData.refreshBranchData();
            }, 100);
        });

        return unsubscribe;
    }, [navigation, logoData.refreshBranchData]);

    // Listen for app state changes to refresh logo when app comes back from background
    React.useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (nextAppState === 'active') {
                console.log('🏠 HOME: App became active, refreshing branch logo');
                // Small delay to ensure any background updates have completed
                setTimeout(() => {
                    logoData.refreshBranchData();
                }, 200);
            }
        };

        const subscription = AppState.addEventListener(
            'change',
            handleAppStateChange
        );

        return () => {
            subscription?.remove();
        };
    }, [logoData.refreshBranchData]);

    // Comprehensive iOS accessibility and device state detection
    React.useEffect(() => {
        if (Platform.OS === 'ios') {
            console.log('🍎 iOS: Starting comprehensive device state detection...');

            const detectDeviceState = async () => {
                try {
                    // Get device accessibility and performance info
                    const [reduceMotion, screenReader] = await Promise.all([
                        AccessibilityInfo.isReduceMotionEnabled(),
                        AccessibilityInfo.isScreenReaderEnabled(),
                    ]);

                    const fontScale = PixelRatio.getFontScale();
                    const pixelRatio = PixelRatio.get();

                    // Create debug info string
                    const debugInfo = `FontScale: ${fontScale}, PixelRatio: ${pixelRatio}, ReduceMotion: ${reduceMotion}, ScreenReader: ${screenReader}`;

                    // Update device state
                    const newDeviceState = {
                        reduceMotion,
                        fontScale,
                        screenReader,
                        debugInfo,
                    };

                    setDeviceState(newDeviceState);

                    console.log('🍎 iOS: Device State Detection Results:');
                    console.log(`- Reduce Motion: ${reduceMotion}`);
                    console.log(`- Font Scale: ${fontScale}`);
                    console.log(`- Screen Reader: ${screenReader}`);
                    console.log(`- Pixel Ratio: ${pixelRatio}`);

                    // Determine if we should skip animations and show content immediately
                    const shouldSkipAnimation =
                        reduceMotion || // User has Reduce Motion enabled
                        fontScale > 1.3 || // User has large text enabled
                        screenReader; // User has screen reader enabled

                    if (shouldSkipAnimation) {
                        console.log(
                            '🍎 iOS: Accessibility settings detected - showing content immediately'
                        );
                        console.log(
                            `- Reason: ${
                                reduceMotion
                                    ? 'Reduce Motion'
                                    : fontScale > 1.3
                                        ? 'Large Text'
                                        : 'Screen Reader'
                            }`
                        );
                        setContentVisible(true);
                        return;
                    }

                    // If no accessibility issues, use progressive fallback timers
                    console.log(
                        '🍎 iOS: No accessibility issues detected - using fallback timers'
                    );

                    // Immediate fallback for performance issues
                    const immediateTimer = setTimeout(() => {
                        console.log('🍎 iOS: Immediate fallback (100ms) - showing content');
                        setContentVisible(true);
                    }, 100);

                    // Secondary fallback
                    const secondaryTimer = setTimeout(() => {
                        console.log(
                            '🍎 iOS: Secondary fallback (500ms) - ensuring content visibility'
                        );
                        setContentVisible(true);
                    }, 500);

                    // Final fallback
                    const finalTimer = setTimeout(() => {
                        console.log(
                            '🍎 iOS: Final fallback (1500ms) - forcing content visibility'
                        );
                        setContentVisible(true);
                    }, 1500);

                    // Cleanup function
                    return () => {
                        clearTimeout(immediateTimer);
                        clearTimeout(secondaryTimer);
                        clearTimeout(finalTimer);
                    };
                } catch (error) {
                    console.error('🍎 iOS: Error detecting device state:', error);
                    // Fallback to showing content immediately if detection fails
                    setContentVisible(true);
                }
            };

            // Run detection
            const cleanup = detectDeviceState();

            // Return cleanup function if it exists
            return () => {
                if (cleanup && typeof cleanup.then === 'function') {
                    cleanup.then((cleanupFn) => cleanupFn && cleanupFn());
                }
            };
        }
    }, []);

    // Lock orientation based on device type with iOS-specific handling
    React.useEffect(() => {
        const handleOrientationLock = async () => {
            try {
                if (Platform.OS === 'ios') {
                    console.log('🍎 iOS: Setting up orientation lock with timeout...');
                    // Use timeout protection for iOS orientation lock
                    await wrapWithTimeout(
                        lockOrientationForDevice,
                        5000, // 5 second timeout for iOS
                        'iOS Orientation Lock'
                    );
                } else {
                    await lockOrientationForDevice();
                }
            } catch (error) {
                console.warn('⚠️ HOME: Orientation lock failed:', error);
                // Continue without orientation lock on iOS
                if (Platform.OS === 'ios') {
                    console.log('🍎 iOS: Continuing despite orientation lock failure');
                }
            }
        };

        handleOrientationLock();
    }, []);

    // Validate and sanitize data on component mount with timeout protection
    React.useEffect(() => {
        const validateData = async () => {
            try {
                console.log('🔍 HOME: Validating stored data on mount...');

                // Wrap validation with timeout protection
                const validationResults = await wrapWithTimeout(
                    validateAndSanitizeAllData,
                    15000, // 15 second timeout
                    'Data Validation'
                );

                if (
                    !validationResults.userData.valid &&
                    !validationResults.studentAccounts.count
                ) {
                    console.log('⚠️ HOME: No valid user data found');
                } else {
                    console.log('✅ HOME: Data validation complete:', validationResults);
                }

                // Log performance metrics after validation
                logMetrics();
            } catch (error) {
                console.error('❌ HOME: Error during data validation:', error);

                // If validation times out or fails, continue anyway
                console.log('🔄 HOME: Continuing despite validation error...');
            }
        };

        validateData();
    }, []);

    // Diagnostic function for troubleshooting navigation issues
    const runDiagnostics = async () => {
        try {
            console.log('🔍 HOME: Running diagnostics...');
            const diagnostics = await runHomescreenDiagnostics();
            logDiagnostics(diagnostics);

            const userMessage = generateUserFriendlyErrorMessage(diagnostics);

            Alert.alert(t('navigationDiagnostics'), userMessage, [
                {text: t('ok'), style: 'default'},
                {
                    text: t('clearDataRestart'),
                    style: 'destructive',
                    onPress: async () => {
                        const cleared = await clearAllUserData();
                        if (cleared) {
                            Alert.alert(t('dataCleared'), t('dataClearedMessage'), [
                                {text: t('ok')},
                            ]);
                        } else {
                            Alert.alert(t('error'), t('failedToClearData'));
                        }
                    },
                },
            ]);
        } catch (error) {
            console.error('❌ HOME: Diagnostics failed:', error);
            Alert.alert(t('diagnosticsError'), t('unableToRunDiagnostics'));
        }
    };

    // iPad-specific configurations
    const isIPadDevice = isIPad();
    const responsiveFonts = getResponsiveFontSizes();
    const responsiveSpacing = getResponsiveSpacing();

    const styles = createStyles(
        theme,
        fontSizes,
        isIPadDevice,
        responsiveFonts,
        responsiveSpacing
    );

    const handleTeacherPress = async () => {
        try {
            console.log('👨‍🏫 HOME: Teacher button pressed, starting navigation...');

            // Use validated user data with timeout protection
            const userData = await wrapWithTimeout(
                getValidatedUserData,
                10000, // 10 second timeout
                'Get Teacher Data'
            );

            if (userData && userData.userType === 'teacher') {
                // Update last login timestamp when user opens the app
                console.log(
                    '⏰ HOME: Updating last login for existing teacher user...'
                );
                try {
                    // Wrap last login update with timeout
                    const updateResult = await wrapWithTimeout(
                        updateCurrentUserLastLogin,
                        5000, // 5 second timeout
                        'Update Last Login'
                    );

                    if (updateResult.success) {
                        console.log('✅ HOME: Last login updated successfully');
                    } else {
                        console.warn(
                            '⚠️ HOME: Failed to update last login:',
                            updateResult.error
                        );
                        // Continue with navigation even if update fails
                    }
                } catch (updateError) {
                    console.error('❌ HOME: Error updating last login:', updateError);
                    // Continue with navigation even if update fails
                }

                console.log('🚀 HOME: Navigating to teacher screen...');
                navigation.navigate('TeacherScreen', {userData});
                return;
            }

            // If not logged in or not a teacher, go to login screen with teacher type
            console.log('🔄 HOME: No valid teacher data found, redirecting to login');
            navigation.navigate('Login', {loginType: 'teacher'});
        } catch (error) {
            console.error('❌ HOME: Unexpected error in handleTeacherPress:', error);
            Alert.alert(t('navigationError'), t('unableToAccessTeacherScreen'), [
                {text: t('tryAgain'), onPress: () => handleTeacherPress()},
                {text: t('runDiagnostics'), onPress: () => runDiagnostics()},
                {
                    text: t('goToLogin'),
                    onPress: () => navigation.navigate('Login', {loginType: 'teacher'}),
                },
            ]);
        }
    };

    const handleParentPress = async () => {
        try {
            // Navigate to parent screen - no login check needed as parents can add students later
            console.log('👨‍👩‍👧‍👦 HOME: Navigating to parent screen');
            navigation.navigate('ParentScreen');
        } catch (error) {
            console.error('❌ HOME: Error navigating to parent screen:', error);
            Alert.alert(t('navigationError'), t('unableToAccessParentScreen'), [
                {text: t('tryAgain'), onPress: () => handleParentPress()},
                {text: t('runDiagnostics'), onPress: () => runDiagnostics()},
                {text: t('cancel'), style: 'cancel'},
            ]);
        }
    };

    // Helper function to get all available user data for school resources
    const getAllUserData = async () => {
        const allUsers = [];

        try {
            // Use validated user data utilities
            const userData = await getValidatedUserData();
            if (userData) {
                allUsers.push(userData);
            }

            // Get validated student accounts
            const studentAccounts = await getValidatedStudentAccounts();
            allUsers.push(...studentAccounts);

            console.log(`📊 HOME: Found ${allUsers.length} valid user accounts`);
        } catch (error) {
            console.error('❌ HOME: Error getting user data:', error);
        }

        return allUsers;
    };

    // Helper function to determine which branches to show for school resources
    const getUniqueBranches = (users) => {
        const branchMap = new Map();

        users.forEach((user) => {
            const branchId =
                user.branch_id || user.branchId || user.branch?.branch_id;
            const branchName =
                user.branch_name || user.branchName || user.branch?.branch_name;

            if (branchId && branchName) {
                branchMap.set(branchId, {
                    branchId,
                    branchName,
                    userType: user.userType,
                    userName: user.name,
                });
            }
        });

        return Array.from(branchMap.values());
    };

    // Generic handler for school resources (About Us, Contacts, FAQ)
    const handleSchoolResourcePress = async (screenName) => {
        try {
            const allUsers = await getAllUserData();

            if (allUsers.length === 0) {
                // No user data found - show options
                Alert.alert(
                    t('accessScreen').replace('{screenName}', screenName),
                    t('schoolInfoAccessMessage'),
                    [
                        {text: t('cancel'), style: 'cancel'},
                        {
                            text: t('addStudent'),
                            onPress: () => navigation.navigate('ParentScreen'),
                        },
                        {
                            text: t('loginAsTeacher'),
                            onPress: () =>
                                navigation.navigate('Login', {loginType: 'teacher'}),
                        },
                        {
                            text: t('loginAsStudent'),
                            onPress: () =>
                                navigation.navigate('Login', {loginType: 'student'}),
                        },
                    ]
                );
                return;
            }

            const uniqueBranches = getUniqueBranches(allUsers);

            console.log(
                `🏠 HOME: ${screenName} access - found ${uniqueBranches.length} unique branches:`,
                uniqueBranches.map((b) => `${b.branchName} (${b.userType})`)
            );

            // Navigate to the screen - the screen will handle showing data for all unique branches
            navigation.navigate(screenName);
        } catch (error) {
            console.error(`❌ HOME: Error accessing ${screenName}:`, error);
            Alert.alert(
                'Navigation Error',
                `Unable to access ${screenName}. This might be due to data issues.`,
                [
                    {
                        text: 'Try Again',
                        onPress: () => handleSchoolResourcePress(screenName),
                    },
                    {text: 'Run Diagnostics', onPress: () => runDiagnostics()},
                    {text: 'Cancel', style: 'cancel'},
                ]
            );
        }
    };

    const handleCalendarPress = async () => {
        try {
            // Check for direct login userData first
            const userData = await AsyncStorage.getItem('userData');

            // Check for student accounts in parent system
            const studentAccountsStr = await AsyncStorage.getItem('studentAccounts');
            const selectedStudentStr = await AsyncStorage.getItem('selectedStudent');

            console.log('🏠 HOME: Calendar access check:', {
                hasUserData: !!userData,
                hasStudentAccounts: !!studentAccountsStr,
                hasSelectedStudent: !!selectedStudentStr,
            });

            // If there's direct login data, use it
            if (userData) {
                try {
                    const userToUse = JSON.parse(userData);
                    console.log('✅ HOME: Using direct login userData:', {
                        userType: userToUse.userType,
                        username: userToUse.username,
                    });
                    // Navigate to branch-only calendar from home screen
                    navigation.navigate('Calendar', {mode: 'branch-only'});
                    return;
                } catch (parseError) {
                    console.error('❌ HOME: Error parsing userData:', parseError);
                }
            }

            // If no direct login, check for student accounts
            if (studentAccountsStr) {
                try {
                    const studentAccounts = JSON.parse(studentAccountsStr);

                    if (studentAccounts.length === 1) {
                        // Only one student - use it directly (don't overwrite main userData)
                        const student = studentAccounts[0];
                        console.log('✅ HOME: Using single student account:', student.name);
                        await AsyncStorage.setItem(
                            'calendarUserData',
                            JSON.stringify(student)
                        );
                        await AsyncStorage.setItem(
                            'selectedStudent',
                            JSON.stringify(student)
                        );
                        // Navigate to branch-only calendar from home screen
                        navigation.navigate('Calendar', {mode: 'branch-only'});
                        return;
                    } else if (studentAccounts.length > 1) {
                        // Multiple students - show picker
                        Alert.alert(
                            'Select Student',
                            "Which student's calendar would you like to view?",
                            [
                                {text: 'Cancel', style: 'cancel'},
                                ...studentAccounts.map((student) => ({
                                    text: student.name,
                                    onPress: async () => {
                                        console.log(
                                            '✅ HOME: Selected student for calendar:',
                                            student.name
                                        );
                                        await AsyncStorage.setItem(
                                            'userData',
                                            JSON.stringify(student)
                                        );
                                        await AsyncStorage.setItem(
                                            'selectedStudent',
                                            JSON.stringify(student)
                                        );
                                        // Navigate to branch-only calendar from home screen
                                        navigation.navigate('Calendar', {mode: 'branch-only'});
                                    },
                                })),
                            ]
                        );
                        return;
                    }
                } catch (parseError) {
                    console.error('❌ HOME: Error parsing studentAccounts:', parseError);
                }
            }

            // If there's a previously selected student, use it (don't overwrite main userData)
            if (selectedStudentStr) {
                try {
                    const selectedStudent = JSON.parse(selectedStudentStr);
                    console.log(
                        '✅ HOME: Using previously selected student:',
                        selectedStudent.name
                    );
                    await AsyncStorage.setItem('calendarUserData', selectedStudentStr);
                    // Navigate to branch-only calendar from home screen
                    navigation.navigate('Calendar', {mode: 'branch-only'});
                    return;
                } catch (parseError) {
                    console.error('❌ HOME: Error parsing selectedStudent:', parseError);
                }
            }

            // No user data found - show options
            console.log(
                '❌ HOME: No user data found, showing login/add student options'
            );
            Alert.alert(
                'Access Calendar',
                'To view the calendar, you can either login directly or add a student account.',
                [
                    {text: 'Cancel', style: 'cancel'},
                    {
                        text: 'Add Student',
                        onPress: () => navigation.navigate('ParentScreen'),
                    },
                    {
                        text: 'Login as Teacher',
                        onPress: () =>
                            navigation.navigate('Login', {loginType: 'teacher'}),
                    },
                    {
                        text: 'Login as Student',
                        onPress: () =>
                            navigation.navigate('Login', {loginType: 'student'}),
                    },
                ]
            );
        } catch (error) {
            console.error('❌ HOME: Error checking user data for calendar:', error);
            // Show enhanced error options
            Alert.alert(
                'Calendar Access Error',
                'Unable to access calendar. This might be due to data issues or missing login information.',
                [
                    {text: 'Cancel', style: 'cancel'},
                    {text: 'Run Diagnostics', onPress: () => runDiagnostics()},
                    {
                        text: 'Login as Teacher',
                        onPress: () =>
                            navigation.navigate('Login', {loginType: 'teacher'}),
                    },
                    {
                        text: 'Login as Student',
                        onPress: () =>
                            navigation.navigate('Login', {loginType: 'student'}),
                    },
                ]
            );
        }
    };

    // Helper function to open social media links
    const handleSocialMediaPress = (platform) => {
        try {
            const allLinks = getAllSocialMediaLinks();

            // Filter out demo school
            const filteredLinks = allLinks.filter(school => school.schoolId !== 'demo_school');

            if (filteredLinks.length === 0) {
                Alert.alert(t('noSocialMedia'), t('noSocialMediaAvailable'));
                return;
            }

            // Create options for each school's social media
            const options = [];

            filteredLinks.forEach((school) => {
                const links = school.socialMedia;

                if (platform === 'facebook' && links.facebook) {
                    options.push({
                        schoolName: school.schoolName,
                        label: school.schoolName,
                        url: links.facebook,
                        type: 'main',
                    });
                    if (links.facebookPreschool) {
                        options.push({
                            schoolName: school.schoolName,
                            label: `${school.schoolName} Preschool`,
                            url: links.facebookPreschool,
                            type: 'preschool',
                        });
                    }
                } else if (platform === 'youtube' && links.youtube) {
                    options.push({
                        schoolName: school.schoolName,
                        label: school.schoolName,
                        url: links.youtube,
                        type: 'main',
                    });
                } else if (platform === 'instagram' && links.instagram) {
                    options.push({
                        schoolName: school.schoolName,
                        label: school.schoolName,
                        url: links.instagram,
                        type: 'main',
                    });
                } else if (platform === 'twitter' && links.twitter) {
                    options.push({
                        schoolName: school.schoolName,
                        label: school.schoolName,
                        url: links.twitter,
                        type: 'main',
                    });
                }
            });

            if (options.length === 0) {
                Alert.alert(
                    t('notAvailable'),
                    t(`${platform}NotAvailable`)
                );
                return;
            }

            // Set platform and links, then show modal
            setSelectedPlatform(platform);
            setPlatformLinks(options);
            setSocialModalVisible(true);
        } catch (error) {
            console.error('❌ HOME: Error opening social media link:', error);
            Alert.alert(t('error'), t('failedToOpenLink'));
        }
    };

    // Helper function to open a specific link
    const handleOpenLink = async (url) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
                setSocialModalVisible(false);
            } else {
                Alert.alert(t('error'), t('cannotOpenLink'));
            }
        } catch (error) {
            console.error('❌ HOME: Error opening link:', error);
            Alert.alert(t('error'), t('failedToOpenLink'));
        }
    };

    // Get platform icon and color
    const getPlatformInfo = (platform) => {
        switch (platform) {
            case 'facebook':
                return { icon: faFacebookF, color: '#1877F2', name: 'Facebook' };
            case 'youtube':
                return { icon: faYoutube, color: '#FF0000', name: 'YouTube' };
            case 'instagram':
                return { icon: faInstagram, color: '#E4405F', name: 'Instagram' };
            case 'twitter':
                return { icon: faXTwitter, color: theme.mode === 'dark' ? '#fff' : '#000000', name: 'Twitter' };
            default:
                return { icon: faShareAlt, color: theme.colors.primary, name: 'Social Media' };
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Hide status bar on Android in dark mode to match other screens */}
            <StatusBar
                style={
                    Platform.OS === 'android' && theme.mode === 'dark' ? 'light' : 'auto'
                }
                hidden={Platform.OS === 'android' && theme.mode === 'dark'}
            />
            {/* Absolute positioned Settings Button */}
            <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => navigation.navigate('SettingsScreen')}
            >
                <FontAwesomeIcon icon={faCog} size={20} color={theme.colors.text}/>
            </TouchableOpacity>

            <View style={styles.content}>
                {/*<Text style={styles.title}>{t('welcomeTo')}</Text>*/}
                {/* Logo with liquid transition effect */}
                <View style={styles.logoContainer}>
                    <Animated.Image
                        source={logoData.appLogo}
                        style={[
                            styles.logo,
                            {
                                opacity:
                                    shouldReduceMotion && logoData.hasBranchLogo
                                        ? 0 // Hide app logo immediately if reduce motion and branch logo available
                                        : appLogoOpacity,
                                transform: [
                                    {
                                        scale: appLogoScale,
                                    },
                                ],
                            },
                        ]}
                        resizeMode='contain'
                    />
                    {logoData.hasBranchLogo && (
                        <Animated.Image
                            source={logoData.branchLogo}
                            style={[
                                styles.logo,
                                styles.branchLogoOverlay,
                                {
                                    opacity: shouldReduceMotion
                                        ? 1 // Show branch logo immediately if reduce motion
                                        : branchLogoOpacity,
                                    transform: [
                                        {
                                            scale: shouldReduceMotion
                                                ? 1 // Normal scale if reduce motion
                                                : branchLogoScale,
                                        },
                                    ],
                                },
                            ]}
                            resizeMode='contain'
                        />
                    )}
                </View>

                <Text style={styles.subtitle}>{t('chooseYourRole')}</Text>

                {/* Debug info for iOS devices (only in development) */}
                {/* {__DEV__ && Platform.OS === 'ios' && (
          <Text style={styles.debugText}>Debug: {deviceState?.debugInfo || 'Loading...'}</Text>
        )} */}

                <ReAnimated.View
                    key={
                        Platform.OS === 'ios'
                            ? `ios-content-${contentVisible}-${
                                deviceState?.debugInfo || 'unknown'
                            }`
                            : 'android-content'
                    }
                    entering={
                        Platform.OS === 'ios'
                            ? shouldReduceMotion
                                ? undefined // Skip animation for accessibility settings
                                : FadeInDown.delay(0).springify() // No delay on iOS
                            : FadeInDown.delay(300).springify()
                    }
                    style={[
                        styles.buttonsContainer,
                        Platform.OS === 'ios' && {
                            // Ensure visibility when animations are disabled
                            opacity: shouldReduceMotion ? 1 : contentVisible ? 1 : 0.3,
                            minHeight: (deviceState?.fontScale || 1) > 1.3 ? 500 : 400, // Adjust height for large fonts
                        },
                    ]}
                >
                    {/* First row with Teacher and Parent cards */}
                    <View style={styles.roleRow}>
                        <TouchableOpacity
                            style={[styles.roleButton, styles.roleButtonHorizontal]}
                            onPress={handleTeacherPress}
                        >
                            <View style={[styles.iconContainer, styles.teacherIconContainer]}>
                                <FontAwesomeIcon
                                    icon={faChalkboardTeacher}
                                    size={24}
                                    color='#007AFF'
                                />
                            </View>
                            <Text style={styles.roleText}>{t('teacher')}</Text>
                            <Text style={styles.roleDescription} numberOfLines={3}>
                                {t('teacherDescription')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.roleButton, styles.roleButtonHorizontal]}
                            onPress={handleParentPress}
                        >
                            <View style={[styles.iconContainer, styles.parentIconContainer]}>
                                <FontAwesomeIcon
                                    icon={faUserGraduate}
                                    size={24}
                                    color='#FF9500'
                                />
                            </View>
                            <Text style={styles.roleText}>{t('parent')}</Text>
                            <Text style={styles.roleDescription} numberOfLines={3}>
                                {t('parentDescription')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Second row with additional buttons */}
                    <Text style={[styles.sectionTitle, {textAlign: 'left'}]}>{t('schoolResources')}</Text>
                    <View style={styles.resourcesContainer}>
                        <TouchableOpacity
                            style={styles.resourceButton}
                            onPress={handleCalendarPress}
                        >
                            <View
                                style={[
                                    styles.resourceIconContainer,
                                    {backgroundColor: 'rgba(88, 86, 214, 0.1)'},
                                ]}
                            >
                                <FontAwesomeIcon
                                    icon={faCalendarAlt}
                                    size={20}
                                    color='#5856D6'
                                />
                            </View>
                            <Text
                                style={styles.resourceText}
                                numberOfLines={2}
                                adjustsFontSizeToFit
                            >
                                {t('calendar')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.resourceButton}
                            onPress={() => handleSchoolResourcePress('AboutUs')}
                        >
                            <View
                                style={[
                                    styles.resourceIconContainer,
                                    {backgroundColor: 'rgba(52, 199, 89, 0.1)'},
                                ]}
                            >
                                <FontAwesomeIcon
                                    icon={faInfoCircle}
                                    size={20}
                                    color='#34C759'
                                />
                            </View>
                            <Text
                                style={styles.resourceText}
                                numberOfLines={2}
                                adjustsFontSizeToFit
                            >
                                {t('aboutUs')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.resourceButton}
                            onPress={() => handleSchoolResourcePress('Contacts')}
                        >
                            <View
                                style={[
                                    styles.resourceIconContainer,
                                    {backgroundColor: 'rgba(255, 69, 58, 0.1)'},
                                ]}
                            >
                                <FontAwesomeIcon icon={faEnvelope} size={20} color='#FF3B30'/>
                            </View>
                            <Text
                                style={styles.resourceText}
                                numberOfLines={2}
                                adjustsFontSizeToFit
                            >
                                {t('contactUs')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.resourceButton}
                            onPress={() => handleSchoolResourcePress('FAQ')}
                        >
                            <View
                                style={[
                                    styles.resourceIconContainer,
                                    {backgroundColor: 'rgba(255, 149, 0, 0.1)'},
                                ]}
                            >
                                <FontAwesomeIcon
                                    icon={faQuestionCircle}
                                    size={20}
                                    color='#FF9500'
                                />
                            </View>
                            <Text
                                style={styles.resourceText}
                                numberOfLines={2}
                                adjustsFontSizeToFit
                            >
                                {t('faq')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Social Media Section */}
                    <View style={styles.socialMediaSection}>
                        <Text style={styles.sectionTitle}>{t('followUs')}</Text>
                        <View style={styles.socialMediaGrid}>
                            <TouchableOpacity
                                style={[styles.socialMediaCard, {backgroundColor: 'rgba(24, 119, 242, 0.1)'}]}
                                onPress={() => handleSocialMediaPress('facebook')}
                            >
                                <View style={[styles.socialMediaIconCircle, {backgroundColor: '#1877F2'}]}>
                                    <FontAwesomeIcon icon={faFacebookF} size={22} color='#fff'/>
                                </View>
                                <Text style={styles.socialMediaLabel}>Facebook</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.socialMediaCard, {backgroundColor: 'rgba(255, 0, 0, 0.1)'}]}
                                onPress={() => handleSocialMediaPress('youtube')}
                            >
                                <View style={[styles.socialMediaIconCircle, {backgroundColor: '#FF0000'}]}>
                                    <FontAwesomeIcon icon={faYoutube} size={22} color='#fff'/>
                                </View>
                                <Text style={styles.socialMediaLabel}>YouTube</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.socialMediaCard, {backgroundColor: 'rgba(228, 64, 95, 0.1)'}]}
                                onPress={() => handleSocialMediaPress('instagram')}
                            >
                                <View style={[styles.socialMediaIconCircle, {backgroundColor: '#E4405F'}]}>
                                    <FontAwesomeIcon icon={faInstagram} size={22} color='#fff'/>
                                </View>
                                <Text style={styles.socialMediaLabel}>Instagram</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </ReAnimated.View>
            </View>

            {/* Social Media Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={socialModalVisible}
                onRequestClose={() => setSocialModalVisible(false)}
            >
                <Pressable
                    style={styles.modalContainer}
                    onPress={() => setSocialModalVisible(false)}
                >
                    <Animated.View
                        style={[
                            styles.modalContent,
                            {
                                transform: [{ translateY: modalTranslateY }]
                            }
                        ]}
                        {...panResponder.panHandlers}
                    >
                        {selectedPlatform && (
                            <>
                                {/* Swipe Indicator */}
                                <View style={styles.swipeIndicator} />

                                {/* Close Button */}
                                <TouchableOpacity
                                    style={styles.modalCloseIcon}
                                    onPress={() => setSocialModalVisible(false)}
                                >
                                    <FontAwesomeIcon
                                        icon={faTimes}
                                        size={20}
                                        color={theme.colors.textSecondary}
                                    />
                                </TouchableOpacity>

                                <View style={styles.modalHeader}>
                                    <View style={[
                                        styles.modalIconCircle,
                                        {backgroundColor: getPlatformInfo(selectedPlatform).color}
                                    ]}>
                                        <FontAwesomeIcon
                                            icon={getPlatformInfo(selectedPlatform).icon}
                                            size={22}
                                            color='#fff'
                                        />
                                    </View>
                                    <Text style={styles.modalTitle}>
                                        {getPlatformInfo(selectedPlatform).name}
                                    </Text>
                                    <Text style={styles.modalSubtitle}>
                                        {t('selectSchoolToFollow')}
                                    </Text>
                                </View>

                                <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                                    {platformLinks.map((link, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.schoolLinkCard}
                                            onPress={() => handleOpenLink(link.url)}
                                        >
                                            <View style={styles.schoolLinkContent}>
                                                <View style={[
                                                    styles.schoolLinkIcon,
                                                    {backgroundColor: `${getPlatformInfo(selectedPlatform).color}15`}
                                                ]}>
                                                    <FontAwesomeIcon
                                                        icon={getPlatformInfo(selectedPlatform).icon}
                                                        size={16}
                                                        color={getPlatformInfo(selectedPlatform).color}
                                                    />
                                                </View>
                                                <View style={styles.schoolLinkText}>
                                                    <Text style={styles.schoolLinkName}>{link.label}</Text>
                                                    {link.type === 'preschool' && (
                                                        <Text style={styles.schoolLinkBadge}>{t('preschool')}</Text>
                                                    )}
                                                </View>
                                            </View>
                                            <FontAwesomeIcon
                                                icon={faShareAlt}
                                                size={14}
                                                color={theme.colors.textSecondary}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        )}
                    </Animated.View>
                </Pressable>
            </Modal>
            {/* copyright with version and logo */}
            <View style={styles.copyrightContainer}>
                <Text style={styles.copyright}>
                    © {new Date().getFullYear()} Powered by{' '}
                </Text>
                <Animated.Image
                    source={schoolLogo}
                    style={styles.copyrightLogo}
                    resizeMode='contain'
                />
                {/* <Text style={styles.copyright}>
              {' '}
              {t('version')} {Config.APP.VERSION}
            </Text> */}
            </View>
        </SafeAreaView>
    );
}

const createStyles = (
    theme,
    fontSizes,
    isIPadDevice,
    responsiveFonts,
    responsiveSpacing
) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        settingsButton: {
            position: 'absolute',
            top: Platform.OS === 'android' ? 50 : 60,
            left: 20,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            ...createSmallShadow(theme),
        },
        scrollContainer: {
            flex: 1,
        },
        content: {
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: isIPadDevice ? responsiveSpacing.xl : 20,
            maxWidth: isIPadDevice ? 800 : '100%', // Limit content width on iPad
            alignSelf: 'center',
            width: '100%',
            paddingBottom: 10, // Extra padding for landscape scrolling
            minHeight: '100%', // Ensure content takes full height
        },
        logoContainer: {
            position: 'relative',
            width: isIPadDevice ? Math.min(width * 0.3, 300) : width * 0.8,
            height: isIPadDevice ? Math.min(height * 0.12, 150) : height * 0.15,
            marginBottom: isIPadDevice ? responsiveSpacing.lg : 5,
            alignItems: 'center',
            justifyContent: 'center',

        },
        logo: {
            width: '100%',
            height: '100%',
            ...createMediumShadow(theme),
        },
        branchLogoOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
        },
        secondaryLogo: {
            width: isIPadDevice ? Math.min(width * 0.2, 200) : width * 0.3,
            height: isIPadDevice ? Math.min(height * 0.08, 50) : height * 0.1,
        },
        title: {
            fontSize: isIPadDevice ? responsiveFonts.largeTitle : fontSizes.title,
            fontWeight: 'bold',
            color: theme.colors.primary,

            textAlign: 'center',
        },
        subtitle: {
            fontSize: isIPadDevice ? responsiveFonts.subtitle : fontSizes.body,
            color: theme.colors.textSecondary,
            marginBottom: isIPadDevice ? responsiveSpacing.lg : 10,
            textAlign: 'center',
            lineHeight: fontSizes.bodyLineHeight,
        },
        buttonsContainer: {
            width: '100%',
            alignItems: 'center',
        },
        roleRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: 5,
        },
        roleButton: {
            backgroundColor: theme.colors.surface,
            borderRadius: 15,
            paddingHorizontal: 15,
            paddingVertical: 10,
            marginBottom: 10,
            ...theme.shadows.small,
            marginLeft: 0,
            elevation: 5,
        },
        roleButtonHorizontal: {
            width: '48%',
            minHeight: 170,
        },
        iconContainer: {
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 10,
        },
        teacherIconContainer: {
            backgroundColor: 'rgba(0, 122, 255, 0.1)',
        },
        parentIconContainer: {
            backgroundColor: 'rgba(255, 149, 0, 0.1)',
        },
        roleText: {
            fontSize: fontSizes.body,
            fontWeight: '600',
            color: theme.colors.text,
            lineHeight: fontSizes.bodyLineHeight,
        },
        roleDescription: {
            fontSize: fontSizes.bodySmall,
            color: theme.colors.textSecondary,
            lineHeight: fontSizes.bodySmallLineHeight,
        },

        resourcesContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between', // Works well for 4 items (2x2 grid)
            width: '100%',
            marginVertical: 10,
        },
        resourceButton: {
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 10,
            marginBottom: 15,
            width: '48%',
            minHeight: 60,
            flexDirection: 'row',
            alignItems: 'center',
            ...theme.shadows.small,
            elevation: 5,
        },
        resourceIconContainer: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
        },
        resourceText: {
            fontSize: fontSizes.body,
            fontWeight: '500',
            color: theme.colors.text,
            lineHeight: fontSizes.bodyLineHeight,
            flex: 1,
            textAlign: 'left',
        },
        socialMediaSection: {
            width: '100%',
            paddingHorizontal: 10,
            marginBottom: 40,
        },
        sectionTitle: {
            fontSize: fontSizes.subtitle,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 10,
            textAlign: 'center',
        },
        socialMediaGrid: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 8,
        },
        socialMediaCard: {
            flex: 1,
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 100,
            ...theme.shadows.medium,
        },
        socialMediaIconCircle: {
            width: 50,
            height: 50,
            borderRadius: 25,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 8,
        },
        socialMediaLabel: {
            fontSize: fontSizes.small,
            fontWeight: '600',
            color: theme.colors.text,
            textAlign: 'center',
        },
        // Modal Styles
        modalContainer: {
            flex: 1,
            justifyContent: 'flex-end',
        },
        modalContent: {
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 8,
            paddingBottom: 20,
            paddingHorizontal: 16,
            maxHeight: '70%',
            ...theme.shadows.large,
        },
        swipeIndicator: {
            width: 40,
            height: 4,
            backgroundColor: theme.colors.border,
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: 8,
        },
        modalCloseIcon: {
            position: 'absolute',
            top: 12,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
        },
        modalHeader: {
            alignItems: 'center',
            marginBottom: 12,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        modalIconCircle: {
            width: 50,
            height: 50,
            borderRadius: 25,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 8,
        },
        modalTitle: {
            fontSize: fontSizes.subtitle,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 4,
        },
        modalSubtitle: {
            fontSize: fontSizes.small,
            color: theme.colors.textSecondary,
            textAlign: 'center',
        },
        modalScrollView: {
            maxHeight: 300,
        },
        schoolLinkCard: {
            backgroundColor: theme.colors.surface,
            borderRadius: 10,
            padding: 12,
            marginBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            ...theme.shadows.small,
        },
        schoolLinkContent: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        schoolLinkIcon: {
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
        },
        schoolLinkText: {
            flex: 1,
        },
        schoolLinkName: {
            fontSize: fontSizes.body,
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: 2,
        },
        schoolLinkBadge: {
            fontSize: fontSizes.small - 1,
            color: theme.colors.textSecondary,
            fontStyle: 'italic',
        },
        debugText: {
            fontSize: 10,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginBottom: 10,
            paddingHorizontal: 20,
            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        },
        copyrightContainer: {
            position: 'absolute',
            bottom: 5,
            left: 0,
            right: 0,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            paddingHorizontal: 10,
            flexWrap: 'wrap'
        },
        copyright: {
            fontSize: 16,
            color: theme.colors.textSecondary,
            textAlign: 'center',
        },
        copyrightLogo: {
            height: 30,
            width: 80, // Add width to maintain aspect ratio
            marginHorizontal: 2,
        },
    });
