"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Theme } from "@/lib/theme";
import { AutoScroll } from "./AutoScroll";

interface MealPlanItem {
  name: string;
  quantities: { quantity: string; unit: string; recipe: string }[];
  store: string;
  category: string;
}

interface StoreGroup {
  store: string;
  label: string;
  color: string;
  icon: string;
  items: MealPlanItem[];
}

interface ShoppingDisplayProps {
  theme: Theme;
}

// Stockton, CA stores
const STORES: Record<string, { label: string; color: string; icon: string }> = {
  COSTCO: { label: "Costco", color: "bg-red-500", icon: "🏪" },
  WINCO: { label: "WinCo", color: "bg-yellow-500", icon: "🛒" },
  WALMART: { label: "Walmart", color: "bg-blue-500", icon: "🛒" },
  TRADER_JOES: { label: "Trader Joe's", color: "bg-red-600", icon: "🌻" },
  RANCH_99: { label: "99 Ranch", color: "bg-green-600", icon: "🥢" },
  CARDENAS: { label: "Cardenas", color: "bg-orange-500", icon: "🌮" },
  SAFEWAY: { label: "Safeway", color: "bg-red-700", icon: "🏬" },
  TARGET: { label: "Target", color: "bg-red-600", icon: "🎯" },
  OTHER: { label: "Other", color: "bg-slate-500", icon: "📦" },
};

export function ShoppingDisplay({ theme }: ShoppingDisplayProps) {
  const [storeGroups, setStoreGroups] = useState<StoreGroup[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchItems();
    // Refresh every 5 minutes
    const interval = setInterval(fetchItems, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchItems = async () => {
    try {
      // Fetch from meal plan shopping list (weeks 2-4, skipping week 1 which is pantry items)
      const res = await fetch("/api/meal-plan/shopping-list?week=2");
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        // Group items by store
        const byStore: Record<string, MealPlanItem[]> = {};

        data.items.forEach((item: MealPlanItem) => {
          const store = item.store || "OTHER";
          if (!byStore[store]) {
            byStore[store] = [];
          }
          byStore[store].push(item);
        });

        // Convert to array and add store metadata
        const groups: StoreGroup[] = Object.entries(byStore)
          .map(([storeId, items]) => ({
            store: storeId,
            label: STORES[storeId]?.label || storeId,
            color: STORES[storeId]?.color || "bg-slate-500",
            icon: STORES[storeId]?.icon || "📦",
            items: items.slice(0, 10), // Limit to 10 items per store for display
          }))
          .filter((g) => g.items.length > 0)
          .sort((a, b) => b.items.length - a.items.length) // Sort by item count
          .slice(0, 4); // Show top 4 stores

        setStoreGroups(groups);
        setTotalItems(data.totalItems || 0);
      }
    } catch (error) {
      console.error("Error fetching shopping items:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}>
        <h2 className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}>
          Meal Shopping
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

  if (storeGroups.length === 0) {
    return (
      <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}>
        <h2 className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}>
          Meal Shopping
        </h2>
        <p className={`text-[1.2vw] ${theme.textMuted} text-center py-4`}>
          No meal plan items found
        </p>
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
        Meal Shopping
        <span className={`ml-3 text-[1.2vw] font-normal ${theme.textMuted}`}>
          {totalItems} items
        </span>
      </motion.h2>

      <div className="grid grid-cols-2 gap-4">
        {storeGroups.map((group, storeIndex) => (
          <motion.div
            key={group.store}
            className={`rounded-2xl p-4 ${
              theme.name === "night" ? "bg-slate-800/50" : "bg-white/50"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: storeIndex * 0.1 }}
          >
            {/* Store header */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-3 h-3 rounded-full ${group.color}`} />
              <span className={`text-[1.2vw] font-semibold ${theme.textPrimary}`}>
                {group.icon} {group.label}
              </span>
              <span className={`text-[0.9vw] ${theme.textMuted}`}>
                ({group.items.length})
              </span>
            </div>

            {/* Items */}
            <AutoScroll maxHeight="20vh" duration={15}>
              <div className="space-y-2">
                {group.items.map((item, itemIndex) => {
                  // Combine quantities
                  const totalQty = item.quantities
                    .map((q) => q.quantity)
                    .join(" + ");
                  const unit = item.quantities[0]?.unit || "";

                  return (
                    <motion.div
                      key={`${item.name}-${itemIndex}`}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: storeIndex * 0.1 + itemIndex * 0.05 }}
                    >
                      <span className={`text-[1vw] ${theme.textMuted}`}>•</span>
                      <span className={`text-[1.1vw] ${theme.textPrimary} flex-1 truncate`}>
                        {item.name}
                      </span>
                      <span className={`text-[0.9vw] ${theme.textMuted}`}>
                        {totalQty} {unit}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </AutoScroll>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
