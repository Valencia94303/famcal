import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";

// POST mark chore as complete
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { completedById } = await request.json();

    if (!completedById) {
      return NextResponse.json(
        { error: "completedById is required" },
        { status: 400 }
      );
    }

    const today = startOfDay(new Date());

    // Use transaction to prevent race condition (duplicate completions)
    // Check and create happen atomically
    const result = await prisma.$transaction(async (tx) => {
      // Check if already completed today (inside transaction)
      const existingCompletion = await tx.choreCompletion.findFirst({
        where: {
          choreId: id,
          scheduledFor: today,
        },
      });

      if (existingCompletion) {
        return { error: "Chore already completed today" };
      }

      const completion = await tx.choreCompletion.create({
        data: {
          choreId: id,
          completedById,
          scheduledFor: today,
        },
        include: {
          completedBy: true,
          chore: true,
        },
      });

      // Award points if the completing member is a CHILD and chore has points
      let pointsAwarded = 0;
      if (
        completion.chore.points > 0 &&
        completion.completedBy.role === "CHILD"
      ) {
        await tx.pointTransaction.create({
          data: {
            familyMemberId: completedById,
            amount: completion.chore.points,
            type: "CHORE_COMPLETION",
            description: `Completed: ${completion.chore.title}`,
            choreCompletionId: completion.id,
          },
        });
        pointsAwarded = completion.chore.points;
      }

      return { completion, pointsAwarded };
    });

    // Handle already completed (returned from transaction)
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ completion: result.completion, pointsAwarded: result.pointsAwarded }, { status: 201 });
  } catch (error) {
    console.error("Error completing chore:", error);
    return NextResponse.json(
      { error: "Failed to complete chore" },
      { status: 500 }
    );
  }
}

// DELETE undo chore completion
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const today = startOfDay(new Date());

    // Find the completion first to get its ID for point transaction removal
    const completion = await prisma.choreCompletion.findFirst({
      where: {
        choreId: id,
        scheduledFor: today,
      },
    });

    if (completion) {
      // Remove any point transactions linked to this completion
      await prisma.pointTransaction.deleteMany({
        where: {
          choreCompletionId: completion.id,
        },
      });

      // Delete the completion
      await prisma.choreCompletion.delete({
        where: { id: completion.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error undoing chore completion:", error);
    return NextResponse.json(
      { error: "Failed to undo completion" },
      { status: 500 }
    );
  }
}
