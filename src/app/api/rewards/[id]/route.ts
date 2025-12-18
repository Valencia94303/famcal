import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET single reward
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reward = await prisma.reward.findUnique({
      where: { id },
      include: {
        redemptions: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            requestedBy: true,
          },
        },
      },
    });

    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    return NextResponse.json({ reward });
  } catch (error) {
    console.error("Error fetching reward:", error);
    return NextResponse.json(
      { error: "Failed to fetch reward" },
      { status: 500 }
    );
  }
}

// PUT update reward
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description, pointsCost, icon, isActive, isCashReward, cashValue } =
      await request.json();

    const reward = await prisma.reward.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(pointsCost !== undefined && { pointsCost }),
        ...(icon !== undefined && { icon: icon || null }),
        ...(isActive !== undefined && { isActive }),
        ...(isCashReward !== undefined && { isCashReward }),
        ...(cashValue !== undefined && { cashValue }),
      },
    });

    return NextResponse.json({ reward });
  } catch (error) {
    console.error("Error updating reward:", error);
    return NextResponse.json(
      { error: "Failed to update reward" },
      { status: 500 }
    );
  }
}

// DELETE reward
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.reward.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reward:", error);
    return NextResponse.json(
      { error: "Failed to delete reward" },
      { status: 500 }
    );
  }
}
