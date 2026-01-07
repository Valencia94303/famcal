"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Star, Calendar, Utensils, Filter, ShoppingCart, Check, Store } from "lucide-react";

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
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab("recipes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === "recipes"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Utensils size={18} />
          Recipes
        </button>
        <button
          onClick={() => setActiveTab("mealplan")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === "mealplan"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Calendar size={18} />
          Meal Plan
        </button>
        <button
          onClick={() => setActiveTab("ratings")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === "ratings"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Star size={18} />
          Ratings
        </button>
        <button
          onClick={() => {
            setActiveTab("shopping");
            if (!shoppingList) fetchShoppingList(shoppingWeeks);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === "shopping"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <ShoppingCart size={18} />
          Shopping List
        </button>
      </div>

      {/* Recipes Tab */}
      {activeTab === "recipes" && (
        <div className="space-y-4">
          {/* Search and Add */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                setEditingRecipe(null);
                setShowRecipeModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              <Plus size={18} />
              Add Recipe
            </button>
          </div>

          {/* Recipe Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{recipe.icon || "🍽️"}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">{recipe.name}</h3>
                      {recipe.cuisine && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {recipe.cuisine}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="mt-3 flex items-center gap-2">
                  {recipe.avgRating ? (
                    <>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={
                              star <= recipe.avgRating!
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        ({recipe.ratingCount})
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">No ratings yet</span>
                  )}
                </div>

                {/* Time */}
                {(recipe.prepTime || recipe.cookTime) && (
                  <p className="text-sm text-gray-500 mt-2">
                    ⏱️ {(recipe.prepTime || 0) + (recipe.cookTime || 0)} min
                  </p>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setRatingRecipe(recipe);
                      setShowRatingModal(true);
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition"
                  >
                    Rate
                  </button>
                  <button
                    onClick={() => {
                      setEditingRecipe(recipe);
                      setShowRecipeModal(true);
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredRecipes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
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
          {/* Week Selector */}
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-700">Week:</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((week) => (
                <button
                  key={week}
                  onClick={() => setSelectedWeek(week)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedWeek === week
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {week}
                </button>
              ))}
            </div>
          </div>

          {/* Meal Plan Grid */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left bg-gray-100 rounded-tl-lg">Day</th>
                  {MEAL_TYPES.map((type) => (
                    <th key={type} className="p-2 text-left bg-gray-100">
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS_OF_WEEK.map((day) => (
                  <tr key={day} className="border-t">
                    <td className="p-2 font-medium text-gray-700 bg-gray-50">
                      {DAY_LABELS[day]}
                    </td>
                    {MEAL_TYPES.map((mealType) => {
                      const meal = mealPlan[selectedWeek]?.[day]?.[mealType];
                      return (
                        <td key={mealType} className="p-2">
                          <MealSlot
                            meal={meal}
                            recipes={recipes}
                            onAssign={(recipeId, customMeal) =>
                              handleAssignMeal(selectedWeek, day, mealType, recipeId, customMeal)
                            }
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ratings Tab */}
      {activeTab === "ratings" && (
        <div className="space-y-4">
          {/* Rating Filter */}
          <div className="flex items-center gap-4">
            <Filter size={18} className="text-gray-500" />
            <button
              onClick={() => setRatingFilter("all")}
              className={`px-3 py-1 rounded-lg text-sm transition ${
                ratingFilter === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRatingFilter("low")}
              className={`px-3 py-1 rounded-lg text-sm transition ${
                ratingFilter === "low"
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Low Rated (1-2★)
            </button>
            <button
              onClick={() => setRatingFilter("high")}
              className={`px-3 py-1 rounded-lg text-sm transition ${
                ratingFilter === "high"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Favorites (4-5★)
            </button>
          </div>

          {/* Ratings List */}
          <div className="space-y-3">
            {filteredRecipes
              .filter((r) => r.ratingCount > 0)
              .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
              .map((recipe) => (
                <div
                  key={recipe.id}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    recipe.avgRating && recipe.avgRating <= 2
                      ? "bg-red-50 border-red-200"
                      : recipe.avgRating && recipe.avgRating >= 4
                        ? "bg-green-50 border-green-200"
                        : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{recipe.icon || "🍽️"}</span>
                    <div>
                      <h3 className="font-semibold">{recipe.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={
                                star <= (recipe.avgRating || 0)
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {recipe.avgRating?.toFixed(1)} ({recipe.ratingCount} ratings)
                        </span>
                        {recipe.wouldMakeAgainPercent !== null && (
                          <span className="text-sm text-gray-500">
                            • {recipe.wouldMakeAgainPercent}% would make again
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {recipe.avgRating && recipe.avgRating <= 2 && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                        Consider removing
                      </span>
                    )}
                    {recipe.avgRating && recipe.avgRating >= 4.5 && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                        Family favorite
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setRatingRecipe(recipe);
                        setShowRatingModal(true);
                      }}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition"
                    >
                      Update Rating
                    </button>
                  </div>
                </div>
              ))}

            {filteredRecipes.filter((r) => r.ratingCount > 0).length === 0 && (
              <div className="text-center py-12 text-gray-500">
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
          {/* Week Selector */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="font-medium text-gray-700">Generate for weeks:</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((week) => (
                  <button
                    key={week}
                    onClick={() => {
                      const newWeeks = shoppingWeeks.includes(week)
                        ? shoppingWeeks.filter((w) => w !== week)
                        : [...shoppingWeeks, week].sort();
                      setShoppingWeeks(newWeeks);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      shoppingWeeks.includes(week)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Week {week}
                    {week === 1 && <span className="text-xs ml-1">(fridge)</span>}
                  </button>
                ))}
              </div>
              <button
                onClick={() => fetchShoppingList(shoppingWeeks)}
                disabled={shoppingLoading || shoppingWeeks.length === 0}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
              >
                {shoppingLoading ? "Loading..." : "Generate List"}
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShoppingViewMode("store")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition ${
                  shoppingViewMode === "store"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Store size={16} />
                By Store
              </button>
              <button
                onClick={() => setShoppingViewMode("category")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition ${
                  shoppingViewMode === "category"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Filter size={16} />
                By Category
              </button>
            </div>
          </div>

          {/* Shopping List Content */}
          {shoppingLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : shoppingList ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-800">
                      Shopping List for Weeks {shoppingList.weeks.join(", ")}
                    </h3>
                    <p className="text-sm text-blue-600">
                      {shoppingList.totalItems} items across {Object.keys(shoppingList.byStore).length} stores
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addToShoppingList(false)}
                      disabled={addingToList}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
                    >
                      <Plus size={18} />
                      {addingToList ? "Adding..." : "Add to List"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("This will clear existing unchecked items. Continue?")) {
                          addToShoppingList(true);
                        }
                      }}
                      disabled={addingToList}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition"
                    >
                      Replace List
                    </button>
                  </div>
                </div>
              </div>

              {/* Items grouped by store or category */}
              {shoppingViewMode === "store" ? (
                <div className="space-y-6">
                  {Object.entries(shoppingList.byStore).map(([store, items]) => (
                    <div key={store} className="bg-white border rounded-xl overflow-hidden">
                      <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">
                          {STORE_LABELS[store] || store}
                        </h3>
                        <span className="text-sm text-gray-500">{items.length} items</span>
                      </div>
                      <div className="divide-y">
                        {items.map((item, idx) => (
                          <div key={idx} className="px-4 py-3 flex items-start justify-between hover:bg-gray-50">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">{item.name}</span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                  {item.category}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                For: {[...new Set(item.quantities.map((q) => q.recipe))].join(", ")}
                              </p>
                            </div>
                            <div className="text-sm text-gray-600">
                              {item.quantities.map((q, i) => (
                                <span key={i} className="block text-right">
                                  {q.quantity} {q.unit}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(shoppingList.byCategory).map(([category, items]) => (
                    <div key={category} className="bg-white border rounded-xl overflow-hidden">
                      <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">{category}</h3>
                        <span className="text-sm text-gray-500">{items.length} items</span>
                      </div>
                      <div className="divide-y">
                        {items.map((item, idx) => (
                          <div key={idx} className="px-4 py-3 flex items-start justify-between hover:bg-gray-50">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">{item.name}</span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                  {STORE_LABELS[item.store] || item.store}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                For: {[...new Set(item.quantities.map((q) => q.recipe))].join(", ")}
                              </p>
                            </div>
                            <div className="text-sm text-gray-600">
                              {item.quantities.map((q, i) => (
                                <span key={i} className="block text-right">
                                  {q.quantity} {q.unit}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select weeks and click Generate List</p>
              <p className="text-sm">Week 1 items are typically already in your fridge</p>
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
      <div className="space-y-2">
        <select
          value={selectedRecipeId}
          onChange={(e) => {
            setSelectedRecipeId(e.target.value);
            setCustomMeal("");
          }}
          className="w-full px-2 py-1 text-sm border rounded"
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
          placeholder="Or custom meal..."
          value={customMeal}
          onChange={(e) => {
            setCustomMeal(e.target.value);
            setSelectedRecipeId("");
          }}
          className="w-full px-2 py-1 text-sm border rounded"
        />
        <div className="flex gap-1">
          <button
            onClick={() => {
              onAssign(selectedRecipeId || null, customMeal || null);
              setIsEditing(false);
            }}
            className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-2 py-1 text-xs bg-gray-200 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={`w-full text-left p-2 rounded-lg border-2 border-dashed transition ${
        meal
          ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
      }`}
    >
      {meal ? (
        <div className="flex items-center gap-2">
          <span>{meal.recipe?.icon || "🍽️"}</span>
          <span className="text-sm truncate">
            {meal.recipe?.name || meal.customMeal}
          </span>
        </div>
      ) : (
        <span className="text-sm text-gray-400">+ Add meal</span>
      )}
    </button>
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
