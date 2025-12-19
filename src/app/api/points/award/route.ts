import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, getAuthContext, getClientInfo } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

// POST award bonus points to a family member (parents only)
export async function POST(request: NextRequest) {
  // Check permission
  const permissionError = await requirePermission(request, "points:award");
  if (permissionError) {
    return permissionError;
  }

  try {
    const { familyMemberId, amount, description, awardedById } =
      await request.json();

    if (!familyMemberId || !amount) {
      return NextResponse.json(
        { error: "familyMemberId and amount are required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be positive" },
        { status: 400 }
      );
    }

    // Verify the recipient exists and is a CHILD
    const recipient = await prisma.familyMember.findUnique({
      where: { id: familyMemberId },
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
    const performerId = awardedById || authContext.memberId;
    let performerName = authContext.memberName;

    // Verify the awarder is a PARENT if provided
    if (awardedById && awardedById !== authContext.memberId) {
      const awarder = await prisma.familyMember.findUnique({
        where: { id: awardedById },
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
      where: { familyMemberId },
      _sum: { amount: true },
    });

    // Create the transaction with audit fields
    const transaction = await prisma.pointTransaction.create({
      data: {
        familyMemberId,
        amount,
        type: "BONUS",
        description: description || "Bonus points",
        performedById: performerId,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      },
    });

    // Get updated balance
    const balanceResult = await prisma.pointTransaction.aggregate({
      where: { familyMemberId },
      _sum: { amount: true },
    });

    const newBalance = balanceResult._sum.amount || 0;

    // Create audit log
    await createAuditLog({
      action: "AWARD_POINTS",
      entityType: "POINTS",
      entityId: transaction.id,
      oldValue: { balance: previousBalance._sum.amount || 0 },
      newValue: { balance: newBalance, awardedAmount: amount },
      description: `Awarded ${amount} points to ${recipient.name}: ${description || "Bonus points"}`,
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
