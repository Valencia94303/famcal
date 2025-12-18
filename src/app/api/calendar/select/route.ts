import { NextResponse } from "next/server";
import { setCalendarIdsToSync } from "@/lib/google-calendar";

export async function POST(request: Request) {
  try {
    const { calendarIds } = await request.json();

    if (!calendarIds || !Array.isArray(calendarIds) || calendarIds.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one calendar" },
        { status: 400 }
      );
    }

    await setCalendarIdsToSync(calendarIds);

    return NextResponse.json({
      success: true,
      message: `Selected ${calendarIds.length} calendar(s) for sync`,
    });
  } catch (error) {
    console.error("Error saving calendar selection:", error);
    return NextResponse.json(
      { error: "Failed to save calendar selection" },
      { status: 500 }
    );
  }
}
