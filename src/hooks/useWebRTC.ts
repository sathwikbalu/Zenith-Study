import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";

interface Peer {
  socketId: string;
  userId: string;
  userName: string;
  stream?: MediaStream;
  peerConnection?: RTCPeerConnection;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  isTutor?: boolean;
  dataChannel?: RTCDataChannel;
}

// Enhanced ICE servers configuration for better voice clarity
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    {
      urls: "turn:relay.metered.ca:80",
      username: "931a79031352d2d87231a5d2",
      credential: "r1ek8cE0+0rUyEsN",
    },
    {
      urls: "turn:relay.metered.ca:443",
      username: "931a79031352d2d87231a5d2",
      credential: "r1ek8cE0+0rUyEsN",
    },
  ],
};

export const useWebRTC = (
  socket: Socket | null,
  sessionId: string,
  userId: string,
  userName: string,
  isTutor: boolean = false
) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [audioEnabled, setAudioEnabled] = useState(true); // Default to enabled
  const [videoEnabled, setVideoEnabled] = useState(true); // Default to enabled
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, Peer>>(new Map());

  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  useEffect(() => {
    if (!socket || !sessionId) return;

    const initMedia = async () => {
      try {
        // Request both audio and video for all users, enabled by default
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        // Enable tracks by default
        stream.getAudioTracks().forEach((track) => (track.enabled = true));
        stream.getVideoTracks().forEach((track) => (track.enabled = true));

        setLocalStream(stream);
        localStreamRef.current = stream;

        socket.emit("join-session", { sessionId, userId, userName, isTutor });
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    initMedia();

    socket.on("existing-participants", (participants: Peer[]) => {
      console.log(
        "Received existing participants:",
        participants.map((p) => p.userName)
      );
      participants.forEach((participant) => {
        createPeerConnection(
          participant.socketId,
          participant.userId,
          participant.userName,
          true,
          participant.isTutor
        );
      });
    });

    socket.on(
      "user-joined",
      ({
        socketId,
        userId: newUserId,
        userName: newUserName,
        isTutor: newUserIsTutor,
      }) => {
        console.log(`User joined: ${newUserName} (${socketId})`);
        if (socketId !== socket.id) {
          createPeerConnection(
            socketId,
            newUserId,
            newUserName,
            false,
            newUserIsTutor
          );
        }
      }
    );

    socket.on("webrtc-offer", async ({ offer, from }) => {
      const peer = peersRef.current.get(from);
      if (peer?.peerConnection) {
        try {
          await peer.peerConnection.setRemoteDescription(
            new RTCSessionDescription(offer)
          );
          const answer = await peer.peerConnection.createAnswer();
          await peer.peerConnection.setLocalDescription(answer);
          socket.emit("webrtc-answer", { answer, to: from });
        } catch (error) {
          console.error("Error handling offer:", error);
        }
      }
    });

    socket.on("webrtc-answer", async ({ answer, from }) => {
      const peer = peersRef.current.get(from);
      if (peer?.peerConnection) {
        try {
          await peer.peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        } catch (error) {
          console.error("Error handling answer:", error);
        }
      }
    });

    socket.on("webrtc-ice-candidate", async ({ candidate, from }) => {
      const peer = peersRef.current.get(from);
      if (peer?.peerConnection && candidate) {
        try {
          await peer.peerConnection.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    });

    socket.on("user-left", ({ socketId }) => {
      const peer = peersRef.current.get(socketId);
      if (peer?.peerConnection) {
        peer.peerConnection.close();
      }
      peersRef.current.delete(socketId);
      setPeers(new Map(peersRef.current));
    });

    socket.on("user-audio-toggle", ({ socketId, enabled }) => {
      setPeers((prev) => {
        const newPeers = new Map(prev);
        const peer = newPeers.get(socketId);
        if (peer) {
          peer.audioEnabled = enabled;
          newPeers.set(socketId, peer);
        }
        return newPeers;
      });
    });

    socket.on("user-video-toggle", ({ socketId, enabled }) => {
      setPeers((prev) => {
        const newPeers = new Map(prev);
        const peer = newPeers.get(socketId);
        if (peer) {
          peer.videoEnabled = enabled;
          newPeers.set(socketId, peer);
        }
        return newPeers;
      });
    });

    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peersRef.current.forEach((peer) => {
        peer.peerConnection?.close();
      });
      socket.emit("leave-session", { sessionId });
      socket.off("existing-participants");
      socket.off("user-joined");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice-candidate");
      socket.off("user-left");
      socket.off("user-audio-toggle");
      socket.off("user-video-toggle");
    };
  }, [socket, sessionId, userId, userName, isTutor]);

  const createPeerConnection = useCallback(
    async (
      socketId: string,
      peerId: string,
      peerName: string,
      shouldCreateOffer: boolean,
      peerIsTutor: boolean = false
    ) => {
      try {
        console.log(`Creating peer connection for ${peerName} (${socketId}), shouldCreateOffer: ${shouldCreateOffer}`);

        const peerConnection = new RTCPeerConnection(ICE_SERVERS);

        // Create and store peer object first
        const newPeer: Peer = {
          socketId,
          userId: peerId,
          userName: peerName,
          peerConnection,
          audioEnabled: true,
          videoEnabled: true,
          isTutor: peerIsTutor,
        };

        peersRef.current.set(socketId, newPeer);
        setPeers(new Map(peersRef.current));

        // Add local tracks to peer connection with sender optimization
        if (localStreamRef.current) {
          for (const track of localStreamRef.current.getTracks()) {
            console.log(`Adding ${track.kind} track to peer connection for ${peerName}`);
            peerConnection.addTrack(track, localStreamRef.current);
          }
        }

        // Handle incoming tracks from remote peer - this is critical
        peerConnection.ontrack = (event) => {
          console.log(
            `📹 ontrack received from ${peerName}: ${event.track.kind}, streams: ${event.streams.length}`
          );

          if (event.streams && event.streams.length > 0) {
            const remoteStream = event.streams[0];

            // Update the peer with the stream immediately
            peersRef.current.set(socketId, {
              ...peersRef.current.get(socketId)!,
              stream: remoteStream,
            });

            // Force update to trigger re-render
            setPeers(new Map(peersRef.current));

            console.log(
              `✅ Updated peer ${peerName} with stream containing tracks:`,
              remoteStream.getTracks().map(t => t.kind)
            );
          }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate && socket) {
            console.log(`Sending ICE candidate to ${peerName}`);
            socket.emit("webrtc-ice-candidate", {
              candidate: event.candidate,
              to: socketId,
            });
          }
        };

        // Monitor connection state
        peerConnection.onconnectionstatechange = () => {
          console.log(
            `🔗 Connection state for ${peerName}: ${peerConnection.connectionState}`
          );
        };

        peerConnection.oniceconnectionstatechange = () => {
          console.log(
            `❄️ ICE connection state for ${peerName}: ${peerConnection.iceConnectionState}`
          );
          if (peerConnection.iceConnectionState === "failed") {
            console.error(`⚠️ ICE connection failed for ${peerName}`);
          }
        };

        peerConnection.onsignalingstatechange = () => {
          console.log(
            `📡 Signaling state for ${peerName}: ${peerConnection.signalingState}`
          );
        };

        // Create offer if this peer should initiate
        if (shouldCreateOffer) {
          console.log(`Creating offer for ${peerName}...`);
          const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await peerConnection.setLocalDescription(offer);
          socket?.emit("webrtc-offer", { offer, to: socketId });
          console.log(`✉️ Sent offer to ${peerName}`);
        }
      } catch (error) {
        console.error(`❌ Error creating peer connection for ${peerName}:`, error);
      }
    },
    [socket]
  );

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        socket?.emit("toggle-audio", {
          sessionId,
          userId,
          enabled: audioTrack.enabled,
        });
      }
    }
  };

  const toggleVideo = () => {
    // Both tutors and students can now toggle video
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        socket?.emit("toggle-video", {
          sessionId,
          userId,
          enabled: videoTrack.enabled,
        });
      }
    }
  };

  return {
    localStream,
    peers,
    audioEnabled,
    videoEnabled,
    toggleAudio,
    toggleVideo,
  };
};
