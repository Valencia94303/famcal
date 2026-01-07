import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, getAuthContext, getClientInfo } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import {
  safeParseJSON,
  validateString,
  validateNumber,
  collectErrors,
  LIMITS,
} from "@/lib/request-validation";

// POST award bonus points to a family member (parents only)
export async function POST(request: NextRequest) {
  // Check permission
  const permissionError = await requirePermission(request, "points:award");
  if (permissionError) {
    return permissionError;
  }

  try {
    // Safe JSON parsing
    const parsed = await safeParseJSON(request);
    if (!parsed.success) return parsed.error;

    const { familyMemberId, amount, description, awardedById } = parsed.data;

    // Validate inputs
    const validationError = collectErrors([
      validateString(familyMemberId, "familyMemberId", { required: true }),
      validateNumber(amount, "amount", { required: true, min: 1, max: LIMITS.POINTS_MAX, integer: true }),
      validateString(description, "description", { maxLength: LIMITS.DESCRIPTION_MAX }),
    ]);
    if (validationError) return validationError;

    // Type assertions after validation
    const memberId = familyMemberId as string;
    const pointsAmount = amount as number;
    const desc = description as string | undefined;
    const awarderId = awardedById as string | undefined;

    // Verify the recipient exists and is a CHILD
    const recipient = await prisma.familyMember.findUnique({
      where: { id: memberId },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    if (recipient.role !== "CHILD") {
      return NextResponse.json(
        { error: "Only children can receive points" },
        { status: 400 }
      );
    }

    // Get auth context and client info
    const authContext = await getAuthContext(request);
    const clientInfo = getClientInfo(request);

    // Determine who is awarding the points
    const performerId = awarderId || authContext.memberId;
    let performerName = authContext.memberName;

    // Verify the awarder is a PARENT if provided
    if (awarderId && awarderId !== authContext.memberId) {
      const awarder = await prisma.familyMember.findUnique({
        where: { id: awarderId },
      });

      if (awarder) {
        if (awarder.role !== "PARENT") {
          return NextResponse.json(
            { error: "Only parents can award bonus points" },
            { status: 403 }
          );
        }
        performerName = awarder.name;
      }
    }

    // Get current balance before transaction
    const previousBalance = await prisma.pointTransaction.aggregate({
      where: { familyMemberId: memberId },
      _sum: { amount: true },
    });

    // Create the transaction with audit fields
    const transaction = await prisma.pointTransaction.create({
      data: {
        familyMemberId: memberId,
        amount: pointsAmount,
        type: "BONUS",
        description: desc || "Bonus points",
        performedById: performerId,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      },
    });

    // Get updated balance
    const balanceResult = await prisma.pointTransaction.aggregate({
      where: { familyMemberId: memberId },
      _sum: { amount: true },
    });

    const newBalance = balanceResult._sum.amount || 0;

    // Create audit log
    await createAuditLog({
      action: "AWARD_POINTS",
      entityType: "POINTS",
      entityId: transaction.id,
      oldValue: { balance: previousBalance._sum.amount || 0 },
      newValue: { balance: newBalance, awardedAmount: pointsAmount },
      description: `Awarded ${pointsAmount} points to ${recipient.name}: ${desc || "Bonus points"}`,
      request,
      performedBy: performerId || undefined,
      performedByName: performerName || undefined,
    });

    return NextResponse.json(
      {
        transaction,
        newBalance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error awarding points:", error);
    return NextResponse.json(
      { error: "Failed to award points" },
      { status: 500 }
    );
  }
}
