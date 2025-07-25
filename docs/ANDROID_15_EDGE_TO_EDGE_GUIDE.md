# Android 15 Edge-to-Edge Display Implementation Guide

## Overview

Starting with Android 15 (API level 35), Google enforces **edge-to-edge display** by default for all apps targeting SDK 35. This guide documents the implementation and testing procedures for your React Native/Expo app.

## What is Edge-to-Edge Display?

Edge-to-edge display means:
- App content extends behind system bars (status bar and navigation bar)
- System bars become translucent/transparent
- App must handle **window insets** to prevent content from being hidden behind system UI
- Provides a more immersive user experience

## Implementation Summary

### 1. Native Android Changes

#### MainActivity.kt
```kotlin
// Added WindowCompat import and edge-to-edge enablement
import androidx.core.view.WindowCompat

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Enable edge-to-edge display for Android 15+ compatibility
    WindowCompat.setDecorFitsSystemWindows(window, false)
    
    setTheme(R.style.AppTheme);
    super.onCreate(null)
  }
}
```

#### styles.xml Updates
- **values/styles.xml**: Updated for backward compatibility
- **values-v31/styles.xml**: Android 12+ specific optimizations

Key changes:
- `android:statusBarColor` → `@android:color/transparent`
- `android:navigationBarColor` → `@android:color/transparent`
- Added `android:windowLightStatusBar` and `android:windowLightNavigationBar`
- Added `android:windowLayoutInDisplayCutoutMode` for notch handling

### 2. React Native Changes

#### Safe Area Configuration
- Most screens use `SafeAreaView` with `edges={['top', 'left', 'right']}`
- Bottom edge excluded to allow content behind navigation bar
- Updated `SafeAreaLayout` component with edge-to-edge support

#### Status Bar Configuration
- App.js uses `<StatusBar style='auto' />` for automatic adaptation
- Individual screens can override as needed
- Created utility functions in `src/utils/edgeToEdgeUtils.js`

## Testing Checklist

### Device Requirements
- Android 15 (API 35) device or emulator
- Devices with different screen sizes and notch configurations
- Test both light and dark themes

### Test Scenarios

#### 1. Basic Display Tests
- [ ] App launches without layout issues
- [ ] Status bar content is visible (not hidden behind status bar)
- [ ] Navigation gestures work properly
- [ ] Content doesn't get clipped by system bars

#### 2. Screen-Specific Tests
- [ ] **HomeScreen**: Logo and buttons properly positioned
- [ ] **LoginScreen**: Form elements not hidden behind keyboard
- [ ] **TeacherScreen**: Action tiles properly spaced
- [ ] **ParentScreen**: Student selection and menu items accessible
- [ ] **AttendanceScreen**: Data tables properly displayed
- [ ] **MessagingScreen**: Input field above navigation bar

#### 3. Orientation Tests
- [ ] Portrait mode displays correctly
- [ ] Landscape mode (tablets) maintains proper layout
- [ ] Orientation changes don't break layout

#### 4. Theme Tests
- [ ] Light theme: Status bar icons are dark
- [ ] Dark theme: Status bar icons are light
- [ ] Theme switching maintains proper contrast

#### 5. Device-Specific Tests
- [ ] Devices with notches/cutouts
- [ ] Devices with different aspect ratios
- [ ] Foldable devices (if applicable)

### Testing Commands

```bash
# Build and test on Android 15 emulator
npx expo run:android

# Create Android 15 emulator (if needed)
# Use Android Studio AVD Manager to create API 35 emulator

# Test on physical device
adb devices
npx expo run:android --device
```

## Troubleshooting

### Common Issues

#### 1. Content Hidden Behind Status Bar
**Symptoms**: App content appears behind status bar
**Solution**: Ensure `SafeAreaView` uses correct edges configuration

#### 2. Status Bar Icons Not Visible
**Symptoms**: Status bar content blends with app background
**Solution**: Check `android:windowLightStatusBar` in styles.xml

#### 3. Navigation Gestures Not Working
**Symptoms**: System navigation gestures don't respond
**Solution**: Verify `WindowCompat.setDecorFitsSystemWindows(window, false)`

#### 4. Keyboard Overlapping Content
**Symptoms**: Keyboard covers input fields
**Solution**: Ensure `android:windowSoftInputMode="adjustResize"` in AndroidManifest.xml

### Debug Tools

1. **React Native Debugger**: Check safe area insets
2. **Android Studio Layout Inspector**: Analyze view hierarchy
3. **Device Developer Options**: Enable layout bounds visualization

## Performance Considerations

- Edge-to-edge display has minimal performance impact
- Safe area calculations are cached by React Native
- Status bar style changes are lightweight operations

## Backward Compatibility

The implementation maintains compatibility with:
- Android 12-14 (API 31-34): Enhanced experience
- Android 11 and below: Standard display with graceful fallbacks

## Future Considerations

### Android 16+ Preparations
- Monitor Google's announcements for new requirements
- Consider implementing predictive back gestures
- Stay updated with React Native safe area context updates

### Accessibility
- Ensure edge-to-edge doesn't impact screen readers
- Test with TalkBack enabled
- Verify touch targets remain accessible

## Resources

- [Android Edge-to-Edge Documentation](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- [React Native Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context)
- [Expo Status Bar Documentation](https://docs.expo.dev/versions/latest/sdk/status-bar/)

## Implementation Files

- `android/app/src/main/java/com/edunovaasia/edusis/MainActivity.kt`
- `android/app/src/main/res/values/styles.xml`
- `android/app/src/main/res/values-v31/styles.xml`
- `src/components/ResponsiveLayout.js`
- `src/utils/edgeToEdgeUtils.js`
- `App.js` (StatusBar configuration)

## Next Steps

1. **Test thoroughly** on Android 15 devices/emulators
2. **Monitor user feedback** after deployment
3. **Update documentation** based on testing results
4. **Consider automated testing** for edge-to-edge scenarios
