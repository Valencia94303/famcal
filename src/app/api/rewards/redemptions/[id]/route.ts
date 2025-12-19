import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, getAuthContext, getClientInfo } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

// GET single redemption
export async function GET(
  request: NextRequest,
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

// PUT approve or deny redemption (requires rewards:approve permission)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission
  const permissionError = await requirePermission(request, "rewards:approve");
  if (permissionError) {
    return permissionError;
  }

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
      include: { requestedBy: true, reward: true },
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

    // Get auth context and client info
    const authContext = await getAuthContext(request);
    const clientInfo = getClientInfo(request);
    const performerId = approvedById || authContext.memberId;
    let performerName = authContext.memberName;

    // Verify approver is a PARENT (if provided)
    if (approvedById && approvedById !== authContext.memberId) {
      const approver = await prisma.familyMember.findUnique({
        where: { id: approvedById },
      });

      if (!approver || approver.role !== "PARENT") {
        return NextResponse.json(
          { error: "Only parents can approve/deny redemptions" },
          { status: 403 }
        );
      }
      performerName = approver.name;
    }

    // Store old values for audit
    const oldValue = {
      status: redemption.status,
      approvedById: redemption.approvedById,
      approvedAt: redemption.approvedAt,
    };

    // If approving, verify the requester still has enough points
    let pointTransactionId: string | null = null;
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

      // Deduct points with audit trail
      const pointTransaction = await prisma.pointTransaction.create({
        data: {
          familyMemberId: redemption.requestedById,
          amount: -redemption.pointsSpent,
          type: "REDEMPTION",
          description: `Redeemed: ${redemption.reward.name}`,
          performedById: performerId,
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
        },
      });
      pointTransactionId = pointTransaction.id;

      // Log the point deduction
      await createAuditLog({
        action: "DEDUCT_POINTS",
        entityType: "POINTS",
        entityId: pointTransaction.id,
        oldValue: { balance },
        newValue: { balance: balance - redemption.pointsSpent, deductedAmount: redemption.pointsSpent },
        description: `Deducted ${redemption.pointsSpent} points from ${redemption.requestedBy.name} for reward: ${redemption.reward.name}`,
        request,
        performedBy: performerId || undefined,
        performedByName: performerName || undefined,
      });
    }

    // Update the redemption
    const updatedRedemption = await prisma.rewardRedemption.update({
      where: { id },
      data: {
        status,
        approvedById: performerId || null,
        approvedAt: new Date(),
        denialReason: status === "DENIED" ? denialReason : null,
      },
      include: {
        reward: true,
        requestedBy: true,
        approvedBy: true,
      },
    });

    // Create audit log for the redemption approval/denial
    await createAuditLog({
      action: status === "APPROVED" ? "APPROVE_REDEMPTION" : "DENY_REDEMPTION",
      entityType: "REDEMPTION",
      entityId: id,
      oldValue,
      newValue: {
        status: updatedRedemption.status,
        approvedById: updatedRedemption.approvedById,
        approvedAt: updatedRedemption.approvedAt,
        denialReason: updatedRedemption.denialReason,
      },
      description: status === "APPROVED"
        ? `Approved redemption of ${redemption.reward.name} for ${redemption.requestedBy.name}`
        : `Denied redemption of ${redemption.reward.name} for ${redemption.requestedBy.name}: ${denialReason || "No reason provided"}`,
      request,
      performedBy: performerId || undefined,
      performedByName: performerName || undefined,
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
