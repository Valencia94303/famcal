"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Theme } from "@/lib/theme";
import { AutoScroll } from "./AutoScroll";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  store: string;
  checked: boolean;
}

interface GroupedItems {
  COSTCO: ShoppingItem[];
  WALMART: ShoppingItem[];
  TARGET: ShoppingItem[];
  OTHER: ShoppingItem[];
}

interface ShoppingDisplayProps {
  theme: Theme;
}

const STORES = [
  { id: "COSTCO", label: "Costco", color: "bg-red-500", icon: "🏪" },
  { id: "WALMART", label: "Walmart", color: "bg-blue-500", icon: "🛒" },
  { id: "TARGET", label: "Target", color: "bg-red-600", icon: "🎯" },
  { id: "OTHER", label: "Other", color: "bg-slate-500", icon: "📦" },
];

export function ShoppingDisplay({ theme }: ShoppingDisplayProps) {
  const [grouped, setGrouped] = useState<GroupedItems>({
    COSTCO: [],
    WALMART: [],
    TARGET: [],
    OTHER: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchItems();
    // Refresh every 2 minutes
    const interval = setInterval(fetchItems, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/shopping?showChecked=false");
      const data = await res.json();
      setGrouped(data.grouped || { COSTCO: [], WALMART: [], TARGET: [], OTHER: [] });
    } catch (error) {
      console.error("Error fetching shopping items:", error);
    }
    setIsLoading(false);
  };

  const getTotalItems = () => {
    return Object.values(grouped).flat().length;
  };

  if (isLoading) {
    return (
      <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}>
        <h2 className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}>
          Shopping List
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

  if (getTotalItems() === 0) {
    return (
      <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}>
        <h2 className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}>
          Shopping List
        </h2>
        <p className={`text-[1.2vw] ${theme.textMuted} text-center py-4`}>
          Shopping list is empty!
        </p>
      </div>
    );
  }

  // Get stores that have items
  const activeStores = STORES.filter(
    (store) => grouped[store.id as keyof GroupedItems].length > 0
  );

  return (
    <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl shadow-black/10`}>
      <motion.h2
        className={`text-[1.8vw] font-bold ${theme.textPrimary} mb-4`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Shopping List
        <span className={`ml-3 text-[1.2vw] font-normal ${theme.textMuted}`}>
          {getTotalItems()} items
        </span>
      </motion.h2>

      <div className="grid grid-cols-2 gap-4">
        {activeStores.map((store, storeIndex) => {
          const items = grouped[store.id as keyof GroupedItems];
          return (
            <motion.div
              key={store.id}
              className={`rounded-2xl p-4 ${
                theme.name === "night" ? "bg-slate-800/50" : "bg-white/50"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: storeIndex * 0.1 }}
            >
              {/* Store header */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-3 h-3 rounded-full ${store.color}`} />
                <span className={`text-[1.2vw] font-semibold ${theme.textPrimary}`}>
                  {store.icon} {store.label}
                </span>
                <span className={`text-[0.9vw] ${theme.textMuted}`}>
                  ({items.length})
                </span>
              </div>

              {/* Items */}
              <AutoScroll maxHeight="20vh" duration={15}>
                <div className="space-y-2">
                  {items.map((item, itemIndex) => (
                    <motion.div
                      key={item.id}
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
                        x{item.quantity}
                        {item.unit && ` ${item.unit}`}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </AutoScroll>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
