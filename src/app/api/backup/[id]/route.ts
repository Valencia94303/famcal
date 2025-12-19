import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Download specific backup
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const backup = await prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      return NextResponse.json(
        { error: "Backup not found" },
        { status: 404 }
      );
    }

    // Parse the stored JSON data
    const backupData = JSON.parse(backup.data);

    const filename = `famcal-backup-${backup.name.replace(/\s+/g, "-")}-${backup.createdAt.toISOString().split("T")[0]}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error fetching backup:", error);
    return NextResponse.json(
      { error: "Failed to fetch backup" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a backup
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const backup = await prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      return NextResponse.json(
        { error: "Backup not found" },
        { status: 404 }
      );
    }

    await prisma.backup.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Backup deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting backup:", error);
    return NextResponse.json(
      { error: "Failed to delete backup" },
      { status: 500 }
    );
  }
}
