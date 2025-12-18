import { NextResponse } from "next/server";
import {
  syncCalendarToDatabase,
  isCalendarConnected,
} from "@/lib/google-calendar";

export async function POST() {
  try {
    const connected = await isCalendarConnected();

    if (!connected) {
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 400 }
      );
    }

    const eventCount = await syncCalendarToDatabase();

    return NextResponse.json({
      success: true,
      eventCount,
      message: `Synced ${eventCount} events`,
    });
  } catch (error) {
    console.error("Error syncing calendar:", error);
    return NextResponse.json(
      { error: "Failed to sync calendar" },
      { status: 500 }
    );
  }
}
