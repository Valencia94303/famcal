import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  safeParseJSON,
  validateString,
  validateEnum,
  collectErrors,
  LIMITS,
  PATTERNS,
} from "@/lib/request-validation";

const ROLES = ["PARENT", "CHILD"] as const;
const AVATAR_TYPES = ["emoji", "library", "custom"] as const;

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
    // Safe JSON parsing
    const parsed = await safeParseJSON(request);
    if (!parsed.success) return parsed.error;

    const { name, avatar, avatarType, color, role, email, birthday } = parsed.data;

    // Validate inputs
    const validationError = collectErrors([
      validateString(name, "name", { required: true, minLength: 1, maxLength: LIMITS.NAME_MAX }),
      validateString(color, "color", { required: true, pattern: PATTERNS.HEX_COLOR, patternMessage: "color must be a valid hex color (e.g., #FF5733)" }),
      validateString(avatar, "avatar", { maxLength: 50 }),
      validateEnum(avatarType, "avatarType", AVATAR_TYPES),
      validateEnum(role, "role", ROLES),
      validateString(email, "email", { maxLength: LIMITS.EMAIL_MAX, pattern: PATTERNS.EMAIL, patternMessage: "email must be a valid email address" }),
    ]);
    if (validationError) return validationError;

    const member = await prisma.familyMember.create({
      data: {
        name: name as string,
        avatar: (avatar as string) || (name as string)[0].toUpperCase(),
        avatarType: (avatarType as string) || "emoji",
        color: color as string,
        role: (role as string) || "CHILD",
        email: (email as string) || null,
        birthday: birthday ? new Date(birthday as string) : null,
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
