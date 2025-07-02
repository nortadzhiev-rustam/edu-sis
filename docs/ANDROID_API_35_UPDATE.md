# Android API Level 35 Update Guide

## 🎯 **Overview**

This document outlines the changes made to update the BFI Education SIS app to target Android API level 35 (Android 15) to comply with Google Play Store requirements.

## 📋 **Google Play Store Requirement**

Google Play Store requires apps to target the latest Android API levels:
- **Deadline**: Apps must target Android 15 (API level 35) or higher
- **Impact**: Without this update, you cannot publish new versions to the Play Store
- **Compliance**: This update ensures continued ability to release app updates

## 🔧 **Changes Made**

### 1. **app.json Configuration**

Updated the Android section to target API level 35:

```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/app_logo.png",
    "backgroundColor": "#ffffff"
  },
  "package": "com.edunovaasia.edusis",
  "googleServicesFile": "./google-services.json",
  "screenOrientation": "portrait",
  "compileSdkVersion": 35,
  "targetSdkVersion": 35,
  "minSdkVersion": 24,
  "versionCode": 31
}
```

### 2. **expo-build-properties Plugin**

Updated the build properties to ensure API level 35 compliance:

```json
[
  "expo-build-properties",
  {
    "ios": {
      "useFrameworks": "static"
    },
    "android": {
      "compileSdkVersion": 35,
      "targetSdkVersion": 35,
      "minSdkVersion": 24,
      "buildToolsVersion": "35.0.0"
    }
  }
]
```

### 3. **Android Build Configuration**

Updated `android/build.gradle`:
```gradle
ext {
    buildToolsVersion = findProperty('android.buildToolsVersion') ?: '35.0.0'
    minSdkVersion = Integer.parseInt(findProperty('android.minSdkVersion') ?: '24')
    compileSdkVersion = Integer.parseInt(findProperty('android.compileSdkVersion') ?: '35')
    targetSdkVersion = Integer.parseInt(findProperty('android.targetSdkVersion') ?: '35')
    kotlinVersion = findProperty('android.kotlinVersion') ?: '1.9.25'
}
```

### 4. **Gradle Properties**

Added explicit SDK version properties to `android/gradle.properties`:
```properties
# Android SDK versions for API level 35 compliance
android.compileSdkVersion=35
android.targetSdkVersion=35
android.minSdkVersion=24
android.buildToolsVersion=35.0.0
```

## 🚀 **Build and Deploy Process**

### Step 1: Verify Configuration
Run the verification script:
```bash
./scripts/update-android-api.sh
```

### Step 2: Build Production APK
```bash
# Using EAS Build (Recommended)
npm run build:prod:android

# Or using local build
cd android
./gradlew clean
./gradlew bundleRelease
```

### Step 3: Test the App
- Test on Android devices running different versions
- Verify all features work correctly
- Check for any API-related issues

### Step 4: Upload to Play Store
1. Upload the generated AAB file to Google Play Console
2. Complete the release information
3. Submit for review

## 📱 **Compatibility**

### Supported Android Versions
- **Minimum**: Android 7.0 (API level 24)
- **Target**: Android 15 (API level 35)
- **Compile**: Android 15 (API level 35)

### Device Compatibility
- All devices running Android 7.0 and above
- Optimized for the latest Android features
- Backward compatibility maintained

## ⚠️ **Important Notes**

### 1. **Testing Requirements**
- Test thoroughly on various Android versions
- Pay special attention to permissions and security features
- Verify Firebase messaging and notifications work correctly

### 2. **Potential Issues**
- Some older libraries might need updates
- Permission handling may require adjustments
- Background processing restrictions in newer Android versions

### 3. **Firebase Compatibility**
- Current Firebase SDK versions are compatible with API 35
- No additional Firebase configuration changes needed

## 🔍 **Verification Checklist**

- [ ] app.json targets API level 35
- [ ] expo-build-properties configured correctly
- [ ] Android build.gradle updated
- [ ] gradle.properties has correct SDK versions
- [ ] App builds successfully
- [ ] All features tested on Android devices
- [ ] Firebase notifications working
- [ ] App uploaded to Play Store

## 📞 **Support**

If you encounter any issues during the update process:

1. **Build Issues**: Check the build logs for specific errors
2. **API Compatibility**: Review Android 15 behavior changes
3. **Firebase Issues**: Verify Firebase SDK versions
4. **Play Store**: Check Google Play Console for specific requirements

## 🎉 **Benefits of API Level 35**

### Security Enhancements
- Latest Android security features
- Improved app sandboxing
- Enhanced permission controls

### Performance Improvements
- Better memory management
- Optimized background processing
- Improved battery efficiency

### User Experience
- Support for latest Android features
- Better integration with system UI
- Enhanced accessibility features

## 📅 **Timeline**

- **Configuration Update**: ✅ Completed
- **Build Verification**: ⏳ In Progress
- **Testing Phase**: ⏳ Pending
- **Play Store Submission**: ⏳ Pending

Your app is now ready for Android API level 35 compliance! 🚀
