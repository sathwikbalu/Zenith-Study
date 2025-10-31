import { useEffect, useRef } from "react";

interface RemoteVideoProps {
  stream: MediaStream | undefined;
  userName: string;
}

export const RemoteVideo = ({ stream, userName }: RemoteVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      console.log(`📹 Setting remote video stream for ${userName}`, stream);
      video.srcObject = stream;

      // Force play
      video.play().catch((err) => {
        console.error(`Failed to play video for ${userName}:`, err);
      });
    }

    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [stream, userName]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={false}
      className="w-full h-full object-cover"
    />
  );
};
