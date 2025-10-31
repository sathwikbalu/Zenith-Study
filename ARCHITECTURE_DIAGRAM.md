# Study Session Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + TypeScript)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SessionRoom Component                        │  │
│  │  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐    │  │
│  │  │  LocalVideo  │  │RemoteVideo  │  │    Chat      │    │  │
│  │  │  Component   │  │ Component   │  │   Panel      │    │  │
│  │  └──────────────┘  └─────────────┘  └──────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         useWebRTC Hook                                    │  │
│  │  • Local stream management                               │  │
│  │  • Peer connection creation                              │  │
│  │  • ontrack event handling                                │  │
│  │  • Audio/video toggle                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         SocketContext                                     │  │
│  │  • Socket.IO connection                                  │  │
│  │  • Real-time event handling                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                    (WebRTC + Socket.IO)
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Socket.IO Server                                 │  │
│  │  • WebRTC signaling (offer/answer/ICE)                  │  │
│  │  • User session management                              │  │
│  │  • Real-time chat relay                                 │  │
│  │  • Participant tracking                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         REST API Endpoints                                │  │
│  │  POST   /api/chat                                        │  │
│  │  GET    /api/chat/session/:sessionId                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Controllers & Models                              │  │
│  │  • ChatMessage model (Mongoose)                          │  │
│  │  • Chat controller logic                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                          (MongoDB)
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (MongoDB)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  chat_messages Collection                                       │
│  {                                                              │
│    sessionId,     // Session reference                         │
│    userId,        // Message sender                            │
│    userName,      // Display name                              │
│    message,       // Message content                           │
│    messageType,   // text | emoji | system                     │
│    createdAt,     // Timestamp                                 │
│    updatedAt      // Update timestamp                          │
│  }                                                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Joins Session

```
Frontend                    Backend                         Database
    │                           │                               │
    ├──socket emit───────────>  │                               │
    │  join-session             │                               │
    │                           ├─ Add to room                  │
    │                           ├─ Track user                   │
    │                           │                               │
    │  <──socket emit───────────┤                               │
    │  existing-participants    │                               │
    │                           │                               │
    ├──socket broadcast────────>│                               │
    │  user-joined (to room)    │                               │
    │                           │
    ├─ Create peer connections for each existing participant
    │
    ├──socket emit───────────>  │
    │  webrtc-offer             │
    │                           ├──socket forward──> Other peer
    │                           │
    │  <───socket receive────────
    │  webrtc-answer
    │
    ├─ Exchange ICE candidates via socket events
    │
    ├─ Video/audio stream via WebRTC (P2P)
    │
    ├──socket emit───────────>  │
    │  chat-message             │
    │                           ├──socket broadcast────> All peers
    │                           │
    │                           ├─ POST /api/chat    │
    │                           │      └────────────>│ Save message
    │                           │                    └───────────>
    │                           │
    │  <────socket emit─────────┤
    │  chat-message (relay)
```

### 2. Video Stream Setup

```
Local User                  Peer Connection              Remote User
    │                              │                           │
    ├─ getUserMedia()              │                           │
    │  (camera/mic)                │                           │
    │                              │                           │
    ├─ Create RTCPeerConnection    │                           │
    │                              │                           │
    ├─ addTrack()                  │                           │
    │  (local stream tracks)        │                           │
    │                              │                           │
    ├─ createOffer()               │                           │
    │                              │                           │
    ├─ setLocalDescription()       │                           │
    │                              │                           │
    ├──────socket emit:offer──────>│                           │
    │  webrtc-offer                │                           │
    │                              ├────────────────────────>│
    │                              │ webrtc-offer            │
    │                              │ (relayed via signaling) │
    │                              │                   ├─ setRemoteDescription()
    │                              │                   ├─ createAnswer()
    │                              │                   ├─ setLocalDescription()
    │  <────────────────────socket─┤─ webrtc-answer <┤
    │  (relayed)                   │                  │
    │  ├─ setRemoteDescription()   │                  │
    │                              │                  │
    ├─ Exchange ICE candidates     │                  │
    │  (multiple socket events)    │                  │
    │                              ├─ candidates ────>│
    │                              │                  │
    │  <─────────────candidates────┤<─ candidates ────┤
    │                              │                  │
    ├─ Connection established      │                  │
    │                              ├─ ontrack event ──>
    │                              │                   │
    │                          Video/Audio Streaming
    │<────────────────────────────────────────────────>
    │  (direct P2P connection)
```

### 3. Chat Message Flow

```
Sender                  Socket.IO               Other Peers          Database
  │                          │                       │                  │
  ├─ Type message            │                       │                  │
  │                          │                       │                  │
  ├─ Click Send              │                       │                  │
  │                          │                       │                  │
  ├──socket emit:────────>   │                       │                  │
  │  chat-message            │                       │                  │
  │ {                        │                       │                  │
  │   sessionId,             │                       │                  │
  │   message,               │                       │                  │
  │   userId,                │                       │                  │
  │   userName               │────broadcast────────> │                  │
  │ }                        │  chat-message         ├─ Display message
  │                          │                       │                  │
  ├──POST /api/chat───────>  │                       │                  │
  │ Save message             │                       │                   │
  │                          │                       │                   │
  │                          │                   (Received via socket)    │
  │                          │                       │                   │
  │                          │                       │                  ├─ Save to chat_messages
  │                          │                       │                  │
  │  <─────────201 Created───┤                       │                  │
  │  { id, createdAt, ... }  │                       │                  │
  │                          │                       │                  │
  └─ Show in chat panel      │                       │                  │
```

## Component Hierarchy

```
App
├── SocketProvider
│   └── AuthProvider
│       └── ActivityProvider
│           └── BrowserRouter
│               ├── Routes
│               │   ├── Dashboard (Protected)
│               │   │   └── SessionRoom
│               │   │       ├── LocalVideo
│               │   │       ├── RemoteVideo (multiple)
│               │   │       ├── Chat Panel
│               │   │       └── Controls
│               │   │
│               │   └── Sessions (Protected)
│               │       └── Session List Cards
│               │           └── Join Button → SessionRoom
│               │
│               └── Login/Signup (Public)
```

## WebRTC Connection State Machine

```
                    ┌─────────────────────┐
                    │    Initial State    │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ↓              ↓              ↓
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │  Connecting  │ │  Connecting  │ │  Connecting  │
        │  (Offer Sent)│ │ (Answer Sent)│ │(Candidates)  │
        └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
               │                │                │
               └────────┬───────┴────────┬───────┘
                        │                │
                        ↓                ↓
                 ┌──────────────┐ ┌──────────────┐
                 │  Connected   │ │   Failed     │
                 │              │ │   (Retry)    │
                 └──────────────┘ └──────────────┘
                        │
                        ↓
              ┌──────────────────┐
              │ Video/Audio Flow │
              │   (ontrack)      │
              └──────────────────┘
```

## Socket.IO Event Diagram

```
User A                                    User B
  │                                         │
  ├─ join-session ──────────────────────>  │
  │                                         │
  │  <──── existing-participants ──────────┤
  │                                         │
  ├─ join-session ──────────────────────>  │
  │                                         │
  │  <──── user-joined ─────────────────────┤
  │                                         │
  ├─ webrtc-offer ─────────────────────>   │
  │   (via signaling server)                │
  │                                    ├─ Create answer
  │  <─ webrtc-answer ───────────────────┤
  │   (via signaling server)                │
  │                                         │
  ├─ webrtc-ice-candidate ─────────────>   │
  │                                   ├─ Add candidate
  │  <─ webrtc-ice-candidate ───────────┤
  │                                         │
  ├─ connection established ────────────>   │
  │   (P2P video/audio)                    │
  │  <────────────────────────────────────>│
  │
  ├─ chat-message ──────────────────────>  │
  │   (broadcast via socket)          ├─ Display
  │                                         │
  │  <─ chat-message ─────────────────────┤
  │   (broadcast via socket)          ├─ Display
  │
```

## File Organization

```
project/
├── src/
│   ├── components/
│   │   ├── LocalVideo.tsx              ← NEW: Local stream video
│   │   ├── RemoteVideo.tsx             ← NEW: Remote stream video
│   │   └── ...
│   │
│   ├── contexts/
│   │   ├── SocketContext.tsx           ← Socket.IO provider
│   │   └── ...
│   │
│   ├── hooks/
│   │   ├── useWebRTC.ts                ← UPDATED: WebRTC management
│   │   └── ...
│   │
│   ├── pages/dashboard/
│   │   ├── SessionRoom.tsx             ← UPDATED: Session UI
│   │   └── Sessions.tsx                ← Updated to link to SessionRoom
│   │
│   ├── lib/
│   │   └── api.ts                      ← Chat API methods
│   │
│   └── App.tsx                         ← UPDATED: Routes + SocketProvider
│
├── backend/
│   ├── models/
│   │   └── ChatMessage.js              ← MongoDB model
│   │
│   ├── controllers/
│   │   └── chatController.js           ← UPDATED: MongoDB support
│   │
│   ├── routes/
│   │   └── chatRoutes.js               ← Chat API routes
│   │
│   └── server.js                       ← UPDATED: Socket.IO server
│
└── docs/
    ├── VIDEO_STREAMING_FIX.md          ← Technical details
    ├── TESTING_VIDEO_FEATURE.md        ← Testing guide
    ├── FIXES_SUMMARY.md                ← This overview
    └── ARCHITECTURE_DIAGRAM.md         ← This file
```

## Technology Stack

```
Frontend:
  ├── React 18.3
  ├── TypeScript 5.8
  ├── Socket.IO Client 4.8
  └── WebRTC (Browser native)

Backend:
  ├── Node.js 14+
  ├── Express 5.1
  ├── Socket.IO 4.x
  ├── MongoDB (Mongoose 8.19)
  └── CORS middleware

Database:
  └── MongoDB (Local or Atlas)

Media:
  ├── getUserMedia API
  ├── RTCPeerConnection
  └── MediaStream API
```

## Security Considerations

```
Frontend Security:
├── Component-level access control
├── Authentication checks
└── Session token validation

Backend Security:
├── Socket.IO namespace isolation
├── User verification per message
├── Message validation
└── MongoDB schema validation

Network Security:
├── WebRTC is end-to-end encrypted
├── Socket.IO events over HTTPS
└── CORS restrictions enforced
```

This completes the architectural overview of the study session feature!
