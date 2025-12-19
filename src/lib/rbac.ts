/**
 * Role-Based Access Control (RBAC) for FamCal
 *
 * Roles:
 * - PARENT: Full access to manage settings, award points, approve redemptions
 * - CHILD: Can complete chores, view own points, request rewards
 */

export type Role = "PARENT" | "CHILD";

export type Permission =
  // Manage section access
  | "manage:access"
  | "manage:settings"
  | "manage:family"
  // Points & Rewards
  | "points:award"
  | "points:deduct"
  | "points:view_all"
  | "points:view_own"
  | "rewards:create"
  | "rewards:edit"
  | "rewards:delete"
  | "rewards:request"
  | "rewards:approve"
  | "rewards:reject"
  // Chores
  | "chores:create"
  | "chores:edit"
  | "chores:delete"
  | "chores:assign"
  | "chores:complete_own"
  | "chores:complete_any"
  | "chores:view_all"
  // Habits
  | "habits:create"
  | "habits:edit"
  | "habits:delete"
  | "habits:log_own"
  | "habits:log_any"
  // Schedule
  | "schedule:create"
  | "schedule:edit"
  | "schedule:delete"
  // Shopping
  | "shopping:create"
  | "shopping:edit"
  | "shopping:delete"
  | "shopping:check"
  // Tasks
  | "tasks:create"
  | "tasks:edit"
  | "tasks:delete"
  | "tasks:complete"
  // Photos
  | "photos:upload"
  | "photos:delete"
  | "photos:optimize"
  // Backup
  | "backup:create"
  | "backup:restore"
  | "backup:delete"
  // Audit
  | "audit:view";

/**
 * Permission matrix for each role
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  PARENT: [
    // Full manage access
    "manage:access",
    "manage:settings",
    "manage:family",
    // Full points control
    "points:award",
    "points:deduct",
    "points:view_all",
    "points:view_own",
    // Full rewards control
    "rewards:create",
    "rewards:edit",
    "rewards:delete",
    "rewards:approve",
    "rewards:reject",
    // Full chores control
    "chores:create",
    "chores:edit",
    "chores:delete",
    "chores:assign",
    "chores:complete_own",
    "chores:complete_any",
    "chores:view_all",
    // Full habits control
    "habits:create",
    "habits:edit",
    "habits:delete",
    "habits:log_own",
    "habits:log_any",
    // Full schedule control
    "schedule:create",
    "schedule:edit",
    "schedule:delete",
    // Full shopping control
    "shopping:create",
    "shopping:edit",
    "shopping:delete",
    "shopping:check",
    // Full tasks control
    "tasks:create",
    "tasks:edit",
    "tasks:delete",
    "tasks:complete",
    // Photos
    "photos:upload",
    "photos:delete",
    "photos:optimize",
    // Backup
    "backup:create",
    "backup:restore",
    "backup:delete",
    // Audit
    "audit:view",
  ],
  CHILD: [
    // Limited access
    "points:view_own",
    "rewards:request",
    "chores:complete_own",
    "habits:log_own",
    "shopping:check",
    "tasks:complete",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role is a parent role
 */
export function isParent(role: string): boolean {
  return role === "PARENT";
}

/**
 * Check if a role is a child role
 */
export function isChild(role: string): boolean {
  return role === "CHILD";
}

/**
 * Validate that a string is a valid role
 */
export function isValidRole(role: string): role is Role {
  return role === "PARENT" || role === "CHILD";
}

/**
 * Permission descriptions for UI display
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  "manage:access": "Access the manage section",
  "manage:settings": "Modify app settings",
  "manage:family": "Manage family members",
  "points:award": "Award points to family members",
  "points:deduct": "Deduct points from family members",
  "points:view_all": "View all family members' points",
  "points:view_own": "View own points balance",
  "rewards:create": "Create new rewards",
  "rewards:edit": "Edit existing rewards",
  "rewards:delete": "Delete rewards",
  "rewards:request": "Request reward redemption",
  "rewards:approve": "Approve reward redemptions",
  "rewards:reject": "Reject reward redemptions",
  "chores:create": "Create new chores",
  "chores:edit": "Edit existing chores",
  "chores:delete": "Delete chores",
  "chores:assign": "Assign chores to family members",
  "chores:complete_own": "Complete own assigned chores",
  "chores:complete_any": "Complete any chore",
  "chores:view_all": "View all chores and assignments",
  "habits:create": "Create new habits",
  "habits:edit": "Edit existing habits",
  "habits:delete": "Delete habits",
  "habits:log_own": "Log own habit completions",
  "habits:log_any": "Log any family member's habits",
  "schedule:create": "Create schedule items",
  "schedule:edit": "Edit schedule items",
  "schedule:delete": "Delete schedule items",
  "shopping:create": "Add shopping items",
  "shopping:edit": "Edit shopping items",
  "shopping:delete": "Delete shopping items",
  "shopping:check": "Check off shopping items",
  "tasks:create": "Create tasks",
  "tasks:edit": "Edit tasks",
  "tasks:delete": "Delete tasks",
  "tasks:complete": "Complete tasks",
  "photos:upload": "Upload photos",
  "photos:delete": "Delete photos",
  "photos:optimize": "Optimize photos",
  "backup:create": "Create backups",
  "backup:restore": "Restore from backups",
  "backup:delete": "Delete backups",
  "audit:view": "View audit logs",
};
