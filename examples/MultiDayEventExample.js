/**
 * Example demonstrating multi-day event functionality in the calendar
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import CalendarView from '../src/components/CalendarView';

const MultiDayEventExample = () => {
  // Sample events including multi-day events
  const [events] = useState([
    // Single day event
    {
      id: 'single_day_1',
      title: 'Math Class',
      description: 'Regular math lesson',
      startTime: '2025-07-15T09:00:00.000Z',
      endTime: '2025-07-15T10:00:00.000Z',
      isAllDay: false,
      location: 'Room 101',
      source: 'academic_calendar',
      calendarType: 'academic',
    },
    
    // Multi-day event (3 days)
    {
      id: 'conference_2025',
      title: 'Annual School Conference',
      description: 'Three-day educational conference',
      startTime: '2025-07-16T08:00:00.000Z',
      endTime: '2025-07-18T17:00:00.000Z',
      isAllDay: false,
      location: 'Main Auditorium',
      source: 'school_events',
      calendarType: 'school_events',
    },
    
    // Multi-day event (2 days)
    {
      id: 'exam_period',
      title: 'Final Examinations',
      description: 'End of semester exams',
      startTime: '2025-07-20T09:00:00.000Z',
      endTime: '2025-07-21T16:00:00.000Z',
      isAllDay: false,
      location: 'Various Rooms',
      source: 'academic_calendar',
      calendarType: 'academic',
    },
    
    // All-day multi-day event
    {
      id: 'holiday_week',
      title: 'Summer Break',
      description: 'School holiday period',
      startTime: '2025-07-25T00:00:00.000Z',
      endTime: '2025-07-27T23:59:59.000Z',
      isAllDay: true,
      location: '',
      source: 'school_events',
      calendarType: 'school_events',
    },
    
    // Single day event overlapping with multi-day
    {
      id: 'workshop_day2',
      title: 'Teacher Workshop',
      description: 'Professional development session',
      startTime: '2025-07-17T14:00:00.000Z',
      endTime: '2025-07-17T16:00:00.000Z',
      isAllDay: false,
      location: 'Conference Room',
      source: 'school_events',
      calendarType: 'school_events',
    },
  ]);

  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleEventPress = (event) => {
    setSelectedEvent(event);
  };

  const handleDatePress = (date) => {
    console.log('Date pressed:', date.toDateString());
  };

  const renderEventDetails = () => {
    if (!selectedEvent) {
      return (
        <View style={styles.noSelectionContainer}>
          <Text style={styles.noSelectionText}>
            Tap on an event to see details
          </Text>
        </View>
      );
    }

    const startDate = new Date(selectedEvent.startTime);
    const endDate = new Date(selectedEvent.endTime);
    const isMultiDay = startDate.toDateString() !== endDate.toDateString();

    return (
      <View style={styles.eventDetailsContainer}>
        <Text style={styles.eventDetailsTitle}>Event Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Title:</Text>
          <Text style={styles.detailValue}>{selectedEvent.title}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>
            {isMultiDay ? 'Multi-day Event' : 'Single-day Event'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Start:</Text>
          <Text style={styles.detailValue}>
            {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString()}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>End:</Text>
          <Text style={styles.detailValue}>
            {endDate.toLocaleDateString()} at {endDate.toLocaleTimeString()}
          </Text>
        </View>
        
        {isMultiDay && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>
              {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} days
            </Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Location:</Text>
          <Text style={styles.detailValue}>
            {selectedEvent.location || 'Not specified'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Description:</Text>
          <Text style={styles.detailValue}>{selectedEvent.description}</Text>
        </View>

        {selectedEvent.isMultiDay && (
          <View style={styles.multiDayInfo}>
            <Text style={styles.multiDayInfoTitle}>Multi-Day Event Info:</Text>
            <Text style={styles.multiDayInfoText}>
              • This event appears on all dates from start to end
            </Text>
            <Text style={styles.multiDayInfoText}>
              • Calendar dots are rectangular for multi-day events
            </Text>
            <Text style={styles.multiDayInfoText}>
              • Event titles show "(starts)", "(continues)", or "(ends)"
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Multi-Day Event Calendar Example</Text>
      
      <Text style={styles.subtitle}>
        This example shows how multi-day events are displayed across multiple dates
      </Text>

      <View style={styles.calendarContainer}>
        <CalendarView
          events={events}
          onEventPress={handleEventPress}
          onDatePress={handleDatePress}
        />
      </View>

      <ScrollView style={styles.detailsContainer}>
        {renderEventDetails()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailsContainer: {
    maxHeight: 300,
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noSelectionContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noSelectionText: {
    color: '#666',
    fontStyle: 'italic',
  },
  eventDetailsContainer: {
    padding: 16,
  },
  eventDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: '600',
    width: 80,
    color: '#555',
  },
  detailValue: {
    flex: 1,
    color: '#333',
  },
  multiDayInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  multiDayInfoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976d2',
  },
  multiDayInfoText: {
    color: '#1565c0',
    marginBottom: 4,
  },
});

export default MultiDayEventExample;
