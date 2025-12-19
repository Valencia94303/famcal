"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Theme } from "@/lib/theme";
import { AutoScroll } from "./AutoScroll";

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  icon: string | null;
  days: string | null;
}

interface ScheduleDisplayProps {
  theme: Theme;
}

const DAY_MAP: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

export function ScheduleDisplay({ theme }: ScheduleDisplayProps) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/schedule");
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Error fetching schedule:", error);
    }
    setIsLoading(false);
  };

  const isActiveToday = (item: ScheduleItem): boolean => {
    if (!item.days) return true; // No days specified = every day
    try {
      const days = JSON.parse(item.days) as string[];
      const today = currentTime.getDay();
      return days.some((d) => DAY_MAP[d] === today);
    } catch {
      return true;
    }
  };

  const getItemStatus = (item: ScheduleItem): "past" | "current" | "upcoming" => {
    const [hours, minutes] = item.time.split(":").map(Number);
    const itemMinutes = hours * 60 + minutes;
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    if (itemMinutes < nowMinutes - 30) return "past";
    if (itemMinutes <= nowMinutes + 30) return "current";
    return "upcoming";
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  // Filter out items more than 4 hours past
  const isNotTooOld = (item: ScheduleItem): boolean => {
    const [hours, minutes] = item.time.split(":").map(Number);
    const itemMinutes = hours * 60 + minutes;
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const fourHoursAgo = nowMinutes - 240; // 4 hours = 240 minutes
    return itemMinutes >= fourHoursAgo;
  };

  const todayItems = items
    .filter(isActiveToday)
    .filter(isNotTooOld)
    .sort((a, b) => a.time.localeCompare(b.time));

  if (isLoading) {
    return (
      <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}>
        <h2 className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}>
          Today's Schedule
        </h2>
        <div className="flex justify-center py-4">
          <motion.div
            className="w-6 h-6 border-3 border-indigo-200 border-t-indigo-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    );
  }

  if (todayItems.length === 0) {
    return (
      <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}>
        <h2 className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}>
          Today's Schedule
        </h2>
        <div className="flex flex-col items-center justify-center py-8">
          <span className="text-[3vw] mb-3">🗓️</span>
          <p className={`text-[1.2vw] ${theme.textMuted} text-center`}>
            No scheduled activities for today
          </p>
          <p className={`text-[0.9vw] ${theme.textMuted} text-center mt-1`}>
            Enjoy your free time!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}>
      <motion.h2
        className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Today's Schedule
      </motion.h2>

      <AutoScroll maxHeight="45vh" duration={20}>
        <div className="space-y-2">
          {todayItems.map((item, index) => {
            const status = getItemStatus(item);
            return (
              <motion.div
                key={item.id}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  status === "current"
                    ? "bg-indigo-500/20 ring-2 ring-indigo-500"
                    : status === "past"
                    ? `opacity-50 ${theme.name === "night" ? "bg-slate-800/30" : "bg-slate-100/50"}`
                    : theme.name === "night"
                    ? "bg-slate-800/50"
                    : "bg-white/50"
                }`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="text-[1.8vw]">{item.icon || "📌"}</span>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-[1.2vw] font-medium ${
                      status === "past"
                        ? theme.textMuted
                        : status === "current"
                        ? "text-indigo-600"
                        : theme.textPrimary
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
                <span
                  className={`text-[1vw] font-medium px-2 py-1 rounded-lg ${
                    status === "current"
                      ? "bg-indigo-500 text-white"
                      : status === "past"
                      ? `${theme.name === "night" ? "bg-slate-700" : "bg-slate-200"} ${theme.textMuted}`
                      : `${theme.name === "night" ? "bg-slate-700" : "bg-slate-200"} ${theme.textSecondary}`
                  }`}
                >
                  {formatTime(item.time)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </AutoScroll>
    </div>
  );
}
