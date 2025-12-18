import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all habits with today's completion status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const habits = await prisma.habit.findMany({
      where: { isActive: true },
      include: {
        logs: {
          where: { completedDate: date },
          include: { familyMember: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ habits, date });
  } catch (error) {
    console.error("Error fetching habits:", error);
    return NextResponse.json(
      { error: "Failed to fetch habits" },
      { status: 500 }
    );
  }
}

// POST create a new habit
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, icon, points, frequency } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Habit name is required" },
        { status: 400 }
      );
    }

    const habit = await prisma.habit.create({
      data: {
        name: name.trim(),
        icon: icon || null,
        points: points || 1,
        frequency: frequency || "DAILY",
      },
    });

    return NextResponse.json({ habit }, { status: 201 });
  } catch (error) {
    console.error("Error creating habit:", error);
    return NextResponse.json(
      { error: "Failed to create habit" },
      { status: 500 }
    );
  }
}
