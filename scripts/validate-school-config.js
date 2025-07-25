#!/usr/bin/env node

/**
 * School Configuration Validation Script
 * Validates that all required configurations are properly set for a new school
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printStatus(message) {
  console.log(colorize(`[INFO] ${message}`, 'blue'));
}

function printSuccess(message) {
  console.log(colorize(`[SUCCESS] ${message}`, 'green'));
}

function printWarning(message) {
  console.log(colorize(`[WARNING] ${message}`, 'yellow'));
}

function printError(message) {
  console.log(colorize(`[ERROR] ${message}`, 'red'));
}

class ConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.projectRoot = process.cwd();
  }

  // Validate package.json
  validatePackageJson() {
    printStatus('Validating package.json...');
    
    const packagePath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packagePath)) {
      this.errors.push('package.json not found');
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      if (!packageJson.name) {
        this.errors.push('package.json: name is required');
      } else if (packageJson.name === 'edu-sis') {
        this.warnings.push('package.json: name still uses default "edu-sis"');
      }

      if (!packageJson.version) {
        this.errors.push('package.json: version is required');
      }

      printSuccess('package.json validation completed');
    } catch (error) {
      this.errors.push(`package.json: Invalid JSON - ${error.message}`);
    }
  }

  // Validate app.json
  validateAppJson() {
    printStatus('Validating app.json...');
    
    const appPath = path.join(this.projectRoot, 'app.json');
    if (!fs.existsSync(appPath)) {
      this.errors.push('app.json not found');
      return;
    }

    try {
      const appJson = JSON.parse(fs.readFileSync(appPath, 'utf8'));
      const expo = appJson.expo;

      if (!expo) {
        this.errors.push('app.json: expo configuration is required');
        return;
      }

      // Check basic app info
      if (!expo.name) {
        this.errors.push('app.json: expo.name is required');
      } else if (expo.name === 'EduNova School') {
        this.warnings.push('app.json: name still uses default "EduNova School"');
      }

      if (!expo.slug) {
        this.errors.push('app.json: expo.slug is required');
      } else if (expo.slug === 'edu-sis') {
        this.warnings.push('app.json: slug still uses default "edu-sis"');
      }

      // Check iOS configuration
      if (expo.ios) {
        if (!expo.ios.bundleIdentifier) {
          this.errors.push('app.json: ios.bundleIdentifier is required');
        } else if (expo.ios.bundleIdentifier === 'com.edunovaasia.edusis') {
          this.warnings.push('app.json: iOS bundle ID still uses default');
        }
      } else {
        this.errors.push('app.json: ios configuration is required');
      }

      // Check Android configuration
      if (expo.android) {
        if (!expo.android.package) {
          this.errors.push('app.json: android.package is required');
        } else if (expo.android.package === 'com.edunovaasia.edusis') {
          this.warnings.push('app.json: Android package still uses default');
        }
      } else {
        this.errors.push('app.json: android configuration is required');
      }

      // Check EAS project ID
      if (expo.extra && expo.extra.eas && expo.extra.eas.projectId) {
        if (expo.extra.eas.projectId === '5c37501a-d3f1-49d2-bf38-28446fc1b0bb') {
          this.warnings.push('app.json: EAS project ID still uses original project');
        }
      } else {
        this.warnings.push('app.json: EAS project ID not set (run "eas init")');
      }

      printSuccess('app.json validation completed');
    } catch (error) {
      this.errors.push(`app.json: Invalid JSON - ${error.message}`);
    }
  }

  // Validate environment configuration
  validateEnvConfig() {
    printStatus('Validating src/config/env.js...');
    
    const envPath = path.join(this.projectRoot, 'src/config/env.js');
    if (!fs.existsSync(envPath)) {
      this.errors.push('src/config/env.js not found');
      return;
    }

    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check for default API URL
      if (envContent.includes('sis.bfi.edu.mm')) {
        this.warnings.push('env.js: API_BASE_URL still uses default BFI domain');
      }

      // Check for default domain
      if (envContent.includes("API_DOMAIN: 'sis.bfi.edu.mm'")) {
        this.warnings.push('env.js: API_DOMAIN still uses default BFI domain');
      }

      // Check for default bundle ID
      if (envContent.includes('com.edunovaasia.edusis')) {
        this.warnings.push('env.js: BUNDLE_ID still uses default');
      }

      // Check for default app name
      if (envContent.includes("NAME: 'EduSIS'")) {
        this.warnings.push('env.js: APP.NAME still uses default "EduSIS"');
      }

      printSuccess('env.js validation completed');
    } catch (error) {
      this.errors.push(`env.js: Error reading file - ${error.message}`);
    }
  }

  // Validate Firebase configuration
  validateFirebaseConfig() {
    printStatus('Validating Firebase configuration...');
    
    const firebaseFiles = [
      'google-services.json',
      'android/app/google-services.json',
      'GoogleService-Info.plist',
      'ios/GoogleService-Info.plist',
      'ios/BFIEducationSIS/GoogleService-Info.plist'
    ];

    let hasFirebaseConfig = false;

    firebaseFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        hasFirebaseConfig = true;
        
        try {
          if (file.endsWith('.json')) {
            const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            // Check if it's still the old BFI project
            if (config.project_info && config.project_info.project_id === 'edunova-bfi') {
              this.warnings.push(`${file}: Still uses original BFI Firebase project`);
            }
          } else if (file.endsWith('.plist')) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check for old project ID in plist
            if (content.includes('edunova-bfi')) {
              this.warnings.push(`${file}: Still uses original BFI Firebase project`);
            }
          }
        } catch (error) {
          this.errors.push(`${file}: Invalid configuration file - ${error.message}`);
        }
      }
    });

    if (!hasFirebaseConfig) {
      this.errors.push('No Firebase configuration files found');
    } else {
      printSuccess('Firebase configuration files found');
    }
  }

  // Validate required assets
  validateAssets() {
    printStatus('Validating required assets...');
    
    const requiredAssets = [
      'assets/app_logo.png',
      'assets/app_logo_dark.png',
      'assets/icon.png',
      'assets/adaptive-icon.png',
      'assets/splash-icon.png',
      'assets/favicon.png'
    ];

    const schoolAssets = [
      'assets/EduNova School Logo.png',
      'assets/EduNova School Logo Dark.png'
    ];

    requiredAssets.forEach(asset => {
      const assetPath = path.join(this.projectRoot, asset);
      if (!fs.existsSync(assetPath)) {
        this.errors.push(`Missing required asset: ${asset}`);
      } else {
        const stats = fs.statSync(assetPath);
        if (stats.size === 0) {
          this.warnings.push(`Asset is empty (placeholder): ${asset}`);
        }
      }
    });

    schoolAssets.forEach(asset => {
      const assetPath = path.join(this.projectRoot, asset);
      if (fs.existsSync(assetPath)) {
        this.warnings.push(`School-specific asset still uses default name: ${asset}`);
      }
    });

    printSuccess('Asset validation completed');
  }

  // Validate school configuration service
  validateSchoolConfigService() {
    printStatus('Validating school configuration service...');
    
    const configPath = path.join(this.projectRoot, 'src/services/schoolConfigService.js');
    if (!fs.existsSync(configPath)) {
      this.errors.push('src/services/schoolConfigService.js not found');
      return;
    }

    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      // Check if new school configuration has been added
      if (!configContent.includes('// Add new school configurations here') && 
          configContent.split('_edu_mm:').length === 2) {
        this.warnings.push('schoolConfigService.js: No new school configuration detected');
      }

      printSuccess('School configuration service validation completed');
    } catch (error) {
      this.errors.push(`schoolConfigService.js: Error reading file - ${error.message}`);
    }
  }

  // Run all validations
  validate() {
    console.log(colorize('🔍 EduSIS School Configuration Validator', 'cyan'));
    console.log(colorize('==========================================', 'cyan'));
    console.log();

    this.validatePackageJson();
    this.validateAppJson();
    this.validateEnvConfig();
    this.validateFirebaseConfig();
    this.validateAssets();
    this.validateSchoolConfigService();

    console.log();
    console.log(colorize('📊 Validation Summary', 'magenta'));
    console.log(colorize('===================', 'magenta'));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      printSuccess('✅ All validations passed! Configuration looks good.');
    } else {
      if (this.errors.length > 0) {
        console.log();
        printError(`❌ Found ${this.errors.length} error(s):`);
        this.errors.forEach(error => {
          console.log(colorize(`   • ${error}`, 'red'));
        });
      }

      if (this.warnings.length > 0) {
        console.log();
        printWarning(`⚠️  Found ${this.warnings.length} warning(s):`);
        this.warnings.forEach(warning => {
          console.log(colorize(`   • ${warning}`, 'yellow'));
        });
      }

      console.log();
      if (this.errors.length > 0) {
        printError('❌ Please fix the errors before proceeding.');
        process.exit(1);
      } else {
        printWarning('⚠️  Please review the warnings. The app may still work but some configurations need attention.');
      }
    }

    console.log();
    console.log(colorize('💡 Next Steps:', 'cyan'));
    console.log('   1. Fix any errors or warnings above');
    console.log('   2. Replace placeholder assets with actual school assets');
    console.log('   3. Set up Firebase project and replace configuration files');
    console.log('   4. Run "eas init" to set up EAS project');
    console.log('   5. Test the app with "expo start"');
    console.log('   6. Build and deploy when ready');
  }
}

// Run validation
const validator = new ConfigValidator();
validator.validate();
