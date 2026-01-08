"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  CreditCard,
  Plus,
  Minus,
  CheckCircle,
  Gift,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface Member {
  id: string;
  name: string;
  displayName: string;
  avatar: string | null;
  color: string;
}

interface Chore {
  id: string;
  title: string;
  icon: string | null;
  points: number;
  assignmentId: string;
}

interface Reward {
  id: string;
  name: string;
  icon: string | null;
  pointsCost: number;
}

function POSContent() {
  const searchParams = useSearchParams();
  const cardId = searchParams.get("card");

  const [member, setMember] = useState<Member | null>(null);
  const [points, setPoints] = useState(0);
  const [chores, setChores] = useState<Chore[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"earn" | "spend">("earn");
  const [processing, setProcessing] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{ type: "earn" | "spend"; amount: number; item: string } | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  const loadCardData = useCallback(async () => {
    if (!cardId) {
      setError("No card scanned. Please tap your card.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/member/card/${cardId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Card not registered. Ask a parent to set up your card.");
        } else {
          setError("Failed to read card.");
        }
        return;
      }

      const data = await res.json();
      setMember(data.member);
      setPoints(data.points);
      setChores(data.chores);
      setRewards(data.rewards);
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    loadCardData();
  }, [loadCardData]);

  const handleEarnPoints = async (chore: Chore) => {
    if (!member) return;
    setProcessing(chore.id);

    try {
      const res = await fetch(`/api/chores/${chore.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: chore.assignmentId,
          completedById: member.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPoints(data.newBalance ?? points + chore.points);
        setLastAction({ type: "earn", amount: chore.points, item: chore.title });

        // Clear success message after 3 seconds
        setTimeout(() => setLastAction(null), 3000);
      }
    } catch (err) {
      console.error("Failed to complete chore:", err);
    } finally {
      setProcessing(null);
    }
  };

  const handleSpendPoints = async (reward: Reward) => {
    if (!member || points < reward.pointsCost) return;
    setProcessing(reward.id);

    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardId: reward.id,
          familyMemberId: member.id,
        }),
      });

      if (res.ok) {
        setPoints(points - reward.pointsCost);
        setLastAction({ type: "spend", amount: reward.pointsCost, item: reward.name });

        setTimeout(() => setLastAction(null), 3000);
      }
    } catch (err) {
      console.error("Failed to redeem reward:", err);
    } finally {
      setProcessing(null);
    }
  };

  const handleCustomPoints = async (isAdd: boolean) => {
    if (!member || !customAmount) return;
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!isAdd && points < amount) return;

    setProcessing("custom");

    try {
      const res = await fetch("/api/points/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyMemberId: member.id,
          amount: isAdd ? amount : -amount,
          reason: isAdd ? "Points added (POS)" : "Points deducted (POS)",
        }),
      });

      if (res.ok) {
        const newBalance = isAdd ? points + amount : points - amount;
        setPoints(newBalance);
        setLastAction({
          type: isAdd ? "earn" : "spend",
          amount,
          item: isAdd ? "Manual addition" : "Manual deduction",
        });
        setCustomAmount("");

        setTimeout(() => setLastAction(null), 3000);
      }
    } catch (err) {
      console.error("Failed to adjust points:", err);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <CreditCard className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-xl">Reading card...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 text-center max-w-sm shadow-2xl">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Card Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadCardData}
            className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-800 overflow-y-auto">
      {/* Success Animation Overlay */}
      {lastAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
          <div
            className={`rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in duration-300 ${
              lastAction.type === "earn" ? "bg-green-500" : "bg-purple-500"
            }`}
          >
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-white" />
            <p className="text-3xl font-bold text-white mb-2">
              {lastAction.type === "earn" ? "+" : "-"}{lastAction.amount} pts
            </p>
            <p className="text-white/80">{lastAction.item}</p>
          </div>
        </div>
      )}

      {/* Header with Member Info */}
      <div
        className="pt-12 pb-8 px-4 text-center text-white"
        style={{ background: `linear-gradient(135deg, ${member.color}, ${member.color}cc)` }}
      >
        <div className="text-6xl mb-3">{member.avatar || "😊"}</div>
        <h1 className="text-2xl font-bold">{member.displayName}</h1>
        <div className="mt-4 inline-block bg-white/20 rounded-2xl px-6 py-3">
          <p className="text-sm opacity-80">Balance</p>
          <p className="text-4xl font-bold">{points} pts</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-xl p-2 flex gap-2">
          <button
            onClick={() => setMode("earn")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${
              mode === "earn"
                ? "bg-green-500 text-white shadow-lg"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Plus className="w-6 h-6" />
            Earn
          </button>
          <button
            onClick={() => setMode("spend")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${
              mode === "spend"
                ? "bg-purple-500 text-white shadow-lg"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Minus className="w-6 h-6" />
            Spend
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-8">
        {mode === "earn" ? (
          <div className="space-y-4">
            <h2 className="text-white/80 font-semibold uppercase tracking-wide text-sm px-2">
              Complete a Chore
            </h2>

            {chores.length === 0 ? (
              <div className="bg-white/10 rounded-2xl p-6 text-center text-white/60">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No chores assigned</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {chores.map((chore) => (
                  <button
                    key={chore.id}
                    onClick={() => handleEarnPoints(chore)}
                    disabled={processing === chore.id}
                    className="bg-white rounded-2xl p-4 text-left shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50"
                  >
                    <div className="text-3xl mb-2">{chore.icon || "📋"}</div>
                    <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                      {chore.title}
                    </h3>
                    <div className="mt-2 inline-block bg-green-100 text-green-700 px-2 py-1 rounded-lg text-sm font-bold">
                      +{chore.points} pts
                    </div>
                    {processing === chore.id && (
                      <Loader2 className="w-5 h-5 animate-spin text-green-500 mt-2" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Custom Points */}
            <div className="bg-white/10 rounded-2xl p-4 mt-6">
              <h3 className="text-white/80 font-semibold text-sm mb-3">
                Custom Amount
              </h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Points"
                  className="flex-1 px-4 py-3 rounded-xl border-0 text-lg font-semibold text-center"
                />
                <button
                  onClick={() => handleCustomPoints(true)}
                  disabled={processing === "custom" || !customAmount}
                  className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 disabled:opacity-50 transition"
                >
                  {processing === "custom" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-white/80 font-semibold uppercase tracking-wide text-sm px-2">
              Redeem a Reward
            </h2>

            {rewards.length === 0 ? (
              <div className="bg-white/10 rounded-2xl p-6 text-center text-white/60">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No rewards available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {rewards.map((reward) => {
                  const canAfford = points >= reward.pointsCost;
                  return (
                    <button
                      key={reward.id}
                      onClick={() => handleSpendPoints(reward)}
                      disabled={!canAfford || processing === reward.id}
                      className={`rounded-2xl p-4 text-left shadow-lg transition-all ${
                        canAfford
                          ? "bg-white hover:shadow-xl hover:scale-[1.02]"
                          : "bg-white/50 opacity-60"
                      }`}
                    >
                      <div className="text-3xl mb-2">{reward.icon || "🎁"}</div>
                      <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                        {reward.name}
                      </h3>
                      <div
                        className={`mt-2 inline-block px-2 py-1 rounded-lg text-sm font-bold ${
                          canAfford
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {reward.pointsCost} pts
                      </div>
                      {processing === reward.id && (
                        <Loader2 className="w-5 h-5 animate-spin text-purple-500 mt-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Custom Deduction */}
            <div className="bg-white/10 rounded-2xl p-4 mt-6">
              <h3 className="text-white/80 font-semibold text-sm mb-3">
                Custom Deduction
              </h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Points"
                  className="flex-1 px-4 py-3 rounded-xl border-0 text-lg font-semibold text-center"
                />
                <button
                  onClick={() => handleCustomPoints(false)}
                  disabled={
                    processing === "custom" ||
                    !customAmount ||
                    parseInt(customAmount) > points
                  }
                  className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 disabled:opacity-50 transition"
                >
                  {processing === "custom" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Minus className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card ID Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/50 text-white/40 text-center py-2 text-xs">
        Card: {cardId?.substring(0, 8)}...
      </div>
    </div>
  );
}

export default function POSPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      }
    >
      <POSContent />
    </Suspense>
  );
}
