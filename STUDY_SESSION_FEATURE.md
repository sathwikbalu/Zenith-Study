# Study Session Feature - Video, Voice & Chat

This document explains the implementation of the collaborative study session feature with video/voice calls and real-time chat.

## Features Implemented

### 1. Video & Voice Calls (WebRTC)
- **Peer-to-peer connections** using WebRTC
- **Multiple participants** in mesh network topology
- **Camera and microphone controls** (toggle on/off)
- **Auto-connect** when joining a session
- **Visual indicators** for muted audio/video

### 2. Real-Time Chat (Socket.IO)
- **Instant messaging** between session participants
- **Message persistence** in Supabase database
- **Chat history** loaded when joining
- **User identification** in messages
- **Auto-scroll** to latest messages

### 3. Session Management
- **Join/Leave functionality**
- **Participant tracking**
- **Connection state management**
- **Graceful disconnection handling**

## Architecture

### Backend (Node.js + Express + Socket.IO)
- `server.js` - Socket.IO server with WebRTC signaling
- `controllers/chatController.js` - Chat message API
- `routes/chatRoutes.js` - Chat API routes

### Frontend (React + TypeScript)
- `contexts/SocketContext.tsx` - Socket.IO connection provider
- `hooks/useWebRTC.ts` - WebRTC peer connection management
- `pages/dashboard/SessionRoom.tsx` - Main session room UI
- `pages/dashboard/Sessions.tsx` - Session list with join button

### Database (Supabase)
- `chat_messages` table for message persistence
- Row Level Security (RLS) policies for data access control

## How to Use

### Starting the Servers

1. **Start Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```
   Server runs on http://localhost:5000

2. **Start Frontend Server:**
   ```bash
   npm run dev
   ```
   App runs on http://localhost:8080

### Joining a Session

1. **Login** to the application
2. Navigate to **Dashboard > Study Sessions**
3. Click **"Join Session"** button on any active session
4. **Allow camera/microphone access** when prompted
5. You'll enter the session room with:
   - Your video feed
   - Other participants' video feeds
   - Real-time chat panel
   - Audio/video controls

### Session Room Controls

- **Microphone Toggle** - Mute/unmute your audio
- **Camera Toggle** - Turn video on/off
- **Leave Session** - Exit the session
- **Chat Toggle** - Show/hide chat panel
- **Participants** - View participant list

### Chat Features

- Type message in input field
- Press **Enter** or click **Send** button
- Messages are saved to database
- Chat history loads automatically
- Your messages appear on the right (blue)
- Others' messages appear on the left (gray)

## Technical Details

### WebRTC Configuration

- Uses Google STUN servers for NAT traversal
- Mesh network topology (each peer connects to all others)
- ICE candidate exchange via Socket.IO
- Offer/Answer signaling through Socket.IO

### Socket.IO Events

**Client → Server:**
- `join-session` - Join a session room
- `leave-session` - Leave a session room
- `chat-message` - Send a chat message
- `webrtc-offer` - Send WebRTC offer
- `webrtc-answer` - Send WebRTC answer
- `webrtc-ice-candidate` - Send ICE candidate
- `toggle-audio` - Notify audio toggle
- `toggle-video` - Notify video toggle

**Server → Client:**
- `user-joined` - New user joined
- `user-left` - User left session
- `existing-participants` - List of current participants
- `chat-message` - New chat message
- `webrtc-offer` - Received WebRTC offer
- `webrtc-answer` - Received WebRTC answer
- `webrtc-ice-candidate` - Received ICE candidate
- `user-audio-toggle` - User toggled audio
- `user-video-toggle` - User toggled video

### Database Schema

```sql
chat_messages:
  - id (uuid)
  - session_id (text)
  - user_id (text)
  - user_name (text)
  - message (text)
  - message_type (text)
  - created_at (timestamptz)
  - updated_at (timestamptz)
```

### RLS Policies

- Authenticated users can read all messages
- Users can only create messages with their own user_id
- Users can update/delete their own messages

## Scalability Considerations

### Current Implementation
- **Mesh Network** - Each peer connects to all others
- **Best for:** 2-6 participants
- **Limitation:** Bandwidth grows with O(n²)

### Future Improvements

For larger sessions (10+ participants):

1. **Implement SFU (Selective Forwarding Unit)**
   - Use mediasoup or Janus
   - Centralized media routing
   - Better bandwidth efficiency

2. **Add TURN Server**
   - For users behind strict NATs
   - Relay traffic when direct connection fails

3. **Screen Sharing**
   - Add screen capture option
   - Useful for presentations

4. **Recording**
   - Record sessions for later review
   - Store in cloud storage

## Troubleshooting

### Camera/Microphone Not Working
- Check browser permissions
- Ensure HTTPS (or localhost)
- Try different browser

### No Video From Other Participants
- Check firewall settings
- Verify STUN server accessibility
- Check browser console for WebRTC errors

### Chat Messages Not Persisting
- Check Supabase connection
- Verify environment variables
- Check RLS policies

### Connection Issues
- Ensure backend server is running
- Check Socket.IO connection in console
- Verify CORS settings

## Environment Variables

Add to `backend/.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
FRONTEND_URL=http://localhost:8080
```

## Security Notes

- WebRTC connections are **peer-to-peer** (end-to-end encrypted)
- Chat messages stored in Supabase with **RLS protection**
- Socket.IO uses **same-origin policy**
- Always use **HTTPS in production**

## Performance Tips

- Limit video resolution for better performance
- Use audio-only mode for bandwidth-constrained networks
- Close unused tabs to free up resources
- Recommend Chrome/Firefox for best WebRTC support
