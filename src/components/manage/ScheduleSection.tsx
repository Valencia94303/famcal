"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  icon: string | null;
  days: string | null;
}

interface ScheduleSectionProps {
  onDataChange?: () => void;
}

const SCHEDULE_ICONS = ["🌅", "🍳", "🚌", "📚", "🍎", "🏃", "🛁", "🍽️", "📺", "🌙", "😴"];
const DAYS = [
  { id: "MON", label: "M" },
  { id: "TUE", label: "T" },
  { id: "WED", label: "W" },
  { id: "THU", label: "T" },
  { id: "FRI", label: "F" },
  { id: "SAT", label: "S" },
  { id: "SUN", label: "S" },
];

export function ScheduleSection({ onDataChange }: ScheduleSectionProps) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("08:00");
  const [newIcon, setNewIcon] = useState("🌅");
  const [newDays, setNewDays] = useState<string[]>([]);

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

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAddItem = async () => {
    if (!newTitle.trim()) return;
    try {
      await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          time: newTime,
          icon: newIcon,
          days: newDays.length > 0 ? newDays : null,
        }),
      });
      setNewTitle("");
      setNewTime("08:00");
      setNewIcon("🌅");
      setNewDays([]);
      setShowAddForm(false);
      fetchItems();
      onDataChange?.();
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this schedule item?")) return;
    try {
      await fetch(`/api/schedule/${id}`, { method: "DELETE" });
      fetchItems();
      onDataChange?.();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const toggleDay = (day: string) => {
    setNewDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  const parseDays = (daysJson: string | null): string[] => {
    if (!daysJson) return [];
    try {
      return JSON.parse(daysJson);
    } catch {
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">Daily Schedule</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium min-h-[44px] active:scale-95 transition-transform"
          >
            + Add
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
                  placeholder="Activity (e.g., Wake up, Breakfast)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base min-h-[48px]"
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Time</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 min-h-[48px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Icon</label>
                    <div className="flex gap-1 flex-wrap">
                      {SCHEDULE_ICONS.slice(0, 6).map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setNewIcon(icon)}
                          className={`w-9 h-9 rounded-lg text-lg ${
                            newIcon === icon
                              ? "bg-indigo-500 ring-2 ring-indigo-300"
                              : "bg-white border border-slate-200"
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Days (leave empty for every day)
                  </label>
                  <div className="flex gap-1">
                    {DAYS.map((day, idx) => (
                      <button
                        key={day.id}
                        onClick={() => toggleDay(day.id)}
                        className={`w-9 h-9 rounded-lg font-medium text-sm ${
                          newDays.includes(day.id)
                            ? "bg-indigo-500 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {day.label}
                        {idx === 3 && <span className="text-xs">h</span>}
                        {idx === 5 && <span className="text-xs">a</span>}
                        {idx === 6 && <span className="text-xs">u</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddItem}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium min-h-[48px]"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-3 bg-slate-200 text-slate-600 rounded-xl font-medium min-h-[48px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Schedule List */}
        {items.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No schedule items yet. Add your daily routine!
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const itemDays = parseDays(item.days);
              return (
                <motion.div
                  key={item.id}
                  layout
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-800">{item.title}</span>
                    {itemDays.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {DAYS.map((day) => (
                          <span
                            key={day.id}
                            className={`w-5 h-5 text-xs rounded flex items-center justify-center ${
                              itemDays.includes(day.id)
                                ? "bg-indigo-100 text-indigo-600"
                                : "bg-slate-100 text-slate-300"
                            }`}
                          >
                            {day.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-600 bg-slate-200 px-2 py-1 rounded-lg">
                    {formatTime(item.time)}
                  </span>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-500 text-sm p-2"
                  >
                    ✕
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
