import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all children's point balances in a single query (eliminates N+1)
export async function GET() {
  try {
    // Get all children with their transactions in one query
    const children = await prisma.familyMember.findMany({
      where: {
        role: { in: ["CHILD", "child"] }, // Handle both cases
      },
      include: {
        pointTransactions: {
          select: { amount: true },
        },
      },
    });

    // Calculate balances in memory (much faster than N separate aggregate queries)
    const balances = children.map((child) => {
      let balance = 0;
      let lifetimeEarned = 0;
      let lifetimeSpent = 0;

      for (const tx of child.pointTransactions) {
        balance += tx.amount;
        if (tx.amount > 0) {
          lifetimeEarned += tx.amount;
        } else {
          lifetimeSpent += Math.abs(tx.amount);
        }
      }

      return {
        memberId: child.id,
        memberName: child.name,
        memberColor: child.color,
        memberAvatar: child.avatar,
        balance,
        lifetimeEarned,
        lifetimeSpent,
      };
    });

    return NextResponse.json({ balances });
  } catch (error) {
    console.error("Error fetching point balances:", error);
    return NextResponse.json(
      { error: "Failed to fetch point balances" },
      { status: 500 }
    );
  }
}
