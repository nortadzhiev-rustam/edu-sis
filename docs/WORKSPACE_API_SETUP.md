# Workspace API Backend Setup Guide

## 🚀 Quick Setup

The workspace is currently running in **Demo Mode** with mock data. To connect to the real Google Drive API:

### 1. Set Mock Data Flag to False

In `src/services/workspaceService.js`, change:

```javascript
// Change this line:
const USE_MOCK_DATA = true; // Set to false when backend API is ready

// To this:
const USE_MOCK_DATA = false; // Set to false when backend API is ready
```

### 2. Implement Backend Endpoints

Your backend needs to implement these endpoints:

```
GET  /mobile-api/workspace/structure
GET  /mobile-api/workspace/folder-contents
POST /mobile-api/workspace/upload-file
POST /mobile-api/workspace/create-folder
GET  /mobile-api/workspace/search
GET  /mobile-api/workspace/recent-files
GET  /mobile-api/workspace/statistics
POST /mobile-api/workspace/delete-item
```

### 3. API Response Formats

Each endpoint should return responses matching the format documented in the main implementation guide. See `docs/WORKSPACE_IMPLEMENTATION.md` for detailed response schemas.

### 4. Authentication

All endpoints expect an `authCode` parameter for user authentication, following the same pattern as your existing mobile API endpoints.

### 5. Error Handling

The mobile app will automatically fall back to mock data if:
- Endpoints return 404 (not implemented)
- Network errors occur
- Invalid responses are received

### 6. Testing

Once your backend is ready:
1. Set `USE_MOCK_DATA = false`
2. Test each endpoint individually
3. Verify role-based permissions work correctly
4. Test file upload functionality

## 🔧 Current Status

✅ **Mobile App**: Fully implemented and working with mock data  
⏳ **Backend API**: Needs implementation  
📱 **User Experience**: Seamless with "Demo Mode" indicator  

## 📞 Support

The mobile implementation is complete and ready. Contact the mobile team when your backend endpoints are ready for integration testing.
