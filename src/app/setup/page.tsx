"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";

interface CalendarInfo {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor: string;
}

export default function SetupPage() {
  const { data: session, status } = useSession();
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session) {
      fetchCalendarStatus();
    }
  }, [session]);

  const fetchCalendarStatus = async () => {
    try {
      const res = await fetch("/api/calendar/status");
      const data = await res.json();
      if (data.calendars) {
        setCalendars(data.calendars);
        // Pre-select primary calendar if no selection exists
        const primary = data.calendars.find((c: CalendarInfo) => c.primary);
        if (primary && selectedCalendars.length === 0) {
          setSelectedCalendars([primary.id]);
        }
      }
    } catch (error) {
      console.error("Error fetching calendar status:", error);
    }
  };

  const toggleCalendar = (calendarId: string) => {
    setSelectedCalendars((prev) =>
      prev.includes(calendarId)
        ? prev.filter((id) => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  const handleSaveSelection = async () => {
    if (selectedCalendars.length === 0) {
      setMessage("Please select at least one calendar");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/calendar/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarIds: selectedCalendars }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Calendar selection saved!");
      } else {
        setMessage(data.error || "Failed to save selection");
      }
    } catch (error) {
      setMessage("Error saving selection");
      console.error(error);
    }
    setSaving(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage("");
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST" });
      const data = await res.json();
      setMessage(data.message || "Sync completed!");
    } catch (error) {
      setMessage("Error syncing calendar");
      console.error(error);
    }
    setSyncing(false);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
        <div className="text-2xl text-indigo-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8"
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            FamCal Setup
          </h1>
          <p className="text-slate-600 mb-8">
            Connect your Google Calendar to display events on your family dashboard.
          </p>

          {/* Connection Status */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">
              Google Account
            </h2>

            {session ? (
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-200">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-green-800">
                    {session.user?.name}
                  </p>
                  <p className="text-sm text-green-600">{session.user?.email}</p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all font-medium text-slate-700"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Connect with Google
              </button>
            )}
          </div>

          {/* Calendar Selection */}
          {session && calendars.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-700 mb-4">
                Select Calendars to Sync
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Choose which calendars to display on your family dashboard.
              </p>
              <div className="space-y-2">
                {calendars.map((cal) => (
                  <label
                    key={cal.id}
                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                      selectedCalendars.includes(cal.id)
                        ? "bg-indigo-50 border-2 border-indigo-300"
                        : "bg-slate-50 border-2 border-transparent hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCalendars.includes(cal.id)}
                      onChange={() => toggleCalendar(cal.id)}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cal.backgroundColor }}
                    />
                    <span className="flex-1 text-slate-700 font-medium">
                      {cal.summary}
                    </span>
                    {cal.primary && (
                      <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-600 rounded-full">
                        Primary
                      </span>
                    )}
                  </label>
                ))}
              </div>
              <button
                onClick={handleSaveSelection}
                disabled={saving || selectedCalendars.length === 0}
                className="mt-4 w-full px-6 py-3 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Calendar Selection"}
              </button>
            </div>
          )}

          {/* Sync Button */}
          {session && (
            <div className="mb-8">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="w-full px-6 py-4 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? "Syncing..." : "Sync Calendar Now"}
              </button>
            </div>
          )}

          {/* Status Message */}
          {message && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center py-3 px-4 rounded-xl mb-6 ${
                message.includes("Error") || message.includes("Failed") || message.includes("Please")
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-600"
              }`}
            >
              {message}
            </motion.p>
          )}

          {/* Back to Dashboard */}
          <div className="pt-4 border-t border-slate-200">
            <a
              href="/"
              className="flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </a>
          </div>
        </motion.div>

        {/* Setup Instructions */}
        {!session && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-white/60 backdrop-blur-xl rounded-3xl p-8"
          >
            <h2 className="text-xl font-semibold text-slate-700 mb-4">
              Google Cloud Setup Instructions
            </h2>
            <div className="text-slate-600 space-y-3">
              <p>
                To connect Google Calendar, you need to set up OAuth credentials:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  Go to{" "}
                  <a
                    href="https://console.cloud.google.com"
                    target="_blank"
                    className="text-indigo-600 hover:underline"
                  >
                    Google Cloud Console
                  </a>
                </li>
                <li>Create a new project (or select existing)</li>
                <li>Enable the Google Calendar API</li>
                <li>Go to Credentials → Create OAuth 2.0 Client ID</li>
                <li>Set authorized redirect URI to: <code className="bg-slate-100 px-2 py-1 rounded text-sm">http://localhost:3000/api/auth/callback/google</code></li>
                <li>Copy Client ID and Secret to your <code className="bg-slate-100 px-2 py-1 rounded text-sm">.env</code> file</li>
              </ol>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
