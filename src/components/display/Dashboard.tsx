"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getThemeForTime, getNextThemeChange, Theme } from "@/lib/theme";
import { DynamicBackground } from "./DynamicBackground";
import { Clock } from "./Clock";
import { WeatherDisplay } from "./WeatherDisplay";
import { CalendarDisplay } from "./CalendarDisplay";
import { ChoreBoard } from "./ChoreBoard";
import { PointsDisplay } from "./PointsDisplay";
import { TasksDisplay } from "./TasksDisplay";
import { ShoppingDisplay } from "./ShoppingDisplay";
import { HabitsDisplay } from "./HabitsDisplay";
import { ScheduleDisplay } from "./ScheduleDisplay";
import { MealPlanDisplay } from "./MealPlanDisplay";
import { WidgetCarousel, AnimationPreset, ANIMATION_PRESETS } from "./WidgetCarousel";
import { PhotoScreensaver } from "./PhotoScreensaver";

export function Dashboard() {
  const [theme, setTheme] = useState<Theme>(getThemeForTime());
  const [carouselInterval, setCarouselInterval] = useState(30000); // Default 30s
  const [animationPreset, setAnimationPreset] = useState<AnimationPreset>("arrivingTogether");
  const [cycleIndex, setCycleIndex] = useState(0);

  // Header display settings
  const [headerMode, setHeaderMode] = useState<"clock" | "weather" | "alternate">("clock");
  const [headerAlternateInterval, setHeaderAlternateInterval] = useState(30);
  const [showClock, setShowClock] = useState(true);

  // Screensaver settings
  const [screensaverEnabled, setScreensaverEnabled] = useState(false);
  const [screensaverStartHour, setScreensaverStartHour] = useState(18);
  const [screensaverEndHour, setScreensaverEndHour] = useState(23);
  const [screensaverInterval, setScreensaverInterval] = useState(15);
  const [isScreensaverActive, setIsScreensaverActive] = useState(false);

  // Cycle through presets every 5 minutes when "cycle" is selected
  useEffect(() => {
    if (animationPreset !== "cycle") return;

    const cycleInterval = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % ANIMATION_PRESETS.length);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(cycleInterval);
  }, [animationPreset]);

  // Get the active preset (handles cycling)
  const activePreset: Exclude<AnimationPreset, "cycle"> =
    animationPreset === "cycle"
      ? ANIMATION_PRESETS[cycleIndex]
      : (animationPreset as Exclude<AnimationPreset, "cycle">);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.settings?.carouselInterval) {
          setCarouselInterval(data.settings.carouselInterval * 1000); // Convert to ms
        }
        if (data.settings?.carouselAnimation) {
          setAnimationPreset(data.settings.carouselAnimation as AnimationPreset);
        }
        // Header mode settings
        if (data.settings?.headerMode) {
          setHeaderMode(data.settings.headerMode);
        }
        if (data.settings?.headerAlternateInterval) {
          setHeaderAlternateInterval(data.settings.headerAlternateInterval);
        }
        // Screensaver settings
        if (data.settings?.screensaverEnabled !== undefined) {
          setScreensaverEnabled(data.settings.screensaverEnabled);
        }
        if (data.settings?.screensaverStartHour !== undefined) {
          setScreensaverStartHour(data.settings.screensaverStartHour);
        }
        if (data.settings?.screensaverEndHour !== undefined) {
          setScreensaverEndHour(data.settings.screensaverEndHour);
        }
        if (data.settings?.screensaverInterval !== undefined) {
          setScreensaverInterval(data.settings.screensaverInterval);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();

    // Refetch settings every 5 minutes to pick up changes
    const interval = setInterval(fetchSettings, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle header mode alternation
  useEffect(() => {
    if (headerMode !== "alternate") {
      setShowClock(headerMode === "clock");
      return;
    }

    // Alternate between clock and weather
    const timer = setInterval(() => {
      setShowClock((prev) => !prev);
    }, headerAlternateInterval * 1000);

    return () => clearInterval(timer);
  }, [headerMode, headerAlternateInterval]);

  // Check if screensaver should be active
  const checkScreensaverActive = useCallback(() => {
    if (!screensaverEnabled) {
      setIsScreensaverActive(false);
      return;
    }

    const currentHour = new Date().getHours();

    // Handle time ranges that span midnight
    if (screensaverStartHour <= screensaverEndHour) {
      // Normal range (e.g., 18-23)
      setIsScreensaverActive(currentHour >= screensaverStartHour && currentHour < screensaverEndHour);
    } else {
      // Spans midnight (e.g., 22-6)
      setIsScreensaverActive(currentHour >= screensaverStartHour || currentHour < screensaverEndHour);
    }
  }, [screensaverEnabled, screensaverStartHour, screensaverEndHour]);

  // Check screensaver status on settings change and every minute
  useEffect(() => {
    checkScreensaverActive();
    const timer = setInterval(checkScreensaverActive, 60000);
    return () => clearInterval(timer);
  }, [checkScreensaverActive]);

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

  // Define widgets for the carousel
  const widgets = useMemo(
    () => [
      {
        id: "calendar",
        name: "Calendar",
        component: <CalendarDisplay theme={theme} />,
      },
      {
        id: "schedule",
        name: "Schedule",
        component: <ScheduleDisplay theme={theme} />,
      },
      {
        id: "chores",
        name: "Chores",
        component: <ChoreBoard theme={theme} />,
      },
      {
        id: "habits",
        name: "Habits",
        component: <HabitsDisplay theme={theme} />,
      },
      {
        id: "tasks",
        name: "Tasks",
        component: <TasksDisplay theme={theme} />,
      },
      {
        id: "shopping",
        name: "Shopping",
        component: <ShoppingDisplay theme={theme} />,
      },
      {
        id: "mealplan",
        name: "Meals",
        component: <MealPlanDisplay theme={theme} />,
      },
      {
        id: "points",
        name: "Points",
        component: <PointsDisplay theme={theme} />,
      },
    ],
    [theme]
  );

  // Main dashboard content
  const dashboardContent = (
    <DynamicBackground theme={theme}>
      <div className="min-h-screen p-8 lg:p-12 flex flex-col">
        {/* Header with Clock or Weather */}
        <motion.header
          className="mb-8 lg:mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <AnimatePresence mode="wait">
            {showClock ? (
              <motion.div
                key="clock"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
              >
                <Clock className={theme.textPrimary} />
              </motion.div>
            ) : (
              <motion.div
                key="weather"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
              >
                <WeatherDisplay className={theme.textPrimary} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Widget Carousel */}
        <div className="flex-1 flex items-center">
          <div className="w-full">
            <WidgetCarousel
              widgets={widgets}
              theme={theme}
              rotationInterval={carouselInterval}
              animationPreset={activePreset}
            />
          </div>
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

  // Wrap in screensaver if active
  if (isScreensaverActive) {
    return (
      <PhotoScreensaver photoInterval={screensaverInterval}>
        {dashboardContent}
      </PhotoScreensaver>
    );
  }

  return dashboardContent;
}
