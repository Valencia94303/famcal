import { NextResponse } from "next/server";
import { getTodaysEvents, isCalendarConnected } from "@/lib/google-calendar";

export async function GET() {
  try {
    const connected = await isCalendarConnected();

    if (!connected) {
      return NextResponse.json({
        connected: false,
        events: [],
        message: "Google Calendar not connected",
      });
    }

    const events = await getTodaysEvents();

    return NextResponse.json({
      connected: true,
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        allDay: event.allDay,
        location: event.location,
        color: event.color,
      })),
    });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
