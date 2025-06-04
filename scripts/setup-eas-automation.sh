#!/bin/bash

# EAS Automation Setup Script for edu-sis
# This script sets up the complete EAS automation environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Setting up EAS CLI automation for edu-sis..."

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

print_success "Prerequisites check passed"

# Install EAS CLI if not present
if ! command -v eas &> /dev/null; then
    print_status "Installing EAS CLI globally..."
    npm install -g @expo/eas-cli
    print_success "EAS CLI installed successfully"
else
    print_success "EAS CLI is already installed"
    eas --version
fi

# Check EAS authentication
print_status "Checking EAS authentication..."
if ! eas whoami &> /dev/null; then
    print_warning "Not logged in to EAS. Please log in:"
    eas login
else
    CURRENT_USER=$(eas whoami)
    print_success "Already logged in as: $CURRENT_USER"
fi

# Make scripts executable
print_status "Making automation scripts executable..."
chmod +x scripts/eas-automation.sh
chmod +x scripts/setup-eas-automation.sh
print_success "Scripts are now executable"

# Check if eas.json exists and is properly configured
if [ ! -f "eas.json" ]; then
    print_warning "eas.json not found. Initializing EAS project..."
    eas build:configure
else
    print_success "eas.json already exists"
fi

# Verify project configuration
print_status "Verifying project configuration..."

if [ ! -f "app.json" ]; then
    print_error "app.json not found. This doesn't appear to be an Expo project."
    exit 1
fi

SLUG=$(grep -o '"slug": "[^"]*"' app.json | cut -d'"' -f4)
if [ -z "$SLUG" ]; then
    print_error "No slug found in app.json. Please add a slug to your app.json."
    exit 1
fi

print_success "Project slug: $SLUG"

# Check if GitHub repository is linked
print_status "Checking GitHub integration..."
print_warning "Make sure to link your GitHub repository in the EAS dashboard:"
echo "  1. Go to: https://expo.dev/accounts/[account]/projects/$SLUG/github"
echo "  2. Install the GitHub app"
echo "  3. Connect your repository"

# Test automation script
print_status "Testing automation script..."
if ./scripts/eas-automation.sh --help &> /dev/null; then
    print_success "Automation script is working correctly"
else
    print_error "Automation script test failed"
    exit 1
fi

# Show available commands
echo ""
print_success "EAS automation setup completed successfully!"
echo ""
print_status "Available npm scripts:"
echo "  npm run build:dev           - Development build"
echo "  npm run build:preview       - Preview build"
echo "  npm run build:prod          - Production build"
echo "  npm run submit:android      - Submit to Google Play"
echo "  npm run submit:ios          - Submit to App Store"
echo "  npm run update              - Publish OTA update"
echo "  npm run workflow:production - Run production workflow"
echo ""
print_status "Available automation commands:"
echo "  npm run eas:build           - Advanced build automation"
echo "  npm run eas:deploy          - Full deployment automation"
echo "  npm run eas:status          - Check build/submit status"
echo ""
print_status "Direct script usage:"
echo "  ./scripts/eas-automation.sh build --profile production --platform android"
echo "  ./scripts/eas-automation.sh deploy --profile preview"
echo "  ./scripts/eas-automation.sh workflow --workflow production-deployment.yml"
echo ""
print_status "Next steps:"
echo "1. Configure your app store credentials in eas.json"
echo "2. Set up Android keystore: eas credentials --platform android"
echo "3. Set up iOS certificates: eas credentials --platform ios"
echo "4. Link your GitHub repository (see instructions above)"
echo "5. Run your first build: npm run build:dev"
echo ""
print_status "Documentation:"
echo "  See docs/EAS_AUTOMATION.md for detailed usage instructions"
echo ""
print_success "Setup complete! You're ready to use EAS automation."
