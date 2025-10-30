import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

interface Peer {
  socketId: string;
  userId: string;
  userName: string;
  stream?: MediaStream;
  peerConnection?: RTCPeerConnection;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useWebRTC = (socket: Socket | null, sessionId: string, userId: string, userName: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, Peer>>(new Map());

  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  useEffect(() => {
    if (!socket || !sessionId) return;

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setLocalStream(stream);
        localStreamRef.current = stream;

        socket.emit('join-session', { sessionId, userId, userName });
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    initMedia();

    socket.on('existing-participants', (participants: Peer[]) => {
      participants.forEach((participant) => {
        createPeerConnection(participant.socketId, participant.userId, participant.userName, true);
      });
    });

    socket.on('user-joined', ({ socketId, userId: newUserId, userName: newUserName }) => {
      if (socketId !== socket.id) {
        createPeerConnection(socketId, newUserId, newUserName, false);
      }
    });

    socket.on('webrtc-offer', async ({ offer, from }) => {
      const peer = peersRef.current.get(from);
      if (peer?.peerConnection) {
        try {
          await peer.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peer.peerConnection.createAnswer();
          await peer.peerConnection.setLocalDescription(answer);
          socket.emit('webrtc-answer', { answer, to: from });
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      }
    });

    socket.on('webrtc-answer', async ({ answer, from }) => {
      const peer = peersRef.current.get(from);
      if (peer?.peerConnection) {
        try {
          await peer.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      }
    });

    socket.on('webrtc-ice-candidate', async ({ candidate, from }) => {
      const peer = peersRef.current.get(from);
      if (peer?.peerConnection && candidate) {
        try {
          await peer.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    socket.on('user-left', ({ socketId }) => {
      const peer = peersRef.current.get(socketId);
      if (peer?.peerConnection) {
        peer.peerConnection.close();
      }
      peersRef.current.delete(socketId);
      setPeers(new Map(peersRef.current));
    });

    socket.on('user-audio-toggle', ({ socketId, enabled }) => {
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

    socket.on('user-video-toggle', ({ socketId, enabled }) => {
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
      socket.emit('leave-session', { sessionId });
      socket.off('existing-participants');
      socket.off('user-joined');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('user-left');
      socket.off('user-audio-toggle');
      socket.off('user-video-toggle');
    };
  }, [socket, sessionId, userId, userName]);

  const createPeerConnection = async (socketId: string, peerId: string, peerName: string, shouldCreateOffer: boolean) => {
    try {
      const peerConnection = new RTCPeerConnection(ICE_SERVERS);

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
          socket.emit('webrtc-ice-candidate', { candidate: event.candidate, to: socketId });
        }
      };

      const newPeer: Peer = {
        socketId,
        userId: peerId,
        userName: peerName,
        peerConnection,
        audioEnabled: true,
        videoEnabled: true,
      };

      peersRef.current.set(socketId, newPeer);
      setPeers(new Map(peersRef.current));

      if (shouldCreateOffer) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket?.emit('webrtc-offer', { offer, to: socketId });
      }
    } catch (error) {
      console.error('Error creating peer connection:', error);
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        socket?.emit('toggle-audio', { sessionId, userId, enabled: audioTrack.enabled });
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        socket?.emit('toggle-video', { sessionId, userId, enabled: videoTrack.enabled });
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
