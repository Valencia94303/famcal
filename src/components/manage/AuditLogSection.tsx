"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AuditLog {
  id: string;
  action: string;
  actionDescription: string;
  entityType: string;
  entityId: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  description: string | null;
  performedBy: string | null;
  performedByName: string | null;
  ipAddress: string | null;
  createdAt: string;
}

type FilterType = "all" | "POINTS" | "REDEMPTION" | "MEMBER" | "CHORE" | "SETTINGS" | "BACKUP";

const ENTITY_TYPES: { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "POINTS", label: "Points" },
  { id: "REDEMPTION", label: "Rewards" },
  { id: "MEMBER", label: "Members" },
  { id: "CHORE", label: "Chores" },
  { id: "SETTINGS", label: "Settings" },
  { id: "BACKUP", label: "Backups" },
];

const ACTION_COLORS: Record<string, string> = {
  AWARD_POINTS: "bg-green-100 text-green-700",
  DEDUCT_POINTS: "bg-red-100 text-red-700",
  CHORE_POINTS_EARNED: "bg-green-100 text-green-700",
  HABIT_POINTS_EARNED: "bg-green-100 text-green-700",
  REQUEST_REDEMPTION: "bg-blue-100 text-blue-700",
  APPROVE_REDEMPTION: "bg-green-100 text-green-700",
  DENY_REDEMPTION: "bg-red-100 text-red-700",
  CREATE_REWARD: "bg-purple-100 text-purple-700",
  UPDATE_REWARD: "bg-purple-100 text-purple-700",
  DELETE_REWARD: "bg-red-100 text-red-700",
  CREATE_MEMBER: "bg-indigo-100 text-indigo-700",
  UPDATE_MEMBER: "bg-indigo-100 text-indigo-700",
  DELETE_MEMBER: "bg-red-100 text-red-700",
  CREATE_CHORE: "bg-cyan-100 text-cyan-700",
  UPDATE_CHORE: "bg-cyan-100 text-cyan-700",
  DELETE_CHORE: "bg-red-100 text-red-700",
  COMPLETE_CHORE: "bg-green-100 text-green-700",
  UPDATE_SETTINGS: "bg-amber-100 text-amber-700",
  CHANGE_PIN: "bg-amber-100 text-amber-700",
  ENABLE_PIN: "bg-amber-100 text-amber-700",
  DISABLE_PIN: "bg-amber-100 text-amber-700",
  CREATE_BACKUP: "bg-slate-100 text-slate-700",
  RESTORE_BACKUP: "bg-amber-100 text-amber-700",
  DELETE_BACKUP: "bg-red-100 text-red-700",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AuditLogSection() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    fetchLogs();
  }, [filter, limit]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      if (filter !== "all") {
        params.set("entityType", filter);
      }

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          setError("Authentication required");
        } else if (res.status === 403) {
          setError("You don't have permission to view audit logs");
        } else {
          setError("Failed to fetch audit logs");
        }
        setLogs([]);
        return;
      }

      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError("Failed to fetch audit logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("AWARD") || action.includes("EARNED") || action.includes("APPROVE") || action.includes("COMPLETE")) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (action.includes("DEDUCT") || action.includes("DENY") || action.includes("DELETE")) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    if (action.includes("CREATE") || action.includes("REQUEST")) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
    }
    if (action.includes("UPDATE") || action.includes("CHANGE")) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Audit Log</h2>
          <button
            onClick={fetchLogs}
            className="px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium min-h-[40px] flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
          {ENTITY_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setFilter(type.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap min-h-[40px] transition-colors ${
                filter === type.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
            <svg className="w-8 h-8 mx-auto mb-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && !error && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && logs.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No audit logs found</p>
            <p className="text-sm mt-1">Actions will be logged as they occur</p>
          </div>
        )}

        {/* Logs list */}
        {!loading && !error && logs.length > 0 && (
          <div className="space-y-2">
            {logs.map((log) => (
              <motion.div
                key={log.id}
                layout
                className="bg-slate-50 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  className="w-full p-3 text-left"
                >
                  <div className="flex items-start gap-3">
                    {/* Action icon */}
                    <div
                      className={`p-2 rounded-lg ${ACTION_COLORS[log.action] || "bg-slate-100 text-slate-600"}`}
                    >
                      {getActionIcon(log.action)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm">
                        {log.actionDescription}
                      </p>
                      {log.description && (
                        <p className="text-slate-600 text-sm mt-0.5 line-clamp-2">
                          {log.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        {log.performedByName && (
                          <>
                            <span className="font-medium">{log.performedByName}</span>
                            <span>•</span>
                          </>
                        )}
                        <span title={new Date(log.createdAt).toLocaleString()}>
                          {formatDate(log.createdAt)}
                        </span>
                        <span>at {formatTime(log.createdAt)}</span>
                      </div>
                    </div>

                    {/* Expand indicator */}
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        expandedLog === log.id ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded details */}
                <AnimatePresence>
                  {expandedLog === log.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-200"
                    >
                      <div className="p-3 space-y-3 text-sm">
                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Entity Type:</span>
                            <span className="ml-1 font-medium text-slate-700">{log.entityType}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Action:</span>
                            <span className="ml-1 font-medium text-slate-700">{log.action}</span>
                          </div>
                          {log.ipAddress && (
                            <div className="col-span-2">
                              <span className="text-slate-500">IP Address:</span>
                              <span className="ml-1 font-mono text-slate-700">{log.ipAddress}</span>
                            </div>
                          )}
                        </div>

                        {/* Value changes */}
                        {(log.oldValue || log.newValue) && (
                          <div className="space-y-2">
                            {log.oldValue && (
                              <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">Previous Value:</p>
                                <pre className="p-2 bg-red-50 rounded-lg text-xs overflow-x-auto text-red-700">
                                  {JSON.stringify(log.oldValue, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.newValue && (
                              <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">New Value:</p>
                                <pre className="p-2 bg-green-50 rounded-lg text-xs overflow-x-auto text-green-700">
                                  {JSON.stringify(log.newValue, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* Load more */}
            {logs.length >= limit && (
              <button
                onClick={() => setLimit((prev) => prev + 50)}
                className="w-full py-3 text-indigo-600 font-medium text-sm hover:bg-indigo-50 rounded-xl transition-colors"
              >
                Load more...
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium">About Audit Logs</p>
            <p className="mt-1 text-blue-600">
              Audit logs track all security-sensitive actions in your family dashboard, including point awards, reward redemptions, and settings changes. Logs are retained for 90 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
