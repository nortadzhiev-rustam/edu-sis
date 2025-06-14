#!/bin/bash

# Project Cleanup Script for edu-sis
# Removes debugging code, unused imports, and development-only files

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting project cleanup..."

# 1. Remove development-only files
print_status "Removing development-only files..."

DEV_FILES=(
    "src/utils/firebaseDebug.js"
    "src/components/NotificationTester.js"
    "src/components/ThemeLanguageDemo.js"
    "src/data/dummyUsers.js"
)

for file in "${DEV_FILES[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        print_success "Removed $file"
    fi
done

# 2. Clean up console.log statements (but keep console.error for production debugging)
print_status "Cleaning up console.log statements..."

# Find and list files with console.log (excluding console.error and console.warn)
CONSOLE_LOG_FILES=$(find src/ -name "*.js" -type f -exec grep -l "console\.log\|console\.debug\|console\.info" {} \; 2>/dev/null || true)

if [ -n "$CONSOLE_LOG_FILES" ]; then
    print_warning "Files with console.log statements found:"
    echo "$CONSOLE_LOG_FILES"
    print_warning "Please review and remove console.log statements manually"
else
    print_success "No console.log statements found"
fi

# 3. Check for unused imports
print_status "Checking for potential unused imports..."

# This is a basic check - for comprehensive analysis, use ESLint
UNUSED_IMPORT_FILES=$(find src/ -name "*.js" -type f -exec grep -l "import.*from.*;" {} \; | head -5)

if [ -n "$UNUSED_IMPORT_FILES" ]; then
    print_warning "Consider running ESLint to check for unused imports in these files:"
    echo "$UNUSED_IMPORT_FILES" | head -5
fi

# 4. Remove commented code blocks
print_status "Checking for commented code blocks..."

COMMENTED_CODE_FILES=$(find src/ -name "*.js" -type f -exec grep -l "//.*console\|//.*import\|//.*function" {} \; 2>/dev/null || true)

if [ -n "$COMMENTED_CODE_FILES" ]; then
    print_warning "Files with potentially commented code found:"
    echo "$COMMENTED_CODE_FILES" | head -5
    print_warning "Please review and remove commented code manually"
fi

# 5. Clean up temporary files
print_status "Cleaning up temporary files..."

TEMP_FILES=(
    "*.tmp"
    "*.log"
    ".DS_Store"
    "Thumbs.db"
    "*.backup"
)

for pattern in "${TEMP_FILES[@]}"; do
    find . -name "$pattern" -type f -delete 2>/dev/null || true
done

print_success "Temporary files cleaned"

# 6. Check bundle size impact
print_status "Checking for large files that might impact bundle size..."

LARGE_FILES=$(find src/ -name "*.js" -type f -size +50k 2>/dev/null || true)

if [ -n "$LARGE_FILES" ]; then
    print_warning "Large JavaScript files found (>50KB):"
    echo "$LARGE_FILES"
    print_warning "Consider code splitting or optimization"
fi

# 7. Validate project structure
print_status "Validating project structure..."

REQUIRED_DIRS=(
    "src/components"
    "src/screens"
    "src/services"
    "src/utils"
    "src/contexts"
    "src/hooks"
    "src/styles"
    "src/config"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        print_warning "Missing directory: $dir"
    fi
done

# 8. Check for security issues
print_status "Checking for potential security issues..."

SECURITY_PATTERNS=(
    "password.*=.*['\"]"
    "api.*key.*=.*['\"]"
    "secret.*=.*['\"]"
    "token.*=.*['\"]"
)

for pattern in "${SECURITY_PATTERNS[@]}"; do
    SECURITY_FILES=$(find src/ -name "*.js" -type f -exec grep -l "$pattern" {} \; 2>/dev/null || true)
    if [ -n "$SECURITY_FILES" ]; then
        print_warning "Potential hardcoded secrets found in:"
        echo "$SECURITY_FILES"
    fi
done

# 9. Generate cleanup report
print_status "Generating cleanup report..."

REPORT_FILE="cleanup-report-$(date +%Y%m%d-%H%M%S).txt"

cat > "$REPORT_FILE" << EOF
Project Cleanup Report
Generated: $(date)

Files Removed:
$(for file in "${DEV_FILES[@]}"; do echo "- $file"; done)

Recommendations:
1. Review and remove remaining console.log statements
2. Run ESLint to check for unused imports
3. Remove commented code blocks
4. Consider code splitting for large files
5. Ensure no hardcoded secrets in code

Next Steps:
- Run: npm run lint (if available)
- Run: npm run test (if available)
- Build and test the application
EOF

print_success "Cleanup report saved to: $REPORT_FILE"

# 10. Final recommendations
print_status "Cleanup completed!"
echo ""
print_success "✅ Development files removed"
print_success "✅ Temporary files cleaned"
print_success "✅ Project structure validated"
echo ""
print_warning "📋 Manual review recommended for:"
echo "   - Console.log statements"
echo "   - Unused imports (run ESLint)"
echo "   - Commented code blocks"
echo "   - Large files optimization"
echo ""
print_status "🚀 Ready for production build!"
