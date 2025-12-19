import { NextResponse } from "next/server";
import { getPinStatus } from "@/lib/pin-auth";

// GET - Check PIN authentication status
export async function GET() {
  try {
    const status = await getPinStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("Error getting PIN status:", error);
    return NextResponse.json(
      { error: "Failed to get PIN status" },
      { status: 500 }
    );
  }
}
