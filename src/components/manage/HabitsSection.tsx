"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: string;
}

interface HabitLog {
  id: string;
  familyMemberId: string;
  familyMember: FamilyMember;
}

interface Habit {
  id: string;
  name: string;
  icon: string | null;
  points: number;
  frequency: string;
  logs: HabitLog[];
}

interface HabitsSectionProps {
  members: FamilyMember[];
  onDataChange?: () => void;
}

const HABIT_ICONS = ["🦷", "🥦", "📚", "🛏️", "🧹", "🐕", "💊", "🏃", "🎹", "✏️"];

export function HabitsSection({ members, onDataChange }: HabitsSectionProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0]);

  // Add habit form state
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("🦷");
  const [newPoints, setNewPoints] = useState(1);

  const children = members.filter((m) => m.role === "CHILD");

  const fetchHabits = async () => {
    try {
      const res = await fetch(`/api/habits?date=${currentDate}`);
      const data = await res.json();
      setHabits(data.habits || []);
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHabits();
  }, [currentDate]);

  const handleAddHabit = async () => {
    if (!newName.trim()) return;
    try {
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          icon: newIcon,
          points: newPoints,
        }),
      });
      setNewName("");
      setNewIcon("🦷");
      setNewPoints(1);
      setShowAddForm(false);
      fetchHabits();
      onDataChange?.();
    } catch (error) {
      console.error("Error adding habit:", error);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm("Delete this habit?")) return;
    try {
      await fetch(`/api/habits/${id}`, { method: "DELETE" });
      fetchHabits();
      onDataChange?.();
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  };

  const handleToggleHabit = async (habit: Habit, memberId: string) => {
    const isCompleted = habit.logs.some((l) => l.familyMemberId === memberId);

    try {
      if (isCompleted) {
        await fetch(
          `/api/habits/log?habitId=${habit.id}&familyMemberId=${memberId}&date=${currentDate}`,
          { method: "DELETE" }
        );
      } else {
        await fetch("/api/habits/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            habitId: habit.id,
            familyMemberId: memberId,
            date: currentDate,
          }),
        });
      }
      fetchHabits();
      onDataChange?.();
    } catch (error) {
      console.error("Error toggling habit:", error);
    }
  };

  const changeDate = (delta: number) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + delta);
    setCurrentDate(date.toISOString().split("T")[0]);
  };

  const isToday = currentDate === new Date().toISOString().split("T")[0];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">Habit Tracker</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium min-h-[44px] active:scale-95 transition-transform"
          >
            + Add
          </button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 bg-slate-100 rounded-lg"
          >
            ←
          </button>
          <div className="text-center">
            <p className="font-semibold text-slate-800">
              {isToday
                ? "Today"
                : new Date(currentDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
            </p>
          </div>
          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className={`p-2 rounded-lg ${
              isToday ? "bg-slate-50 text-slate-300" : "bg-slate-100"
            }`}
          >
            →
          </button>
        </div>

        {/* Add Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-slate-50 rounded-xl"
            >
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Habit name (e.g., Brush teeth)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base min-h-[48px]"
                  autoFocus
                />
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Icon</label>
                  <div className="flex gap-2 flex-wrap">
                    {HABIT_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewIcon(icon)}
                        className={`w-10 h-10 rounded-lg text-xl ${
                          newIcon === icon
                            ? "bg-indigo-500 ring-2 ring-indigo-300"
                            : "bg-slate-100"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Points per completion
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 5, 10].map((pts) => (
                      <button
                        key={pts}
                        onClick={() => setNewPoints(pts)}
                        className={`px-4 py-2 rounded-xl font-medium ${
                          newPoints === pts
                            ? "bg-indigo-500 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {pts}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddHabit}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium min-h-[48px]"
                  >
                    Add Habit
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewName("");
                    }}
                    className="px-4 py-3 bg-slate-200 text-slate-600 rounded-xl font-medium min-h-[48px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Habits List */}
        {habits.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No habits yet. Add habits like "Brush teeth" or "Eat veggies"!
          </p>
        ) : children.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            Add children in the Family tab to track their habits.
          </p>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="p-4 bg-slate-50 rounded-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{habit.icon}</span>
                    <div>
                      <span className="font-semibold text-slate-800">
                        {habit.name}
                      </span>
                      <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                        +{habit.points} pts
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="text-red-500 text-sm"
                  >
                    Delete
                  </button>
                </div>

                {/* Children checkboxes */}
                <div className="flex gap-3 flex-wrap">
                  {children.map((child) => {
                    const isCompleted = habit.logs.some(
                      (l) => l.familyMemberId === child.id
                    );
                    return (
                      <button
                        key={child.id}
                        onClick={() => handleToggleHabit(habit, child.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                          isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-white border-2 border-slate-200"
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: child.color }}
                        >
                          {child.avatar}
                        </div>
                        <span className="font-medium">{child.name}</span>
                        {isCompleted && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
