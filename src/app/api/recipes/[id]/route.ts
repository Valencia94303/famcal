import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/recipes/[id] - Get single recipe with full details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ratings: {
          include: {
            familyMember: {
              select: {
                id: true,
                name: true,
                avatar: true,
                color: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        variations: {
          include: {
            familyMember: {
              select: {
                id: true,
                name: true,
                avatar: true,
                color: true,
              },
            },
          },
        },
        mealPlanItems: {
          where: { isActive: true },
          select: {
            weekNumber: true,
            dayOfWeek: true,
            mealType: true,
          },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Calculate stats
    const avgRating =
      recipe.ratings.length > 0
        ? recipe.ratings.reduce((sum, r) => sum + r.rating, 0) /
          recipe.ratings.length
        : null;

    const wouldMakeAgainPercent =
      recipe.ratings.length > 0
        ? (recipe.ratings.filter((r) => r.wouldMakeAgain).length /
            recipe.ratings.length) *
          100
        : null;

    return NextResponse.json({
      recipe: {
        ...recipe,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        wouldMakeAgainPercent: wouldMakeAgainPercent
          ? Math.round(wouldMakeAgainPercent)
          : null,
        ratingCount: recipe.ratings.length,
      },
    });
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipe" },
      { status: 500 }
    );
  }
}

// PUT /api/recipes/[id] - Update recipe
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      isActive,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (cuisine !== undefined) updateData.cuisine = cuisine;
    if (icon !== undefined) updateData.icon = icon;
    if (prepTime !== undefined) updateData.prepTime = prepTime;
    if (cookTime !== undefined) updateData.cookTime = cookTime;
    if (servings !== undefined) updateData.servings = servings;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (ingredients !== undefined) {
      updateData.ingredients =
        typeof ingredients === "string"
          ? ingredients
          : JSON.stringify(ingredients);
    }
    if (instructions !== undefined) {
      updateData.instructions =
        typeof instructions === "string"
          ? instructions
          : JSON.stringify(instructions);
    }
    if (tips !== undefined) {
      updateData.tips =
        tips === null
          ? null
          : typeof tips === "string"
            ? tips
            : JSON.stringify(tips);
    }
    if (tags !== undefined) {
      updateData.tags =
        tags === null
          ? null
          : typeof tags === "string"
            ? tags
            : JSON.stringify(tags);
    }
    if (mealTypes !== undefined) {
      updateData.mealTypes =
        mealTypes === null
          ? null
          : typeof mealTypes === "string"
            ? mealTypes
            : JSON.stringify(mealTypes);
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("Error updating recipe:", error);
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
}

// DELETE /api/recipes/[id] - Delete recipe
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.recipe.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return NextResponse.json(
      { error: "Failed to delete recipe" },
      { status: 500 }
    );
  }
}
