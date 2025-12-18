import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all rewards
export async function GET() {
  try {
    const rewards = await prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { pointsCost: "asc" },
    });

    // Get points settings for cash conversion info
    let settings = await prisma.pointsSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.pointsSettings.create({
        data: { id: "singleton" },
      });
    }

    return NextResponse.json({
      rewards,
      settings: {
        cashConversionRate: settings.cashConversionRate,
        minCashoutPoints: settings.minCashoutPoints,
      },
    });
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return NextResponse.json(
      { error: "Failed to fetch rewards" },
      { status: 500 }
    );
  }
}

// POST create new reward
export async function POST(request: Request) {
  try {
    const { name, description, pointsCost, icon, isCashReward, cashValue } =
      await request.json();

    if (!name || !pointsCost) {
      return NextResponse.json(
        { error: "name and pointsCost are required" },
        { status: 400 }
      );
    }

    const reward = await prisma.reward.create({
      data: {
        name,
        description: description || null,
        pointsCost,
        icon: icon || null,
        isCashReward: isCashReward || false,
        cashValue: cashValue || null,
      },
    });

    return NextResponse.json({ reward }, { status: 201 });
  } catch (error) {
    console.error("Error creating reward:", error);
    return NextResponse.json(
      { error: "Failed to create reward" },
      { status: 500 }
    );
  }
}
