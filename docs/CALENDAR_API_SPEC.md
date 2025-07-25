# Multi-Tenant Calendar API Specification

## Overview
This document outlines the backend API endpoints needed to support the multi-tenant calendar system with Google Calendar integration.

## New API Endpoints

### 1. School Detection Endpoint

**POST** `/mobile-api/detect-school`

Detects which school a user belongs to based on their credentials.

**Request Body:**
```json
{
  "username": "teacher@bfi.edu.mm",
  "userType": "teacher"
}
```

**Response:**
```json
{
  "success": true,
  "schoolId": "bfi_edu_mm",
  "hasGoogleWorkspace": true,
  "message": "School detected successfully"
}
```

### 2. School Configuration Endpoint

**GET** `/mobile-api/school-config/{schoolId}`

Returns configuration for a specific school.

**Response:**
```json
{
  "schoolId": "bfi_edu_mm",
  "name": "BFI International School",
  "domain": "bfi.edu.mm",
  "hasGoogleWorkspace": true,
  "googleConfig": {
    "clientId": "your-client-id.apps.googleusercontent.com",
    "calendarIds": {
      "main": "main@bfi.edu.mm",
      "academic": "academic@bfi.edu.mm",
      "sports": "sports@bfi.edu.mm",
      "events": "events@bfi.edu.mm"
    }
  },
  "branding": {
    "name": "BFI International School",
    "logoUrl": "https://sis.bfi.edu.mm/assets/logo.png",
    "colors": {
      "primary": "#007AFF",
      "secondary": "#5856D6",
      "accent": "#FF9500"
    }
  },
  "features": {
    "googleCalendar": true,
    "nativeCalendar": false,
    "customEvents": true,
    "messaging": true,
    "homework": true,
    "attendance": true,
    "bps": true,
    "health": true
  }
}
```

### 3. School Events Endpoint

**GET** `/mobile-api/school-events`

Returns school-specific events (holidays, announcements, etc.).

**Query Parameters:**
- `schoolId`: School identifier
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "evt_001",
      "title": "School Holiday - Independence Day",
      "description": "National holiday, school closed",
      "start_date": "2024-01-04",
      "end_date": "2024-01-04",
      "is_all_day": true,
      "type": "holiday",
      "location": "",
      "created_by": "admin",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "evt_002",
      "title": "Parent-Teacher Conference",
      "description": "Quarterly parent-teacher meetings",
      "start_date": "2024-01-15T09:00:00Z",
      "end_date": "2024-01-15T17:00:00Z",
      "is_all_day": false,
      "type": "meeting",
      "location": "School Auditorium",
      "created_by": "admin",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Database Schema

### Schools Table
```sql
CREATE TABLE schools (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  has_google_workspace BOOLEAN DEFAULT FALSE,
  google_client_id VARCHAR(255),
  branding_config JSON,
  features_config JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### School Calendars Table
```sql
CREATE TABLE school_calendars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id VARCHAR(50),
  calendar_type VARCHAR(50), -- 'main', 'academic', 'sports', 'events'
  google_calendar_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id)
);
```

### School Events Table
```sql
CREATE TABLE school_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATETIME NOT NULL,
  end_date DATETIME,
  is_all_day BOOLEAN DEFAULT FALSE,
  event_type VARCHAR(50), -- 'holiday', 'meeting', 'announcement', 'sports'
  location VARCHAR(255),
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id)
);
```

## Sample Data

### Schools
```sql
INSERT INTO schools (id, name, domain, has_google_workspace, google_client_id, branding_config, features_config) VALUES
('bfi_edu_mm', 'BFI International School', 'bfi.edu.mm', TRUE, 'your-client-id.apps.googleusercontent.com', 
 '{"name": "BFI International School", "logoUrl": "https://sis.bfi.edu.mm/assets/logo.png", "colors": {"primary": "#007AFF", "secondary": "#5856D6", "accent": "#FF9500"}}',
 '{"googleCalendar": true, "nativeCalendar": false, "customEvents": true, "messaging": true, "homework": true, "attendance": true, "bps": true, "health": true}'),
('demo_school', 'Demo School', 'demo.edu', FALSE, NULL,
 '{"name": "Demo School", "logoUrl": "https://sis.bfi.edu.mm/assets/app_logo.png", "colors": {"primary": "#007AFF", "secondary": "#5856D6", "accent": "#FF9500"}}',
 '{"googleCalendar": false, "nativeCalendar": true, "customEvents": true, "messaging": true, "homework": true, "attendance": true, "bps": true, "health": true}');
```

### School Calendars
```sql
INSERT INTO school_calendars (school_id, calendar_type, google_calendar_id) VALUES
('bfi_edu_mm', 'main', 'main@bfi.edu.mm'),
('bfi_edu_mm', 'academic', 'academic@bfi.edu.mm'),
('bfi_edu_mm', 'sports', 'sports@bfi.edu.mm'),
('bfi_edu_mm', 'events', 'events@bfi.edu.mm');
```

### School Events
```sql
INSERT INTO school_events (school_id, title, description, start_date, end_date, is_all_day, event_type, location, created_by) VALUES
('bfi_edu_mm', 'Independence Day Holiday', 'National holiday, school closed', '2024-01-04', '2024-01-04', TRUE, 'holiday', '', 'admin'),
('bfi_edu_mm', 'Parent-Teacher Conference', 'Quarterly parent-teacher meetings', '2024-01-15 09:00:00', '2024-01-15 17:00:00', FALSE, 'meeting', 'School Auditorium', 'admin'),
('demo_school', 'Demo Event', 'Sample event for demo school', '2024-01-10', '2024-01-10', TRUE, 'announcement', '', 'admin');
```

## Implementation Notes

### School Detection Logic
1. **Email Domain**: If username contains `@`, extract domain and map to school
2. **Username Pattern**: Check for school-specific username patterns
3. **API Lookup**: Query database for user's school association
4. **Fallback**: Default to primary school (BFI) if detection fails

### Google Calendar Integration
1. **Domain Restriction**: Configure Google Sign-In with `hostedDomain` parameter
2. **Service Account**: Use service account for server-side calendar operations
3. **OAuth Scopes**: Request minimal required scopes (`calendar.readonly`, `calendar.events.readonly`)
4. **Error Handling**: Graceful fallback to native calendar if Google Calendar fails

### Caching Strategy
1. **School Config**: Cache for 24 hours
2. **Calendar Events**: Cache for 1 hour
3. **Offline Support**: Store cached data for offline access
4. **Cache Invalidation**: Clear cache on school switch or manual refresh

### Security Considerations
1. **Domain Validation**: Verify user belongs to claimed school domain
2. **API Rate Limiting**: Implement rate limiting for calendar API calls
3. **Data Isolation**: Ensure school data is properly isolated
4. **Permission Checks**: Validate user permissions for calendar access

## Testing Endpoints

### Test School Detection
```bash
curl -X POST http://localhost:3000/mobile-api/detect-school \
  -H "Content-Type: application/json" \
  -d '{"username": "teacher@bfi.edu.mm", "userType": "teacher"}'
```

### Test School Configuration
```bash
curl http://localhost:3000/mobile-api/school-config/bfi_edu_mm
```

### Test School Events
```bash
curl "http://localhost:3000/mobile-api/school-events?schoolId=bfi_edu_mm&startDate=2024-01-01&endDate=2024-01-31"
```
