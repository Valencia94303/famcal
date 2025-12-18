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
    const {
      carouselInterval,
      carouselAnimation,
      displayName,
      theme,
      // Weather & Header settings
      headerMode,
      headerAlternateInterval,
      weatherLat,
      weatherLon,
      weatherCity,
      // Screensaver settings
      screensaverEnabled,
      screensaverStartHour,
      screensaverEndHour,
      screensaverPhotoPath,
      screensaverInterval,
    } = body;

    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {
        ...(carouselInterval !== undefined && { carouselInterval }),
        ...(carouselAnimation !== undefined && { carouselAnimation }),
        ...(displayName !== undefined && { displayName }),
        ...(theme !== undefined && { theme }),
        // Weather & Header settings
        ...(headerMode !== undefined && { headerMode }),
        ...(headerAlternateInterval !== undefined && { headerAlternateInterval }),
        ...(weatherLat !== undefined && { weatherLat }),
        ...(weatherLon !== undefined && { weatherLon }),
        ...(weatherCity !== undefined && { weatherCity }),
        // Screensaver settings
        ...(screensaverEnabled !== undefined && { screensaverEnabled }),
        ...(screensaverStartHour !== undefined && { screensaverStartHour }),
        ...(screensaverEndHour !== undefined && { screensaverEndHour }),
        ...(screensaverPhotoPath !== undefined && { screensaverPhotoPath }),
        ...(screensaverInterval !== undefined && { screensaverInterval }),
      },
      create: {
        id: "singleton",
        carouselInterval: carouselInterval ?? 30,
        carouselAnimation: carouselAnimation ?? "arrivingTogether",
        displayName: displayName ?? "Family Dashboard",
        theme: theme ?? "auto",
        headerMode: headerMode ?? "clock",
        headerAlternateInterval: headerAlternateInterval ?? 30,
        weatherLat: weatherLat ?? null,
        weatherLon: weatherLon ?? null,
        weatherCity: weatherCity ?? null,
        screensaverEnabled: screensaverEnabled ?? false,
        screensaverStartHour: screensaverStartHour ?? 18,
        screensaverEndHour: screensaverEndHour ?? 23,
        screensaverPhotoPath: screensaverPhotoPath ?? "/home/pi/famcal-photos",
        screensaverInterval: screensaverInterval ?? 15,
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
