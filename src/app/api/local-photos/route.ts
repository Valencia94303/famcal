import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

// Fisher-Yates shuffle for unbiased randomization
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

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

    // Shuffle photos for variety (using Fisher-Yates for unbiased results)
    const shuffled = shuffleArray(photos);

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
