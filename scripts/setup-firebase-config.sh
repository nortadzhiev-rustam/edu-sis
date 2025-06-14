#!/bin/bash

# Setup Firebase Configuration for EAS Build
# This script ensures Firebase config files are in the correct locations

set -e

echo "🔥 Setting up Firebase configuration files..."

# Check if root GoogleService-Info.plist exists
if [ ! -f "GoogleService-Info.plist" ]; then
    echo "❌ GoogleService-Info.plist not found in root directory!"
    exit 1
fi

# Check if root google-services.json exists
if [ ! -f "google-services.json" ]; then
    echo "❌ google-services.json not found in root directory!"
    exit 1
fi

# Ensure iOS Firebase config is in the correct location
echo "📱 Setting up iOS Firebase configuration..."
if [ -d "ios/BFIEducationSIS" ]; then
    cp GoogleService-Info.plist ios/BFIEducationSIS/GoogleService-Info.plist
    echo "✅ Copied GoogleService-Info.plist to iOS project"
else
    echo "⚠️  iOS project directory not found, skipping iOS setup"
fi

# Ensure Android Firebase config is in the correct location
echo "🤖 Setting up Android Firebase configuration..."
if [ -d "android/app" ]; then
    cp google-services.json android/app/google-services.json
    echo "✅ Copied google-services.json to Android project"
else
    echo "⚠️  Android project directory not found, skipping Android setup"
fi

echo "✅ Firebase configuration setup complete!"
