import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Available languages
export const LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  my: {
    code: 'my',
    name: 'Myanmar',
    nativeName: 'မြန်မာ',
    flag: '🇲🇲',
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
  },
  th: {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    flag: '🇹🇭',
  },
};

// Translation strings
const translations = {
  en: {
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    ok: 'OK',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    filter: 'Filter',
    refresh: 'Refresh',

    // Navigation
    home: 'Home',
    dashboard: 'Dashboard',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',

    // Authentication
    login: 'Login',
    username: 'Username',
    password: 'Password',
    forgotPassword: 'Forgot Password?',

    // Dashboard
    teacher: 'Teacher',
    parent: 'Parent',
    student: 'Student',
    welcomeTo: 'Welcome to',

    // Academic
    assessments: 'Assessments',
    attendance: 'Attendance',
    timetable: 'Timetable',
    homework: 'Homework',
    behavior: 'BPS Management',
    discipline: 'Discipline',

    // Settings
    language: 'Language',
    theme: 'Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    notifications: 'Notifications',
    about: 'About',
    version: 'Version',

    // Messages
    noData: 'No data available',
    networkError: 'Network error. Please try again.',
    loginSuccess: 'Login successful',
    loginError: 'Login failed. Please check your credentials.',

    // Specific UI Elements
    parentDashboard: 'Parent Dashboard',
    teacherDashboard: 'Teacher Dashboard',
    yourChildren: 'Your Children',
    yourChild: 'Your Child',
    menu: 'Menu',
    addStudent: 'Add Student',
    deleteStudent: 'Delete Student',
    selectStudent: 'Select Student',
    noStudentSelected: 'No Student Selected',
    pleaseSelectStudent:
      'Please select a student first to view their information.',
    authenticationError: 'Authentication Error',
    unableToAuthenticate:
      'Unable to authenticate this student. Please contact support.',
    removeStudent: 'Remove Student',
    areYouSure: 'Are you sure you want to remove',
    studentRemoved: 'Student removed successfully',
    failedToRemove: 'Failed to remove student',
    addStudentAccount: 'Add Student Account',
    noStudentAccounts: 'No student accounts added yet',
    tapToAdd: "Tap the + button in the header to add your child's account",
    scrollForMore: 'Scroll for more →',
    selected: 'Selected',

    // Menu Items
    calendar: 'Calendar',
    health: 'Medical Reports',
    messages: 'Messages',

    // Alert Messages
    noStudents: 'No Students',
    pleaseAddStudent:
      'Please add a student account first to view notifications.',
    duplicateStudent: 'Duplicate Student',

    // Login Screen
    teacherId: 'Teacher ID',
    studentId: 'Student ID',
    pleaseEnterCredentials: 'Please enter both username and password',
    studentAccountExists: 'This student account has already been added.',
    studentAccountAdded: 'Student account added successfully',
    failedToSaveStudent: 'Failed to save student account',
    loginSuccessful: 'Login Successful',
    welcomeMessage:
      'Welcome {name}! You can now access the calendar and other school resources.',
    loginFailed: 'Login Failed',
    networkConnectionError:
      'Network connection error. Please check your internet connection.',
    unableToConnectServer:
      'Unable to connect to server. Please try again later.',
    connectionTimeout:
      'Connection timeout. Please check your internet connection and try again.',
    unknownError: 'Unknown error',
    failedToCompleteLogin: 'Failed to complete login process',

    // Messaging
    enableNotifications: 'Enable Notifications',
    notificationPermissionMessage:
      "Would you like to receive important updates about your child's education? This includes grades, attendance, and school announcements.",
    notNow: 'Not Now',

    // Performance Monitor
    continue: 'Continue',
    forceRestart: 'Force Restart',

    // Diagnostics
    diagnosticsError: 'Diagnostics Error',
    unableToRunDiagnostics:
      'Unable to run diagnostics. Please restart the app.',
    navigationDiagnostics: 'Navigation Diagnostics',
    dataCleared: 'Data Cleared',
    clearDataRestart: 'Clear Data & Restart',
    allDataCleared:
      'All user data has been cleared. Please restart the app and log in again.',
    deviceStorageError:
      'The app is unable to access device storage. Please restart the app and try again.',
    noUserAccountsFound:
      'No user accounts found. Please log in as a teacher/student or add a student account through the parent section.',

    // Common UI
    typeMessage: 'Type a message...',
    available: 'Available',
    notAvailable: 'Not Available',
    enabled: 'Enabled',
    disabled: 'Disabled',
    debugInfo: 'Debug Info (App Review)',
    platform: 'Platform',
    dummyData: 'Dummy Data',
    networkTimeout: 'Network Timeout',
    deviceToken: 'Device Token',

    // Modal and Dialog
    confirm: 'Confirm',
    step: 'Step',
    of: 'of',

    // Empty States
    somethingWentWrong: 'Something went wrong',
    pleaseTryAgainLater: 'Please try again later',
    retry: 'Retry',

    // Settings Screen
    developedBy: 'Developed by EduNova Myanmar',

    // BPS Notifications
    positiveBehaviorRecognition: 'Positive Behavior Recognition',
    behaviorNotice: 'Behavior Notice',
    points: 'points',

    // File Upload
    fileTooLarge: 'File Too Large',
    pleaseSelectSmallerFile: 'Please select a file smaller than',
    failedToSelectImage: 'Failed to select image',
    uploadFunctionNotProvided: 'Upload function not provided',
    fileUploadedSuccessfully: 'File uploaded successfully!',
    uploadFailed: 'Upload Failed',
    failedToUploadFile: 'Failed to upload file. Please try again.',

    // Validation
    packageJsonNotFound: 'package.json not found',
    nameIsRequired: 'name is required',
    versionIsRequired: 'version is required',
    invalidJson: 'Invalid JSON',
    pleaseFix: 'Please fix the errors before proceeding.',
    pleaseReview:
      'Please review the warnings. The app may still work but some configurations need attention.',

    // Home Screen
    chooseYourRole: 'Choose your role to continue',
    schoolResources: 'School Resources',
    connectWithUs: 'Connect with Us',

    // Role Descriptions
    teacherDescription:
      'Access teaching tools, manage classes, and track student progress',
    parentDescription:
      "Monitor your child's progress, communicate with teachers, and stay updated",
    studentDescription:
      'View assignments, check grades, and access learning materials',

    // Menu Items
    aboutUs: 'About Us',
    contactUs: 'Contact Us',
    faq: 'FAQ',

    // Settings Screen
    darkThemeEnabled: 'Dark theme enabled',
    lightThemeEnabled: 'Light theme enabled',
    notificationsTitle: 'Notifications',
    pushNotifications: 'Push Notifications',
    notificationEnabled: 'Enabled',
    notificationDisabled: 'Disabled',
    notificationSound: 'Sound',
    playSoundForNotifications: 'Play sound for notifications',
    notificationVibration: 'Vibration',
    vibrateForNotifications: 'Vibrate for notifications',
    notificationTypes: 'Notification Types',
    gradesNotification: 'Grades',
    newGradesAndUpdates: 'New grades and academic updates',
    attendanceNotification: 'Attendance',
    attendanceReminders: 'Attendance reminders and updates',
    homeworkNotification: 'Homework',
    assignmentDueDates: 'Assignment due dates and updates',
    behaviorPointsNotification: 'Behavior Points',
    bpsUpdates: 'BPS updates and behavior notifications',
    emergencyAlerts: 'Emergency Alerts',
    importantAnnouncements: 'Important school announcements',
    permissionRequired: 'Permission Required',
    enableNotificationsMessage:
      'Please enable notifications in your device settings to receive important updates.',
    openSettings: 'Open Settings',

    // Academic specific
    totalPoints: 'Total Points',
    totalRecords: 'Total Records',
    behaviorPoints: 'Behavior Points',
    positive: 'Positive',
    negative: 'Negative',
    detentions: 'Detentions',
    served: 'Served',
    notServed: 'Not Served',
    detentionsCompleted: 'Detentions completed',
    pendingDetentions: 'Pending detentions',
    noDetentionsFound: 'No detentions found',
    noServedDetentions: 'No served detentions to display',
    noPendingDetentions: 'No pending detentions to display',
    noBehaviorPoints: 'No behavior points found',
    noPositiveBehavior: 'No positive behavior points to display',
    noNegativeBehavior: 'No negative behavior points to display',

    // Common actions
    viewTimetable: 'Timetable',
    manageBPS: 'Manage BPS',
    quickActions: 'Quick Actions',
    features: 'Features',
    appPreferences: 'App preferences and notifications',
    homeroom: 'Homeroom',
    // Time and dates
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    thisMonth: 'This Month',

    // Status
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',
    pending: 'Pending',
    completed: 'Completed',
    submitted: 'Submitted',
    overdue: 'Overdue',

    // New Features
    myProfile: 'My Profile',
    personalInformation: 'Personal Information',
    workInformation: 'Work Information',
    rolesResponsibilities: 'Roles & Responsibilities',
    fullName: 'Full Name',
    employeeId: 'Employee ID',
    email: 'Email',
    phone: 'Phone',
    position: 'Position',
    department: 'Department',
    branch: 'Branch',
    joinDate: 'Join Date',
    notProvided: 'Not provided',
    loadingProfile: 'Loading profile...',
    viewEditProfile: 'View and edit profile information',
    areYouSureLogout: 'Are you sure you want to logout?',

    // Coming Soon
    comingSoon: 'Coming Soon',
    reports: 'Reports',
    materials: 'Materials',
    analytics: 'Analytics',
    library: 'Library',
    analyticsStats: 'Analytics & Stats',
    resourcesFiles: 'Resources & Files',

    // Reports
    myReports: 'My Reports',
    staffReports: 'Staff Reports',
    loadingReports: 'Loading Reports...',
    failedToLoadReports: 'Failed to load reports',
    failedToLoadReportData: 'Failed to load report data',
    failedToLoadClasses: 'Failed to load classes',
    noReportData: 'No Report Data',
    noReportDataMessage: 'No report data available for the selected period',
    selectClassAndReport: 'Please select a class and report type',
    selectClass: 'Select Class',
    summary: 'Summary',
    visualization: 'Visualization',

    // Report Types - Student
    attendance: 'Attendance',
    grades: 'Grades',
    bps: 'Behavior Points',
    homework: 'Homework',

    // Report Types - Staff
    classAttendance: 'Class Attendance',
    classAssessment: 'Class Assessment',
    behavioralAnalytics: 'Behavioral Analytics',
    homeworkAnalytics: 'Homework Analytics',

    // Attendance Stats
    totalDays: 'Total Days',
    present: 'Present',
    absent: 'Absent',
    attendanceRate: 'Attendance Rate',
    totalStudents: 'Total Students',
    presentCount: 'Present Count',
    absentCount: 'Absent Count',

    // Grades Stats
    totalSubjects: 'Total Subjects',
    averageGrade: 'Average Grade',
    highestGrade: 'Highest Grade',
    lowestGrade: 'Lowest Grade',
    passingGrade: 'Passing Grade',
    failingGrade: 'Failing Grade',

    // BPS Stats
    totalPoints: 'Total Points',
    positivePoints: 'Positive Points',
    negativePoints: 'Negative Points',
    netPoints: 'Net Points',
    totalRecords: 'Total Records',
    positiveRecords: 'Positive Records',
    negativeRecords: 'Negative Records',

    // Homework Stats
    totalHomework: 'Total Homework',
    completed: 'Completed',
    pending: 'Pending',
    completionRate: 'Completion Rate',
    totalAssigned: 'Total Assigned',
    totalSubmissions: 'Total Submissions',
    completedSubmissions: 'Completed Submissions',

    // Library Stats
    totalBooksRead: 'Total Books',
    booksReturned: 'Books Returned',
    currentlyBorrowed: 'Currently Borrowed',
    readingHours: 'Reading Hours',
    booksOverdue: 'Books Overdue',
    favoriteGenre: 'Favorite Genre',
    teachingPerformance: 'View teaching performance metrics',
    featureComingSoon: 'Feature coming soon!',

    // Library specific
    libraryData: 'Library Data',
    borrowedBooks: 'Borrowed Books',
    overdueItems: 'Overdue Items',
    borrowingLimits: 'Borrowing Limits',

    // Families Policy & Age Verification
    ageVerification: 'Age Verification',
    ageVerificationDescription:
      'Please verify your age to ensure we provide appropriate content and comply with privacy regulations.',
    birthDate: 'Birth Date',
    invalidAge: 'Invalid Age',
    pleaseEnterValidBirthDate: 'Please enter a valid birth date.',
    parentalConsentRequired: 'Parental Consent Required',
    parentalConsentRequiredMessage:
      'Users under 13 require parental consent to use this app.',
    ageVerificationError:
      'An error occurred during age verification. Please try again.',
    ageVerificationPrivacyNotice:
      'Your age information is used only for compliance with privacy laws and is not shared with third parties.',
    ageVerificationDisclaimer:
      'By continuing, you confirm that the information provided is accurate.',
    verifying: 'Verifying...',
    verify: 'Verify',

    // Parental Consent
    parentalConsent: 'Parental Consent',
    parentEmailRequired: 'Parent Email Required',
    parentEmailDescription:
      "We need a parent or guardian's email address to obtain consent for data collection.",
    parentGuardianEmail: 'Parent/Guardian Email',
    enterParentEmail: "Enter parent's email address",
    pleaseEnterParentEmail:
      "Please enter a parent or guardian's email address.",
    pleaseEnterValidEmail: 'Please enter a valid email address.',
    parentalConsentDescription:
      'As required by law, we need parental consent before collecting any personal information from users under 13.',
    dataCollectionNotice: 'Data Collection Notice',
    dataCollectionNoticeText:
      'We collect only the minimum information necessary to provide educational services, including student name, grade information, and academic progress.',
    dataUsage: 'How We Use Data',
    dataUsageText:
      'Student data is used exclusively for educational purposes and is never sold or shared with third parties for commercial purposes.',
    parentalRights: 'Your Rights as a Parent',
    parentalRightsText:
      "You have the right to review, modify, or delete your child's information at any time. You may also withdraw consent, though this may limit app functionality.",
    parentalConsentAgreement:
      "I consent to the collection and use of my child's information as described above.",
    grantConsent: 'Grant Consent',
    consentGranted: 'Consent Granted',
    consentGrantedDescription:
      'Thank you for providing consent. Your child can now safely use the app.',
    verificationEmailSent: 'A verification email has been sent to {email}.',
    coppaComplianceNotice:
      "This app complies with COPPA (Children's Online Privacy Protection Act) and other applicable privacy laws.",
    parentalConsentError:
      'An error occurred while processing parental consent. Please try again.',

    // Assignment & Homework Management
    assignments: 'Assignments',
    assignmentsHomework: 'Assignments & Homework',
    createHomework: 'Create Homework',
    homeworkTitle: 'Homework Title',
    homeworkDescription: 'Homework Description',
    enterHomeworkTitle: 'Enter homework title...',
    enterHomeworkDescription: 'Enter homework description and instructions...',
    selectClass: 'Select Class',
    selectStudents: 'Select Students',
    selectDeadline: 'Select Deadline',
    setDeadline: 'Set Deadline',
    addAssignmentFile: 'Add Assignment File',
    enterFileUrl: 'Enter file URL (e.g., https://example.com/file.pdf)...',
    pleaseEnterHomeworkTitle: 'Please enter homework title',
    pleaseEnterHomeworkDescription: 'Please enter homework description',
    pleaseSelectClass: 'Please select a class',
    pleaseSelectStudents: 'Please select at least one student',
    pleaseSelectDeadline: 'Please select deadline',
    homeworkCreatedSuccessfully: 'Homework assignment created successfully!',
    failedToCreateHomework: 'Failed to create homework assignment',
    failedToFetchClasses: 'Failed to fetch classes',
    loadingClasses: 'Loading classes...',
    loadingAssignments: 'Loading assignments data...',

    // Assignment Status
    assignmentCompleted: 'Completed',
    assignmentOverdue: 'Overdue',
    assignmentDueToday: 'Due Today',
    assignmentPending: 'Pending',
    markAsDone: 'Mark as Done',
    markDone: 'Mark Done',
    alreadyCompleted: 'Already Completed',
    assignmentMarkedCompleted: 'Assignment marked as completed!',
    assignmentAlreadySubmitted:
      'This assignment has already been marked as completed.',
    failedToMarkDone: 'Failed to mark assignment as done',
    confirmMarkDone: 'Are you sure you want to mark "{title}" as completed?',

    // Assignment Display
    showAll: 'Show All',
    showCompleted: 'Show Completed',
    noCompletedAssignments: 'No completed assignments',
    noPendingAssignments: 'No pending assignments',
    untitledAssignment: 'Untitled Assignment',
    unknownSubject: 'Unknown Subject',
    noDate: 'No date',

    // File Upload & Management (Additional)
    fileUploadWarning:
      'Homework assignment created but file upload failed. You can upload files later.',

    // Messaging & Communication (New Keys)
    conversation: 'Conversation',
    enterMessage: 'Enter your message...',
    sendMessage: 'Send Message',
    loadingMessages: 'Loading messages...',
    failedToLoadMessages: 'Failed to load messages',
    failedToSendMessage: 'Failed to send message',
    messageCopied: 'Message copied to clipboard',
    failedToCopyMessage: 'Failed to copy message',

    // Message Actions
    editMessage: 'Edit Message',
    deleteMessage: 'Delete Message',
    deleteMessages: 'Delete Messages',
    copyMessage: 'Copy Message',
    selectMessage: 'Select Message',
    clearMessage: 'Clear Message',
    messageDeleted: 'Message deleted successfully',
    messageEdited: 'Message edited successfully',
    messageEditedSuccessfully: 'Message edited successfully',
    messageCleared: 'Message content cleared successfully',
    messagesDeletedSuccessfully: '{count} message{plural} deleted successfully',
    failedToDeleteMessage: 'Failed to delete message',
    failedToDeleteMessages: 'Failed to delete messages',
    failedToEditMessage: 'Failed to edit message',
    failedToClearMessage: 'Failed to clear message',

    // Message Confirmations
    deleteMessageConfirm:
      'Are you sure you want to delete this message? This action cannot be undone.',
    clearMessageConfirm:
      'This will replace the message content with "[Message Deleted]". The message will remain visible but the content will be cleared.',
    deleteMessagesConfirm:
      'Are you sure you want to delete {count} message{plural}?',
    bulkDeleteSuccess: '{count} message{plural} deleted successfully',
    failedToBulkDelete: 'Failed to delete messages',

    // Conversation Actions
    leaveConversation: 'Leave Conversation',
    deleteConversation: 'Delete Conversation',
    leaveConversationConfirm:
      'Are you sure you want to leave this conversation? You will no longer receive messages from this conversation.',
    deleteConversationConfirm:
      'Are you sure you want to delete this entire conversation? This will permanently delete all messages and cannot be undone.',
    leftConversationSuccess: 'Left conversation successfully',
    conversationDeletedSuccess: 'Conversation deleted successfully',
    failedToLeaveConversation: 'Failed to leave conversation',
    failedToDeleteConversation: 'Failed to delete conversation',

    // File Attachments (New Keys)
    fileAttachmentsComingSoon: 'File attachments will be available soon',
    attachmentPressed: 'Attachment pressed',

    // General UI Elements (New Keys)
    copy: 'Copy',
    select: 'Select',
    clear: 'Clear',
    leave: 'Leave',
    send: 'Send',

    // Authentication & Connection
    authCodeMissing: 'Authentication code is missing',
    failedToConnect: 'Failed to connect to server',
    connectionError: 'Connection Error',
    serverError: 'Server Error',
    incorrectCredentials: 'Incorrect {loginType} ID or password!',

    // Home Screen Navigation & Diagnostics

    dataClearedMessage:
      'All user data has been cleared. Please restart the app and log in again.',
    failedToClearData: 'Failed to clear data. Please restart the app manually.',
    navigationError: 'Navigation Error',
    unableToAccessTeacherScreen:
      'Unable to access teacher screen. This might be due to corrupted data.',
    unableToAccessParentScreen:
      'Unable to access parent screen. Please try again.',
    goToLogin: 'Go to Login',
    runDiagnostics: 'Run Diagnostics',
    accessScreen: 'Access {screenName}',
    schoolInfoAccessMessage:
      'To view school information, you can either login directly or add a student account.',
    loginAsStudent: 'Login as Student',

    // Social Media
    connectWithUsSocial: 'Connect with us on social media!',
    facebookComingSoon: 'Facebook page coming soon!',
    twitterComingSoon: 'Twitter page coming soon!',
    instagramComingSoon: 'Instagram page coming soon!',
    youtubeComingSoon: 'YouTube channel coming soon!',

    // Teacher Screen
    confirmLogout: 'Are you sure you want to logout?',
    scheduleAttendance: 'Schedule & Attendance',
    assignmentsReview: 'Assignments & Review',
    chatCommunication: 'Chat & Communication',
    myCalendar: 'My Calendar',
    personalSchoolEvents: 'Personal & School Events',
    teacherStudentWellbeing: 'Teacher/Student Well-being',
    classManagement: 'Class Management',
    selectBranch: 'Select Branch',
    academicYear: 'Academic Year',
    week: 'Week',
    id: 'ID',

    // Parent Screen
    failedToAccessCalendar: 'Failed to access calendar',
    soon: 'Soon',

    // Student Messaging Screen
    failedToLoadConversations: 'Failed to load conversations',
    failedToMarkAsRead: 'Failed to mark conversation as read',
    failedToSearchMessages: 'Failed to search messages',
    searchConversationsMessages: 'Search conversations and messages...',
    loadingConversations: 'Loading conversations...',

    // Notification Screen
    clearAllNotifications: 'Clear All Notifications',
    clearAllNotificationsConfirm:
      'Are you sure you want to clear all notifications? This action cannot be undone.',
    allNotificationsCleared: 'All notifications have been cleared.',
    failedToClearNotifications: 'Failed to clear notifications.',
    allNotificationsMarkedRead: 'All notifications marked as read.',
    noUnreadNotifications: "You're all caught up! No unread notifications.",
    noNotificationsYet:
      "You'll see your notifications here when you receive them.",
    loadingNotifications: 'Loading notifications...',

    // Calendar Screen
    loginRequired: 'Login Required',
    loginRequiredCalendarMessage:
      'Please log in as a teacher or student to access the calendar.',
    schoolConfigNotFound: 'School configuration not found',
    failedToInitializeCalendar: 'Failed to initialize calendar',
    failedToLoadCalendarEvents: 'Failed to load calendar events',
    noDescription: 'No description',
    time: 'Time',
    type: 'Type',
    location: 'Location',
    calendarServiceNotInitialized: 'Calendar service not initialized',
    accessDenied: 'Access Denied',
    calendarTestStaffOnly:
      'Calendar connection test is only available for staff users',
    noBranchIdForTesting: 'No branch ID available for testing',
    testingCalendarConnection: 'Testing Calendar Connection',
    testingCalendarConnectionMessage:
      'Testing Google Calendar connection... Please wait.',
    loadingCalendarEvents: 'Loading calendar events...',
    signInToGoogleCalendar: 'Sign in to Google Calendar to see more events.',
    checkBackForNewEvents: 'Check back later for new events.',

    // About Us Screen
    unableToLoadAboutUs:
      'Unable to load About Us information. Please try again.',
    loadingAboutUs: 'Loading About Us information...',
    lastUpdated: 'Last updated:',
    noAboutUsInfo: 'No About Us information available at the moment.',

    // Attendance Screen
    loadingAttendanceData: 'Loading attendance data...',
    attendanceSummary: 'Attendance Summary',
    dailyStatistics: 'Daily Statistics',
    absentRecords: 'Absent Records',
    lateRecords: 'Late Records',

    // Behavior Screen
    authenticationCodeMissing: 'Authentication code is missing',
    overviewStatistics: 'Overview & Statistics',
    records: 'Records',

    noPositiveBehaviorPoints: 'No positive behavior points to display',
    noNegativeBehaviorPoints: 'No negative behavior points to display',

    // Contacts Screen
    unableToLoadContactInfo:
      'Unable to load contact information. Please try again.',
    address: 'Address',
    website: 'Website',

    // FAQ Screen
    unableToLoadFAQInfo: 'Unable to load FAQ information. Please try again.',
    question: 'Question',
    questions: 'Questions',

    // Grades Screen
    loadingFormativeGrades: 'Loading formative grades...',
    noLifeSkillsGradesForSubject:
      'No Life Skills grades available for {subject}',
    noLifeSkillsGrades: 'No Life Skills grades available',
    summative: 'Summative',
    lifeSkills: 'Life Skills',
    notGraded: 'Not Graded',

    // Library Screen
    authenticationRequired: 'Authentication required',
    failedToLoadLibraryData: 'Failed to load library data',
    failedToConnectLibrarySystem: 'Failed to connect to library system',
    networkErrorOccurred: 'Network error occurred',
    overview: 'Overview',
    borrowed: 'Borrowed',
    history: 'History',

    // Splash Screen
    inspiringBrilliance: 'Inspiring Brilliance',
    buildingBrighterFutures: 'Building Brighter Futures',

    // Teacher Attendance Screen
    failedToLoadAttendanceDetails: 'Failed to load attendance details',
    networkErrorLoadingAttendance:
      'Network error occurred while loading attendance',
    failedToLoadStudentsData: 'Failed to load students data',
    networkErrorLoadingStudents:
      'Network error occurred while loading students',
    incompleteAttendance: 'Incomplete Attendance',
    pleaseMarkAttendanceForAllStudents:
      'Please mark attendance for all students. {count} student(s) remaining.',
    attendanceSubmittedSuccessfullyDemo:
      'Attendance has been submitted successfully! (Demo Mode)',
    attendanceUpdatedSuccessfully: 'Attendance updated successfully!',
    attendanceSubmittedSuccessfully: 'Attendance submitted successfully!',
    failedToSubmitAttendance: 'Failed to submit attendance',

    updateAttendance: 'Update Attendance',
    takeAttendance: 'Take Attendance',
    loadingStudents: 'Loading students...',

    submitAttendance: 'Submit Attendance',

    // Teacher BPS Screen
    failedToFetchBPSData: 'Failed to fetch BPS data',
    pleaseSelectStudentAndBehavior:
      'Please select at least one student and at least one behavior',
    noBranchInformationAvailable: 'No branch information available',
    partialSuccess: 'Partial Success',
    recordsCreatedPartially:
      '{successful} out of {total} records created successfully.',

    unknownTeacher: 'Unknown Teacher',
    period: 'Period',

    // Workspace Screen
    failedToLoadWorkspace: 'Failed to load workspace. Please try again.',
    failedToLoadFolderContents:
      'Failed to load folder contents. Please try again.',
    failedToLoadRecentFiles: 'Failed to load recent files. Please try again.',

    // Assignment Detail Screen
    pleaseProvideResponse:
      'Please provide either a written response, attach a file, or add a file link',
    failedToUpdateAssignment: 'Failed to update assignment',
    failedToSubmitAssignment: 'Failed to submit assignment',
    alreadySubmitted: 'Already Submitted',
    assignmentAlreadySubmitted: 'This assignment has already been submitted.',
    contactTeacher: 'Contact Teacher',
    contactTeacherMessage:
      'Please contact your teacher if you need to update your submission.',
    failedToConnectServer: 'Failed to connect to server: {error}',
    updateAssignment: 'Update Assignment',
    submitAssignment: 'Submit Assignment',
    confirmUpdateAssignment: 'Are you sure you want to update this assignment?',
    confirmSubmitAssignment: 'Are you sure you want to submit this assignment?',
    update: 'Update',
    submit: 'Submit',
    unableToOpenFileLink: 'Unable to open file link',

    // Create Conversation Screen
    failedToLoadUsers: 'Failed to load users',
    pleaseEnterConversationTopic: 'Please enter a conversation topic',
    pleaseSelectAtLeastOneUser: 'Please select at least one user',
    conversationCreatedSuccessfully: 'Conversation created successfully',
    failedToCreateConversation: 'Failed to create conversation',
    usersSelected: '{count} user(s) selected',
    enterConversationTopic: 'Enter conversation topic...',
    searchUsers: 'Search users...',
    loadingUsers: 'Loading users...',

    // Student Health Screen
    failedToLoadHealthData: 'Failed to load health data. Please try again.',
    notSpecified: 'Not specified',
    loadingHealthData: 'Loading health data...',
    visitRecords: 'Visit Records',
    healthInfo: 'Health Info',
    medicalConditions: 'Medical Conditions',
    regularMedication: 'Regular Medication',
    visionAndHearing: 'Vision & Hearing',
    visionProblems: 'Vision Problems',
    lastVisionCheck: 'Last Vision Check',
    hearingIssues: 'Hearing Issues',
    allergiesAndFood: 'Allergies & Food',
    foodConsiderations: 'Food Considerations',
    allergies: 'Allergies',
    allergySymptoms: 'Allergy Symptoms',
    firstAidInstructions: 'First Aid Instructions',
    allowedMedications: 'Allowed Medications',
    emergencyContacts: 'Emergency Contacts',
    primaryContact: 'Primary Contact',
    primaryPhone: 'Primary Phone',
    secondaryContact: 'Secondary Contact',
    secondaryPhone: 'Secondary Phone',
  },
  my: {
    // Common
    loading: 'ဖွင့်နေသည်...',
    error: 'အမှား',
    success: 'အောင်မြင်သည်',
    cancel: 'ပယ်ဖျက်',
    ok: 'ကောင်းပြီ',
    save: 'သိမ်းဆည်း',
    delete: 'ဖျက်',
    edit: 'ပြင်ဆင်',
    back: 'နောက်သို့',
    next: 'ရှေ့သို့',
    previous: 'ယခင်',
    search: 'ရှာဖွေ',
    filter: 'စစ်ထုတ်',
    refresh: 'ပြန်လည်ဖွင့်',

    // Navigation
    home: 'ပင်မစာမျက်နှာ',
    dashboard: 'ထိန်းချုပ်မှုစာမျက်နှာ',
    settings: 'ဆက်တင်များ',
    profile: 'ကိုယ်ရေးအချက်အလက်',
    logout: 'ထွက်',

    // Authentication
    login: 'ဝင်ရောက်',
    username: 'အသုံးပြုသူအမည်',
    password: 'စကားဝှက်',
    forgotPassword: 'စကားဝှက်မေ့နေသလား?',

    // Dashboard
    teacher: 'ဆရာ/ဆရာမ',
    parent: 'မိဘ',
    student: 'ကျောင်းသား/သူ',
    welcomeTo: 'မှကြိုဆိုပါတယ်။',

    // Academic
    assessments: 'အမှတ်များ',
    attendance: 'တက်ရောက်မှု',
    timetable: 'အချိန်ဇယား',
    homework: 'စာတွေ',
    behavior: 'BPS စီမံခန့်ခွဲမှု',
    discipline: 'စည်းကမ်း',

    // Settings
    language: 'ဘာသာစကား',
    theme: 'အပြင်အဆင်',
    lightMode: 'အလင်းရောင်',
    darkMode: 'အမှောင်ရောင်',
    notifications: 'အကြောင်းကြားချက်များ',
    about: 'အကြောင်း',
    version: 'ဗားရှင်း',

    // Messages
    noData: 'ဒေတာမရှိပါ',
    networkError: 'ကွန်ယက်အမှား။ ပြန်လည်ကြိုးစားပါ။',
    loginSuccess: 'အောင်မြင်စွာဝင်ရောက်ပြီး',
    loginError: 'ဝင်ရောက်မှုမအောင်မြင်ပါ။ အချက်အလက်များကိုစစ်ဆေးပါ။',

    // Specific UI Elements
    parentDashboard: 'မိဘထိန်းချုပ်မှုစာမျက်နှာ',
    teacherDashboard: 'ဆရာ/ဆရာမထိန်းချုပ်မှုစာမျက်နှာ',
    yourChildren: 'သင့်ကလေးများ',
    yourChild: 'သင့်ကလေး',
    menu: 'မီနူး',
    addStudent: 'ကျောင်းသားထည့်ရန်',
    deleteStudent: 'ကျောင်းသားဖျက်ရန်',
    selectStudent: 'ကျောင်းသားရွေးရန်',
    noStudentSelected: 'ကျောင်းသားမရွေးထားပါ',
    pleaseSelectStudent:
      'အချက်အလက်များကြည့်ရှုရန် ကျောင်းသားတစ်ဦးကို ရွေးချယ်ပါ။',
    authenticationError: 'အထောက်အထားစိစစ်မှုအမှား',
    unableToAuthenticate:
      'ဤကျောင်းသားကို အထောက်အထားစိစစ်၍မရပါ။ ပံ့ပိုးကူညီမှုကို ဆက်သွယ်ပါ။',
    removeStudent: 'ကျောင်းသားဖယ်ရှားရန်',
    areYouSure: 'သင်သေချာပါသလား',
    studentRemoved: 'ကျောင်းသားကို အောင်မြင်စွာဖယ်ရှားပြီး',
    failedToRemove: 'ကျောင်းသားဖယ်ရှားမှု မအောင်မြင်ပါ',
    addStudentAccount: 'ကျောင်းသားအကောင့်ထည့်ရန်',
    noStudentAccounts: 'ကျောင်းသားအကောင့်များ မထည့်ရသေးပါ',
    tapToAdd: 'သင့်ကလေး၏အကောင့်ထည့်ရန် ခေါင်းစီးရှိ + ခလုတ်ကို နှိပ်ပါ',
    scrollForMore: 'နောက်ထပ်ကြည့်ရန် လှိမ့်ပါ →',
    selected: 'ရွေးချယ်ထားသည်',

    // Menu Items
    calendar: 'ပြက္ခဒိန်',
    health: 'ဆေးဘက်ဆိုင်ရာအစီရင်ခံစာများ',
    messages: 'စာများ',

    // Alert Messages
    noStudents: 'ကျောင်းသားများမရှိပါ',
    pleaseAddStudent:
      'အကြောင်းကြားချက်များကြည့်ရန် ကျောင်းသားအကောင့်တစ်ခုကို ဦးစွာထည့်ပါ။',
    duplicateStudent: 'ကျောင်းသားပွားနေသည်',

    // Login Screen
    teacherId: 'ဆရာ/ဆရာမ ID',
    studentId: 'ကျောင်းသား ID',
    pleaseEnterCredentials: 'အသုံးပြုသူအမည်နှင့် စကားဝှက်နှစ်ခုလုံးကို ထည့်ပါ',
    studentAccountExists: 'ဤကျောင်းသားအကောင့်ကို ထည့်ပြီးပါပြီ။',
    studentAccountAdded: 'ကျောင်းသားအကောင့်ကို အောင်မြင်စွာထည့်ပြီး',
    failedToSaveStudent: 'ကျောင်းသားအကောင့်သိမ်းဆည်းမှု မအောင်မြင်ပါ',
    loginSuccessful: 'အကောင့်ဝင်ရောက်မှု အောင်မြင်ပါပြီ',
    welcomeMessage:
      'ကြိုဆိုပါတယ် {name}! ယခုအခါ ပြက္ခဒိန်နှင့် အခြားကျောင်းအရင်းအမြစ်များကို အသုံးပြုနိုင်ပါပြီ။',
    loginFailed: 'အကောင့်ဝင်ရောက်မှု မအောင်မြင်ပါ',
    networkConnectionError:
      'ကွန်ယက်ချိတ်ဆက်မှုအမှား။ သင့်အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပါ။',
    unableToConnectServer: 'ဆာဗာနှင့် ချိတ်ဆက်မရပါ။ နောက်မှ ထပ်စမ်းကြည့်ပါ။',
    connectionTimeout:
      'ချိတ်ဆက်မှု အချိန်ကုန်ပါပြီ။ သင့်အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ထပ်စမ်းကြည့်ပါ။',
    unknownError: 'မသိသောအမှား',
    failedToCompleteLogin: 'အကောင့်ဝင်ရောက်မှုလုပ်ငန်းစဉ် မပြီးမြောက်ပါ',

    // Messaging
    enableNotifications: 'အကြောင်းကြားစာများကို ဖွင့်ပါ',
    notificationPermissionMessage:
      'သင့်ကလေး၏ပညာရေးနှင့်ပတ်သက်သော အရေးကြီးသောအချက်အလက်များကို လက်ခံလိုပါသလား? ဤတွင် အမှတ်များ၊ တက်ရောက်မှု၊ နှင့် ကျောင်းကြေညာများ ပါဝင်ပါသည်။',
    notNow: 'ယခုမဟုတ်ပါ',

    // Performance Monitor
    continue: 'ဆက်လက်လုပ်ဆောင်ပါ',
    forceRestart: 'အတင်းပြန်စတင်ပါ',

    // Diagnostics
    diagnosticsError: 'စစ်ဆေးမှုအမှား',
    unableToRunDiagnostics: 'စစ်ဆေးမှုမလုပ်နိုင်ပါ။ အက်ပ်ကို ပြန်စတင်ပါ။',
    navigationDiagnostics: 'လမ်းညွှန်မှုစစ်ဆေးမှု',
    dataCleared: 'ဒေတာရှင်းလင်းပြီး',
    clearDataRestart: 'ဒေတာရှင်းလင်းပြီး ပြန်စတင်ပါ',
    allDataCleared:
      'အသုံးပြုသူဒေတာအားလုံးကို ရှင်းလင်းပြီးပါပြီ။ အက်ပ်ကို ပြန်စတင်ပြီး ထပ်မံအကောင့်ဝင်ပါ။',
    deviceStorageError:
      'အက်ပ်သည် စက်ပစ္စည်းသိုလှောင်မှုကို အသုံးပြုမရပါ။ အက်ပ်ကို ပြန်စတင်ပြီး ထပ်စမ်းကြည့်ပါ။',
    noUserAccountsFound:
      'အသုံးပြုသူအကောင့်များ မတွေ့ပါ။ ဆရာ/ကျောင်းသားအဖြစ် အကောင့်ဝင်ပါ သို့မဟုတ် မိဘကဏ္ဍမှတစ်ဆင့် ကျောင်းသားအကောင့်ထည့်ပါ။',

    // Common UI
    typeMessage: 'စာတစ်စောင်ရိုက်ပါ...',
    available: 'ရရှိနိုင်သည်',
    notAvailable: 'မရရှိနိုင်ပါ',
    enabled: 'ဖွင့်ထားသည်',
    disabled: 'ပိတ်ထားသည်',
    debugInfo: 'အမှားရှာမှုအချက်အလက် (အက်ပ်ပြန်လည်သုံးသပ်မှု)',
    platform: 'ပလပ်ဖောင်း',
    dummyData: 'နမူနာဒေတာ',
    networkTimeout: 'ကွန်ယက်အချိန်ကုန်',
    deviceToken: 'စက်ပစ္စည်းတိုကင်',

    // Modal and Dialog
    confirm: 'အတည်ပြုပါ',
    step: 'အဆင့်',
    of: 'မှ',

    // Empty States
    somethingWentWrong: 'တစ်ခုခုမှားယွင်းနေပါသည်',
    pleaseTryAgainLater: 'နောက်မှ ထပ်စမ်းကြည့်ပါ',
    retry: 'ထပ်စမ်းကြည့်ပါ',

    // Settings Screen
    developedBy: 'EduNova Myanmar မှ ဖန်တီးထားသည်',

    // BPS Notifications
    positiveBehaviorRecognition: 'အပြုသဘောဆောင်သော အပြုအမူအသိအမှတ်ပြုမှု',
    behaviorNotice: 'အပြုအမူအကြောင်းကြားချက်',
    points: 'အမှတ်များ',

    // File Upload
    fileTooLarge: 'ဖိုင်အရွယ်အစားကြီးလွန်းသည်',
    pleaseSelectSmallerFile: 'ကျေးဇူးပြု၍ ပိုသေးသောဖိုင်ရွေးချယ်ပါ',
    failedToSelectImage: 'ပုံရွေးချယ်ရန်မအောင်မြင်ပါ',
    uploadFunctionNotProvided: 'အပ်လုဒ်လုပ်ဆောင်ချက်မပေးထားပါ',
    fileUploadedSuccessfully: 'ဖိုင်အပ်လုဒ်အောင်မြင်ပါပြီ!',
    uploadFailed: 'အပ်လုဒ်မအောင်မြင်ပါ',
    failedToUploadFile: 'ဖိုင်အပ်လုဒ်မအောင်မြင်ပါ။ ထပ်စမ်းကြည့်ပါ။',

    // Validation
    packageJsonNotFound: 'package.json မတွေ့ပါ',
    nameIsRequired: 'အမည်လိုအပ်သည်',
    versionIsRequired: 'ဗားရှင်းလိုအပ်သည်',
    invalidJson: 'မမှန်ကန်သော JSON',
    pleaseFix: 'ကျေးဇူးပြု၍ အမှားများကိုပြင်ဆင်ပြီးမှ ဆက်လုပ်ပါ။',
    pleaseReview:
      'ကျေးဇူးပြု၍ သတိပေးချက်များကိုပြန်လည်သုံးသပ်ပါ။ အက်ပ်သည်အလုပ်လုပ်နိုင်သေးသော်လည်း အချို့သောဖွဲ့စည်းမှုများကို အာရုံစိုက်ရန်လိုအပ်သည်။',

    // Home Screen
    chooseYourRole: 'ဆက်လက်လုပ်ဆောင်ရန် သင့်အခန်းကဏ္ဍကို ရွေးချယ်ပါ',
    schoolResources: 'ကျောင်းအရင်းအမြစ်များ',
    connectWithUs: 'ကျွန်ုပ်တို့နှင့် ဆက်သွယ်ပါ',

    // Role Descriptions
    teacherDescription:
      'သင်ကြားရေးကိရိယာများကို အသုံးပြုပါ၊ အတန်းများကို စီမံခန့်ခွဲပါ၊ ကျောင်းသားများ၏ တိုးတက်မှုကို ခြေရာခံပါ',
    parentDescription:
      'သင့်ကလေး၏ တိုးတက်မှုကို စောင့်ကြည့်ပါ၊ ဆရာများနှင့် ဆက်သွယ်ပါ၊ နောက်ဆုံးအချက်အလက်များကို ရယူပါ',
    studentDescription:
      'အလုပ်အတွက်များကို ကြည့်ရှုပါ၊ အမှတ်များကို စစ်ဆေးပါ၊ သင်ယူရေးပစ္စည်းများကို အသုံးပြုပါ',

    // Menu Items
    aboutUs: 'ကျွန်ုပ်တို့အကြောင်း',
    contactUs: 'ဆက်သွယ်ရန်',
    faq: 'မေးခွန်းများ',

    // Settings Screen
    darkThemeEnabled: 'မှောင်မိုက်အပြင်အဆင် ဖွင့်ထားသည်',
    lightThemeEnabled: 'အလင်းအပြင်အဆင် ဖွင့်ထားသည်',
    notificationsTitle: 'အကြောင်းကြားချက်များ',
    pushNotifications: 'တွန်းအကြောင်းကြားချက်များ',
    notificationEnabled: 'ဖွင့်ထားသည်',
    notificationDisabled: 'ပိတ်ထားသည်',
    notificationSound: 'အသံ',
    playSoundForNotifications: 'အကြောင်းကြားချက်များအတွက် အသံဖွင့်ရန်',
    notificationVibration: 'တုန်ခါမှု',
    vibrateForNotifications: 'အကြောင်းကြားချက်များအတွက် တုန်ခါရန်',
    notificationTypes: 'အကြောင်းကြားချက်အမျိုးအစားများ',
    gradesNotification: 'အမှတ်များ',
    newGradesAndUpdates: 'အမှတ်အသစ်များနှင့် ပညာရေးအပ်ဒိတ်များ',
    attendanceNotification: 'တက်ရောက်မှု',
    attendanceReminders: 'တက်ရောက်မှုသတိပေးချက်များနှင့် အပ်ဒိတ်များ',
    homeworkNotification: 'အိမ်စာ',
    assignmentDueDates: 'အိမ်စာသတ်မှတ်ရက်များနှင့် အပ်ဒိတ်များ',
    behaviorPointsNotification: 'အပြုအမူအမှတ်များ',
    bpsUpdates: 'BPS အပ်ဒိတ်များနှင့် အပြုအမူအကြောင်းကြားချက်များ',
    emergencyAlerts: 'အရေးပေါ်သတိပေးချက်များ',
    importantAnnouncements: 'အရေးကြီးကြေညာချက်များ',
    permissionRequired: 'ခွင့်ပြုချက်လိုအပ်သည်',
    enableNotificationsMessage:
      'အရေးကြီးအပ်ဒိတ်များရရှိရန် သင့်စက်ပစ္စည်းဆက်တင်များတွင် အကြောင်းကြားချက်များကို ဖွင့်ပေးပါ။',
    openSettings: 'ဆက်တင်များဖွင့်ရန်',

    // Academic specific
    totalPoints: 'စုစုပေါင်းအမှတ်များ',
    totalRecords: 'စုစုပေါင်းမှတ်တမ်းများ',
    behaviorPoints: 'အပြုအမူအမှတ်များ',
    positive: 'အပြုသဘော',
    negative: 'အနုတ်လက္ခဏာ',
    detentions: 'ထိန်းသိမ်းမှုများ',
    served: 'ပြီးစီး',
    notServed: 'မပြီးစီး',
    detentionsCompleted: 'ထိန်းသိမ်းမှုများ ပြီးစီး',
    pendingDetentions: 'စောင့်ဆိုင်းနေသော ထိန်းသိမ်းမှုများ',
    noDetentionsFound: 'ထိန်းသိမ်းမှုများ မတွေ့ပါ',
    noServedDetentions: 'ပြီးစီးသော ထိန်းသိမ်းမှုများ မရှိပါ',
    noPendingDetentions: 'စောင့်ဆိုင်းနေသော ထိန်းသိမ်းမှုများ မရှိပါ',
    noBehaviorPoints: 'အပြုအမူအမှတ်များ မတွေ့ပါ',
    noPositiveBehavior: 'အပြုသဘောအပြုအမူအမှတ်များ မရှိပါ',
    noNegativeBehavior: 'အနုတ်လက္ခဏာအပြုအမူအမှတ်များ မရှိပါ',

    // Common actions
    viewTimetable: 'အချိန်ဇယားကြည့်ရန်',
    manageBPS: 'BPS စီမံခန့်ခွဲရန်',
    quickActions: 'မြန်ဆန်သောလုပ်ဆောင်ချက်များ',
    features: 'လုပ်ဆောင်ချက်များ',
    appPreferences: 'အက်ပ်လိုက်လျောညီထွေမှုများနှင့် အကြောင်းကြားချက်များ',
    homeroom: 'ဟိုမိုင်း',
    // Time and dates
    today: 'ယနေ့',
    yesterday: 'မနေ့က',
    thisWeek: 'ဤအပတ်',
    thisMonth: 'ဤလ',

    // Status
    present: 'တက်ရောက်',
    absent: 'မတက်ရောက်',
    late: 'နောက်ကျ',
    excused: 'ခွင့်ပြု',
    pending: 'စောင့်ဆိုင်း',
    completed: 'ပြီးစီး',
    submitted: 'တင်သွင်း',
    overdue: 'သတ်မှတ်ချိန်လွန်',

    // New Features
    myProfile: 'ကျွန်ုပ်၏ကိုယ်ရေးအချက်အလက်',
    personalInformation: 'ကိုယ်ရေးကိုယ်တာအချက်အလက်များ',
    workInformation: 'အလုပ်အချက်အလက်များ',
    rolesResponsibilities: 'တာဝန်များနှင့် တာဝန်ဝတ်တရားများ',
    fullName: 'အမည်အပြည့်အစုံ',
    employeeId: 'ဝန်ထမ်းအမှတ်',
    email: 'အီးမေးလ်',
    phone: 'ဖုန်းနံပါတ်',
    position: 'ရာထူး',
    department: 'ဌာန',
    branch: 'ဌာနခွဲ',
    joinDate: 'ဝင်ရောက်သည့်ရက်စွဲ',
    notProvided: 'မပေးထားပါ',
    loadingProfile: 'ကိုယ်ရေးအချက်အလက်ဖွင့်နေသည်...',
    viewEditProfile: 'ကိုယ်ရေးအချက်အလက်ကြည့်ရှုပြင်ဆင်ရန်',
    areYouSureLogout: 'သင်သေချာပါသလား ထွက်မည်လား?',

    // Coming Soon
    comingSoon: 'မကြာမီရောက်မည်',
    reports: 'အစီရင်ခံစာများ',
    materials: 'စာရွက်စာတမ်းများ',
    analytics: 'ခွဲခြမ်းစိတ်ဖြာမှုများ',
    library: 'စာကြည့်တိုက်',
    analyticsStats: 'ခွဲခြမ်းစိတ်ဖြာမှုနှင့် စာရင်းအင်းများ',
    resourcesFiles: 'အရင်းအမြစ်များနှင့် ဖိုင်များ',

    // Reports
    myReports: 'ကျွန်ုပ်၏ အစီရင်ခံစာများ',
    staffReports: 'ဆရာ/ဆရာမ အစီရင်ခံစာများ',
    loadingReports: 'အစီရင်ခံစာများ ဖွင့်နေသည်...',
    failedToLoadReports: 'အစီရင်ခံစာများ ဖွင့်ရန် မအောင်မြင်ပါ',
    failedToLoadReportData: 'အစီရင်ခံစာ အချက်အလက်များ ဖွင့်ရန် မအောင်မြင်ပါ',
    failedToLoadClasses: 'အတန်းများ ဖွင့်ရန် မအောင်မြင်ပါ',
    noReportData: 'အစီရင်ခံစာ အချက်အလက် မရှိပါ',
    noReportDataMessage: 'ရွေးချယ်ထားသော ကာလအတွက် အစီရင်ခံစာ အချက်အလက် မရှိပါ',
    selectClassAndReport:
      'ကျေးဇူးပြု၍ အတန်းနှင့် အစီရင်ခံစာ အမျိုးအစား ရွေးချယ်ပါ',
    selectClass: 'အတန်း ရွေးချယ်ပါ',
    summary: 'အနှစ်ချုပ်',
    visualization: 'ပုံဖော်ပြသမှု',

    // Report Types - Student
    attendance: 'တက်ရောက်မှု',
    grades: 'အမှတ်များ',
    bps: 'အပြုအမူ အမှတ်များ',
    homework: 'အိမ်စာ',

    // Report Types - Staff
    classAttendance: 'အတန်း တက်ရောက်မှု',
    classAssessment: 'အတန်း အကဲဖြတ်မှု',
    behavioralAnalytics: 'အပြုအမူ ခွဲခြမ်းစိတ်ဖြာမှု',
    homeworkAnalytics: 'အိမ်စာ ခွဲခြမ်းစိတ်ဖြာမှု',

    // Attendance Stats
    totalDays: 'စုစုပေါင်း ရက်များ',
    present: 'တက်ရောက်',
    absent: 'မတက်ရောက်',
    attendanceRate: 'တက်ရောက်မှု နှုန်း',
    totalStudents: 'စုစုပေါင်း ကျောင်းသားများ',
    presentCount: 'တက်ရောက်သူ အရေအတွက်',
    absentCount: 'မတက်ရောက်သူ အရေအတွက်',

    // Grades Stats
    totalSubjects: 'စုစုပေါင်း ဘာသာရပ်များ',
    averageGrade: 'ပျမ်းမျှ အမှတ်',
    highestGrade: 'အမြင့်ဆုံး အမှတ်',
    lowestGrade: 'အနိမ့်ဆုံး အမှတ်',
    passingGrade: 'အောင်မြင်သော အမှတ်',
    failingGrade: 'ကျရှုံးသော အမှတ်',

    // BPS Stats
    totalPoints: 'စုစုပေါင်း အမှတ်များ',
    positivePoints: 'အပြုသဘော အမှတ်များ',
    negativePoints: 'အနုတ်လက္ခဏာ အမှတ်များ',
    netPoints: 'သုံးသပ် အမှတ်များ',
    totalRecords: 'စုစုပေါင်း မှတ်တမ်းများ',
    positiveRecords: 'အပြုသဘော မှတ်တမ်းများ',
    negativeRecords: 'အနုတ်လက္ခဏာ မှတ်တမ်းများ',

    // Homework Stats
    totalHomework: 'စုစုပေါင်း အိမ်စာ',
    completed: 'ပြီးစီး',
    pending: 'ဆိုင်းငံ့',
    completionRate: 'ပြီးစီးမှု နှုန်း',
    totalAssigned: 'စုစုပေါင်း ပေးအပ်ထား',
    totalSubmissions: 'စုစုပေါင်း တင်သွင်းမှုများ',
    completedSubmissions: 'ပြီးစီးသော တင်သွင်းမှုများ',

    // Library Stats
    totalBooksRead: 'စာအုပ်များ စုစုပေါင်း',
    booksReturned: 'ပြန်အပ်ပြီး စာအုပ်များ',
    currentlyBorrowed: 'လက်ရှိ ငှားရမ်းထားသော',
    readingHours: 'ဖတ်ရှုချိန်',
    booksOverdue: 'သတ်မှတ်ချိန်လွန် စာအုပ်များ',
    favoriteGenre: 'အကြိုက်ဆုံး အမျိုးအစား',

    teachingPerformance: 'သင်ကြားမှုစွမ်းဆောင်ရည်ကြည့်ရှုရန်',
    featureComingSoon: 'လုပ်ဆောင်ချက်မကြာမီရောက်မည်!',

    // Library specific
    libraryData: 'စာကြည့်တိုက်ဒေတာ',
    borrowedBooks: 'ငှားယူထားသောစာအုပ်များ',
    overdueItems: 'သတ်မှတ်ချိန်လွန်သောပစ္စည်းများ',
    borrowingLimits: 'ငှားယူမှုကန့်သတ်ချက်များ',

    // Assignment & Homework Management
    assignments: 'အလုပ်များ',
    assignmentsHomework: 'အလုပ်များနှင့် အိမ်စာများ',
    createHomework: 'အိမ်စာဖန်တီးရန်',
    homeworkTitle: 'အိမ်စာခေါင်းစဉ်',
    homeworkDescription: 'အိမ်စာဖော်ပြချက်',
    enterHomeworkTitle: 'အိမ်စာခေါင်းစဉ်ရိုက်ထည့်ပါ...',
    enterHomeworkDescription:
      'အိမ်စာဖော်ပြချက်နှင့် လမ်းညွှန်ချက်များရိုက်ထည့်ပါ...',
    selectClass: 'အတန်းရွေးချယ်ပါ',
    selectStudents: 'ကျောင်းသားများရွေးချယ်ပါ',
    selectDeadline: 'သတ်မှတ်ရက်ရွေးချယ်ပါ',
    setDeadline: 'သတ်မှတ်ရက်သတ်မှတ်ပါ',
    addAssignmentFile: 'အလုပ်ဖိုင်ထည့်ပါ',
    enterFileUrl:
      'ဖိုင် URL ရိုက်ထည့်ပါ (ဥပမာ: https://example.com/file.pdf)...',
    pleaseEnterHomeworkTitle: 'ကျေးဇူးပြု၍ အိမ်စာခေါင်းစဉ်ရိုက်ထည့်ပါ',
    pleaseEnterHomeworkDescription: 'ကျေးဇူးပြု၍ အိမ်စာဖော်ပြချက်ရိုက်ထည့်ပါ',
    pleaseSelectClass: 'ကျေးဇူးပြု၍ အတန်းတစ်ခုရွေးချယ်ပါ',
    pleaseSelectStudents: 'ကျေးဇူးပြု၍ ကျောင်းသားအနည်းဆုံးတစ်ဦးရွေးချယ်ပါ',
    pleaseSelectDeadline: 'ကျေးဇူးပြု၍ သတ်မှတ်ရက်ရွေးချယ်ပါ',
    homeworkCreatedSuccessfully: 'အိမ်စာအလုပ်ကို အောင်မြင်စွာဖန်တီးပြီးပါပြီ!',
    failedToCreateHomework: 'အိမ်စာအလုပ်ဖန်တီးမှု မအောင်မြင်ပါ',
    failedToFetchClasses: 'အတန်းများရယူမှု မအောင်မြင်ပါ',
    loadingClasses: 'အတန်းများဖွင့်နေသည်...',
    loadingAssignments: 'အလုပ်များဒေတာဖွင့်နေသည်...',

    // Assignment Status
    assignmentCompleted: 'ပြီးစီးပြီ',
    assignmentOverdue: 'သတ်မှတ်ချိန်လွန်',
    assignmentDueToday: 'ယနေ့ပြီးရမည်',
    assignmentPending: 'စောင့်ဆိုင်းနေ',
    markAsDone: 'ပြီးစီးအဖြစ်မှတ်သားရန်',
    markDone: 'ပြီးစီးမှတ်သား',
    alreadyCompleted: 'ပြီးစီးပြီးပြီ',
    assignmentMarkedCompleted: 'အလုပ်ကို ပြီးစီးအဖြစ်မှတ်သားပြီးပါပြီ!',
    assignmentAlreadySubmitted: 'ဤအလုပ်ကို ပြီးစီးအဖြစ်မှတ်သားပြီးပါပြီ။',
    failedToMarkDone: 'ပြီးစီးအဖြစ်မှတ်သားမှု မအောင်မြင်ပါ',
    confirmMarkDone: '"{title}" ကို ပြီးစီးအဖြစ်မှတ်သားရန် သေချာပါသလား?',

    // Assignment Display
    showAll: 'အားလုံးပြရန်',
    showCompleted: 'ပြီးစီးသောများပြရန်',
    noCompletedAssignments: 'ပြီးစီးသောအလုပ်များမရှိပါ',
    noPendingAssignments: 'စောင့်ဆိုင်းနေသောအလုပ်များမရှိပါ',
    untitledAssignment: 'ခေါင်းစဉ်မရှိသောအလုပ်',
    unknownSubject: 'မသိသောဘာသာရပ်',
    noDate: 'ရက်စွဲမရှိ',

    // File Upload & Management (Additional)
    fileUploadWarning:
      'အိမ်စာအလုပ်ဖန်တီးပြီးပါပြီ သို့သော် ဖိုင်အပ်လုဒ်မအောင်မြင်ပါ။ နောက်မှ ဖိုင်များအပ်လုဒ်လုပ်နိုင်ပါသည်။',

    // Messaging & Communication (New Keys)
    conversation: 'စကားဝိုင်း',
    enterMessage: 'စာတစ်စောင်ရိုက်ထည့်ပါ...',
    sendMessage: 'စာပို့ရန်',
    loadingMessages: 'စာများဖွင့်နေသည်...',
    failedToLoadMessages: 'စာများဖွင့်မှု မအောင်မြင်ပါ',
    failedToSendMessage: 'စာပို့မှု မအောင်မြင်ပါ',
    messageCopied: 'စာကို ကလစ်ဘုတ်သို့ ကူးယူပြီးပါပြီ',
    failedToCopyMessage: 'စာကူးယူမှု မအောင်မြင်ပါ',

    // Message Actions
    editMessage: 'စာပြင်ဆင်ရန်',
    deleteMessage: 'စာဖျက်ရန်',
    deleteMessages: 'စာများဖျက်ရန်',
    copyMessage: 'စာကူးယူရန်',
    selectMessage: 'စာရွေးချယ်ရန်',
    clearMessage: 'စာရှင်းလင်းရန်',
    messageDeleted: 'စာကို အောင်မြင်စွာဖျက်ပြီးပါပြီ',
    messageEdited: 'စာကို အောင်မြင်စွာပြင်ဆင်ပြီးပါပြီ',
    messageEditedSuccessfully: 'စာကို အောင်မြင်စွာပြင်ဆင်ပြီးပါပြီ',
    messageCleared: 'စာအကြောင်းအရာကို အောင်မြင်စွာရှင်းလင်းပြီးပါပြီ',
    messagesDeletedSuccessfully:
      '{count} စာ{plural}ကို အောင်မြင်စွာဖျက်ပြီးပါပြီ',
    failedToDeleteMessage: 'စာဖျက်မှု မအောင်မြင်ပါ',
    failedToDeleteMessages: 'စာများဖျက်မှု မအောင်မြင်ပါ',
    failedToEditMessage: 'စာပြင်ဆင်မှု မအောင်မြင်ပါ',
    failedToClearMessage: 'စာရှင်းလင်းမှု မအောင်မြင်ပါ',

    // Message Confirmations
    deleteMessageConfirm:
      'ဤစာကို ဖျက်ရန် သေချာပါသလား? ဤလုပ်ဆောင်ချက်ကို ပြန်လည်ပြင်ဆင်၍မရပါ။',
    clearMessageConfirm:
      'ဤလုပ်ဆောင်ချက်သည် စာအကြောင်းအရာကို "[Message Deleted]" ဖြင့် အစားထိုးမည်ဖြစ်သည်။ စာသည် မြင်ရနေမည်ဖြစ်သော်လည်း အကြောင်းအရာကို ရှင်းလင်းမည်ဖြစ်သည်။',
    deleteMessagesConfirm: '{count} စာ{plural}ကို ဖျက်ရန် သေချာပါသလား?',
    bulkDeleteSuccess: '{count} စာ{plural}ကို အောင်မြင်စွာဖျက်ပြီးပါပြီ',
    failedToBulkDelete: 'စာများဖျက်မှု မအောင်မြင်ပါ',

    // Conversation Actions
    leaveConversation: 'စကားဝိုင်းမှ ထွက်ရန်',
    deleteConversation: 'စကားဝိုင်းဖျက်ရန်',
    leaveConversationConfirm:
      'ဤစကားဝိုင်းမှ ထွက်ရန် သေချာပါသလား? သင်သည် ဤစကားဝိုင်းမှ စာများကို နောက်ထပ်မရရှိတော့ပါ။',
    deleteConversationConfirm:
      'ဤစကားဝိုင်းတစ်ခုလုံးကို ဖျက်ရန် သေချာပါသလား? ဤလုပ်ဆောင်ချက်သည် စာအားလုံးကို အပြီးအပိုင်ဖျက်မည်ဖြစ်ပြီး ပြန်လည်ပြင်ဆင်၍မရပါ။',
    leftConversationSuccess: 'စကားဝိုင်းမှ အောင်မြင်စွာထွက်ပြီးပါပြီ',
    conversationDeletedSuccess: 'စကားဝိုင်းကို အောင်မြင်စွာဖျက်ပြီးပါပြီ',
    failedToLeaveConversation: 'စကားဝိုင်းမှ ထွက်မှု မအောင်မြင်ပါ',
    failedToDeleteConversation: 'စကားဝိုင်းဖျက်မှု မအောင်မြင်ပါ',

    // File Attachments (New Keys)
    fileAttachmentsComingSoon: 'ဖိုင်ပူးတွဲမှုများ မကြာမီရရှိမည်',
    attachmentPressed: 'ပူးတွဲဖိုင်ကို နှိပ်ပြီးပါပြီ',

    // General UI Elements (New Keys)
    copy: 'ကူးယူ',
    select: 'ရွေးချယ်',
    clear: 'ရှင်းလင်း',
    leave: 'ထွက်',
    send: 'ပို့',

    // Authentication & Connection
    authCodeMissing: 'အထောက်အထားစိစစ်မှုကုဒ် ပျောက်နေသည်',
    failedToConnect: 'ဆာဗာသို့ ချိတ်ဆက်မှု မအောင်မြင်ပါ',
    connectionError: 'ချိတ်ဆက်မှုအမှား',
    serverError: 'ဆာဗာအမှား',
    incorrectCredentials: 'မှားယွင်းသော {loginType} ID သို့မဟုတ် စကားဝှက်!',

    // Home Screen Navigation & Diagnostics
    dataClearedMessage:
      'အသုံးပြုသူဒေတာအားလုံးကို ရှင်းလင်းပြီးပါပြီ။ ကျေးဇူးပြု၍ အက်ပ်ကို ပြန်စတင်ပြီး ပြန်လည်လော့ဂ်အင်ဝင်ပါ။',
    failedToClearData:
      'ဒေတာရှင်းလင်းမှု မအောင်မြင်ပါ။ ကျေးဇူးပြု၍ အက်ပ်ကို လက်ဖြင့်ပြန်စတင်ပါ။',
    navigationError: 'လမ်းညွှန်မှုအမှား',
    unableToAccessTeacherScreen:
      'ဆရာမျက်နှာပြင်သို့ ဝင်ရောက်၍မရပါ။ ဒေတာပျက်စီးမှုကြောင့်ဖြစ်နိုင်သည်။',
    unableToAccessParentScreen:
      'မိဘမျက်နှာပြင်သို့ ဝင်ရောက်၍မရပါ။ ကျေးဇူးပြု၍ ပြန်လည်ကြိုးစားပါ။',
    goToLogin: 'လော့ဂ်အင်သို့သွားရန်',
    runDiagnostics: 'စစ်ဆေးမှုလုပ်ရန်',
    accessScreen: '{screenName} သို့ဝင်ရောက်ရန်',
    schoolInfoAccessMessage:
      'ကျောင်းအချက်အလက်များကြည့်ရှုရန်အတွက် တိုက်ရိုက်လော့ဂ်အင်ဝင်ခြင်း သို့မဟုတ် ကျောင်းသားအကောင့်ထည့်ခြင်းပြုလုပ်နိုင်ပါသည်။',
    loginAsTeacher: 'ဆရာအဖြစ်လော့ဂ်အင်ဝင်ရန်',
    loginAsStudent: 'ကျောင်းသားအဖြစ်လော့ဂ်အင်ဝင်ရန်',

    // Social Media
    connectWithUsSocial: 'ကျွန်ုပ်တို့နှင့် ဆိုရှယ်မီဒီယာတွင် ချိတ်ဆက်ပါ!',
    facebookComingSoon: 'Facebook စာမျက်နှာ မကြာမီရရှိမည်!',
    twitterComingSoon: 'Twitter စာမျက်နှာ မကြာမီရရှိမည်!',
    instagramComingSoon: 'Instagram စာမျက်နှာ မကြာမီရရှိမည်!',
    youtubeComingSoon: 'YouTube ချန်နယ် မကြာမီရရှိမည်!',

    // Teacher Screen
    confirmLogout: 'လော့ဂ်အောက်ထွက်ရန် သေချာပါသလား?',
    scheduleAttendance: 'အချိန်ဇယား နှင့် တက်ရောက်မှု',
    assignmentsReview: 'အိမ်စာများ နှင့် ပြန်လည်သုံးသပ်ခြင်း',
    chatCommunication: 'စကားပြောဆိုမှု နှင့် ဆက်သွယ်မှု',
    myCalendar: 'ကျွန်ုပ်၏ ပြက္ခဒိန်',
    personalSchoolEvents: 'ကိုယ်ပိုင် နှင့် ကျောင်းဖြစ်ရပ်များ',
    teacherStudentWellbeing: 'ဆရာ/ကျောင်းသား ကျန်းမာရေး',
    classManagement: 'အတန်းစီမံခန့်ခွဲမှု',
    selectBranch: 'ဌာနခွဲရွေးချယ်ရန်',
    academicYear: 'ပညာသင်နှစ်',
    week: 'အပတ်',
    id: 'အိုင်ဒီ',

    // Parent Screen
    failedToAccessCalendar: 'ပြက္ခဒိန်သို့ ဝင်ရောက်မှု မအောင်မြင်ပါ',
    soon: 'မကြာမီ',

    // Student Messaging Screen
    failedToLoadConversations: 'စကားပြောဆိုမှုများ ဖွင့်မရပါ',
    failedToMarkAsRead: 'စကားပြောဆိုမှုကို ဖတ်ပြီးအဖြစ် မှတ်သားမရပါ',
    failedToSearchMessages: 'မက်ဆေ့ချ်များ ရှာဖွေမရပါ',
    searchConversationsMessages:
      'စကားပြောဆိုမှုများနှင့် မက်ဆေ့ချ်များ ရှာဖွေရန်...',
    loadingConversations: 'စကားပြောဆိုမှုများ ဖွင့်နေသည်...',

    // Notification Screen
    clearAllNotifications: 'အကြောင်းကြားချက်များ အားလုံးရှင်းလင်းရန်',
    clearAllNotificationsConfirm:
      'အကြောင်းကြားချက်များ အားလုံးကို ရှင်းလင်းလိုသည်မှာ သေချာပါသလား? ဤလုပ်ဆောင်ချက်ကို ပြန်လည်ပြုပြင်၍မရပါ။',
    allNotificationsCleared: 'အကြောင်းကြားချက်များ အားလုံး ရှင်းလင်းပြီးပါပြီ။',
    failedToClearNotifications: 'အကြောင်းကြားချက်များ ရှင်းလင်းမရပါ။',
    allNotificationsMarkedRead:
      'အကြောင်းကြားချက်များ အားလုံးကို ဖတ်ပြီးအဖြစ် မှတ်သားပြီးပါပြီ။',
    noUnreadNotifications:
      'သင်သည် အားလုံးကို ဖတ်ပြီးပါပြီ! မဖတ်ရသေးသော အကြောင်းကြားချက်များ မရှိပါ။',
    noNotificationsYet:
      'အကြောင်းကြားချက်များ ရရှိသောအခါ ဤနေရာတွင် မြင်ရမည်ဖြစ်သည်။',
    loadingNotifications: 'အကြောင်းကြားချက်များ ဖွင့်နေသည်...',

    // Calendar Screen
    loginRequired: 'လော့ဂ်အင် လိုအပ်သည်',
    loginRequiredCalendarMessage:
      'ပြက္ခဒိန်ကို ဝင်ရောက်ရန် ဆရာ သို့မဟုတ် ကျောင်းသားအဖြစ် လော့ဂ်အင်ဝင်ပါ။',
    schoolConfigNotFound: 'ကျောင်းဆက်တင်များ မတွေ့ရှိပါ',
    failedToInitializeCalendar: 'ပြက္ခဒိန် စတင်မရပါ',
    failedToLoadCalendarEvents: 'ပြက္ခဒိန်ဖြစ်ရပ်များ ဖွင့်မရပါ',
    noDescription: 'ဖော်ပြချက် မရှိပါ',
    time: 'အချိန်',
    type: 'အမျိုးအစား',
    location: 'နေရာ',
    calendarServiceNotInitialized: 'ပြက္ခဒိန်ဝန်ဆောင်မှု စတင်မထားပါ',
    accessDenied: 'ဝင်ရောက်ခွင့် မရှိပါ',
    calendarTestStaffOnly:
      'ပြက္ခဒိန်ချိတ်ဆက်မှု စမ်းသပ်ခြင်းသည် ဝန်ထမ်းများအတွက်သာ ရရှိနိုင်သည်',
    noBranchIdForTesting: 'စမ်းသပ်ရန် ဌာနခွဲအိုင်ဒီ မရှိပါ',
    testingCalendarConnection: 'ပြက္ခဒိန်ချိတ်ဆက်မှု စမ်းသပ်နေသည်',
    testingCalendarConnectionMessage:
      'Google ပြက္ခဒိန်ချိတ်ဆက်မှု စမ်းသပ်နေသည်... ကျေးဇူးပြု၍ စောင့်ပါ။',
    loadingCalendarEvents: 'ပြက္ခဒိန်ဖြစ်ရပ်များ ဖွင့်နေသည်...',
    signInToGoogleCalendar:
      'ပိုမိုများသော ဖြစ်ရပ်များကို ကြည့်ရှုရန် Google ပြက္ခဒိန်သို့ လော့ဂ်အင်ဝင်ပါ။',
    checkBackForNewEvents: 'ဖြစ်ရပ်အသစ်များအတွက် နောက်မှ ပြန်လာကြည့်ပါ။',

    // About Us Screen
    unableToLoadAboutUs:
      'ကျွန်ုပ်တို့အကြောင်း အချက်အလက်များ ဖွင့်မရပါ။ ကျေးဇူးပြု၍ ပြန်လည်ကြိုးစားပါ။',
    loadingAboutUs: 'ကျွန်ုပ်တို့အကြောင်း အချက်အလက်များ ဖွင့်နေသည်...',
    lastUpdated: 'နောက်ဆုံးအပ်ဒိတ်လုပ်ခဲ့သည်:',
    noAboutUsInfo: 'လောလောဆယ် ကျွန်ုပ်တို့အကြောင်း အချက်အလက်များ မရရှိနိုင်ပါ။',

    // Attendance Screen
    loadingAttendanceData: 'တက်ရောက်မှုအချက်အလက်များ ဖွင့်နေသည်...',
    attendanceSummary: 'တက်ရောက်မှုအကျဉ်းချုပ်',
    dailyStatistics: 'နေ့စဉ်စာရင်းအင်းများ',
    absentRecords: 'မတက်ရောက်သည့်မှတ်တမ်းများ',
    lateRecords: 'နောက်ကျသည့်မှတ်တမ်းများ',

    // Behavior Screen
    authenticationCodeMissing: 'အထောက်အထားကုဒ် မရှိပါ',
    overviewStatistics: 'အခြေအနေနှင့် စာရင်းအင်းများ',
    records: 'မှတ်တမ်းများ',

    noPositiveBehaviorPoints:
      'ပြသရန် အပြုသဘောဆောင်သော အမူအကျင့်အမှတ်များ မရှိပါ',
    noNegativeBehaviorPoints:
      'ပြသရန် အနုတ်လက္ခဏာဆောင်သော အမူအကျင့်အမှတ်များ မရှိပါ',

    // Contacts Screen
    unableToLoadContactInfo:
      'ဆက်သွယ်ရေးအချက်အလက်များ ဖွင့်မရပါ။ ကျေးဇူးပြု၍ ပြန်လည်ကြိုးစားပါ။',

    address: 'လိပ်စာ',
    website: 'ဝက်ဘ်ဆိုက်',

    // FAQ Screen
    unableToLoadFAQInfo:
      'မေးလေ့ရှိသောမေးခွန်းများ ဖွင့်မရပါ။ ကျေးဇူးပြု၍ ပြန်လည်ကြိုးစားပါ။',
    question: 'မေးခွန်း',
    questions: 'မေးခွန်းများ',

    // Grades Screen
    loadingFormativeGrades: 'အကဲဖြတ်မှုအမှတ်များ ဖွင့်နေသည်...',
    noLifeSkillsGradesForSubject:
      '{subject} အတွက် ဘဝကျွမ်းကျင်မှုအမှတ်များ မရှိပါ',
    noLifeSkillsGrades: 'ဘဝကျွမ်းကျင်မှုအမှတ်များ မရှိပါ',
    summative: 'အပေါင်းအမှတ်',
    lifeSkills: 'ဘဝကျွမ်းကျင်မှု',
    notGraded: 'အမှတ်မပေးရသေး',

    // Library Screen
    authenticationRequired: 'အထောက်အထားပြရန် လိုအပ်သည်',
    failedToLoadLibraryData: 'စာကြည့်တိုက်အချက်အလက်များ ဖွင့်မရပါ',
    failedToConnectLibrarySystem: 'စာကြည့်တိုက်စနစ်နှင့် ချိတ်ဆက်မရပါ',
    networkErrorOccurred: 'ကွန်ယက်အမှားတစ်ခု ဖြစ်ပွားခဲ့သည်',
    overview: 'ခြုံငုံကြည့်ရှုမှု',
    borrowed: 'ငှားယူထားသော',
    history: 'မှတ်တမ်း',

    // Splash Screen
    inspiringBrilliance: 'ထက်မြက်မှုကို လှုံ့ဆော်ခြင်း',
    buildingBrighterFutures: 'တောက်ပသော အနာဂတ်များ တည်ဆောက်ခြင်း',

    // Teacher Attendance Screen
    failedToLoadAttendanceDetails: 'တက်ရောက်မှုအသေးစိတ်များ ဖွင့်မရပါ',
    networkErrorLoadingAttendance:
      'တက်ရောက်မှု ဖွင့်နေစဉ် ကွန်ယက်အမှား ဖြစ်ပွားခဲ့သည်',
    failedToLoadStudentsData: 'ကျောင်းသားများ၏ အချက်အလက်များ ဖွင့်မရပါ',
    networkErrorLoadingStudents:
      'ကျောင်းသားများ ဖွင့်နေစဉ် ကွန်ယက်အမှား ဖြစ်ပွားခဲ့သည်',
    incompleteAttendance: 'မပြည့်စုံသော တက်ရောက်မှု',
    pleaseMarkAttendanceForAllStudents:
      'ကျောင်းသားအားလုံးအတွက် တက်ရောက်မှု မှတ်သားပါ။ {count} ကျောင်းသား ကျန်ရှိနေသည်။',
    attendanceSubmittedSuccessfullyDemo:
      'တက်ရောက်မှု အောင်မြင်စွာ တင်သွင်းပြီးပါပြီ! (စမ်းသပ်မုဒ်)',
    attendanceUpdatedSuccessfully:
      'တက်ရောက်မှု အောင်မြင်စွာ အပ်ဒိတ်လုပ်ပြီးပါပြီ!',
    attendanceSubmittedSuccessfully:
      'တက်ရောက်မှု အောင်မြင်စွာ တင်သွင်းပြီးပါပြီ!',
    failedToSubmitAttendance: 'တက်ရောက်မှု တင်သွင်းမရပါ',
    updateAttendance: 'တက်ရောက်မှု အပ်ဒိတ်လုပ်ရန်',
    takeAttendance: 'တက်ရောက်မှု ယူရန်',
    loadingStudents: 'ကျောင်းသားများ ဖွင့်နေသည်...',
    submitAttendance: 'တက်ရောက်မှု တင်သွင်းရန်',

    // Teacher BPS Screen
    failedToFetchBPSData: 'BPS အချက်အလက်များ ရယူမရပါ',
    pleaseSelectStudentAndBehavior:
      'ကျောင်းသားတစ်ဦးနှင့် အမူအကျင့်တစ်ခုကို ရွေးချယ်ပါ',
    noBranchInformationAvailable: 'ဌာနခွဲအချက်အလက်များ မရရှိပါ',
    partialSuccess: 'တစ်စိတ်တစ်ပိုင်း အောင်မြင်မှု',
    recordsCreatedPartially:
      '{total} မှတ်တမ်းများအနက် {successful} ခု အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ။',

    // Timetable Screen
    unknownTeacher: 'မသိသော ဆရာ/ဆရာမ',
    period: 'အချိန်ပိုင်း',

    // Workspace Screen
    failedToLoadWorkspace: 'အလုပ်ခန်း ဖွင့်မရပါ။ ထပ်မံကြိုးစားပါ။',
    failedToLoadFolderContents:
      'ဖိုင်တွဲအကြောင်းအရာများ ဖွင့်မရပါ။ ထပ်မံကြိုးစားပါ။',
    failedToLoadRecentFiles: 'လတ်တလောဖိုင်များ ဖွင့်မရပါ။ ထပ်မံကြိုးစားပါ။',

    // Assignment Detail Screen
    pleaseProvideResponse:
      'ရေးသားထားသော အဖြေ၊ ဖိုင်တစ်ခု သို့မဟုတ် ဖိုင်လင့်ခ်တစ်ခု ပေးပါ',
    failedToUpdateAssignment: 'အလုပ်စာ ပြင်ဆင်မှု မအောင်မြင်ပါ',
    failedToSubmitAssignment: 'အလုပ်စာ တင်သွင်းမှု မအောင်မြင်ပါ',
    alreadySubmitted: 'ပြီးပြီ',
    assignmentAlreadySubmitted: 'ဤအလုပ်စာကို တင်သွင်းပြီးပါပြီ။',
    contactTeacher: 'ဆရာ/ဆရာမကို ဆက်သွယ်ပါ',
    contactTeacherMessage:
      'သင့်တင်သွင်းမှုကို ပြင်ဆင်ရန် လိုအပ်ပါက ဆရာ/ဆရာမကို ဆက်သွယ်ပါ။',
    failedToConnectServer: 'ဆာဗာနှင့် ဆက်သွယ်မှု မအောင်မြင်ပါ: {error}',
    updateAssignment: 'အလုပ်စာ ပြင်ဆင်ရန်',
    submitAssignment: 'အလုပ်စာ တင်သွင်းရန်',
    confirmUpdateAssignment: 'ဤအလုပ်စာကို ပြင်ဆင်မှာ သေချာပါသလား?',
    confirmSubmitAssignment: 'ဤအလုပ်စာကို တင်သွင်းမှာ သေချာပါသလား?',
    update: 'ပြင်ဆင်ရန်',
    submit: 'တင်သွင်းရန်',
    unableToOpenFileLink: 'ဖိုင်လင့်ခ် ဖွင့်မရပါ',

    // Create Conversation Screen
    failedToLoadUsers: 'အသုံးပြုသူများ ဖွင့်မရပါ',
    pleaseEnterConversationTopic: 'စကားဝိုင်းခေါင်းစဉ် ရေးပါ',
    pleaseSelectAtLeastOneUser: 'အသုံးပြုသူ တစ်ယောက်ယောက် ရွေးပါ',
    conversationCreatedSuccessfully: 'စကားဝိုင်း အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ',
    failedToCreateConversation: 'စကားဝိုင်း ဖန်တီးမှု မအောင်မြင်ပါ',
    usersSelected: 'အသုံးပြုသူ {count} ယောက် ရွေးထားသည်',
    enterConversationTopic: 'စကားဝိုင်းခေါင်းစဉ် ရေးပါ...',
    searchUsers: 'အသုံးပြုသူများ ရှာပါ...',
    loadingUsers: 'အသုံးပြုသူများ ဖွင့်နေသည်...',

    // Student Health Screen
    failedToLoadHealthData: 'ကျန်းမာရေးအချက်အလက် ဖွင့်မရပါ။ ထပ်မံကြိုးစားပါ။',
    notSpecified: 'မဖော်ပြထားပါ',
    loadingHealthData: 'ကျန်းမာရေးအချက်အလက် ဖွင့်နေသည်...',
    visitRecords: 'လာရောက်မှုမှတ်တမ်းများ',
    healthInfo: 'ကျန်းမာရေးအချက်အလက်',
    medicalConditions: 'ဆေးဘက်ဆိုင်ရာအခြေအနေများ',
    regularMedication: 'ပုံမှန်သောက်ဆေးများ',
    visionAndHearing: 'အမြင်နှင့်အကြား',
    visionProblems: 'အမြင်ပြဿနာများ',
    lastVisionCheck: 'နောက်ဆုံးအမြင်စစ်ဆေးမှု',
    hearingIssues: 'အကြားပြဿနာများ',
    allergiesAndFood: 'မတည့်မှုနှင့်အစားအသောက်',
    foodConsiderations: 'အစားအသောက်ထည့်သွင်းစဉ်းစားရမည့်အရာများ',
    allergies: 'မတည့်မှုများ',
    allergySymptoms: 'မတည့်မှုလက္ခဏာများ',
    firstAidInstructions: 'ပထမကူညီမှုညွှန်ကြားချက်များ',
    allowedMedications: 'ခွင့်ပြုထားသောဆေးများ',
    emergencyContacts: 'အရေးပေါ်ဆက်သွယ်ရမည့်သူများ',
    primaryContact: 'အဓိကဆက်သွယ်ရမည့်သူ',
    primaryPhone: 'အဓိကဖုန်းနံပါတ်',
    secondaryContact: 'ဒုတိယဆက်သွယ်ရမည့်သူ',
    secondaryPhone: 'ဒုတိယဖုန်းနံပါတ်',
  },
  zh: {
    // Common
    loading: '加载中...',
    error: '错误',
    success: '成功',
    cancel: '取消',
    ok: '确定',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    search: '搜索',
    filter: '筛选',
    refresh: '刷新',

    // Navigation
    home: '首页',
    dashboard: '仪表板',
    settings: '设置',
    profile: '个人资料',
    logout: '退出',

    // Authentication
    login: '登录',
    username: '用户名',
    password: '密码',
    forgotPassword: '忘记密码？',

    // Dashboard
    teacher: '教师',
    parent: '家长',
    student: '学生',
    welcomeTo: '欢迎来到',

    // Academic
    assessments: '评估',
    attendance: '出勤',
    timetable: '时间表',
    homework: '作业',
    behavior: 'BPS管理',
    discipline: '纪律',

    // Settings
    language: '语言',
    theme: '主题',
    lightMode: '浅色模式',
    darkMode: '深色模式',
    notifications: '通知',
    about: '关于',
    version: '版本',

    // Messages
    noData: '无数据',
    networkError: '网络错误，请重试。',
    loginSuccess: '登录成功',
    loginError: '登录失败，请检查您的凭据。',

    // Specific UI Elements
    parentDashboard: '家长仪表板',
    teacherDashboard: '教师仪表板',
    yourChildren: '您的孩子',
    yourChild: '您的孩子',
    menu: '菜单',
    addStudent: '添加学生',
    deleteStudent: '删除学生',
    selectStudent: '选择学生',
    noStudentSelected: '未选择学生',
    pleaseSelectStudent: '请先选择一个学生以查看其信息。',
    authenticationError: '认证错误',
    unableToAuthenticate: '无法认证此学生。请联系支持。',
    removeStudent: '移除学生',
    areYouSure: '您确定要移除',
    studentRemoved: '学生移除成功',
    failedToRemove: '移除学生失败',
    addStudentAccount: '添加学生账户',
    noStudentAccounts: '尚未添加学生账户',
    tapToAdd: '点击标题中的+按钮添加您孩子的账户',
    scrollForMore: '滑动查看更多 →',
    selected: '已选择',

    // Menu Items
    calendar: '日历',
    health: '医疗报告',
    messages: '消息',

    // Alert Messages
    noStudents: '没有学生',
    pleaseAddStudent: '请先添加学生账户以查看通知。',
    duplicateStudent: '重复学生',

    // Login Screen
    teacherId: '教师ID',
    studentId: '学生ID',
    pleaseEnterCredentials: '请输入用户名和密码',
    studentAccountExists: '此学生账户已经添加过了。',
    studentAccountAdded: '学生账户添加成功',
    failedToSaveStudent: '保存学生账户失败',
    loginSuccessful: '登录成功',
    welcomeMessage: '欢迎 {name}！您现在可以访问日历和其他学校资源。',
    loginFailed: '登录失败',
    networkConnectionError: '网络连接错误。请检查您的网络连接。',
    unableToConnectServer: '无法连接到服务器。请稍后再试。',
    connectionTimeout: '连接超时。请检查您的网络连接并重试。',
    unknownError: '未知错误',
    failedToCompleteLogin: '无法完成登录过程',

    // Messaging
    enableNotifications: '启用通知',
    notificationPermissionMessage:
      '您想接收有关孩子教育的重要更新吗？这包括成绩、出勤和学校公告。',
    notNow: '暂不',

    // Performance Monitor
    continue: '继续',
    forceRestart: '强制重启',

    // Diagnostics
    diagnosticsError: '诊断错误',
    unableToRunDiagnostics: '无法运行诊断。请重启应用。',
    navigationDiagnostics: '导航诊断',
    dataCleared: '数据已清除',
    clearDataRestart: '清除数据并重启',
    allDataCleared: '所有用户数据已清除。请重启应用并重新登录。',
    deviceStorageError: '应用无法访问设备存储。请重启应用并重试。',
    noUserAccountsFound:
      '未找到用户账户。请以教师/学生身份登录或通过家长部分添加学生账户。',

    // Common UI
    typeMessage: '输入消息...',
    available: '可用',
    notAvailable: '不可用',
    enabled: '已启用',
    disabled: '已禁用',
    debugInfo: '调试信息（应用审核）',
    platform: '平台',
    dummyData: '虚拟数据',
    networkTimeout: '网络超时',
    deviceToken: '设备令牌',

    // Modal and Dialog
    confirm: '确认',
    step: '步骤',
    of: '的',

    // Empty States
    somethingWentWrong: '出现了问题',
    pleaseTryAgainLater: '请稍后再试',
    retry: '重试',

    // Settings Screen
    developedBy: '由 EduNova Myanmar 开发',

    // BPS Notifications
    positiveBehaviorRecognition: '积极行为表彰',
    behaviorNotice: '行为通知',
    points: '分',

    // File Upload
    fileTooLarge: '文件过大',
    pleaseSelectSmallerFile: '请选择小于',
    failedToSelectImage: '选择图片失败',
    uploadFunctionNotProvided: '未提供上传功能',
    fileUploadedSuccessfully: '文件上传成功！',
    uploadFailed: '上传失败',
    failedToUploadFile: '文件上传失败。请重试。',

    // Validation
    packageJsonNotFound: '未找到 package.json',
    nameIsRequired: '需要名称',
    versionIsRequired: '需要版本',
    invalidJson: '无效的 JSON',
    pleaseFix: '请在继续之前修复错误。',
    pleaseReview: '请查看警告。应用程序可能仍然可以工作，但某些配置需要注意。',

    // Home Screen
    chooseYourRole: '选择您的角色以继续',
    schoolResources: '学校资源',
    connectWithUs: '联系我们',

    // Role Descriptions
    teacherDescription: '访问教学工具，管理班级，跟踪学生进度',
    parentDescription: '监控您孩子的进度，与老师沟通，保持更新',
    studentDescription: '查看作业，检查成绩，访问学习材料',

    // Menu Items
    aboutUs: '关于我们',
    contactUs: '联系我们',
    faq: '常见问题',

    // Settings Screen
    darkThemeEnabled: '深色主题已启用',
    lightThemeEnabled: '浅色主题已启用',
    notificationsTitle: '通知',
    pushNotifications: '推送通知',
    notificationEnabled: '已启用',
    notificationDisabled: '已禁用',
    notificationSound: '声音',
    playSoundForNotifications: '为通知播放声音',
    notificationVibration: '振动',
    vibrateForNotifications: '为通知振动',
    notificationTypes: '通知类型',
    gradesNotification: '成绩',
    newGradesAndUpdates: '新成绩和学术更新',
    attendanceNotification: '出勤',
    attendanceReminders: '出勤提醒和更新',
    homeworkNotification: '作业',
    assignmentDueDates: '作业截止日期和更新',
    behaviorPointsNotification: '行为积分',
    bpsUpdates: 'BPS更新和行为通知',
    emergencyAlerts: '紧急警报',
    importantAnnouncements: '重要公告',
    permissionRequired: '需要权限',
    enableNotificationsMessage: '请在设备设置中启用通知以接收重要更新。',
    openSettings: '打开设置',

    // Academic specific
    totalPoints: '总分',
    totalRecords: '总记录',
    behaviorPoints: '行为分数',
    positive: '正面',
    negative: '负面',
    detentions: '留校',
    served: '已完成',
    notServed: '未完成',
    detentionsCompleted: '留校已完成',
    pendingDetentions: '待完成留校',
    noDetentionsFound: '未找到留校记录',
    noServedDetentions: '无已完成的留校记录',
    noPendingDetentions: '无待完成的留校记录',
    noBehaviorPoints: '未找到行为分数',
    noPositiveBehavior: '无正面行为分数记录',
    noNegativeBehavior: '无负面行为分数记录',

    // Common actions
    viewTimetable: '查看时间表',
    manageBPS: '管理BPS',
    quickActions: '快速操作',
    features: '功能',
    appPreferences: '应用偏好设置和通知',
    homeroom: 'Homeroom',

    // Time and dates
    today: '今天',
    yesterday: '昨天',
    thisWeek: '本周',
    thisMonth: '本月',

    // Status
    present: '出席',
    absent: '缺席',
    late: '迟到',
    excused: '请假',
    pending: '待处理',
    completed: '已完成',
    submitted: '已提交',
    overdue: '逾期',

    // New Features
    myProfile: '我的个人资料',
    personalInformation: '个人信息',
    workInformation: '工作信息',
    rolesResponsibilities: '角色与职责',
    fullName: '全名',
    employeeId: '员工编号',
    email: '邮箱',
    phone: '电话',
    position: '职位',
    department: '部门',
    branch: '分支',
    joinDate: '入职日期',
    notProvided: '未提供',
    loadingProfile: '正在加载个人资料...',
    viewEditProfile: '查看和编辑个人资料信息',
    areYouSureLogout: '您确定要退出登录吗？',

    // Coming Soon
    comingSoon: '即将推出',
    reports: '报告',
    materials: '材料',
    analytics: '分析',
    library: '图书馆',
    analyticsStats: '分析与统计',
    resourcesFiles: '资源与文件',

    // Reports
    myReports: '我的报告',
    staffReports: '教职员工报告',
    loadingReports: '正在加载报告...',
    failedToLoadReports: '加载报告失败',
    failedToLoadReportData: '加载报告数据失败',
    failedToLoadClasses: '加载班级失败',
    noReportData: '无报告数据',
    noReportDataMessage: '所选期间无可用报告数据',
    selectClassAndReport: '请选择班级和报告类型',
    selectClass: '选择班级',
    summary: '摘要',
    visualization: '可视化',

    // Report Types - Student
    grades: '成绩',
    bps: '行为积分',

    // Report Types - Staff
    classAttendance: '班级出勤',
    classAssessment: '班级评估',
    behavioralAnalytics: '行为分析',
    homeworkAnalytics: '作业分析',

    // Attendance Stats
    totalDays: '总天数',
    attendanceRate: '出勤率',
    totalStudents: '学生总数',
    presentCount: '出席人数',
    absentCount: '缺席人数',

    // Grades Stats
    totalSubjects: '科目总数',
    averageGrade: '平均成绩',
    highestGrade: '最高成绩',
    lowestGrade: '最低成绩',
    passingGrade: '及格成绩',
    failingGrade: '不及格成绩',

    // BPS Stats
    positivePoints: '正积分',
    negativePoints: '负积分',
    netPoints: '净积分',
    positiveRecords: '正面记录',
    negativeRecords: '负面记录',

    // Homework Stats
    totalHomework: '作业总数',
    completionRate: '完成率',
    totalAssigned: '总分配',
    totalSubmissions: '总提交',
    completedSubmissions: '已完成提交',

    // Library Stats
    totalBooksRead: '图书总数',
    booksReturned: '已归还图书',
    currentlyBorrowed: '当前借阅',
    readingHours: '阅读时间',
    booksOverdue: '逾期图书',
    favoriteGenre: '最喜欢的类型',

    teachingPerformance: '查看教学表现指标',
    featureComingSoon: '功能即将推出！',

    // Library specific
    libraryData: '图书馆数据',
    borrowedBooks: '借阅图书',
    overdueItems: '逾期项目',
    borrowingLimits: '借阅限制',

    // Assignment & Homework Management
    assignments: '作业',
    assignmentsHomework: '作业与家庭作业',
    createHomework: '创建家庭作业',
    homeworkTitle: '家庭作业标题',
    homeworkDescription: '家庭作业描述',
    enterHomeworkTitle: '输入家庭作业标题...',
    enterHomeworkDescription: '输入家庭作业描述和说明...',
    selectClass: '选择班级',
    selectStudents: '选择学生',
    selectDeadline: '选择截止日期',
    setDeadline: '设置截止日期',
    addAssignmentFile: '添加作业文件',
    enterFileUrl: '输入文件URL (例如: https://example.com/file.pdf)...',
    pleaseEnterHomeworkTitle: '请输入家庭作业标题',
    pleaseEnterHomeworkDescription: '请输入家庭作业描述',
    pleaseSelectClass: '请选择一个班级',
    pleaseSelectStudents: '请至少选择一个学生',
    pleaseSelectDeadline: '请选择截止日期',
    homeworkCreatedSuccessfully: '家庭作业创建成功！',
    failedToCreateHomework: '创建家庭作业失败',
    failedToFetchClasses: '获取班级失败',
    loadingClasses: '正在加载班级...',
    loadingAssignments: '正在加载作业数据...',

    // Assignment Status
    assignmentCompleted: '已完成',
    assignmentOverdue: '已逾期',
    assignmentDueToday: '今日到期',
    assignmentPending: '待处理',
    markAsDone: '标记为完成',
    markDone: '标记完成',
    alreadyCompleted: '已完成',
    assignmentMarkedCompleted: '作业已标记为完成！',
    assignmentAlreadySubmitted: '此作业已标记为完成。',
    failedToMarkDone: '标记完成失败',
    confirmMarkDone: '您确定要将"{title}"标记为完成吗？',

    // Assignment Display
    showAll: '显示全部',
    showCompleted: '显示已完成',
    noCompletedAssignments: '没有已完成的作业',
    noPendingAssignments: '没有待处理的作业',
    untitledAssignment: '无标题作业',
    unknownSubject: '未知科目',
    noDate: '无日期',

    // File Upload & Management (Additional)
    fileUploadWarning: '家庭作业创建成功，但文件上传失败。您可以稍后上传文件。',

    // Messaging & Communication (New Keys)
    conversation: '对话',
    enterMessage: '输入消息...',
    sendMessage: '发送消息',
    loadingMessages: '正在加载消息...',
    failedToLoadMessages: '加载消息失败',
    failedToSendMessage: '发送消息失败',
    messageCopied: '消息已复制到剪贴板',
    failedToCopyMessage: '复制消息失败',

    // Message Actions
    editMessage: '编辑消息',
    deleteMessage: '删除消息',
    deleteMessages: '删除消息',
    copyMessage: '复制消息',
    selectMessage: '选择消息',
    clearMessage: '清除消息',
    messageDeleted: '消息删除成功',
    messageEdited: '消息编辑成功',
    messageEditedSuccessfully: '消息编辑成功',
    messageCleared: '消息内容清除成功',
    messagesDeletedSuccessfully: '{count}条消息{plural}删除成功',
    failedToDeleteMessage: '删除消息失败',
    failedToDeleteMessages: '删除消息失败',
    failedToEditMessage: '编辑消息失败',
    failedToClearMessage: '清除消息失败',

    // Message Confirmations
    deleteMessageConfirm: '您确定要删除此消息吗？此操作无法撤销。',
    clearMessageConfirm:
      '这将用"[消息已删除]"替换消息内容。消息将保持可见，但内容将被清除。',
    deleteMessagesConfirm: '您确定要删除{count}条消息{plural}吗？',
    bulkDeleteSuccess: '{count}条消息{plural}删除成功',
    failedToBulkDelete: '删除消息失败',

    // Conversation Actions
    leaveConversation: '离开对话',
    deleteConversation: '删除对话',
    leaveConversationConfirm:
      '您确定要离开此对话吗？您将不再收到此对话的消息。',
    deleteConversationConfirm:
      '您确定要删除整个对话吗？这将永久删除所有消息且无法撤销。',
    leftConversationSuccess: '成功离开对话',
    conversationDeletedSuccess: '对话删除成功',
    failedToLeaveConversation: '离开对话失败',
    failedToDeleteConversation: '删除对话失败',

    // File Attachments (New Keys)
    fileAttachmentsComingSoon: '文件附件功能即将推出',
    attachmentPressed: '附件已点击',

    // General UI Elements (New Keys)
    copy: '复制',
    select: '选择',
    clear: '清除',
    leave: '离开',
    send: '发送',

    // Authentication & Connection
    authCodeMissing: '认证代码缺失',
    failedToConnect: '连接服务器失败',
    connectionError: '连接错误',
    serverError: '服务器错误',
    incorrectCredentials: '错误的{loginType}账号或密码！',

    // Home Screen Navigation & Diagnostics

    dataClearedMessage: '所有用户数据已清除。请重启应用并重新登录。',
    failedToClearData: '清除数据失败。请手动重启应用。',
    navigationError: '导航错误',
    unableToAccessTeacherScreen:
      '无法访问教师界面。这可能是由于数据损坏造成的。',
    unableToAccessParentScreen: '无法访问家长界面。请重试。',
    goToLogin: '前往登录',
    runDiagnostics: '运行诊断',
    accessScreen: '访问{screenName}',
    schoolInfoAccessMessage: '要查看学校信息，您可以直接登录或添加学生账户。',
    loginAsTeacher: '以教师身份登录',
    loginAsStudent: '以学生身份登录',

    // Social Media
    connectWithUsSocial: '在社交媒体上关注我们！',
    facebookComingSoon: 'Facebook页面即将推出！',
    twitterComingSoon: 'Twitter页面即将推出！',
    instagramComingSoon: 'Instagram页面即将推出！',
    youtubeComingSoon: 'YouTube频道即将推出！',

    // Teacher Screen
    confirmLogout: '您确定要退出登录吗？',
    scheduleAttendance: '课程表和考勤',
    assignmentsReview: '作业和复习',
    chatCommunication: '聊天和沟通',
    myCalendar: '我的日历',
    personalSchoolEvents: '个人和学校活动',
    teacherStudentWellbeing: '师生健康',
    classManagement: '班级管理',
    selectBranch: '选择分校',
    academicYear: '学年',
    week: '周',
    id: 'ID',

    // Parent Screen
    failedToAccessCalendar: '访问日历失败',
    soon: '即将推出',

    // Student Messaging Screen
    failedToLoadConversations: '加载对话失败',
    failedToMarkAsRead: '标记对话为已读失败',
    failedToSearchMessages: '搜索消息失败',
    searchConversationsMessages: '搜索对话和消息...',
    loadingConversations: '加载对话中...',

    // Notification Screen
    clearAllNotifications: '清除所有通知',
    clearAllNotificationsConfirm: '您确定要清除所有通知吗？此操作无法撤销。',
    allNotificationsCleared: '所有通知已清除。',
    failedToClearNotifications: '清除通知失败。',
    allNotificationsMarkedRead: '所有通知已标记为已读。',
    noUnreadNotifications: '您已查看完毕！没有未读通知。',
    noNotificationsYet: '收到通知时，您将在此处看到它们。',
    loadingNotifications: '加载通知中...',

    // Calendar Screen
    loginRequired: '需要登录',
    loginRequiredCalendarMessage: '请以教师或学生身份登录以访问日历。',
    schoolConfigNotFound: '未找到学校配置',
    failedToInitializeCalendar: '初始化日历失败',
    failedToLoadCalendarEvents: '加载日历事件失败',
    noDescription: '无描述',
    time: '时间',
    type: '类型',
    location: '地点',
    calendarServiceNotInitialized: '日历服务未初始化',
    accessDenied: '访问被拒绝',
    calendarTestStaffOnly: '日历连接测试仅适用于教职员工',
    noBranchIdForTesting: '没有可用于测试的分支ID',
    testingCalendarConnection: '测试日历连接',
    testingCalendarConnectionMessage: '正在测试Google日历连接...请稍候。',
    loadingCalendarEvents: '加载日历事件中...',
    signInToGoogleCalendar: '登录Google日历以查看更多事件。',
    checkBackForNewEvents: '稍后回来查看新事件。',

    // About Us Screen
    unableToLoadAboutUs: '无法加载关于我们的信息。请重试。',
    loadingAboutUs: '加载关于我们的信息中...',
    lastUpdated: '最后更新:',
    noAboutUsInfo: '目前没有关于我们的信息。',

    // Attendance Screen
    loadingAttendanceData: '加载考勤数据中...',
    attendanceSummary: '考勤摘要',
    dailyStatistics: '每日统计',
    absentRecords: '缺勤记录',
    lateRecords: '迟到记录',

    // Behavior Screen
    authenticationCodeMissing: '缺少身份验证代码',
    overviewStatistics: '概览与统计',
    records: '记录',

    noPositiveBehaviorPoints: '没有正面行为积分可显示',
    noNegativeBehaviorPoints: '没有负面行为积分可显示',

    // Contacts Screen
    unableToLoadContactInfo: '无法加载联系信息。请重试。',

    address: '地址',
    website: '网站',

    // FAQ Screen
    unableToLoadFAQInfo: '无法加载常见问题信息。请重试。',
    question: '问题',
    questions: '问题',

    // Grades Screen
    loadingFormativeGrades: '正在加载形成性评价成绩...',
    noLifeSkillsGradesForSubject: '{subject}没有生活技能成绩',
    noLifeSkillsGrades: '没有生活技能成绩',
    summative: '总结性评价',
    lifeSkills: '生活技能',
    notGraded: '未评分',

    // Library Screen
    authenticationRequired: '需要身份验证',
    failedToLoadLibraryData: '无法加载图书馆数据',
    failedToConnectLibrarySystem: '无法连接到图书馆系统',
    networkErrorOccurred: '发生网络错误',
    overview: '概览',
    borrowed: '已借阅',
    history: '历史记录',

    // Splash Screen
    inspiringBrilliance: '启发卓越',
    buildingBrighterFutures: '构建更美好的未来',

    // Teacher Attendance Screen
    failedToLoadAttendanceDetails: '无法加载考勤详情',
    networkErrorLoadingAttendance: '加载考勤时发生网络错误',
    failedToLoadStudentsData: '无法加载学生数据',
    networkErrorLoadingStudents: '加载学生时发生网络错误',
    incompleteAttendance: '考勤不完整',
    pleaseMarkAttendanceForAllStudents:
      '请为所有学生标记考勤。还有 {count} 名学生未标记。',
    attendanceSubmittedSuccessfullyDemo: '考勤已成功提交！（演示模式）',
    attendanceUpdatedSuccessfully: '考勤更新成功！',
    attendanceSubmittedSuccessfully: '考勤提交成功！',
    failedToSubmitAttendance: '考勤提交失败',
    updateAttendance: '更新考勤',
    takeAttendance: '考勤',
    loadingStudents: '正在加载学生...',
    submitAttendance: '提交考勤',

    // Teacher BPS Screen
    failedToFetchBPSData: '无法获取BPS数据',
    pleaseSelectStudentAndBehavior: '请至少选择一名学生和一个行为',
    noBranchInformationAvailable: '没有分校信息',
    partialSuccess: '部分成功',
    recordsCreatedPartially: '{total} 条记录中成功创建了 {successful} 条。',

    // Timetable Screen
    unknownTeacher: '未知教师',
    period: '课时',

    // Workspace Screen
    failedToLoadWorkspace: '无法加载工作区。请重试。',
    failedToLoadFolderContents: '无法加载文件夹内容。请重试。',
    failedToLoadRecentFiles: '无法加载最近文件。请重试。',

    // Assignment Detail Screen
    pleaseProvideResponse: '请提供书面回答、附加文件或添加文件链接',
    failedToUpdateAssignment: '更新作业失败',
    failedToSubmitAssignment: '提交作业失败',
    alreadySubmitted: '已提交',
    assignmentAlreadySubmitted: '此作业已经提交。',
    contactTeacher: '联系老师',
    contactTeacherMessage: '如需更新提交内容，请联系您的老师。',
    failedToConnectServer: '连接服务器失败：{error}',
    updateAssignment: '更新作业',
    submitAssignment: '提交作业',
    confirmUpdateAssignment: '您确定要更新此作业吗？',
    confirmSubmitAssignment: '您确定要提交此作业吗？',
    update: '更新',
    submit: '提交',
    unableToOpenFileLink: '无法打开文件链接',

    // Create Conversation Screen
    failedToLoadUsers: '加载用户失败',
    pleaseEnterConversationTopic: '请输入对话主题',
    pleaseSelectAtLeastOneUser: '请至少选择一个用户',
    conversationCreatedSuccessfully: '对话创建成功',
    failedToCreateConversation: '创建对话失败',
    usersSelected: '已选择 {count} 个用户',
    enterConversationTopic: '输入对话主题...',
    searchUsers: '搜索用户...',
    loadingUsers: '正在加载用户...',

    // Student Health Screen
    failedToLoadHealthData: '加载健康数据失败。请重试。',
    notSpecified: '未指定',
    loadingHealthData: '正在加载健康数据...',
    visitRecords: '就诊记录',
    healthInfo: '健康信息',
    medicalConditions: '疾病状况',
    regularMedication: '常用药物',
    visionAndHearing: '视力与听力',
    visionProblems: '视力问题',
    lastVisionCheck: '最近视力检查',
    hearingIssues: '听力问题',
    allergiesAndFood: '过敏与饮食',
    foodConsiderations: '饮食注意事项',
    allergies: '过敏',
    allergySymptoms: '过敏症状',
    firstAidInstructions: '急救指导',
    allowedMedications: '允许使用的药物',
    emergencyContacts: '紧急联系人',
    primaryContact: '主要联系人',
    primaryPhone: '主要电话',
    secondaryContact: '次要联系人',
    secondaryPhone: '次要电话',
  },
  th: {
    // Common
    loading: 'กำลังโหลด...',
    error: 'ข้อผิดพลาด',
    success: 'สำเร็จ',
    cancel: 'ยกเลิก',
    ok: 'ตกลง',
    save: 'บันทึก',
    delete: 'ลบ',
    edit: 'แก้ไข',
    back: 'กลับ',
    next: 'ถัดไป',
    previous: 'ก่อนหน้า',
    search: 'ค้นหา',
    filter: 'กรอง',
    refresh: 'รีเฟรช',

    // Navigation
    home: 'หน้าหลัก',
    dashboard: 'แดชบอร์ด',
    settings: 'การตั้งค่า',
    profile: 'โปรไฟล์',
    logout: 'ออกจากระบบ',

    // Authentication
    login: 'เข้าสู่ระบบ',
    username: 'ชื่อผู้ใช้',
    password: 'รหัสผ่าน',
    forgotPassword: 'ลืมรหัสผ่าน?',

    // Dashboard
    teacher: 'ครู',
    parent: 'ผู้ปกครอง',
    student: 'นักเรียน',
    welcomeTo: 'ยินดีต้อนรับสู่',

    // Academic
    assessments: 'การประเมิน',
    attendance: 'การเข้าเรียน',
    timetable: 'ตารางเรียน',
    homework: 'การบ้าน',
    behavior: 'การจัดการ BPS',
    discipline: 'วินัย',

    // Settings
    language: 'ภาษา',
    theme: 'ธีม',
    lightMode: 'โหมดสว่าง',
    darkMode: 'โหมดมืด',
    notifications: 'การแจ้งเตือน',
    about: 'เกี่ยวกับ',
    version: 'เวอร์ชัน',

    // Messages
    noData: 'ไม่มีข้อมูล',
    networkError: 'ข้อผิดพลาดเครือข่าย กรุณาลองใหม่อีกครั้ง',
    loginSuccess: 'เข้าสู่ระบบสำเร็จ',
    loginError: 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลของคุณ',

    // Specific UI Elements
    parentDashboard: 'แดชบอร์ดผู้ปกครอง',
    teacherDashboard: 'แดชบอร์ดครู',
    yourChildren: 'บุตรหลานของคุณ',
    yourChild: 'บุตรหลานของคุณ',
    menu: 'เมนู',
    addStudent: 'เพิ่มนักเรียน',
    deleteStudent: 'ลบนักเรียน',
    selectStudent: 'เลือกนักเรียน',
    noStudentSelected: 'ไม่ได้เลือกนักเรียน',
    pleaseSelectStudent: 'กรุณาเลือกนักเรียนก่อนเพื่อดูข้อมูล',
    authenticationError: 'ข้อผิดพลาดการยืนยันตัวตน',
    unableToAuthenticate:
      'ไม่สามารถยืนยันตัวตนนักเรียนคนนี้ได้ กรุณาติดต่อฝ่ายสนับสนุน',
    removeStudent: 'ลบนักเรียน',
    areYouSure: 'คุณแน่ใจหรือไม่ที่จะลบ',
    studentRemoved: 'ลบนักเรียนสำเร็จ',
    failedToRemove: 'ลบนักเรียนไม่สำเร็จ',
    addStudentAccount: 'เพิ่มบัญชีนักเรียน',
    noStudentAccounts: 'ยังไม่ได้เพิ่มบัญชีนักเรียน',
    tapToAdd: 'แตะปุ่ม + ในส่วนหัวเพื่อเพิ่มบัญชีของบุตรหลาน',
    scrollForMore: 'เลื่อนเพื่อดูเพิ่มเติม →',
    selected: 'เลือกแล้ว',

    // Menu Items
    calendar: 'ปฏิทิน',
    health: 'รายงานการแพทย์',
    messages: 'ข้อความ',

    // Alert Messages
    noStudents: 'ไม่มีนักเรียน',
    pleaseAddStudent: 'กรุณาเพิ่มบัญชีนักเรียนก่อนเพื่อดูการแจ้งเตือน',
    duplicateStudent: 'นักเรียนซ้ำ',

    // Login Screen
    teacherId: 'รหัสครู',
    studentId: 'รหัสนักเรียน',
    pleaseEnterCredentials: 'กรุณาใส่ชื่อผู้ใช้และรหัสผ่านทั้งสองอย่าง',
    studentAccountExists: 'บัญชีนักเรียนนี้ได้ถูกเพิ่มแล้ว',
    studentAccountAdded: 'เพิ่มบัญชีนักเรียนสำเร็จ',
    failedToSaveStudent: 'บันทึกบัญชีนักเรียนไม่สำเร็จ',
    loginSuccessful: 'เข้าสู่ระบบสำเร็จ',
    welcomeMessage:
      'ยินดีต้อนรับ {name}! ตอนนี้คุณสามารถเข้าถึงปฏิทินและทรัพยากรของโรงเรียนอื่นๆ ได้แล้ว',
    loginFailed: 'เข้าสู่ระบบไม่สำเร็จ',
    networkConnectionError:
      'ข้อผิดพลาดการเชื่อมต่อเครือข่าย กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ',
    unableToConnectServer:
      'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้งในภายหลัง',
    connectionTimeout:
      'การเชื่อมต่อหมดเวลา กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง',
    unknownError: 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ',
    failedToCompleteLogin: 'ไม่สามารถดำเนินการเข้าสู่ระบบให้เสร็จสิ้นได้',

    // Messaging
    enableNotifications: 'เปิดใช้งานการแจ้งเตือน',
    notificationPermissionMessage:
      'คุณต้องการรับข้อมูลอัปเดตที่สำคัญเกี่ยวกับการศึกษาของบุตรหลานหรือไม่? ซึ่งรวมถึงเกรด การเข้าเรียน และประกาศของโรงเรียน',
    notNow: 'ไม่ใช่ตอนนี้',

    // Performance Monitor
    continue: 'ดำเนินการต่อ',
    forceRestart: 'บังคับรีสตาร์ท',

    // Diagnostics
    diagnosticsError: 'ข้อผิดพลาดการวินิจฉัย',
    unableToRunDiagnostics: 'ไม่สามารถรันการวินิจฉัยได้ กรุณารีสตาร์ทแอป',
    navigationDiagnostics: 'การวินิจฉัยการนำทาง',
    dataCleared: 'ล้างข้อมูลแล้ว',
    clearDataRestart: 'ล้างข้อมูลและรีสตาร์ท',
    allDataCleared:
      'ข้อมูลผู้ใช้ทั้งหมดได้ถูกล้างแล้ว กรุณารีสตาร์ทแอปและเข้าสู่ระบบใหม่',
    deviceStorageError:
      'แอปไม่สามารถเข้าถึงที่เก็บข้อมูลของอุปกรณ์ได้ กรุณารีสตาร์ทแอปและลองใหม่อีกครั้ง',
    noUserAccountsFound:
      'ไม่พบบัญชีผู้ใช้ กรุณาเข้าสู่ระบบในฐานะครู/นักเรียน หรือเพิ่มบัญชีนักเรียนผ่านส่วนผู้ปกครอง',

    // Common UI
    typeMessage: 'พิมพ์ข้อความ...',
    available: 'พร้อมใช้งาน',
    notAvailable: 'ไม่พร้อมใช้งาน',
    enabled: 'เปิดใช้งาน',
    disabled: 'ปิดใช้งาน',
    debugInfo: 'ข้อมูลดีบัก (การตรวจสอบแอป)',
    platform: 'แพลตฟอร์ม',
    dummyData: 'ข้อมูลจำลอง',
    networkTimeout: 'เครือข่ายหมดเวลา',
    deviceToken: 'โทเค็นอุปกรณ์',

    // Modal and Dialog
    confirm: 'ยืนยัน',
    step: 'ขั้นตอน',
    of: 'จาก',

    // Empty States
    somethingWentWrong: 'เกิดข้อผิดพลาดบางอย่าง',
    pleaseTryAgainLater: 'กรุณาลองใหม่อีกครั้งในภายหลัง',
    retry: 'ลองใหม่',

    // Settings Screen
    developedBy: 'พัฒนาโดย EduNova Myanmar',

    // BPS Notifications
    positiveBehaviorRecognition: 'การยอมรับพฤติกรรมเชิงบวก',
    behaviorNotice: 'ประกาศพฤติกรรม',
    points: 'คะแนน',

    // File Upload
    fileTooLarge: 'ไฟล์ใหญ่เกินไป',
    pleaseSelectSmallerFile: 'กรุณาเลือกไฟล์ที่เล็กกว่า',
    failedToSelectImage: 'ไม่สามารถเลือกรูปภาพได้',
    uploadFunctionNotProvided: 'ไม่ได้ระบุฟังก์ชันอัปโหลด',
    fileUploadedSuccessfully: 'อัปโหลดไฟล์สำเร็จ!',
    uploadFailed: 'อัปโหลดล้มเหลว',
    failedToUploadFile: 'ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง',

    // Validation
    packageJsonNotFound: 'ไม่พบ package.json',
    nameIsRequired: 'จำเป็นต้องมีชื่อ',
    versionIsRequired: 'จำเป็นต้องมีเวอร์ชัน',
    invalidJson: 'JSON ไม่ถูกต้อง',
    pleaseFix: 'กรุณาแก้ไขข้อผิดพลาดก่อนดำเนินการต่อ',
    pleaseReview:
      'กรุณาตรวจสอบคำเตือน แอปอาจยังคงทำงานได้ แต่การกำหนดค่าบางอย่างต้องการความสนใจ',

    // Home Screen
    chooseYourRole: 'เลือกบทบาทของคุณเพื่อดำเนินการต่อ',
    schoolResources: 'ทรัพยากรโรงเรียน',
    connectWithUs: 'ติดต่อเรา',

    // Role Descriptions
    teacherDescription:
      'เข้าถึงเครื่องมือการสอน จัดการชั้นเรียน และติดตามความก้าวหน้าของนักเรียน',
    parentDescription:
      'ติดตามความก้าวหน้าของลูก สื่อสารกับครู และรับข้อมูลล่าสุด',
    studentDescription:
      'ดูงานที่ได้รับมอบหมาย ตรวจสอบเกรด และเข้าถึงสื่อการเรียนรู้',

    // Menu Items
    aboutUs: 'เกี่ยวกับเรา',
    contactUs: 'ติดต่อเรา',
    faq: 'คำถามที่พบบ่อย',

    // Settings Screen
    darkThemeEnabled: 'เปิดใช้งานธีมมืดแล้ว',
    lightThemeEnabled: 'เปิดใช้งานธีมสว่างแล้ว',
    notificationsTitle: 'การแจ้งเตือน',
    pushNotifications: 'การแจ้งเตือนแบบพุช',
    notificationEnabled: 'เปิดใช้งาน',
    notificationDisabled: 'ปิดใช้งาน',
    notificationSound: 'เสียง',
    playSoundForNotifications: 'เล่นเสียงสำหรับการแจ้งเตือน',
    notificationVibration: 'การสั่น',
    vibrateForNotifications: 'สั่นสำหรับการแจ้งเตือน',
    notificationTypes: 'ประเภทการแจ้งเตือน',
    gradesNotification: 'เกรด',
    newGradesAndUpdates: 'เกรดใหม่และการอัปเดตทางวิชาการ',
    attendanceNotification: 'การเข้าเรียน',
    attendanceReminders: 'การเตือนการเข้าเรียนและการอัปเดต',
    homeworkNotification: 'การบ้าน',
    assignmentDueDates: 'วันครบกำหนดงานและการอัปเดต',
    behaviorPointsNotification: 'คะแนนพฤติกรรม',
    bpsUpdates: 'การอัปเดต BPS และการแจ้งเตือนพฤติกรรม',
    emergencyAlerts: 'การแจ้งเตือนฉุกเฉิน',
    importantAnnouncements: 'ประกาศสำคัญของโรงเรียน',
    permissionRequired: 'ต้องการสิทธิ์',
    enableNotificationsMessage:
      'กรุณาเปิดใช้งานการแจ้งเตือนในการตั้งค่าอุปกรณ์ของคุณเพื่อรับการอัปเดตที่สำคัญ',
    openSettings: 'เปิดการตั้งค่า',

    // Academic specific
    totalPoints: 'คะแนนรวม',
    totalRecords: 'บันทึกทั้งหมด',
    behaviorPoints: 'คะแนนพฤติกรรม',
    positive: 'เชิงบวก',
    negative: 'เชิงลบ',
    detentions: 'การกักตัว',
    served: 'ดำเนินการแล้ว',
    notServed: 'ยังไม่ดำเนินการ',
    detentionsCompleted: 'การกักตัวที่เสร็จสิ้น',
    pendingDetentions: 'การกักตัวที่รอดำเนินการ',
    noDetentionsFound: 'ไม่พบการกักตัว',
    noServedDetentions: 'ไม่มีการกักตัวที่เสร็จสิ้นแล้ว',
    noPendingDetentions: 'ไม่มีการกักตัวที่รอดำเนินการ',
    noBehaviorPoints: 'ไม่พบคะแนนพฤติกรรม',
    noPositiveBehavior: 'ไม่มีคะแนนพฤติกรรมเชิงบวก',
    noNegativeBehavior: 'ไม่มีคะแนนพฤติกรรมเชิงลบ',

    // Common actions
    viewTimetable: 'ดูตารางเรียน',
    manageBPS: 'จัดการ BPS',
    quickActions: 'การดำเนินการด่วน',
    features: 'คุณสมบัติ',
    appPreferences: 'การตั้งค่าแอปและการแจ้งเตือน',
    homeroom: 'ห้องเรียน',

    // Time and dates
    today: 'วันนี้',
    yesterday: 'เมื่อวาน',
    thisWeek: 'สัปดาห์นี้',
    thisMonth: 'เดือนนี้',

    // Status
    present: 'มาเรียน',
    absent: 'ขาดเรียน',
    late: 'มาสาย',
    excused: 'ลาป่วย',
    pending: 'รอดำเนินการ',
    completed: 'เสร็จสิ้น',
    submitted: 'ส่งแล้ว',
    overdue: 'เกินกำหนด',

    // New Features
    myProfile: 'โปรไฟล์ของฉัน',
    personalInformation: 'ข้อมูลส่วนตัว',
    workInformation: 'ข้อมูลการทำงาน',
    rolesResponsibilities: 'บทบาทและความรับผิดชอบ',
    fullName: 'ชื่อเต็ม',
    employeeId: 'รหัสพนักงาน',
    email: 'อีเมล',
    phone: 'โทรศัพท์',
    position: 'ตำแหน่ง',
    department: 'แผนก',
    branch: 'สาขา',
    joinDate: 'วันที่เข้าทำงาน',
    notProvided: 'ไม่ได้ระบุ',
    loadingProfile: 'กำลังโหลดโปรไฟล์...',
    viewEditProfile: 'ดูและแก้ไขข้อมูลโปรไฟล์',
    areYouSureLogout: 'คุณแน่ใจหรือไม่ที่จะออกจากระบบ?',

    // Coming Soon
    comingSoon: 'เร็วๆ นี้',
    reports: 'รายงาน',
    materials: 'เอกสาร',
    analytics: 'การวิเคราะห์',
    library: 'ห้องสมุด',
    analyticsStats: 'การวิเคราะห์และสถิติ',
    resourcesFiles: 'ทรัพยากรและไฟล์',

    // Reports
    myReports: 'รายงานของฉัน',
    staffReports: 'รายงานเจ้าหน้าที่',
    loadingReports: 'กำลังโหลดรายงาน...',
    failedToLoadReports: 'โหลดรายงานไม่สำเร็จ',
    failedToLoadReportData: 'โหลดข้อมูลรายงานไม่สำเร็จ',
    failedToLoadClasses: 'โหลดห้องเรียนไม่สำเร็จ',
    noReportData: 'ไม่มีข้อมูลรายงาน',
    noReportDataMessage: 'ไม่มีข้อมูลรายงานสำหรับช่วงเวลาที่เลือก',
    selectClassAndReport: 'กรุณาเลือกห้องเรียนและประเภทรายงาน',
    selectClass: 'เลือกห้องเรียน',
    summary: 'สรุป',
    visualization: 'การแสดงผลด้วยภาพ',

    // Report Types - Student
    attendance: 'การเข้าเรียน',
    grades: 'เกรด',
    bps: 'คะแนนพฤติกรรม',
    homework: 'การบ้าน',

    // Report Types - Staff
    classAttendance: 'การเข้าเรียนของห้อง',
    classAssessment: 'การประเมินห้องเรียน',
    behavioralAnalytics: 'การวิเคราะห์พฤติกรรม',
    homeworkAnalytics: 'การวิเคราะห์การบ้าน',

    // Attendance Stats
    totalDays: 'จำนวนวันทั้งหมด',
    present: 'มาเรียน',
    absent: 'ขาดเรียน',
    attendanceRate: 'อัตราการเข้าเรียน',
    totalStudents: 'จำนวนนักเรียนทั้งหมด',
    presentCount: 'จำนวนที่มาเรียน',
    absentCount: 'จำนวนที่ขาดเรียน',

    // Grades Stats
    totalSubjects: 'จำนวนวิชาทั้งหมด',
    averageGrade: 'เกรดเฉลี่ย',
    highestGrade: 'เกรดสูงสุด',
    lowestGrade: 'เกรดต่ำสุด',
    passingGrade: 'เกรดผ่าน',
    failingGrade: 'เกรดไม่ผ่าน',

    // BPS Stats
    totalPoints: 'คะแนนรวม',
    positivePoints: 'คะแนนบวก',
    negativePoints: 'คะแนนลบ',
    netPoints: 'คะแนนสุทธิ',
    totalRecords: 'บันทึกทั้งหมด',
    positiveRecords: 'บันทึกเชิงบวก',
    negativeRecords: 'บันทึกเชิงลบ',

    // Homework Stats
    totalHomework: 'การบ้านทั้งหมด',
    completed: 'เสร็จแล้ว',
    pending: 'รอดำเนินการ',
    completionRate: 'อัตราการเสร็จสิ้น',
    totalAssigned: 'มอบหมายทั้งหมด',
    totalSubmissions: 'ส่งทั้งหมด',
    completedSubmissions: 'ส่งเสร็จแล้ว',

    // Library Stats
    totalBooksRead: 'หนังสือทั้งหมด',
    booksReturned: 'หนังสือที่คืนแล้ว',
    currentlyBorrowed: 'กำลังยืมอยู่',
    readingHours: 'ชั่วโมงการอ่าน',
    booksOverdue: 'หนังสือเกินกำหนด',
    favoriteGenre: 'ประเภทที่ชอบ',

    teachingPerformance: 'ดูตัวชี้วัดประสิทธิภาพการสอน',
    featureComingSoon: 'คุณสมบัตินี้เร็วๆ นี้!',

    // Library specific
    libraryData: 'ข้อมูลห้องสมุด',
    borrowedBooks: 'หนังสือที่ยืม',
    overdueItems: 'รายการที่เกินกำหนด',
    borrowingLimits: 'ขีดจำกัดการยืม',

    // Assignment & Homework Management
    assignments: 'งานที่มอบหมาย',
    assignmentsHomework: 'งานที่มอบหมายและการบ้าน',
    createHomework: 'สร้างการบ้าน',
    homeworkTitle: 'หัวข้อการบ้าน',
    homeworkDescription: 'คำอธิบายการบ้าน',
    enterHomeworkTitle: 'ใส่หัวข้อการบ้าน...',
    enterHomeworkDescription: 'ใส่คำอธิบายและคำแนะนำการบ้าน...',
    selectClass: 'เลือกชั้นเรียน',
    selectStudents: 'เลือกนักเรียน',
    selectDeadline: 'เลือกกำหนดส่ง',
    setDeadline: 'กำหนดวันส่ง',
    addAssignmentFile: 'เพิ่มไฟล์งาน',
    enterFileUrl: 'ใส่ URL ไฟล์ (เช่น: https://example.com/file.pdf)...',
    pleaseEnterHomeworkTitle: 'กรุณาใส่หัวข้อการบ้าน',
    pleaseEnterHomeworkDescription: 'กรุณาใส่คำอธิบายการบ้าน',
    pleaseSelectClass: 'กรุณาเลือกชั้นเรียน',
    pleaseSelectStudents: 'กรุณาเลือกนักเรียนอย่างน้อยหนึ่งคน',
    pleaseSelectDeadline: 'กรุณาเลือกกำหนดส่ง',
    homeworkCreatedSuccessfully: 'สร้างงานการบ้านสำเร็จ!',
    failedToCreateHomework: 'สร้างงานการบ้านไม่สำเร็จ',
    failedToFetchClasses: 'ดึงข้อมูลชั้นเรียนไม่สำเร็จ',
    loadingClasses: 'กำลังโหลดชั้นเรียน...',
    loadingAssignments: 'กำลังโหลดข้อมูลงาน...',

    // Assignment Status
    assignmentCompleted: 'เสร็จสิ้น',
    assignmentOverdue: 'เกินกำหนด',
    assignmentDueToday: 'ครบกำหนดวันนี้',
    assignmentPending: 'รอดำเนินการ',
    markAsDone: 'ทำเครื่องหมายเสร็จ',
    markDone: 'ทำเครื่องหมายเสร็จ',
    alreadyCompleted: 'เสร็จสิ้นแล้ว',
    assignmentMarkedCompleted: 'ทำเครื่องหมายงานเสร็จสิ้นแล้ว!',
    assignmentAlreadySubmitted: 'งานนี้ได้ทำเครื่องหมายเสร็จสิ้นแล้ว',
    failedToMarkDone: 'ทำเครื่องหมายเสร็จไม่สำเร็จ',
    confirmMarkDone:
      'คุณแน่ใจหรือไม่ที่จะทำเครื่องหมาย "{title}" เป็นเสร็จสิ้น?',

    // Assignment Display
    showAll: 'แสดงทั้งหมด',
    showCompleted: 'แสดงที่เสร็จแล้ว',
    noCompletedAssignments: 'ไม่มีงานที่เสร็จสิ้น',
    noPendingAssignments: 'ไม่มีงานที่รอดำเนินการ',
    untitledAssignment: 'งานไม่มีชื่อ',
    unknownSubject: 'วิชาไม่ทราบ',
    noDate: 'ไม่มีวันที่',

    // File Upload & Management (Additional)
    fileUploadWarning:
      'สร้างงานการบ้านสำเร็จแต่อัปโหลดไฟล์ไม่สำเร็จ คุณสามารถอัปโหลดไฟล์ภายหลังได้',

    // Messaging & Communication (New Keys)
    conversation: 'การสนทนา',
    enterMessage: 'พิมพ์ข้อความ...',
    sendMessage: 'ส่งข้อความ',
    loadingMessages: 'กำลังโหลดข้อความ...',
    failedToLoadMessages: 'โหลดข้อความไม่สำเร็จ',
    failedToSendMessage: 'ส่งข้อความไม่สำเร็จ',
    messageCopied: 'คัดลอกข้อความไปยังคลิปบอร์ดแล้ว',
    failedToCopyMessage: 'คัดลอกข้อความไม่สำเร็จ',

    // Message Actions
    editMessage: 'แก้ไขข้อความ',
    deleteMessage: 'ลบข้อความ',
    deleteMessages: 'ลบข้อความ',
    copyMessage: 'คัดลอกข้อความ',
    selectMessage: 'เลือกข้อความ',
    clearMessage: 'ล้างข้อความ',
    messageDeleted: 'ลบข้อความสำเร็จ',
    messageEdited: 'แก้ไขข้อความสำเร็จ',
    messageEditedSuccessfully: 'แก้ไขข้อความสำเร็จ',
    messageCleared: 'ล้างเนื้อหาข้อความสำเร็จ',
    messagesDeletedSuccessfully: 'ลบ {count} ข้อความ{plural} สำเร็จ',
    failedToDeleteMessage: 'ลบข้อความไม่สำเร็จ',
    failedToDeleteMessages: 'ลบข้อความไม่สำเร็จ',
    failedToEditMessage: 'แก้ไขข้อความไม่สำเร็จ',
    failedToClearMessage: 'ล้างข้อความไม่สำเร็จ',

    // Message Confirmations
    deleteMessageConfirm:
      'คุณแน่ใจหรือไม่ที่จะลบข้อความนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้',
    clearMessageConfirm:
      'การดำเนินการนี้จะแทนที่เนื้อหาข้อความด้วย "[Message Deleted]" ข้อความจะยังคงมองเห็นได้แต่เนื้อหาจะถูกล้าง',
    deleteMessagesConfirm: 'คุณแน่ใจหรือไม่ที่จะลบ {count} ข้อความ{plural}?',
    bulkDeleteSuccess: 'ลบ {count} ข้อความ{plural} สำเร็จ',
    failedToBulkDelete: 'ลบข้อความไม่สำเร็จ',

    // Conversation Actions
    leaveConversation: 'ออกจากการสนทนา',
    deleteConversation: 'ลบการสนทนา',
    leaveConversationConfirm:
      'คุณแน่ใจหรือไม่ที่จะออกจากการสนทนานี้? คุณจะไม่ได้รับข้อความจากการสนทนานี้อีกต่อไป',
    deleteConversationConfirm:
      'คุณแน่ใจหรือไม่ที่จะลบการสนทนาทั้งหมดนี้? การดำเนินการนี้จะลบข้อความทั้งหมดอย่างถาวรและไม่สามารถยกเลิกได้',
    leftConversationSuccess: 'ออกจากการสนทนาสำเร็จ',
    conversationDeletedSuccess: 'ลบการสนทนาสำเร็จ',
    failedToLeaveConversation: 'ออกจากการสนทนาไม่สำเร็จ',
    failedToDeleteConversation: 'ลบการสนทนาไม่สำเร็จ',

    // File Attachments (New Keys)
    fileAttachmentsComingSoon: 'ไฟล์แนบจะมีให้ใช้งานเร็วๆ นี้',
    attachmentPressed: 'กดไฟล์แนบแล้ว',

    // General UI Elements (New Keys)
    copy: 'คัดลอก',
    select: 'เลือก',
    clear: 'ล้าง',
    leave: 'ออก',
    send: 'ส่ง',

    // Authentication & Connection
    authCodeMissing: 'รหัสยืนยันตัวตนหายไป',
    failedToConnect: 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ',
    connectionError: 'ข้อผิดพลาดการเชื่อมต่อ',
    serverError: 'ข้อผิดพลาดเซิร์ฟเวอร์',
    incorrectCredentials: '{loginType} ID หรือรหัสผ่านไม่ถูกต้อง!',

    // Home Screen Navigation & Diagnostics
    dataClearedMessage:
      'ข้อมูลผู้ใช้ทั้งหมดถูกล้างแล้ว กรุณาเริ่มแอปใหม่และเข้าสู่ระบบอีกครั้ง',
    failedToClearData: 'ล้างข้อมูลไม่สำเร็จ กรุณาเริ่มแอปใหม่ด้วยตนเอง',
    navigationError: 'ข้อผิดพลาดการนำทาง',
    unableToAccessTeacherScreen:
      'ไม่สามารถเข้าถึงหน้าจอครู อาจเกิดจากข้อมูลเสียหาย',
    unableToAccessParentScreen: 'ไม่สามารถเข้าถึงหน้าจอผู้ปกครอง กรุณาลองใหม่',
    goToLogin: 'ไปที่หน้าเข้าสู่ระบบ',
    runDiagnostics: 'เรียกใช้การวินิจฉัย',
    accessScreen: 'เข้าถึง{screenName}',
    schoolInfoAccessMessage:
      'เพื่อดูข้อมูลโรงเรียน คุณสามารถเข้าสู่ระบบโดยตรงหรือเพิ่มบัญชีนักเรียน',
    loginAsTeacher: 'เข้าสู่ระบบในฐานะครู',
    loginAsStudent: 'เข้าสู่ระบบในฐานะนักเรียน',

    // Social Media
    connectWithUsSocial: 'ติดตามเราบนโซเชียลมีเดีย!',
    facebookComingSoon: 'หน้า Facebook เร็วๆ นี้!',
    twitterComingSoon: 'หน้า Twitter เร็วๆ นี้!',
    instagramComingSoon: 'หน้า Instagram เร็วๆ นี้!',
    youtubeComingSoon: 'ช่อง YouTube เร็วๆ นี้!',

    // Teacher Screen
    confirmLogout: 'คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?',
    scheduleAttendance: 'ตารางเรียนและการเข้าเรียน',
    assignmentsReview: 'การบ้านและการทบทวน',
    chatCommunication: 'แชทและการสื่อสาร',
    myCalendar: 'ปฏิทินของฉัน',
    personalSchoolEvents: 'กิจกรรมส่วนตัวและโรงเรียน',
    teacherStudentWellbeing: 'สุขภาพครูและนักเรียน',
    classManagement: 'การจัดการชั้นเรียน',
    selectBranch: 'เลือกสาขา',
    academicYear: 'ปีการศึกษา',
    week: 'สัปดาห์',
    id: 'ID',

    // Parent Screen
    failedToAccessCalendar: 'เข้าถึงปฏิทินไม่สำเร็จ',
    soon: 'เร็วๆ นี้',

    // Student Messaging Screen
    failedToLoadConversations: 'โหลดการสนทนาไม่สำเร็จ',
    failedToMarkAsRead: 'ทำเครื่องหมายการสนทนาเป็นอ่านแล้วไม่สำเร็จ',
    failedToSearchMessages: 'ค้นหาข้อความไม่สำเร็จ',
    searchConversationsMessages: 'ค้นหาการสนทนาและข้อความ...',
    loadingConversations: 'กำลังโหลดการสนทนา...',

    // Notification Screen
    clearAllNotifications: 'ล้างการแจ้งเตือนทั้งหมด',
    clearAllNotificationsConfirm:
      'คุณแน่ใจหรือไม่ว่าต้องการล้างการแจ้งเตือนทั้งหมด? การดำเนินการนี้ไม่สามารถยกเลิกได้',
    allNotificationsCleared: 'การแจ้งเตือนทั้งหมดถูกล้างแล้ว',
    failedToClearNotifications: 'ล้างการแจ้งเตือนไม่สำเร็จ',
    allNotificationsMarkedRead:
      'การแจ้งเตือนทั้งหมดถูกทำเครื่องหมายว่าอ่านแล้ว',
    noUnreadNotifications: 'คุณอ่านครบแล้ว! ไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน',
    noNotificationsYet: 'คุณจะเห็นการแจ้งเตือนที่นี่เมื่อได้รับ',
    loadingNotifications: 'กำลังโหลดการแจ้งเตือน...',

    // Calendar Screen
    loginRequired: 'ต้องเข้าสู่ระบบ',
    loginRequiredCalendarMessage:
      'กรุณาเข้าสู่ระบบในฐานะครูหรือนักเรียนเพื่อเข้าถึงปฏิทิน',
    schoolConfigNotFound: 'ไม่พบการกำหนดค่าโรงเรียน',
    failedToInitializeCalendar: 'เริ่มต้นปฏิทินไม่สำเร็จ',
    failedToLoadCalendarEvents: 'โหลดกิจกรรมปฏิทินไม่สำเร็จ',
    noDescription: 'ไม่มีคำอธิบาย',
    time: 'เวลา',
    type: 'ประเภท',
    location: 'สถานที่',
    calendarServiceNotInitialized: 'บริการปฏิทินยังไม่ได้เริ่มต้น',
    accessDenied: 'ปฏิเสธการเข้าถึง',
    calendarTestStaffOnly:
      'การทดสอบการเชื่อมต่อปฏิทินใช้ได้เฉพาะเจ้าหน้าที่เท่านั้น',
    noBranchIdForTesting: 'ไม่มี ID สาขาสำหรับการทดสอบ',
    testingCalendarConnection: 'กำลังทดสอบการเชื่อมต่อปฏิทิน',
    testingCalendarConnectionMessage:
      'กำลังทดสอบการเชื่อมต่อ Google ปฏิทิน... กรุณารอสักครู่',
    loadingCalendarEvents: 'กำลังโหลดกิจกรรมปฏิทิน...',
    signInToGoogleCalendar: 'เข้าสู่ระบบ Google ปฏิทินเพื่อดูกิจกรรมเพิ่มเติม',
    checkBackForNewEvents: 'กลับมาดูกิจกรรมใหม่ในภายหลัง',

    // About Us Screen
    unableToLoadAboutUs:
      'ไม่สามารถโหลดข้อมูลเกี่ยวกับเราได้ กรุณาลองใหม่อีกครั้ง',
    loadingAboutUs: 'กำลังโหลดข้อมูลเกี่ยวกับเรา...',
    lastUpdated: 'อัปเดตล่าสุด:',
    noAboutUsInfo: 'ไม่มีข้อมูลเกี่ยวกับเราในขณะนี้',

    // Attendance Screen
    loadingAttendanceData: 'กำลังโหลดข้อมูลการเข้าเรียน...',
    attendanceSummary: 'สรุปการเข้าเรียน',
    dailyStatistics: 'สถิติรายวัน',
    absentRecords: 'บันทึกการขาดเรียน',
    lateRecords: 'บันทึกการมาสาย',

    // Behavior Screen
    authenticationCodeMissing: 'ไม่มีรหัสยืนยันตัวตน',
    overviewStatistics: 'ภาพรวมและสถิติ',
    records: 'บันทึก',
    noPositiveBehaviorPoints: 'ไม่มีคะแนนพฤติกรรมเชิงบวกที่จะแสดง',
    noNegativeBehaviorPoints: 'ไม่มีคะแนนพฤติกรรมเชิงลบที่จะแสดง',

    // Contacts Screen
    unableToLoadContactInfo:
      'ไม่สามารถโหลดข้อมูลติดต่อได้ กรุณาลองใหม่อีกครั้ง',
    address: 'ที่อยู่',
    website: 'เว็บไซต์',

    // FAQ Screen
    unableToLoadFAQInfo:
      'ไม่สามารถโหลดข้อมูลคำถามที่พบบ่อยได้ กรุณาลองใหม่อีกครั้ง',
    question: 'คำถาม',
    questions: 'คำถาม',

    // Grades Screen
    loadingFormativeGrades: 'กำลังโหลดคะแนนการประเมินระหว่างเรียน...',
    noLifeSkillsGradesForSubject: 'ไม่มีคะแนนทักษะชีวิตสำหรับ {subject}',
    noLifeSkillsGrades: 'ไม่มีคะแนนทักษะชีวิต',
    summative: 'การประเมินรวม',
    lifeSkills: 'ทักษะชีวิต',
    notGraded: 'ยังไม่ได้ให้คะแนน',

    // Library Screen
    authenticationRequired: 'ต้องการการยืนยันตัวตน',
    failedToLoadLibraryData: 'ไม่สามารถโหลดข้อมูลห้องสมุดได้',
    failedToConnectLibrarySystem: 'ไม่สามารถเชื่อมต่อกับระบบห้องสมุดได้',
    networkErrorOccurred: 'เกิดข้อผิดพลาดของเครือข่าย',
    overview: 'ภาพรวม',
    borrowed: 'ยืม',
    history: 'ประวัติ',

    // Splash Screen
    inspiringBrilliance: 'สร้างแรงบันดาลใจแห่งความเป็นเลิศ',
    buildingBrighterFutures: 'สร้างอนาคตที่สดใส',

    // Teacher Attendance Screen
    failedToLoadAttendanceDetails: 'ไม่สามารถโหลดรายละเอียดการเข้าเรียนได้',
    networkErrorLoadingAttendance:
      'เกิดข้อผิดพลาดของเครือข่ายขณะโหลดการเข้าเรียน',
    failedToLoadStudentsData: 'ไม่สามารถโหลดข้อมูลนักเรียนได้',
    networkErrorLoadingStudents: 'เกิดข้อผิดพลาดของเครือข่ายขณะโหลดนักเรียน',
    incompleteAttendance: 'การเข้าเรียนไม่สมบูรณ์',
    pleaseMarkAttendanceForAllStudents:
      'กรุณาทำเครื่องหมายการเข้าเรียนสำหรับนักเรียนทุกคน เหลือ {count} คน',
    attendanceSubmittedSuccessfullyDemo:
      'ส่งการเข้าเรียนเรียบร้อยแล้ว! (โหมดทดสอบ)',
    attendanceUpdatedSuccessfully: 'อัปเดตการเข้าเรียนเรียบร้อยแล้ว!',
    attendanceSubmittedSuccessfully: 'ส่งการเข้าเรียนเรียบร้อยแล้ว!',
    failedToSubmitAttendance: 'ไม่สามารถส่งการเข้าเรียนได้',
    updateAttendance: 'อัปเดตการเข้าเรียน',
    takeAttendance: 'เช็คชื่อ',
    loadingStudents: 'กำลังโหลดนักเรียน...',
    submitAttendance: 'ส่งการเข้าเรียน',

    // Teacher BPS Screen
    failedToFetchBPSData: 'ไม่สามารถดึงข้อมูล BPS ได้',
    pleaseSelectStudentAndBehavior:
      'กรุณาเลือกนักเรียนอย่างน้อยหนึ่งคนและพฤติกรรมอย่างน้อยหนึ่งรายการ',
    noBranchInformationAvailable: 'ไม่มีข้อมูลสาขา',
    partialSuccess: 'สำเร็จบางส่วน',
    recordsCreatedPartially: 'สร้างสำเร็จ {successful} จาก {total} รายการ',

    // Timetable Screen
    unknownTeacher: 'ครูที่ไม่ทราบ',
    period: 'คาบ',

    // Workspace Screen
    failedToLoadWorkspace: 'ไม่สามารถโหลดพื้นที่ทำงานได้ กรุณาลองใหม่',
    failedToLoadFolderContents: 'ไม่สามารถโหลดเนื้อหาโฟลเดอร์ได้ กรุณาลองใหม่',
    failedToLoadRecentFiles: 'ไม่สามารถโหลดไฟล์ล่าสุดได้ กรุณาลองใหม่',

    // Assignment Detail Screen
    pleaseProvideResponse:
      'กรุณาให้คำตอบเป็นลายลักษณ์อักษร แนบไฟล์ หรือเพิ่มลิงก์ไฟล์',
    failedToUpdateAssignment: 'อัปเดตงานไม่สำเร็จ',
    failedToSubmitAssignment: 'ส่งงานไม่สำเร็จ',
    alreadySubmitted: 'ส่งแล้ว',
    assignmentAlreadySubmitted: 'งานนี้ถูกส่งแล้ว',
    contactTeacher: 'ติดต่อครู',
    contactTeacherMessage: 'หากต้องการอัปเดตงานที่ส่ง กรุณาติดต่อครูของคุณ',
    failedToConnectServer: 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ: {error}',
    updateAssignment: 'อัปเดตงาน',
    submitAssignment: 'ส่งงาน',
    confirmUpdateAssignment: 'คุณแน่ใจหรือไม่ว่าต้องการอัปเดตงานนี้?',
    confirmSubmitAssignment: 'คุณแน่ใจหรือไม่ว่าต้องการส่งงานนี้?',
    update: 'อัปเดต',
    submit: 'ส่ง',
    unableToOpenFileLink: 'ไม่สามารถเปิดลิงก์ไฟล์ได้',

    // Create Conversation Screen
    failedToLoadUsers: 'โหลดผู้ใช้ไม่สำเร็จ',
    pleaseEnterConversationTopic: 'กรุณาใส่หัวข้อการสนทนา',
    pleaseSelectAtLeastOneUser: 'กรุณาเลือกผู้ใช้อย่างน้อยหนึ่งคน',
    conversationCreatedSuccessfully: 'สร้างการสนทนาสำเร็จ',
    failedToCreateConversation: 'สร้างการสนทนาไม่สำเร็จ',
    usersSelected: 'เลือกผู้ใช้ {count} คน',
    enterConversationTopic: 'ใส่หัวข้อการสนทนา...',
    searchUsers: 'ค้นหาผู้ใช้...',
    loadingUsers: 'กำลังโหลดผู้ใช้...',

    // Student Health Screen
    failedToLoadHealthData: 'โหลดข้อมูลสุขภาพไม่สำเร็จ กรุณาลองใหม่',
    notSpecified: 'ไม่ได้ระบุ',
    loadingHealthData: 'กำลังโหลดข้อมูลสุขภาพ...',
    visitRecords: 'บันทึกการมาพบแพทย์',
    healthInfo: 'ข้อมูลสุขภาพ',
    medicalConditions: 'ภาวะทางการแพทย์',
    regularMedication: 'ยาที่ใช้ประจำ',
    visionAndHearing: 'การมองเห็นและการได้ยิน',
    visionProblems: 'ปัญหาการมองเห็น',
    lastVisionCheck: 'การตรวจสายตาครั้งล่าสุด',
    hearingIssues: 'ปัญหาการได้ยิน',
    allergiesAndFood: 'ภูมิแพ้และอาหาร',
    foodConsiderations: 'ข้อควรพิจารณาเรื่องอาหาร',
    allergies: 'ภูมิแพ้',
    allergySymptoms: 'อาการแพ้',
    firstAidInstructions: 'คำแนะนำการปฐมพยาบาล',
    allowedMedications: 'ยาที่อนุญาตให้ใช้',
    emergencyContacts: 'ผู้ติดต่อฉุกเฉิน',
    primaryContact: 'ผู้ติดต่อหลัก',
    primaryPhone: 'เบอร์โทรหลัก',
    secondaryContact: 'ผู้ติดต่อรอง',
    secondaryPhone: 'เบอร์โทรรอง',
  },
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  // Load language preference from storage
  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('appLanguage');
      if (savedLanguage && LANGUAGES[savedLanguage]) {
        setCurrentLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (languageCode) => {
    if (isChanging) return;

    try {
      if (LANGUAGES[languageCode] && languageCode !== currentLanguage) {
        console.log(
          'Changing language from',
          currentLanguage,
          'to',
          languageCode
        );
        setIsChanging(true);

        // Use requestAnimationFrame to ensure smooth UI updates
        requestAnimationFrame(() => {
          setCurrentLanguage(languageCode);
        });

        await AsyncStorage.setItem('appLanguage', languageCode);
        console.log('Language changed successfully');

        // Reset changing state after a brief delay
        setTimeout(() => {
          setIsChanging(false);
        }, 100);
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
      setIsChanging(false);
    }
  };

  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations.en[key] || key;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    languages: LANGUAGES,
    isLoading,
    isChanging,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
