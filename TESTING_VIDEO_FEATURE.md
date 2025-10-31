# Testing the Fixed Video Streaming Feature

## Quick Start - Local Testing

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

Expected output:
```
Server is running on port 5000
Socket.IO server is ready
```

### 2. Start the Frontend Server

In a new terminal:
```bash
npm run dev
```

The app should open at http://localhost:8080

### 3. Create Test Accounts

1. Sign up with Account A: `student1@test.com`
2. Sign up with Account B: `student2@test.com`
3. Both should use password: `Test123!`

### 4. Open Two Browser Windows

**Window 1:**
- Login with Account A (student1@test.com)
- Navigate to Dashboard → Study Sessions
- Find a session with status "active"
- Click "Join Session"
- You should see your local video immediately

**Window 2:**
- Open in incognito/private mode
- Login with Account B (student2@test.com)
- Navigate to Dashboard → Study Sessions
- Join the SAME session
- You should now see:
  - Your own video (Window 2)
  - Account A's video appearing (Window 1 should also see this now)

## What You Should See

### Before Fix
- Only your own video appears
- Remote participant videos never load
- Avatars shown instead

### After Fix (Google Meet-like)
- Local video: Top-left or grid position
- All remote videos: Grid positions
- Videos appear in real-time
- Multiple participants visible simultaneously

## Testing Checklist

### Video Display
- [ ] Local video appears when joining
- [ ] Remote video appears after other user joins
- [ ] Both users see each other's video
- [ ] Video resolution is clear (720p ideal)
- [ ] No frozen frames
- [ ] Smooth video playback

### Multiple Participants
- [ ] Open 3rd browser window/tab
- [ ] Account C joins same session
- [ ] All three videos visible
- [ ] No video streaming issues
- [ ] Grid layout adapts (1x1 → 2x2 → 3x3)

### Audio
- [ ] Speak in Account A - hear in B and C
- [ ] Mute button works
- [ ] Mic indicator shows state
- [ ] No audio lag

### Chat
- [ ] Send message in Account A
- [ ] Message appears in B and C instantly
- [ ] Messages persist after refresh
- [ ] Sender name shown correctly
- [ ] Chat scrolls to latest message

### Media Controls
- [ ] Toggle video: Video turns on/off
- [ ] Toggle audio: Mic mutes/unmutes
- [ ] Leave session: All videos disappear
- [ ] Others see your toggles (indicators update)

### Connection Recovery
- [ ] Close browser window
- [ ] Others' videos continue working
- [ ] Disconnected user's video removed
- [ ] New user can join after disconnect

## Debug Mode - Console Logging

The video feature includes detailed console logging. To see it:

1. Open Developer Tools (F12)
2. Go to Console tab
3. Join a session

You'll see logs like:

```
📹 ontrack received from Alice: video, streams: 1
✅ Updated peer Alice with stream containing tracks: video, audio
🔗 Connection state for Alice: connected
❄️ ICE connection state for Alice: connected
📡 Signaling state for Alice: stable
```

### Reading the Logs

| Symbol | Meaning | What to Check |
|--------|---------|---------------|
| 📹 | Track received | Video/audio track from peer |
| ✅ | Peer updated | Stream assigned to peer |
| 🔗 | Connection state | P2P connection status |
| ❄️ | ICE state | Network connection status |
| 📡 | Signaling state | WebRTC negotiation status |
| ⚠️ | Connection failed | Network/firewall issue |

### Common Console Messages

**Successful Connection:**
```
Creating peer connection for Alice (socket123), shouldCreateOffer: true
Adding video track to peer connection for Alice
Adding audio track to peer connection for Alice
Creating offer for Alice...
Sent offer to Alice
Received ICE candidate from Alice
📹 ontrack received from Alice: video
✅ Updated peer Alice with stream
```

**Issues:**
```
❌ Error creating peer connection: TypeError: ...
⚠️ ICE connection failed for Alice
Failed to play video for Alice: NotAllowedError
```

## Network Inspection

### Check WebRTC Status

**Chrome:**
1. Open `chrome://webrtc-internals/`
2. Create connection
3. Expand "getUserMedia" section
4. Check:
   - Video codec
   - Audio codec
   - Bandwidth
   - Frame rate

### Monitor Socket.IO

**Check Connection:**
```javascript
// In browser console
window.socket  // Should show Socket.IO instance
window.socket.connected  // Should be true
```

**View Emitted Events:**
```javascript
// Add to SocketContext for debugging
socket.onAny((eventName, ...args) => {
  console.log('Socket event:', eventName, args);
});
```

## Performance Testing

### Check Resource Usage

1. Open Task Manager (Windows) or Activity Monitor (Mac)
2. Find Chrome/Browser process
3. Note memory and CPU before/after video

**Expected (3 participants):**
- Memory: 200-400 MB per browser
- CPU: 10-20% during active video
- GPU: 30-50% (if hardware acceleration)

### Bandwidth Usage

**With 3 participants:**
- Download: ~1.5 Mbps per person
- Upload: ~1.5 Mbps per person
- Total per browser: ~3 Mbps

Monitor with:
- Chrome DevTools → Network tab
- Check data transferred during session

## Testing Scenarios

### Scenario 1: Two Users Join Simultaneously
1. Open Window A and B side-by-side
2. Both click "Join Session" at same time
3. Both should see each other's video
4. Send chat message from A, confirm in B

### Scenario 2: Sequential Join
1. Window A joins session
2. Wait 10 seconds
3. Window B joins session
4. B should see A's video immediately
5. A should see B's video appear

### Scenario 3: Quality Test
1. Three users in session
2. Check video resolution (should be 720p)
3. Record 30 seconds, check playback
4. Monitor bandwidth in DevTools

### Scenario 4: Connection Switching
1. User on WiFi
2. Switch to mobile hotspot (during call)
3. Video should continue (may degrade)
4. Reconnect to WiFi
5. Video quality should improve

### Scenario 5: Long Session
1. Two users in session
2. Leave for 5 minutes
3. Rejoin same session
4. Should connect quickly
5. Chat history should load
6. Video should stream normally

## Known Limitations

### Current Mesh Network (2-6 users)
- ✅ Works great for study sessions
- ⚠️ Bandwidth grows with each user
- ⚠️ Not suitable for 10+ participants

### Mobile Devices
- ✅ Works on mobile browsers
- ⚠️ Battery drain with video
- ⚠️ May require lower quality settings

### Network Conditions
- ✅ Works on stable internet (10+ Mbps)
- ⚠️ Degrades on poor connections
- ⚠️ May need TURN server for some networks

## Troubleshooting

### "No video appears"

**Check 1: Permissions**
- Browser asking for camera/mic access?
- Click "Allow"
- Hard refresh (Ctrl+F5)

**Check 2: Console Errors**
```
Failed to get user media
  → Camera/mic blocked in browser settings
```

**Check 3: Socket Connection**
```javascript
// In console
window.socket?.connected  // Should be true
```

### "Only my video shows"

**Check 1: Peer Connection**
- Open `chrome://webrtc-internals/`
- Check connection state
- Should show ICE connection: `connected`

**Check 2: Firewall**
- Try different network (mobile hotspot)
- If works, router/firewall blocking P2P

**Check 3: Logs**
- Look for "ICE connection failed"
- May need TURN server

### "Video stutters/lags"

**Solutions:**
1. Reduce quality in `useWebRTC.ts`:
   ```typescript
   video: {
     width: { ideal: 480 },
     height: { ideal: 360 },
     frameRate: { ideal: 15 },
   }
   ```

2. Close other tabs
3. Check bandwidth: `speedtest.net`
4. Try different browser

### "Audio cuts out"

**Solutions:**
1. Check `audioEnabled` state
2. Verify microphone in browser settings
3. Try different microphone
4. Close audio apps competing for device

## Performance Profiling

### React DevTools Profiler

1. Install React DevTools extension
2. Open Profiler tab
3. Record session interaction
4. Look for:
   - Slow component renders
   - Unnecessary re-renders
   - Long rendering times

### Expected Performance

**Component Render Times:**
- SessionRoom: < 16ms
- RemoteVideo: < 5ms
- LocalVideo: < 5ms

**Interaction Latency:**
- Peer appears: 1-3 seconds
- Chat sends: < 100ms
- Audio/Video toggle: < 100ms

## Reporting Issues

If you encounter problems:

1. **Collect Information:**
   - Browser and version
   - Operating system
   - Number of participants
   - Network type (WiFi/Mobile)
   - Console errors (screenshot)

2. **Enable Debug Logs:**
   - Open browser console
   - Note timestamps of errors
   - Include emoji indicators (📹, ⚠️, etc.)

3. **Test Variations:**
   - Different browsers
   - Different networks
   - Different participant counts

4. **Share:**
   - Console logs
   - Chrome://webrtc-internals/ screenshot
   - Reproduction steps

## Success Criteria

Your implementation is working correctly if:

✅ All videos appear in grid layout
✅ Videos load within 2-3 seconds
✅ Chat messages persist
✅ Multiple participants supported
✅ Audio/video controls work
✅ No console errors
✅ Smooth playback (30 FPS)
✅ Graceful disconnect handling

## Next Steps

Once testing is complete:

1. **Test on Production**
   - Deploy to staging server
   - Test with real users
   - Monitor performance

2. **Optimize**
   - Adjust video quality
   - Optimize bundle size
   - Add screen sharing

3. **Scale**
   - Monitor user growth
   - Plan for SFU migration
   - Add TURN servers

Good luck with testing! 🎉
