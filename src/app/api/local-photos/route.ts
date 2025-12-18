import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

// GET - Scan local folder for photos
export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
    });

    const photoPath = settings?.screensaverPhotoPath || "/home/pi/famcal-photos";

    // Check if directory exists
    if (!fs.existsSync(photoPath)) {
      return NextResponse.json({
        photos: [],
        error: "Photo directory does not exist",
        path: photoPath,
      });
    }

    // Read directory contents
    const files = fs.readdirSync(photoPath);

    // Filter for supported image files
    const photos = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return SUPPORTED_EXTENSIONS.includes(ext);
      })
      .map((filename) => ({
        filename,
        url: `/api/local-photos/${encodeURIComponent(filename)}`,
      }));

    // Shuffle photos for variety
    const shuffled = photos.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      photos: shuffled,
      count: shuffled.length,
      path: photoPath,
    });
  } catch (error) {
    console.error("Error scanning photos:", error);
    return NextResponse.json(
      { error: "Failed to scan photos", photos: [] },
      { status: 500 }
    );
  }
}
