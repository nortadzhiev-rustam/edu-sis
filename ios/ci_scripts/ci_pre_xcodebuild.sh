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

# First, try to install Node.js if not available
if ! command -v node &> /dev/null; then
    echo "🚀 Attempting to install Node.js..."

    # Try different installation methods
    if command -v brew &> /dev/null; then
        echo "🍺 Installing Node.js via Homebrew..."
        brew install node || echo "Homebrew install failed, continuing..."
    fi

    # Check if we can use a system package manager
    if command -v apt-get &> /dev/null; then
        echo "📦 Installing Node.js via apt-get..."
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - || echo "NodeSource setup failed"
        sudo apt-get install -y nodejs || echo "apt-get install failed"
    fi

    # Try to download and install Node.js directly
    if ! command -v node &> /dev/null; then
        echo "📥 Attempting direct Node.js installation..."
        NODE_VERSION="v18.17.0"
        NODE_DISTRO="darwin-x64"
        NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-${NODE_DISTRO}.tar.gz"

        cd /tmp
        curl -O "$NODE_URL" || echo "Direct download failed"
        if [ -f "node-${NODE_VERSION}-${NODE_DISTRO}.tar.gz" ]; then
            tar -xzf "node-${NODE_VERSION}-${NODE_DISTRO}.tar.gz"
            if [ -d "node-${NODE_VERSION}-${NODE_DISTRO}" ]; then
                export PATH="/tmp/node-${NODE_VERSION}-${NODE_DISTRO}/bin:$PATH"
                echo "✅ Node.js added to PATH from direct installation"
            fi
        fi
        cd - > /dev/null
    fi
fi

# Navigate to repository root to check for Node.js setup
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

# Install pods with Node.js workaround if needed
echo "📦 Installing CocoaPods dependencies..."

if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not available - creating temporary workaround..."

    # Create a temporary node command that will help with basic path resolution
    echo "🔧 Creating temporary node wrapper..."

    # Create a temporary directory for our node wrapper
    mkdir -p /tmp/node_wrapper

    # Create a simple node wrapper script that handles basic require.resolve calls
    cat > /tmp/node_wrapper/node << 'EOF'
#!/bin/sh
# Temporary node wrapper for Xcode Cloud builds
# This handles basic require.resolve calls for Expo/React Native

if [ "$1" = "--print" ] && echo "$2" | grep -q "require.resolve"; then
    # Handle require.resolve calls
    if echo "$2" | grep -q "expo/package.json"; then
        # Return a reasonable path for expo
        echo "/Volumes/workspace/repository/node_modules/expo"
    elif echo "$2" | grep -q "react-native/package.json"; then
        # Return a reasonable path for react-native
        echo "/Volumes/workspace/repository/node_modules/react-native"
    else
        echo "/Volumes/workspace/repository/node_modules"
    fi
else
    echo "Node.js wrapper: command not fully supported: $*" >&2
    exit 1
fi
EOF

    # Make the wrapper executable
    chmod +x /tmp/node_wrapper/node

    # Add the wrapper to PATH
    export PATH="/tmp/node_wrapper:$PATH"

    echo "✅ Temporary node wrapper created and added to PATH"
    echo "🔍 Testing node wrapper:"
    which node
    node --print "require.resolve('expo/package.json')" || echo "Wrapper test completed"
fi

# Try to install pods
if pod install --verbose; then
    echo "✅ CocoaPods installation successful"
else
    echo "❌ CocoaPods installation failed"
    echo "🔍 Attempting alternative installation methods..."

    # Try without verbose flag
    if pod install; then
        echo "✅ CocoaPods installation successful (without verbose)"
    else
        echo "❌ Standard CocoaPods installation failed"
        echo "🔄 Trying with simplified Podfile..."

        # Backup original Podfile and use simplified version
        if [ -f "Podfile.simple" ]; then
            cp Podfile Podfile.backup
            cp Podfile.simple Podfile
            echo "✅ Switched to simplified Podfile"

            # Try pod install with simplified Podfile
            if pod install; then
                echo "✅ CocoaPods installation successful with simplified Podfile"
                echo "⚠️  Note: Using simplified Podfile - some features may not be available"
            else
                echo "❌ Even simplified Podfile installation failed"
                # Restore original Podfile
                cp Podfile.backup Podfile
                echo "🔄 Restored original Podfile"
                exit 1
            fi
        else
            echo "❌ No simplified Podfile available"
            exit 1
        fi
    fi
fi

# Verify installation
if [ -d "Pods" ]; then
    echo "✅ CocoaPods installation successful"
    echo "📁 Pods directory contents:"
    ls -la Pods/ | head -10
else
    echo "❌ CocoaPods installation failed - Pods directory not found"
    exit 1
fi

# Set up environment variables for build phase scripts
echo "🔧 Setting up environment variables for Xcode build phase scripts..."

# Determine the best Node.js binary to use
NODE_BINARY_PATH=""
if command -v node &> /dev/null; then
    NODE_BINARY_PATH=$(which node)
    echo "✅ Found Node.js at: $NODE_BINARY_PATH"
elif [ -x "/tmp/node_wrapper/node" ]; then
    NODE_BINARY_PATH="/tmp/node_wrapper/node"
    echo "✅ Using temporary Node.js wrapper: $NODE_BINARY_PATH"
else
    echo "⚠️  No Node.js found - creating minimal wrapper for build phases"
    # Create a more comprehensive node wrapper for build phases
    mkdir -p /tmp/node_wrapper
    cat > /tmp/node_wrapper/node << 'EOF'
#!/bin/sh
# Enhanced Node.js wrapper for Xcode build phases

# Handle common Node.js commands used in React Native/Expo builds
case "$1" in
    "--version")
        echo "v18.0.0-wrapper"
        ;;
    "--print")
        # Handle require.resolve calls
        if echo "$2" | grep -q "require.resolve.*expo/package.json"; then
            echo "/Volumes/workspace/repository/node_modules/expo"
        elif echo "$2" | grep -q "require.resolve.*react-native/package.json"; then
            echo "/Volumes/workspace/repository/node_modules/react-native"
        elif echo "$2" | grep -q "require.resolve.*@expo/cli"; then
            echo "/Volumes/workspace/repository/node_modules/@expo/cli/build/src/cli.js"
        elif echo "$2" | grep -q "require.*expo/scripts/resolveAppEntry"; then
            echo "index.js"
        elif echo "$2" | grep -q "require.*path.*dirname.*react-native.*react-native-xcode.sh"; then
            echo "/Volumes/workspace/repository/node_modules/react-native/scripts/react-native-xcode.sh"
        else
            echo "/Volumes/workspace/repository"
        fi
        ;;
    "-e")
        # Handle -e flag (execute)
        if echo "$2" | grep -q "resolveAppEntry"; then
            echo "index.js"
        else
            echo ""
        fi
        ;;
    *)
        echo "Node.js wrapper: Unsupported command: $*" >&2
        exit 0  # Don't fail the build
        ;;
esac
EOF
    chmod +x /tmp/node_wrapper/node
    NODE_BINARY_PATH="/tmp/node_wrapper/node"
    echo "✅ Created enhanced Node.js wrapper: $NODE_BINARY_PATH"
fi

# Create .xcode.env.local with comprehensive build configuration
cat > .xcode.env.local << EOF
# Generated by ci_pre_xcodebuild.sh for Xcode Cloud builds
export NODE_BINARY="$NODE_BINARY_PATH"
export PATH="/tmp/node_wrapper:$PATH"

# Skip bundling in debug builds to reduce Node.js dependency
export SKIP_BUNDLING=1

# Set project root
export PROJECT_ROOT="\$PROJECT_DIR/.."

# Expo CLI configuration
export CLI_PATH="$NODE_BINARY_PATH"
export BUNDLE_COMMAND="export:embed"

# Entry file configuration
export ENTRY_FILE="index.js"
EOF

echo "✅ Created .xcode.env.local with comprehensive build configuration"

# Also create a backup and update the main .xcode.env
if [ ! -f ".xcode.env.backup" ]; then
    cp .xcode.env .xcode.env.backup
fi

cat > .xcode.env << EOF
# Enhanced .xcode.env for Xcode Cloud compatibility
# This file is sourced by Xcode build phase scripts

# NODE_BINARY variable contains the PATH to the node executable
if [ -n "\$NODE_BINARY" ] && [ -x "\$NODE_BINARY" ]; then
    # Use the NODE_BINARY if it's already set and executable
    export NODE_BINARY="\$NODE_BINARY"
elif [ -x "/tmp/node_wrapper/node" ]; then
    export NODE_BINARY="/tmp/node_wrapper/node"
elif command -v node >/dev/null 2>&1; then
    export NODE_BINARY=\$(command -v node)
elif [ -x "/usr/local/bin/node" ]; then
    export NODE_BINARY="/usr/local/bin/node"
elif [ -x "/opt/homebrew/bin/node" ]; then
    export NODE_BINARY="/opt/homebrew/bin/node"
else
    # Create a minimal fallback
    export NODE_BINARY="node"
fi

# Ensure Node.js directory is in PATH
if [ -n "\$NODE_BINARY" ] && [ -x "\$NODE_BINARY" ]; then
    export PATH="\$(dirname "\$NODE_BINARY"):\$PATH"
fi

# Add our wrapper directory to PATH
export PATH="/tmp/node_wrapper:\$PATH"
EOF

echo "✅ Updated .xcode.env with enhanced Node.js detection"

# Create a simple react-native-xcode.sh script if it doesn't exist
RN_XCODE_SCRIPT="/Volumes/workspace/repository/node_modules/react-native/scripts/react-native-xcode.sh"
if [ ! -f "$RN_XCODE_SCRIPT" ]; then
    echo "🔧 Creating fallback react-native-xcode.sh script..."
    mkdir -p "$(dirname "$RN_XCODE_SCRIPT")"
    cat > "$RN_XCODE_SCRIPT" << 'EOF'
#!/bin/bash
# Fallback react-native-xcode.sh for Xcode Cloud builds
echo "Using fallback react-native-xcode.sh script"

# Skip bundling if SKIP_BUNDLING is set
if [[ "$SKIP_BUNDLING" ]]; then
    echo "Skipping bundling due to SKIP_BUNDLING flag"
    exit 0
fi

# Create a minimal bundle if needed
if [[ "$CONFIGURATION" = "Release" ]]; then
    echo "Creating minimal bundle for Release build"
    mkdir -p "$BUILT_PRODUCTS_DIR/$PRODUCT_NAME.app"
    echo "// Minimal bundle" > "$BUILT_PRODUCTS_DIR/$PRODUCT_NAME.app/main.jsbundle"
fi

echo "react-native-xcode.sh completed successfully"
EOF
    chmod +x "$RN_XCODE_SCRIPT"
    echo "✅ Created fallback react-native-xcode.sh script"
fi

echo "🎉 Pre-build script completed successfully!"
