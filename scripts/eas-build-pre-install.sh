#!/bin/bash

# EAS Build Pre-Install Hook
# This script ensures the Gradle wrapper is properly set up before the build

set -e

echo "🔧 Setting up Gradle wrapper for EAS build..."

# Navigate to android directory
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
