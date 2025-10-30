# Study Session Setup Guide

Quick setup guide to get the video/voice call and chat features running.

## Prerequisites

- Node.js (v14+)
- MongoDB running locally or MongoDB Atlas account
- Supabase project (database already configured)

## Installation Steps

### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
```

### 2. Configure Environment Variables

**Backend** (`backend/.env`):
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zenithstudy
JWT_SECRET=your_jwt_secret_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
FRONTEND_URL=http://localhost:8080
```

### 3. Database Setup

The Supabase migration for chat messages has already been applied. The `chat_messages` table includes:
- Message storage
- User identification
- Timestamps
- Row Level Security policies

### 4. Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 5. Test the Feature

1. Open http://localhost:8080
2. Login or create an account
3. Navigate to "Study Sessions"
4. Click "Join Session" on any active session
5. Allow camera/microphone access
6. You should see:
   - Your video feed
   - Chat panel on the right
   - Audio/video controls at the bottom

### 6. Test with Multiple Users

Open multiple browser windows (or use incognito mode) to simulate multiple users joining the same session.

## Key Files Added/Modified

### Backend
- `server.js` - Added Socket.IO server
- `controllers/chatController.js` - Chat API
- `routes/chatRoutes.js` - Chat routes
- `package.json` - Added socket.io, @supabase/supabase-js

### Frontend
- `src/contexts/SocketContext.tsx` - Socket connection
- `src/hooks/useWebRTC.ts` - WebRTC management
- `src/pages/dashboard/SessionRoom.tsx` - Session room UI
- `src/lib/api.ts` - Added chat API functions
- `src/App.tsx` - Added SocketProvider and session route
- `package.json` - Added socket.io-client

### Database
- Supabase migration: `create_chat_messages_table`

## Troubleshooting

**Socket.IO Connection Issues:**
- Check that backend is running on port 5000
- Verify CORS settings in server.js

**Camera/Microphone Access Denied:**
- Check browser permissions
- Use HTTPS or localhost (WebRTC requirement)

**Chat Messages Not Saving:**
- Verify Supabase credentials in .env
- Check browser console for errors
- Verify authentication token is valid

**Build Errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run build`

## Next Steps

1. **Test with Real Users:** Have multiple people join the same session
2. **Monitor Performance:** Check browser console and network tab
3. **Customize UI:** Adjust colors, layout, and controls
4. **Add Features:** Screen sharing, recording, reactions, etc.

## Support

For issues or questions:
1. Check the STUDY_SESSION_FEATURE.md documentation
2. Review browser console for errors
3. Check Socket.IO connection status
4. Verify WebRTC peer connections in chrome://webrtc-internals
