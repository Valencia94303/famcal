"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Star, Calendar, Utensils, ShoppingCart, ChefHat, X, MoreHorizontal } from "lucide-react";
import Link from "next/link";

interface Recipe {
  id: string;
  name: string;
  description: string | null;
  cuisine: string | null;
  icon: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number;
  difficulty: string;
  ingredients: string;
  instructions: string;
  tips: string | null;
  tags: string | null;
  mealTypes: string | null;
  isActive: boolean;
  avgRating: number | null;
  wouldMakeAgainPercent: number | null;
  ratingCount: number;
  usedInMealPlans: number;
}

interface FamilyMember {
  id: string;
  name: string;
  avatar: string | null;
  color: string;
}

interface MealPlanItem {
  id: string;
  weekNumber: number;
  dayOfWeek: string;
  mealType: string;
  recipe: {
    id: string;
    name: string;
    icon: string | null;
    avgRating: number | null;
  } | null;
  customMeal: string | null;
  notes: string | null;
}

interface ShoppingListItem {
  name: string;
  quantities: { quantity: string; unit: string; recipe: string }[];
  store: string;
  category: string;
}

interface ShoppingListData {
  weeks: number[];
  totalItems: number;
  items: ShoppingListItem[];
  byStore: Record<string, ShoppingListItem[]>;
  byCategory: Record<string, ShoppingListItem[]>;
}

const STORE_LABELS: Record<string, string> = {
  COSTCO: "🏪 Costco",
  WINCO: "🛒 WinCo",
  WALMART: "🔵 Walmart",
  TRADER_JOES: "🌻 Trader Joe's",
  RANCH_99: "🥢 99 Ranch",
  CARDENAS: "🌮 Cardenas",
  SAFEWAY: "🛍️ Safeway",
  TARGET: "🎯 Target",
  OTHER: "📦 Other",
};

const DAYS_OF_WEEK = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_LABELS: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};
const MEAL_TYPES = ["LUNCH", "DINNER"];
const CUISINES = ["Mexican", "Asian", "Mediterranean", "American", "Italian"];

type Tab = "recipes" | "mealplan" | "ratings" | "shopping";

export function MealsSection() {
  const [activeTab, setActiveTab] = useState<Tab>("recipes");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlan, setMealPlan] = useState<Record<string, Record<string, Record<string, MealPlanItem>>>>({});
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<"all" | "low" | "high">("all");

  // Shopping list state
  const [shoppingList, setShoppingList] = useState<ShoppingListData | null>(null);
  const [shoppingWeeks, setShoppingWeeks] = useState<number[]>([2, 3, 4]);
  const [shoppingLoading, setShoppingLoading] = useState(false);
  const [shoppingViewMode, setShoppingViewMode] = useState<"store" | "category">("store");
  const [addingToList, setAddingToList] = useState(false);

  // Modal states
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [ratingRecipe, setRatingRecipe] = useState<Recipe | null>(null);

  const fetchRecipes = useCallback(async () => {
    try {
      const res = await fetch("/api/recipes");
      if (res.ok) {
        const data = await res.json();
        setRecipes(data.recipes || []);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  }, []);

  const fetchMealPlan = useCallback(async () => {
    try {
      const res = await fetch("/api/meal-plan");
      if (res.ok) {
        const data = await res.json();
        setMealPlan(data.grouped || {});
      }
    } catch (error) {
      console.error("Error fetching meal plan:", error);
    }
  }, []);

  const fetchFamilyMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/family");
      if (res.ok) {
        const data = await res.json();
        setFamilyMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching family members:", error);
    }
  }, []);

  const fetchShoppingList = useCallback(async (weeks: number[]) => {
    setShoppingLoading(true);
    try {
      const res = await fetch(`/api/meal-plan/shopping-list?weeks=${weeks.join(",")}`);
      if (res.ok) {
        const data = await res.json();
        setShoppingList(data);
      }
    } catch (error) {
      console.error("Error fetching shopping list:", error);
    } finally {
      setShoppingLoading(false);
    }
  }, []);

  const addToShoppingList = async (clearExisting: boolean = false) => {
    if (!shoppingList) return;
    setAddingToList(true);
    try {
      // Format items for shopping list API
      const items = shoppingList.items.map((item) => ({
        name: item.name,
        quantity: 1,
        unit: item.quantities[0]?.unit || null,
        store: item.store,
        notes: `For: ${[...new Set(item.quantities.map((q) => q.recipe))].join(", ")}`,
      }));

      const res = await fetch("/api/meal-plan/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, clearExisting }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Added ${data.created} items to shopping list!`);
      }
    } catch (error) {
      console.error("Error adding to shopping list:", error);
    } finally {
      setAddingToList(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchRecipes(), fetchMealPlan(), fetchFamilyMembers()]);
      setLoading(false);
    };
    fetchAll();
  }, [fetchRecipes, fetchMealPlan, fetchFamilyMembers]);

  // Filter recipes based on search and rating filter
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      searchQuery === "" ||
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.cuisine?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating =
      ratingFilter === "all" ||
      (ratingFilter === "low" && recipe.avgRating !== null && recipe.avgRating <= 2) ||
      (ratingFilter === "high" && recipe.avgRating !== null && recipe.avgRating >= 4);

    return matchesSearch && matchesRating;
  });

  const handleDeleteRecipe = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchRecipes();
      }
    } catch (error) {
      console.error("Error deleting recipe:", error);
    }
  };

  const handleAssignMeal = async (
    weekNumber: number,
    dayOfWeek: string,
    mealType: string,
    recipeId: string | null,
    customMeal: string | null
  ) => {
    try {
      const res = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber,
          dayOfWeek,
          mealType,
          recipeId,
          customMeal,
        }),
      });
      if (res.ok) {
        fetchMealPlan();
      }
    } catch (error) {
      console.error("Error assigning meal:", error);
    }
  };

  const handleRateRecipe = async (
    recipeId: string,
    rating: number,
    notes: string,
    wouldMakeAgain: boolean,
    familyMemberId?: string
  ) => {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyMemberId,
          rating,
          notes,
          wouldMakeAgain,
        }),
      });
      if (res.ok) {
        fetchRecipes();
        setShowRatingModal(false);
        setRatingRecipe(null);
      }
    } catch (error) {
      console.error("Error rating recipe:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation - Horizontal scrollable pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {[
          { id: "recipes" as Tab, label: "Recipes", icon: Utensils },
          { id: "mealplan" as Tab, label: "Plan", icon: Calendar },
          { id: "ratings" as Tab, label: "Ratings", icon: Star },
          { id: "shopping" as Tab, label: "Shopping", icon: ShoppingCart },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === "shopping" && !shoppingList) fetchShoppingList(shoppingWeeks);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-amber-500 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:border-amber-300"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recipes Tab */}
      {activeTab === "recipes" && (
        <div className="space-y-4">
          {/* Search and Add */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <button
              onClick={() => {
                setEditingRecipe(null);
                setShowRecipeModal(true);
              }}
              className="flex items-center gap-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition font-medium"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>

          {/* Recipe List - Compact cards */}
          <div className="space-y-3">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <span className="text-3xl shrink-0">{recipe.icon || "🍽️"}</span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">{recipe.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {recipe.cuisine && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {recipe.cuisine}
                        </span>
                      )}
                      {(recipe.prepTime || recipe.cookTime) && (
                        <span className="text-xs text-slate-500">
                          ⏱️ {(recipe.prepTime || 0) + (recipe.cookTime || 0)}m
                        </span>
                      )}
                      {recipe.avgRating ? (
                        <span className="text-xs text-amber-600 flex items-center gap-0.5">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          {recipe.avgRating.toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Primary Action */}
                  <Link
                    href={`/cook/${recipe.id}`}
                    className="shrink-0 p-2.5 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition"
                    title="Cook"
                  >
                    <ChefHat size={20} />
                  </Link>
                </div>

                {/* Action buttons */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
                  {/* Inline star rating */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRateRecipe(recipe.id, star, "", true)}
                        className="p-0.5 transition hover:scale-110"
                        title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                      >
                        <Star
                          size={18}
                          className={
                            star <= (recipe.avgRating || 0)
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-200 hover:text-amber-300"
                          }
                        />
                      </button>
                    ))}
                  </div>

                  <div className="flex-1" />

                  <button
                    onClick={() => {
                      setEditingRecipe(recipe);
                      setShowRecipeModal(true);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredRecipes.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Utensils size={48} className="mx-auto mb-4 opacity-50" />
              <p>No recipes found</p>
              <p className="text-sm">Add your first recipe to get started!</p>
            </div>
          )}
        </div>
      )}

      {/* Meal Plan Tab */}
      {activeTab === "mealplan" && (
        <div className="space-y-4">
          {/* Week Selector - Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-sm font-medium text-slate-500 shrink-0">Week:</span>
            {[1, 2, 3, 4].map((week) => (
              <button
                key={week}
                onClick={() => setSelectedWeek(week)}
                className={`px-4 py-2 rounded-full font-medium text-sm transition whitespace-nowrap ${
                  selectedWeek === week
                    ? "bg-amber-500 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-amber-300"
                }`}
              >
                Week {week}
              </button>
            ))}
          </div>

          {/* Meal Plan Cards - Mobile friendly */}
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">{DAY_LABELS[day]}</span>
                </div>
                <div className="p-3 space-y-2">
                  {MEAL_TYPES.map((mealType) => {
                    const meal = mealPlan[selectedWeek]?.[day]?.[mealType];
                    return (
                      <div key={mealType} className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400 w-14 shrink-0">
                          {mealType === "LUNCH" ? "Lunch" : "Dinner"}
                        </span>
                        <div className="flex-1">
                          <MealSlot
                            meal={meal}
                            recipes={recipes}
                            onAssign={(recipeId, customMeal) =>
                              handleAssignMeal(selectedWeek, day, mealType, recipeId, customMeal)
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ratings Tab */}
      {activeTab === "ratings" && (
        <div className="space-y-4">
          {/* Rating Filter - Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { id: "all" as const, label: "All" },
              { id: "low" as const, label: "Low (1-2★)" },
              { id: "high" as const, label: "Favorites (4-5★)" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setRatingFilter(filter.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                  ratingFilter === filter.id
                    ? filter.id === "low"
                      ? "bg-red-500 text-white"
                      : filter.id === "high"
                        ? "bg-green-500 text-white"
                        : "bg-amber-500 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Ratings List - Mobile friendly */}
          <div className="space-y-3">
            {filteredRecipes
              .filter((r) => r.ratingCount > 0)
              .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
              .map((recipe) => (
                <div
                  key={recipe.id}
                  className={`bg-white border rounded-xl p-4 ${
                    recipe.avgRating && recipe.avgRating <= 2
                      ? "border-red-200 bg-red-50/50"
                      : recipe.avgRating && recipe.avgRating >= 4
                        ? "border-green-200 bg-green-50/50"
                        : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0">{recipe.icon || "🍽️"}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{recipe.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRateRecipe(recipe.id, star, "", true)}
                              className="p-0.5 transition hover:scale-110"
                              title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                            >
                              <Star
                                size={16}
                                className={
                                  star <= (recipe.avgRating || 0)
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-200 hover:text-amber-300"
                                }
                              />
                            </button>
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">
                          {recipe.avgRating?.toFixed(1)} • {recipe.ratingCount} ratings
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {((recipe.avgRating && recipe.avgRating <= 2) ||
                    (recipe.avgRating && recipe.avgRating >= 4.5) ||
                    recipe.wouldMakeAgainPercent !== null) && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                      {recipe.avgRating && recipe.avgRating <= 2 && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                          Consider removing
                        </span>
                      )}
                      {recipe.avgRating && recipe.avgRating >= 4.5 && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          Family favorite
                        </span>
                      )}
                      {recipe.wouldMakeAgainPercent !== null && (
                        <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                          {recipe.wouldMakeAgainPercent}% would make again
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}

            {filteredRecipes.filter((r) => r.ratingCount > 0).length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Star size={48} className="mx-auto mb-4 opacity-50" />
                <p>No rated recipes yet</p>
                <p className="text-sm">Rate some recipes to see them here!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shopping List Tab */}
      {activeTab === "shopping" && (
        <div className="space-y-4">
          {/* Week Selector - Compact */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-sm font-medium text-slate-500">Weeks:</span>
              {[1, 2, 3, 4].map((week) => (
                <button
                  key={week}
                  onClick={() => {
                    const newWeeks = shoppingWeeks.includes(week)
                      ? shoppingWeeks.filter((w) => w !== week)
                      : [...shoppingWeeks, week].sort();
                    setShoppingWeeks(newWeeks);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    shoppingWeeks.includes(week)
                      ? "bg-amber-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {week}
                </button>
              ))}
            </div>
            <button
              onClick={() => fetchShoppingList(shoppingWeeks)}
              disabled={shoppingLoading || shoppingWeeks.length === 0}
              className="w-full py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 transition"
            >
              {shoppingLoading ? "Generating..." : "Generate Shopping List"}
            </button>
          </div>

          {/* Shopping List Content */}
          {shoppingLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          ) : shoppingList ? (
            <div className="space-y-4">
              {/* Summary & Actions */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 mb-3">
                  <span className="font-semibold">{shoppingList.totalItems} items</span> for weeks {shoppingList.weeks.join(", ")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addToShoppingList(false)}
                    disabled={addingToList}
                    className="py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition"
                  >
                    {addingToList ? "Adding..." : "Add to List"}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Clear existing items and replace?")) {
                        addToShoppingList(true);
                      }
                    }}
                    disabled={addingToList}
                    className="py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 disabled:opacity-50 transition"
                  >
                    Replace List
                  </button>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShoppingViewMode("store")}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                    shoppingViewMode === "store"
                      ? "bg-amber-500 text-white"
                      : "bg-white border border-slate-200 text-slate-600"
                  }`}
                >
                  By Store
                </button>
                <button
                  onClick={() => setShoppingViewMode("category")}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                    shoppingViewMode === "category"
                      ? "bg-amber-500 text-white"
                      : "bg-white border border-slate-200 text-slate-600"
                  }`}
                >
                  By Category
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {Object.entries(
                  shoppingViewMode === "store" ? shoppingList.byStore : shoppingList.byCategory
                ).map(([group, items]) => (
                  <div key={group} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                      <span className="font-semibold text-slate-700 text-sm">
                        {shoppingViewMode === "store" ? (STORE_LABELS[group] || group) : group}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        {items.length}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <div key={idx} className="px-4 py-2.5 flex items-center justify-between">
                          <span className="text-sm text-slate-700">{item.name}</span>
                          <span className="text-xs text-slate-400">
                            {item.quantities.map((q) => `${q.quantity} ${q.unit}`).join(", ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select weeks and generate a list</p>
            </div>
          )}
        </div>
      )}

      {/* Recipe Modal */}
      {showRecipeModal && (
        <RecipeModal
          recipe={editingRecipe}
          cuisines={CUISINES}
          onClose={() => {
            setShowRecipeModal(false);
            setEditingRecipe(null);
          }}
          onSave={() => {
            fetchRecipes();
            setShowRecipeModal(false);
            setEditingRecipe(null);
          }}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && ratingRecipe && (
        <RatingModal
          recipe={ratingRecipe}
          familyMembers={familyMembers}
          onClose={() => {
            setShowRatingModal(false);
            setRatingRecipe(null);
          }}
          onRate={handleRateRecipe}
        />
      )}
    </div>
  );
}

// Meal Slot Component
function MealSlot({
  meal,
  recipes,
  onAssign,
}: {
  meal?: MealPlanItem;
  recipes: Recipe[];
  onAssign: (recipeId: string | null, customMeal: string | null) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState(meal?.recipe?.id || "");
  const [customMeal, setCustomMeal] = useState(meal?.customMeal || "");

  if (isEditing) {
    return (
      <div className="bg-slate-50 rounded-lg p-2 space-y-2">
        <select
          value={selectedRecipeId}
          onChange={(e) => {
            setSelectedRecipeId(e.target.value);
            setCustomMeal("");
          }}
          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white"
        >
          <option value="">Select recipe...</option>
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.icon} {r.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Or type custom..."
          value={customMeal}
          onChange={(e) => {
            setCustomMeal(e.target.value);
            setSelectedRecipeId("");
          }}
          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg"
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              onAssign(selectedRecipeId || null, customMeal || null);
              setIsEditing(false);
            }}
            className="flex-1 py-1.5 text-xs bg-amber-500 text-white rounded-lg font-medium"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="py-1.5 px-3 text-xs bg-slate-200 text-slate-600 rounded-lg"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setIsEditing(true)}
        className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition ${
          meal
            ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
        }`}
      >
        {meal ? (
          <span className="flex items-center gap-2">
            <span>{meal.recipe?.icon || "🍽️"}</span>
            <span className="truncate">{meal.recipe?.name || meal.customMeal}</span>
          </span>
        ) : (
          "+ Add"
        )}
      </button>
      {meal?.recipe && (
        <Link
          href={`/cook/${meal.recipe.id}`}
          className="shrink-0 p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition"
        >
          <ChefHat size={18} />
        </Link>
      )}
    </div>
  );
}

// Recipe Modal Component
function RecipeModal({
  recipe,
  cuisines,
  onClose,
  onSave,
}: {
  recipe: Recipe | null;
  cuisines: string[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(recipe?.name || "");
  const [description, setDescription] = useState(recipe?.description || "");
  const [cuisine, setCuisine] = useState(recipe?.cuisine || "");
  const [icon, setIcon] = useState(recipe?.icon || "");
  const [prepTime, setPrepTime] = useState(recipe?.prepTime?.toString() || "");
  const [cookTime, setCookTime] = useState(recipe?.cookTime?.toString() || "");
  const [servings, setServings] = useState(recipe?.servings?.toString() || "4");
  const [difficulty, setDifficulty] = useState(recipe?.difficulty || "EASY");
  const [ingredients, setIngredients] = useState(
    recipe?.ingredients ? JSON.parse(recipe.ingredients).map((i: { name: string }) => i.name).join("\n") : ""
  );
  const [instructions, setInstructions] = useState(
    recipe?.instructions ? JSON.parse(recipe.instructions).join("\n") : ""
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const ingredientsArray = ingredients
      .split("\n")
      .filter(Boolean)
      .map((line: string) => ({ name: line.trim(), quantity: "", unit: "" }));

    const instructionsArray = instructions.split("\n").filter(Boolean);

    const body = {
      name,
      description: description || null,
      cuisine: cuisine || null,
      icon: icon || null,
      prepTime: prepTime ? parseInt(prepTime) : null,
      cookTime: cookTime ? parseInt(cookTime) : null,
      servings: parseInt(servings) || 4,
      difficulty,
      ingredients: ingredientsArray,
      instructions: instructionsArray,
    };

    try {
      const url = recipe ? `/api/recipes/${recipe.id}` : "/api/recipes";
      const method = recipe ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSave();
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {recipe ? "Edit Recipe" : "Add Recipe"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon (emoji)
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🍗"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuisine
              </label>
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                {cuisines.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prep Time (min)
              </label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cook Time (min)
              </label>
              <input
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ingredients * (one per line)
            </label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              required
              rows={5}
              placeholder="Chicken breast&#10;Yogurt&#10;Garlic"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions * (one step per line)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              required
              rows={5}
              placeholder="Mix marinade ingredients&#10;Coat chicken and refrigerate&#10;Grill until done"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : recipe ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Rating Modal Component
function RatingModal({
  recipe,
  familyMembers,
  onClose,
  onRate,
}: {
  recipe: Recipe;
  familyMembers: FamilyMember[];
  onClose: () => void;
  onRate: (
    recipeId: string,
    rating: number,
    notes: string,
    wouldMakeAgain: boolean,
    familyMemberId?: string
  ) => void;
}) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [wouldMakeAgain, setWouldMakeAgain] = useState(true);
  const [selectedMember, setSelectedMember] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Rate {recipe.name}</h2>

        <div className="space-y-4">
          {/* Rating Stars */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={
                      star <= rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              1★ Remove • 2★ Adjust • 3★ OK • 4★ Good • 5★ Favorite
            </p>
          </div>

          {/* Family Member */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Who is rating?
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Family-wide rating</option>
              {familyMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.avatar} {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Would Make Again */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="wouldMakeAgain"
              checked={wouldMakeAgain}
              onChange={(e) => setWouldMakeAgain(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="wouldMakeAgain" className="text-sm text-gray-700">
              Would make again
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Kids loved it! Next time add less spice..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                onRate(
                  recipe.id,
                  rating,
                  notes,
                  wouldMakeAgain,
                  selectedMember || undefined
                )
              }
              disabled={rating === 0}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
            >
              Submit Rating
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
