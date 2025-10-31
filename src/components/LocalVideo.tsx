import { useEffect, useRef } from "react";

interface LocalVideoProps {
  stream: MediaStream | null;
  videoEnabled: boolean;
  userName: string;
}

export const LocalVideo = ({ stream, videoEnabled, userName }: LocalVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream && videoEnabled) {
      console.log(`📹 Setting local video stream for ${userName}`, stream);
      video.srcObject = stream;

      video.play().catch((err) => {
        console.error(`Failed to play local video:`, err);
      });
    }

    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [stream, videoEnabled, userName]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="w-full h-full object-cover"
    />
  );
};
