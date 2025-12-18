"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: string;
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  icon: string | null;
  isCashReward: boolean;
  cashValue: number | null;
}

interface Redemption {
  id: string;
  rewardId: string;
  pointsSpent: number;
  status: string;
  denialReason: string | null;
  createdAt: string;
  reward: Reward;
}

interface PointBalance {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

export default function KidsRewardsPage() {
  const [children, setChildren] = useState<FamilyMember[]>([]);
  const [selectedChild, setSelectedChild] = useState<FamilyMember | null>(null);
  const [balance, setBalance] = useState<PointBalance | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch children on load
  useEffect(() => {
    fetchChildren();
    fetchRewards();
  }, []);

  // Fetch balance and redemptions when child selected
  useEffect(() => {
    if (selectedChild) {
      fetchBalance();
      fetchMyRedemptions();
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const res = await fetch("/api/family");
      const data = await res.json();
      const kids = (data.members || []).filter(
        (m: FamilyMember) => m.role === "CHILD"
      );
      setChildren(kids);
      if (kids.length === 1) {
        setSelectedChild(kids[0]);
      }
    } catch (error) {
      console.error("Error fetching children:", error);
    }
    setIsLoading(false);
  };

  const fetchRewards = async () => {
    try {
      const res = await fetch("/api/rewards");
      const data = await res.json();
      setRewards(data.rewards || []);
    } catch (error) {
      console.error("Error fetching rewards:", error);
    }
  };

  const fetchBalance = async () => {
    if (!selectedChild) return;
    try {
      const res = await fetch(`/api/points/balance/${selectedChild.id}`);
      const data = await res.json();
      setBalance(data);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchMyRedemptions = async () => {
    if (!selectedChild) return;
    try {
      const res = await fetch(`/api/rewards/redemptions?memberId=${selectedChild.id}`);
      const data = await res.json();
      setMyRedemptions(data.redemptions || []);
    } catch (error) {
      console.error("Error fetching redemptions:", error);
    }
  };

  const requestReward = async (reward: Reward) => {
    if (!selectedChild || isRequesting) return;

    setIsRequesting(reward.id);
    setMessage(null);

    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardId: reward.id,
          requestedById: selectedChild.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "Could not request reward",
        });
      } else {
        setMessage({
          type: "success",
          text: `Requested "${reward.name}"! Waiting for parent approval.`,
        });
        fetchBalance();
        fetchMyRedemptions();
      }
    } catch (error) {
      setMessage({ type: "error", text: "Something went wrong" });
    }

    setIsRequesting(null);
    setTimeout(() => setMessage(null), 4000);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
        <motion.div
          className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  // Child selector screen
  if (!selectedChild) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-6">
        <div className="max-w-md mx-auto">
          <motion.h1
            className="text-4xl font-bold text-white text-center mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Rewards Store
          </motion.h1>
          <motion.p
            className="text-white/80 text-center mb-8 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Who&apos;s shopping today?
          </motion.p>

          <div className="space-y-4">
            {children.map((child, index) => (
              <motion.button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className="w-full bg-white/20 backdrop-blur-sm rounded-2xl p-6 flex items-center gap-4 hover:bg-white/30 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                  style={{ backgroundColor: child.color }}
                >
                  {child.avatar}
                </div>
                <span className="text-2xl font-semibold text-white">
                  {child.name}
                </span>
              </motion.button>
            ))}
          </div>

          {children.length === 0 && (
            <p className="text-white/80 text-center">No children found.</p>
          )}
        </div>
      </div>
    );
  }

  // Main rewards screen
  return (
    <div className="fixed inset-0 overflow-y-auto bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/10 backdrop-blur-md p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => setSelectedChild(null)}
            className="text-white/80 hover:text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
              style={{ backgroundColor: selectedChild.color }}
            >
              {selectedChild.avatar}
            </div>
            <span className="text-xl font-semibold text-white">
              {selectedChild.name}
            </span>
          </div>

          <Link href="/" className="text-white/80 hover:text-white p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Points Balance */}
      <div className="max-w-lg mx-auto p-4 pb-24">
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-xl mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-gray-500 text-sm mb-1">Your Points</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-purple-600">
              {balance?.balance ?? 0}
            </span>
            <span className="text-gray-400 text-xl">pts</span>
          </div>
        </motion.div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 p-4 rounded-xl text-white font-medium ${
                message.type === "success" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rewards Grid */}
        <h2 className="text-white text-xl font-bold mb-4">Available Rewards</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {rewards.map((reward, index) => {
            const canAfford = (balance?.balance ?? 0) >= reward.pointsCost;
            return (
              <motion.div
                key={reward.id}
                className={`bg-white rounded-2xl p-4 shadow-lg ${
                  !canAfford ? "opacity-60" : ""
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="text-4xl mb-2">{reward.icon || "🎁"}</div>
                <h3 className="font-bold text-gray-800 mb-1">{reward.name}</h3>
                {reward.description && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                    {reward.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-purple-600 font-bold">
                    {reward.pointsCost} pts
                  </span>
                  {reward.isCashReward && (
                    <span className="text-green-600 text-sm font-medium">
                      ${reward.cashValue}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => requestReward(reward)}
                  disabled={!canAfford || isRequesting === reward.id}
                  className={`w-full mt-3 py-2 rounded-xl font-semibold transition-colors ${
                    canAfford
                      ? "bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isRequesting === reward.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Requesting...
                    </span>
                  ) : canAfford ? (
                    "Request"
                  ) : (
                    "Need more points"
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* My Requests */}
        {myRedemptions.length > 0 && (
          <>
            <h2 className="text-white text-xl font-bold mb-4">My Requests</h2>
            <div className="space-y-3">
              {myRedemptions.slice(0, 5).map((redemption) => (
                <motion.div
                  key={redemption.id}
                  className="bg-white/90 backdrop-blur rounded-xl p-4 flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <span className="text-2xl">{redemption.reward.icon || "🎁"}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {redemption.reward.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {redemption.pointsSpent} pts
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      redemption.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : redemption.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {redemption.status === "PENDING"
                      ? "Waiting..."
                      : redemption.status === "APPROVED"
                      ? "Approved!"
                      : "Denied"}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
