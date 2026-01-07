import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, addDays, format } from "date-fns";
import {
  safeParseJSON,
  validateString,
  validateNumber,
  validateEnum,
  collectErrors,
  LIMITS,
  PATTERNS,
} from "@/lib/request-validation";

const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
const RECURRENCES = ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"] as const;

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
    // Safe JSON parsing
    const parsed = await safeParseJSON(request);
    if (!parsed.success) return parsed.error;

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
    } = parsed.data;

    // Validate inputs
    const validationError = collectErrors([
      validateString(title, "title", { required: true, minLength: 1, maxLength: LIMITS.TITLE_MAX }),
      validateString(description, "description", { maxLength: LIMITS.DESCRIPTION_MAX }),
      validateString(icon, "icon", { maxLength: 50 }),
      validateNumber(points, "points", { min: 0, max: 1000, integer: true }),
      validateEnum(priority, "priority", PRIORITIES),
      validateEnum(recurrence, "recurrence", RECURRENCES),
      validateString(recurTime, "recurTime", { pattern: PATTERNS.TIME_24H, patternMessage: "recurTime must be in HH:MM format" }),
    ]);
    if (validationError) return validationError;

    const chore = await prisma.chore.create({
      data: {
        title: title as string,
        description: (description as string) || null,
        icon: (icon as string) || null,
        points: (points as number) || 0,
        priority: (priority as string) || "NORMAL",
        recurrence: (recurrence as string) || null,
        recurDays: recurDays ? JSON.stringify(recurDays) : null,
        recurTime: (recurTime as string) || null,
        dueDate: dueDate ? new Date(dueDate as string) : null,
        assignments: (assigneeIds as string[])?.length
          ? {
              create: (assigneeIds as string[]).map((assigneeId: string, index: number) => ({
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
