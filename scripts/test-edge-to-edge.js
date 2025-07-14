#!/usr/bin/env node

/**
 * Edge-to-Edge Testing Script
 * 
 * This script helps verify that the Android 15 edge-to-edge implementation
 * is correctly configured in the project.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Android 15 Edge-to-Edge Implementation Checker\n');

const checks = [];

// Check 1: MainActivity.kt has WindowCompat configuration
function checkMainActivity() {
  const mainActivityPath = 'android/app/src/main/java/com/edunovaasia/edusis/MainActivity.kt';
  
  if (!fs.existsSync(mainActivityPath)) {
    checks.push({ name: 'MainActivity.kt exists', status: '❌', details: 'File not found' });
    return;
  }

  const content = fs.readFileSync(mainActivityPath, 'utf8');
  
  const hasWindowCompat = content.includes('WindowCompat');
  const hasSetDecorFitsSystemWindows = content.includes('setDecorFitsSystemWindows(window, false)');
  
  checks.push({
    name: 'MainActivity WindowCompat import',
    status: hasWindowCompat ? '✅' : '❌',
    details: hasWindowCompat ? 'WindowCompat imported' : 'Missing WindowCompat import'
  });
  
  checks.push({
    name: 'MainActivity edge-to-edge enablement',
    status: hasSetDecorFitsSystemWindows ? '✅' : '❌',
    details: hasSetDecorFitsSystemWindows ? 'setDecorFitsSystemWindows configured' : 'Missing setDecorFitsSystemWindows call'
  });
}

// Check 2: styles.xml has transparent system bars
function checkStyles() {
  const stylesPath = 'android/app/src/main/res/values/styles.xml';
  const stylesV31Path = 'android/app/src/main/res/values-v31/styles.xml';
  
  // Check main styles.xml
  if (fs.existsSync(stylesPath)) {
    const content = fs.readFileSync(stylesPath, 'utf8');
    const hasTransparentStatusBar = content.includes('android:statusBarColor">@android:color/transparent') || 
                                   content.includes('android:statusBarColor">#00000000');
    
    checks.push({
      name: 'Main styles.xml transparent status bar',
      status: hasTransparentStatusBar ? '✅' : '⚠️',
      details: hasTransparentStatusBar ? 'Transparent status bar configured' : 'Consider transparent status bar'
    });
  }
  
  // Check v31 styles.xml
  if (fs.existsSync(stylesV31Path)) {
    const content = fs.readFileSync(stylesV31Path, 'utf8');
    const hasTransparentStatusBar = content.includes('android:statusBarColor">@android:color/transparent');
    const hasTransparentNavBar = content.includes('android:navigationBarColor">@android:color/transparent');
    const hasLightStatusBar = content.includes('android:windowLightStatusBar">true');
    
    checks.push({
      name: 'Android 12+ styles configuration',
      status: (hasTransparentStatusBar && hasTransparentNavBar && hasLightStatusBar) ? '✅' : '❌',
      details: `Status: ${hasTransparentStatusBar}, Nav: ${hasTransparentNavBar}, Light: ${hasLightStatusBar}`
    });
  } else {
    checks.push({
      name: 'Android 12+ styles file',
      status: '❌',
      details: 'values-v31/styles.xml not found'
    });
  }
}

// Check 3: Build configuration targets SDK 35
function checkBuildConfig() {
  const buildGradlePath = 'android/build.gradle';
  
  if (fs.existsSync(buildGradlePath)) {
    const content = fs.readFileSync(buildGradlePath, 'utf8');
    const hasTargetSdk35 = content.includes('targetSdkVersion = Integer.parseInt(findProperty(\'android.targetSdkVersion\') ?: \'35\')');
    const hasCompileSdk35 = content.includes('compileSdkVersion = Integer.parseInt(findProperty(\'android.compileSdkVersion\') ?: \'35\')');
    
    checks.push({
      name: 'Target SDK 35 configuration',
      status: hasTargetSdk35 ? '✅' : '❌',
      details: hasTargetSdk35 ? 'Targeting SDK 35' : 'Not targeting SDK 35'
    });
    
    checks.push({
      name: 'Compile SDK 35 configuration',
      status: hasCompileSdk35 ? '✅' : '❌',
      details: hasCompileSdk35 ? 'Compiling with SDK 35' : 'Not compiling with SDK 35'
    });
  }
}

// Check 4: Safe area context usage
function checkSafeAreaUsage() {
  const packageJsonPath = 'package.json';
  
  if (fs.existsSync(packageJsonPath)) {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(content);
    const hasSafeAreaContext = packageJson.dependencies && packageJson.dependencies['react-native-safe-area-context'];
    
    checks.push({
      name: 'Safe Area Context dependency',
      status: hasSafeAreaContext ? '✅' : '❌',
      details: hasSafeAreaContext ? `Version: ${packageJson.dependencies['react-native-safe-area-context']}` : 'Missing dependency'
    });
  }
  
  // Check if SafeAreaProvider is used in App.js
  const appJsPath = 'App.js';
  if (fs.existsSync(appJsPath)) {
    const content = fs.readFileSync(appJsPath, 'utf8');
    const hasSafeAreaProvider = content.includes('SafeAreaProvider');
    
    checks.push({
      name: 'SafeAreaProvider in App.js',
      status: hasSafeAreaProvider ? '✅' : '❌',
      details: hasSafeAreaProvider ? 'SafeAreaProvider configured' : 'Missing SafeAreaProvider'
    });
  }
}

// Check 5: Edge-to-edge utilities
function checkEdgeToEdgeUtils() {
  const utilsPath = 'src/utils/edgeToEdgeUtils.js';
  
  checks.push({
    name: 'Edge-to-edge utilities',
    status: fs.existsSync(utilsPath) ? '✅' : '⚠️',
    details: fs.existsSync(utilsPath) ? 'Utility functions available' : 'Consider creating utility functions'
  });
}

// Run all checks
function runChecks() {
  console.log('Running edge-to-edge implementation checks...\n');
  
  checkMainActivity();
  checkStyles();
  checkBuildConfig();
  checkSafeAreaUsage();
  checkEdgeToEdgeUtils();
  
  // Display results
  console.log('📋 Check Results:\n');
  checks.forEach(check => {
    console.log(`${check.status} ${check.name}`);
    if (check.details) {
      console.log(`   ${check.details}`);
    }
    console.log('');
  });
  
  // Summary
  const passed = checks.filter(c => c.status === '✅').length;
  const warnings = checks.filter(c => c.status === '⚠️').length;
  const failed = checks.filter(c => c.status === '❌').length;
  
  console.log('📊 Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 Your app is ready for Android 15 edge-to-edge display!');
    console.log('\n📱 Next steps:');
    console.log('1. Test on Android 15 device/emulator');
    console.log('2. Verify all screens display correctly');
    console.log('3. Test with different themes and orientations');
  } else {
    console.log('\n⚠️  Please address the failed checks before testing.');
  }
}

// Run the checks
runChecks();
