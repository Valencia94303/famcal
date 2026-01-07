"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Theme } from "@/lib/theme";

interface Recipe {
  id: string;
  name: string;
  icon: string | null;
  cuisine: string | null;
  prepTime: number | null;
  cookTime: number | null;
  avgRating: number | null;
  ratingCount: number;
}

interface Meal {
  id: string;
  mealType: string;
  recipe: Recipe | null;
  customMeal: string | null;
  notes: string | null;
}

interface MealPlanDisplayProps {
  theme: Theme;
}

const MEAL_TYPE_ICONS: Record<string, string> = {
  BREAKFAST: "🍳",
  LUNCH: "🥗",
  SNACK: "🍎",
  DINNER: "🍽️",
};

const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  SNACK: "Snack",
  DINNER: "Dinner",
};

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;

  return (
    <span className="inline-flex items-center text-[0.7vw]">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={
            i < fullStars
              ? "text-yellow-400"
              : i === fullStars && hasHalfStar
                ? "text-yellow-400/50"
                : "text-gray-400/30"
          }
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function MealPlanDisplay({ theme }: MealPlanDisplayProps) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const res = await fetch("/api/meal-plan/today");
        if (res.ok) {
          const data = await res.json();
          setMeals(data.meals || []);
        }
      } catch (error) {
        console.error("Error fetching meals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMeals, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div
        className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}
      >
        <h2 className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}>
          Today&apos;s Meals
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current opacity-50" />
        </div>
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div
        className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}
      >
        <h2 className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}>
          Today&apos;s Meals
        </h2>
        <div className="flex flex-col items-center justify-center py-8">
          <span className="text-[3vw] mb-3">🍽️</span>
          <p className={`text-[1.2vw] ${theme.textMuted} text-center`}>
            No meals planned for today
          </p>
          <p className={`text-[0.9vw] ${theme.textMuted} text-center mt-1`}>
            Add meals in the Manage section
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}
    >
      <motion.h2
        className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Today&apos;s Meals
      </motion.h2>

      <div className="space-y-3">
        {meals.map((meal, index) => (
          <motion.div
            key={meal.id}
            className={`flex items-center gap-4 p-3 rounded-xl ${
              theme.name === "night" ? "bg-slate-800/50" : "bg-white/50"
            }`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="text-[2vw]">
              {meal.recipe?.icon || MEAL_TYPE_ICONS[meal.mealType] || "🍽️"}
            </span>
            <div className="flex-1">
              <p className={`text-[0.9vw] font-medium ${theme.textMuted}`}>
                {MEAL_TYPE_LABELS[meal.mealType] || meal.mealType}
              </p>
              <p className={`text-[1.2vw] font-semibold ${theme.textPrimary}`}>
                {meal.recipe?.name || meal.customMeal || "No meal set"}
              </p>
              {meal.recipe && (
                <div className="flex items-center gap-3 mt-0.5">
                  {meal.recipe.avgRating && (
                    <StarRating rating={meal.recipe.avgRating} />
                  )}
                  {(meal.recipe.prepTime || meal.recipe.cookTime) && (
                    <span className={`text-[0.8vw] ${theme.textMuted}`}>
                      ⏱️{" "}
                      {(meal.recipe.prepTime || 0) +
                        (meal.recipe.cookTime || 0)}{" "}
                      min
                    </span>
                  )}
                </div>
              )}
              {meal.notes && (
                <p className={`text-[0.8vw] ${theme.textMuted}`}>
                  {meal.notes}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
