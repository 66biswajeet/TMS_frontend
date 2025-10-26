// components/CameraModal.tsx
import { useRef, useEffect, useState } from "react";

export default function CameraModal({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    };
    startCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
        onCapture(file);
        onClose();
      }
    }, "image/jpeg");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded shadow-lg space-y-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="rounded w-full max-w-sm"
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div className="flex justify-between">
          <button
            onClick={handleCapture}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Capture & Check In
          </button>
          <button onClick={onClose} className="text-sm text-gray-600">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
