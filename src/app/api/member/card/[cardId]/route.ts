import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Look up member by NFC card ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;

    const member = await prisma.familyMember.findUnique({
      where: { nfcCardId: cardId },
      select: {
        id: true,
        name: true,
        displayName: true,
        avatar: true,
        color: true,
        role: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Card not registered", cardId },
        { status: 404 }
      );
    }

    // Get current points balance
    const transactions = await prisma.pointTransaction.aggregate({
      where: { familyMemberId: member.id },
      _sum: { amount: true },
    });
    const points = transactions._sum.amount || 0;

    // Get available chores for quick-add
    const assignments = await prisma.choreAssignment.findMany({
      where: { assigneeId: member.id },
      include: {
        chore: {
          select: {
            id: true,
            title: true,
            icon: true,
            points: true,
            isActive: true,
          },
        },
      },
    });

    const chores = assignments
      .filter((a) => a.chore.isActive)
      .map((a) => ({
        id: a.chore.id,
        title: a.chore.title,
        icon: a.chore.icon,
        points: a.chore.points,
        assignmentId: a.id,
      }));

    // Get available rewards for quick-redeem
    const rewards = await prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { pointsCost: "asc" },
      select: {
        id: true,
        name: true,
        icon: true,
        pointsCost: true,
      },
    });

    return NextResponse.json({
      member: {
        ...member,
        displayName: member.displayName || member.name,
      },
      points,
      chores,
      rewards,
    });
  } catch (error) {
    console.error("Error looking up card:", error);
    return NextResponse.json(
      { error: "Failed to look up card" },
      { status: 500 }
    );
  }
}

// POST - Register card to member
export async function POST(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId required" },
        { status: 400 }
      );
    }

    // Check if card is already registered to someone else
    const existingCard = await prisma.familyMember.findUnique({
      where: { nfcCardId: cardId },
    });

    if (existingCard && existingCard.id !== memberId) {
      return NextResponse.json(
        { error: "Card already registered to another member" },
        { status: 409 }
      );
    }

    // Register card to member
    const member = await prisma.familyMember.update({
      where: { id: memberId },
      data: { nfcCardId: cardId },
      select: {
        id: true,
        name: true,
        nfcCardId: true,
      },
    });

    return NextResponse.json({
      success: true,
      member,
    });
  } catch (error) {
    console.error("Error registering card:", error);
    return NextResponse.json(
      { error: "Failed to register card" },
      { status: 500 }
    );
  }
}

// DELETE - Unregister card from member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;

    const member = await prisma.familyMember.findUnique({
      where: { nfcCardId: cardId },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    await prisma.familyMember.update({
      where: { id: member.id },
      data: { nfcCardId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unregistering card:", error);
    return NextResponse.json(
      { error: "Failed to unregister card" },
      { status: 500 }
    );
  }
}
