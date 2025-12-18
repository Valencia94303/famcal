"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface ClockProps {
  className?: string;
}

export function Clock({ className = "" }: ClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = format(time, "h");
  const minutes = format(time, "mm");
  const ampm = format(time, "a");
  const dateStr = format(time, "EEEE, MMMM d");

  return (
    <div className={`flex flex-col ${className}`}>
      <motion.div
        className="flex items-baseline gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <span className="text-[12vw] font-bold leading-none tracking-tight">
          {hours}
        </span>
        <motion.span
          className="text-[12vw] font-bold leading-none tracking-tight"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        >
          :
        </motion.span>
        <span className="text-[12vw] font-bold leading-none tracking-tight">
          {minutes}
        </span>
        <span className="text-[4vw] font-semibold uppercase tracking-wide opacity-70">
          {ampm}
        </span>
      </motion.div>
      <motion.p
        className="text-[2.5vw] font-medium opacity-80 mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {dateStr}
      </motion.p>
    </div>
  );
}
