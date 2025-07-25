#!/bin/bash

# EduSIS School Duplication Script
# This script helps automate the process of duplicating the EduSIS project for a new school

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to prompt for user input
prompt_input() {
    local prompt="$1"
    local var_name="$2"
    local default_value="$3"
    
    if [ -n "$default_value" ]; then
        read -p "$prompt [$default_value]: " input
        if [ -z "$input" ]; then
            input="$default_value"
        fi
    else
        read -p "$prompt: " input
        while [ -z "$input" ]; do
            print_error "This field is required!"
            read -p "$prompt: " input
        done
    fi
    
    eval "$var_name='$input'"
}

# Function to validate required tools
check_dependencies() {
    print_status "Checking dependencies..."
    
    local missing_deps=()
    
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    if ! command -v expo &> /dev/null; then
        missing_deps+=("expo-cli")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_error "Please install the missing dependencies and try again."
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Function to collect school information
collect_school_info() {
    print_status "Collecting new school information..."
    
    prompt_input "School Name (e.g., 'ABC International School')" SCHOOL_NAME
    prompt_input "School Domain (e.g., 'abc.edu')" SCHOOL_DOMAIN
    prompt_input "School ID (e.g., 'abc_edu')" SCHOOL_ID
    prompt_input "App Name (e.g., 'ABC SIS')" APP_NAME
    prompt_input "Bundle ID (e.g., 'com.abc.edusis')" BUNDLE_ID
    prompt_input "Package Name (same as Bundle ID)" PACKAGE_NAME "$BUNDLE_ID"
    prompt_input "API Base URL (e.g., 'https://sis.abc.edu/mobile-api')" API_BASE_URL
    prompt_input "Primary Color (hex code)" PRIMARY_COLOR "#007AFF"
    prompt_input "Secondary Color (hex code)" SECONDARY_COLOR "#5856D6"
    prompt_input "Accent Color (hex code)" ACCENT_COLOR "#FF9500"
    
    # Confirm the information
    echo
    print_status "Please confirm the following information:"
    echo "School Name: $SCHOOL_NAME"
    echo "School Domain: $SCHOOL_DOMAIN"
    echo "School ID: $SCHOOL_ID"
    echo "App Name: $APP_NAME"
    echo "Bundle ID: $BUNDLE_ID"
    echo "Package Name: $PACKAGE_NAME"
    echo "API Base URL: $API_BASE_URL"
    echo "Primary Color: $PRIMARY_COLOR"
    echo "Secondary Color: $SECONDARY_COLOR"
    echo "Accent Color: $ACCENT_COLOR"
    echo
    
    read -p "Is this information correct? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_error "Aborted by user"
        exit 1
    fi
}

# Function to update package.json
update_package_json() {
    print_status "Updating package.json..."
    
    local slug=$(echo "$SCHOOL_ID" | tr '[:upper:]' '[:lower:]' | sed 's/_/-/g')
    
    # Create backup
    cp package.json package.json.backup
    
    # Update package.json using node
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.name = '$slug-sis';
        pkg.version = '1.0.0';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    
    print_success "Updated package.json"
}

# Function to update app.json
update_app_json() {
    print_status "Updating app.json..."
    
    local slug=$(echo "$SCHOOL_ID" | tr '[:upper:]' '[:lower:]' | sed 's/_/-/g')
    
    # Create backup
    cp app.json app.json.backup
    
    # Update app.json using node
    node -e "
        const fs = require('fs');
        const app = JSON.parse(fs.readFileSync('app.json', 'utf8'));
        app.expo.name = '$APP_NAME';
        app.expo.slug = '$slug-sis';
        app.expo.version = '1.0.0';
        app.expo.ios.bundleIdentifier = '$BUNDLE_ID';
        app.expo.ios.buildNumber = '1';
        app.expo.android.package = '$PACKAGE_NAME';
        app.expo.android.versionCode = 1;
        // Remove old EAS project ID - will be set when running eas init
        if (app.expo.extra && app.expo.extra.eas) {
            delete app.expo.extra.eas.projectId;
        }
        fs.writeFileSync('app.json', JSON.stringify(app, null, 2));
    "
    
    print_success "Updated app.json"
}

# Function to update env.js
update_env_config() {
    print_status "Updating src/config/env.js..."
    
    # Create backup
    cp src/config/env.js src/config/env.js.backup
    
    # Update the configuration
    sed -i.tmp "s|API_BASE_URL: '[^']*'|API_BASE_URL: '$API_BASE_URL'|g" src/config/env.js
    sed -i.tmp "s|API_DOMAIN: '[^']*'|API_DOMAIN: '$SCHOOL_DOMAIN'|g" src/config/env.js
    sed -i.tmp "s|NAME: '[^']*'|NAME: '$APP_NAME'|g" src/config/env.js
    sed -i.tmp "s|BUNDLE_ID: '[^']*'|BUNDLE_ID: '$BUNDLE_ID'|g" src/config/env.js
    
    # Clean up temporary files
    rm -f src/config/env.js.tmp
    
    print_success "Updated src/config/env.js"
}

# Function to create school configuration template
create_school_config() {
    print_status "Creating school configuration template..."
    
    local config_file="src/config/school-configs/${SCHOOL_ID}.js"
    mkdir -p "src/config/school-configs"
    
    cat > "$config_file" << EOF
// Configuration for $SCHOOL_NAME
export const ${SCHOOL_ID}Config = {
  schoolId: '$SCHOOL_ID',
  name: '$SCHOOL_NAME',
  domain: '$SCHOOL_DOMAIN',
  hasGoogleWorkspace: true,
  googleConfig: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    apiKey: 'YOUR_GOOGLE_API_KEY',
    calendarIds: {
      main: 'main@$SCHOOL_DOMAIN',
      academic: 'academic@$SCHOOL_DOMAIN',
      sports: 'sports@$SCHOOL_DOMAIN',
      events: 'events@$SCHOOL_DOMAIN',
      holidays: 'holidays@$SCHOOL_DOMAIN',
      staff: 'staff@$SCHOOL_DOMAIN',
    },
    branchCalendars: {
      primary: {
        academic: 'primary-academic@$SCHOOL_DOMAIN',
        events: 'primary-events@$SCHOOL_DOMAIN',
      },
      secondary: {
        academic: 'secondary-academic@$SCHOOL_DOMAIN',
        events: 'secondary-events@$SCHOOL_DOMAIN',
      },
      high_school: {
        academic: 'highschool-academic@$SCHOOL_DOMAIN',
        events: 'highschool-events@$SCHOOL_DOMAIN',
      },
    },
  },
  branding: {
    name: '$SCHOOL_NAME',
    logo: {
      light: require('../../../assets/${SCHOOL_ID}_logo.png'),
      dark: require('../../../assets/${SCHOOL_ID}_logo_dark.png'),
    },
    colors: {
      primary: '$PRIMARY_COLOR',
      secondary: '$SECONDARY_COLOR',
      accent: '$ACCENT_COLOR',
    },
  },
  features: {
    googleCalendar: true,
    googleCalendarReadOnly: true,
    nativeCalendar: false,
    customEvents: true,
    messaging: true,
    homework: true,
    attendance: true,
    bps: true,
    health: true,
  },
};

export default ${SCHOOL_ID}Config;
EOF
    
    print_success "Created school configuration template: $config_file"
}

# Function to create asset placeholders
create_asset_placeholders() {
    print_status "Creating asset placeholder files..."
    
    local assets_dir="assets"
    
    # Create placeholder files for required assets
    local required_assets=(
        "${SCHOOL_ID}_logo.png"
        "${SCHOOL_ID}_logo_dark.png"
        "app_logo.png"
        "app_logo_dark.png"
        "icon.png"
        "adaptive-icon.png"
        "splash-icon.png"
        "favicon.png"
    )
    
    for asset in "${required_assets[@]}"; do
        if [ ! -f "$assets_dir/$asset" ]; then
            touch "$assets_dir/$asset"
            print_warning "Created placeholder: $assets_dir/$asset (REPLACE WITH ACTUAL ASSET)"
        fi
    done
    
    print_success "Asset placeholders created"
}

# Function to clean up Firebase config files
cleanup_firebase_config() {
    print_status "Cleaning up old Firebase configuration files..."
    
    local firebase_files=(
        "google-services.json"
        "android/app/google-services.json"
        "GoogleService-Info.plist"
        "ios/GoogleService-Info.plist"
        "ios/BFIEducationSIS/GoogleService-Info.plist"
    )
    
    for file in "${firebase_files[@]}"; do
        if [ -f "$file" ]; then
            mv "$file" "$file.old"
            print_warning "Moved old Firebase config: $file -> $file.old"
        fi
    done
    
    print_success "Old Firebase configurations backed up"
}

# Function to create next steps guide
create_next_steps() {
    print_status "Creating next steps guide..."
    
    cat > "NEXT_STEPS_${SCHOOL_ID}.md" << EOF
# Next Steps for $SCHOOL_NAME EduSIS Setup

## Completed by Script:
- ✅ Updated package.json
- ✅ Updated app.json
- ✅ Updated src/config/env.js
- ✅ Created school configuration template
- ✅ Created asset placeholders
- ✅ Backed up old Firebase configurations

## Manual Steps Required:

### 1. Firebase Setup
1. Create new Firebase project at https://console.firebase.google.com
2. Add Android app with package name: $PACKAGE_NAME
3. Add iOS app with bundle ID: $BUNDLE_ID
4. Download and replace Firebase configuration files:
   - google-services.json (place in root and android/app/)
   - GoogleService-Info.plist (place in root, ios/, and ios/BFIEducationSIS/)

### 2. Asset Replacement
Replace the following placeholder files with actual assets:
- assets/${SCHOOL_ID}_logo.png (school logo - light theme)
- assets/${SCHOOL_ID}_logo_dark.png (school logo - dark theme)
- assets/app_logo.png (app logo - light theme)
- assets/app_logo_dark.png (app logo - dark theme)
- assets/icon.png (app icon - 1024x1024px)
- assets/adaptive-icon.png (Android adaptive icon)
- assets/splash-icon.png (splash screen icon)
- assets/favicon.png (web favicon)

### 3. Google Services Configuration
Update the school configuration file:
- Edit: src/config/school-configs/${SCHOOL_ID}.js
- Add your Google Client ID and API Key
- Update calendar IDs if different

### 4. EAS Project Setup
1. Run: eas init
2. This will create a new EAS project and update app.json

### 5. Backend API Setup
1. Ensure your backend API is accessible at: $API_BASE_URL
2. Test API endpoints
3. Configure authentication

### 6. Testing
1. Run: npm install
2. Run: expo start
3. Test on development devices
4. Verify all configurations work

### 7. Build and Deploy
1. Development build: eas build --profile development
2. Preview build: eas build --profile preview
3. Production build: eas build --profile production
4. Submit to app stores: eas submit

## Important Notes:
- All old configurations have been backed up with .backup or .old extensions
- Replace placeholder assets before building
- Test thoroughly before production deployment
- Update app store metadata and descriptions
EOF
    
    print_success "Created next steps guide: NEXT_STEPS_${SCHOOL_ID}.md"
}

# Main execution
main() {
    echo "🏫 EduSIS School Duplication Script"
    echo "=================================="
    echo
    
    check_dependencies
    collect_school_info
    
    print_status "Starting duplication process..."
    
    update_package_json
    update_app_json
    update_env_config
    create_school_config
    create_asset_placeholders
    cleanup_firebase_config
    create_next_steps
    
    echo
    print_success "🎉 Duplication process completed!"
    print_status "Please review NEXT_STEPS_${SCHOOL_ID}.md for manual steps"
    print_warning "Remember to replace placeholder assets and Firebase configurations"
    echo
}

# Run main function
main "$@"
