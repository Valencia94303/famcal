import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all photos
export async function GET() {
  try {
    const photos = await prisma.familyPhoto.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

// POST add a new photo
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, caption } = body;

    if (!url?.trim()) {
      return NextResponse.json(
        { error: "Photo URL is required" },
        { status: 400 }
      );
    }

    const photo = await prisma.familyPhoto.create({
      data: {
        url: url.trim(),
        caption: caption || null,
      },
    });

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    console.error("Error adding photo:", error);
    return NextResponse.json(
      { error: "Failed to add photo" },
      { status: 500 }
    );
  }
}
