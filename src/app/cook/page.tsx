"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChefHat,
  Clock,
  Star,
  Search,
  Flame,
  ArrowLeft,
  Filter,
} from "lucide-react";

interface Recipe {
  id: string;
  name: string;
  description: string | null;
  cuisine: string | null;
  icon: string | null;
  prepTime: number | null;
  cookTime: number | null;
  difficulty: string;
  avgRating: number | null;
  ratingCount: number;
  tags: string | null;
}

const CUISINES = ["All", "Mexican", "Asian", "Mediterranean", "American", "Italian"];

export default function CookPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const res = await fetch("/api/recipes");
      const data = await res.json();
      setRecipes(data.recipes || []);
    } catch (err) {
      console.error("Failed to load recipes:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine =
      selectedCuisine === "All" || recipe.cuisine === selectedCuisine;
    return matchesSearch && matchesCuisine;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY": return "bg-green-100 text-green-700";
      case "MEDIUM": return "bg-yellow-100 text-yellow-700";
      case "HARD": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
        <motion.div
          className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-lg shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <ChefHat className="w-7 h-7 text-orange-500" />
                Recipes
              </h1>
              <p className="text-sm text-slate-500">{recipes.length} recipes available</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl border-0 focus:ring-2 focus:ring-orange-300 transition-all"
            />
          </div>

          {/* Cuisine Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {CUISINES.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCuisine === cuisine
                    ? "bg-orange-500 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recipe List */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No recipes found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRecipes.map((recipe, index) => {
              const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
              let tags: string[] = [];
              try {
                tags = recipe.tags ? JSON.parse(recipe.tags) : [];
              } catch {
                tags = [];
              }

              return (
                <motion.button
                  key={recipe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => router.push(`/cook/${recipe.id}`)}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-left w-full"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-3xl shrink-0">
                      {recipe.icon || "🍽️"}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-800 text-lg">{recipe.name}</h3>
                        {recipe.avgRating && (
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg shrink-0">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-semibold text-amber-700">
                              {recipe.avgRating}
                            </span>
                          </div>
                        )}
                      </div>

                      {recipe.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {recipe.description}
                        </p>
                      )}

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="w-4 h-4" />
                          {totalTime} min
                        </div>
                        {recipe.cuisine && (
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Flame className="w-4 h-4" />
                            {recipe.cuisine}
                          </div>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                          {recipe.difficulty}
                        </span>
                      </div>

                      {/* Tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {tags.length > 3 && (
                            <span className="px-2 py-0.5 text-slate-400 text-xs">
                              +{tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
