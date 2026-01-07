import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// Helper to determine current week number (1-4) based on date
function getCurrentWeekNumber(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 +
      startOfYear.getDay() +
      1) /
      7
  );
  // Cycle through weeks 1-4
  return ((weekNum - 1) % 4) + 1;
}

// GET /api/meal-plan/today - Get today's meals for dashboard
export async function GET() {
  try {
    const now = new Date();
    const dayOfWeek = DAYS_OF_WEEK[now.getDay()];
    const weekNumber = getCurrentWeekNumber();

    const todaysMeals = await prisma.mealPlanItem.findMany({
      where: {
        weekNumber,
        dayOfWeek,
        isActive: true,
      },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            icon: true,
            cuisine: true,
            prepTime: true,
            cookTime: true,
            difficulty: true,
            ingredients: true,
            instructions: true,
          },
        },
      },
      orderBy: {
        mealType: "asc",
      },
    });

    // Get recipe ratings
    const recipeIds = todaysMeals
      .filter((meal) => meal.recipe)
      .map((meal) => meal.recipe!.id);

    const ratings = await prisma.recipeRating.groupBy({
      by: ["recipeId"],
      where: {
        recipeId: { in: recipeIds },
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    const ratingsMap = new Map(
      ratings.map((r) => [
        r.recipeId,
        {
          avgRating: r._avg.rating
            ? Math.round(r._avg.rating * 10) / 10
            : null,
          ratingCount: r._count.rating,
        },
      ])
    );

    // Sort meals by meal type order
    const mealTypeOrder = ["BREAKFAST", "LUNCH", "SNACK", "DINNER"];
    const sortedMeals = todaysMeals.sort(
      (a, b) =>
        mealTypeOrder.indexOf(a.mealType) - mealTypeOrder.indexOf(b.mealType)
    );

    // Format response
    const meals = sortedMeals.map((meal) => ({
      id: meal.id,
      mealType: meal.mealType,
      recipe: meal.recipe
        ? {
            id: meal.recipe.id,
            name: meal.recipe.name,
            icon: meal.recipe.icon,
            cuisine: meal.recipe.cuisine,
            prepTime: meal.recipe.prepTime,
            cookTime: meal.recipe.cookTime,
            difficulty: meal.recipe.difficulty,
            ...(ratingsMap.get(meal.recipe.id) || {
              avgRating: null,
              ratingCount: 0,
            }),
          }
        : null,
      customMeal: meal.customMeal,
      notes: meal.notes,
    }));

    // Create a map for easier widget consumption
    const mealsByType = meals.reduce(
      (acc, meal) => {
        acc[meal.mealType] = meal;
        return acc;
      },
      {} as Record<string, (typeof meals)[0]>
    );

    return NextResponse.json({
      date: now.toISOString().split("T")[0],
      dayOfWeek,
      weekNumber,
      meals,
      mealsByType,
    });
  } catch (error) {
    console.error("Error fetching today's meals:", error);
    return NextResponse.json(
      { error: "Failed to fetch today's meals" },
      { status: 500 }
    );
  }
}
