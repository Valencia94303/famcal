import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST log a habit completion (awards points)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { habitId, familyMemberId, date } = body;

    if (!habitId || !familyMemberId) {
      return NextResponse.json(
        { error: "habitId and familyMemberId are required" },
        { status: 400 }
      );
    }

    const completedDate = date || new Date().toISOString().split("T")[0];

    // Get the habit to check points
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    // Check if already completed today
    const existing = await prisma.habitLog.findUnique({
      where: {
        habitId_familyMemberId_completedDate: {
          habitId,
          familyMemberId,
          completedDate,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already completed today" },
        { status: 400 }
      );
    }

    // Create log and award points in a transaction
    const [log] = await prisma.$transaction([
      prisma.habitLog.create({
        data: {
          habitId,
          familyMemberId,
          completedDate,
        },
        include: { habit: true, familyMember: true },
      }),
      // Award points
      prisma.pointTransaction.create({
        data: {
          familyMemberId,
          amount: habit.points,
          type: "HABIT_COMPLETION",
          description: `Completed: ${habit.name}`,
        },
      }),
    ]);

    return NextResponse.json({ log, pointsAwarded: habit.points }, { status: 201 });
  } catch (error) {
    console.error("Error logging habit:", error);
    return NextResponse.json(
      { error: "Failed to log habit" },
      { status: 500 }
    );
  }
}

// DELETE undo a habit completion (removes points)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const habitId = searchParams.get("habitId");
    const familyMemberId = searchParams.get("familyMemberId");
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!habitId || !familyMemberId) {
      return NextResponse.json(
        { error: "habitId and familyMemberId are required" },
        { status: 400 }
      );
    }

    // Get the habit to know how many points to remove
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    // Delete log and remove points
    await prisma.$transaction([
      prisma.habitLog.delete({
        where: {
          habitId_familyMemberId_completedDate: {
            habitId,
            familyMemberId,
            completedDate: date,
          },
        },
      }),
      // Remove points
      prisma.pointTransaction.create({
        data: {
          familyMemberId,
          amount: -habit.points,
          type: "HABIT_UNDO",
          description: `Undone: ${habit.name}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error undoing habit:", error);
    return NextResponse.json(
      { error: "Failed to undo habit" },
      { status: 500 }
    );
  }
}
