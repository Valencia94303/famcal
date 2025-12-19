"use client";

import { motion } from "framer-motion";
import { Theme } from "@/lib/theme";

interface MealPlanDisplayProps {
  theme: Theme;
}

export function MealPlanDisplay({ theme }: MealPlanDisplayProps) {
  // Demo data - Mexican food theme for the Garcia family
  const meals = [
    { type: "Breakfast", icon: "🥚", meal: "Chilaquiles Verdes", note: "with fried eggs & crema" },
    { type: "Lunch", icon: "🌮", meal: "Tacos de Carnitas", note: "cilantro, onion, salsa verde" },
    { type: "Snack", icon: "🥑", meal: "Guacamole & Chips", note: "fresh-made for the kids" },
    { type: "Dinner", icon: "🫔", meal: "Enchiladas Suizas", note: "chicken, tomatillo cream sauce" },
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

      <div className="space-y-3">
        {meals.map((meal, index) => (
          <motion.div
            key={meal.type}
            className={`flex items-center gap-4 p-3 rounded-xl ${
              theme.name === "night" ? "bg-slate-800/50" : "bg-white/50"
            }`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="text-[2vw]">{meal.icon}</span>
            <div className="flex-1">
              <p className={`text-[0.9vw] font-medium ${theme.textMuted}`}>
                {meal.type}
              </p>
              <p className={`text-[1.2vw] font-semibold ${theme.textPrimary}`}>
                {meal.meal}
              </p>
              {meal.note && (
                <p className={`text-[0.8vw] ${theme.textMuted}`}>
                  {meal.note}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
