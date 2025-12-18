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
  city: string | null;
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

// Temperature colormap: blue (cold) → cyan → green → yellow → orange → red (hot)
function getTempColor(temp: number): string {
  // Define temperature ranges and colors (Fahrenheit)
  if (temp <= 20) return "#3B82F6"; // Blue - freezing
  if (temp <= 32) return "#06B6D4"; // Cyan - very cold
  if (temp <= 50) return "#22D3EE"; // Light cyan - cold
  if (temp <= 60) return "#10B981"; // Green - cool
  if (temp <= 70) return "#84CC16"; // Lime - comfortable
  if (temp <= 80) return "#EAB308"; // Yellow - warm
  if (temp <= 90) return "#F97316"; // Orange - hot
  return "#EF4444"; // Red - very hot
}

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
      <div className={`flex flex-col text-gray-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${className}`}>
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
      <div className={`flex flex-col text-gray-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${className}`}>
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
  const tempColor = getTempColor(weather.temp);
  const highColor = getTempColor(weather.high);
  const lowColor = getTempColor(weather.low);

  return (
    <div className={`flex flex-col drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${className}`}>
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
          <span
            className="text-[12vw] font-bold leading-none tracking-tight"
            style={{ color: tempColor }}
          >
            {weather.temp}
          </span>
          <span className="text-[4vw] font-semibold text-gray-300">°F</span>
        </div>
      </motion.div>
      <motion.div
        className="flex items-center gap-4 mt-2 text-gray-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {weather.city && (
          <p className="text-[2.5vw] font-semibold text-white">
            {weather.city}
          </p>
        )}
        <p className="text-[2.5vw] font-medium">
          {weather.condition}
        </p>
        <span className="text-[2vw] font-medium">
          H: <span style={{ color: highColor }}>{weather.high}°</span> L: <span style={{ color: lowColor }}>{weather.low}°</span>
        </span>
      </motion.div>
    </div>
  );
}
