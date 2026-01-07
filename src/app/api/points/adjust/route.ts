import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  safeParseJSON,
  validateString,
  validateNumber,
  collectErrors,
  LIMITS,
} from "@/lib/request-validation";

// POST - Manually adjust points (add or subtract)
export async function POST(request: Request) {
  try {
    // Safe JSON parsing
    const parsed = await safeParseJSON(request);
    if (!parsed.success) return parsed.error;

    const { familyMemberId, amount, reason } = parsed.data;

    // Validate inputs (amount can be negative for deductions)
    const validationError = collectErrors([
      validateString(familyMemberId, "familyMemberId", { required: true }),
      validateNumber(amount, "amount", { required: true, min: LIMITS.POINTS_MIN, max: LIMITS.POINTS_MAX, integer: true }),
      validateString(reason, "reason", { maxLength: LIMITS.DESCRIPTION_MAX }),
    ]);
    if (validationError) return validationError;

    const parsedAmount = amount as number;
    const memberId = familyMemberId as string;
    const reasonText = reason as string | undefined;

    if (parsedAmount === 0) {
      return NextResponse.json(
        { error: "Amount cannot be zero" },
        { status: 400 }
      );
    }

    // Verify member exists
    const member = await prisma.familyMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Get current balance
    const currentBalance = await prisma.pointTransaction.aggregate({
      where: { familyMemberId: memberId },
      _sum: { amount: true },
    });
    const balance = currentBalance._sum.amount || 0;

    // Don't allow negative balance
    if (parsedAmount < 0 && balance + parsedAmount < 0) {
      return NextResponse.json(
        { error: "Insufficient points", currentBalance: balance },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = await prisma.pointTransaction.create({
      data: {
        familyMemberId: memberId,
        amount: parsedAmount,
        type: parsedAmount > 0 ? "BONUS" : "DEDUCTION",
        description: reasonText || (parsedAmount > 0 ? "Points added" : "Points deducted"),
      },
    });

    // Calculate new balance
    const newBalance = balance + parsedAmount;

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: parsedAmount,
        type: transaction.type,
        description: transaction.description,
      },
      newBalance,
    });
  } catch (error) {
    console.error("Error adjusting points:", error);
    return NextResponse.json(
      { error: "Failed to adjust points" },
      { status: 500 }
    );
  }
}
