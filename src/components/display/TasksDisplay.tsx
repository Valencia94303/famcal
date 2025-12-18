"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Theme } from "@/lib/theme";
import { AutoScroll } from "./AutoScroll";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string | null;
  dueDate: string | null;
  recurrence: string | null;
}

interface TasksDisplayProps {
  theme: Theme;
}

export function TasksDisplay({ theme }: TasksDisplayProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    // Refresh every 2 minutes
    const interval = setInterval(fetchTasks, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks?showCompleted=false");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
    setIsLoading(false);
  };

  const getPriorityIcon = (priority: string | null) => {
    switch (priority) {
      case "HIGH":
        return { emoji: "⏫", color: "text-red-500" };
      case "MEDIUM":
        return { emoji: "🔼", color: "text-yellow-500" };
      case "LOW":
        return { emoji: "🔽", color: "text-blue-500" };
      default:
        return null;
    }
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset time for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const dueDay = new Date(date);
    dueDay.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "Overdue", urgent: true };
    if (diffDays === 0) return { text: "Today", urgent: true };
    if (diffDays === 1) return { text: "Tomorrow", urgent: false };
    if (diffDays <= 7) return { text: `${diffDays} days`, urgent: false };
    return { text: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), urgent: false };
  };

  if (isLoading) {
    return (
      <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}>
        <h2 className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}>
          Grumpy's To-Do List
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

  if (tasks.length === 0) {
    return (
      <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}>
        <h2 className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}>
          Grumpy's To-Do List
        </h2>
        <p className={`text-[1.2vw] ${theme.textMuted} text-center py-4`}>
          All caught up! No pending tasks.
        </p>
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
        Grumpy's To-Do List
      </motion.h2>

      <AutoScroll maxHeight="45vh" duration={20}>
        <div className="space-y-3">
          {tasks.map((task, index) => {
            const priority = getPriorityIcon(task.priority);
            const dueInfo = formatDueDate(task.dueDate);

            return (
              <motion.div
                key={task.id}
                className={`flex items-center gap-4 p-3 rounded-xl ${
                  theme.name === "night" ? "bg-slate-800/50" : "bg-white/50"
                }`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Checkbox circle */}
                <div
                  className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${
                    theme.name === "night" ? "border-slate-500" : "border-slate-300"
                  }`}
                />

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {priority && (
                      <span className={`text-[1.2vw] ${priority.color}`}>
                        {priority.emoji}
                      </span>
                    )}
                    <span className={`text-[1.3vw] font-medium ${theme.textPrimary} truncate`}>
                      {task.title}
                    </span>
                  </div>
                  {task.recurrence && (
                    <span className={`text-[0.9vw] ${theme.textMuted}`}>
                      🔁 {task.recurrence}
                    </span>
                  )}
                </div>

                {/* Due date */}
                {dueInfo && (
                  <div
                    className={`text-[1.1vw] font-medium px-3 py-1 rounded-full ${
                      dueInfo.urgent
                        ? "bg-red-500/20 text-red-500"
                        : theme.name === "night"
                        ? "bg-slate-700 text-slate-300"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {dueInfo.text}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </AutoScroll>
    </div>
  );
}
