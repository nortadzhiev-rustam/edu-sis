/**
 * Calendar View Component
 * Displays events in a beautiful calendar interface
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const CalendarView = ({ events = [], onEventPress, onDatePress }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const fontSizes = getLanguageFontSizes(language);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Calendar calculations
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      // 6 weeks
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return {
      year,
      month,
      firstDay,
      lastDay,
      days,
      monthName: firstDay.toLocaleDateString('en-US', { month: 'long' }),
    };
  }, [currentDate]);

  // Events by date - handle multi-day events by showing them on all dates in the range
  const eventsByDate = useMemo(() => {
    const grouped = {};

    events.forEach((event) => {
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime || event.startTime);

      // Normalize dates to start of day for comparison
      const start = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );
      const end = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
      );

      // Add event to all dates in the range
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateKey = currentDate.toDateString();

        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }

        // Add event with additional metadata for multi-day events
        const eventWithMetadata = {
          ...event,
          isMultiDay: start.getTime() !== end.getTime(),
          isFirstDay: currentDate.getTime() === start.getTime(),
          isLastDay: currentDate.getTime() === end.getTime(),
          currentDisplayDate: new Date(currentDate),
        };

        grouped[dateKey].push(eventWithMetadata);

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return grouped;
  }, [events]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    const dateKey = selectedDate.toDateString();
    return eventsByDate[dateKey] || [];
  }, [selectedDate, eventsByDate]);

  // Determine event type based on description and title
  const getEventType = (event) => {
    const description = (event.description || '').toLowerCase();
    const title = (event.title || '').toLowerCase();
    const combined = `${title} ${description}`;

    // Academic/Class related
    if (
      combined.match(
        /(class|lesson|subject|math|science|english|history|literature|physics|chemistry|biology|geography|art|music|pe|physical education)/
      )
    ) {
      return 'Academic';
    }

    // Exams and Tests
    if (
      combined.match(/(exam|test|quiz|assessment|evaluation|midterm|final)/)
    ) {
      return 'Exam';
    }

    // Meetings
    if (
      combined.match(/(meeting|conference|discussion|parent|teacher|staff)/)
    ) {
      return 'Meeting';
    }

    // Events and Activities
    if (
      combined.match(
        /(event|festival|celebration|ceremony|assembly|sports|competition|tournament|field trip|excursion)/
      )
    ) {
      return 'Event';
    }

    // Assignments and Homework
    if (
      combined.match(/(assignment|homework|project|submission|deadline|due)/)
    ) {
      return 'Assignment';
    }

    // Holidays and Breaks
    if (combined.match(/(holiday|break|vacation|off|closed|no school)/)) {
      return 'Holiday';
    }

    // Health related
    if (combined.match(/(health|medical|checkup|vaccination|doctor|nurse)/)) {
      return 'Health';
    }

    // Library related
    if (combined.match(/(library|book|reading|borrow|return)/)) {
      return 'Library';
    }

    // Default fallback - use source or generic type
    if (event.source) {
      return event.source.charAt(0).toUpperCase() + event.source.slice(1);
    }

    return 'General';
  };

  // Get color for event type
  const getEventTypeColor = (eventType) => {
    const colors = {
      Academic: '#4CAF50', // Green - learning/growth
      Exam: '#F44336', // Red - important/urgent
      Meeting: '#2196F3', // Blue - communication
      Event: '#FF9800', // Orange - activities/fun
      Assignment: '#9C27B0', // Purple - tasks/work
      Holiday: '#FFC107', // Amber - celebration/break
      Health: '#E91E63', // Pink - health/care
      Library: '#795548', // Brown - books/knowledge
      General: '#607D8B', // Blue Grey - default
    };

    return colors[eventType] || colors['General'];
  };

  // Calendar type colors (legacy - keeping for backward compatibility)
  const getCalendarTypeColor = (calendarType) => {
    const colors = {
      // Google Workspace types
      main: '#4285F4',
      academic: '#34A853',
      sports: '#EA4335',
      events: '#FBBC04',
      holidays: '#9C27B0',
      staff: '#FF5722',
      google_workspace: '#4285F4',

      // Backend API types
      google_calendar: '#4285F4',
      academic_calendar: '#34A853',
      local_global: '#2196F3',
      school_events: '#2196F3',

      // Legacy types
      timetable: '#4CAF50',
      homework: '#FF9800',
      school_event: '#2196F3',
      notification: '#9C27B0',
    };
    return colors[calendarType] || '#757575';
  };

  const handleDatePress = (date) => {
    setSelectedDate(date);
    onDatePress?.(date);
  };

  const handleEventPress = (event) => {
    onEventPress?.(event);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 10
    },
    monthText: {
      fontSize: fontSizes.title,
      fontWeight: '600',
      color: theme.colors.text,
    },
    navButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.primary + '10',
    },
    todayButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: theme.colors.primary,
    },
    todayButtonText: {
      color: '#fff',
      fontSize: fontSizes.caption,
      fontWeight: '600',
    },
    weekDays: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      paddingVertical: 8,
      borderTopRightRadius: 10,
      borderTopLeftRadius: 10,
    },
    weekDay: {
      flex: 1,
      alignItems: 'center',
    },
    weekDayText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    calendarGrid: {
      backgroundColor: theme.colors.background,
      marginBottom: 0,
      paddingBottom: 0,
      
    },
    week: {
      flexDirection: 'row',
    },
    day: {
      flex: 1,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 0.5,
      borderRightWidth: 0.5,
      borderColor: theme.colors.border,
      position: 'relative',
    },
    daySelected: {
      backgroundColor: theme.colors.primary + '20',
    },
    dayToday: {
      backgroundColor: theme.colors.primary + '10',
    },
    dayText: {
      fontSize: fontSizes.body,
      color: theme.colors.text,
    },
    dayTextOtherMonth: {
      color: theme.colors.textSecondary,
      opacity: 0.5,
    },
    dayTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    dayTextToday: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    eventDots: {
      flexDirection: 'row',
      position: 'absolute',
      bottom: 4,
      gap: 2,
    },
    eventDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
    },
    eventDotMultiDay: {
      width: 6,
      height: 4,
      borderRadius: 1,
    },
    
    eventsSection: {
      flex: 1,
      backgroundColor: theme.colors.background,
      marginTop: 0,
      paddingTop: 0,
      
    },
    eventsSectionHeader: {
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      
      marginTop: 0,
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
    },
    selectedDateText: {
      fontSize: fontSizes.subtitle,
      fontWeight: '600',
      color: theme.colors.text,
    },
    eventsCount: {
      fontSize: fontSizes.caption,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    eventsList: {
      flex: 1,
      
    },
    eventItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    eventColorDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    eventContent: {
      flex: 1,
    },
    eventTitle: {
      fontSize: fontSizes.body,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    eventTime: {
      fontSize: fontSizes.caption,
      color: theme.colors.textSecondary,
    },
    eventType: {
      fontSize: fontSizes.caption,
      color: theme.colors.textSecondary,
      marginTop: 2,
      textTransform: 'capitalize',
    },
    multiDayIndicator: {
      fontSize: fontSizes.caption,
      color: theme.colors.primary,
      fontWeight: '500',
      fontStyle: 'italic',
    },
    eventDateRange: {
      fontSize: fontSizes.caption,
      color: theme.colors.textSecondary,
      marginTop: 2,
      fontWeight: '500',
    },
    noEventsText: {
      textAlign: 'center',
      color: theme.colors.textSecondary,
      fontSize: fontSizes.body,
      marginTop: 32,
      fontStyle: 'italic',
    },
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={goToPreviousMonth}>
          <FontAwesomeIcon
            icon={faChevronLeft}
            size={16}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        <Text style={styles.monthText}>
          {monthData.monthName} {monthData.year}
        </Text>

        <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
          <FontAwesomeIcon
            icon={faChevronRight}
            size={16}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Today Button */}
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* Week Days Header */}
      <View style={styles.weekDays}>
        {weekDays.map((day) => (
          <View key={day} style={styles.weekDay}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {Array.from({ length: 6 }, (_, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {monthData.days
              .slice(weekIndex * 7, (weekIndex + 1) * 7)
              .map((date, dayIndex) => {
                const dayEvents = eventsByDate[date.toDateString()] || [];
                const uniqueEventTypes = [
                  ...new Set(dayEvents.map((e) => getEventType(e))),
                ];

                return (
                  <TouchableOpacity
                    key={dayIndex}
                    style={[
                      styles.day,
                      isSelected(date) && styles.daySelected,
                      isToday(date) && styles.dayToday,
                    ]}
                    onPress={() => handleDatePress(date)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !isCurrentMonth(date) && styles.dayTextOtherMonth,
                        isSelected(date) && styles.dayTextSelected,
                        isToday(date) && styles.dayTextToday,
                      ]}
                    >
                      {date.getDate()}
                    </Text>

                    {/* Event dots */}
                    {uniqueEventTypes.length > 0 && (
                      <View style={styles.eventDots}>
                        {uniqueEventTypes
                          .slice(0, 3)
                          .map((eventType, index) => {
                            // Check if any event of this type is multi-day for this date
                            const hasMultiDayEvent = dayEvents.some(
                              (e) =>
                                getEventType(e) === eventType && e.isMultiDay
                            );

                            return (
                              <View
                                key={index}
                                style={[
                                  hasMultiDayEvent
                                    ? styles.eventDotMultiDay
                                    : styles.eventDot,
                                  {
                                    backgroundColor:
                                      getEventTypeColor(eventType),
                                  },
                                ]}
                              />
                            );
                          })}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
          </View>
        ))}
      </View>

      {/* Events for Selected Date */}
      <View style={styles.eventsSection}>
        <View style={styles.eventsSectionHeader}>
          <Text style={styles.selectedDateText}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.eventsCount}>
            {selectedDateEvents.length} event
            {selectedDateEvents.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <ScrollView style={styles.eventsList}>
          {selectedDateEvents.length > 0 ? (
            selectedDateEvents.map((event, index) => (
              <TouchableOpacity
                key={index}
                style={styles.eventItem}
                onPress={() => handleEventPress(event)}
              >
                <View
                  style={[
                    styles.eventColorDot,
                    {
                      backgroundColor: getEventTypeColor(getEventType(event)),
                    },
                  ]}
                />
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>
                    {event.title}
                    {event.isMultiDay && (
                      <Text style={styles.multiDayIndicator}>
                        {event.isFirstDay
                          ? ' (starts)'
                          : event.isLastDay
                          ? ' (ends)'
                          : ' (continues)'}
                      </Text>
                    )}
                  </Text>
                  <Text style={styles.eventTime}>
                    {event.isMultiDay ? (
                      // For multi-day events, show different time info based on which day we're viewing
                      event.isFirstDay ? (
                        `Starts: ${new Date(event.startTime).toLocaleTimeString(
                          'en-US',
                          {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          }
                        )}`
                      ) : event.isLastDay ? (
                        `Ends: ${new Date(event.endTime).toLocaleTimeString(
                          'en-US',
                          {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          }
                        )}`
                      ) : (
                        'All day (continues)'
                      )
                    ) : (
                      // Single day event - show normal time range
                      <>
                        {new Date(event.startTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                        {event.endTime &&
                          ` - ${new Date(event.endTime).toLocaleTimeString(
                            'en-US',
                            {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            }
                          )}`}
                      </>
                    )}
                  </Text>
                  <Text style={styles.eventType}>{getEventType(event)}</Text>
                  {event.isMultiDay && (
                    <Text style={styles.eventDateRange}>
                      {new Date(event.startTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      -{' '}
                      {new Date(event.endTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noEventsText}>No events for this date</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default CalendarView;
