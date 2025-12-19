import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all family members
export async function GET() {
  try {
    const members = await prisma.familyMember.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: {
            assignedChores: true,
            completions: true,
          },
        },
      },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching family members:", error);
    return NextResponse.json(
      { error: "Failed to fetch family members" },
      { status: 500 }
    );
  }
}

// POST create new family member
export async function POST(request: Request) {
  try {
    const { name, avatar, avatarType, color, role, email, birthday } = await request.json();

    if (!name || !color) {
      return NextResponse.json(
        { error: "Name and color are required" },
        { status: 400 }
      );
    }

    const member = await prisma.familyMember.create({
      data: {
        name,
        avatar: avatar || name[0].toUpperCase(),
        avatarType: avatarType || "emoji",
        color,
        role: role || "CHILD",
        email: email || null,
        birthday: birthday ? new Date(birthday) : null,
      },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error("Error creating family member:", error);
    return NextResponse.json(
      { error: "Failed to create family member" },
      { status: 500 }
    );
  }
}
