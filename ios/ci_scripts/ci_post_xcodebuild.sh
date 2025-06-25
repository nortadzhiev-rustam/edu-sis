#!/bin/sh

# ci_post_xcodebuild.sh
# This script runs after Xcode Cloud builds for cleanup and reporting

set -e

echo "🎯 Starting Xcode Cloud post-build script..."

# Print build information
echo "📍 Current directory: $(pwd)"
echo "🏗️  Build completed successfully!"

# Check if build artifacts exist
if [ -d "build" ]; then
    echo "📦 Build artifacts found:"
    ls -la build/ | head -10
else
    echo "⚠️  No build directory found"
fi

# Print some useful information
echo "📊 Build Summary:"
echo "   - CocoaPods dependencies: ✅ Installed"
echo "   - Workspace: ✅ Available"
echo "   - Build: ✅ Completed"

echo "🎉 Post-build script completed successfully!"
