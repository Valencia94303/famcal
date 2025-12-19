import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatBytes } from "@/lib/photo-optimizer";

// GET - Get photo optimization statistics
export async function GET() {
  try {
    const [totalPhotos, optimizedPhotos, sizeStats] = await Promise.all([
      prisma.familyPhoto.count(),
      prisma.familyPhoto.count({ where: { optimized: true } }),
      prisma.familyPhoto.aggregate({
        where: { optimized: true },
        _sum: {
          sizeBytes: true,
          originalSizeBytes: true,
        },
      }),
    ]);

    const totalOriginalSize = sizeStats._sum.originalSizeBytes || 0;
    const totalOptimizedSize = sizeStats._sum.sizeBytes || 0;
    const savedBytes = totalOriginalSize - totalOptimizedSize;
    const savedPercent = totalOriginalSize > 0
      ? Math.round((savedBytes / totalOriginalSize) * 100)
      : 0;

    return NextResponse.json({
      totalPhotos,
      optimizedPhotos,
      unoptimizedPhotos: totalPhotos - optimizedPhotos,
      totalOriginalSize,
      totalOriginalSizeFormatted: formatBytes(totalOriginalSize),
      totalOptimizedSize,
      totalOptimizedSizeFormatted: formatBytes(totalOptimizedSize),
      savedBytes,
      savedBytesFormatted: formatBytes(savedBytes),
      savedPercent,
    });
  } catch (error) {
    console.error("Error fetching photo stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch photo stats" },
      { status: 500 }
    );
  }
}
