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
    teachingPerformance: 'သင်ကြားမှုစွမ်းဆောင်ရည်ကြည့်ရှုရန်',
    featureComingSoon: 'လုပ်ဆောင်ချက်မကြာမီရောက်မည်!',

    // Library specific
    libraryData: 'စာကြည့်တိုက်ဒေတာ',
    borrowedBooks: 'ငှားယူထားသောစာအုပ်များ',
    overdueItems: 'သတ်မှတ်ချိန်လွန်သောပစ္စည်းများ',
    borrowingLimits: 'ငှားယူမှုကန့်သတ်ချက်များ',
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
    teachingPerformance: '查看教学表现指标',
    featureComingSoon: '功能即将推出！',

    // Library specific
    libraryData: '图书馆数据',
    borrowedBooks: '借阅图书',
    overdueItems: '逾期项目',
    borrowingLimits: '借阅限制',
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
    teachingPerformance: 'ดูตัวชี้วัดประสิทธิภาพการสอน',
    featureComingSoon: 'คุณสมบัตินี้เร็วๆ นี้!',

    // Library specific
    libraryData: 'ข้อมูลห้องสมุด',
    borrowedBooks: 'หนังสือที่ยืม',
    overdueItems: 'รายการที่เกินกำหนด',
    borrowingLimits: 'ขีดจำกัดการยืม',
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
