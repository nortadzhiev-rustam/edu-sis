#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Firebase Configuration...\n');

// Read app.json
const appJsonPath = path.join(__dirname, '../app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

const expectedAndroidPackage = appJson.expo.android.package;
const expectedIOSBundle = appJson.expo.ios.bundleIdentifier;

console.log('📱 Expected Package Names:');
console.log(`   Android: ${expectedAndroidPackage}`);
console.log(`   iOS: ${expectedIOSBundle}\n`);

// Check Android google-services.json
try {
  const googleServicesPath = path.join(__dirname, '../google-services.json');
  const googleServices = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
  
  console.log('🤖 Android Configuration:');
  console.log(`   Project ID: ${googleServices.project_info.project_id}`);
  console.log(`   Project Number: ${googleServices.project_info.project_number}`);
  
  const androidClients = googleServices.client.filter(client => 
    client.client_info.android_client_info
  );
  
  console.log('   Package Names in google-services.json:');
  androidClients.forEach((client, index) => {
    const packageName = client.client_info.android_client_info.package_name;
    const isMatch = packageName === expectedAndroidPackage;
    console.log(`     ${index + 1}. ${packageName} ${isMatch ? '✅' : '❌'}`);
  });
  
} catch (error) {
  console.log('❌ Error reading google-services.json:', error.message);
}

// Check iOS GoogleService-Info.plist
try {
  const plistPath = path.join(__dirname, '../GoogleService-Info.plist');
  const plistContent = fs.readFileSync(plistPath, 'utf8');
  
  console.log('\n🍎 iOS Configuration:');
  
  // Extract bundle ID from plist
  const bundleIdMatch = plistContent.match(/<key>BUNDLE_ID<\/key>\s*<string>(.*?)<\/string>/);
  const projectIdMatch = plistContent.match(/<key>PROJECT_ID<\/key>\s*<string>(.*?)<\/string>/);
  
  if (bundleIdMatch) {
    const bundleId = bundleIdMatch[1];
    const isMatch = bundleId === expectedIOSBundle;
    console.log(`   Bundle ID: ${bundleId} ${isMatch ? '✅' : '❌'}`);
  }
  
  if (projectIdMatch) {
    console.log(`   Project ID: ${projectIdMatch[1]}`);
  }
  
} catch (error) {
  console.log('❌ Error reading GoogleService-Info.plist:', error.message);
}

console.log('\n📋 Next Steps:');
console.log('1. If package names don\'t match, update them in Firebase Console');
console.log('2. Download new configuration files');
console.log('3. Run: npm run firebase:update-config');
console.log('4. Run: npx expo prebuild --clean');
