import { useEffect, useRef } from "react";

interface RemoteVideoProps {
  stream: MediaStream;
  userName: string;
}

export const RemoteVideo = ({ stream, userName }: RemoteVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.volume = 1.0;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  );
};
