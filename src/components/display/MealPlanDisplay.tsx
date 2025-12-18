"use client";

import { motion } from "framer-motion";
import { Theme } from "@/lib/theme";

interface MealPlanDisplayProps {
  theme: Theme;
}

export function MealPlanDisplay({ theme }: MealPlanDisplayProps) {
  // Placeholder data - will be replaced with actual meal plan system
  const meals = [
    { type: "Breakfast", icon: "🍳", meal: "Coming soon..." },
    { type: "Lunch", icon: "🥪", meal: "Coming soon..." },
    { type: "Dinner", icon: "🍽️", meal: "Coming soon..." },
  ];

  return (
    <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}>
      <motion.h2
        className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Today's Meals
      </motion.h2>

      <div className="space-y-4">
        {meals.map((meal, index) => (
          <motion.div
            key={meal.type}
            className={`flex items-center gap-4 p-4 rounded-xl ${
              theme.name === "night" ? "bg-slate-800/50" : "bg-white/50"
            }`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="text-[2.5vw]">{meal.icon}</span>
            <div className="flex-1">
              <p className={`text-[1vw] font-medium ${theme.textMuted}`}>
                {meal.type}
              </p>
              <p className={`text-[1.3vw] font-semibold ${theme.textPrimary}`}>
                {meal.meal}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p
        className={`text-[0.9vw] ${theme.textMuted} text-center mt-4`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Meal planning coming soon!
      </motion.p>
    </div>
  );
}
