/**
 * User Calendar Screen - Combined Calendar (Branch + Personal Events)
 * This screen shows the full calendar with both branch events and personal events
 * Used from user dashboards (Teacher, Parent, Student screens)
 */

import React from 'react';
import CalendarScreen from './CalendarScreen';

/**
 * User Calendar Screen Component
 * Wrapper around CalendarScreen that forces combined mode
 */
export default function UserCalendarScreen({ navigation, route }) {
  // Force combined mode for user dashboard calendar
  const combinedRoute = {
    ...route,
    params: {
      ...route?.params,
      mode: 'combined',
    },
  };

  console.log(
    '📅 USER CALENDAR: Initializing combined calendar (branch + personal events)'
  );
  console.log('📅 USER CALENDAR: Route params:', combinedRoute.params);

  return <CalendarScreen navigation={navigation} route={combinedRoute} />;
}
