import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, addDays, format } from "date-fns";

// GET chores - use ?all=true to get all chores (for management), otherwise returns today's chores only
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";

    const today = new Date();
    const dayOfWeek = format(today, "EEE").toUpperCase();

    const chores = await prisma.chore.findMany({
      where: { isActive: true },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      include: {
        assignments: {
          include: {
            assignee: true,
          },
        },
        completions: {
          where: {
            scheduledFor: {
              gte: startOfDay(today),
              lt: endOfDay(today),
            },
          },
          include: {
            completedBy: true,
          },
        },
      },
    });

    // Filter to only show chores that are due today (unless showAll is true)
    const filteredChores = showAll ? chores : chores.filter((chore) => {
      // One-time chores with due date today
      if (chore.dueDate) {
        const dueDate = new Date(chore.dueDate);
        return dueDate >= startOfDay(today) && dueDate < addDays(endOfDay(today), 7);
      }

      // Recurring chores
      if (chore.recurrence === "DAILY") return true;
      if (chore.recurrence === "WEEKLY" || chore.recurrence === "CUSTOM") {
        if (chore.recurDays) {
          try {
            const days = JSON.parse(chore.recurDays);
            return days.includes(dayOfWeek);
          } catch {
            return false;
          }
        }
      }

      return true; // Show chores without recurrence settings
    });

    // Map to include completion status
    const choresWithStatus = filteredChores.map((chore) => ({
      id: chore.id,
      title: chore.title,
      description: chore.description,
      icon: chore.icon,
      points: chore.points,
      priority: chore.priority,
      recurrence: chore.recurrence,
      recurDays: chore.recurDays,
      dueDate: chore.dueDate,
      isCompleted: chore.completions.length > 0,
      completedBy: chore.completions[0]?.completedBy || null,
      assignees: chore.assignments.map((a) => a.assignee),
    }));

    return NextResponse.json({ chores: choresWithStatus });
  } catch (error) {
    console.error("Error fetching chores:", error);
    return NextResponse.json(
      { error: "Failed to fetch chores" },
      { status: 500 }
    );
  }
}

// POST create new chore
export async function POST(request: Request) {
  try {
    const {
      title,
      description,
      icon,
      points,
      priority,
      recurrence,
      recurDays,
      recurTime,
      dueDate,
      assigneeIds,
    } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const chore = await prisma.chore.create({
      data: {
        title,
        description: description || null,
        icon: icon || null,
        points: points || 0,
        priority: priority || "NORMAL",
        recurrence: recurrence || null,
        recurDays: recurDays ? JSON.stringify(recurDays) : null,
        recurTime: recurTime || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignments: assigneeIds?.length
          ? {
              create: assigneeIds.map((assigneeId: string, index: number) => ({
                assigneeId,
                rotationOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        assignments: {
          include: { assignee: true },
        },
      },
    });

    return NextResponse.json({ chore }, { status: 201 });
  } catch (error) {
    console.error("Error creating chore:", error);
    return NextResponse.json(
      { error: "Failed to create chore" },
      { status: 500 }
    );
  }
}
