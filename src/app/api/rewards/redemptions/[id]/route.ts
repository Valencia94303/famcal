import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET single redemption
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const redemption = await prisma.rewardRedemption.findUnique({
      where: { id },
      include: {
        reward: true,
        requestedBy: true,
        approvedBy: true,
      },
    });

    if (!redemption) {
      return NextResponse.json(
        { error: "Redemption not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ redemption });
  } catch (error) {
    console.error("Error fetching redemption:", error);
    return NextResponse.json(
      { error: "Failed to fetch redemption" },
      { status: 500 }
    );
  }
}

// PUT approve or deny redemption
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, approvedById, denialReason } = await request.json();

    if (!status || !["APPROVED", "DENIED"].includes(status)) {
      return NextResponse.json(
        { error: "status must be APPROVED or DENIED" },
        { status: 400 }
      );
    }

    // Get the redemption
    const redemption = await prisma.rewardRedemption.findUnique({
      where: { id },
      include: { requestedBy: true },
    });

    if (!redemption) {
      return NextResponse.json(
        { error: "Redemption not found" },
        { status: 404 }
      );
    }

    if (redemption.status !== "PENDING") {
      return NextResponse.json(
        { error: "Redemption has already been processed" },
        { status: 400 }
      );
    }

    // Verify approver is a PARENT (if provided)
    if (approvedById) {
      const approver = await prisma.familyMember.findUnique({
        where: { id: approvedById },
      });

      if (!approver || approver.role !== "PARENT") {
        return NextResponse.json(
          { error: "Only parents can approve/deny redemptions" },
          { status: 403 }
        );
      }
    }

    // If approving, verify the requester still has enough points
    if (status === "APPROVED") {
      const balanceResult = await prisma.pointTransaction.aggregate({
        where: { familyMemberId: redemption.requestedById },
        _sum: { amount: true },
      });

      const balance = balanceResult._sum.amount || 0;

      if (balance < redemption.pointsSpent) {
        return NextResponse.json(
          {
            error: "Requester no longer has enough points",
            balance,
            required: redemption.pointsSpent,
          },
          { status: 400 }
        );
      }

      // Deduct points
      await prisma.pointTransaction.create({
        data: {
          familyMemberId: redemption.requestedById,
          amount: -redemption.pointsSpent,
          type: "REDEMPTION",
          description: `Redeemed: ${redemption.pointsSpent} points`,
        },
      });
    }

    // Update the redemption
    const updatedRedemption = await prisma.rewardRedemption.update({
      where: { id },
      data: {
        status,
        approvedById: approvedById || null,
        approvedAt: new Date(),
        denialReason: status === "DENIED" ? denialReason : null,
      },
      include: {
        reward: true,
        requestedBy: true,
        approvedBy: true,
      },
    });

    return NextResponse.json({ redemption: updatedRedemption });
  } catch (error) {
    console.error("Error processing redemption:", error);
    return NextResponse.json(
      { error: "Failed to process redemption" },
      { status: 500 }
    );
  }
}
