#!/bin/bash

# iOS Firebase Setup Script for EAS Build
# This script ensures GoogleService-Info.plist is in the correct location for iOS builds

set -e

echo "🍏 iOS Firebase Setup: Starting..."

# Define paths
PROJECT_ROOT="$PWD"
FIREBASE_PLIST="GoogleService-Info.plist"
IOS_PROJECT_DIR="ios/BFIEducationSIS"
BUILD_DIR="${BUILT_PRODUCTS_DIR:-build/ios/BFIEducationSIS}"

echo "📍 Project root: $PROJECT_ROOT"
echo "📍 iOS project dir: $IOS_PROJECT_DIR"
echo "📍 Build dir: $BUILD_DIR"

# Check if Firebase plist exists in root
if [ ! -f "$FIREBASE_PLIST" ]; then
    echo "❌ $FIREBASE_PLIST not found in project root!"
    exit 1
fi

echo "✅ Found $FIREBASE_PLIST in project root"

# Ensure iOS project directory exists
if [ ! -d "$IOS_PROJECT_DIR" ]; then
    echo "📱 Creating iOS project directory: $IOS_PROJECT_DIR"
    mkdir -p "$IOS_PROJECT_DIR"
fi

# Copy to iOS project directory
echo "📱 Copying $FIREBASE_PLIST to iOS project directory..."
cp "$FIREBASE_PLIST" "$IOS_PROJECT_DIR/$FIREBASE_PLIST"
echo "✅ Copied to $IOS_PROJECT_DIR/$FIREBASE_PLIST"

# If build directory exists, copy there too
if [ -d "$(dirname "$BUILD_DIR")" ]; then
    echo "🔨 Creating build directory: $BUILD_DIR"
    mkdir -p "$BUILD_DIR"
    echo "🔨 Copying $FIREBASE_PLIST to build directory..."
    cp "$FIREBASE_PLIST" "$BUILD_DIR/$FIREBASE_PLIST"
    echo "✅ Copied to $BUILD_DIR/$FIREBASE_PLIST"
fi

# Also copy to any other potential locations EAS might expect
POTENTIAL_LOCATIONS=(
    "ios/$FIREBASE_PLIST"
    "build/ios/$FIREBASE_PLIST"
    "build/ios/BFIEducationSIS/$FIREBASE_PLIST"
)

for location in "${POTENTIAL_LOCATIONS[@]}"; do
    dir=$(dirname "$location")
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
    fi
    cp "$FIREBASE_PLIST" "$location"
    echo "✅ Copied to $location"
done

echo "🍏 iOS Firebase Setup: Complete!"
echo "📋 Firebase plist locations:"
find . -name "$FIREBASE_PLIST" -type f 2>/dev/null || echo "No files found"
