/**
 * Example React Native component showing how to fetch calendar events until March 20
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CalendarService from '../src/services/calendarService';

const CalendarUntilMarch20Example = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calendarService, setCalendarService] = useState(null);
  const [error, setError] = useState(null);

  // Initialize calendar service on component mount
  useEffect(() => {
    initializeCalendarService();
  }, []);

  const initializeCalendarService = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        setError('No user data found. Please log in first.');
        return;
      }

      const userData = JSON.parse(userDataString);
      const service = await CalendarService.initialize(userData);
      setCalendarService(service);
    } catch (error) {
      console.error('Error initializing calendar service:', error);
      setError('Failed to initialize calendar service');
    }
  };

  const fetchEventsUntilMarch20 = async (year = null, forceRefresh = false) => {
    if (!calendarService) {
      Alert.alert('Error', 'Calendar service not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching calendar events until March 20...');
      const fetchedEvents = await calendarService.getEventsUntilMarch20(year, forceRefresh);
      
      setEvents(fetchedEvents);
      
      Alert.alert(
        'Success',
        `Fetched ${fetchedEvents.length} events until March 20${year ? ` ${year}` : ''}`
      );
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(error.message);
      Alert.alert('Error', `Failed to fetch events: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const groupEventsByMonth = (events) => {
    const grouped = {};
    
    events.forEach(event => {
      const eventDate = new Date(event.startTime);
      const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(event);
    });
    
    return grouped;
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: date.getHours() !== 0 || date.getMinutes() !== 0 ? 'numeric' : undefined,
      minute: date.getHours() !== 0 || date.getMinutes() !== 0 ? '2-digit' : undefined,
    });
  };

  const getEventTypeColor = (event) => {
    const colorMap = {
      google_workspace: '#4285F4',
      academic: '#34A853',
      school_events: '#2196F3',
      timetable: '#4CAF50',
      homework: '#FF9800',
    };
    
    return colorMap[event.calendarType] || colorMap[event.type] || '#8E8E93';
  };

  const renderEvent = (event, index) => (
    <View key={event.id || index} style={styles.eventItem}>
      <View 
        style={[
          styles.eventIndicator, 
          { backgroundColor: getEventTypeColor(event) }
        ]} 
      />
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDate}>{formatEventDate(event.startTime)}</Text>
        <Text style={styles.eventSource}>{event.source}</Text>
        {event.location && (
          <Text style={styles.eventLocation}>📍 {event.location}</Text>
        )}
      </View>
    </View>
  );

  const renderEventsByMonth = () => {
    const groupedEvents = groupEventsByMonth(events);
    
    return Object.keys(groupedEvents).sort().map(monthKey => {
      const [year, month] = monthKey.split('-');
      const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
      
      return (
        <View key={monthKey} style={styles.monthSection}>
          <Text style={styles.monthHeader}>
            {monthName} ({groupedEvents[monthKey].length} events)
          </Text>
          {groupedEvents[monthKey].map((event, index) => renderEvent(event, index))}
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendar Events Until March 20</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => fetchEventsUntilMarch20()}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : 'Fetch This Year'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => fetchEventsUntilMarch20(2025)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Fetch 2025</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={() => fetchEventsUntilMarch20(null, true)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Force Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Fetching calendar events...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {events.length > 0 && (
        <ScrollView style={styles.eventsContainer}>
          <Text style={styles.summaryText}>
            Found {events.length} events until March 20
          </Text>
          {renderEventsByMonth()}
        </ScrollView>
      )}

      {!loading && events.length === 0 && !error && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No events found. Tap a button above to fetch calendar events.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  refreshButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  eventsContainer: {
    flex: 1,
  },
  monthSection: {
    marginBottom: 20,
  },
  monthHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  eventSource: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default CalendarUntilMarch20Example;
