import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST award bonus points to a family member (parents only)
export async function POST(request: Request) {
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

    // Optionally verify the awarder is a PARENT
    if (awardedById) {
      const awarder = await prisma.familyMember.findUnique({
        where: { id: awardedById },
      });

      if (awarder && awarder.role !== "PARENT") {
        return NextResponse.json(
          { error: "Only parents can award bonus points" },
          { status: 403 }
        );
      }
    }

    // Create the transaction
    const transaction = await prisma.pointTransaction.create({
      data: {
        familyMemberId,
        amount,
        type: "BONUS",
        description: description || "Bonus points",
      },
    });

    // Get updated balance
    const balanceResult = await prisma.pointTransaction.aggregate({
      where: { familyMemberId },
      _sum: { amount: true },
    });

    return NextResponse.json(
      {
        transaction,
        newBalance: balanceResult._sum.amount || 0,
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
