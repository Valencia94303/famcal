import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET points balance for a family member
export async function GET(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;

    // Get the family member
    const member = await prisma.familyMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    // Calculate current balance from transactions
    const balanceResult = await prisma.pointTransaction.aggregate({
      where: { familyMemberId: memberId },
      _sum: { amount: true },
    });

    // Calculate lifetime earned (positive amounts only)
    const earnedResult = await prisma.pointTransaction.aggregate({
      where: {
        familyMemberId: memberId,
        amount: { gt: 0 },
      },
      _sum: { amount: true },
    });

    // Calculate lifetime spent (negative amounts only)
    const spentResult = await prisma.pointTransaction.aggregate({
      where: {
        familyMemberId: memberId,
        amount: { lt: 0 },
      },
      _sum: { amount: true },
    });

    return NextResponse.json({
      memberId: member.id,
      memberName: member.name,
      memberColor: member.color,
      memberAvatar: member.avatar,
      balance: balanceResult._sum.amount || 0,
      lifetimeEarned: earnedResult._sum.amount || 0,
      lifetimeSpent: Math.abs(spentResult._sum.amount || 0),
    });
  } catch (error) {
    console.error("Error fetching points balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch points balance" },
      { status: 500 }
    );
  }
}
