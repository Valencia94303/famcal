import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Manually adjust points (add or subtract)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { familyMemberId, amount, reason } = body;

    if (!familyMemberId || amount === undefined) {
      return NextResponse.json(
        { error: "familyMemberId and amount are required" },
        { status: 400 }
      );
    }

    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Verify member exists
    const member = await prisma.familyMember.findUnique({
      where: { id: familyMemberId },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Get current balance
    const currentBalance = await prisma.pointTransaction.aggregate({
      where: { familyMemberId },
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
        familyMemberId,
        amount: parsedAmount,
        type: parsedAmount > 0 ? "BONUS" : "DEDUCTION",
        description: reason || (parsedAmount > 0 ? "Points added" : "Points deducted"),
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
