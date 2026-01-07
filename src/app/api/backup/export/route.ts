import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Export current state as downloadable JSON
export async function GET() {
  try {
    // Collect all data
    const [
      settings,
      pointsSettings,
      familyMembers,
      chores,
      choreAssignments,
      rewards,
      habits,
      scheduleItems,
      shoppingItems,
      tasks,
      recipes,
      recipeRatings,
      recipeVariations,
      mealPlanItems,
      dietaryPreferences,
    ] = await Promise.all([
      prisma.settings.findUnique({ where: { id: "singleton" } }),
      prisma.pointsSettings.findUnique({ where: { id: "singleton" } }),
      prisma.familyMember.findMany({
        orderBy: { createdAt: "asc" },
      }),
      prisma.chore.findMany({
        orderBy: { createdAt: "asc" },
      }),
      prisma.choreAssignment.findMany(),
      prisma.reward.findMany({
        orderBy: { createdAt: "asc" },
      }),
      prisma.habit.findMany({
        orderBy: { createdAt: "asc" },
      }),
      prisma.scheduleItem.findMany({
        orderBy: { time: "asc" },
      }),
      prisma.shoppingItem.findMany({
        orderBy: { createdAt: "asc" },
      }),
      prisma.task.findMany({
        orderBy: { createdAt: "asc" },
      }),
      prisma.recipe.findMany({
        orderBy: { createdAt: "asc" },
      }),
      prisma.recipeRating.findMany({
        orderBy: { createdAt: "asc" },
      }),
      prisma.recipeVariation.findMany(),
      prisma.mealPlanItem.findMany({
        orderBy: [{ weekNumber: "asc" }, { dayOfWeek: "asc" }],
      }),
      prisma.dietaryPreference.findMany(),
    ]);

    const backupData = {
      version: "1.1",
      exportedAt: new Date().toISOString(),
      settings,
      pointsSettings,
      familyMembers,
      chores,
      choreAssignments,
      rewards,
      habits,
      scheduleItems,
      shoppingItems,
      tasks,
      recipes,
      recipeRatings,
      recipeVariations,
      mealPlanItems,
      dietaryPreferences,
    };

    const filename = `famcal-backup-${new Date().toISOString().split("T")[0]}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting backup:", error);
    return NextResponse.json(
      { error: "Failed to export backup" },
      { status: 500 }
    );
  }
}
