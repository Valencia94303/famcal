import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

// GET /api/meal-plan - Get meal plan (optional week filter)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const week = searchParams.get("week");

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (week) {
      where.weekNumber = parseInt(week, 10);
    }

    const mealPlanItems = await prisma.mealPlanItem.findMany({
      where,
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
            tags: true,
          },
        },
      },
      orderBy: [{ weekNumber: "asc" }, { dayOfWeek: "asc" }],
    });

    // Get recipe ratings for included recipes
    const recipeIds = mealPlanItems
      .filter((item) => item.recipe)
      .map((item) => item.recipe!.id);

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

    // Add ratings to recipes
    const itemsWithRatings = mealPlanItems.map((item) => ({
      ...item,
      recipe: item.recipe
        ? {
            ...item.recipe,
            ...(ratingsMap.get(item.recipe.id) || {
              avgRating: null,
              ratingCount: 0,
            }),
          }
        : null,
    }));

    // Group by week for easier consumption
    const groupedByWeek = itemsWithRatings.reduce(
      (acc, item) => {
        const week = item.weekNumber;
        if (!acc[week]) {
          acc[week] = {};
        }
        if (!acc[week][item.dayOfWeek]) {
          acc[week][item.dayOfWeek] = {};
        }
        acc[week][item.dayOfWeek][item.mealType] = item;
        return acc;
      },
      {} as Record<number, Record<string, Record<string, (typeof itemsWithRatings)[0]>>>
    );

    return NextResponse.json({
      items: itemsWithRatings,
      grouped: groupedByWeek,
      daysOfWeek: DAYS_OF_WEEK,
      mealTypes: MEAL_TYPES,
    });
  } catch (error) {
    console.error("Error fetching meal plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal plan" },
      { status: 500 }
    );
  }
}

// POST /api/meal-plan - Create or update a meal plan item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { weekNumber, dayOfWeek, mealType, recipeId, customMeal, notes } =
      body;

    // Validate required fields
    if (
      weekNumber === undefined ||
      weekNumber < 1 ||
      weekNumber > 4
    ) {
      return NextResponse.json(
        { error: "weekNumber must be between 1 and 4" },
        { status: 400 }
      );
    }

    if (!dayOfWeek || !DAYS_OF_WEEK.includes(dayOfWeek)) {
      return NextResponse.json(
        { error: `dayOfWeek must be one of: ${DAYS_OF_WEEK.join(", ")}` },
        { status: 400 }
      );
    }

    if (!mealType || !MEAL_TYPES.includes(mealType)) {
      return NextResponse.json(
        { error: `mealType must be one of: ${MEAL_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!recipeId && !customMeal) {
      return NextResponse.json(
        { error: "Either recipeId or customMeal is required" },
        { status: 400 }
      );
    }

    // If recipeId provided, verify it exists
    if (recipeId) {
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
      });
      if (!recipe) {
        return NextResponse.json(
          { error: "Recipe not found" },
          { status: 404 }
        );
      }
    }

    // Upsert the meal plan item (unique on weekNumber + dayOfWeek + mealType)
    const mealPlanItem = await prisma.mealPlanItem.upsert({
      where: {
        weekNumber_dayOfWeek_mealType: {
          weekNumber,
          dayOfWeek,
          mealType,
        },
      },
      update: {
        recipeId: recipeId || null,
        customMeal: customMeal || null,
        notes,
        isActive: true,
      },
      create: {
        weekNumber,
        dayOfWeek,
        mealType,
        recipeId: recipeId || null,
        customMeal: customMeal || null,
        notes,
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
          },
        },
      },
    });

    return NextResponse.json({ item: mealPlanItem }, { status: 201 });
  } catch (error) {
    console.error("Error creating/updating meal plan item:", error);
    return NextResponse.json(
      { error: "Failed to create/update meal plan item" },
      { status: 500 }
    );
  }
}

// DELETE /api/meal-plan - Delete a meal plan item
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const weekNumber = searchParams.get("weekNumber");
    const dayOfWeek = searchParams.get("dayOfWeek");
    const mealType = searchParams.get("mealType");

    if (id) {
      // Delete by ID
      await prisma.mealPlanItem.delete({
        where: { id },
      });
    } else if (weekNumber && dayOfWeek && mealType) {
      // Delete by composite key
      await prisma.mealPlanItem.delete({
        where: {
          weekNumber_dayOfWeek_mealType: {
            weekNumber: parseInt(weekNumber, 10),
            dayOfWeek,
            mealType,
          },
        },
      });
    } else {
      return NextResponse.json(
        {
          error:
            "Either id or (weekNumber, dayOfWeek, mealType) is required",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meal plan item:", error);
    return NextResponse.json(
      { error: "Failed to delete meal plan item" },
      { status: 500 }
    );
  }
}
