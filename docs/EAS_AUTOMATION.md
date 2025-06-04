# EAS CLI Automation for edu-sis

This document describes the automated EAS CLI workflows and scripts for the edu-sis project, based on the [official Expo documentation](https://docs.expo.dev/eas/workflows/automating-eas-cli/).

## Overview

The project includes comprehensive automation for:
- **EAS Build**: Automated building for different platforms and profiles
- **EAS Submit**: Automated submission to app stores
- **EAS Update**: Over-the-air updates
- **EAS Workflows**: GitHub-integrated automation workflows

## Quick Start

### 1. Setup EAS CLI
```bash
# Install EAS CLI globally
npm install -g @expo/eas-cli

# Login to your Expo account
eas login

# Configure credentials
eas credentials
```

### 2. Link GitHub Repository
1. Navigate to your project's [GitHub settings](https://expo.dev/accounts/[account]/projects/[projectName]/github)
2. Install the GitHub app
3. Connect your repository

### 3. Run Your First Build
```bash
# Development build
npm run build:dev

# Production build
npm run build:prod

# Using automation script
npm run eas:build -- --profile production --platform android
```

## Available Scripts

### NPM Scripts

#### Build Commands
```bash
npm run build:dev                 # Development build (all platforms)
npm run build:dev:android         # Development build (Android only)
npm run build:dev:ios             # Development build (iOS only)
npm run build:preview             # Preview build (all platforms)
npm run build:preview:android     # Preview build (Android only)
npm run build:preview:ios         # Preview build (iOS only)
npm run build:prod                # Production build (all platforms)
npm run build:prod:android        # Production build (Android only)
npm run build:prod:ios            # Production build (iOS only)
npm run build:all                 # Production build (all platforms)
```

#### Submit Commands
```bash
npm run submit:android            # Submit to Google Play Store
npm run submit:ios                # Submit to Apple App Store
npm run submit:all                # Submit to both stores
```

#### Update Commands
```bash
npm run update                    # Publish OTA update
npm run update:preview            # Update preview branch
npm run update:production         # Update production branch
```

#### Workflow Commands
```bash
npm run workflow:build-ios        # Run iOS build workflow
npm run workflow:build-android    # Run Android build workflow
npm run workflow:build-all        # Run all platforms build workflow
npm run workflow:preview          # Run preview deployment workflow
npm run workflow:production       # Run production deployment workflow
```

#### Advanced Automation
```bash
npm run eas:build                 # Advanced build automation
npm run eas:submit                # Advanced submit automation
npm run eas:update                # Advanced update automation
npm run eas:deploy                # Full deployment automation
npm run eas:status                # Check status of builds/submits/updates
npm run eas:workflow              # Run custom workflows
```

### Automation Script Usage

The `scripts/eas-automation.sh` script provides advanced automation capabilities:

#### Build Examples
```bash
# Basic build
./scripts/eas-automation.sh build --profile production --platform android

# Build with auto-submit
./scripts/eas-automation.sh build --profile production --platform ios --auto-submit

# Build with cache clearing
./scripts/eas-automation.sh build --profile development --clear-cache
```

#### Submit Examples
```bash
# Submit latest build
./scripts/eas-automation.sh submit --platform android

# Submit specific build
./scripts/eas-automation.sh submit --platform ios --build-id abc123
```

#### Update Examples
```bash
# Publish update to specific branch
./scripts/eas-automation.sh update --branch preview --message "Bug fixes"

# Auto-update
./scripts/eas-automation.sh update
```

#### Workflow Examples
```bash
# Run production deployment workflow
./scripts/eas-automation.sh workflow --workflow production-deployment.yml --input platform=android

# Run preview deployment
./scripts/eas-automation.sh workflow --workflow preview-deployment.yml
```

#### Full Deployment
```bash
# Deploy to preview
./scripts/eas-automation.sh deploy --profile preview --platform all

# Deploy to production
./scripts/eas-automation.sh deploy --profile production --platform android
```

## EAS Workflows

The project includes several pre-configured workflows in `.eas/workflows/`:

### Build Workflows
- `build-ios-production.yml` - iOS production builds
- `build-android-production.yml` - Android production builds
- `build-all-platforms.yml` - Multi-platform builds

### Deployment Workflows
- `preview-deployment.yml` - Preview environment deployment
- `production-deployment.yml` - Production deployment with optional auto-submit

### Submit Workflows
- `submit-ios.yml` - iOS App Store submission
- `submit-android.yml` - Google Play Store submission

### Update Workflows
- `publish-update.yml` - OTA update publishing

### Workflow Triggers

Workflows can be triggered by:
1. **Git pushes** (automatic)
2. **Manual dispatch** (GitHub UI)
3. **EAS CLI** (`eas workflow:run`)

## Configuration

### Build Profiles (eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "autoIncrement": true,
      "channel": "production"
    }
  }
}
```

### Submit Configuration

Update `eas.json` with your app store credentials:

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./android-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

## Best Practices

### Development Workflow
1. Use `development` profile for testing
2. Use `preview` profile for staging/QA
3. Use `production` profile for app store releases

### Branch Strategy
- `main` branch → Production builds
- `develop` branch → Preview builds
- Feature branches → Development builds

### Update Strategy
- Use OTA updates for JavaScript changes
- Use new builds for native code changes
- Test updates thoroughly in preview before production

## Troubleshooting

### Common Issues

1. **Build failures**: Check build logs in EAS dashboard
2. **Credential issues**: Run `eas credentials` to reconfigure
3. **Workflow failures**: Check GitHub Actions logs

### Useful Commands
```bash
# Check build status
eas build:list --limit 10

# View specific build
eas build:view [BUILD_ID]

# Cancel running build
eas build:cancel [BUILD_ID]

# Check credentials
eas credentials --platform android
eas credentials --platform ios

# View workflow runs
eas workflow:list
```

## Support

For issues and questions:
- [Expo Documentation](https://docs.expo.dev/eas/)
- [EAS Workflows Documentation](https://docs.expo.dev/eas/workflows/)
- [Expo Discord](https://chat.expo.dev/)
- [Expo Forums](https://forums.expo.dev/)
