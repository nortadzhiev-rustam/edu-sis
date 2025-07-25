# EduSIS School Duplication Checklist

## Pre-Duplication Preparation

### Information Gathering
- [ ] **School Name**: ________________________________
- [ ] **School Domain**: ________________________________
- [ ] **School ID**: ________________________________
- [ ] **App Name**: ________________________________
- [ ] **Bundle ID (iOS)**: ________________________________
- [ ] **Package Name (Android)**: ________________________________
- [ ] **API Base URL**: ________________________________
- [ ] **Primary Color**: ________________________________
- [ ] **Secondary Color**: ________________________________
- [ ] **Accent Color**: ________________________________

### Assets Preparation
- [ ] School logo (light theme) - PNG format, transparent background
- [ ] School logo (dark theme) - PNG format, transparent background
- [ ] App icon - 1024x1024px, PNG format
- [ ] Adaptive icon - Android format
- [ ] Splash screen icon - Square format
- [ ] Favicon - 32x32px or 16x16px

### Backend Preparation
- [ ] New school's API server is set up and accessible
- [ ] API endpoints are configured and tested
- [ ] Database is set up with school-specific data
- [ ] Authentication system is configured

## Phase 1: Project Setup

### Initial Setup
- [ ] Copy project to new directory
- [ ] Remove old git history: `rm -rf .git`
- [ ] Initialize new git repository: `git init` (optional)
- [ ] Install dependencies: `npm install`

### Automated Configuration (Using Script)
- [ ] Run duplication script: `./scripts/duplicate-for-new-school.sh`
- [ ] Review script output for any errors
- [ ] Verify all prompts were answered correctly

### Manual Verification
- [ ] Check `package.json` has correct name and version
- [ ] Check `app.json` has correct app name, slug, and identifiers
- [ ] Check `src/config/env.js` has correct API URLs and app info

## Phase 2: Firebase Setup

### Firebase Project Creation
- [ ] Create new Firebase project at https://console.firebase.google.com
- [ ] Enable required services:
  - [ ] Authentication
  - [ ] Cloud Messaging
  - [ ] Firestore (if used)
  - [ ] Storage (if used)

### Android Configuration
- [ ] Add Android app to Firebase project
- [ ] Use package name from app.json
- [ ] Download `google-services.json`
- [ ] Place in project root
- [ ] Copy to `android/app/google-services.json`

### iOS Configuration
- [ ] Add iOS app to Firebase project
- [ ] Use bundle ID from app.json
- [ ] Download `GoogleService-Info.plist`
- [ ] Place in project root
- [ ] Copy to `ios/GoogleService-Info.plist`
- [ ] Copy to `ios/BFIEducationSIS/GoogleService-Info.plist`

### Firebase Validation
- [ ] Run validation script: `node scripts/validate-school-config.js`
- [ ] Verify no Firebase-related errors

## Phase 3: Asset Replacement

### Logo Assets
- [ ] Replace `assets/app_logo.png` with new school logo (light)
- [ ] Replace `assets/app_logo_dark.png` with new school logo (dark)
- [ ] Update school-specific logo references in code

### App Icons
- [ ] Replace `assets/icon.png` with new app icon (1024x1024px)
- [ ] Replace `assets/adaptive-icon.png` with Android adaptive icon
- [ ] Replace `assets/splash-icon.png` with splash screen icon
- [ ] Replace `assets/favicon.png` with web favicon

### Asset Validation
- [ ] Verify all assets load correctly in app
- [ ] Check asset file sizes are reasonable
- [ ] Test both light and dark theme assets

## Phase 4: School Configuration

### School Config Service
- [ ] Create new school configuration in `src/services/schoolConfigService.js`
- [ ] Update Google Workspace settings if applicable
- [ ] Configure calendar IDs for the new school
- [ ] Set up branch-specific calendars
- [ ] Configure feature flags

### Google Services (if applicable)
- [ ] Set up Google Workspace integration
- [ ] Configure Google Calendar API access
- [ ] Set up Google OAuth client ID
- [ ] Test calendar integration

### Branding Configuration
- [ ] Update color scheme in school config
- [ ] Verify colors work well in both light and dark themes
- [ ] Test color accessibility and contrast

## Phase 5: EAS and Build Setup

### EAS Project Setup
- [ ] Run `eas init` to create new EAS project
- [ ] Verify `app.json` is updated with new project ID
- [ ] Configure build profiles in `eas.json` if needed

### Environment Variables
- [ ] Set up required environment variables in EAS
- [ ] Configure Google Service Account Key for Android builds
- [ ] Set up any school-specific API keys

### Build Configuration
- [ ] Update any hardcoded references to old school
- [ ] Verify iOS project name and settings
- [ ] Check Android build configuration

## Phase 6: Testing and Validation

### Development Testing
- [ ] Run `expo start` and test on development devices
- [ ] Test authentication flows
- [ ] Verify API connections work
- [ ] Test push notifications
- [ ] Check all major app features

### Configuration Validation
- [ ] Run validation script: `node scripts/validate-school-config.js`
- [ ] Fix any errors or warnings
- [ ] Verify no references to old school remain

### Build Testing
- [ ] Create development build: `eas build --profile development`
- [ ] Test development build on physical devices
- [ ] Verify Firebase services work in built app
- [ ] Test push notifications in built app

## Phase 7: App Store Preparation

### App Store Connect (iOS)
- [ ] Create new app in App Store Connect
- [ ] Configure app information and metadata
- [ ] Upload new screenshots with school branding
- [ ] Set up TestFlight for beta testing
- [ ] Configure app privacy and data usage

### Google Play Console (Android)
- [ ] Create new app in Google Play Console
- [ ] Configure store listing with school information
- [ ] Upload new screenshots and graphics
- [ ] Set up internal testing track
- [ ] Configure app content ratings

### Store Assets
- [ ] Create app store screenshots for all device sizes
- [ ] Design app store graphics and promotional materials
- [ ] Write app description and keywords
- [ ] Prepare privacy policy and terms of service

## Phase 8: Production Deployment

### Final Builds
- [ ] Create preview builds for final testing: `eas build --profile preview`
- [ ] Get approval from school stakeholders
- [ ] Create production builds: `eas build --profile production`
- [ ] Test production builds thoroughly

### App Store Submission
- [ ] Submit iOS app for review: `eas submit --platform ios`
- [ ] Submit Android app for review: `eas submit --platform android`
- [ ] Monitor submission status
- [ ] Respond to any review feedback

### Post-Launch
- [ ] Monitor app performance and crash reports
- [ ] Set up analytics and monitoring
- [ ] Prepare user documentation and training materials
- [ ] Plan rollout strategy for school community

## Phase 9: Documentation and Handover

### Technical Documentation
- [ ] Document any custom configurations
- [ ] Create deployment guide for future updates
- [ ] Document API endpoints and integrations
- [ ] Create troubleshooting guide

### User Documentation
- [ ] Create user manual for school staff
- [ ] Prepare training materials
- [ ] Set up support channels
- [ ] Create FAQ for common issues

### Maintenance Planning
- [ ] Set up monitoring and alerting
- [ ] Plan for regular updates and maintenance
- [ ] Document backup and recovery procedures
- [ ] Establish support processes

## Validation Commands

Run these commands to validate your configuration:

```bash
# Validate configuration
node scripts/validate-school-config.js

# Test Firebase configuration
npm run firebase:verify

# Start development server
expo start

# Create development build
eas build --profile development

# Run tests (if available)
npm test
```

## Common Issues and Solutions

### Build Errors
- **Bundle ID conflicts**: Ensure all references are updated in app.json and Firebase configs
- **Firebase errors**: Verify configuration files match bundle IDs exactly
- **Asset loading errors**: Check file paths and ensure assets exist

### Runtime Issues
- **API connection failures**: Verify API_BASE_URL in env.js
- **Authentication problems**: Check Firebase setup and API keys
- **Push notification issues**: Verify Firebase configuration and certificates

### App Store Issues
- **Metadata rejection**: Ensure all school information is updated
- **Icon problems**: Follow platform-specific icon guidelines
- **Privacy policy**: Update for new school's requirements

---

**Note**: This checklist should be completed in order. Each phase builds on the previous one, and skipping steps may cause issues later in the process.
