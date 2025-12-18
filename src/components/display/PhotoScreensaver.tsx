"use client";

import { useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Photo {
  filename: string;
  url: string;
}

interface PhotoScreensaverProps {
  children: ReactNode;
  photoInterval: number; // seconds
}

// Ken Burns effect configurations
const KEN_BURNS_EFFECTS = [
  { startScale: 1.0, endScale: 1.15, startX: 0, startY: 0, endX: -5, endY: -5 },
  { startScale: 1.15, endScale: 1.0, startX: -5, startY: -5, endX: 0, endY: 0 },
  { startScale: 1.0, endScale: 1.15, startX: 0, startY: 0, endX: 5, endY: -5 },
  { startScale: 1.15, endScale: 1.0, startX: 5, startY: -5, endX: 0, endY: 0 },
  { startScale: 1.0, endScale: 1.1, startX: -3, startY: 3, endX: 3, endY: -3 },
  { startScale: 1.1, endScale: 1.0, startX: 3, startY: -3, endX: -3, endY: 3 },
];

// Corner positions for mini dashboard
const CORNERS = [
  { position: "top-4 left-4", origin: "top left" },
  { position: "top-4 right-4", origin: "top right" },
  { position: "bottom-4 left-4", origin: "bottom left" },
  { position: "bottom-4 right-4", origin: "bottom right" },
];

export function PhotoScreensaver({ children, photoInterval }: PhotoScreensaverProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentEffect, setCurrentEffect] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Select random corner on mount (stable during session)
  const corner = useMemo(() => CORNERS[Math.floor(Math.random() * CORNERS.length)], []);

  // Fetch photos on mount
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await fetch("/api/local-photos");
        const data = await res.json();
        if (data.photos && data.photos.length > 0) {
          setPhotos(data.photos);
          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Error fetching photos:", error);
      }
    };

    fetchPhotos();
  }, []);

  // Advance to next photo
  const nextPhoto = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setCurrentEffect(Math.floor(Math.random() * KEN_BURNS_EFFECTS.length));
  }, [photos.length]);

  // Auto-advance photos
  useEffect(() => {
    if (!isLoaded || photos.length === 0) return;

    const timer = setInterval(nextPhoto, photoInterval * 1000);
    return () => clearInterval(timer);
  }, [isLoaded, photos.length, photoInterval, nextPhoto]);

  // If no photos, just render children normally
  if (!isLoaded || photos.length === 0) {
    return <>{children}</>;
  }

  const currentPhoto = photos[currentIndex];
  const effect = KEN_BURNS_EFFECTS[currentEffect];

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Photo background with Ken Burns effect */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentPhoto.url}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          <motion.img
            src={currentPhoto.url}
            alt=""
            className="w-full h-full object-cover"
            initial={{
              scale: effect.startScale,
              x: `${effect.startX}%`,
              y: `${effect.startY}%`,
            }}
            animate={{
              scale: effect.endScale,
              x: `${effect.endX}%`,
              y: `${effect.endY}%`,
            }}
            transition={{
              duration: photoInterval,
              ease: "linear",
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none" />

      {/* Mini dashboard in corner */}
      <motion.div
        className={`absolute ${corner.position} z-10`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{
          transformOrigin: corner.origin,
          width: "35vw",
          maxHeight: "45vh",
        }}
      >
        <div
          className="backdrop-blur-xl bg-black/40 rounded-3xl overflow-hidden shadow-2xl"
          style={{
            transform: "scale(0.5)",
            transformOrigin: corner.origin,
          }}
        >
          <div className="pointer-events-none" style={{ width: "70vw" }}>
            {children}
          </div>
        </div>
      </motion.div>

      {/* Photo progress indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {photos.slice(0, Math.min(photos.length, 10)).map((_, idx) => (
          <div
            key={idx}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              idx === currentIndex % Math.min(photos.length, 10)
                ? "bg-white"
                : "bg-white/30"
            }`}
          />
        ))}
        {photos.length > 10 && (
          <span className="text-white/50 text-xs ml-1">+{photos.length - 10}</span>
        )}
      </div>
    </div>
  );
}
