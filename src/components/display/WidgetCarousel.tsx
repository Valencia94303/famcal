"use client";

import { useState, useEffect, ReactNode, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Theme } from "@/lib/theme";

interface Widget {
  id: string;
  name: string;
  component: ReactNode;
}

// Animation preset types
export type AnimationPreset =
  | "arrivingTogether"
  | "racingFriends"
  | "bouncyBall"
  | "peekaBoo"
  | "airplaneLanding"
  | "sillySpin"
  | "trampolineJump"
  | "crashAndRecover"
  | "jellyWobble"
  | "rocketLaunch"
  | "swingIn"
  | "tumbleIn"
  | "balloonFloat"
  | "cycle"; // Meta-preset: cycles through all presets

// List of actual animation presets (excluding "cycle")
export const ANIMATION_PRESETS: Exclude<AnimationPreset, "cycle">[] = [
  "arrivingTogether",
  "racingFriends",
  "bouncyBall",
  "peekaBoo",
  "airplaneLanding",
  "sillySpin",
  "trampolineJump",
  "crashAndRecover",
  "jellyWobble",
  "rocketLaunch",
  "swingIn",
  "tumbleIn",
  "balloonFloat",
];

interface WidgetCarouselProps {
  widgets: Widget[];
  theme: Theme;
  rotationInterval?: number;
  animationPreset?: Exclude<AnimationPreset, "cycle">; // Cycle is handled by Dashboard
}

// ============================================
// ANIMATION PRESETS
// ============================================

const animationPresets = {
  // Preset 1: "Arriving Together" - widgets come from opposite sides with unique personalities
  arrivingTogether: {
    getVariants: (position: number) => {
      const isLeft = position === 0;
      return {
        enter: {
          x: isLeft ? "-120%" : "120%",
          opacity: 0,
          rotate: isLeft ? -5 : 5,
          scale: 0.9,
          y: isLeft ? 20 : -20,
          boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)",
        },
        center: {
          x: 0,
          opacity: 1,
          rotate: isLeft
            ? [0, -2, 1.5, -1, 0.5, 0]
            : [0, 1.5, -2, 0.8, -0.5, 0],
          scale: [0.95, 1.02, 0.98, 1.01, 1],
          y: 0,
          boxShadow: [
            "0 30px 60px -15px rgba(0, 0, 0, 0.4), 0 0 35px rgba(0, 0, 0, 0.25)",
            "0 8px 20px -5px rgba(0, 0, 0, 0.15), 0 0 10px rgba(0, 0, 0, 0.1)",
            "0 15px 35px -10px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.15)",
            "0 6px 15px -4px rgba(0, 0, 0, 0.12), 0 0 8px rgba(0, 0, 0, 0.08)",
            "0 4px 12px -3px rgba(0, 0, 0, 0.08), 0 0 5px rgba(0, 0, 0, 0.05)",
          ],
        },
        exit: {
          x: isLeft ? "-120%" : "120%",
          opacity: 0,
          rotate: isLeft ? 5 : -5,
          scale: 0.9,
          y: isLeft ? -20 : 20,
          boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)",
        },
      };
    },
    getTransition: (position: number) => {
      const isLeft = position === 0;
      const baseDelay = isLeft ? 0 : 0.1;
      return {
        x: { type: "spring" as const, stiffness: isLeft ? 70 : 85, damping: isLeft ? 14 : 16, mass: 1, delay: baseDelay },
        y: { type: "spring" as const, stiffness: 100, damping: 15, delay: baseDelay },
        opacity: { duration: 0.5, delay: baseDelay },
        rotate: { duration: isLeft ? 0.9 : 0.8, times: [0, 0.25, 0.45, 0.65, 0.82, 1], ease: "easeOut" as const, delay: baseDelay + 0.2 },
        scale: { duration: isLeft ? 0.85 : 0.75, times: [0, 0.3, 0.5, 0.75, 1], ease: "easeOut" as const, delay: baseDelay },
        boxShadow: { duration: 0.9, times: [0, 0.3, 0.5, 0.7, 1], ease: "easeOut" as const, delay: baseDelay },
      };
    },
    getStyle: (position: number) => ({
      transformOrigin: position === 0 ? "right center" : "left center",
    }),
  },

  // Preset 2: "Racing Friends" - both come from the same side, one stops first
  racingFriends: {
    getVariants: (position: number) => {
      const isFirst = position === 0; // First one (left spot) - the "winner" who stops first
      return {
        enter: {
          x: "120%", // Both come from the right
          opacity: 0,
          rotate: isFirst ? 8 : 12, // Second one more tilted (trying harder!)
          scale: isFirst ? 0.92 : 0.88,
          y: isFirst ? -10 : 15, // Slight vertical offset
          boxShadow: "0 35px 70px -15px rgba(0, 0, 0, 0.5), 0 0 45px rgba(0, 0, 0, 0.35)",
        },
        center: {
          x: 0,
          opacity: 1,
          rotate: isFirst
            ? [0, -3, 1.5, -0.8, 0] // Winner settles confidently
            : [0, 2, -2.5, 1.5, -1, 0.5, 0], // Second one wiggles more (catching breath!)
          scale: isFirst
            ? [0.95, 1.03, 0.98, 1] // Quick confident bounce
            : [0.9, 1.05, 0.95, 1.02, 0.99, 1], // More dramatic bounce (skidding to stop)
          y: 0,
          boxShadow: isFirst
            ? [
                "0 30px 60px -15px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 0, 0, 0.2)",
                "0 6px 15px -4px rgba(0, 0, 0, 0.12), 0 0 8px rgba(0, 0, 0, 0.08)",
                "0 10px 25px -8px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.1)",
                "0 4px 12px -3px rgba(0, 0, 0, 0.08), 0 0 5px rgba(0, 0, 0, 0.05)",
              ]
            : [
                "0 35px 70px -15px rgba(0, 0, 0, 0.45), 0 0 40px rgba(0, 0, 0, 0.25)",
                "0 5px 12px -3px rgba(0, 0, 0, 0.1), 0 0 6px rgba(0, 0, 0, 0.06)",
                "0 20px 40px -12px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.12)",
                "0 8px 18px -5px rgba(0, 0, 0, 0.12), 0 0 10px rgba(0, 0, 0, 0.08)",
                "0 4px 10px -3px rgba(0, 0, 0, 0.08), 0 0 5px rgba(0, 0, 0, 0.04)",
              ],
        },
        exit: {
          x: "-120%", // Both exit to the left
          opacity: 0,
          rotate: isFirst ? -5 : -8,
          scale: 0.85,
          y: isFirst ? 10 : -15,
          boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
        },
      };
    },
    getTransition: (position: number) => {
      const isFirst = position === 0;
      // Both race in from the right - first one arrives and stops, second follows closely
      // Add base delay so old widgets exit first before the race begins
      const baseDelay = 0.25;
      return {
        x: {
          type: "spring" as const,
          stiffness: isFirst ? 90 : 100, // Second one moves faster
          damping: isFirst ? 18 : 14, // Second one less damped (more momentum)
          mass: isFirst ? 1 : 0.9,
          delay: isFirst ? baseDelay : baseDelay + 0.12, // Second one starts slightly later
        },
        y: { type: "spring" as const, stiffness: 120, damping: 18, delay: isFirst ? baseDelay : baseDelay + 0.12 },
        opacity: { duration: 0.3, delay: isFirst ? baseDelay : baseDelay + 0.08 },
        rotate: {
          duration: isFirst ? 0.7 : 1.0, // Second one wiggles longer
          times: isFirst ? [0, 0.3, 0.55, 0.8, 1] : [0, 0.2, 0.4, 0.55, 0.7, 0.85, 1],
          ease: "easeOut" as const,
          delay: isFirst ? baseDelay + 0.15 : baseDelay + 0.3,
        },
        scale: {
          duration: isFirst ? 0.6 : 0.9,
          times: isFirst ? [0, 0.35, 0.65, 1] : [0, 0.25, 0.45, 0.6, 0.8, 1],
          ease: "easeOut" as const,
          delay: isFirst ? baseDelay : baseDelay + 0.15,
        },
        boxShadow: {
          duration: isFirst ? 0.7 : 1.0,
          times: isFirst ? [0, 0.3, 0.6, 1] : [0, 0.2, 0.45, 0.7, 1],
          ease: "easeOut" as const,
          delay: isFirst ? baseDelay : baseDelay + 0.15,
        },
      };
    },
    getStyle: (position: number) => ({
      transformOrigin: position === 0 ? "center center" : "left center",
    }),
  },

  // Preset 3: "Bouncy Ball" - widgets drop from top and bounce like a ball
  bouncyBall: {
    getVariants: (position: number) => {
      const isFirst = position === 0;
      return {
        enter: {
          y: "-120%",
          x: 0,
          opacity: 0,
          scale: 0.8,
          rotate: isFirst ? -8 : 8,
          boxShadow: "0 -20px 40px -10px rgba(0, 0, 0, 0.3)",
        },
        center: {
          y: [0, -80, 0, -40, 0, -15, 0, -5, 0], // Multiple bounces, decreasing height
          x: 0,
          opacity: 1,
          scale: [0.85, 1.1, 0.95, 1.05, 0.98, 1.02, 0.99, 1.01, 1], // Squish on each bounce
          rotate: [0, isFirst ? 5 : -5, isFirst ? -3 : 3, isFirst ? 2 : -2, 0, 0, 0, 0, 0],
          boxShadow: [
            "0 50px 80px -20px rgba(0, 0, 0, 0.5)",
            "0 5px 15px -5px rgba(0, 0, 0, 0.2)",
            "0 30px 50px -15px rgba(0, 0, 0, 0.4)",
            "0 5px 15px -5px rgba(0, 0, 0, 0.2)",
            "0 20px 35px -10px rgba(0, 0, 0, 0.3)",
            "0 5px 12px -4px rgba(0, 0, 0, 0.15)",
            "0 10px 20px -8px rgba(0, 0, 0, 0.2)",
            "0 4px 10px -3px rgba(0, 0, 0, 0.1)",
            "0 4px 12px -3px rgba(0, 0, 0, 0.08)",
          ],
        },
        exit: {
          y: "120%",
          opacity: 0,
          scale: 0.8,
          rotate: isFirst ? 10 : -10,
          boxShadow: "0 40px 60px -15px rgba(0, 0, 0, 0.4)",
        },
      };
    },
    getTransition: (position: number) => {
      const isFirst = position === 0;
      const baseDelay = isFirst ? 0.2 : 0.35;
      return {
        y: {
          duration: 1.4,
          times: [0, 0.15, 0.3, 0.42, 0.54, 0.66, 0.78, 0.9, 1],
          ease: "easeOut" as const, // Bounce easing
          delay: baseDelay,
        },
        x: { duration: 0.3, delay: baseDelay },
        opacity: { duration: 0.2, delay: baseDelay },
        scale: {
          duration: 1.4,
          times: [0, 0.15, 0.3, 0.42, 0.54, 0.66, 0.78, 0.9, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        rotate: {
          duration: 1.4,
          times: [0, 0.15, 0.3, 0.42, 0.54, 0.66, 0.78, 0.9, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        boxShadow: {
          duration: 1.4,
          times: [0, 0.15, 0.3, 0.42, 0.54, 0.66, 0.78, 0.9, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
      };
    },
    getStyle: () => ({
      transformOrigin: "center bottom",
    }),
  },

  // Preset 4: "Peek-a-Boo" - widgets pop from tiny center to full size
  peekaBoo: {
    getVariants: (position: number) => {
      const isFirst = position === 0;
      return {
        enter: {
          scale: 0.1,
          opacity: 0,
          rotate: isFirst ? -20 : 20,
          y: 0,
          x: 0,
          boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
        },
        center: {
          scale: [0.1, 1.15, 0.95, 1.05, 1], // Pop out with overshoot
          opacity: 1,
          rotate: [isFirst ? -20 : 20, isFirst ? 8 : -8, isFirst ? -4 : 4, isFirst ? 2 : -2, 0], // Wobble as it pops
          y: [0, -20, 5, -8, 0], // Little jump
          x: 0,
          boxShadow: [
            "0 0 0 rgba(0, 0, 0, 0)",
            "0 30px 60px -15px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 0, 0, 0.2)",
            "0 15px 35px -10px rgba(0, 0, 0, 0.25), 0 0 20px rgba(0, 0, 0, 0.1)",
            "0 8px 20px -8px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08)",
            "0 4px 12px -3px rgba(0, 0, 0, 0.08), 0 0 5px rgba(0, 0, 0, 0.05)",
          ],
        },
        exit: {
          scale: 0.1,
          opacity: 0,
          rotate: isFirst ? 20 : -20,
          y: 0,
          boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
        },
      };
    },
    getTransition: (position: number) => {
      const isFirst = position === 0;
      const baseDelay = isFirst ? 0.15 : 0.3;
      return {
        scale: {
          duration: 0.8,
          times: [0, 0.4, 0.6, 0.8, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        opacity: { duration: 0.2, delay: baseDelay },
        rotate: {
          duration: 0.8,
          times: [0, 0.4, 0.6, 0.8, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        y: {
          duration: 0.8,
          times: [0, 0.4, 0.6, 0.8, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        x: { duration: 0.3, delay: baseDelay },
        boxShadow: {
          duration: 0.8,
          times: [0, 0.4, 0.6, 0.8, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
      };
    },
    getStyle: () => ({
      transformOrigin: "center center",
    }),
  },

  // Preset 5: "Airplane Landing" - widgets swoop in from top corner in an arc
  airplaneLanding: {
    getVariants: (position: number) => {
      const isFirst = position === 0;
      return {
        enter: {
          x: isFirst ? "-80%" : "80%", // Come from opposite top corners
          y: "-100%",
          opacity: 0,
          rotate: isFirst ? -25 : 25, // Tilted like airplane banking
          scale: 0.7,
          boxShadow: "0 -30px 50px -15px rgba(0, 0, 0, 0.3)",
        },
        center: {
          x: 0,
          y: 0,
          opacity: 1,
          rotate: [isFirst ? -25 : 25, isFirst ? -12 : 12, isFirst ? -5 : 5, isFirst ? 2 : -2, 0], // Level out
          scale: [0.7, 0.85, 0.95, 1.02, 1],
          boxShadow: [
            "0 -20px 40px -10px rgba(0, 0, 0, 0.2)",
            "0 10px 30px -10px rgba(0, 0, 0, 0.2)",
            "0 20px 45px -15px rgba(0, 0, 0, 0.25)",
            "0 8px 20px -8px rgba(0, 0, 0, 0.15)",
            "0 4px 12px -3px rgba(0, 0, 0, 0.08)",
          ],
        },
        exit: {
          x: isFirst ? "80%" : "-80%",
          y: "-100%",
          opacity: 0,
          rotate: isFirst ? 25 : -25,
          scale: 0.7,
          boxShadow: "0 -30px 50px -15px rgba(0, 0, 0, 0.3)",
        },
      };
    },
    getTransition: (position: number) => {
      const isFirst = position === 0;
      const baseDelay = isFirst ? 0.2 : 0.4;
      return {
        x: {
          type: "spring" as const,
          stiffness: 50,
          damping: 12,
          mass: 1,
          delay: baseDelay,
        },
        y: {
          type: "spring" as const,
          stiffness: 50,
          damping: 14,
          mass: 1,
          delay: baseDelay,
        },
        opacity: { duration: 0.4, delay: baseDelay },
        rotate: {
          duration: 1.0,
          times: [0, 0.3, 0.5, 0.75, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        scale: {
          duration: 1.0,
          times: [0, 0.3, 0.5, 0.75, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        boxShadow: {
          duration: 1.0,
          times: [0, 0.3, 0.5, 0.75, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
      };
    },
    getStyle: (position: number) => ({
      transformOrigin: position === 0 ? "right bottom" : "left bottom",
    }),
  },

  // Preset 6: "Silly Spin" - widgets spin in while scaling up
  sillySpin: {
    getVariants: (position: number) => {
      const isFirst = position === 0;
      return {
        enter: {
          scale: 0.2,
          opacity: 0,
          rotate: isFirst ? -540 : 540, // 1.5 full rotations
          y: isFirst ? -50 : 50,
          x: 0,
          boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
        },
        center: {
          scale: [0.2, 0.6, 0.9, 1.08, 1], // Grow as it spins
          opacity: 1,
          rotate: [isFirst ? -540 : 540, isFirst ? -180 : 180, isFirst ? -45 : 45, isFirst ? 10 : -10, 0], // Spin to stop
          y: [isFirst ? -50 : 50, isFirst ? -20 : 20, 0, isFirst ? -5 : 5, 0], // Wobble vertically
          x: 0,
          boxShadow: [
            "0 0 0 rgba(0, 0, 0, 0)",
            "0 15px 30px -10px rgba(0, 0, 0, 0.2)",
            "0 25px 50px -15px rgba(0, 0, 0, 0.3)",
            "0 10px 25px -8px rgba(0, 0, 0, 0.15)",
            "0 4px 12px -3px rgba(0, 0, 0, 0.08)",
          ],
        },
        exit: {
          scale: 0.2,
          opacity: 0,
          rotate: isFirst ? 360 : -360,
          y: isFirst ? 50 : -50,
          boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
        },
      };
    },
    getTransition: (position: number) => {
      const isFirst = position === 0;
      const baseDelay = isFirst ? 0.15 : 0.35;
      return {
        scale: {
          duration: 1.0,
          times: [0, 0.35, 0.6, 0.85, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        opacity: { duration: 0.3, delay: baseDelay },
        rotate: {
          duration: 1.0,
          times: [0, 0.35, 0.6, 0.85, 1],
          ease: "easeInOut" as const, // Fast start, slow end
          delay: baseDelay,
        },
        y: {
          duration: 1.0,
          times: [0, 0.35, 0.6, 0.85, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        x: { duration: 0.3, delay: baseDelay },
        boxShadow: {
          duration: 1.0,
          times: [0, 0.35, 0.6, 0.85, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
      };
    },
    getStyle: () => ({
      transformOrigin: "center center",
    }),
  },

  // Preset 7: "Trampoline Jump" - widgets bounce up from below
  trampolineJump: {
    getVariants: (position: number) => {
      const isFirst = position === 0;
      return {
        enter: {
          y: "120%",
          x: 0,
          opacity: 0,
          scale: 0.9,
          rotate: 0,
          boxShadow: "0 40px 60px -15px rgba(0, 0, 0, 0.4)",
        },
        center: {
          y: [0, -100, 0, -50, 0, -20, 0, -8, 0], // Bouncing up with decreasing height
          x: 0,
          opacity: 1,
          scale: [1.15, 0.9, 1.08, 0.95, 1.04, 0.98, 1.02, 0.99, 1], // Stretch on jump, squish on land
          rotate: [0, isFirst ? -6 : 6, 0, isFirst ? 4 : -4, 0, isFirst ? -2 : 2, 0, 0, 0], // Slight tilt on bounces
          boxShadow: [
            "0 5px 15px -5px rgba(0, 0, 0, 0.2)",
            "0 60px 80px -25px rgba(0, 0, 0, 0.5)",
            "0 5px 15px -5px rgba(0, 0, 0, 0.2)",
            "0 35px 55px -18px rgba(0, 0, 0, 0.4)",
            "0 5px 15px -5px rgba(0, 0, 0, 0.2)",
            "0 18px 35px -12px rgba(0, 0, 0, 0.3)",
            "0 5px 12px -4px rgba(0, 0, 0, 0.15)",
            "0 8px 18px -6px rgba(0, 0, 0, 0.12)",
            "0 4px 12px -3px rgba(0, 0, 0, 0.08)",
          ],
        },
        exit: {
          y: "-120%",
          opacity: 0,
          scale: 0.9,
          rotate: isFirst ? 10 : -10,
          boxShadow: "0 -30px 50px -15px rgba(0, 0, 0, 0.3)",
        },
      };
    },
    getTransition: (position: number) => {
      const isFirst = position === 0;
      const baseDelay = isFirst ? 0.2 : 0.38;
      return {
        y: {
          duration: 1.5,
          times: [0, 0.12, 0.24, 0.36, 0.48, 0.60, 0.72, 0.86, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        x: { duration: 0.3, delay: baseDelay },
        opacity: { duration: 0.2, delay: baseDelay },
        scale: {
          duration: 1.5,
          times: [0, 0.12, 0.24, 0.36, 0.48, 0.60, 0.72, 0.86, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        rotate: {
          duration: 1.5,
          times: [0, 0.12, 0.24, 0.36, 0.48, 0.60, 0.72, 0.86, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        boxShadow: {
          duration: 1.5,
          times: [0, 0.12, 0.24, 0.36, 0.48, 0.60, 0.72, 0.86, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
      };
    },
    getStyle: () => ({
      transformOrigin: "center bottom",
    }),
  },

  // Preset 8: "Crash & Recover" - widgets crash like cars, crumple dramatically, then pop back
  crashAndRecover: {
    getVariants: (position: number) => {
      const isLeft = position === 0;
      return {
        enter: {
          x: isLeft ? "-25%" : "25%", // Start visible on screen edges
          opacity: 1,
          scale: 1,
          rotate: isLeft ? -3 : 3, // Slight tilt like they're ready to race
          scaleX: 1,
          scaleY: 1,
          y: 0,
          boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.3)",
        },
        center: {
          // RACE then CRASH! Like cartoon cars colliding
          x: [
            isLeft ? "-25%" : "25%",   // Starting position (visible)
            isLeft ? "45%" : "-45%",   // ZOOM past center - BIG collision!
            isLeft ? "30%" : "-30%",   // Bounce back from impact
            isLeft ? "15%" : "-15%",   // Still recoiling
            isLeft ? "-10%" : "10%",   // Overshoot backward (whiplash!)
            0,                          // Settle to spot
            isLeft ? "-6%" : "6%",     // Shake 1
            isLeft ? "4%" : "-4%",     // Shake 2
            isLeft ? "-2%" : "2%",     // Shake 3
            0,                          // Final
          ],
          opacity: 1,
          scale: [
            1,        // Starting - ready to race
            0.7,      // CRASH! BIG impact squish!
            0.65,     // Maximum crumple
            0.75,     // Starting to recover
            0.88,     // Whiplash bounce
            0.95,     // Settling
            0.98,     // Shake
            1.15,     // POP! Inflate back (overshoot)
            1.05,     // Settling
            1,        // Normal
          ],
          scaleX: [
            1,        // Starting - normal
            1.5,      // CRASH! HUGE horizontal squish!
            1.4,      // Still very crumpled
            1.2,      // Recovering
            1.05,     // Whiplash
            1,        // Normal width
            0.95,     // Shake squish
            0.88,     // Pop - gets taller/thinner
            0.97,     // Settling
            1,        // Final
          ],
          scaleY: [
            1,        // Starting - normal
            0.65,     // CRASH! Vertical squish
            0.7,      // Crumpled
            0.8,      // Recovering
            0.95,     // Whiplash stretch
            1,        // Normal
            1.05,     // Shake stretch
            1.18,     // Pop up tall!
            1.05,     // Settling
            1,        // Final
          ],
          rotate: [
            isLeft ? -3 : 3,           // Starting - slight tilt ready to race
            isLeft ? 18 : -18,         // CRASH! BIG impact tilt!
            isLeft ? 22 : -22,         // Maximum tilt (damaged!)
            isLeft ? 10 : -10,         // Recovering
            isLeft ? -15 : 15,         // Whiplash other direction!
            isLeft ? -5 : 5,           // Settling
            isLeft ? 8 : -8,           // Shake 1
            isLeft ? -6 : 6,           // Shake 2
            isLeft ? 2 : -2,           // Shake 3
            0,                          // Straightened!
          ],
          y: [
            0,       // Starting
            35,      // CRASH! Impact slams down!
            28,      // Still compressed
            10,      // Starting to recover
            -25,     // Whiplash bounce up!
            0,       // Settling
            -10,     // Shake
            -20,     // Pop up!
            -5,      // Settling
            0,       // Final
          ],
          boxShadow: [
            "0 20px 40px -10px rgba(0, 0, 0, 0.35)",       // Starting
            "0 5px 10px -3px rgba(0, 0, 0, 0.5)",          // CRASH! Flat shadow
            "0 3px 8px -2px rgba(0, 0, 0, 0.4)",           // Crumpled
            "0 12px 25px -8px rgba(0, 0, 0, 0.35)",        // Recovering
            "0 30px 50px -15px rgba(0, 0, 0, 0.45)",       // Whiplash - high
            "0 8px 20px -5px rgba(0, 0, 0, 0.25)",         // Settling
            "0 15px 30px -8px rgba(0, 0, 0, 0.3)",         // Shake
            "0 40px 70px -18px rgba(0, 0, 0, 0.5)",        // POP! Big shadow
            "0 15px 30px -8px rgba(0, 0, 0, 0.2)",         // Settling
            "0 4px 12px -3px rgba(0, 0, 0, 0.08)",         // Final
          ],
        },
        exit: {
          x: isLeft ? "-120%" : "120%",
          opacity: 0,
          scale: 0.9,
          rotate: isLeft ? -10 : 10,
          boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.3)",
        },
      };
    },
    getTransition: (position: number) => {
      const baseDelay = 0.1; // Both start nearly together for the crash!
      // Times: [start, CRASH!, recoil1, recoil2, whiplash, settle, shake1, shake2, shake3, final]
      const times = [0, 0.15, 0.22, 0.32, 0.42, 0.55, 0.68, 0.8, 0.9, 1];
      return {
        x: {
          duration: 2.4,
          times,
          ease: "easeInOut" as const,
          delay: baseDelay,
        },
        opacity: { duration: 0.1, delay: baseDelay },
        scale: {
          duration: 2.4,
          times,
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        scaleX: {
          duration: 2.4,
          times,
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        scaleY: {
          duration: 2.4,
          times,
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        rotate: {
          duration: 2.4,
          times,
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        y: {
          duration: 2.4,
          times,
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        boxShadow: {
          duration: 2.4,
          times,
          ease: "easeOut" as const,
          delay: baseDelay,
        },
      };
    },
    getStyle: (position: number) => ({
      transformOrigin: position === 0 ? "right center" : "left center",
    }),
  },

  // Preset 9: "Jelly Wobble" - widgets wobble in like wobbly jelly/gelatin
  jellyWobble: {
    getVariants: (position: number) => {
      const isFirst = position === 0;
      return {
        enter: {
          x: isFirst ? "-100%" : "100%",
          opacity: 0,
          scaleX: 1,
          scaleY: 1,
          rotate: 0,
          y: 0,
          boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.3)",
        },
        center: {
          x: 0,
          opacity: 1,
          // Jelly wobble effect - squish and stretch
          scaleX: [1, 1.15, 0.9, 1.1, 0.95, 1.05, 0.98, 1.02, 1],
          scaleY: [1, 0.85, 1.1, 0.9, 1.05, 0.95, 1.02, 0.98, 1],
          rotate: [0, isFirst ? 3 : -3, isFirst ? -4 : 4, isFirst ? 3 : -3, isFirst ? -2 : 2, isFirst ? 1 : -1, 0, 0, 0],
          y: [0, 10, -8, 6, -4, 3, -2, 1, 0],
          boxShadow: [
            "0 20px 40px -10px rgba(0, 0, 0, 0.3)",
            "0 10px 25px -8px rgba(0, 0, 0, 0.25)",
            "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            "0 15px 30px -8px rgba(0, 0, 0, 0.28)",
            "0 20px 40px -10px rgba(0, 0, 0, 0.3)",
            "0 12px 28px -8px rgba(0, 0, 0, 0.25)",
            "0 18px 35px -10px rgba(0, 0, 0, 0.28)",
            "0 8px 20px -6px rgba(0, 0, 0, 0.2)",
            "0 4px 12px -3px rgba(0, 0, 0, 0.08)",
          ],
        },
        exit: {
          x: isFirst ? "-100%" : "100%",
          opacity: 0,
          scaleX: 0.9,
          scaleY: 1.1,
          boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.3)",
        },
      };
    },
    getTransition: (position: number) => {
      const isFirst = position === 0;
      const baseDelay = isFirst ? 0.1 : 0.25;
      return {
        x: { type: "spring" as const, stiffness: 80, damping: 15, delay: baseDelay },
        opacity: { duration: 0.3, delay: baseDelay },
        scaleX: {
          duration: 1.2,
          times: [0, 0.15, 0.28, 0.4, 0.52, 0.65, 0.78, 0.9, 1],
          ease: "easeOut" as const,
          delay: baseDelay + 0.2,
        },
        scaleY: {
          duration: 1.2,
          times: [0, 0.15, 0.28, 0.4, 0.52, 0.65, 0.78, 0.9, 1],
          ease: "easeOut" as const,
          delay: baseDelay + 0.2,
        },
        rotate: {
          duration: 1.2,
          times: [0, 0.15, 0.28, 0.4, 0.52, 0.65, 0.78, 0.9, 1],
          ease: "easeOut" as const,
          delay: baseDelay + 0.2,
        },
        y: {
          duration: 1.2,
          times: [0, 0.15, 0.28, 0.4, 0.52, 0.65, 0.78, 0.9, 1],
          ease: "easeOut" as const,
          delay: baseDelay + 0.2,
        },
        boxShadow: {
          duration: 1.2,
          times: [0, 0.15, 0.28, 0.4, 0.52, 0.65, 0.78, 0.9, 1],
          ease: "easeOut" as const,
          delay: baseDelay + 0.2,
        },
      };
    },
    getStyle: () => ({
      transformOrigin: "center center",
    }),
  },

  // Preset 10: "Rocket Launch" - widgets blast off from below
  rocketLaunch: {
    getVariants: (position: number) => {
      const isFirst = position === 0;
      return {
        enter: {
          y: "150%",
          x: 0,
          opacity: 0,
          scale: 0.8,
          rotate: 0,
          boxShadow: "0 -20px 40px -10px rgba(255, 100, 0, 0.4), 0 40px 60px -15px rgba(0, 0, 0, 0.3)",
        },
        center: {
          y: [0, -60, -20, -35, -10, -18, -5, -8, 0], // Rocket overshoot then settle
          x: 0,
          opacity: 1,
          scale: [0.9, 1.05, 0.98, 1.02, 0.99, 1.01, 1, 1, 1],
          rotate: [0, isFirst ? -3 : 3, isFirst ? 2 : -2, isFirst ? -1 : 1, 0, 0, 0, 0, 0],
          boxShadow: [
            "0 -15px 30px -8px rgba(255, 100, 0, 0.3), 0 30px 50px -15px rgba(0, 0, 0, 0.4)",
            "0 50px 80px -20px rgba(0, 0, 0, 0.5)",
            "0 25px 45px -12px rgba(0, 0, 0, 0.35)",
            "0 35px 60px -15px rgba(0, 0, 0, 0.4)",
            "0 20px 40px -10px rgba(0, 0, 0, 0.3)",
            "0 28px 50px -12px rgba(0, 0, 0, 0.35)",
            "0 15px 30px -8px rgba(0, 0, 0, 0.25)",
            "0 10px 22px -6px rgba(0, 0, 0, 0.2)",
            "0 4px 12px -3px rgba(0, 0, 0, 0.08)",
          ],
        },
        exit: {
          y: "-150%",
          opacity: 0,
          scale: 0.8,
          boxShadow: "0 20px 40px -10px rgba(255, 100, 0, 0.3), 0 -30px 50px -15px rgba(0, 0, 0, 0.3)",
        },
      };
    },
    getTransition: (position: number) => {
      const isFirst = position === 0;
      const baseDelay = isFirst ? 0.1 : 0.2;
      return {
        y: {
          duration: 1.4,
          times: [0, 0.2, 0.35, 0.48, 0.6, 0.72, 0.82, 0.92, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        x: { duration: 0.3, delay: baseDelay },
        opacity: { duration: 0.2, delay: baseDelay },
        scale: {
          duration: 1.4,
          times: [0, 0.2, 0.35, 0.48, 0.6, 0.72, 0.82, 0.92, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        rotate: {
          duration: 1.4,
          times: [0, 0.2, 0.35, 0.48, 0.6, 0.72, 0.82, 0.92, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        boxShadow: {
          duration: 1.4,
          times: [0, 0.2, 0.35, 0.48, 0.6, 0.72, 0.82, 0.92, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
      };
    },
    getStyle: () => ({
      transformOrigin: "center bottom",
    }),
  },

  // Preset 11: "Swing In" - widgets swing in like a pendulum
  swingIn: {
    getVariants: (position: number) => {
      const isFirst = position === 0;
      return {
        enter: {
          rotate: isFirst ? -90 : 90, // Start rotated up like hanging
          opacity: 0,
          scale: 0.9,
          x: 0,
          y: -50,
          boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.4)",
        },
        center: {
          rotate: [isFirst ? -90 : 90, isFirst ? 25 : -25, isFirst ? -15 : 15, isFirst ? 8 : -8, isFirst ? -4 : 4, isFirst ? 2 : -2, 0],
          opacity: 1,
          scale: [0.9, 1.02, 0.98, 1.01, 0.99, 1, 1],
          x: 0,
          y: [0, 20, -10, 8, -4, 2, 0],
          boxShadow: [
            "0 30px 60px -15px rgba(0, 0, 0, 0.4)",
            "0 15px 35px -10px rgba(0, 0, 0, 0.3)",
            "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            "0 12px 28px -8px rgba(0, 0, 0, 0.25)",
            "0 18px 38px -10px rgba(0, 0, 0, 0.28)",
            "0 8px 20px -6px rgba(0, 0, 0, 0.2)",
            "0 4px 12px -3px rgba(0, 0, 0, 0.08)",
          ],
        },
        exit: {
          rotate: isFirst ? 90 : -90,
          opacity: 0,
          scale: 0.9,
          y: -50,
          boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.4)",
        },
      };
    },
    getTransition: (position: number) => {
      const isFirst = position === 0;
      const baseDelay = isFirst ? 0.15 : 0.35;
      return {
        rotate: {
          duration: 1.5,
          times: [0, 0.25, 0.42, 0.58, 0.72, 0.86, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        opacity: { duration: 0.3, delay: baseDelay },
        scale: {
          duration: 1.5,
          times: [0, 0.25, 0.42, 0.58, 0.72, 0.86, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        x: { duration: 0.3, delay: baseDelay },
        y: {
          duration: 1.5,
          times: [0, 0.25, 0.42, 0.58, 0.72, 0.86, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        boxShadow: {
          duration: 1.5,
          times: [0, 0.25, 0.42, 0.58, 0.72, 0.86, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
      };
    },
    getStyle: (position: number) => ({
      transformOrigin: position === 0 ? "left top" : "right top",
    }),
  },

  // Preset 12: "Tumble In" - widgets roll/tumble in from sides
  tumbleIn: {
    getVariants: (position: number) => {
      const isFirst = position === 0;
      return {
        enter: {
          x: isFirst ? "-120%" : "120%",
          rotate: isFirst ? -360 : 360, // Full rotation while coming in
          opacity: 0,
          scale: 0.8,
          y: 50,
          boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.4)",
        },
        center: {
          x: 0,
          rotate: [isFirst ? -360 : 360, isFirst ? -20 : 20, isFirst ? 10 : -10, isFirst ? -5 : 5, 0],
          opacity: 1,
          scale: [0.85, 1.05, 0.97, 1.02, 1],
          y: [30, -15, 8, -3, 0],
          boxShadow: [
            "0 30px 60px -15px rgba(0, 0, 0, 0.45)",
            "0 20px 45px -12px rgba(0, 0, 0, 0.35)",
            "0 12px 30px -8px rgba(0, 0, 0, 0.28)",
            "0 8px 20px -6px rgba(0, 0, 0, 0.2)",
            "0 4px 12px -3px rgba(0, 0, 0, 0.08)",
          ],
        },
        exit: {
          x: isFirst ? "120%" : "-120%",
          rotate: isFirst ? 360 : -360,
          opacity: 0,
          scale: 0.8,
          y: 50,
          boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.4)",
        },
      };
    },
    getTransition: (position: number) => {
      const isFirst = position === 0;
      const baseDelay = isFirst ? 0.1 : 0.25;
      return {
        x: { type: "spring" as const, stiffness: 60, damping: 14, delay: baseDelay },
        rotate: {
          duration: 1.2,
          times: [0, 0.4, 0.6, 0.8, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        opacity: { duration: 0.25, delay: baseDelay },
        scale: {
          duration: 1.2,
          times: [0, 0.4, 0.6, 0.8, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        y: {
          duration: 1.2,
          times: [0, 0.4, 0.6, 0.8, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        boxShadow: {
          duration: 1.2,
          times: [0, 0.4, 0.6, 0.8, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
      };
    },
    getStyle: () => ({
      transformOrigin: "center center",
    }),
  },

  // Preset 13: "Balloon Float" - widgets float up gently like balloons
  balloonFloat: {
    getVariants: (position: number) => {
      const isFirst = position === 0;
      return {
        enter: {
          y: "120%",
          x: isFirst ? -30 : 30,
          opacity: 0,
          scale: 0.9,
          rotate: isFirst ? -8 : 8,
          boxShadow: "0 -10px 30px -5px rgba(0, 0, 0, 0.2)",
        },
        center: {
          y: [0, -25, -8, -15, -3, -8, 0], // Gentle floating motion
          x: [isFirst ? -15 : 15, isFirst ? 10 : -10, isFirst ? -8 : 8, isFirst ? 5 : -5, isFirst ? -3 : 3, 0, 0],
          opacity: 1,
          scale: [0.95, 1.03, 0.98, 1.01, 0.99, 1, 1],
          rotate: [isFirst ? -5 : 5, isFirst ? 4 : -4, isFirst ? -3 : 3, isFirst ? 2 : -2, isFirst ? -1 : 1, 0, 0],
          boxShadow: [
            "0 -8px 25px -5px rgba(0, 0, 0, 0.15)",
            "0 20px 45px -12px rgba(0, 0, 0, 0.3)",
            "0 10px 30px -8px rgba(0, 0, 0, 0.22)",
            "0 15px 38px -10px rgba(0, 0, 0, 0.26)",
            "0 8px 22px -6px rgba(0, 0, 0, 0.18)",
            "0 6px 18px -5px rgba(0, 0, 0, 0.14)",
            "0 4px 12px -3px rgba(0, 0, 0, 0.08)",
          ],
        },
        exit: {
          y: "-120%",
          x: isFirst ? 30 : -30,
          opacity: 0,
          scale: 0.9,
          rotate: isFirst ? 8 : -8,
          boxShadow: "0 30px 50px -15px rgba(0, 0, 0, 0.3)",
        },
      };
    },
    getTransition: (position: number) => {
      const isFirst = position === 0;
      const baseDelay = isFirst ? 0.15 : 0.35;
      return {
        y: {
          duration: 2.0,
          times: [0, 0.2, 0.38, 0.55, 0.72, 0.88, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        x: {
          duration: 2.0,
          times: [0, 0.2, 0.38, 0.55, 0.72, 0.88, 1],
          ease: "easeInOut" as const,
          delay: baseDelay,
        },
        opacity: { duration: 0.4, delay: baseDelay },
        scale: {
          duration: 2.0,
          times: [0, 0.2, 0.38, 0.55, 0.72, 0.88, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
        rotate: {
          duration: 2.0,
          times: [0, 0.2, 0.38, 0.55, 0.72, 0.88, 1],
          ease: "easeInOut" as const,
          delay: baseDelay,
        },
        boxShadow: {
          duration: 2.0,
          times: [0, 0.2, 0.38, 0.55, 0.72, 0.88, 1],
          ease: "easeOut" as const,
          delay: baseDelay,
        },
      };
    },
    getStyle: () => ({
      transformOrigin: "center center",
    }),
  },
};

// ============================================
// COMPONENT
// ============================================

export function WidgetCarousel({
  widgets,
  theme,
  rotationInterval = 30000,
  animationPreset = "arrivingTogether",
}: WidgetCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const preset = animationPresets[animationPreset];

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

  const triggerRotation = useCallback(() => {
    if (widgets.length <= 2) return;
    const nextIndex = (currentIndex + 1) % widgets.length;
    setCurrentIndex(nextIndex);
    setVisibleIndices(getVisibleIndices(nextIndex));
  }, [currentIndex, widgets.length, getVisibleIndices]);

  useEffect(() => {
    if (widgets.length <= 2) return;
    const interval = setInterval(triggerRotation, rotationInterval);
    return () => clearInterval(interval);
  }, [rotationInterval, widgets.length, triggerRotation]);

  // Check if this preset needs center-line clipping (for crash animations)
  const needsClipping = animationPreset === "crashAndRecover";

  return (
    <div className="relative w-full overflow-hidden py-4">
      <div className={`grid grid-cols-2 ${needsClipping ? "gap-0" : "gap-6 lg:gap-8"}`}>
        <AnimatePresence mode="popLayout">
          {visibleIndices.map((widgetIndex, position) => (
            <div
              key={`clip-${widgetIndex}-${currentIndex}`}
              className="overflow-hidden"
              style={needsClipping ? {
                // Add padding to replace gap, but allow overflow toward center
                paddingLeft: position === 0 ? "12px" : "0",
                paddingRight: position === 0 ? "0" : "12px",
              } : undefined}
            >
              <motion.div
                key={`widget-${widgetIndex}-${currentIndex}`}
                variants={preset.getVariants(position)}
                initial="enter"
                animate="center"
                exit="exit"
                transition={preset.getTransition(position)}
                className="min-h-[400px] rounded-3xl will-change-transform"
                style={preset.getStyle(position)}
              >
                {widgets[widgetIndex].component}
              </motion.div>
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Progress indicator dots - clickable */}
      <div className="flex justify-center gap-3 mt-8">
        {widgets.map((widget, index) => {
          const isVisible = visibleIndices.includes(index);
          return (
            <motion.button
              key={widget.id}
              className="relative p-2 -m-2 cursor-pointer"
              animate={{ scale: isVisible ? 1 : 0.8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              onClick={() => {
                setCurrentIndex(index);
                setVisibleIndices(getVisibleIndices(index));
              }}
              aria-label={`Go to ${widget.name}`}
            >
              <div
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  isVisible ? "bg-white shadow-lg shadow-white/30" : "bg-white/30 hover:bg-white/50"
                }`}
              />
              {isVisible && (
                <motion.div
                  className="absolute inset-2 rounded-full bg-white/50"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
