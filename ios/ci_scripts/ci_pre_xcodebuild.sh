#!/bin/sh

# ci_pre_xcodebuild.sh
# This script runs before Xcode Cloud builds to install dependencies

set -e

echo "🚀 Starting Xcode Cloud pre-build script..."

# Print environment info
echo "📍 Current directory: $(pwd)"
echo "📁 Directory contents:"
ls -la

# Navigate to iOS directory
cd ios

echo "📍 iOS directory: $(pwd)"
echo "📁 iOS directory contents:"
ls -la

# Check if Podfile exists
if [ ! -f "Podfile" ]; then
    echo "❌ Podfile not found in ios directory"
    exit 1
fi

echo "✅ Podfile found"

# Check if Podfile.lock exists
if [ ! -f "Podfile.lock" ]; then
    echo "⚠️  Podfile.lock not found - this might cause version inconsistencies"
else
    echo "✅ Podfile.lock found"
fi

# Install CocoaPods if not already installed
if ! command -v pod &> /dev/null; then
    echo "📦 Installing CocoaPods..."
    gem install cocoapods
else
    echo "✅ CocoaPods already installed"
    pod --version
fi

# Install pods
echo "📦 Installing CocoaPods dependencies..."
pod install --verbose

# Verify installation
if [ -d "Pods" ]; then
    echo "✅ CocoaPods installation successful"
    echo "📁 Pods directory contents:"
    ls -la Pods/ | head -10
else
    echo "❌ CocoaPods installation failed - Pods directory not found"
    exit 1
fi

echo "🎉 Pre-build script completed successfully!"
