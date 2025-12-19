import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fs from "fs/promises";
import * as path from "path";
import sharp from "sharp";

const AVATAR_SIZE = 256; // 256x256 pixels
const UPLOAD_DIR = "./public/uploads/avatars";

// POST - Upload custom avatar for a family member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify family member exists
    const member = await prisma.familyMember.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No avatar file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process image with sharp: resize and convert to WebP
    const processedImage = await sharp(buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 90 })
      .toBuffer();

    // Save file
    const filename = `${id}.webp`;
    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(filePath, processedImage);

    // Update family member with new avatar
    const avatarUrl = `/uploads/avatars/${filename}`;
    await prisma.familyMember.update({
      where: { id },
      data: {
        avatar: avatarUrl,
        avatarType: "custom",
      },
    });

    return NextResponse.json({
      success: true,
      avatarUrl,
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Remove custom avatar for a family member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify family member exists
    const member = await prisma.familyMember.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    // Delete custom avatar file if it exists
    if (member.avatarType === "custom" && member.avatar) {
      const filePath = path.join("./public", member.avatar);
      try {
        await fs.unlink(filePath);
      } catch {
        // File may not exist, ignore error
      }
    }

    // Reset avatar to emoji type with default emoji
    await prisma.familyMember.update({
      where: { id },
      data: {
        avatar: null,
        avatarType: "emoji",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Avatar removed",
    });
  } catch (error) {
    console.error("Error removing avatar:", error);
    return NextResponse.json(
      { error: "Failed to remove avatar" },
      { status: 500 }
    );
  }
}
