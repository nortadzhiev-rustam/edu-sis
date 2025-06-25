#!/bin/sh

# ci_pre_xcodebuild.sh
# This script runs before Xcode Cloud builds to install dependencies

set -e

echo "🚀 Starting Xcode Cloud pre-build script..."

# Print environment info
echo "📍 Current directory: $(pwd)"
echo "📁 Directory contents:"
ls -la

# Navigate to iOS directory (go up one level from ci_scripts)
cd ..

echo "📍 iOS directory: $(pwd)"
echo "📁 iOS directory contents:"
ls -la

# Print environment variables for debugging
echo "🔍 Environment debugging:"
echo "PATH: $PATH"
echo "NODE_BINARY: $NODE_BINARY"
echo "HOME: $HOME"

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

# First, navigate to repository root to check for Node.js setup
echo "🔍 Checking repository root for Node.js setup..."
cd ..
echo "📍 Repository root: $(pwd)"
ls -la

# Check if there's a package.json and node_modules
if [ -f "package.json" ]; then
    echo "✅ Found package.json in repository root"

    # Try to install Node.js dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ] && command -v npm &> /dev/null; then
        echo "📦 Installing Node.js dependencies..."
        npm install
    fi
fi

# Go back to iOS directory
cd ios

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found - this is required for Expo/React Native Podfile"
    echo "📦 Setting up Node.js environment..."

    # Try to source the .xcode.env file which should set up Node.js path
    if [ -f ".xcode.env" ]; then
        echo "📄 Found .xcode.env, sourcing it..."
        source .xcode.env

        # Add NODE_BINARY to PATH if it's set
        if [ -n "$NODE_BINARY" ] && [ -x "$NODE_BINARY" ]; then
            export PATH="$(dirname $NODE_BINARY):$PATH"
            echo "✅ Added NODE_BINARY directory to PATH: $(dirname $NODE_BINARY)"
        fi
    fi

    # Check again after sourcing .xcode.env
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js still not available after sourcing .xcode.env"
        echo "🔍 Checking common Node.js installation paths..."

        # Common Node.js paths in Xcode Cloud
        NODE_PATHS=(
            "/usr/local/bin/node"
            "/opt/homebrew/bin/node"
            "/usr/bin/node"
            "$HOME/.nvm/versions/node/*/bin/node"
            "/Volumes/workspace/repository/node_modules/.bin/node"
        )

        for node_path in "${NODE_PATHS[@]}"; do
            if [ -x "$node_path" ] || ls $node_path 2>/dev/null; then
                echo "✅ Found Node.js at: $node_path"
                export PATH="$(dirname $node_path):$PATH"
                break
            fi
        done
    fi

    # Final check
    if ! command -v node &> /dev/null; then
        echo "❌ Unable to find Node.js. This may cause CocoaPods installation to fail."
        echo "⚠️  Attempting to continue anyway..."
    else
        echo "✅ Node.js is now available: $(node --version)"
        echo "📍 Node.js location: $(which node)"
    fi
else
    echo "✅ Node.js already available: $(node --version)"
    echo "📍 Node.js location: $(which node)"
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
