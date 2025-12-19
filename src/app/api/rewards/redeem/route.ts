import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

// POST request a reward redemption (requires rewards:request permission)
export async function POST(request: NextRequest) {
  // Check permission
  const permissionError = await requirePermission(request, "rewards:request");
  if (permissionError) {
    return permissionError;
  }

  try {
    const { rewardId, requestedById, customPointsAmount } = await request.json();

    if (!rewardId || !requestedById) {
      return NextResponse.json(
        { error: "rewardId and requestedById are required" },
        { status: 400 }
      );
    }

    // Verify the requester is a CHILD
    const requester = await prisma.familyMember.findUnique({
      where: { id: requestedById },
    });

    if (!requester) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    if (requester.role !== "CHILD") {
      return NextResponse.json(
        { error: "Only children can request rewards" },
        { status: 403 }
      );
    }

    // Get the reward
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      return NextResponse.json(
        { error: "Reward not found" },
        { status: 404 }
      );
    }

    if (!reward.isActive) {
      return NextResponse.json(
        { error: "Reward is not available" },
        { status: 400 }
      );
    }

    // Determine points to spend
    let pointsToSpend = reward.pointsCost;

    // For cash rewards, allow custom amount
    if (reward.isCashReward && customPointsAmount) {
      const settings = await prisma.pointsSettings.findUnique({
        where: { id: "singleton" },
      });

      const minPoints = settings?.minCashoutPoints || 100;
      if (customPointsAmount < minPoints) {
        return NextResponse.json(
          { error: `Minimum cashout is ${minPoints} points` },
          { status: 400 }
        );
      }
      pointsToSpend = customPointsAmount;
    }

    // Check if the requester has enough points
    const balanceResult = await prisma.pointTransaction.aggregate({
      where: { familyMemberId: requestedById },
      _sum: { amount: true },
    });

    const balance = balanceResult._sum.amount || 0;

    if (balance < pointsToSpend) {
      return NextResponse.json(
        { error: "Insufficient points", balance, required: pointsToSpend },
        { status: 400 }
      );
    }

    // Create the redemption request (PENDING status)
    const redemption = await prisma.rewardRedemption.create({
      data: {
        rewardId,
        requestedById,
        pointsSpent: pointsToSpend,
        status: "PENDING",
      },
      include: {
        reward: true,
        requestedBy: true,
      },
    });

    // Create audit log
    await createAuditLog({
      action: "REQUEST_REDEMPTION",
      entityType: "REDEMPTION",
      entityId: redemption.id,
      newValue: {
        rewardId,
        rewardName: reward.name,
        pointsSpent: pointsToSpend,
        status: "PENDING",
      },
      description: `${requester.name} requested to redeem ${reward.name} for ${pointsToSpend} points`,
      request,
      performedBy: requestedById,
      performedByName: requester.name,
    });

    return NextResponse.json({ redemption }, { status: 201 });
  } catch (error) {
    console.error("Error requesting redemption:", error);
    return NextResponse.json(
      { error: "Failed to request redemption" },
      { status: 500 }
    );
  }
}
