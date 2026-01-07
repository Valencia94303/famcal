"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Theme } from "@/lib/theme";
import { AutoScroll } from "./AutoScroll";

interface DisplayItem {
  name: string;
  quantity: string;
  unit: string;
  source: "meal" | "manual";
}

interface StoreGroup {
  store: string;
  label: string;
  color: string;
  icon: string;
  items: DisplayItem[];
}

interface ShoppingDisplayProps {
  theme: Theme;
}

// Stockton, CA stores (priority order: Costco → Walmart → Target → Rancho San Miguel → Shun Fat)
const STORES: Record<string, { label: string; color: string; icon: string }> = {
  COSTCO: { label: "Costco", color: "bg-red-500", icon: "🏪" },
  WALMART: { label: "Walmart", color: "bg-blue-500", icon: "🛒" },
  TARGET: { label: "Target", color: "bg-red-600", icon: "🎯" },
  RANCHO_SAN_MIGUEL: { label: "Rancho San Miguel", color: "bg-orange-500", icon: "🌮" },
  SHUN_FAT: { label: "Shun Fat", color: "bg-green-600", icon: "🥢" },
  OTHER: { label: "Other", color: "bg-slate-500", icon: "📦" },
};

export function ShoppingDisplay({ theme }: ShoppingDisplayProps) {
  const [storeGroups, setStoreGroups] = useState<StoreGroup[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchItems();
    // Refresh every 2 minutes
    const interval = setInterval(fetchItems, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchItems = async () => {
    try {
      // Fetch from both sources in parallel
      const [mealRes, manualRes] = await Promise.all([
        fetch("/api/meal-plan/shopping-list?week=2"),
        fetch("/api/shopping?showChecked=false"),
      ]);

      const mealData = await mealRes.json();
      const manualData = await manualRes.json();

      // Combine items by store
      const byStore: Record<string, DisplayItem[]> = {};

      // Add meal plan items
      if (mealData.items) {
        mealData.items.forEach((item: { name: string; quantities: { quantity: string; unit: string }[]; store: string }) => {
          const store = item.store || "OTHER";
          if (!byStore[store]) byStore[store] = [];

          const totalQty = item.quantities.map((q) => q.quantity).join("+");
          const unit = item.quantities[0]?.unit || "";

          byStore[store].push({
            name: item.name,
            quantity: totalQty,
            unit,
            source: "meal",
          });
        });
      }

      // Add manual shopping items (household goods, etc.)
      if (manualData.items) {
        manualData.items.forEach((item: { name: string; quantity: number; unit: string | null; store: string }) => {
          const store = item.store || "OTHER";
          if (!byStore[store]) byStore[store] = [];

          byStore[store].push({
            name: item.name,
            quantity: String(item.quantity),
            unit: item.unit || "",
            source: "manual",
          });
        });
      }

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

      const total = (mealData.totalItems || 0) + (manualData.items?.length || 0);
      setStoreGroups(groups);
      setTotalItems(total);
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
                {group.items.map((item, itemIndex) => (
                  <motion.div
                    key={`${item.name}-${itemIndex}`}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: storeIndex * 0.1 + itemIndex * 0.05 }}
                  >
                    <span className={`text-[1vw] ${theme.textMuted}`}>
                      {item.source === "manual" ? "◆" : "•"}
                    </span>
                    <span className={`text-[1.1vw] ${theme.textPrimary} flex-1 truncate`}>
                      {item.name}
                    </span>
                    <span className={`text-[0.9vw] ${theme.textMuted}`}>
                      {item.quantity} {item.unit}
                    </span>
                  </motion.div>
                ))}
              </div>
            </AutoScroll>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
