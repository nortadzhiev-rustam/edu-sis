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
    grades: 'Grades',
    attendance: 'Attendance',
    timetable: 'Timetable',
    homework: 'Homework',
    behavior: 'Behavior',
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
    duplicateStudent: 'Duplicate Student',
    scrollForMore: 'Scroll for more →',
    yourChild: 'Your child',
    selected: 'SELECTED',

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
    continue: 'Continue',
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
    grades: 'အမှတ်များ',
    attendance: 'တက်ရောက်မှု',
    timetable: 'အချိန်ဇယား',
    homework: 'စာတွေ',
    behavior: 'အပြုအမူအမှတ်များ',
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
    duplicateStudent: 'ထပ်တူကျောင်းသား',
    scrollForMore: 'နောက်ထပ်အတွက် လှိမ့်ပါ →',
    yourChild: 'သင့်ကလေး',
    selected: 'ရွေးချယ်ထား',

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
    welcomeTO: '欢迎来到',

    // Academic
    grades: '成绩',
    attendance: '出勤',
    timetable: '时间表',
    homework: '作业',
    behavior: '行为分数',
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
    duplicateStudent: '重复学生',
    scrollForMore: '滑动查看更多 →',
    yourChild: '您的孩子',
    selected: '已选择',

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
    welcomeTO: 'ยินดีต้อนรับ',

    // Academic
    grades: 'เกรด',
    attendance: 'การเข้าเรียน',
    timetable: 'ตารางเรียน',
    homework: 'การบ้าน',
    behavior: 'คะแนนพฤติกรรม',
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
    duplicateStudent: 'นักเรียนซ้ำ',
    scrollForMore: 'เลื่อนเพื่อดูเพิ่มเติม →',
    yourChild: 'บุตรหลานของคุณ',
    selected: 'เลือกแล้ว',

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
