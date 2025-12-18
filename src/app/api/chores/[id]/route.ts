import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET single chore
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chore = await prisma.chore.findUnique({
      where: { id },
      include: {
        assignments: {
          include: { assignee: true },
        },
        completions: {
          take: 10,
          orderBy: { completedAt: "desc" },
          include: { completedBy: true },
        },
      },
    });

    if (!chore) {
      return NextResponse.json({ error: "Chore not found" }, { status: 404 });
    }

    return NextResponse.json({ chore });
  } catch (error) {
    console.error("Error fetching chore:", error);
    return NextResponse.json(
      { error: "Failed to fetch chore" },
      { status: 500 }
    );
  }
}

// PUT update chore
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      isActive,
      assigneeIds,
    } = await request.json();

    // Update assignments if provided
    if (assigneeIds !== undefined) {
      // Delete existing assignments
      await prisma.choreAssignment.deleteMany({
        where: { choreId: id },
      });

      // Create new assignments
      if (assigneeIds.length > 0) {
        await prisma.choreAssignment.createMany({
          data: assigneeIds.map((assigneeId: string, index: number) => ({
            choreId: id,
            assigneeId,
            rotationOrder: index,
          })),
        });
      }
    }

    const chore = await prisma.chore.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(icon !== undefined && { icon: icon || null }),
        ...(points !== undefined && { points }),
        ...(priority && { priority }),
        ...(recurrence !== undefined && { recurrence: recurrence || null }),
        ...(recurDays !== undefined && {
          recurDays: recurDays ? JSON.stringify(recurDays) : null,
        }),
        ...(recurTime !== undefined && { recurTime: recurTime || null }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        assignments: {
          include: { assignee: true },
        },
      },
    });

    return NextResponse.json({ chore });
  } catch (error) {
    console.error("Error updating chore:", error);
    return NextResponse.json(
      { error: "Failed to update chore" },
      { status: 500 }
    );
  }
}

// DELETE chore
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.chore.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chore:", error);
    return NextResponse.json(
      { error: "Failed to delete chore" },
      { status: 500 }
    );
  }
}
