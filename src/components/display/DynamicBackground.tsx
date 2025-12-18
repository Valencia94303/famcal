"use client";

import { motion } from "framer-motion";
import { Theme } from "@/lib/theme";

interface DynamicBackgroundProps {
  theme: Theme;
  children: React.ReactNode;
}

export function DynamicBackground({ theme, children }: DynamicBackgroundProps) {
  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden bg-gradient-to-br ${theme.background}`}
    >
      {/* Animated gradient orbs for visual interest */}
      <motion.div
        className={`absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br ${theme.backgroundSecondary} blur-3xl opacity-60`}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className={`absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-to-tr ${theme.backgroundSecondary} blur-3xl opacity-50`}
        animate={{
          x: [0, -30, 0],
          y: [0, -50, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className={`absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r ${theme.backgroundSecondary} blur-3xl opacity-30`}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
