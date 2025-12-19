import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "./prisma";

const SALT_ROUNDS = 10;
const SESSION_DURATION_HOURS = 24;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

/**
 * Hash a PIN for storage
 */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

/**
 * Verify a PIN against its hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create a new PIN session
 */
export async function createPinSession(): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  await prisma.pinSession.create({
    data: {
      token,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

/**
 * Validate a session token
 */
export async function validateSession(token: string): Promise<boolean> {
  if (!token) return false;

  const session = await prisma.pinSession.findUnique({
    where: { token },
  });

  if (!session) return false;

  // Check if session has expired
  if (session.expiresAt < new Date()) {
    // Clean up expired session
    await prisma.pinSession.delete({ where: { token } });
    return false;
  }

  return true;
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  try {
    await prisma.pinSession.delete({ where: { token } });
  } catch {
    // Session may not exist, ignore
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.pinSession.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}

/**
 * Check if account is locked out due to failed attempts
 */
export async function isLockedOut(): Promise<boolean> {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
    select: { pinLockedUntil: true },
  });

  if (!settings?.pinLockedUntil) return false;
  return settings.pinLockedUntil > new Date();
}

/**
 * Get lockout remaining time in seconds
 */
export async function getLockoutRemainingSeconds(): Promise<number> {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
    select: { pinLockedUntil: true },
  });

  if (!settings?.pinLockedUntil) return 0;

  const remaining = settings.pinLockedUntil.getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000));
}

/**
 * Record a failed PIN attempt
 */
export async function recordFailedAttempt(): Promise<{ locked: boolean; remainingAttempts: number }> {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
    select: { pinFailedAttempts: true },
  });

  const newAttempts = (settings?.pinFailedAttempts || 0) + 1;
  const locked = newAttempts >= MAX_FAILED_ATTEMPTS;

  await prisma.settings.update({
    where: { id: "singleton" },
    data: {
      pinFailedAttempts: newAttempts,
      ...(locked && {
        pinLockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000),
      }),
    },
  });

  return {
    locked,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - newAttempts),
  };
}

/**
 * Reset failed attempts after successful login
 */
export async function resetFailedAttempts(): Promise<void> {
  await prisma.settings.update({
    where: { id: "singleton" },
    data: {
      pinFailedAttempts: 0,
      pinLockedUntil: null,
    },
  });
}

/**
 * Validate PIN format (4-6 digits)
 */
export function isValidPinFormat(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

/**
 * Get PIN authentication status
 */
export async function getPinStatus(): Promise<{
  enabled: boolean;
  configured: boolean;
  locked: boolean;
  lockoutRemaining: number;
}> {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
    select: {
      pinEnabled: true,
      adminPinHash: true,
      pinLockedUntil: true,
    },
  });

  const locked = settings?.pinLockedUntil ? settings.pinLockedUntil > new Date() : false;
  const lockoutRemaining = locked && settings?.pinLockedUntil
    ? Math.ceil((settings.pinLockedUntil.getTime() - Date.now()) / 1000)
    : 0;

  return {
    enabled: settings?.pinEnabled || false,
    configured: !!settings?.adminPinHash,
    locked,
    lockoutRemaining,
  };
}
