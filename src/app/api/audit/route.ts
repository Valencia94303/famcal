import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getAuthContext } from "@/lib/api-auth";
import { getRecentAuditLogs, cleanupOldAuditLogs, AUDIT_ACTION_DESCRIPTIONS } from "@/lib/audit";
import type { AuditAction, AuditEntityType } from "@/lib/audit";

/**
 * GET /api/audit - Get audit logs (requires audit:view permission)
 */
export async function GET(request: NextRequest) {
  // Check permission
  const permissionError = await requirePermission(request, "audit:view");
  if (permissionError) {
    return permissionError;
  }

  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const entityType = searchParams.get("entityType") as AuditEntityType | null;
    const action = searchParams.get("action") as AuditAction | null;
    const performedBy = searchParams.get("performedBy");
    const sinceStr = searchParams.get("since");
    const since = sinceStr ? new Date(sinceStr) : undefined;

    // Get audit logs
    const logs = await getRecentAuditLogs({
      limit: Math.min(limit, 500), // Cap at 500
      entityType: entityType || undefined,
      action: action || undefined,
      performedBy: performedBy || undefined,
      since,
    });

    // Enhance logs with action descriptions
    const enhancedLogs = logs.map((log) => ({
      ...log,
      actionDescription: AUDIT_ACTION_DESCRIPTIONS[log.action as AuditAction] || log.action,
      oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
      newValue: log.newValue ? JSON.parse(log.newValue) : null,
    }));

    return NextResponse.json({
      logs: enhancedLogs,
      count: enhancedLogs.length,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/audit - Clean up old audit logs (requires audit:view permission)
 */
export async function DELETE(request: NextRequest) {
  // Check permission
  const permissionError = await requirePermission(request, "audit:view");
  if (permissionError) {
    return permissionError;
  }

  try {
    const { searchParams } = new URL(request.url);
    const daysToKeep = parseInt(searchParams.get("daysToKeep") || "90", 10);

    // Minimum 30 days retention
    const retentionDays = Math.max(daysToKeep, 30);

    const deletedCount = await cleanupOldAuditLogs(retentionDays);

    // Get current auth context for audit logging
    const context = await getAuthContext(request);

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} audit log entries older than ${retentionDays} days`,
      performedBy: context.memberName || "Unknown",
    });
  } catch (error) {
    console.error("Error cleaning up audit logs:", error);
    return NextResponse.json(
      { error: "Failed to clean up audit logs" },
      { status: 500 }
    );
  }
}
