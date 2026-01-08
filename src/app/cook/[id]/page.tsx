"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Clock,
  ChefHat,
  Users,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Flame,
  Timer,
  Star,
  AlertCircle,
} from "lucide-react";

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  notes?: string;
}

interface RecipeVariation {
  id: string;
  variation: string;
  calories: number | null;
  protein: number | null;
  familyMember: {
    id: string;
    name: string;
    avatar: string | null;
    color: string;
  };
}

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
  avgRating: number | null;
  ratingCount: number;
  variations: RecipeVariation[];
}

export default function CookingPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/recipes/${recipeId}`);
      if (!res.ok) throw new Error("Recipe not found");
      const data = await res.json();
      setRecipe(data.recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recipe");
    } finally {
      setLoading(false);
    }
  };

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        // Auto-advance to next step
        if (index === activeStep && instructions.length > index + 1) {
          setActiveStep(index + 1);
        }
      }
      return next;
    });
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

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Recipe Not Found</h1>
          <p className="text-slate-600 mb-6">{error || "This recipe doesn't exist."}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Parse JSON fields
  let ingredients: Ingredient[] = [];
  let instructions: string[] = [];
  let tags: string[] = [];

  try {
    ingredients = JSON.parse(recipe.ingredients);
  } catch {
    ingredients = [];
  }

  try {
    instructions = JSON.parse(recipe.instructions);
  } catch {
    instructions = [];
  }

  try {
    tags = recipe.tags ? JSON.parse(recipe.tags) : [];
  } catch {
    tags = [];
  }

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const progress = instructions.length > 0
    ? Math.round((completedSteps.size / instructions.length) * 100)
    : 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY": return "bg-green-100 text-green-700";
      case "MEDIUM": return "bg-yellow-100 text-yellow-700";
      case "HARD": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  // Extract family-specific notes from instructions
  const getFamilyNotes = (step: string) => {
    const familyPatterns = [
      /\b(Dad|Mom|Kids?|Miguelito|Maggie)[\s:]/gi,
      /Reserve.*for\s+(kids?|children)/gi,
      /without\s+\w+\s+for\s+(kids?|children)/gi,
    ];
    return familyPatterns.some(pattern => pattern.test(step));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-lg shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{recipe.icon || "🍽️"}</span>
                <h1 className="text-xl font-bold text-slate-800 truncate">{recipe.name}</h1>
              </div>
              {recipe.cuisine && (
                <p className="text-sm text-slate-500">{recipe.cuisine} Cuisine</p>
              )}
            </div>
            {recipe.avgRating && (
              <div className="flex items-center gap-1 bg-amber-100 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-semibold text-amber-700">{recipe.avgRating}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
              <span>Cooking Progress</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-400 to-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-32 overflow-y-auto">
        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Prep</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{recipe.prepTime || 0} min</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-medium">Cook</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{recipe.cookTime || 0} min</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Timer className="w-4 h-4" />
              <span className="text-xs font-medium">Total</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{totalTime} min</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Servings</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{recipe.servings}</p>
          </div>
        </div>

        {/* Tags & Difficulty */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(recipe.difficulty)}`}>
            {recipe.difficulty}
          </span>
          {tags.map((tag, i) => (
            <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>

        {/* Description */}
        {recipe.description && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <p className="text-slate-600 leading-relaxed">{recipe.description}</p>
          </div>
        )}

        {/* Family Variations */}
        {recipe.variations && recipe.variations.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 mb-6 border border-purple-100">
            <h2 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Family Variations
            </h2>
            <div className="space-y-3">
              {recipe.variations.map((variation) => (
                <div key={variation.id} className="flex items-start gap-3 bg-white/60 rounded-xl p-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: variation.familyMember.color }}
                  >
                    {variation.familyMember.avatar || variation.familyMember.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{variation.familyMember.name}</p>
                    <p className="text-sm text-slate-600">{variation.variation}</p>
                    {(variation.calories || variation.protein) && (
                      <p className="text-xs text-slate-500 mt-1">
                        {variation.calories && `${variation.calories} cal`}
                        {variation.calories && variation.protein && " · "}
                        {variation.protein && `${variation.protein}g protein`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ingredients */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-500" />
            Ingredients
            <span className="ml-auto text-sm font-normal text-slate-400">
              {checkedIngredients.size}/{ingredients.length} ready
            </span>
          </h2>
          <div className="space-y-2">
            {ingredients.map((ingredient, index) => (
              <motion.button
                key={index}
                onClick={() => toggleIngredient(index)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  checkedIngredients.has(index)
                    ? "bg-green-50 border-green-200"
                    : "bg-slate-50 hover:bg-slate-100"
                } border`}
                whileTap={{ scale: 0.98 }}
              >
                {checkedIngredients.has(index) ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                )}
                <span className={`flex-1 ${checkedIngredients.has(index) ? "line-through text-slate-400" : "text-slate-700"}`}>
                  <span className="font-semibold">{ingredient.quantity} {ingredient.unit}</span>
                  {" "}{ingredient.name}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Instructions
            <span className="ml-auto text-sm font-normal text-slate-400">
              {completedSteps.size}/{instructions.length} done
            </span>
          </h2>
          <div className="space-y-3">
            {instructions.map((step, index) => {
              const isActive = index === activeStep;
              const isCompleted = completedSteps.has(index);
              const hasFamilyNote = getFamilyNotes(step);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative ${isActive && !isCompleted ? "ring-2 ring-orange-300 ring-offset-2" : ""}`}
                >
                  <button
                    onClick={() => toggleStep(index)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      isCompleted
                        ? "bg-green-50 border-green-200"
                        : isActive
                        ? "bg-orange-50 border-orange-200"
                        : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                    } border`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                          isCompleted
                            ? "bg-green-500 text-white"
                            : isActive
                            ? "bg-orange-500 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`leading-relaxed ${isCompleted ? "text-slate-400 line-through" : "text-slate-700"}`}>
                          {step}
                        </p>
                        {hasFamilyNote && !isCompleted && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-lg w-fit">
                            <Users className="w-3 h-3" />
                            Family variation note
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Completion Message */}
        {progress === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white text-center"
          >
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-xl font-bold mb-1">All Done!</h3>
            <p className="text-green-100">Great job cooking {recipe.name}!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
