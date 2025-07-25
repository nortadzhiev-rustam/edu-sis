# Demo Mode Guide

## Overview

The EduSIS app now includes a comprehensive demo mode that allows users to explore all app features with realistic sample data. Demo mode is activated when users log in with specific demo credentials.

## Demo Credentials

### Teacher Demo Account
- **Username:** `demo_teacher`
- **Password:** `demo2024`
- **Features:** Full teacher access including timetables, BPS management, homework creation, attendance tracking, and homeroom management

### Student Demo Account
- **Username:** `demo_student`
- **Password:** `demo2024`
- **Features:** Student view with grades, attendance records, homework assignments, behavior points, and timetables

### Parent Demo Account
- **Username:** `demo_parent`
- **Password:** `demo2024`
- **Features:** Parent dashboard with child monitoring, grades overview, attendance tracking, and communication features

## Demo Mode Features

### 1. Visual Indicators
- **Demo Mode Badge:** A prominent orange "DEMO MODE" indicator appears in the app header when demo mode is active
- **Login Screen:** Demo credentials are displayed in an expandable card on the login screen for easy access

### 2. Sample Data Included

#### Teacher Demo Data
- **Timetable:** Multiple branches with various subjects and classes
- **BPS Management:** Student behavior records with positive and negative points
- **Attendance:** Class rosters with attendance tracking capabilities
- **Homework:** Assignment creation and management tools
- **Notifications:** Sample notifications for various activities

#### Student Demo Data
- **Personal Info:** Complete student profile with grade and class information
- **Timetable:** Weekly schedule with subjects, teachers, and room assignments
- **Grades:** Multiple subjects with assessments, scores, and overall GPA
- **Attendance:** Historical attendance records with statistics
- **Homework:** Assigned tasks with due dates and completion status
- **Behavior Points:** BPS records showing positive and negative behaviors
- **Notifications:** Academic and behavioral notifications

#### Parent Demo Data
- **Child Information:** Demo student profile and academic overview
- **Dashboard:** Quick access to all child-related information
- **Monitoring:** Grades, attendance, and behavior tracking

### 3. Realistic Data Structure
All demo data follows the same structure as real API responses, ensuring:
- Consistent user experience
- Proper testing of UI components
- Accurate representation of app functionality
- Seamless transition between demo and production modes

## Implementation Details

### Authentication Flow
1. User enters demo credentials on login screen
2. `authService.js` detects demo credentials and returns demo user data
3. Demo user data includes `demo_mode: true` flag
4. App components check for demo mode and display appropriate indicators

### Demo Mode Detection
```javascript
import { isDemoMode } from '../services/authService';

// Check if user is in demo mode
const isDemo = isDemoMode(userData);

// Or check current user from AsyncStorage
import { isCurrentUserInDemoMode } from '../services/demoModeService';
const isDemo = await isCurrentUserInDemoMode();
```

### Demo Data Services
- `demoModeService.js` - Central service for all demo data
- `getDemoTimetableData()` - Timetable data for teachers and students
- `getDemoBPSData()` - Behavior point system data
- `getDemoAttendanceData()` - Attendance records and statistics
- `getDemoGradesData()` - Academic grades and assessments
- `getDemoHomeworkData()` - Homework assignments and submissions
- `getDemoNotificationData()` - System notifications

## Usage Instructions

### For Users
1. Open the EduSIS app
2. Navigate to the login screen
3. Expand the "Demo Credentials" card
4. Select the desired user type (Teacher, Student, or Parent)
5. Tap "Use These Credentials" or manually enter the demo username and password
6. Log in to explore the app with sample data

### For Developers
1. Demo mode is automatically detected based on login credentials
2. No additional configuration required
3. Demo data is served instead of API calls when demo mode is active
4. All existing features work normally with demo data

## Benefits

### For Users
- **Risk-free exploration:** Test all features without affecting real data
- **Complete functionality:** Access to all app features and screens
- **Realistic experience:** Sample data represents actual school scenarios
- **Easy access:** Simple credential system for quick demo access

### For Developers
- **Testing:** Comprehensive test data for all app features
- **Demonstrations:** Perfect for showcasing app capabilities
- **Development:** Consistent data for UI/UX development
- **Quality Assurance:** Reliable test environment

### For Stakeholders
- **App Store Review:** Reviewers can easily explore all features
- **Sales Demonstrations:** Complete app walkthrough with realistic data
- **User Training:** Safe environment for learning app functionality
- **Feature Validation:** Test all features before production deployment

## Technical Architecture

### File Structure
```
src/
├── services/
│   ├── authService.js          # Demo credential detection
│   ├── demoModeService.js      # Demo data provider
│   └── ...
├── components/
│   ├── DemoModeIndicator.js    # Demo mode badge
│   ├── DemoCredentialsCard.js  # Login screen demo credentials
│   └── ...
└── screens/
    ├── LoginScreen.js          # Updated with demo credentials
    ├── TeacherScreen.js        # Demo mode indicator
    ├── ParentScreen.js         # Demo mode indicator
    └── ...
```

### Data Flow
1. **Login:** Demo credentials → Demo user data with `demo_mode: true`
2. **Storage:** Demo user data stored in AsyncStorage
3. **Detection:** Components check `userData.demo_mode` flag
4. **Display:** Demo mode indicators shown when active
5. **Data:** Demo data services provide sample data for all features

## Security Considerations

- Demo credentials are hardcoded and publicly visible
- Demo mode only provides sample data, no real user information
- Demo users cannot access or modify production data
- Demo mode is clearly indicated to prevent confusion
- No sensitive operations are performed in demo mode

## Future Enhancements

- **Multiple Demo Scenarios:** Different demo datasets for various use cases
- **Interactive Tutorials:** Guided tours within demo mode
- **Feature Highlighting:** Emphasize specific features during demos
- **Custom Demo Data:** Allow customization of demo datasets
- **Demo Mode Analytics:** Track demo usage for improvement insights

## Support

For questions or issues related to demo mode:
1. Check this documentation first
2. Review the demo data in `demoModeService.js`
3. Verify demo credential detection in `authService.js`
4. Test with the provided demo credentials
5. Contact the development team for additional support
