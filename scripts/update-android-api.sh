#!/bin/bash

# Script to update Android app to target API level 35 (Android 15)
# This script helps ensure compliance with Google Play Store requirements

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_status "Android API Level 35 Update Script"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    print_error "app.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if Android directory exists
if [ ! -d "android" ]; then
    print_warning "Android directory not found. Running expo prebuild to generate native code..."
    npx expo prebuild --platform android --clean
fi

print_status "Verifying Android API level 35 configuration..."

# Check app.json configuration
if grep -q '"targetSdkVersion": 35' app.json; then
    print_success "app.json: targetSdkVersion is set to 35"
else
    print_error "app.json: targetSdkVersion is not set to 35"
    exit 1
fi

if grep -q '"compileSdkVersion": 35' app.json; then
    print_success "app.json: compileSdkVersion is set to 35"
else
    print_error "app.json: compileSdkVersion is not set to 35"
    exit 1
fi

# Check gradle.properties
if grep -q 'android.targetSdkVersion=35' android/gradle.properties; then
    print_success "gradle.properties: targetSdkVersion is set to 35"
else
    print_error "gradle.properties: targetSdkVersion is not set to 35"
    exit 1
fi

# Check build.gradle
if grep -q "targetSdkVersion.*'35'" android/build.gradle; then
    print_success "build.gradle: targetSdkVersion is set to 35"
else
    print_error "build.gradle: targetSdkVersion is not set to 35"
    exit 1
fi

print_status "Cleaning previous builds..."
rm -rf android/app/build
rm -rf android/build
rm -rf node_modules/.cache

print_status "Installing dependencies..."
npm install

print_status "Prebuild with updated configuration..."
npx expo prebuild --platform android --clean

print_status "Building Android app bundle for production..."
cd android
./gradlew clean
./gradlew bundleRelease

if [ $? -eq 0 ]; then
    print_success "Android app bundle built successfully!"
    print_success "APK location: android/app/build/outputs/bundle/release/app-release.aab"
    
    print_status "Verifying target SDK version in built APK..."
    # Use aapt to check the target SDK version
    if command -v aapt &> /dev/null; then
        TARGET_SDK=$(aapt dump badging android/app/build/outputs/bundle/release/app-release.aab | grep targetSdkVersion | sed 's/.*targetSdkVersion:\'\([0-9]*\)\'.*/\1/')
        if [ "$TARGET_SDK" = "35" ]; then
            print_success "Built APK targets SDK version 35 ✓"
        else
            print_warning "Built APK targets SDK version $TARGET_SDK (expected 35)"
        fi
    else
        print_warning "aapt not found. Cannot verify target SDK version in built APK."
    fi
else
    print_error "Build failed. Please check the error messages above."
    exit 1
fi

cd ..

print_status "Next steps:"
echo "1. Test the app thoroughly on Android devices"
echo "2. Upload the app bundle to Google Play Console"
echo "3. Submit for review"
echo ""
print_success "Your app is now configured to target Android API level 35!"
print_success "This meets Google Play Store requirements for continued updates."
