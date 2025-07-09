/**
 * Script to fetch calendar events until March 20
 * This demonstrates how to use the new getEventsUntilMarch20 method
 */

import CalendarService from '../src/services/calendarService.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Fetch calendar events until March 20
 * @param {number} year - Optional year (defaults to current year)
 * @param {boolean} forceRefresh - Force refresh cache
 */
async function fetchCalendarUntilMarch20(year = null, forceRefresh = false) {
  try {
    console.log('🚀 Starting calendar fetch until March 20...');

    // Get user data from AsyncStorage (assuming user is logged in)
    const userDataString = await AsyncStorage.getItem('userData');
    if (!userDataString) {
      throw new Error('No user data found. Please log in first.');
    }

    const userData = JSON.parse(userDataString);
    console.log(`👤 User: ${userData.username} (${userData.userType})`);

    // Initialize calendar service
    console.log('🔧 Initializing calendar service...');
    const calendarService = await CalendarService.initialize(userData);

    // Fetch events until March 20
    console.log('📅 Fetching calendar events until March 20...');
    console.log(
      '⏰ This will fetch from today until March 20 (not just 30 days)'
    );
    const events = await calendarService.getEventsUntilMarch20(
      year,
      forceRefresh
    );

    console.log(
      `✅ Successfully fetched ${events.length} events until March 20`
    );

    // Display summary of events by month
    const eventsByMonth = {};
    events.forEach((event) => {
      const eventDate = new Date(event.startTime);
      const monthKey = `${eventDate.getFullYear()}-${String(
        eventDate.getMonth() + 1
      ).padStart(2, '0')}`;

      if (!eventsByMonth[monthKey]) {
        eventsByMonth[monthKey] = [];
      }
      eventsByMonth[monthKey].push(event);
    });

    console.log('\n📊 Events by month:');
    Object.keys(eventsByMonth)
      .sort()
      .forEach((monthKey) => {
        const [year, month] = monthKey.split('-');
        const monthName = new Date(year, month - 1, 1).toLocaleDateString(
          'en-US',
          { month: 'long', year: 'numeric' }
        );
        console.log(`  ${monthName}: ${eventsByMonth[monthKey].length} events`);
      });

    // Display first few events as examples
    console.log('\n📋 Sample events:');
    events.slice(0, 5).forEach((event, index) => {
      const eventDate = new Date(event.startTime);
      console.log(`  ${index + 1}. ${event.title}`);
      console.log(`     Date: ${eventDate.toLocaleDateString()}`);
      console.log(`     Type: ${event.calendarType || event.type}`);
      console.log(`     Source: ${event.source}`);
      console.log('');
    });

    if (events.length > 5) {
      console.log(`     ... and ${events.length - 5} more events`);
    }

    return events;
  } catch (error) {
    console.error('❌ Error fetching calendar events:', error);
    throw error;
  }
}

/**
 * Main function to run the script
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const year = args[0] ? parseInt(args[0]) : null;
    const forceRefresh = args.includes('--force-refresh');

    console.log('📅 Calendar Fetch Script - Until March 20');
    console.log('==========================================');

    if (year) {
      console.log(`🎯 Target year: ${year}`);
    } else {
      console.log('🎯 Target year: Current year (auto-detect)');
    }

    if (forceRefresh) {
      console.log('🔄 Force refresh: Enabled');
    }

    console.log('');

    const events = await fetchCalendarUntilMarch20(year, forceRefresh);

    console.log('\n✅ Calendar fetch completed successfully!');
    console.log(`📊 Total events fetched: ${events.length}`);
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other modules
export { fetchCalendarUntilMarch20 };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
