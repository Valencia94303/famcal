import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET settings
export async function GET() {
  try {
    // Get or create settings
    let settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: "singleton" },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT update settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { carouselInterval, displayName, theme } = body;

    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {
        ...(carouselInterval !== undefined && { carouselInterval }),
        ...(displayName !== undefined && { displayName }),
        ...(theme !== undefined && { theme }),
      },
      create: {
        id: "singleton",
        carouselInterval: carouselInterval ?? 30,
        displayName: displayName ?? "Family Dashboard",
        theme: theme ?? "auto",
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
