"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface WeatherDisplayProps {
  className?: string;
}

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  isDay: boolean;
  high: number;
  low: number;
}

// Map weather icon names to emojis
const WEATHER_ICONS: Record<string, string> = {
  sun: "☀️",
  "cloud-sun": "🌤️",
  cloud: "☁️",
  "cloud-fog": "🌫️",
  "cloud-drizzle": "🌧️",
  "cloud-rain": "🌧️",
  "cloud-snow": "❄️",
  "cloud-sun-rain": "🌦️",
  "cloud-lightning": "⛈️",
};

// Night variants
const WEATHER_ICONS_NIGHT: Record<string, string> = {
  sun: "🌙",
  "cloud-sun": "☁️",
  cloud: "☁️",
  "cloud-fog": "🌫️",
  "cloud-drizzle": "🌧️",
  "cloud-rain": "🌧️",
  "cloud-snow": "❄️",
  "cloud-sun-rain": "🌧️",
  "cloud-lightning": "⛈️",
};

export function WeatherDisplay({ className = "" }: WeatherDisplayProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to fetch weather");
          return;
        }
        const data = await res.json();
        setWeather(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching weather:", err);
        setError("Failed to fetch weather");
      }
    };

    fetchWeather();
    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className={`flex flex-col ${className}`}>
        <motion.div
          className="flex items-baseline gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="text-[8vw] font-bold leading-none tracking-tight">
            --°
          </span>
        </motion.div>
        <motion.p
          className="text-[2.5vw] font-medium opacity-80 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Weather unavailable
        </motion.p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className={`flex flex-col ${className}`}>
        <motion.div
          className="flex items-baseline gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[8vw] font-bold leading-none tracking-tight opacity-50">
            ...
          </span>
        </motion.div>
      </div>
    );
  }

  const icons = weather.isDay ? WEATHER_ICONS : WEATHER_ICONS_NIGHT;
  const weatherIcon = icons[weather.icon] || "🌡️";

  return (
    <div className={`flex flex-col ${className}`}>
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.span
          className="text-[10vw] leading-none"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {weatherIcon}
        </motion.span>
        <div className="flex items-baseline">
          <span className="text-[12vw] font-bold leading-none tracking-tight">
            {weather.temp}
          </span>
          <span className="text-[4vw] font-semibold opacity-70">°F</span>
        </div>
      </motion.div>
      <motion.div
        className="flex items-center gap-4 mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <p className="text-[2.5vw] font-medium">
          {weather.condition}
        </p>
        <span className="text-[2vw] font-medium opacity-60">
          H: {weather.high}° L: {weather.low}°
        </span>
      </motion.div>
    </div>
  );
}
