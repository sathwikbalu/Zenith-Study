# Zenith Study Backend API

This is the backend API for the Zenith Study application, built with Node.js, Express, and MongoDB.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)

### Installation

1. Clone the repository
2. Navigate to the backend directory: `cd backend`
3. Install dependencies: `npm install`
4. Create a `.env` file based on `.env.example`
5. Start the development server: `npm run dev`

### Environment Variables

Create a `.env` file in the backend root directory with the following variables:

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zenithstudy
JWT_SECRET=your_jwt_secret_here
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Notes

- `GET /api/notes` - Get all notes for the authenticated user
- `GET /api/notes/:id` - Get a specific note
- `POST /api/notes` - Create a new note
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note
- `PUT /api/notes/:id/star` - Toggle note star status

### Study Sessions

- `GET /api/sessions` - Get all study sessions
- `GET /api/sessions/:id` - Get a specific study session
- `POST /api/sessions` - Create a new study session (tutors only)
- `PUT /api/sessions/:id` - Update a study session (creator only)
- `DELETE /api/sessions/:id` - Delete a study session (creator only)
- `POST /api/sessions/:id/join` - Join a study session
- `POST /api/sessions/:id/leave` - Leave a study session

### Activities

- `GET /api/activities` - Get user activities
- `POST /api/activities` - Add a new activity
- `GET /api/activities/streaks` - Get user streaks

## Data Models

### User

- `name` (String) - User's full name
- `email` (String) - User's email (unique)
- `password` (String) - Hashed password
- `role` (String) - Either 'student' or 'tutor'
- `createdAt` (Date) - Registration date

### Note

- `title` (String) - Note title
- `subject` (String) - Note subject
- `content` (String) - Note content
- `starred` (Boolean) - Whether the note is starred
- `userId` (ObjectId) - Reference to the user who created the note
- `createdAt` (Date) - Creation date
- `updatedAt` (Date) - Last update date

### StudySession

- `title` (String) - Session title
- `subject` (String) - Session subject
- `description` (String) - Session description
- `startTime` (Date) - Session start time
- `endTime` (Date) - Session end time
- `createdBy` (ObjectId) - Reference to the user who created the session
- `participants` (Array of ObjectIds) - References to users participating in the session
- `status` (String) - Session status ('scheduled', 'active', 'completed', 'cancelled')
- `maxParticipants` (Number) - Maximum number of participants
- `createdAt` (Date) - Creation date
- `updatedAt` (Date) - Last update date

### Activity

- `userId` (ObjectId) - Reference to the user
- `date` (Date) - Activity date
- `count` (Number) - Activity count for the day
- `createdAt` (Date) - Creation date

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```
