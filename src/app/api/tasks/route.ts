import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all tasks
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showCompleted = searchParams.get("showCompleted") === "true";

    const tasks = await prisma.task.findMany({
      where: showCompleted ? {} : { completed: false },
      orderBy: [
        { completed: "asc" },
        { dueDate: "asc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST create a new task
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      priority,
      dueDate,
      startDate,
      scheduledDate,
      recurrence,
      notes,
      sourceFile,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        priority: priority || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        recurrence: recurrence || null,
        notes: notes || null,
        sourceFile: sourceFile || null,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
