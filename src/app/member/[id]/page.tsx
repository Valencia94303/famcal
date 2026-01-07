"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Gift, CheckCircle, Utensils, Award, Loader2 } from "lucide-react";

interface FamilyMember {
  id: string;
  name: string;
  avatar: string | null;
  color: string;
}

interface Chore {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  points: number;
  assignmentId: string;
  completedToday: boolean;
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  icon: string | null;
}

interface TodaysMeal {
  id: string;
  mealType: string;
  recipe: {
    id: string;
    name: string;
    icon: string | null;
  } | null;
  customMeal: string | null;
  myRating: number | null;
}

interface RecentMeal extends TodaysMeal {
  dayLabel: string;
}

type Tab = "chores" | "shop" | "meals";

export default function MemberPortal() {
  const params = useParams();
  const memberId = params.id as string;

  const [member, setMember] = useState<FamilyMember | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [chores, setChores] = useState<Chore[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [recentMeals, setRecentMeals] = useState<RecentMeal[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("chores");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [memberId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load member info
      const memberRes = await fetch(`/api/member/${memberId}`);
      if (!memberRes.ok) {
        throw new Error("Member not found");
      }
      const memberData = await memberRes.json();
      setMember(memberData.member);
      setPoints(memberData.points);
      setChores(memberData.chores);
      setRewards(memberData.rewards);
      setRecentMeals(memberData.recentMeals || memberData.todaysMeals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteChore = async (assignmentId: string, choreId: string) => {
    setActionLoading(assignmentId);
    try {
      const res = await fetch(`/api/chores/${choreId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          completedById: memberId
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPoints(data.newBalance ?? points + (chores.find(c => c.assignmentId === assignmentId)?.points ?? 0));
        setChores(chores.map(c =>
          c.assignmentId === assignmentId ? { ...c, completedToday: true } : c
        ));
      }
    } catch (err) {
      console.error("Failed to complete chore:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRedeemReward = async (rewardId: string, cost: number) => {
    if (points < cost) return;

    setActionLoading(rewardId);
    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardId,
          familyMemberId: memberId
        }),
      });

      if (res.ok) {
        setPoints(points - cost);
        // Show success feedback
        alert("Reward requested! A parent will approve it soon.");
      }
    } catch (err) {
      console.error("Failed to redeem reward:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRateMeal = async (recipeId: string, rating: number) => {
    setActionLoading(recipeId);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          familyMemberId: memberId,
          wouldMakeAgain: rating >= 4
        }),
      });

      if (res.ok) {
        setRecentMeals(recentMeals.map(m =>
          m.recipe?.id === recipeId ? { ...m, myRating: rating } : m
        ));
      }
    } catch (err) {
      console.error("Failed to rate meal:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h1>
          <p className="text-gray-600">{error || "Member not found"}</p>
        </div>
      </div>
    );
  }

  // Count unrated meals with recipes (excludes custom meals like "Leftovers")
  const unratedMealsCount = recentMeals.filter(m => m.recipe && !m.myRating).length;

  const tabs = [
    { id: "chores" as Tab, label: "Chores", icon: CheckCircle, count: chores.filter(c => !c.completedToday).length },
    { id: "shop" as Tab, label: "Shop", icon: Gift, count: rewards.length },
    { id: "meals" as Tab, label: "Rate", icon: Utensils, count: unratedMealsCount },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div
        className="pt-12 pb-20 px-4 text-center text-white"
        style={{ background: `linear-gradient(135deg, ${member.color}, ${member.color}dd)` }}
      >
        <div className="text-6xl mb-3">
          {member.avatar || "😊"}
        </div>
        <h1 className="text-2xl font-bold mb-1">{member.name}</h1>
        <div className="flex items-center justify-center gap-2 text-white/90">
          <Award className="w-5 h-5" />
          <span className="text-xl font-semibold">{points} points</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="relative -mt-8 mx-4">
        <div className="bg-white rounded-2xl shadow-lg p-2 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-white/20" : "bg-indigo-100 text-indigo-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-8">
        <AnimatePresence mode="wait">
          {/* Chores Tab */}
          {activeTab === "chores" && (
            <motion.div
              key="chores"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {chores.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <div className="text-5xl mb-3">🎉</div>
                  <p className="text-gray-600">No chores assigned!</p>
                </div>
              ) : (
                chores.map((chore) => (
                  <motion.div
                    key={chore.assignmentId}
                    layout
                    className={`bg-white rounded-2xl p-4 shadow-sm ${
                      chore.completedToday ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{chore.icon || "📋"}</div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${chore.completedToday ? "line-through text-gray-400" : "text-gray-800"}`}>
                          {chore.title}
                        </h3>
                        {chore.description && (
                          <p className="text-sm text-gray-500">{chore.description}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1 text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium">{chore.points} pts</span>
                        </div>
                      </div>
                      {!chore.completedToday && (
                        <button
                          onClick={() => handleCompleteChore(chore.assignmentId, chore.id)}
                          disabled={actionLoading === chore.assignmentId}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium transition disabled:opacity-50"
                        >
                          {actionLoading === chore.assignmentId ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            "Done!"
                          )}
                        </button>
                      )}
                      {chore.completedToday && (
                        <div className="text-green-500">
                          <CheckCircle className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* Shop Tab */}
          {activeTab === "shop" && (
            <motion.div
              key="shop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {rewards.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <div className="text-5xl mb-3">🏪</div>
                  <p className="text-gray-600">No rewards available yet!</p>
                </div>
              ) : (
                rewards.map((reward) => {
                  const canAfford = points >= reward.pointsCost;
                  return (
                    <motion.div
                      key={reward.id}
                      layout
                      className="bg-white rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{reward.icon || "🎁"}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{reward.name}</h3>
                          {reward.description && (
                            <p className="text-sm text-gray-500">{reward.description}</p>
                          )}
                          <div className="flex items-center gap-1 mt-1 text-amber-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm font-medium">{reward.pointsCost} pts</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRedeemReward(reward.id, reward.pointsCost)}
                          disabled={!canAfford || actionLoading === reward.id}
                          className={`px-4 py-2 rounded-xl font-medium transition ${
                            canAfford
                              ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {actionLoading === reward.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : canAfford ? (
                            "Get!"
                          ) : (
                            "Need more"
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* Meals/Rating Tab */}
          {activeTab === "meals" && (
            <motion.div
              key="meals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {recentMeals.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <div className="text-5xl mb-3">🍽️</div>
                  <p className="text-gray-600">No meals to rate!</p>
                </div>
              ) : (
                <>
                  {/* Group meals by day */}
                  {["Today", "Yesterday", "2 days ago"].map((dayLabel) => {
                    const dayMeals = recentMeals.filter(m => m.dayLabel === dayLabel);
                    if (dayMeals.length === 0) return null;

                    return (
                      <div key={dayLabel}>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                          {dayLabel}
                        </h2>
                        <div className="space-y-3">
                          {dayMeals.map((meal) => (
                            <motion.div
                              key={meal.id}
                              layout
                              className="bg-white rounded-2xl p-4 shadow-sm"
                            >
                              <div className="flex items-center gap-4 mb-3">
                                <div className="text-3xl">{meal.recipe?.icon || "🍽️"}</div>
                                <div className="flex-1">
                                  <div className="text-xs text-gray-400 uppercase tracking-wide">
                                    {meal.mealType}
                                  </div>
                                  <h3 className="font-semibold text-gray-800">
                                    {meal.recipe?.name || meal.customMeal}
                                  </h3>
                                </div>
                              </div>

                              {meal.recipe && (
                                <div className="flex items-center justify-center gap-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => handleRateMeal(meal.recipe!.id, star)}
                                      disabled={actionLoading === meal.recipe?.id}
                                      className="p-1 transition-transform hover:scale-110"
                                    >
                                      <Star
                                        className={`w-10 h-10 ${
                                          meal.myRating && star <= meal.myRating
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              )}

                              {meal.myRating && (
                                <p className="text-center text-sm text-gray-500 mt-2">
                                  You rated this {meal.myRating} star{meal.myRating !== 1 ? "s" : ""}!
                                </p>
                              )}

                              {!meal.recipe && (
                                <p className="text-center text-sm text-gray-400 italic">
                                  Custom meal - no rating needed
                                </p>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
