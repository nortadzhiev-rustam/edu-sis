#!/bin/bash

# EAS Build Pre-Install Hook
# This script ensures Firebase configuration and Gradle wrapper are properly set up before the build

set -e

echo "🔥 EAS Build: Setting up Firebase configuration..."

# Check if we're in the correct directory
if [ ! -f "app.json" ]; then
    echo "❌ app.json not found. Are we in the project root?"
    exit 1
fi

# Ensure Firebase config files exist in root
if [ ! -f "GoogleService-Info.plist" ]; then
    echo "❌ GoogleService-Info.plist not found in root directory!"
    exit 1
fi

if [ ! -f "google-services.json" ]; then
    echo "❌ google-services.json not found in root directory!"
    exit 1
fi

echo "✅ Firebase config files found in root directory"

# Copy Firebase files to ensure they're in the right places
echo "📱 Setting up iOS Firebase configuration..."
if [ -d "ios" ]; then
    # Create the iOS app directory if it doesn't exist
    mkdir -p ios/BFIEducationSIS
    cp GoogleService-Info.plist ios/BFIEducationSIS/GoogleService-Info.plist
    echo "✅ Copied GoogleService-Info.plist to iOS project"
fi

echo "🤖 Setting up Android Firebase configuration..."
if [ -d "android" ]; then
    # Create the Android app directory if it doesn't exist
    mkdir -p android/app
    cp google-services.json android/app/google-services.json
    echo "✅ Copied google-services.json to Android project"
fi

echo "✅ EAS Build: Firebase configuration setup complete!"

echo "🔧 Setting up Gradle wrapper for EAS build..."

# Navigate to android directory if it exists
if [ -d "android" ]; then
    cd android

    # Make gradlew executable
    chmod +x gradlew

    # Verify gradle wrapper jar exists and is valid
    if [ ! -f "gradle/wrapper/gradle-wrapper.jar" ]; then
        echo "❌ gradle-wrapper.jar not found!"
        exit 1
    fi

    # Check if gradle-wrapper.jar is valid
    if ! jar tf gradle/wrapper/gradle-wrapper.jar | grep -q "GradleWrapperMain"; then
        echo "❌ gradle-wrapper.jar appears to be corrupted!"
        echo "🔄 Regenerating Gradle wrapper..."

        # Remove existing wrapper files
        rm -rf gradle/wrapper/*
        rm -f gradlew gradlew.bat

        # Download and setup gradle wrapper
        gradle wrapper --gradle-version=8.8
    fi

    echo "✅ Gradle wrapper setup complete!"

    # Verify gradlew works
    echo "🧪 Testing Gradle wrapper..."
    ./gradlew --version

    echo "✅ Gradle wrapper test successful!"

    # Go back to project root
    cd ..
else
    echo "⚠️  Android directory not found, skipping Gradle setup"
fi

echo "✅ EAS Build pre-install setup complete!"
