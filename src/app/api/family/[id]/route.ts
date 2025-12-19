import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET single family member
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const member = await prisma.familyMember.findUnique({
      where: { id },
      include: {
        assignedChores: {
          include: { chore: true },
        },
        completions: {
          take: 10,
          orderBy: { completedAt: "desc" },
          include: { chore: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Error fetching family member:", error);
    return NextResponse.json(
      { error: "Failed to fetch family member" },
      { status: 500 }
    );
  }
}

// PUT update family member
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, avatar, avatarType, color, role, email, birthday } = await request.json();

    const member = await prisma.familyMember.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(avatar !== undefined && { avatar }),
        ...(avatarType && { avatarType }),
        ...(color && { color }),
        ...(role && { role }),
        ...(email !== undefined && { email: email || null }),
        ...(birthday !== undefined && { birthday: birthday ? new Date(birthday) : null }),
      },
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Error updating family member:", error);
    return NextResponse.json(
      { error: "Failed to update family member" },
      { status: 500 }
    );
  }
}

// DELETE family member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.familyMember.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting family member:", error);
    return NextResponse.json(
      { error: "Failed to delete family member" },
      { status: 500 }
    );
  }
}
