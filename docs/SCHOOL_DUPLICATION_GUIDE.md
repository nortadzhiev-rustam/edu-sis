# EduSIS School Duplication Guide

## Overview
This guide provides step-by-step instructions for duplicating the EduSIS project and adapting it for a new school's requirements.

## Configuration Files That Must Be Updated

### 1. Core Configuration Files

#### `src/config/env.js`
**Critical Changes Required:**
```javascript
export const Config = {
  // Update API endpoints for new school
  API_BASE_URL: 'https://sis.NEWSCHOOL.edu/mobile-api',
  API_DOMAIN: 'sis.NEWSCHOOL.edu',
  
  // Update app information
  APP: {
    NAME: 'NewSchool SIS',
    VERSION: '1.0.0',
    BUNDLE_ID: 'com.newschool.edusis',
  },
};
```

#### `app.json`
**Required Updates:**
```json
{
  "expo": {
    "name": "NewSchool SIS",
    "slug": "newschool-sis",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.newschool.edusis",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.newschool.edusis",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "NEW_PROJECT_ID_FROM_EAS"
      }
    }
  }
}
```

#### `package.json`
```json
{
  "name": "newschool-sis",
  "version": "1.0.0"
}
```

### 2. School-Specific Configuration

#### `src/services/schoolConfigService.js`
Add new school configuration:
```javascript
const NEW_SCHOOL_CONFIG = {
  schoolId: 'newschool_edu',
  name: 'New School Name',
  domain: 'newschool.edu',
  hasGoogleWorkspace: true,
  googleConfig: {
    clientId: 'your-client-id.apps.googleusercontent.com',
    apiKey: 'your-api-key',
    calendarIds: {
      main: 'main@newschool.edu',
      academic: 'academic@newschool.edu',
      sports: 'sports@newschool.edu',
      events: 'events@newschool.edu',
      holidays: 'holidays@newschool.edu',
      staff: 'staff@newschool.edu',
    },
    branchCalendars: {
      primary: {
        academic: 'primary-academic@newschool.edu',
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
    name: 'New School Name',
    logo: {
      light: require('../../assets/newschool_logo.png'),
      dark: require('../../assets/newschool_logo_dark.png'),
    },
    colors: {
      primary: '#YOUR_PRIMARY_COLOR',
      secondary: '#YOUR_SECONDARY_COLOR',
      accent: '#YOUR_ACCENT_COLOR',
    },
  },
  features: {
    googleCalendar: true,
    googleCalendarReadOnly: true,
    nativeCalendar: false,
    customEvents: true,
    messaging: true,
    homework: true,
    attendance: true,
    bps: true,
    health: true,
  },
};
```

### 3. Firebase Configuration Files

#### Files to Replace:
- `google-services.json` (root and android/app/)
- `GoogleService-Info.plist` (root, ios/, and ios/BFIEducationSIS/)

#### Steps:
1. Create new Firebase project
2. Add Android app with package: `com.newschool.edusis`
3. Add iOS app with bundle ID: `com.newschool.edusis`
4. Download configuration files
5. Replace all instances in the project

### 4. Asset Files to Replace

#### Required Assets:
```
assets/
├── app_logo.png              # Main app logo (light theme)
├── app_logo_dark.png         # App logo (dark theme)
├── EduNova School Logo.png   # Replace with new school logo
├── EduNova School Logo Dark.png # Replace with new school logo (dark)
├── icon.png                  # App icon (1024x1024)
├── adaptive-icon.png         # Android adaptive icon
├── splash-icon.png           # Splash screen icon
└── favicon.png               # Web favicon
```

#### Asset Specifications:
- **App Icons**: 1024x1024px, PNG format
- **Logos**: Maintain aspect ratio, transparent background
- **Splash Icons**: Square format, centered design
- **Adaptive Icons**: Follow Android guidelines

### 5. EAS Build Configuration

#### Create New EAS Project:
```bash
# Initialize new EAS project
eas init

# This will generate a new project ID for app.json
```

#### Update `eas.json` (if needed):
```json
{
  "build": {
    "production": {
      "android": {
        "env": {
          "GOOGLE_SERVICE_ACCOUNT_KEY": "$NEW_SCHOOL_SERVICE_ACCOUNT_KEY"
        }
      }
    }
  }
}
```

## Step-by-Step Duplication Process

### Phase 1: Project Setup
1. Copy project to new directory
2. Update `package.json` name and version
3. Initialize new git repository (optional)
4. Run `npm install` to ensure dependencies work

### Phase 2: Configuration Updates
1. Update `src/config/env.js` with new API endpoints
2. Update `app.json` with new app information
3. Add new school config to `schoolConfigService.js`
4. Update any hardcoded school references in code

### Phase 3: Firebase Setup
1. Create new Firebase project
2. Generate new configuration files
3. Replace all Firebase config files
4. Test Firebase connectivity

### Phase 4: Asset Replacement
1. Prepare new school assets (logos, icons)
2. Replace all asset files
3. Update asset references if filenames changed
4. Test asset loading in app

### Phase 5: Build Configuration
1. Create new EAS project
2. Update app.json with new project ID
3. Configure build profiles
4. Set up environment variables

### Phase 6: Testing
1. Development build and testing
2. Preview build for stakeholders
3. Production build preparation
4. App store submission preparation

## Environment Variables and Secrets

### Required Environment Variables:
- `GOOGLE_SERVICE_ACCOUNT_KEY` - For Android builds
- Any API keys for the new school's backend
- Push notification certificates

### Security Considerations:
- Never commit Firebase config files to public repos
- Use EAS Secrets for sensitive data
- Rotate API keys after setup
- Set up proper Firebase security rules

## Post-Deployment Checklist

### App Store Setup:
- [ ] Create new App Store Connect entry
- [ ] Update app metadata and descriptions
- [ ] Upload new screenshots with school branding
- [ ] Configure app store categories and keywords
- [ ] Set up TestFlight for beta testing

### Google Play Setup:
- [ ] Create new Google Play Console entry
- [ ] Update store listing with school information
- [ ] Upload new screenshots and graphics
- [ ] Configure app signing and security
- [ ] Set up internal testing track

### Backend Integration:
- [ ] Verify API endpoints are accessible
- [ ] Test authentication flows
- [ ] Validate push notifications
- [ ] Check calendar integrations
- [ ] Test file upload/download features

### User Training:
- [ ] Prepare user documentation
- [ ] Create training materials
- [ ] Set up support channels
- [ ] Plan rollout strategy

## Troubleshooting Common Issues

### Build Errors:
- **Bundle ID conflicts**: Ensure all references updated
- **Firebase errors**: Verify config files match bundle IDs
- **Asset loading errors**: Check file paths and names

### Runtime Issues:
- **API connection failures**: Verify endpoint URLs
- **Authentication problems**: Check Firebase setup
- **Push notification issues**: Verify certificates and config

### App Store Rejection:
- **Metadata issues**: Ensure all school info is updated
- **Icon problems**: Follow platform guidelines
- **Privacy policy**: Update for new school

## Maintenance and Updates

### Regular Updates:
- Keep dependencies updated
- Monitor for security patches
- Update school-specific content
- Maintain Firebase project

### Scaling Considerations:
- Plan for multiple school support
- Consider white-label architecture
- Implement feature flags
- Set up monitoring and analytics

---

This guide provides a comprehensive approach to duplicating the EduSIS project. Each school deployment should follow this checklist to ensure all configurations are properly updated.
