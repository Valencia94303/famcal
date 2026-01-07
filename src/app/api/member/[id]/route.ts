import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get member portal data (points, chores, rewards, today's meals)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to find member by ID first, then by name (case-insensitive)
    let member = await prisma.familyMember.findUnique({
      where: { id },
    });

    if (!member) {
      // Try to find by name (for friendly URLs like /member/miguelito)
      // SQLite doesn't support case-insensitive mode, so we fetch all and compare
      const allMembers = await prisma.familyMember.findMany();
      member = allMembers.find(
        (m) => m.name.toLowerCase() === id.toLowerCase()
      ) || null;
    }

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Get points balance
    const transactions = await prisma.pointTransaction.aggregate({
      where: { familyMemberId: member.id },
      _sum: { amount: true },
    });
    const points = transactions._sum.amount || 0;

    // Get assigned chores with today's completion status
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignments = await prisma.choreAssignment.findMany({
      where: { assigneeId: member.id },
      include: {
        chore: true,
      },
    });

    // Check which chores were completed today
    const todayCompletions = await prisma.choreCompletion.findMany({
      where: {
        completedById: member.id,
        completedAt: {
          gte: today,
        },
      },
      select: { choreId: true },
    });

    const completedChoreIds = new Set(todayCompletions.map((c) => c.choreId));

    const chores = assignments
      .filter((a) => a.chore.isActive)
      .map((a) => ({
        id: a.chore.id,
        title: a.chore.title,
        description: a.chore.description,
        icon: a.chore.icon,
        points: a.chore.points,
        assignmentId: a.id,
        completedToday: completedChoreIds.has(a.chore.id),
      }));

    // Get active rewards
    const rewards = await prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { pointsCost: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        pointsCost: true,
        icon: true,
      },
    });

    // Helper to calculate week number and day of week for a date
    const getDayInfo = (date: Date) => {
      const dayOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getDay()];
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const weekOfYear = Math.ceil(
        ((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
      );
      const weekNumber = ((weekOfYear - 1) % 4) + 1;
      return { dayOfWeek, weekNumber };
    };

    // Get meals for today and the past 2 days (3 days total for rating)
    const days = [
      { date: today, label: "Today" },
      { date: new Date(today.getTime() - 86400000), label: "Yesterday" },
      { date: new Date(today.getTime() - 2 * 86400000), label: "2 days ago" },
    ];

    // Build query conditions for all days
    const dayConditions = days.map((d) => {
      const info = getDayInfo(d.date);
      return { weekNumber: info.weekNumber, dayOfWeek: info.dayOfWeek };
    });

    const mealPlanItems = await prisma.mealPlanItem.findMany({
      where: {
        isActive: true,
        OR: dayConditions,
      },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    // Get member's ratings for all recipes
    const recipeIds = mealPlanItems
      .filter((m) => m.recipe)
      .map((m) => m.recipe!.id);

    const myRatings = await prisma.recipeRating.findMany({
      where: {
        familyMemberId: member.id,
        recipeId: { in: recipeIds },
      },
      select: {
        recipeId: true,
        rating: true,
      },
    });

    const ratingsMap = new Map(myRatings.map((r) => [r.recipeId, r.rating]));

    // Group meals by day label
    const recentMeals = days.flatMap((d) => {
      const info = getDayInfo(d.date);
      const dayMeals = mealPlanItems.filter(
        (m) => m.weekNumber === info.weekNumber && m.dayOfWeek === info.dayOfWeek
      );
      return dayMeals.map((m) => ({
        id: m.id,
        mealType: m.mealType,
        recipe: m.recipe,
        customMeal: m.customMeal,
        myRating: m.recipe ? ratingsMap.get(m.recipe.id) || null : null,
        dayLabel: d.label,
      }));
    });

    // For backwards compatibility, also include todaysMeals (just today's)
    const todayInfo = getDayInfo(today);
    const todaysMeals = mealPlanItems
      .filter((m) => m.weekNumber === todayInfo.weekNumber && m.dayOfWeek === todayInfo.dayOfWeek)
      .map((m) => ({
        id: m.id,
        mealType: m.mealType,
        recipe: m.recipe,
        customMeal: m.customMeal,
        myRating: m.recipe ? ratingsMap.get(m.recipe.id) || null : null,
      }));

    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        color: member.color,
      },
      points,
      chores,
      rewards,
      todaysMeals,
      recentMeals, // Meals from today + past 2 days for rating
    });
  } catch (error) {
    console.error("Error fetching member data:", error);
    return NextResponse.json(
      { error: "Failed to fetch member data" },
      { status: 500 }
    );
  }
}
