import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/recipes - List recipes with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cuisine = searchParams.get("cuisine");
    const tag = searchParams.get("tag");
    const minRating = searchParams.get("minRating");
    const search = searchParams.get("search");
    const activeOnly = searchParams.get("activeOnly") !== "false";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (activeOnly) {
      where.isActive = true;
    }

    if (cuisine) {
      where.cuisine = cuisine;
    }

    if (tag) {
      where.tags = { contains: tag };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        ratings: {
          select: {
            rating: true,
            wouldMakeAgain: true,
          },
        },
        _count: {
          select: {
            mealPlanItems: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculate average rating for each recipe
    const recipesWithStats = recipes.map((recipe) => {
      const ratings = recipe.ratings;
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : null;
      const wouldMakeAgainPercent =
        ratings.length > 0
          ? (ratings.filter((r) => r.wouldMakeAgain).length / ratings.length) *
            100
          : null;

      return {
        ...recipe,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        wouldMakeAgainPercent: wouldMakeAgainPercent
          ? Math.round(wouldMakeAgainPercent)
          : null,
        ratingCount: ratings.length,
        usedInMealPlans: recipe._count.mealPlanItems,
        ratings: undefined,
        _count: undefined,
      };
    });

    // Filter by minimum rating if specified
    let filteredRecipes = recipesWithStats;
    if (minRating) {
      const minRatingNum = parseFloat(minRating);
      filteredRecipes = recipesWithStats.filter(
        (r) => r.avgRating !== null && r.avgRating >= minRatingNum
      );
    }

    return NextResponse.json({ recipes: filteredRecipes });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}

// POST /api/recipes - Create a new recipe
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      cuisine,
      icon,
      prepTime,
      cookTime,
      servings,
      difficulty,
      ingredients,
      instructions,
      tips,
      tags,
      mealTypes,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Recipe name is required" },
        { status: 400 }
      );
    }

    if (!ingredients || !instructions) {
      return NextResponse.json(
        { error: "Ingredients and instructions are required" },
        { status: 400 }
      );
    }

    const recipe = await prisma.recipe.create({
      data: {
        name,
        description,
        cuisine,
        icon,
        prepTime,
        cookTime,
        servings: servings || 4,
        difficulty: difficulty || "EASY",
        ingredients:
          typeof ingredients === "string"
            ? ingredients
            : JSON.stringify(ingredients),
        instructions:
          typeof instructions === "string"
            ? instructions
            : JSON.stringify(instructions),
        tips: tips
          ? typeof tips === "string"
            ? tips
            : JSON.stringify(tips)
          : null,
        tags: tags
          ? typeof tags === "string"
            ? tags
            : JSON.stringify(tags)
          : null,
        mealTypes: mealTypes
          ? typeof mealTypes === "string"
            ? mealTypes
            : JSON.stringify(mealTypes)
          : null,
      },
    });

    return NextResponse.json({ recipe }, { status: 201 });
  } catch (error) {
    console.error("Error creating recipe:", error);
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 }
    );
  }
}
