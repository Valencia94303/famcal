import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  optimizePhoto,
  getFileSize,
  formatBytes,
} from "@/lib/photo-optimizer";
import * as path from "path";

// POST - Optimize all unoptimized photos
export async function POST() {
  try {
    // Get settings to find photo path
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
    });

    const photoPath = settings?.screensaverPhotoPath || "/home/pi/famcal-photos";

    // Get all photos that haven't been optimized
    const photos = await prisma.familyPhoto.findMany({
      where: { optimized: false },
    });

    if (photos.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No photos to optimize",
        optimized: 0,
        totalSaved: 0,
        totalSavedFormatted: "0 B",
      });
    }

    const results = {
      optimized: 0,
      failed: 0,
      totalOriginalSize: 0,
      totalOptimizedSize: 0,
      errors: [] as string[],
    };

    for (const photo of photos) {
      // Construct full path from URL
      let filePath = photo.url;

      // If URL is relative or just a filename, prepend the photo path
      if (!path.isAbsolute(filePath)) {
        filePath = path.join(photoPath, filePath);
      }

      const result = await optimizePhoto(filePath);

      if (result.success) {
        results.optimized++;
        results.totalOriginalSize += result.originalSize;
        results.totalOptimizedSize += result.optimizedSize;

        // Update photo record
        await prisma.familyPhoto.update({
          where: { id: photo.id },
          data: {
            optimized: true,
            optimizedAt: new Date(),
            sizeBytes: result.optimizedSize,
            originalSizeBytes: result.originalSize,
            originalUrl: result.originalPath || null,
          },
        });
      } else {
        results.failed++;
        results.errors.push(`${photo.url}: ${result.error}`);
      }
    }

    const totalSaved = results.totalOriginalSize - results.totalOptimizedSize;

    return NextResponse.json({
      success: true,
      message: `Optimized ${results.optimized} photos`,
      optimized: results.optimized,
      failed: results.failed,
      totalOriginalSize: results.totalOriginalSize,
      totalOptimizedSize: results.totalOptimizedSize,
      totalSaved,
      totalSavedFormatted: formatBytes(totalSaved),
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error("Error optimizing photos:", error);
    return NextResponse.json(
      { error: "Failed to optimize photos", details: String(error) },
      { status: 500 }
    );
  }
}
