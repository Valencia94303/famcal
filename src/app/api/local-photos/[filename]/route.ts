import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

// GET - Serve individual photo file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security: Prevent path traversal attacks
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      );
    }

    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
    });

    const photoPath = settings?.screensaverPhotoPath || "/home/pi/famcal-photos";
    const filePath = path.join(photoPath, filename);

    // Security: Ensure the resolved path is within the photo directory
    const resolvedPath = path.resolve(filePath);
    const resolvedPhotoPath = path.resolve(photoPath);
    if (!resolvedPath.startsWith(resolvedPhotoPath)) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Get file extension and mime type
    const ext = path.extname(filename).toLowerCase();
    const mimeType = MIME_TYPES[ext] || "application/octet-stream";

    // Read and serve the file
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving photo:", error);
    return NextResponse.json(
      { error: "Failed to serve photo" },
      { status: 500 }
    );
  }
}
