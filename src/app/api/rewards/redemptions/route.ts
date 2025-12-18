import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET list redemptions (filterable by status)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // PENDING, APPROVED, DENIED, or null for all
    const memberId = searchParams.get("memberId"); // Filter by requester

    // Build where clause
    const where: {
      status?: string;
      requestedById?: string;
    } = {};

    if (status) {
      where.status = status;
    }
    if (memberId) {
      where.requestedById = memberId;
    }

    const redemptions = await prisma.rewardRedemption.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        reward: true,
        requestedBy: true,
        approvedBy: true,
      },
    });

    // Count pending for notification badge
    const pendingCount = await prisma.rewardRedemption.count({
      where: { status: "PENDING" },
    });

    return NextResponse.json({
      redemptions,
      pendingCount,
    });
  } catch (error) {
    console.error("Error fetching redemptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch redemptions" },
      { status: 500 }
    );
  }
}
