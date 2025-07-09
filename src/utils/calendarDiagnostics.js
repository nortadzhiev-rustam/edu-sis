/**
 * Calendar Diagnostics Utility
 * Helps troubleshoot calendar integration issues
 */

import { Alert } from 'react-native';
import { buildApiUrl } from '../config/env';

/**
 * Run calendar diagnostics
 */
export const runCalendarDiagnostics = async (userData, schoolConfig) => {
  try {
    console.log('🔍 CALENDAR DIAGNOSTICS: Starting diagnostic checks...');
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      userInfo: {
        userType: userData?.userType,
        branchId: userData?.branchId,
        branchName: userData?.branchName,
        hasAuthCode: !!userData?.authCode,
        authCodeLength: userData?.authCode?.length || 0,
      },
      schoolInfo: {
        schoolId: schoolConfig?.schoolId,
        name: schoolConfig?.name,
        hasGoogleWorkspace: schoolConfig?.hasGoogleWorkspace,
      },
      apiTests: [],
      networkTests: [],
      recommendations: []
    };

    // Test 1: Basic connectivity
    console.log('🌐 Testing basic connectivity...');
    try {
      const baseUrl = buildApiUrl('/');
      const response = await fetch(baseUrl, { 
        method: 'HEAD',
        timeout: 5000 
      });
      
      diagnostics.networkTests.push({
        test: 'Basic Connectivity',
        success: response.status < 500,
        status: response.status,
        message: `Base API reachable (${response.status})`
      });
    } catch (error) {
      diagnostics.networkTests.push({
        test: 'Basic Connectivity',
        success: false,
        error: error.message,
        message: 'Cannot reach base API endpoint'
      });
      diagnostics.recommendations.push('Check network connection and API server status');
    }

    // Test 2: Calendar API endpoint
    if (userData?.authCode) {
      console.log('📅 Testing calendar API endpoint...');
      try {
        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const calendarUrl = buildApiUrl(
          `/mobile-api/calendar/data?authCode=${userData.authCode}&start_date=${startDate}&end_date=${endDate}`
        );
        
        const response = await fetch(calendarUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 10000
        });

        const responseText = await response.text();
        let responseData = null;
        
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          diagnostics.apiTests.push({
            test: 'Calendar API Response Parsing',
            success: false,
            error: 'Invalid JSON response',
            responseText: responseText.substring(0, 200) + '...',
            message: 'API returned non-JSON response'
          });
        }

        diagnostics.apiTests.push({
          test: 'Calendar API Endpoint',
          success: response.ok && responseData?.success,
          status: response.status,
          url: calendarUrl,
          responseSuccess: responseData?.success,
          totalBranches: responseData?.total_branches,
          message: response.ok 
            ? `API responded with ${responseData?.total_branches || 0} branch(es)`
            : `API error: ${response.status} ${response.statusText}`
        });

        if (!response.ok) {
          diagnostics.recommendations.push(`Calendar API returned ${response.status}. Check backend server and endpoint implementation.`);
        }

        if (responseData && !responseData.success) {
          diagnostics.recommendations.push(`API returned success=false: ${responseData.message || 'Unknown error'}`);
        }

      } catch (error) {
        diagnostics.apiTests.push({
          test: 'Calendar API Endpoint',
          success: false,
          error: error.message,
          message: 'Failed to connect to calendar API'
        });
        
        if (error.message.includes('Network request failed')) {
          diagnostics.recommendations.push('Network request failed - check if backend server is running and accessible');
        } else if (error.message.includes('timeout')) {
          diagnostics.recommendations.push('API request timed out - backend may be slow or unresponsive');
        }
      }
    } else {
      diagnostics.apiTests.push({
        test: 'Calendar API Endpoint',
        success: false,
        error: 'No auth code available',
        message: 'Cannot test API without authentication'
      });
      diagnostics.recommendations.push('User authentication required - ensure user is logged in');
    }

    // Test 3: Auth code validation
    console.log('🔑 Validating auth code...');
    if (userData?.authCode) {
      const authCodePattern = /^[a-f0-9]+$/i;
      const isValidFormat = authCodePattern.test(userData.authCode);
      
      diagnostics.apiTests.push({
        test: 'Auth Code Validation',
        success: isValidFormat && userData.authCode.length > 8,
        authCodeLength: userData.authCode.length,
        validFormat: isValidFormat,
        message: isValidFormat 
          ? `Auth code format valid (${userData.authCode.length} chars)`
          : 'Auth code format invalid'
      });

      if (!isValidFormat) {
        diagnostics.recommendations.push('Auth code format appears invalid - check user login process');
      }
    }

    // Generate summary
    const successfulTests = [
      ...diagnostics.networkTests,
      ...diagnostics.apiTests
    ].filter(test => test.success).length;
    
    const totalTests = diagnostics.networkTests.length + diagnostics.apiTests.length;
    
    diagnostics.summary = {
      successfulTests,
      totalTests,
      successRate: `${successfulTests}/${totalTests}`,
      overallSuccess: successfulTests === totalTests
    };

    console.log('✅ CALENDAR DIAGNOSTICS: Completed', diagnostics.summary);
    return diagnostics;

  } catch (error) {
    console.error('❌ CALENDAR DIAGNOSTICS: Failed', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Show diagnostics results with UI
 */
export const showCalendarDiagnostics = async (userData, schoolConfig) => {
  try {
    Alert.alert(
      'Running Calendar Diagnostics',
      'Checking calendar integration... Please wait.',
      [{ text: 'OK' }]
    );

    const diagnostics = await runCalendarDiagnostics(userData, schoolConfig);

    if (diagnostics.summary) {
      const { summary, recommendations } = diagnostics;
      
      let message = `Diagnostic Results:\n\n`;
      message += `Success Rate: ${summary.successRate}\n`;
      message += `Overall Status: ${summary.overallSuccess ? '✅ Healthy' : '⚠️ Issues Found'}\n\n`;
      
      if (recommendations.length > 0) {
        message += `Recommendations:\n`;
        recommendations.forEach((rec, index) => {
          message += `${index + 1}. ${rec}\n`;
        });
      } else {
        message += `✅ No issues detected!\n`;
        message += `Calendar integration appears to be working correctly.`;
      }

      Alert.alert(
        summary.overallSuccess ? 'Calendar Diagnostics ✅' : 'Calendar Diagnostics ⚠️',
        message,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Diagnostics Failed',
        `Failed to run calendar diagnostics: ${diagnostics.error}`,
        [{ text: 'OK' }]
      );
    }

    return diagnostics;

  } catch (error) {
    Alert.alert(
      'Diagnostics Error',
      `Error running diagnostics: ${error.message}`,
      [{ text: 'OK' }]
    );
    return { success: false, error: error.message };
  }
};

export default {
  runCalendarDiagnostics,
  showCalendarDiagnostics,
};
