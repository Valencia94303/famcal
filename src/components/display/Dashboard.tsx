"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getThemeForTime, getNextThemeChange, Theme } from "@/lib/theme";
import { DynamicBackground } from "./DynamicBackground";
import { Clock } from "./Clock";
import { CalendarDisplay } from "./CalendarDisplay";
import { ChoreBoard } from "./ChoreBoard";
import { PointsDisplay } from "./PointsDisplay";

export function Dashboard() {
  const [theme, setTheme] = useState<Theme>(getThemeForTime());

  // Update theme when time changes
  useEffect(() => {
    const checkTheme = () => {
      const newTheme = getThemeForTime();
      if (newTheme.name !== theme.name) {
        setTheme(newTheme);
      }
    };

    // Check every minute
    const interval = setInterval(checkTheme, 60000);

    // Also set a timeout for the next theme change
    const nextChange = getNextThemeChange();
    const msUntilChange = nextChange.getTime() - Date.now();
    const timeout = setTimeout(checkTheme, msUntilChange);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [theme.name]);

  return (
    <DynamicBackground theme={theme}>
      <div className="min-h-screen p-8 lg:p-12">
        {/* Header with Clock */}
        <motion.header
          className="mb-8 lg:mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Clock className={theme.textPrimary} />
        </motion.header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Calendar Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <CalendarDisplay theme={theme} />
          </motion.div>

          {/* Chores Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col gap-6"
          >
            <ChoreBoard theme={theme} />

            {/* Points Leaderboard */}
            <PointsDisplay theme={theme} />
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          className={`mt-8 lg:mt-12 text-center ${theme.textMuted}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-[1vw]">FamCal Family Dashboard</p>
        </motion.footer>
      </div>
    </DynamicBackground>
  );
}
