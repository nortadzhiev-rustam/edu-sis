#!/bin/bash

echo "🔥 Updating Firebase Configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Checking for new Firebase configuration files...${NC}"

# Check for google-services.json
if [ -f "google-services.json" ]; then
    echo -e "${GREEN}✅ Found google-services.json${NC}"
    
    # Copy to Android app directory
    if [ -d "android/app" ]; then
        cp google-services.json android/app/google-services.json
        echo -e "${GREEN}✅ Copied google-services.json to android/app/${NC}"
    else
        echo -e "${YELLOW}⚠️  Android directory not found, will be created during prebuild${NC}"
    fi
else
    echo -e "${RED}❌ google-services.json not found in project root${NC}"
    echo -e "${YELLOW}   Please download it from Firebase Console and place it in the project root${NC}"
fi

# Check for GoogleService-Info.plist
if [ -f "GoogleService-Info.plist" ]; then
    echo -e "${GREEN}✅ Found GoogleService-Info.plist${NC}"
    
    # Copy to iOS directory if it exists
    if [ -d "ios" ]; then
        cp GoogleService-Info.plist ios/
        echo -e "${GREEN}✅ Copied GoogleService-Info.plist to ios/${NC}"
    else
        echo -e "${YELLOW}⚠️  iOS directory not found, will be created during prebuild${NC}"
    fi
else
    echo -e "${RED}❌ GoogleService-Info.plist not found in project root${NC}"
    echo -e "${YELLOW}   Please download it from Firebase Console and place it in the project root${NC}"
fi

echo -e "\n${BLUE}🔍 Verifying configuration...${NC}"
node scripts/verify-firebase-config.js

echo -e "\n${BLUE}🏗️  Regenerating native code...${NC}"
npx expo prebuild --clean

echo -e "\n${GREEN}✅ Firebase configuration update complete!${NC}"
echo -e "\n${YELLOW}📋 Next steps:${NC}"
echo -e "   1. Test your app: ${BLUE}npx expo run:android${NC} or ${BLUE}npx expo run:ios${NC}"
echo -e "   2. Verify Firebase services are working"
echo -e "   3. Test push notifications if applicable"
