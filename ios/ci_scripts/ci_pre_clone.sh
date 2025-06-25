#!/bin/sh

# ci_pre_clone.sh
# This script runs before the repository is cloned in Xcode Cloud
# Use this to set up the build environment

set -e

echo "🚀 Starting Xcode Cloud pre-clone script..."

# Install Node.js if not available
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    
    # Try to install Node.js using available package managers
    if command -v brew &> /dev/null; then
        echo "🍺 Using Homebrew to install Node.js..."
        brew install node
    elif command -v apt-get &> /dev/null; then
        echo "📦 Using apt-get to install Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "⚠️  No package manager found, Node.js installation may be needed manually"
    fi
else
    echo "✅ Node.js already available: $(node --version)"
fi

# Verify Node.js installation
if command -v node &> /dev/null; then
    echo "✅ Node.js setup complete: $(node --version)"
    echo "📍 Node.js location: $(which node)"
else
    echo "❌ Node.js installation failed or not found"
fi

echo "🎉 Pre-clone script completed!"
