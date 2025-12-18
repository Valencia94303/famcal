"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  store: string;
  checked: boolean;
  notes: string | null;
}

type Store = "COSTCO" | "WALMART" | "TARGET" | "OTHER";

interface GroupedItems {
  COSTCO: ShoppingItem[];
  WALMART: ShoppingItem[];
  TARGET: ShoppingItem[];
  OTHER: ShoppingItem[];
}

const STORES: { id: Store; label: string; color: string; icon: string }[] = [
  { id: "COSTCO", label: "Costco", color: "bg-red-500", icon: "🏪" },
  { id: "WALMART", label: "Walmart", color: "bg-blue-500", icon: "🛒" },
  { id: "TARGET", label: "Target", color: "bg-red-600", icon: "🎯" },
  { id: "OTHER", label: "Other", color: "bg-slate-500", icon: "📦" },
];

const UNITS = ["", "lbs", "oz", "kg", "g", "pack", "dozen", "gallon", "L", "ct"];

interface ShoppingSectionProps {
  onDataChange?: () => void;
}

export function ShoppingSection({ onDataChange }: ShoppingSectionProps) {
  const [grouped, setGrouped] = useState<GroupedItems>({
    COSTCO: [],
    WALMART: [],
    TARGET: [],
    OTHER: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showChecked, setShowChecked] = useState(false);
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add item form state
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [newUnit, setNewUnit] = useState("");
  const [newStore, setNewStore] = useState<Store>("OTHER");

  const fetchItems = async () => {
    try {
      const res = await fetch(`/api/shopping?showChecked=${showChecked}`);
      const data = await res.json();
      setGrouped(data.grouped || { COSTCO: [], WALMART: [], TARGET: [], OTHER: [] });
    } catch (error) {
      console.error("Error fetching shopping items:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [showChecked]);

  const handleAddItem = async () => {
    if (!newName.trim()) return;
    try {
      await fetch("/api/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          quantity: newQuantity,
          unit: newUnit || null,
          store: newStore,
        }),
      });
      setNewName("");
      setNewQuantity(1);
      setNewUnit("");
      setShowAddForm(false);
      fetchItems();
      onDataChange?.();
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleToggleChecked = async (item: ShoppingItem) => {
    try {
      await fetch(`/api/shopping/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked: !item.checked }),
      });
      fetchItems();
      onDataChange?.();
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  };

  const handleUpdateQuantity = async (item: ShoppingItem, delta: number) => {
    const newQty = Math.max(1, item.quantity + delta);
    try {
      await fetch(`/api/shopping/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      fetchItems();
      onDataChange?.();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await fetch(`/api/shopping/${id}`, { method: "DELETE" });
      fetchItems();
      onDataChange?.();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleClearChecked = async (store?: Store) => {
    if (!confirm("Remove all checked items?")) return;
    try {
      const url = store
        ? `/api/shopping?clearChecked=true&store=${store}`
        : "/api/shopping?clearChecked=true";
      await fetch(url, { method: "DELETE" });
      fetchItems();
      onDataChange?.();
    } catch (error) {
      console.error("Error clearing items:", error);
    }
  };

  const getTotalItems = () => {
    return Object.values(grouped).flat().filter((i) => !i.checked).length;
  };

  const getStoreCount = (store: Store) => {
    return grouped[store].filter((i) => !i.checked).length;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            Shopping List ({getTotalItems()})
          </h2>
          <button
            onClick={() => {
              setShowAddForm(true);
              setActiveStore(null);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium min-h-[44px] active:scale-95 transition-transform"
          >
            + Add
          </button>
        </div>

        {/* Add Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-slate-50 rounded-xl"
            >
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Item name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base min-h-[48px]"
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Quantity</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setNewQuantity(Math.max(1, newQuantity - 1))}
                        className="w-10 h-10 bg-slate-200 rounded-lg font-bold text-slate-600"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-center min-h-[44px]"
                      />
                      <button
                        onClick={() => setNewQuantity(newQuantity + 1)}
                        className="w-10 h-10 bg-slate-200 rounded-lg font-bold text-slate-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Unit</label>
                    <select
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white min-h-[44px]"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u || "—"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Store</label>
                  <div className="grid grid-cols-4 gap-2">
                    {STORES.map((store) => (
                      <button
                        key={store.id}
                        onClick={() => setNewStore(store.id)}
                        className={`p-2 rounded-xl text-center transition-all ${
                          newStore === store.id
                            ? `${store.color} text-white`
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span className="text-lg">{store.icon}</span>
                        <span className="block text-xs font-medium mt-1">{store.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddItem}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium min-h-[48px]"
                  >
                    Add Item
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewName("");
                      setNewQuantity(1);
                      setNewUnit("");
                    }}
                    className="px-4 py-3 bg-slate-200 text-slate-600 rounded-xl font-medium min-h-[48px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Store Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveStore(null)}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors min-h-[44px] ${
              activeStore === null
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            All ({getTotalItems()})
          </button>
          {STORES.map((store) => {
            const count = getStoreCount(store.id);
            return (
              <button
                key={store.id}
                onClick={() => setActiveStore(store.id)}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors min-h-[44px] flex items-center gap-2 ${
                  activeStore === store.id
                    ? `${store.color} text-white`
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <span>{store.icon}</span>
                <span>{store.label}</span>
                {count > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      activeStore === store.id
                        ? "bg-white/20"
                        : "bg-slate-200"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {(activeStore ? [STORES.find((s) => s.id === activeStore)!] : STORES).map((store) => {
            const items = grouped[store.id];
            if (items.length === 0 && activeStore === null) return null;

            return (
              <div key={store.id}>
                {activeStore === null && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full ${store.color}`} />
                    <h3 className="font-semibold text-slate-700">{store.label}</h3>
                    <span className="text-sm text-slate-400">
                      ({items.filter((i) => !i.checked).length})
                    </span>
                  </div>
                )}

                {items.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">
                    No items for {store.label}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        className={`flex items-center gap-3 p-3 bg-slate-50 rounded-xl ${
                          item.checked ? "opacity-50" : ""
                        }`}
                      >
                        <button
                          onClick={() => handleToggleChecked(item)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            item.checked
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {item.checked && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <span className={`font-medium ${item.checked ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {item.name}
                          </span>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleUpdateQuantity(item, -1)}
                            className="w-7 h-7 bg-slate-200 rounded-lg text-slate-600 font-bold text-sm"
                          >
                            -
                          </button>
                          <span className="w-10 text-center font-medium text-slate-700">
                            {item.quantity}
                            {item.unit && <span className="text-xs text-slate-400 ml-0.5">{item.unit}</span>}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item, 1)}
                            className="w-7 h-7 bg-slate-200 rounded-lg text-slate-600 font-bold text-sm"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setShowChecked(!showChecked)}
            className="text-slate-500 text-sm font-medium"
          >
            {showChecked ? "Hide checked" : "Show checked"}
          </button>
          {showChecked && (
            <button
              onClick={() => handleClearChecked(activeStore || undefined)}
              className="text-red-500 text-sm font-medium"
            >
              Clear checked
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
