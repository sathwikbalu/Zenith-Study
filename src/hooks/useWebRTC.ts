import { useEffect, useRef, useState } from "react";
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
  const [audioEnabled, setAudioEnabled] = useState(false); // Default to false for both tutors and students
  const [videoEnabled, setVideoEnabled] = useState(false); // Default to false for both tutors and students
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, Peer>>(new Map());

  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  useEffect(() => {
    if (!socket || !sessionId) return;

    const initMedia = async () => {
      try {
        // Request both audio and video for all users, but keep them disabled initially
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          }, // Both tutors and students can have video
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }, // Both tutors and students can have audio with better quality
        });

        // Initially disable tracks
        stream.getAudioTracks().forEach((track) => (track.enabled = false));
        stream.getVideoTracks().forEach((track) => (track.enabled = false));

        setLocalStream(stream);
        localStreamRef.current = stream;

        socket.emit("join-session", { sessionId, userId, userName, isTutor });
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    initMedia();

    socket.on("existing-participants", (participants: Peer[]) => {
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

  const createPeerConnection = async (
    socketId: string,
    peerId: string,
    peerName: string,
    shouldCreateOffer: boolean,
    peerIsTutor: boolean = false
  ) => {
    try {
      const peerConnection = new RTCPeerConnection(ICE_SERVERS);

      // Add better configuration for voice clarity
      peerConnection.onnegotiationneeded = async () => {
        try {
          const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await peerConnection.setLocalDescription(offer);
          socket?.emit("webrtc-offer", { offer, to: socketId });
        } catch (error) {
          console.error("Error creating offer:", error);
        }
      };

      localStreamRef.current?.getTracks().forEach((track) => {
        if (localStreamRef.current) {
          peerConnection.addTrack(track, localStreamRef.current);
        }
      });

      peerConnection.ontrack = (event) => {
        setPeers((prev) => {
          const newPeers = new Map(prev);
          const peer = newPeers.get(socketId);
          if (peer) {
            peer.stream = event.streams[0];
            newPeers.set(socketId, peer);
          }
          return newPeers;
        });
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("webrtc-ice-candidate", {
            candidate: event.candidate,
            to: socketId,
          });
        }
      };

      // Handle ICE connection state changes for better debugging
      peerConnection.oniceconnectionstatechange = () => {
        console.log(
          `ICE connection state for ${peerName}: ${peerConnection.iceConnectionState}`
        );
      };

      const newPeer: Peer = {
        socketId,
        userId: peerId,
        userName: peerName,
        peerConnection,
        audioEnabled: false, // Start with audio disabled
        videoEnabled: false, // Start with video disabled
        isTutor: peerIsTutor,
      };

      peersRef.current.set(socketId, newPeer);
      setPeers(new Map(peersRef.current));

      if (shouldCreateOffer) {
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await peerConnection.setLocalDescription(offer);
        socket?.emit("webrtc-offer", { offer, to: socketId });
      }
    } catch (error) {
      console.error("Error creating peer connection:", error);
    }
  };

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
