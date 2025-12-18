import { google, calendar_v3 } from "googleapis";
import { prisma } from "./prisma";

// Create OAuth2 client
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );
}

// Get authorization URL for Google Calendar access
export function getAuthUrl() {
  const oauth2Client = createOAuth2Client();

  const scopes = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events.readonly",
    "openid",
    "email",
    "profile",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent", // Force consent to get refresh token
  });
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Get authenticated OAuth client with stored tokens
export async function getAuthenticatedClient() {
  const googleAuth = await prisma.googleAuth.findUnique({
    where: { id: "singleton" },
  });

  if (!googleAuth) {
    return null;
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: googleAuth.accessToken,
    refresh_token: googleAuth.refreshToken,
    expiry_date: googleAuth.expiresAt.getTime(),
  });

  // Check if token needs refresh
  if (new Date() >= googleAuth.expiresAt) {
    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update stored tokens
    await prisma.googleAuth.update({
      where: { id: "singleton" },
      data: {
        accessToken: credentials.access_token!,
        expiresAt: new Date(credentials.expiry_date!),
      },
    });

    oauth2Client.setCredentials(credentials);
  }

  return oauth2Client;
}

// Store OAuth tokens in database
export async function storeTokens(tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
}) {
  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    throw new Error("Missing required token fields");
  }

  await prisma.googleAuth.upsert({
    where: { id: "singleton" },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date),
    },
    create: {
      id: "singleton",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date),
    },
  });
}

// Check if calendar is connected
export async function isCalendarConnected(): Promise<boolean> {
  const googleAuth = await prisma.googleAuth.findUnique({
    where: { id: "singleton" },
  });
  return googleAuth !== null;
}

// List available calendars
export async function listCalendars(): Promise<calendar_v3.Schema$CalendarListEntry[]> {
  const oauth2Client = await getAuthenticatedClient();
  if (!oauth2Client) {
    throw new Error("Google Calendar not connected");
  }

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const response = await calendar.calendarList.list();

  return response.data.items || [];
}

// Get calendar IDs to sync
export async function getCalendarIdsToSync(): Promise<string[]> {
  const googleAuth = await prisma.googleAuth.findUnique({
    where: { id: "singleton" },
  });

  if (!googleAuth?.calendarIds) {
    return ["primary"]; // Default to primary calendar
  }

  try {
    return JSON.parse(googleAuth.calendarIds);
  } catch {
    return ["primary"];
  }
}

// Set which calendars to sync
export async function setCalendarIdsToSync(calendarIds: string[]) {
  await prisma.googleAuth.update({
    where: { id: "singleton" },
    data: {
      calendarIds: JSON.stringify(calendarIds),
    },
  });
}

// Fetch events from Google Calendar
export async function fetchCalendarEvents(
  timeMin: Date = new Date(),
  timeMax?: Date
): Promise<calendar_v3.Schema$Event[]> {
  const oauth2Client = await getAuthenticatedClient();
  if (!oauth2Client) {
    throw new Error("Google Calendar not connected");
  }

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const calendarIds = await getCalendarIdsToSync();

  // Default to 7 days from now if timeMax not provided
  if (!timeMax) {
    timeMax = new Date(timeMin);
    timeMax.setDate(timeMax.getDate() + 7);
    timeMax.setHours(23, 59, 59, 999);
  }

  const allEvents: calendar_v3.Schema$Event[] = [];

  for (const calendarId of calendarIds) {
    try {
      const response = await calendar.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 50,
      });

      if (response.data.items) {
        // Add calendar info to each event
        const eventsWithCalendar = response.data.items.map((event) => ({
          ...event,
          calendarId,
        }));
        allEvents.push(...eventsWithCalendar);
      }
    } catch (error) {
      console.error(`Error fetching events from calendar ${calendarId}:`, error);
    }
  }

  // Sort all events by start time
  allEvents.sort((a, b) => {
    const aStart = a.start?.dateTime || a.start?.date || "";
    const bStart = b.start?.dateTime || b.start?.date || "";
    return aStart.localeCompare(bStart);
  });

  return allEvents;
}

// Sync events to local database
export async function syncCalendarToDatabase() {
  const events = await fetchCalendarEvents();

  // Get date range (today to 7 days from now)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Clear upcoming events and re-insert
  await prisma.calendarEvent.deleteMany({
    where: {
      startTime: {
        gte: today,
        lt: nextWeek,
      },
    },
  });

  // Insert new events
  for (const event of events) {
    if (!event.id || !event.summary) continue;

    const startTime = event.start?.dateTime
      ? new Date(event.start.dateTime)
      : event.start?.date
      ? new Date(event.start.date)
      : null;

    const endTime = event.end?.dateTime
      ? new Date(event.end.dateTime)
      : event.end?.date
      ? new Date(event.end.date)
      : null;

    if (!startTime || !endTime) continue;

    await prisma.calendarEvent.upsert({
      where: { googleId: event.id },
      update: {
        title: event.summary,
        description: event.description || null,
        startTime,
        endTime,
        allDay: !event.start?.dateTime,
        location: event.location || null,
        calendarId: (event as { calendarId?: string }).calendarId || "primary",
        color: event.colorId || null,
      },
      create: {
        googleId: event.id,
        title: event.summary,
        description: event.description || null,
        startTime,
        endTime,
        allDay: !event.start?.dateTime,
        location: event.location || null,
        calendarId: (event as { calendarId?: string }).calendarId || "primary",
        color: event.colorId || null,
      },
    });
  }

  return events.length;
}

// Get upcoming events from database (next 7 days)
export async function getTodaysEvents() {
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return prisma.calendarEvent.findMany({
    where: {
      startTime: {
        gte: now,
        lt: nextWeek,
      },
    },
    orderBy: {
      startTime: "asc",
    },
    take: 10, // Limit to 10 events for display
  });
}

// Disconnect Google Calendar
export async function disconnectCalendar() {
  await prisma.googleAuth.deleteMany();
  await prisma.calendarEvent.deleteMany();
}
