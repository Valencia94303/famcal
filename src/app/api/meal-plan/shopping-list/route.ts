import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Store options for Stockton, CA area
const STORES = {
  COSTCO: "COSTCO",
  WINCO: "WINCO",
  WALMART: "WALMART",
  TRADER_JOES: "TRADER_JOES",
  RANCH_99: "RANCH_99",
  CARDENAS: "CARDENAS",
  SAFEWAY: "SAFEWAY",
  TARGET: "TARGET",
  OTHER: "OTHER",
} as const;

// Map ingredient keywords to best store (price + availability) for Stockton, CA
const STORE_MAPPING: { keywords: string[]; store: string; priority: number }[] = [
  // Costco - bulk proteins, dairy, produce basics
  {
    keywords: ["chicken breast", "chicken thigh", "steak", "ny steak", "ground beef", "pork", "salmon", "shrimp", "eggs", "greek yogurt", "cheese", "butter", "olive oil", "avocado oil"],
    store: STORES.COSTCO,
    priority: 1
  },
  // 99 Ranch Market - Asian groceries (Stockton has one)
  {
    keywords: ["soy sauce", "tamari", "sesame oil", "rice vinegar", "fish sauce", "hoisin", "sriracha", "ginger", "bok choy", "napa cabbage", "rice noodle", "tofu", "miso", "nori", "wasabi", "sake", "mirin"],
    store: STORES.RANCH_99,
    priority: 1
  },
  // Cardenas Markets - Mexican groceries (multiple in Stockton)
  {
    keywords: ["chipotle", "adobo", "tomatillo", "cotija", "queso fresco", "chorizo", "carnitas", "al pastor", "tortilla", "masa", "poblano", "serrano", "habanero", "achiote", "epazote"],
    store: STORES.CARDENAS,
    priority: 1
  },
  // Trader Joe's - specialty items (Stockton location)
  {
    keywords: ["everything bagel", "cauliflower rice", "riced cauliflower", "tzatziki", "hummus", "pita", "feta"],
    store: STORES.TRADER_JOES,
    priority: 2
  },
  // WinCo - fresh produce, bulk items, great prices
  {
    keywords: ["romaine", "lettuce", "spinach", "cilantro", "lime", "lemon", "avocado", "tomato", "onion", "garlic", "bell pepper", "jalapeño", "cabbage", "broccoli", "zucchini", "squash", "carrot", "celery", "cucumber", "mushroom"],
    store: STORES.WINCO,
    priority: 1
  },
  // Walmart - pantry staples, good prices
  {
    keywords: ["salt", "pepper", "cumin", "paprika", "oregano", "bay leaf", "cinnamon", "flour", "sugar", "rice", "pasta", "beans", "canned", "broth", "stock", "vinegar", "mustard", "mayo", "ketchup"],
    store: STORES.WALMART,
    priority: 2
  },
];

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  notes?: string;
}

interface AggregatedItem {
  name: string;
  quantities: { quantity: string; unit: string; recipe: string }[];
  store: string;
  category: string;
}

// Categorize ingredients for shopping organization
function getCategory(name: string): string {
  const lowerName = name.toLowerCase();

  if (/chicken|beef|steak|pork|fish|salmon|shrimp|chorizo|carnitas/.test(lowerName)) {
    return "🥩 Proteins";
  }
  if (/egg|yogurt|cheese|butter|cream|milk|sour cream/.test(lowerName)) {
    return "🥛 Dairy";
  }
  if (/lettuce|romaine|spinach|cilantro|cabbage|broccoli|carrot|onion|garlic|tomato|pepper|avocado|lime|lemon|cucumber|zucchini|mushroom|celery/.test(lowerName)) {
    return "🥬 Produce";
  }
  if (/rice|pasta|flour|tortilla|bread|noodle/.test(lowerName)) {
    return "🍞 Grains";
  }
  if (/oil|vinegar|soy|sauce|broth|stock|mayo|mustard|salsa/.test(lowerName)) {
    return "🫙 Pantry";
  }
  if (/salt|pepper|cumin|paprika|oregano|spice|seasoning/.test(lowerName)) {
    return "🧂 Spices";
  }
  if (/bean|lentil|chickpea/.test(lowerName)) {
    return "🫘 Legumes";
  }

  return "📦 Other";
}

// Find best store for an ingredient
function getBestStore(ingredientName: string): string {
  const lowerName = ingredientName.toLowerCase();

  let bestMatch: { store: string; priority: number } | null = null;

  for (const mapping of STORE_MAPPING) {
    for (const keyword of mapping.keywords) {
      if (lowerName.includes(keyword) || keyword.includes(lowerName)) {
        if (!bestMatch || mapping.priority < bestMatch.priority) {
          bestMatch = { store: mapping.store, priority: mapping.priority };
        }
      }
    }
  }

  return bestMatch?.store || STORES.WINCO; // Default to WinCo for general groceries
}

// GET - Generate shopping list from meal plan for specified weeks
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weeksParam = searchParams.get("weeks") || "2,3,4"; // Default: weeks 2-4 (skip week 1)
    const weeks = weeksParam.split(",").map(w => parseInt(w.trim())).filter(w => w >= 1 && w <= 4);

    if (weeks.length === 0) {
      return NextResponse.json({ error: "Invalid weeks parameter" }, { status: 400 });
    }

    // Get meal plan items for specified weeks
    const mealPlanItems = await prisma.mealPlanItem.findMany({
      where: {
        weekNumber: { in: weeks },
        isActive: true,
        recipeId: { not: null },
      },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            ingredients: true,
          },
        },
      },
    });

    // Aggregate ingredients across all recipes
    const ingredientMap = new Map<string, AggregatedItem>();

    for (const item of mealPlanItems) {
      if (!item.recipe?.ingredients) continue;

      let ingredients: Ingredient[];
      try {
        ingredients = JSON.parse(item.recipe.ingredients);
      } catch {
        continue;
      }

      for (const ing of ingredients) {
        const normalizedName = ing.name.trim();
        const key = normalizedName.toLowerCase();

        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          existing.quantities.push({
            quantity: ing.quantity,
            unit: ing.unit,
            recipe: item.recipe.name,
          });
        } else {
          ingredientMap.set(key, {
            name: normalizedName,
            quantities: [{
              quantity: ing.quantity,
              unit: ing.unit,
              recipe: item.recipe.name,
            }],
            store: getBestStore(normalizedName),
            category: getCategory(normalizedName),
          });
        }
      }
    }

    // Convert to array and sort by category, then store
    const items = Array.from(ingredientMap.values());
    items.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      if (a.store !== b.store) return a.store.localeCompare(b.store);
      return a.name.localeCompare(b.name);
    });

    // Group by store for easy shopping
    const byStore: Record<string, AggregatedItem[]> = {};
    for (const item of items) {
      if (!byStore[item.store]) byStore[item.store] = [];
      byStore[item.store].push(item);
    }

    // Also group by category
    const byCategory: Record<string, AggregatedItem[]> = {};
    for (const item of items) {
      if (!byCategory[item.category]) byCategory[item.category] = [];
      byCategory[item.category].push(item);
    }

    return NextResponse.json({
      weeks,
      totalItems: items.length,
      items,
      byStore,
      byCategory,
      stores: Object.keys(STORES),
    });
  } catch (error) {
    console.error("Error generating shopping list:", error);
    return NextResponse.json(
      { error: "Failed to generate shopping list" },
      { status: 500 }
    );
  }
}

// POST - Add generated items to actual shopping list
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, clearExisting = false } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Items array required" }, { status: 400 });
    }

    // Optionally clear existing unchecked items
    if (clearExisting) {
      await prisma.shoppingItem.deleteMany({
        where: { checked: false },
      });
    }

    // Create shopping items
    const created = await prisma.shoppingItem.createMany({
      data: items.map((item: { name: string; quantity?: number; unit?: string; store?: string; notes?: string }) => ({
        name: item.name,
        quantity: item.quantity || 1,
        unit: item.unit || null,
        store: item.store || "OTHER",
        notes: item.notes || null,
        checked: false,
      })),
    });

    return NextResponse.json({
      success: true,
      created: created.count,
    });
  } catch (error) {
    console.error("Error adding to shopping list:", error);
    return NextResponse.json(
      { error: "Failed to add items to shopping list" },
      { status: 500 }
    );
  }
}
