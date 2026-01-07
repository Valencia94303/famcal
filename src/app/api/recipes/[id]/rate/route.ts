import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/recipes/[id]/rate - Add or update a rating
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recipeId } = await params;
    const body = await request.json();
    const { familyMemberId, rating, notes, wouldMakeAgain } = body;

    // Validate rating
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    // Verify recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // If familyMemberId provided, verify member exists
    if (familyMemberId) {
      const member = await prisma.familyMember.findUnique({
        where: { id: familyMemberId },
      });
      if (!member) {
        return NextResponse.json(
          { error: "Family member not found" },
          { status: 404 }
        );
      }
    }

    // Check for existing rating from this member (or family-wide if no member)
    const existingRating = await prisma.recipeRating.findFirst({
      where: {
        recipeId,
        familyMemberId: familyMemberId || null,
      },
    });

    let recipeRating;

    if (existingRating) {
      // Update existing rating
      recipeRating = await prisma.recipeRating.update({
        where: { id: existingRating.id },
        data: {
          rating,
          notes: notes ?? existingRating.notes,
          wouldMakeAgain: wouldMakeAgain ?? existingRating.wouldMakeAgain,
        },
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
      });
    } else {
      // Create new rating
      recipeRating = await prisma.recipeRating.create({
        data: {
          recipeId,
          familyMemberId: familyMemberId || null,
          rating,
          notes,
          wouldMakeAgain: wouldMakeAgain ?? true,
        },
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
      });
    }

    // Get updated average rating for the recipe
    const allRatings = await prisma.recipeRating.findMany({
      where: { recipeId },
      select: { rating: true, wouldMakeAgain: true },
    });

    const avgRating =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
        : null;

    const wouldMakeAgainPercent =
      allRatings.length > 0
        ? (allRatings.filter((r) => r.wouldMakeAgain).length /
            allRatings.length) *
          100
        : null;

    return NextResponse.json({
      rating: recipeRating,
      recipeStats: {
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        wouldMakeAgainPercent: wouldMakeAgainPercent
          ? Math.round(wouldMakeAgainPercent)
          : null,
        ratingCount: allRatings.length,
      },
    });
  } catch (error) {
    console.error("Error rating recipe:", error);
    return NextResponse.json(
      { error: "Failed to rate recipe" },
      { status: 500 }
    );
  }
}

// GET /api/recipes/[id]/rate - Get all ratings for a recipe
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recipeId } = await params;

    const ratings = await prisma.recipeRating.findMany({
      where: { recipeId },
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
    });

    // Calculate stats
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : null;

    const wouldMakeAgainPercent =
      ratings.length > 0
        ? (ratings.filter((r) => r.wouldMakeAgain).length / ratings.length) *
          100
        : null;

    return NextResponse.json({
      ratings,
      stats: {
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        wouldMakeAgainPercent: wouldMakeAgainPercent
          ? Math.round(wouldMakeAgainPercent)
          : null,
        ratingCount: ratings.length,
      },
    });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return NextResponse.json(
      { error: "Failed to fetch ratings" },
      { status: 500 }
    );
  }
}

// DELETE /api/recipes/[id]/rate - Delete a rating
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recipeId } = await params;
    const { searchParams } = new URL(request.url);
    const ratingId = searchParams.get("ratingId");

    if (!ratingId) {
      return NextResponse.json(
        { error: "ratingId is required" },
        { status: 400 }
      );
    }

    // Verify rating belongs to this recipe
    const rating = await prisma.recipeRating.findFirst({
      where: {
        id: ratingId,
        recipeId,
      },
    });

    if (!rating) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    await prisma.recipeRating.delete({
      where: { id: ratingId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rating:", error);
    return NextResponse.json(
      { error: "Failed to delete rating" },
      { status: 500 }
    );
  }
}
