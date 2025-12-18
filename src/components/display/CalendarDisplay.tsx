"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Theme } from "@/lib/theme";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  allDay?: boolean;
  color?: string;
  location?: string;
}

interface CalendarDisplayProps {
  theme: Theme;
}

// Demo events shown when calendar is not connected
const demoEvents: CalendarEvent[] = [
  { id: "1", title: "Morning Yoga", startTime: "7:00 AM", color: "#10b981" },
  { id: "2", title: "School Drop-off", startTime: "8:15 AM", color: "#6366f1" },
  { id: "3", title: "Team Meeting", startTime: "10:00 AM", endTime: "11:00 AM", color: "#f59e0b" },
  { id: "4", title: "Soccer Practice", startTime: "4:00 PM", color: "#ec4899" },
  { id: "5", title: "Family Dinner", startTime: "6:30 PM", color: "#8b5cf6" },
];

// Color palette for events without colors
const eventColors = [
  "#6366f1", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6",
  "#ef4444", "#06b6d4", "#84cc16", "#f97316", "#14b8a6",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

function formatEventTime(startTime: string | Date, endTime?: string | Date, allDay?: boolean): string {
  if (allDay) return "All Day";

  try {
    const start = typeof startTime === "string" ? new Date(startTime) : startTime;
    const formattedStart = format(start, "h:mm a");

    if (endTime) {
      const end = typeof endTime === "string" ? new Date(endTime) : endTime;
      return `${formattedStart} - ${format(end, "h:mm a")}`;
    }

    return formattedStart;
  } catch {
    return String(startTime);
  }
}

export function CalendarDisplay({ theme }: CalendarDisplayProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(demoEvents);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    // Refresh events every 5 minutes
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/calendar/events");
      const data = await res.json();

      if (data.connected && data.events.length > 0) {
        setIsConnected(true);
        setEvents(
          data.events.map((event: CalendarEvent, index: number) => ({
            ...event,
            color: event.color || eventColors[index % eventColors.length],
          }))
        );
      } else {
        setIsConnected(false);
        setEvents(demoEvents);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setIsConnected(false);
      setEvents(demoEvents);
    }
    setIsLoading(false);
  };

  return (
    <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10 h-full`}>
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className={`text-[2vw] font-bold ${theme.textPrimary}`}>
          Upcoming Events
        </h2>
        {!isConnected && !isLoading && (
          <a
            href="/setup"
            className="text-[1vw] px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
          >
            Connect Calendar
          </a>
        )}
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <motion.div
            className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      ) : (
        <motion.div
          className="space-y-3 overflow-y-auto max-h-[50vh] hide-scrollbar"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {events.length === 0 ? (
              <motion.p
                key="no-events"
                className={`text-[1.5vw] ${theme.textMuted} py-4`}
                variants={itemVariants}
              >
                No upcoming events
              </motion.p>
            ) : (
              events.map((event) => (
                <motion.div
                  key={event.id}
                  variants={itemVariants}
                  layout
                  className="flex items-center gap-4 group"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div
                    className="w-1.5 h-12 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color || theme.accent }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[1.4vw] font-semibold ${theme.textPrimary} truncate`}>
                      {event.title}
                    </p>
                    <p className={`text-[1.1vw] ${theme.textMuted}`}>
                      {formatEventTime(event.startTime, event.endTime, event.allDay)}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {!isConnected && !isLoading && (
        <motion.p
          className={`text-[0.9vw] ${theme.textMuted} mt-4 text-center italic`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Showing demo events • Connect Google Calendar for real data
        </motion.p>
      )}
    </div>
  );
}
