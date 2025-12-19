import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { getAuthContext, getClientInfo } from "./api-auth";

/**
 * Audit action types for the FamCal system
 */
export type AuditAction =
  // Points actions
  | "AWARD_POINTS"
  | "DEDUCT_POINTS"
  | "CHORE_POINTS_EARNED"
  | "HABIT_POINTS_EARNED"
  // Reward actions
  | "REQUEST_REDEMPTION"
  | "APPROVE_REDEMPTION"
  | "DENY_REDEMPTION"
  | "CREATE_REWARD"
  | "UPDATE_REWARD"
  | "DELETE_REWARD"
  // Member actions
  | "CREATE_MEMBER"
  | "UPDATE_MEMBER"
  | "DELETE_MEMBER"
  // Chore actions
  | "CREATE_CHORE"
  | "UPDATE_CHORE"
  | "DELETE_CHORE"
  | "COMPLETE_CHORE"
  // Settings actions
  | "UPDATE_SETTINGS"
  | "CHANGE_PIN"
  | "ENABLE_PIN"
  | "DISABLE_PIN"
  // Backup actions
  | "CREATE_BACKUP"
  | "RESTORE_BACKUP"
  | "DELETE_BACKUP";

/**
 * Entity types for audit logs
 */
export type AuditEntityType =
  | "POINTS"
  | "REWARD"
  | "REDEMPTION"
  | "CHORE"
  | "HABIT"
  | "MEMBER"
  | "SETTINGS"
  | "BACKUP";

/**
 * Parameters for creating an audit log entry
 */
export interface CreateAuditLogParams {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  description?: string;
  request?: NextRequest;
  performedBy?: string;
  performedByName?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    const {
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      description,
      request,
      performedBy,
      performedByName,
    } = params;

    // Get client info from request if available
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (request) {
      const clientInfo = getClientInfo(request);
      ipAddress = clientInfo.ipAddress;
      userAgent = clientInfo.userAgent;
    }

    // Try to get performer info from auth context if not provided
    let finalPerformedBy = performedBy;
    let finalPerformedByName = performedByName;

    if (!finalPerformedBy && request) {
      try {
        const authContext = await getAuthContext(request);
        if (authContext.memberId) {
          finalPerformedBy = authContext.memberId;
          finalPerformedByName = authContext.memberName || undefined;
        }
      } catch {
        // Ignore auth context errors
      }
    }

    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        description,
        performedBy: finalPerformedBy,
        performedByName: finalPerformedByName,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Log but don't fail the main operation if audit logging fails
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Get audit history for a specific entity
 */
export async function getAuditHistory(
  entityType: AuditEntityType,
  entityId: string,
  limit = 50
) {
  return prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get recent audit logs with optional filtering
 */
export async function getRecentAuditLogs(options: {
  limit?: number;
  entityType?: AuditEntityType;
  action?: AuditAction;
  performedBy?: string;
  since?: Date;
} = {}) {
  const { limit = 100, entityType, action, performedBy, since } = options;

  return prisma.auditLog.findMany({
    where: {
      ...(entityType && { entityType }),
      ...(action && { action }),
      ...(performedBy && { performedBy }),
      ...(since && { createdAt: { gte: since } }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get audit logs for a specific performer (family member)
 */
export async function getAuditLogsByPerformer(performedBy: string, limit = 50) {
  return prisma.auditLog.findMany({
    where: { performedBy },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Clean up old audit logs (keep last N days)
 */
export async function cleanupOldAuditLogs(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}

/**
 * Action descriptions for display purposes
 */
export const AUDIT_ACTION_DESCRIPTIONS: Record<AuditAction, string> = {
  AWARD_POINTS: "Awarded points",
  DEDUCT_POINTS: "Deducted points",
  CHORE_POINTS_EARNED: "Earned points from chore",
  HABIT_POINTS_EARNED: "Earned points from habit",
  REQUEST_REDEMPTION: "Requested reward redemption",
  APPROVE_REDEMPTION: "Approved redemption",
  DENY_REDEMPTION: "Denied redemption",
  CREATE_REWARD: "Created reward",
  UPDATE_REWARD: "Updated reward",
  DELETE_REWARD: "Deleted reward",
  CREATE_MEMBER: "Added family member",
  UPDATE_MEMBER: "Updated family member",
  DELETE_MEMBER: "Removed family member",
  CREATE_CHORE: "Created chore",
  UPDATE_CHORE: "Updated chore",
  DELETE_CHORE: "Deleted chore",
  COMPLETE_CHORE: "Completed chore",
  UPDATE_SETTINGS: "Updated settings",
  CHANGE_PIN: "Changed PIN",
  ENABLE_PIN: "Enabled PIN protection",
  DISABLE_PIN: "Disabled PIN protection",
  CREATE_BACKUP: "Created backup",
  RESTORE_BACKUP: "Restored from backup",
  DELETE_BACKUP: "Deleted backup",
};
