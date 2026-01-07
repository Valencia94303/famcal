import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  safeParseJSON,
  validateString,
  validateNumber,
  validateEnum,
  collectErrors,
  LIMITS,
} from "@/lib/request-validation";

const THEMES = ["auto", "morning", "afternoon", "evening", "night"] as const;
const HEADER_MODES = ["clock", "weather", "alternate"] as const;

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
    // Safe JSON parsing
    const parsed = await safeParseJSON(request);
    if (!parsed.success) return parsed.error;

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
    } = parsed.data;

    // Validate inputs
    const validationError = collectErrors([
      validateString(displayName, "displayName", { maxLength: LIMITS.NAME_MAX }),
      validateEnum(theme, "theme", THEMES),
      validateEnum(headerMode, "headerMode", HEADER_MODES),
      validateNumber(carouselInterval, "carouselInterval", { min: 5, max: 300, integer: true }),
      validateNumber(headerAlternateInterval, "headerAlternateInterval", { min: 5, max: 300, integer: true }),
      validateNumber(screensaverStartHour, "screensaverStartHour", { min: 0, max: 23, integer: true }),
      validateNumber(screensaverEndHour, "screensaverEndHour", { min: 0, max: 23, integer: true }),
      validateNumber(screensaverInterval, "screensaverInterval", { min: 5, max: 300, integer: true }),
      validateNumber(weatherLat, "weatherLat", { min: -90, max: 90 }),
      validateNumber(weatherLon, "weatherLon", { min: -180, max: 180 }),
      validateString(weatherCity, "weatherCity", { maxLength: LIMITS.NAME_MAX }),
      validateString(screensaverPhotoPath, "screensaverPhotoPath", { maxLength: 500 }),
    ]);
    if (validationError) return validationError;

    // Type assertions after validation
    const typedCarouselInterval = carouselInterval as number | undefined;
    const typedCarouselAnimation = carouselAnimation as string | undefined;
    const typedDisplayName = displayName as string | undefined;
    const typedTheme = theme as string | undefined;
    const typedHeaderMode = headerMode as string | undefined;
    const typedHeaderAlternateInterval = headerAlternateInterval as number | undefined;
    const typedWeatherLat = weatherLat as number | undefined;
    const typedWeatherLon = weatherLon as number | undefined;
    const typedWeatherCity = weatherCity as string | undefined;
    const typedScreensaverEnabled = screensaverEnabled as boolean | undefined;
    const typedScreensaverStartHour = screensaverStartHour as number | undefined;
    const typedScreensaverEndHour = screensaverEndHour as number | undefined;
    const typedScreensaverPhotoPath = screensaverPhotoPath as string | undefined;
    const typedScreensaverInterval = screensaverInterval as number | undefined;

    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {
        ...(typedCarouselInterval !== undefined && { carouselInterval: typedCarouselInterval }),
        ...(typedCarouselAnimation !== undefined && { carouselAnimation: typedCarouselAnimation }),
        ...(typedDisplayName !== undefined && { displayName: typedDisplayName }),
        ...(typedTheme !== undefined && { theme: typedTheme }),
        // Weather & Header settings
        ...(typedHeaderMode !== undefined && { headerMode: typedHeaderMode }),
        ...(typedHeaderAlternateInterval !== undefined && { headerAlternateInterval: typedHeaderAlternateInterval }),
        ...(typedWeatherLat !== undefined && { weatherLat: typedWeatherLat }),
        ...(typedWeatherLon !== undefined && { weatherLon: typedWeatherLon }),
        ...(typedWeatherCity !== undefined && { weatherCity: typedWeatherCity }),
        // Screensaver settings
        ...(typedScreensaverEnabled !== undefined && { screensaverEnabled: typedScreensaverEnabled }),
        ...(typedScreensaverStartHour !== undefined && { screensaverStartHour: typedScreensaverStartHour }),
        ...(typedScreensaverEndHour !== undefined && { screensaverEndHour: typedScreensaverEndHour }),
        ...(typedScreensaverPhotoPath !== undefined && { screensaverPhotoPath: typedScreensaverPhotoPath }),
        ...(typedScreensaverInterval !== undefined && { screensaverInterval: typedScreensaverInterval }),
      },
      create: {
        id: "singleton",
        carouselInterval: typedCarouselInterval ?? 30,
        carouselAnimation: typedCarouselAnimation ?? "arrivingTogether",
        displayName: typedDisplayName ?? "Family Dashboard",
        theme: typedTheme ?? "auto",
        headerMode: typedHeaderMode ?? "clock",
        headerAlternateInterval: typedHeaderAlternateInterval ?? 30,
        weatherLat: typedWeatherLat ?? null,
        weatherLon: typedWeatherLon ?? null,
        weatherCity: typedWeatherCity ?? null,
        screensaverEnabled: typedScreensaverEnabled ?? false,
        screensaverStartHour: typedScreensaverStartHour ?? 18,
        screensaverEndHour: typedScreensaverEndHour ?? 23,
        screensaverPhotoPath: typedScreensaverPhotoPath ?? "/home/pi/famcal-photos",
        screensaverInterval: typedScreensaverInterval ?? 15,
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
