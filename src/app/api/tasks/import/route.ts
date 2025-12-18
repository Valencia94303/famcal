import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ParsedTask {
  title: string;
  completed: boolean;
  priority: string | null;
  dueDate: string | null;
  startDate: string | null;
  scheduledDate: string | null;
  recurrence: string | null;
}

// Obsidian Tasks plugin emoji patterns
const PATTERNS = {
  checkbox: /^[\s]*[-*]\s*\[([ xX])\]\s*/,
  priority: {
    high: /⏫/,
    medium: /🔼/,
    low: /🔽/,
  },
  dueDate: /📅\s*(\d{4}-\d{2}-\d{2})/,
  startDate: /🛫\s*(\d{4}-\d{2}-\d{2})/,
  scheduledDate: /⏳\s*(\d{4}-\d{2}-\d{2})/,
  recurrence: /🔁\s*([^📅🛫⏳⏫🔼🔽✅❌]+)/,
  completedDate: /✅\s*\d{4}-\d{2}-\d{2}/,
  cancelledDate: /❌\s*\d{4}-\d{2}-\d{2}/,
};

function parseObsidianTask(line: string): ParsedTask | null {
  // Check if it's a checkbox line
  const checkboxMatch = line.match(PATTERNS.checkbox);
  if (!checkboxMatch) return null;

  const isCompleted = checkboxMatch[1].toLowerCase() === "x";

  // Remove the checkbox prefix to get the rest
  let content = line.replace(PATTERNS.checkbox, "").trim();

  // Extract priority
  let priority: string | null = null;
  if (PATTERNS.priority.high.test(content)) {
    priority = "HIGH";
    content = content.replace(PATTERNS.priority.high, "").trim();
  } else if (PATTERNS.priority.medium.test(content)) {
    priority = "MEDIUM";
    content = content.replace(PATTERNS.priority.medium, "").trim();
  } else if (PATTERNS.priority.low.test(content)) {
    priority = "LOW";
    content = content.replace(PATTERNS.priority.low, "").trim();
  }

  // Extract due date
  let dueDate: string | null = null;
  const dueDateMatch = content.match(PATTERNS.dueDate);
  if (dueDateMatch) {
    dueDate = dueDateMatch[1];
    content = content.replace(PATTERNS.dueDate, "").trim();
  }

  // Extract start date
  let startDate: string | null = null;
  const startDateMatch = content.match(PATTERNS.startDate);
  if (startDateMatch) {
    startDate = startDateMatch[1];
    content = content.replace(PATTERNS.startDate, "").trim();
  }

  // Extract scheduled date
  let scheduledDate: string | null = null;
  const scheduledDateMatch = content.match(PATTERNS.scheduledDate);
  if (scheduledDateMatch) {
    scheduledDate = scheduledDateMatch[1];
    content = content.replace(PATTERNS.scheduledDate, "").trim();
  }

  // Extract recurrence
  let recurrence: string | null = null;
  const recurrenceMatch = content.match(PATTERNS.recurrence);
  if (recurrenceMatch) {
    recurrence = recurrenceMatch[1].trim();
    content = content.replace(PATTERNS.recurrence, "").trim();
  }

  // Remove completion/cancellation markers
  content = content.replace(PATTERNS.completedDate, "").trim();
  content = content.replace(PATTERNS.cancelledDate, "").trim();

  // Clean up any remaining emojis that might be metadata
  content = content.replace(/[📅🛫⏳⏫🔼🔽✅❌🔁]/g, "").trim();

  // If no title left, skip this task
  if (!content) return null;

  return {
    title: content,
    completed: isCompleted,
    priority,
    dueDate,
    startDate,
    scheduledDate,
    recurrence,
  };
}

function parseMarkdown(markdown: string): ParsedTask[] {
  const lines = markdown.split("\n");
  const tasks: ParsedTask[] = [];

  for (const line of lines) {
    const task = parseObsidianTask(line);
    if (task) {
      tasks.push(task);
    }
  }

  return tasks;
}

// POST parse markdown (preview mode - doesn't save)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { markdown, save, sourceFile } = body;

    if (!markdown) {
      return NextResponse.json(
        { error: "Markdown content is required" },
        { status: 400 }
      );
    }

    const parsedTasks = parseMarkdown(markdown);

    // If save is true, create the tasks in the database
    if (save && parsedTasks.length > 0) {
      const createdTasks = await prisma.task.createMany({
        data: parsedTasks.map((task) => ({
          title: task.title,
          completed: task.completed,
          completedAt: task.completed ? new Date() : null,
          priority: task.priority,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          startDate: task.startDate ? new Date(task.startDate) : null,
          scheduledDate: task.scheduledDate
            ? new Date(task.scheduledDate)
            : null,
          recurrence: task.recurrence,
          sourceFile: sourceFile || null,
        })),
      });

      return NextResponse.json({
        imported: createdTasks.count,
        tasks: parsedTasks,
      });
    }

    // Preview mode - just return parsed tasks
    return NextResponse.json({ tasks: parsedTasks });
  } catch (error) {
    console.error("Error parsing/importing tasks:", error);
    return NextResponse.json(
      { error: "Failed to parse/import tasks" },
      { status: 500 }
    );
  }
}
