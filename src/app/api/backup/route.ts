import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Data to include in backup
async function collectBackupData() {
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
  ]);

  return {
    version: "1.0",
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
  };
}

// GET - List all backups
export async function GET() {
  try {
    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        version: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ backups });
  } catch (error) {
    console.error("Error fetching backups:", error);
    return NextResponse.json(
      { error: "Failed to fetch backups" },
      { status: 500 }
    );
  }
}

// POST - Create new backup
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, description } = body;

    // Collect all data
    const backupData = await collectBackupData();

    // Create backup record
    const backup = await prisma.backup.create({
      data: {
        name: name || `Backup ${new Date().toLocaleDateString()}`,
        description: description || null,
        data: JSON.stringify(backupData),
        version: "1.0",
      },
    });

    return NextResponse.json({
      success: true,
      backup: {
        id: backup.id,
        name: backup.name,
        description: backup.description,
        version: backup.version,
        createdAt: backup.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    return NextResponse.json(
      { error: "Failed to create backup" },
      { status: 500 }
    );
  }
}
