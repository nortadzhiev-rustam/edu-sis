/**
 * Test utility to verify font sizes are working correctly
 */

import { getLanguageFontSizes } from '../contexts/ThemeContext';

/**
 * Test font sizes for all supported languages
 */
export const testFontSizes = () => {
  console.log('🧪 FONT SIZES TEST: Testing font sizes for all languages...');
  
  const languages = ['en', 'my', 'zh', 'th'];
  const results = {
    passed: 0,
    failed: 0,
    errors: [],
  };

  languages.forEach(language => {
    try {
      console.log(`📋 Testing font sizes for language: ${language}`);
      
      const fontSizes = getLanguageFontSizes(language);
      
      // Check if all required font size properties exist
      const requiredProperties = [
        'title',
        'subtitle', 
        'body',
        'bodySmall',
        'caption',
        'headerTitle',
        'buttonText'
      ];
      
      const missingProperties = [];
      
      requiredProperties.forEach(prop => {
        if (typeof fontSizes[prop] !== 'number') {
          missingProperties.push(prop);
        }
      });
      
      if (missingProperties.length === 0) {
        console.log(`✅ ${language}: All font sizes present`);
        console.log(`   - title: ${fontSizes.title}`);
        console.log(`   - body: ${fontSizes.body}`);
        console.log(`   - caption: ${fontSizes.caption}`);
        results.passed++;
      } else {
        console.log(`❌ ${language}: Missing properties: ${missingProperties.join(', ')}`);
        results.failed++;
        results.errors.push(`${language}: Missing ${missingProperties.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`❌ ${language}: Error - ${error.message}`);
      results.failed++;
      results.errors.push(`${language}: ${error.message}`);
    }
  });

  console.log('\n🧪 FONT SIZES TEST RESULTS:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  if (results.failed === 0) {
    console.log('\n🎉 All font size tests passed!');
    console.log('✅ Components should work without fontSize errors.');
  } else {
    console.log('\n⚠️  Some font size tests failed.');
  }

  return results;
};

/**
 * Test specific component font size usage
 */
export const testComponentFontSizes = (componentName = 'AgeVerification') => {
  console.log(`🧪 COMPONENT FONT SIZE TEST: Testing ${componentName} component...`);
  
  try {
    const fontSizes = getLanguageFontSizes('en');
    
    // Test the specific font sizes used in AgeVerification component
    const componentFontSizes = {
      title: fontSizes.title,
      body: fontSizes.body,
      bodySmall: fontSizes.bodySmall,
      caption: fontSizes.caption,
    };
    
    console.log('📋 Component font sizes:');
    Object.entries(componentFontSizes).forEach(([key, value]) => {
      if (typeof value === 'number') {
        console.log(`✅ ${key}: ${value}px`);
      } else {
        console.log(`❌ ${key}: ${value} (not a number)`);
      }
    });
    
    const allValid = Object.values(componentFontSizes).every(size => typeof size === 'number');
    
    if (allValid) {
      console.log(`\n🎉 ${componentName} component font sizes are valid!`);
      return true;
    } else {
      console.log(`\n❌ ${componentName} component has invalid font sizes.`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error testing ${componentName} font sizes: ${error.message}`);
    return false;
  }
};

export default {
  testFontSizes,
  testComponentFontSizes,
};
