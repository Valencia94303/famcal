import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all schedule items
export async function GET() {
  try {
    const items = await prisma.scheduleItem.findMany({
      where: { isActive: true },
      orderBy: { time: "asc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

// POST create a new schedule item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, time, icon, days } = body;

    if (!title?.trim() || !time) {
      return NextResponse.json(
        { error: "Title and time are required" },
        { status: 400 }
      );
    }

    const item = await prisma.scheduleItem.create({
      data: {
        title: title.trim(),
        time,
        icon: icon || null,
        days: days ? JSON.stringify(days) : null,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule item:", error);
    return NextResponse.json(
      { error: "Failed to create schedule item" },
      { status: 500 }
    );
  }
}
