import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT update schedule item
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, time, icon, days, isActive } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (time !== undefined) updateData.time = time;
    if (icon !== undefined) updateData.icon = icon || null;
    if (days !== undefined) updateData.days = days ? JSON.stringify(days) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const item = await prisma.scheduleItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error updating schedule item:", error);
    return NextResponse.json(
      { error: "Failed to update schedule item" },
      { status: 500 }
    );
  }
}

// DELETE schedule item
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.scheduleItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting schedule item:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule item" },
      { status: 500 }
    );
  }
}
