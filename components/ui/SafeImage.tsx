"use client";

import { useState, useEffect } from "react";

interface SafeImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function SafeImage({ src, alt, className, fallback }: SafeImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setError(true);
      return;
    }

    let isMounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const response = await fetch(src, { headers });
        if (!response.ok) throw new Error("Failed to load image");

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);

        if (isMounted) {
          setImageSrc(objectUrl);
          setError(false);
        }
      } catch (err) {
        console.warn("Failed to load image:", err);
        if (isMounted) {
          setError(true);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (error || !imageSrc) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div
        className={`${className} bg-gray-100 flex items-center justify-center`}
      >
        <span className="text-gray-400 text-sm">No Image Available</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
