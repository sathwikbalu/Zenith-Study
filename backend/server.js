const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Add better configuration for voice clarity
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const notesRoutes = require("./routes/notesRoutes");
const sessionsRoutes = require("./routes/sessionsRoutes");
const activityRoutes = require("./routes/activityRoutes");
const chatRoutes = require("./routes/chatRoutes");
const learningPathRoutes = require("./routes/learningPathRoutes");
const forumRoutes = require("./routes/forumRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");

// Import notification controller
const { createNotification } = require("./controllers/notificationController");
const User = require("./models/User");

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Zenith Study Backend API" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/learning-paths", learningPathRoutes);
app.use("/api/forums", forumRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/assessments", assessmentRoutes);

// Socket.IO connection handling
const sessionRooms = new Map();
const forumRooms = new Map(); // Track forum rooms
const userSocketMap = new Map();
const whiteboardStates = new Map(); // Store whiteboard state per session

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on(
    "join-session",
    ({ sessionId, userId, userName, isTutor = false }) => {
      console.log(`User ${userName} (${userId}) joining session ${sessionId}`);
      socket.join(sessionId);

      if (!sessionRooms.has(sessionId)) {
        sessionRooms.set(sessionId, new Set());
      }
      sessionRooms.get(sessionId).add(socket.id);
      userSocketMap.set(socket.id, { userId, userName, sessionId, isTutor });

      const participants = Array.from(sessionRooms.get(sessionId)).map((id) => {
        const user = userSocketMap.get(id);
        return {
          socketId: id,
          userId: user?.userId,
          userName: user?.userName,
          isTutor: user?.isTutor || false,
        };
      });

      console.log(
        `Session ${sessionId} participants:`,
        participants.map((p) => p.userName)
      );

      // Send to existing participants (excluding the one who just joined)
      socket.to(sessionId).emit("user-joined", {
        socketId: socket.id,
        userId,
        userName,
        isTutor,
      });

      // Send existing participants to the newly joined user
      socket.emit(
        "existing-participants",
        participants.filter((p) => p.socketId !== socket.id)
      );
    }
  );

  // Forum chat events
  socket.on("join-forum", ({ forumId, userId, userName }) => {
    console.log(`User ${userName} (${userId}) joining forum ${forumId}`);
    socket.join(forumId);

    if (!forumRooms.has(forumId)) {
      forumRooms.set(forumId, new Set());
    }
    forumRooms.get(forumId).add(socket.id);
    userSocketMap.set(socket.id, { userId, userName, forumId });

    // Notify other users in the forum that someone joined
    socket.to(forumId).emit("user-joined-forum", {
      userId,
      userName,
      forumId,
    });

    // Send current online users in the forum
    const onlineUsers = Array.from(forumRooms.get(forumId)).map((id) => {
      const user = userSocketMap.get(id);
      return {
        socketId: id,
        userId: user?.userId,
        userName: user?.userName,
      };
    });

    socket.emit("forum-users", onlineUsers);
  });

  socket.on("leave-forum", ({ forumId }) => {
    socket.leave(forumId);
    if (forumRooms.has(forumId)) {
      forumRooms.get(forumId).delete(socket.id);
    }
  });

  socket.on("forum-message", ({ forumId, message, userId, userName }) => {
    const messageData = {
      id: Date.now().toString(),
      forumId,
      userId,
      userName,
      text: message,
      timestamp: new Date().toISOString(),
    };

    // Broadcast message to all participants in the forum
    io.to(forumId).emit("forum-message", messageData);

    // Also log the message to console for debugging
    console.log(`Forum message in ${forumId}: ${userName}: ${message}`);
  });

  socket.on("webrtc-offer", ({ offer, to }) => {
    console.log(`Forwarding WebRTC offer from ${socket.id} to ${to}`);
    socket.to(to).emit("webrtc-offer", { offer, from: socket.id });
  });

  socket.on("webrtc-answer", ({ answer, to }) => {
    console.log(`Forwarding WebRTC answer from ${socket.id} to ${to}`);
    socket.to(to).emit("webrtc-answer", { answer, from: socket.id });
  });

  socket.on("webrtc-ice-candidate", ({ candidate, to }) => {
    socket.to(to).emit("webrtc-ice-candidate", { candidate, from: socket.id });
  });

  socket.on(
    "chat-message",
    ({ sessionId, message, userId, userName, messageType }) => {
      const messageData = {
        id: Date.now().toString(),
        sessionId,
        userId,
        userName,
        message,
        messageType: messageType || "text",
        timestamp: new Date().toISOString(),
      };

      // Broadcast message to all participants in the session
      io.to(sessionId).emit("chat-message", messageData);

      // Also log the message to console for debugging
      console.log(
        `Chat message in session ${sessionId}: ${userName}: ${message}`
      );
    }
  );

  socket.on("toggle-audio", ({ sessionId, userId, enabled }) => {
    socket
      .to(sessionId)
      .emit("user-audio-toggle", { userId, socketId: socket.id, enabled });
  });

  socket.on("toggle-video", ({ sessionId, userId, enabled }) => {
    socket
      .to(sessionId)
      .emit("user-video-toggle", { userId, socketId: socket.id, enabled });
  });

  // Whiteboard events
  socket.on("whiteboard-action", ({ sessionId, userId, action, data }) => {
    // Update stored whiteboard state
    if (action === "clear") {
      whiteboardStates.set(sessionId, { objects: [] });
    } else if (action === "add" && data) {
      const state = whiteboardStates.get(sessionId) || { objects: [] };
      state.objects.push(data);
      whiteboardStates.set(sessionId, state);
    } else if (action === "modify" && data && data.id) {
      // For modify actions, we don't store the full state, just broadcast
      // The frontend handles the modification locally
    }

    // Broadcast to other participants
    socket.to(sessionId).emit("whiteboard-action", { userId, action, data });
  });

  socket.on("whiteboard-request-sync", ({ sessionId }) => {
    const state = whiteboardStates.get(sessionId);
    if (state) {
      socket.emit("whiteboard-sync", state);
    }
  });

  socket.on("leave-session", ({ sessionId }) => {
    handleUserLeave(socket, sessionId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const userData = userSocketMap.get(socket.id);
    if (userData?.sessionId) {
      handleUserLeave(socket, userData.sessionId);
    }
    // Handle forum disconnection
    for (const [forumId, sockets] of forumRooms.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (userData) {
          socket.to(forumId).emit("user-left-forum", {
            userId: userData.userId,
            userName: userData.userName,
          });
        }
      }
    }
    userSocketMap.delete(socket.id);
  });

  function handleUserLeave(socket, sessionId) {
    const userData = userSocketMap.get(socket.id);
    if (sessionRooms.has(sessionId)) {
      sessionRooms.get(sessionId).delete(socket.id);
      if (sessionRooms.get(sessionId).size === 0) {
        sessionRooms.delete(sessionId);
        // Clean up whiteboard state when session is empty
        whiteboardStates.delete(sessionId);
      }
    }
    userSocketMap.delete(socket.id);
    socket.leave(sessionId);

    if (userData) {
      io.to(sessionId).emit("user-left", {
        socketId: socket.id,
        userId: userData.userId,
        userName: userData.userName,
      });
    }
  }
});

// Start server with proper error handling
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO server is ready`);
});

// Handle server startup errors
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Please close the application using this port or use a different port.`
    );
    process.exit(1);
  } else {
    console.error("Server error:", error);
    process.exit(1);
  }
});
