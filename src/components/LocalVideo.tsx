import { useEffect, useRef } from "react";

interface LocalVideoProps {
  stream: MediaStream;
  videoEnabled: boolean;
  userName: string;
}

export const LocalVideo = ({
  stream,
  videoEnabled,
  userName,
}: LocalVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

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
