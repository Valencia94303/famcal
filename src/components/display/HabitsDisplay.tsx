"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Theme } from "@/lib/theme";
import { AutoScroll } from "./AutoScroll";

interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

interface HabitLog {
  familyMemberId: string;
  familyMember: FamilyMember;
}

interface Habit {
  id: string;
  name: string;
  icon: string | null;
  points: number;
  logs: HabitLog[];
}

interface HabitsDisplayProps {
  theme: Theme;
}

export function HabitsDisplay({ theme }: HabitsDisplayProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [children, setChildren] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [habitsRes, familyRes] = await Promise.all([
        fetch(`/api/habits?date=${today}`),
        fetch("/api/family"),
      ]);
      const habitsData = await habitsRes.json();
      const familyData = await familyRes.json();

      setHabits(habitsData.habits || []);
      setChildren(
        (familyData.members || []).filter(
          (m: { role: string }) => m.role === "CHILD"
        )
      );
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}>
        <h2 className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}>
          Today's Habits
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

  if (habits.length === 0 || children.length === 0) {
    return null;
  }

  return (
    <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}>
      <motion.h2
        className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Today's Habits
      </motion.h2>

      <AutoScroll maxHeight="45vh" duration={20}>
        <div className="space-y-4">
          {children.map((child, childIdx) => {
          const completedCount = habits.filter((h) =>
            h.logs.some((l) => l.familyMemberId === child.id)
          ).length;
          const totalHabits = habits.length;
          const progress = Math.round((completedCount / totalHabits) * 100);

          return (
            <motion.div
              key={child.id}
              className={`p-4 rounded-2xl ${
                theme.name === "night" ? "bg-slate-800/50" : "bg-white/50"
              }`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: childIdx * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[1vw]"
                  style={{ backgroundColor: child.color }}
                >
                  {child.avatar || child.name[0]}
                </div>
                <span className={`text-[1.3vw] font-semibold ${theme.textPrimary}`}>
                  {child.name}
                </span>
                <span className={`text-[1vw] ${theme.textMuted} ml-auto`}>
                  {completedCount}/{totalHabits}
                </span>
              </div>

              {/* Progress bar */}
              <div
                className={`h-3 rounded-full overflow-hidden ${
                  theme.name === "night" ? "bg-slate-700" : "bg-slate-200"
                }`}
              >
                <motion.div
                  className={`h-full rounded-full ${
                    progress === 100 ? "bg-green-500" : "bg-indigo-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, delay: childIdx * 0.1 }}
                />
              </div>

              {/* Habit icons */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {habits.map((habit) => {
                  const isCompleted = habit.logs.some(
                    (l) => l.familyMemberId === child.id
                  );
                  return (
                    <div
                      key={habit.id}
                      className={`text-[1.5vw] p-1 rounded-lg ${
                        isCompleted
                          ? "bg-green-500/20"
                          : theme.name === "night"
                          ? "bg-slate-700/50 opacity-40"
                          : "bg-slate-200/50 opacity-40"
                      }`}
                      title={habit.name}
                    >
                      {habit.icon || "✓"}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
        </div>
      </AutoScroll>
    </div>
  );
}
