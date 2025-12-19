import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPin, isValidPinFormat, createPinSession } from "@/lib/pin-auth";
import { cookies } from "next/headers";

// POST - Set up initial PIN
export async function POST(request: Request) {
  try {
    const { pin, confirmPin } = await request.json();

    // Validate PIN format
    if (!pin || !isValidPinFormat(pin)) {
      return NextResponse.json(
        { error: "PIN must be 4-6 digits" },
        { status: 400 }
      );
    }

    // Confirm PIN matches
    if (pin !== confirmPin) {
      return NextResponse.json(
        { error: "PINs do not match" },
        { status: 400 }
      );
    }

    // Check if PIN is already set
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
      select: { adminPinHash: true },
    });

    if (settings?.adminPinHash) {
      return NextResponse.json(
        { error: "PIN is already set. Use change endpoint to update." },
        { status: 400 }
      );
    }

    // Hash and save PIN
    const pinHash = await hashPin(pin);

    await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {
        adminPinHash: pinHash,
        pinEnabled: true,
        pinFailedAttempts: 0,
        pinLockedUntil: null,
      },
      create: {
        id: "singleton",
        adminPinHash: pinHash,
        pinEnabled: true,
      },
    });

    // Create session for immediate access
    const session = await createPinSession();

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("famcal-pin-session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: session.expiresAt,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "PIN set successfully",
    });
  } catch (error) {
    console.error("Error setting up PIN:", error);
    return NextResponse.json(
      { error: "Failed to set up PIN" },
      { status: 500 }
    );
  }
}
