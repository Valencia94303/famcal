"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Theme } from "@/lib/theme";

interface Assignee {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

interface FamilyMember {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

interface Chore {
  id: string;
  title: string;
  assignees: Assignee[];
  isCompleted: boolean;
  points?: number;
}

interface ChoreBoardProps {
  theme: Theme;
}

// Demo chores shown when no real chores exist
const demoChores: Chore[] = [
  {
    id: "1",
    title: "Make beds",
    assignees: [{ id: "1", name: "Emma", color: "#ec4899", avatar: "E" }],
    isCompleted: true,
    points: 5,
  },
  {
    id: "2",
    title: "Load dishwasher",
    assignees: [{ id: "2", name: "Max", color: "#3b82f6", avatar: "M" }],
    isCompleted: true,
    points: 10,
  },
  {
    id: "3",
    title: "Take out trash",
    assignees: [{ id: "3", name: "Dad", color: "#10b981", avatar: "D" }],
    isCompleted: false,
    points: 5,
  },
  {
    id: "4",
    title: "Walk the dog",
    assignees: [{ id: "1", name: "Emma", color: "#ec4899", avatar: "E" }],
    isCompleted: false,
    points: 15,
  },
  {
    id: "5",
    title: "Homework",
    assignees: [{ id: "2", name: "Max", color: "#3b82f6", avatar: "M" }],
    isCompleted: false,
    points: 20,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export function ChoreBoard({ theme }: ChoreBoardProps) {
  const [chores, setChores] = useState<Chore[]>(demoChores);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);
  const [showCompletePicker, setShowCompletePicker] = useState<string | null>(null);
  const [celebratingChore, setCelebratingChore] = useState<string | null>(null);

  const fetchChores = useCallback(async () => {
    try {
      const res = await fetch("/api/chores");
      const data = await res.json();

      if (data.chores && data.chores.length > 0) {
        setChores(data.chores);
        setHasRealData(true);
      } else {
        setChores(demoChores);
        setHasRealData(false);
      }
    } catch (error) {
      console.error("Error fetching chores:", error);
      setChores(demoChores);
      setHasRealData(false);
    }
    setIsLoading(false);
  }, []);

  const fetchFamilyMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/family");
      const data = await res.json();
      setFamilyMembers(data.members || []);
    } catch (error) {
      console.error("Error fetching family members:", error);
    }
  }, []);

  useEffect(() => {
    fetchChores();
    fetchFamilyMembers();
    // Refresh every minute
    const interval = setInterval(fetchChores, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchChores, fetchFamilyMembers]);

  const handleCompleteChore = async (choreId: string, completedById: string) => {
    try {
      const res = await fetch(`/api/chores/${choreId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedById }),
      });

      if (res.ok) {
        // Show celebration animation
        setCelebratingChore(choreId);
        setTimeout(() => setCelebratingChore(null), 2000);

        // Refresh chores
        fetchChores();
      }
    } catch (error) {
      console.error("Error completing chore:", error);
    }
    setShowCompletePicker(null);
  };

  const handleUncompleteChore = async (choreId: string) => {
    try {
      await fetch(`/api/chores/${choreId}/complete`, { method: "DELETE" });
      fetchChores();
    } catch (error) {
      console.error("Error uncompleting chore:", error);
    }
  };

  const handleChoreClick = (chore: Chore) => {
    if (!hasRealData) return; // Don't allow clicking demo chores

    if (chore.isCompleted) {
      handleUncompleteChore(chore.id);
    } else {
      // If chore has one assignee, complete immediately
      if (chore.assignees.length === 1) {
        handleCompleteChore(chore.id, chore.assignees[0].id);
      } else if (familyMembers.length > 0) {
        // Show picker to select who completed it
        setShowCompletePicker(chore.id);
      } else if (chore.assignees.length > 0) {
        // Use first assignee if no family members loaded
        handleCompleteChore(chore.id, chore.assignees[0].id);
      }
    }
  };

  const completedCount = chores.filter((c) => c.isCompleted).length;
  const totalCount = chores.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10 h-full`}>
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className={`text-[2vw] font-bold ${theme.textPrimary}`}>
          Chores & Tasks
        </h2>
        {!hasRealData && !isLoading && (
          <a
            href="/manage"
            className="text-[1vw] px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
          >
            Add Chores
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
        <>
          <motion.div
            className="space-y-3 mb-6 overflow-y-auto max-h-[45vh] hide-scrollbar"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {chores.map((chore) => (
                <motion.div
                  key={chore.id}
                  variants={itemVariants}
                  layout
                  className={`relative flex items-center gap-4 transition-opacity ${
                    chore.isCompleted ? "opacity-50" : ""
                  }`}
                  whileHover={{ x: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {/* Checkbox */}
                  <motion.button
                    onClick={() => handleChoreClick(chore)}
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      chore.isCompleted
                        ? "bg-green-500 border-green-500"
                        : `border-current ${theme.textMuted} ${hasRealData ? "hover:border-green-500 hover:bg-green-500/20 cursor-pointer" : ""}`
                    }`}
                    whileHover={hasRealData ? { scale: 1.1 } : {}}
                    whileTap={hasRealData ? { scale: 0.9 } : {}}
                  >
                    {chore.isCompleted && (
                      <motion.svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </motion.svg>
                    )}
                  </motion.button>

                  {/* Celebration particles */}
                  {celebratingChore === chore.id && (
                    <motion.div
                      className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 2 }}
                    >
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa"][i % 5],
                          }}
                          initial={{ x: 0, y: 0, scale: 1 }}
                          animate={{
                            x: Math.cos((i * Math.PI * 2) / 8) * 60,
                            y: Math.sin((i * Math.PI * 2) / 8) * 60,
                            scale: 0,
                          }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      ))}
                    </motion.div>
                  )}

                  {/* Chore title */}
                  <span
                    className={`flex-1 text-[1.4vw] font-medium ${theme.textPrimary} ${
                      chore.isCompleted ? "line-through" : ""
                    }`}
                  >
                    {chore.title}
                  </span>

                  {/* Assignee avatars */}
                  <div className="flex -space-x-2">
                    {chore.assignees.slice(0, 3).map((assignee) => (
                      <div
                        key={assignee.id}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[1vw] border-2 border-white"
                        style={{ backgroundColor: assignee.color }}
                        title={assignee.name}
                      >
                        {assignee.avatar || assignee.name[0]}
                      </div>
                    ))}
                    {chore.assignees.length > 3 && (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-400 text-white font-bold text-[0.8vw] border-2 border-white">
                        +{chore.assignees.length - 3}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Family member picker popup */}
          <AnimatePresence>
            {showCompletePicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                onClick={() => setShowCompletePicker(null)}
              >
                <motion.div
                  className={`${theme.cardBg} rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4`}
                  onClick={(e) => e.stopPropagation()}
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                >
                  <h3 className={`text-[1.5vw] font-bold ${theme.textPrimary} mb-4`}>
                    Who completed this?
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(chores.find(c => c.id === showCompletePicker)?.assignees.length ?? 0) > 0 ? (
                      // Show assigned family members first
                      chores.find(c => c.id === showCompletePicker)?.assignees.map((member) => (
                        <motion.button
                          key={member.id}
                          onClick={() => handleCompleteChore(showCompletePicker, member.id)}
                          className="flex items-center gap-3 p-4 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: member.color }}
                          >
                            {member.avatar || member.name[0]}
                          </div>
                          <span className="font-semibold text-slate-800">{member.name}</span>
                        </motion.button>
                      ))
                    ) : (
                      // Fall back to all family members
                      familyMembers.map((member) => (
                        <motion.button
                          key={member.id}
                          onClick={() => handleCompleteChore(showCompletePicker, member.id)}
                          className="flex items-center gap-3 p-4 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: member.color }}
                          >
                            {member.avatar || member.name[0]}
                          </div>
                          <span className="font-semibold text-slate-800">{member.name}</span>
                        </motion.button>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => setShowCompletePicker(null)}
                    className={`mt-4 w-full py-3 rounded-xl ${theme.textMuted} hover:bg-slate-100 transition-colors font-medium`}
                  >
                    Cancel
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={`text-[1.2vw] font-medium ${theme.textSecondary}`}>
                Progress
              </span>
              <span className={`text-[1.2vw] font-bold ${theme.textPrimary}`}>
                {completedCount}/{totalCount}
              </span>
            </div>
            <div
              className={`h-3 rounded-full overflow-hidden ${
                theme.name === "night" ? "bg-slate-700" : "bg-slate-200"
              }`}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              />
            </div>
          </div>

          {!hasRealData && (
            <motion.p
              className={`text-[0.9vw] ${theme.textMuted} mt-4 text-center italic`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Showing demo chores • <a href="/manage" className="underline">Add real chores</a>
            </motion.p>
          )}
        </>
      )}
    </div>
  );
}
