"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  icon: string | null;
  isActive: boolean;
  isCashReward: boolean;
  cashValue: number | null;
}

interface RewardsSectionProps {
  onDataChange: () => void;
}

const REWARD_ICONS = [
  { icon: "🎮", label: "Gaming" },
  { icon: "🍦", label: "Ice Cream" },
  { icon: "🎬", label: "Movie" },
  { icon: "📱", label: "Screen Time" },
  { icon: "🎁", label: "Gift" },
  { icon: "🍕", label: "Pizza" },
  { icon: "🎪", label: "Fun Outing" },
  { icon: "💵", label: "Money" },
  { icon: "🎨", label: "Craft" },
  { icon: "🛍️", label: "Shopping" },
  { icon: "🎉", label: "Party" },
  { icon: "⭐", label: "Star" },
];

export function RewardsSection({ onDataChange }: RewardsSectionProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pointsCost, setPointsCost] = useState(50);
  const [icon, setIcon] = useState("🎁");
  const [isCashReward, setIsCashReward] = useState(false);
  const [cashValue, setCashValue] = useState<number | null>(null);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const res = await fetch("/api/rewards");
      const data = await res.json();
      setRewards(data.rewards || []);
    } catch (error) {
      console.error("Error fetching rewards:", error);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingReward(null);
    setName("");
    setDescription("");
    setPointsCost(50);
    setIcon("🎁");
    setIsCashReward(false);
    setCashValue(null);
  };

  const handleSave = async () => {
    if (!name.trim() || pointsCost <= 0) return;

    try {
      const rewardData = {
        name,
        description: description || null,
        pointsCost,
        icon,
        isCashReward,
        cashValue: isCashReward ? cashValue : null,
      };

      if (editingReward) {
        await fetch(`/api/rewards/${editingReward.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rewardData),
        });
      } else {
        await fetch("/api/rewards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rewardData),
        });
      }

      resetForm();
      fetchRewards();
      onDataChange();
    } catch (error) {
      console.error("Error saving reward:", error);
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setName(reward.name);
    setDescription(reward.description || "");
    setPointsCost(reward.pointsCost);
    setIcon(reward.icon || "🎁");
    setIsCashReward(reward.isCashReward);
    setCashValue(reward.cashValue);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this reward?")) return;

    try {
      await fetch(`/api/rewards/${id}`, { method: "DELETE" });
      fetchRewards();
      onDataChange();
    } catch (error) {
      console.error("Error deleting reward:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">
            Rewards Catalog ({rewards.length})
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium min-h-[44px] active:scale-95 transition-transform"
          >
            + Add Reward
          </button>
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-lg p-4"
          >
            <h3 className="font-semibold text-slate-700 mb-4">
              {editingReward ? "Edit Reward" : "New Reward"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Icon
                </label>
                <div className="flex gap-2 flex-wrap">
                  {REWARD_ICONS.map((item) => (
                    <button
                      key={item.icon}
                      onClick={() => setIcon(item.icon)}
                      className={`w-12 h-12 text-2xl rounded-xl flex items-center justify-center transition-all ${
                        icon === item.icon
                          ? "bg-indigo-100 ring-2 ring-indigo-500"
                          : "bg-slate-100"
                      }`}
                    >
                      {item.icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Extra screen time"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="30 minutes of extra gaming"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Points Cost
                </label>
                <input
                  type="number"
                  value={pointsCost}
                  onChange={(e) => setPointsCost(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg min-h-[48px]"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsCashReward(!isCashReward)}
                  className={`w-12 h-7 rounded-full transition-colors ${
                    isCashReward ? "bg-green-500" : "bg-slate-300"
                  }`}
                >
                  <motion.div
                    className="w-6 h-6 bg-white rounded-full shadow-md"
                    animate={{ x: isCashReward ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
                <span className="text-sm font-medium text-slate-600">
                  This is a cash/money reward
                </span>
              </div>

              {isCashReward && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Cash Value ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cashValue || ""}
                    onChange={(e) => setCashValue(parseFloat(e.target.value) || null)}
                    placeholder="5.00"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg min-h-[48px]"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={!name.trim() || pointsCost <= 0}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium min-h-[48px] disabled:opacity-50 active:scale-95 transition-transform"
                >
                  Save
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-3 bg-slate-200 text-slate-600 rounded-xl font-medium min-h-[48px] active:scale-95 transition-transform"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rewards List */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        {rewards.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No rewards yet. Add your first reward!
          </p>
        ) : (
          <div className="space-y-3">
            {rewards.map((reward) => (
              <motion.div
                key={reward.id}
                layout
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">
                  {reward.icon || "🎁"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">
                    {reward.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-indigo-600 font-medium">
                      {reward.pointsCost} pts
                    </span>
                    {reward.isCashReward && reward.cashValue && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        ${reward.cashValue.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(reward)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg min-h-[40px]"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(reward.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg min-h-[40px]"
                >
                  Delete
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Suggestions */}
      {rewards.length < 3 && (
        <div className="bg-indigo-50 rounded-2xl p-4">
          <h3 className="font-semibold text-indigo-800 mb-3">Quick Add Suggestions</h3>
          <div className="flex gap-2 flex-wrap">
            {[
              { name: "30 min Screen Time", points: 50, icon: "📱" },
              { name: "Ice Cream Trip", points: 100, icon: "🍦" },
              { name: "Movie Night Pick", points: 75, icon: "🎬" },
              { name: "$5 Cash", points: 100, icon: "💵", isCash: true, cashValue: 5 },
            ].map((suggestion) => (
              <button
                key={suggestion.name}
                onClick={async () => {
                  await fetch("/api/rewards", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: suggestion.name,
                      pointsCost: suggestion.points,
                      icon: suggestion.icon,
                      isCashReward: suggestion.isCash || false,
                      cashValue: suggestion.cashValue || null,
                    }),
                  });
                  fetchRewards();
                }}
                className="px-3 py-2 bg-white rounded-xl text-sm font-medium text-indigo-700 shadow-sm min-h-[40px] active:scale-95 transition-transform"
              >
                {suggestion.icon} {suggestion.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
