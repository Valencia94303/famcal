import { NextResponse } from "next/server";
import { isCalendarConnected, listCalendars } from "@/lib/google-calendar";

export async function GET() {
  try {
    const connected = await isCalendarConnected();

    if (!connected) {
      return NextResponse.json({
        connected: false,
        calendars: [],
      });
    }

    try {
      const calendars = await listCalendars();
      return NextResponse.json({
        connected: true,
        calendars: calendars.map((cal) => ({
          id: cal.id,
          summary: cal.summary,
          primary: cal.primary,
          backgroundColor: cal.backgroundColor,
        })),
      });
    } catch {
      // Token might be invalid
      return NextResponse.json({
        connected: false,
        calendars: [],
        error: "Token expired or invalid",
      });
    }
  } catch (error) {
    console.error("Error checking calendar status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
