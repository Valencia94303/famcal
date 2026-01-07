"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Theme } from "@/lib/theme";

interface PointBalance {
  memberId: string;
  memberName: string;
  memberColor: string;
  memberAvatar: string;
  balance: number;
}

interface PointsDisplayProps {
  theme: Theme;
}

export function PointsDisplay({ theme }: PointsDisplayProps) {
  const [balances, setBalances] = useState<PointBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBalances();
    // Refresh every 2 minutes
    const interval = setInterval(fetchBalances, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchBalances = async () => {
    try {
      // Use bulk endpoint - single query instead of N+1
      const res = await fetch("/api/points/balances");
      const data = await res.json();
      setBalances(data.balances || []);
    } catch (error) {
      console.error("Error fetching point balances:", error);
    }
    setIsLoading(false);
  };

  // Memoize sorted balances to avoid mutation during render
  const sortedBalances = useMemo(
    () => [...balances].sort((a, b) => b.balance - a.balance),
    [balances]
  );

  if (isLoading) {
    return (
      <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}>
        <h2 className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}>
          Points
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

  if (balances.length === 0) {
    return (
      <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}>
        <h2 className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}>
          Points Leaderboard
        </h2>
        <div className="flex flex-col items-center justify-center py-8">
          <span className="text-[3vw] mb-3">⭐</span>
          <p className={`text-[1.2vw] ${theme.textMuted} text-center`}>
            No points yet
          </p>
          <p className={`text-[0.9vw] ${theme.textMuted} text-center mt-1`}>
            Complete chores to earn points!
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
        Points Leaderboard
      </motion.h2>

      <div className="space-y-3">
        {sortedBalances.map((balance, index) => (
            <motion.div
              key={balance.memberId}
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Rank badge */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[1vw] font-bold ${
                  index === 0
                    ? "bg-yellow-400 text-yellow-900"
                    : index === 1
                    ? "bg-slate-300 text-slate-700"
                    : index === 2
                    ? "bg-amber-600 text-amber-100"
                    : `${theme.name === "night" ? "bg-slate-700" : "bg-slate-200"} ${theme.textMuted}`
                }`}
              >
                {index + 1}
              </div>

              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-[1.2vw] border-2 border-white shadow-md"
                style={{ backgroundColor: balance.memberColor }}
              >
                {balance.memberAvatar || balance.memberName[0]}
              </div>

              {/* Name */}
              <span className={`flex-1 text-[1.4vw] font-medium ${theme.textPrimary}`}>
                {balance.memberName}
              </span>

              {/* Points */}
              <motion.div
                className="flex items-center gap-2"
                key={balance.balance}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                <span className="text-[2vw] font-bold text-indigo-500">
                  {balance.balance}
                </span>
                <span className={`text-[1vw] ${theme.textMuted}`}>pts</span>
              </motion.div>
            </motion.div>
          ))}
      </div>
    </div>
  );
}
