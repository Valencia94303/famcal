"use client";

import { useState, useEffect, ReactNode, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Theme } from "@/lib/theme";

interface Widget {
  id: string;
  name: string;
  component: ReactNode;
}

interface WidgetCarouselProps {
  widgets: Widget[];
  theme: Theme;
  rotationInterval?: number; // in milliseconds
}

export function WidgetCarousel({
  widgets,
  theme,
  rotationInterval = 30000,
}: WidgetCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Get the two visible widget indices
  const getVisibleIndices = useCallback(
    (index: number) => {
      const first = index % widgets.length;
      const second = (index + 1) % widgets.length;
      return [first, second];
    },
    [widgets.length]
  );

  const [visibleIndices, setVisibleIndices] = useState(() =>
    getVisibleIndices(0)
  );

  // Trigger rotation
  const triggerRotation = useCallback(() => {
    if (widgets.length <= 2) return;

    setDirection(1);
    const nextIndex = (currentIndex + 1) % widgets.length;
    setCurrentIndex(nextIndex);
    setVisibleIndices(getVisibleIndices(nextIndex));
  }, [currentIndex, widgets.length, getVisibleIndices]);

  // Auto-rotate timer
  useEffect(() => {
    if (widgets.length <= 2) return;

    const interval = setInterval(triggerRotation, rotationInterval);
    return () => clearInterval(interval);
  }, [rotationInterval, widgets.length, triggerRotation]);

  // Slide animation variants with wiggle
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      rotate: direction > 0 ? 3 : -3,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotate: [0, -1.5, 1, -0.5, 0], // Wiggle sequence
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
      rotate: direction > 0 ? -3 : 3,
    }),
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Sliding carousel */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 80, damping: 15, mass: 1 },
            opacity: { duration: 0.6 },
            rotate: { duration: 0.8, times: [0, 0.4, 0.6, 0.8, 1], ease: "easeOut" },
          }}
          className="grid grid-cols-2 gap-6 lg:gap-8 will-change-transform"
        >
          {visibleIndices.map((widgetIndex) => (
            <div key={`widget-${widgetIndex}`} className="min-h-[400px]">
              {widgets[widgetIndex].component}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Progress indicator dots */}
      <div className="flex justify-center gap-3 mt-8">
        {widgets.map((widget, index) => {
          const isVisible = visibleIndices.includes(index);
          return (
            <motion.div
              key={widget.id}
              className="relative"
              animate={{
                scale: isVisible ? 1 : 0.8,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  isVisible
                    ? "bg-white shadow-lg shadow-white/30"
                    : "bg-white/30"
                }`}
              />
              {isVisible && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-white/50"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
