import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPin, verifyPin, isValidPinFormat, validateSession } from "@/lib/pin-auth";
import { cookies } from "next/headers";

// PUT - Change PIN (requires current PIN)
export async function PUT(request: Request) {
  try {
    // Verify session first
    const cookieStore = await cookies();
    const token = cookieStore.get("famcal-pin-session")?.value;

    if (!token || !(await validateSession(token))) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { currentPin, newPin, confirmPin } = await request.json();

    // Validate inputs
    if (!currentPin || !newPin || !confirmPin) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (!isValidPinFormat(newPin)) {
      return NextResponse.json(
        { error: "New PIN must be 4-6 digits" },
        { status: 400 }
      );
    }

    if (newPin !== confirmPin) {
      return NextResponse.json(
        { error: "New PINs do not match" },
        { status: 400 }
      );
    }

    // Verify current PIN
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
      select: { adminPinHash: true },
    });

    if (!settings?.adminPinHash) {
      return NextResponse.json(
        { error: "No PIN is currently set" },
        { status: 400 }
      );
    }

    const isValid = await verifyPin(currentPin, settings.adminPinHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Current PIN is incorrect" },
        { status: 401 }
      );
    }

    // Update to new PIN
    const newHash = await hashPin(newPin);

    await prisma.settings.update({
      where: { id: "singleton" },
      data: {
        adminPinHash: newHash,
        pinFailedAttempts: 0,
        pinLockedUntil: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "PIN changed successfully",
    });
  } catch (error) {
    console.error("Error changing PIN:", error);
    return NextResponse.json(
      { error: "Failed to change PIN" },
      { status: 500 }
    );
  }
}

// DELETE - Disable PIN authentication
export async function DELETE(request: Request) {
  try {
    // Verify session first
    const cookieStore = await cookies();
    const token = cookieStore.get("famcal-pin-session")?.value;

    if (!token || !(await validateSession(token))) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { pin } = await request.json();

    // Verify current PIN
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
      select: { adminPinHash: true },
    });

    if (!settings?.adminPinHash) {
      return NextResponse.json(
        { error: "No PIN is currently set" },
        { status: 400 }
      );
    }

    const isValid = await verifyPin(pin, settings.adminPinHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "PIN is incorrect" },
        { status: 401 }
      );
    }

    // Disable PIN
    await prisma.settings.update({
      where: { id: "singleton" },
      data: {
        pinEnabled: false,
        adminPinHash: null,
        pinFailedAttempts: 0,
        pinLockedUntil: null,
      },
    });

    // Clear all sessions
    await prisma.pinSession.deleteMany({});

    // Clear cookie
    cookieStore.delete("famcal-pin-session");

    return NextResponse.json({
      success: true,
      message: "PIN disabled successfully",
    });
  } catch (error) {
    console.error("Error disabling PIN:", error);
    return NextResponse.json(
      { error: "Failed to disable PIN" },
      { status: 500 }
    );
  }
}
