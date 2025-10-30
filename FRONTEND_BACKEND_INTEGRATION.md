# Frontend-Backend Integration Guide

This document explains how the frontend connects to the backend API in the Zenith Study application.

## API Service Layer

All API calls are handled through a centralized service layer located at `src/lib/api.ts`. This file contains:

1. **API Base Configuration** - Sets the base URL for all API calls
2. **Authentication Helper** - Manages JWT tokens from localStorage
3. **Request Helper** - Standardizes API requests with proper headers and error handling
4. **API Modules** - Organized by feature:
   - `authAPI` - Authentication endpoints
   - `userAPI` - User profile endpoints
   - `notesAPI` - Notes management endpoints
   - `sessionsAPI` - Study sessions endpoints
   - `activitiesAPI` - Activity tracking endpoints

## Authentication Flow

1. **Login/Signup**:

   - User credentials are sent to `/api/auth/login` or `/api/auth/register`
   - Backend returns a JWT token
   - Token is stored in localStorage as `zenith_user`

2. **Protected Requests**:
   - All subsequent API calls include the JWT token in the Authorization header
   - Token is automatically added by the `apiRequest` helper function

## Data Flow Examples

### Notes Management

- **Fetch all notes**: `notesAPI.getAll()` → `GET /api/notes`
- **Create note**: `notesAPI.create(data)` → `POST /api/notes`
- **Update note**: `notesAPI.update(id, data)` → `PUT /api/notes/:id`
- **Delete note**: `notesAPI.delete(id)` → `DELETE /api/notes/:id`

### Activity Tracking

- **Add activity**: `activitiesAPI.add()` → `POST /api/activities`
- **Get streaks**: `activitiesAPI.getStreaks()` → `GET /api/activities/streaks`

## Context Integration

### AuthContext

- Replaced mock authentication with real API calls
- Stores user data and JWT token in localStorage
- Provides `login`, `signup`, and `logout` functions

### ActivityContext

- Fetches real activity data from backend on mount
- Uses backend API for adding activities
- Calculates streaks using backend data

## Component Updates

### Notes.tsx

- Replaced localStorage with `notesAPI` calls
- Added loading states
- Improved error handling with toast notifications

### NoteEditor.tsx

- Replaced localStorage with `notesAPI` calls
- Added loading states
- Improved error handling

### Sessions.tsx

- Replaced static data with `sessionsAPI` calls
- Added loading states
- Implemented join session functionality

## Error Handling

All API calls include proper error handling:

- Network errors are caught and displayed to the user
- HTTP error responses are parsed and shown as toast notifications
- Fallback to localStorage is implemented where appropriate

## Testing the Connection

To verify the frontend-backend connection:

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `npm run dev`
3. Open the application in your browser
4. Try logging in or registering a new user
5. Navigate to different sections to see data loading

## Environment Configuration

The API base URL is configured in `src/lib/api.ts`:

```typescript
const API_BASE_URL = "http://localhost:5000/api";
```

For production deployments, this should be updated to the production API URL.

## Future Improvements

1. **Caching**: Implement React Query for better data caching and synchronization
2. **Error Boundaries**: Add more comprehensive error boundaries
3. **Loading States**: Improve loading UI across all components
4. **Offline Support**: Implement offline functionality with service workers
