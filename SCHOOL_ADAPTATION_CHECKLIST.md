# School Adaptation Checklist for EduSIS

## 📋 Complete Configuration Checklist

### 1. Core Configuration Files

#### A. `src/config/env.js` - Main API Configuration
```javascript
// REQUIRED CHANGES:
export const Config = {
  API_BASE_URL: 'https://sis.NEWSCHOOL.edu/mobile-api',  // ⚠️ CHANGE THIS
  API_DOMAIN: 'sis.NEWSCHOOL.edu',                       // ⚠️ CHANGE THIS
  
  APP: {
    NAME: 'NEWSCHOOL SIS',                               // ⚠️ CHANGE THIS
    VERSION: '1.0.0',                                    // ⚠️ RESET VERSION
    BUNDLE_ID: 'com.NEWSCHOOL.edusis',                   // ⚠️ CHANGE THIS
  }
}
```

#### B. `app.json` - Expo Configuration
```json
{
  "expo": {
    "name": "NEWSCHOOL SIS",                             // ⚠️ CHANGE THIS
    "slug": "newschool-sis",                             // ⚠️ CHANGE THIS
    "version": "1.0.0",                                  // ⚠️ RESET VERSION
    "ios": {
      "bundleIdentifier": "com.NEWSCHOOL.edusis",        // ⚠️ CHANGE THIS
      "buildNumber": "1"                                 // ⚠️ RESET BUILD
    },
    "android": {
      "package": "com.NEWSCHOOL.edusis",                 // ⚠️ CHANGE THIS
      "versionCode": 1                                   // ⚠️ RESET VERSION
    },
    "extra": {
      "eas": {
        "projectId": "NEW_EAS_PROJECT_ID"                // ⚠️ CHANGE AFTER eas init
      }
    }
  }
}
```

#### C. `package.json` - Project Metadata
```json
{
  "name": "newschool-sis",                               // ⚠️ CHANGE THIS
  "version": "1.0.0"                                     // ⚠️ RESET VERSION
}
```

### 2. School-Specific Configuration

#### A. `src/services/schoolConfigService.js` - Add New School
```javascript
// ADD THIS NEW CONFIGURATION:
newschool_edu: {
  schoolId: 'newschool_edu',
  name: 'New School Name',                               // ⚠️ CHANGE THIS
  domain: 'newschool.edu',                               // ⚠️ CHANGE THIS
  hasGoogleWorkspace: true,                              // ⚠️ CONFIGURE AS NEEDED
  googleConfig: {
    clientId: 'NEW_GOOGLE_CLIENT_ID.apps.googleusercontent.com', // ⚠️ CHANGE THIS
    apiKey: 'NEW_GOOGLE_API_KEY',                        // ⚠️ CHANGE THIS
    calendarIds: {
      main: 'main@newschool.edu',                        // ⚠️ CHANGE ALL THESE
      academic: 'academic@newschool.edu',
      sports: 'sports@newschool.edu',
      events: 'events@newschool.edu',
      holidays: 'holidays@newschool.edu',
      staff: 'staff@newschool.edu',
    },
    branchCalendars: {
      primary: {
        academic: 'primary-academic@newschool.edu',      // ⚠️ CHANGE ALL THESE
        events: 'primary-events@newschool.edu',
      },
      secondary: {
        academic: 'secondary-academic@newschool.edu',
        events: 'secondary-events@newschool.edu',
      },
      high_school: {
        academic: 'highschool-academic@newschool.edu',
        events: 'highschool-events@newschool.edu',
      },
    },
  },
  branding: {
    name: 'New School Name',                             // ⚠️ CHANGE THIS
    logo: {
      light: require('../../assets/newschool_logo.png'), // ⚠️ UPDATE ASSET PATH
      dark: require('../../assets/newschool_logo_dark.png'), // ⚠️ UPDATE ASSET PATH
    },
    colors: {
      primary: '#YOUR_PRIMARY_COLOR',                    // ⚠️ CHANGE COLORS
      secondary: '#YOUR_SECONDARY_COLOR',
      accent: '#YOUR_ACCENT_COLOR',
    },
  },
  features: {
    googleCalendar: true,                                // ⚠️ CONFIGURE AS NEEDED
    googleCalendarReadOnly: true,
    nativeCalendar: false,
    customEvents: true,
    messaging: true,
    homework: true,
    attendance: true,
    bps: true,
    health: true,
  },
}
```

### 3. Firebase Configuration Files

#### Files to Replace:
- [ ] `google-services.json` (root)
- [ ] `android/app/google-services.json`
- [ ] `GoogleService-Info.plist` (root)
- [ ] `ios/GoogleService-Info.plist`
- [ ] `ios/BFIEducationSIS/GoogleService-Info.plist`

#### Required Values in New Firebase Config:
- Project ID: `newschool-project-id`
- Package Name (Android): `com.NEWSCHOOL.edusis`
- Bundle ID (iOS): `com.NEWSCHOOL.edusis`
- API Keys: New Firebase API keys
- Sender ID: New Firebase sender ID

### 4. Asset Files to Replace

#### Logo and Branding Assets:
- [ ] `assets/app_logo.png` - Main app logo (1024x1024)
- [ ] `assets/app_logo_dark.png` - Dark theme logo
- [ ] `assets/EduNova School Logo.png` - Replace with new school logo
- [ ] `assets/EduNova School Logo Dark.png` - Dark version
- [ ] `assets/icon.png` - App icon (1024x1024)
- [ ] `assets/adaptive-icon.png` - Android adaptive icon
- [ ] `assets/splash-icon.png` - Splash screen icon
- [ ] `assets/favicon.png` - Web favicon

#### Asset Requirements:
- Format: PNG with transparency
- App Icon: 1024x1024px minimum
- Logos: Maintain aspect ratio, various sizes
- Follow platform guidelines for adaptive icons

### 5. Build Configuration

#### A. EAS Configuration (`eas.json`)
```json
{
  "build": {
    "production": {
      "android": {
        "env": {
          "GOOGLE_SERVICE_ACCOUNT_KEY": "$NEW_GOOGLE_SERVICE_ACCOUNT_KEY" // ⚠️ UPDATE
        }
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./new-google-service-account-key.json" // ⚠️ UPDATE
      }
    }
  }
}
```

#### B. Service Account Files:
- [ ] Replace `google-service-account-key.json`
- [ ] Replace `edunova-bfi-5edf3e44e317.json` with new school's service account

### 6. iOS-Specific Changes

#### Directory Structure:
- [ ] Rename `ios/BFIEducationSIS` to `ios/NewSchoolSIS`
- [ ] Update all references to the old directory name

#### Xcode Project Files:
- [ ] Update project name in Xcode settings
- [ ] Update bundle identifier in all targets
- [ ] Update app display name

### 7. Android-Specific Changes

#### Package Name Updates:
- [ ] `android/app/build.gradle` - Update applicationId
- [ ] `android/app/src/main/AndroidManifest.xml` - Update package references
- [ ] Any hardcoded package references in Java/Kotlin files

### 8. Environment Variables and Secrets

#### Update These Environment Variables:
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` - New Firebase service account
- [ ] `EAS_PROJECT_ID` - New EAS project ID
- [ ] Any school-specific API keys or secrets

### 9. Testing Configuration

#### Update Test Files:
- [ ] `src/tests/` - Update any hardcoded school references
- [ ] Test data files with school-specific information
- [ ] Mock data configurations

### 10. Documentation Updates

#### Files to Update:
- [ ] `README.md` - Update project description and school name
- [ ] `USER_MANUAL.md` - Update with new school information
- [ ] Any configuration guides with school-specific examples
