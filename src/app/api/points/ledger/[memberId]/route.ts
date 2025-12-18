import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET transaction history for a family member
export async function GET(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type"); // Optional filter by type

    // Build where clause
    const where: { familyMemberId: string; type?: string } = {
      familyMemberId: memberId,
    };
    if (type) {
      where.type = type;
    }

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.pointTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.pointTransaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        createdAt: t.createdAt,
      })),
      total,
      hasMore: offset + transactions.length < total,
    });
  } catch (error) {
    console.error("Error fetching points ledger:", error);
    return NextResponse.json(
      { error: "Failed to fetch points ledger" },
      { status: 500 }
    );
  }
}
