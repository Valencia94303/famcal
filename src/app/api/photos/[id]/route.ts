import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT update photo
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { url, caption } = body;

    const updateData: Record<string, unknown> = {};
    if (url !== undefined) updateData.url = url.trim();
    if (caption !== undefined) updateData.caption = caption || null;

    const photo = await prisma.familyPhoto.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ photo });
  } catch (error) {
    console.error("Error updating photo:", error);
    return NextResponse.json(
      { error: "Failed to update photo" },
      { status: 500 }
    );
  }
}

// DELETE photo
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.familyPhoto.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
