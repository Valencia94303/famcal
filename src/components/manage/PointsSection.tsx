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

interface PointBalance {
  memberId: string;
  memberName: string;
  memberColor: string;
  memberAvatar: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

interface Redemption {
  id: string;
  pointsSpent: number;
  status: string;
  createdAt: string;
  denialReason: string | null;
  reward: {
    name: string;
    icon: string | null;
  };
  requestedBy: FamilyMember;
  approvedBy: FamilyMember | null;
}

interface PointsSectionProps {
  members: FamilyMember[];
  onDataChange: () => void;
}

export function PointsSection({ members, onDataChange }: PointsSectionProps) {
  const [balances, setBalances] = useState<PointBalance[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBonusForm, setShowBonusForm] = useState(false);
  const [bonusRecipient, setBonusRecipient] = useState("");
  const [bonusAmount, setBonusAmount] = useState(0);
  const [bonusReason, setBonusReason] = useState("");
  const [activeParent, setActiveParent] = useState<string>("");

  const children = members.filter((m) => m.role === "CHILD");
  const parents = members.filter((m) => m.role === "PARENT");

  useEffect(() => {
    fetchData();
  }, [members]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch balances for all children
      const balancePromises = children.map((child) =>
        fetch(`/api/points/balance/${child.id}`).then((r) => r.json())
      );
      const balanceResults = await Promise.all(balancePromises);
      setBalances(balanceResults.filter((b) => b.memberId));

      // Fetch pending redemptions
      const redemptionsRes = await fetch("/api/rewards/redemptions");
      const redemptionsData = await redemptionsRes.json();
      setRedemptions(redemptionsData.redemptions || []);

      // Set first parent as active approver
      if (parents.length > 0 && !activeParent) {
        setActiveParent(parents[0].id);
      }
    } catch (error) {
      console.error("Error fetching points data:", error);
    }
    setLoading(false);
  };

  const handleAwardBonus = async () => {
    if (!bonusRecipient || bonusAmount <= 0) return;

    try {
      await fetch("/api/points/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyMemberId: bonusRecipient,
          amount: bonusAmount,
          description: bonusReason || "Bonus points",
        }),
      });

      setShowBonusForm(false);
      setBonusRecipient("");
      setBonusAmount(0);
      setBonusReason("");
      fetchData();
      onDataChange();
    } catch (error) {
      console.error("Error awarding bonus:", error);
    }
  };

  const handleApproveRedemption = async (redemptionId: string) => {
    try {
      await fetch(`/api/rewards/redemptions/${redemptionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "APPROVED",
          approvedById: activeParent,
        }),
      });
      fetchData();
      onDataChange();
    } catch (error) {
      console.error("Error approving redemption:", error);
    }
  };

  const handleDenyRedemption = async (redemptionId: string) => {
    const reason = prompt("Reason for denial (optional):");
    try {
      await fetch(`/api/rewards/redemptions/${redemptionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DENIED",
          approvedById: activeParent,
          denialReason: reason || null,
        }),
      });
      fetchData();
      onDataChange();
    } catch (error) {
      console.error("Error denying redemption:", error);
    }
  };

  const pendingRedemptions = redemptions.filter((r) => r.status === "PENDING");

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Points Balances */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">Points Balances</h2>
          <button
            onClick={() => setShowBonusForm(true)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-xl font-medium min-h-[44px] active:scale-95 transition-transform"
          >
            + Bonus
          </button>
        </div>

        {children.length === 0 ? (
          <p className="text-slate-500 text-center py-4">
            No children added yet. Add family members first.
          </p>
        ) : (
          <div className="space-y-3">
            {balances.map((balance) => (
              <div
                key={balance.memberId}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: balance.memberColor }}
                >
                  {balance.memberAvatar || balance.memberName[0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{balance.memberName}</p>
                  <p className="text-xs text-slate-500">
                    Earned: {balance.lifetimeEarned} | Spent: {balance.lifetimeSpent}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">{balance.balance}</p>
                  <p className="text-xs text-slate-500">points</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bonus Form */}
      <AnimatePresence>
        {showBonusForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl shadow-lg p-4"
          >
            <h3 className="font-semibold text-slate-700 mb-4">Award Bonus Points</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Recipient
                </label>
                <div className="flex gap-2 flex-wrap">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setBonusRecipient(child.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl min-h-[44px] transition-all ${
                        bonusRecipient === child.id
                          ? "ring-2 ring-indigo-500 bg-indigo-50"
                          : "bg-slate-100"
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: child.color }}
                      >
                        {child.avatar || child.name[0]}
                      </div>
                      <span className="text-sm font-medium">{child.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Points
                </label>
                <input
                  type="number"
                  value={bonusAmount || ""}
                  onChange={(e) => setBonusAmount(parseInt(e.target.value) || 0)}
                  placeholder="10"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg min-h-[48px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  placeholder="Great job helping out!"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 min-h-[48px]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAwardBonus}
                  disabled={!bonusRecipient || bonusAmount <= 0}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium min-h-[48px] disabled:opacity-50 active:scale-95 transition-transform"
                >
                  Award Points
                </button>
                <button
                  onClick={() => setShowBonusForm(false)}
                  className="px-4 py-3 bg-slate-200 text-slate-600 rounded-xl font-medium min-h-[48px] active:scale-95 transition-transform"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Redemptions */}
      {pendingRedemptions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Pending Approvals ({pendingRedemptions.length})
          </h2>

          {parents.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Approving as:
              </label>
              <div className="flex gap-2">
                {parents.map((parent) => (
                  <button
                    key={parent.id}
                    onClick={() => setActiveParent(parent.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl min-h-[44px] ${
                      activeParent === parent.id
                        ? "ring-2 ring-indigo-500 bg-indigo-50"
                        : "bg-slate-100"
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: parent.color }}
                    >
                      {parent.avatar || parent.name[0]}
                    </div>
                    <span className="text-sm font-medium">{parent.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {pendingRedemptions.map((redemption) => (
              <div
                key={redemption.id}
                className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: redemption.requestedBy.color }}
                  >
                    {redemption.requestedBy.avatar || redemption.requestedBy.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">
                      {redemption.requestedBy.name} wants:
                    </p>
                    <p className="text-slate-600">
                      {redemption.reward.icon} {redemption.reward.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {redemption.pointsSpent} points
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleApproveRedemption(redemption.id)}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium min-h-[48px] active:scale-95 transition-transform"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDenyRedemption(redemption.id)}
                    className="flex-1 px-4 py-3 bg-red-100 text-red-600 rounded-xl font-medium min-h-[48px] active:scale-95 transition-transform"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Redemptions History */}
      {redemptions.filter((r) => r.status !== "PENDING").length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Recent History</h2>
          <div className="space-y-2">
            {redemptions
              .filter((r) => r.status !== "PENDING")
              .slice(0, 10)
              .map((redemption) => (
                <div
                  key={redemption.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    redemption.status === "APPROVED"
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: redemption.requestedBy.color }}
                  >
                    {redemption.requestedBy.avatar || redemption.requestedBy.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {redemption.requestedBy.name}: {redemption.reward.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {redemption.pointsSpent} pts
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      redemption.status === "APPROVED"
                        ? "bg-green-200 text-green-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {redemption.status}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
