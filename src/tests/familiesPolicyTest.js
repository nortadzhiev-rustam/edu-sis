/**
 * Families Policy Compliance Test
 * 
 * This test verifies that the families policy compliance system is working correctly.
 * Run this test to ensure age verification and parental consent flows are functional.
 */

import {
  storeAgeVerification,
  getAgeVerification,
  storeParentalConsent,
  getParentalConsent,
  checkComplianceStatus,
  getAgeGroup,
  getComplianceRequirements,
  clearFamiliesPolicyData,
} from '../services/familiesPolicyService';

/**
 * Test the families policy compliance system
 */
export const testFamiliesPolicyCompliance = async () => {
  console.log('🧪 FAMILIES POLICY TEST: Starting compliance tests...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Clear any existing data
    await clearFamiliesPolicyData();
    console.log('🧹 FAMILIES POLICY TEST: Cleared existing data');

    // Test 1: Age Group Determination
    console.log('📋 Test 1: Age group determination...');
    try {
      const ageGroups = [
        { age: 4, expected: 'ages_5_under' },
        { age: 7, expected: 'ages_6_8' },
        { age: 10, expected: 'ages_9_12' },
        { age: 14, expected: 'ages_13_15' },
        { age: 16, expected: 'ages_16_17' },
        { age: 20, expected: 'ages_18_over' },
      ];

      for (const test of ageGroups) {
        const result = getAgeGroup(test.age);
        if (result === test.expected) {
          console.log(`✅ Age ${test.age} correctly mapped to ${result}`);
        } else {
          throw new Error(`Age ${test.age} mapped to ${result}, expected ${test.expected}`);
        }
      }
      results.passed++;
    } catch (error) {
      console.log('❌ Age group determination: FAILED -', error.message);
      results.failed++;
      results.errors.push(`Age group determination: ${error.message}`);
    }

    // Test 2: Compliance Requirements
    console.log('📋 Test 2: Compliance requirements...');
    try {
      const childRequirements = getComplianceRequirements(8);
      const teenRequirements = getComplianceRequirements(16);
      const adultRequirements = getComplianceRequirements(25);

      if (childRequirements.requiresParentalConsent && 
          !teenRequirements.requiresParentalConsent &&
          !adultRequirements.requiresParentalConsent) {
        console.log('✅ Compliance requirements correctly determined');
        results.passed++;
      } else {
        throw new Error('Compliance requirements not correctly determined');
      }
    } catch (error) {
      console.log('❌ Compliance requirements: FAILED -', error.message);
      results.failed++;
      results.errors.push(`Compliance requirements: ${error.message}`);
    }

    // Test 3: Age Verification Storage
    console.log('📋 Test 3: Age verification storage...');
    try {
      const testVerification = {
        age: 12,
        birthDate: '2012-01-01T00:00:00.000Z',
        requiresParentalConsent: true,
        userType: 'student',
      };

      await storeAgeVerification(testVerification);
      const stored = await getAgeVerification();

      if (stored && stored.age === 12 && stored.ageGroup === 'ages_9_12') {
        console.log('✅ Age verification storage working correctly');
        results.passed++;
      } else {
        throw new Error('Age verification not stored correctly');
      }
    } catch (error) {
      console.log('❌ Age verification storage: FAILED -', error.message);
      results.failed++;
      results.errors.push(`Age verification storage: ${error.message}`);
    }

    // Test 4: Parental Consent Storage
    console.log('📋 Test 4: Parental consent storage...');
    try {
      const testConsent = {
        studentId: 'test-student-123',
        studentName: 'Test Student',
        parentEmail: 'parent@test.com',
        dataCollectionConsent: true,
        communicationConsent: true,
      };

      await storeParentalConsent(testConsent);
      const stored = await getParentalConsent();

      if (stored && stored.studentId === 'test-student-123' && stored.dataCollectionConsent) {
        console.log('✅ Parental consent storage working correctly');
        results.passed++;
      } else {
        throw new Error('Parental consent not stored correctly');
      }
    } catch (error) {
      console.log('❌ Parental consent storage: FAILED -', error.message);
      results.failed++;
      results.errors.push(`Parental consent storage: ${error.message}`);
    }

    // Test 5: Compliance Status Check
    console.log('📋 Test 5: Compliance status check...');
    try {
      const compliance = await checkComplianceStatus('test-student-123');

      if (compliance.isCompliant && compliance.ageGroup === 'ages_9_12') {
        console.log('✅ Compliance status check working correctly');
        results.passed++;
      } else {
        throw new Error(`Compliance check failed: ${JSON.stringify(compliance)}`);
      }
    } catch (error) {
      console.log('❌ Compliance status check: FAILED -', error.message);
      results.failed++;
      results.errors.push(`Compliance status check: ${error.message}`);
    }

    // Test 6: Non-compliant User (No Age Verification)
    console.log('📋 Test 6: Non-compliant user check...');
    try {
      await clearFamiliesPolicyData();
      const compliance = await checkComplianceStatus('test-student-456');

      if (!compliance.isCompliant && compliance.reason === 'age_verification_required') {
        console.log('✅ Non-compliant user correctly identified');
        results.passed++;
      } else {
        throw new Error(`Non-compliant user not correctly identified: ${JSON.stringify(compliance)}`);
      }
    } catch (error) {
      console.log('❌ Non-compliant user check: FAILED -', error.message);
      results.failed++;
      results.errors.push(`Non-compliant user check: ${error.message}`);
    }

    // Test 7: Child Requiring Parental Consent
    console.log('📋 Test 7: Child requiring parental consent...');
    try {
      const childVerification = {
        age: 8,
        birthDate: '2016-01-01T00:00:00.000Z',
        requiresParentalConsent: true,
        userType: 'student',
      };

      await storeAgeVerification(childVerification);
      const compliance = await checkComplianceStatus('test-child-789');

      if (!compliance.isCompliant && compliance.reason === 'parental_consent_required') {
        console.log('✅ Child requiring parental consent correctly identified');
        results.passed++;
      } else {
        throw new Error(`Child consent requirement not correctly identified: ${JSON.stringify(compliance)}`);
      }
    } catch (error) {
      console.log('❌ Child parental consent check: FAILED -', error.message);
      results.failed++;
      results.errors.push(`Child parental consent check: ${error.message}`);
    }

  } catch (error) {
    console.log('❌ FAMILIES POLICY TEST: Unexpected error -', error.message);
    results.failed++;
    results.errors.push(`Unexpected error: ${error.message}`);
  }

  // Clean up
  await clearFamiliesPolicyData();

  // Print results
  console.log('\n🧪 FAMILIES POLICY TEST RESULTS:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  if (results.failed === 0) {
    console.log('\n🎉 All families policy compliance tests passed!');
    console.log('✅ The system is ready for app store submission.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix issues before submission.');
  }

  return results;
};

/**
 * Test age verification component functionality
 */
export const testAgeVerificationComponent = () => {
  console.log('🧪 AGE VERIFICATION COMPONENT TEST:');
  console.log('1. Navigate to Login screen');
  console.log('2. Try logging in as a student');
  console.log('3. Age verification screen should appear');
  console.log('4. Enter a birth date for someone under 13');
  console.log('5. Parental consent screen should appear');
  console.log('6. Complete the consent flow');
  console.log('7. Login should complete successfully');
  console.log('\n✅ Manual testing required for UI components');
};

/**
 * Test parental consent component functionality
 */
export const testParentalConsentComponent = () => {
  console.log('🧪 PARENTAL CONSENT COMPONENT TEST:');
  console.log('1. Trigger parental consent flow (age < 13)');
  console.log('2. Enter parent email address');
  console.log('3. Review consent information');
  console.log('4. Grant consent');
  console.log('5. Verify consent is stored');
  console.log('6. Verify user can proceed');
  console.log('\n✅ Manual testing required for UI components');
};

export default {
  testFamiliesPolicyCompliance,
  testAgeVerificationComponent,
  testParentalConsentComponent,
};
