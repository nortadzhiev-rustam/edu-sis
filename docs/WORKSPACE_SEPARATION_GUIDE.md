# Workspace Separation Guide

## Overview

The workspace functionality has been separated into role-specific screens and services to provide appropriate access levels and functionality for different user types.

## Architecture

### 1. Screen Structure

#### TeacherWorkspaceScreen (`src/screens/TeacherWorkspaceScreen.js`)
- **Purpose**: Full workspace functionality for teachers and staff
- **Features**: 
  - View all folders and files
  - Upload files
  - Create folders
  - Delete items (with ownership restrictions)
  - Search functionality
  - Workspace statistics
- **Access Level**: Full permissions based on role

#### StudentWorkspaceScreen (`src/screens/StudentWorkspaceScreen.js`)
- **Purpose**: Read-only workspace access for students
- **Features**:
  - View student-accessible folders only
  - Download/view files
  - Search within accessible content
  - No upload, create, or delete capabilities
- **Access Level**: Read-only, filtered content

#### WorkspaceScreen (`src/screens/WorkspaceScreen.js`)
- **Purpose**: Generic workspace (fallback)
- **Usage**: Maintained for backward compatibility

### 2. Service Layer Separation

#### TeacherWorkspaceService (`src/services/teacherWorkspaceService.js`)
- Full API access with teacher permissions
- All CRUD operations enabled
- Enhanced logging and audit trails
- Functions:
  - `getTeacherWorkspaceStructure()`
  - `getTeacherFolderContents()`
  - `uploadTeacherWorkspaceFile()`
  - `createTeacherWorkspaceFolder()`
  - `deleteTeacherWorkspaceItem()`
  - `searchTeacherWorkspaceFiles()`
  - `getTeacherWorkspaceStatistics()`

#### StudentWorkspaceService (`src/services/studentWorkspaceService.js`)
- Limited API access with student permissions
- Read-only operations only
- Content filtering for student-appropriate materials
- Functions:
  - `getStudentWorkspaceStructure()`
  - `getStudentFolderContents()`
  - `searchStudentWorkspaceFiles()`
  - `getStudentRecentWorkspaceFiles()`
  - `canStudentAccessFolder()`
  - `canStudentAccessFile()`

### 3. Navigation Utilities

#### WorkspaceNavigation (`src/utils/workspaceNavigation.js`)
- **Purpose**: Role-based navigation routing
- **Key Functions**:
  - `navigateToWorkspace(navigation, options)` - Auto-routes to appropriate screen
  - `getWorkspaceScreenForUserType(userType)` - Returns correct screen name
  - `hasTeacherWorkspaceAccess(userType)` - Permission checking
  - `hasStudentWorkspaceAccess(userType)` - Permission checking
  - `getWorkspacePermissions(userType)` - Returns permission object

## User Role Mapping

### Teacher-Level Access
- **Roles**: teacher, staff, head_of_section, head_of_school, admin
- **Screen**: TeacherWorkspaceScreen
- **Service**: TeacherWorkspaceService
- **Permissions**: Full CRUD access

### Student-Level Access
- **Roles**: student
- **Screen**: StudentWorkspaceScreen
- **Service**: StudentWorkspaceService
- **Permissions**: Read-only access to filtered content

## Content Filtering

### Student-Accessible Folders
Students can only access folders with these types:
- `student_materials` - Educational materials for students
- `shared_projects` - Collaborative project workspace

### Teacher-Accessible Folders
Teachers can access all folder types:
- `administrative` - Administrative documents
- `staff_resources` - Staff-only resources
- `curriculum` - Curriculum documents
- `assessments` - Assessment materials
- `student_materials` - Student materials
- `shared_projects` - Shared projects

## API Integration

### Backend Expectations
The separated services send `user_type` parameter to backend:
```javascript
// Teacher requests
{
  auth_code: "...",
  user_type: "teacher",
  // ... other parameters
}

// Student requests
{
  auth_code: "...",
  user_type: "student",
  // ... other parameters
}
```

### Response Filtering
- **Teacher responses**: Full data with all permissions
- **Student responses**: Filtered data with limited permissions

## Navigation Integration

### From TeacherScreen
```javascript
import { navigateToWorkspace } from '../utils/workspaceNavigation';

// Automatically routes to TeacherWorkspaceScreen
onPress: () => {
  navigateToWorkspace(navigation);
}
```

### From ParentScreen
```javascript
import { navigateToWorkspace } from '../utils/workspaceNavigation';

// Automatically routes to StudentWorkspaceScreen
case 'materials':
  if (selectedStudent) {
    navigateToWorkspace(navigation, {
      studentData: selectedStudent,
    });
  }
  break;
```

## Security Features

### Permission Enforcement
- **Client-side**: UI elements hidden based on permissions
- **Server-side**: API endpoints validate user permissions
- **Content filtering**: Students only see appropriate content

### Audit Logging
- All workspace actions are logged with user context
- Separate logging for teacher and student activities
- Enhanced security monitoring

## Benefits

### 1. **Role-Appropriate UX**
- Teachers see full functionality
- Students see simplified, read-only interface
- No confusing disabled buttons or features

### 2. **Enhanced Security**
- Clear separation of concerns
- Reduced attack surface for student accounts
- Better audit trails

### 3. **Performance Optimization**
- Student screens load faster (less data)
- Reduced API calls for unnecessary features
- Optimized for each user type's needs

### 4. **Maintainability**
- Clear code separation
- Easier to modify role-specific features
- Better testing isolation

## Usage Examples

### Navigating to Workspace
```javascript
// Automatic role-based navigation
import { navigateToWorkspace } from '../utils/workspaceNavigation';

// This will automatically route to the correct screen
await navigateToWorkspace(navigation, {
  // Optional parameters
  initialFolder: 'some-folder-id',
  searchQuery: 'homework',
});
```

### Checking Permissions
```javascript
import { 
  hasTeacherWorkspaceAccess, 
  getWorkspacePermissions 
} from '../utils/workspaceNavigation';

const userType = 'teacher';
const hasFullAccess = hasTeacherWorkspaceAccess(userType); // true
const permissions = getWorkspacePermissions(userType);
// Returns: { canRead: true, canUpload: true, canCreateFolders: true, ... }
```

### Service Usage
```javascript
// For teachers
import { 
  getTeacherWorkspaceStructure,
  uploadTeacherWorkspaceFile 
} from '../services/teacherWorkspaceService';

// For students
import { 
  getStudentWorkspaceStructure,
  canStudentAccessFolder 
} from '../services/studentWorkspaceService';
```

## Migration Notes

### Existing Code
- Original `WorkspaceScreen` remains for backward compatibility
- Existing navigation calls will continue to work
- Gradual migration to role-specific screens recommended

### New Implementations
- Use `navigateToWorkspace()` for automatic routing
- Import role-specific services for new features
- Follow the separation pattern for consistency

This separation provides a more secure, user-friendly, and maintainable workspace system that scales with different user roles and permissions.
