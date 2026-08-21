import { NextRequest } from "next/server";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { getAdminPasswordHash, setAdminPasswordHash } from "./storage";

// This env var is a permanent "recovery key" — it ALWAYS works for logging
// in, no matter what password has been set from the admin panel. Set it in
// your hosting provider's Environment Variables and keep it somewhere safe
// (e.g. a password manager). If you ever forget the password you changed
// from the panel, log in with this instead, then set a new one.
export const ADMIN_RECOVERY_PASSWORD =
  process.env.ADMIN_PASSWORD || "ATS-Admin@2026";

export const ADMIN_COOKIE_NAME = "ats_admin_session";

// Value stored in the cookie when logged in. Kept separate from the
// password itself so the password is never sitting in the browser.
export const ADMIN_SESSION_VALUE = "granted";

// --- Password hashing (scrypt, built into Node — no extra dependency) ---

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64).toString("hex");
  const candidateBuf = Buffer.from(candidate, "hex");
  const hashBuf = Buffer.from(hash, "hex");
  if (candidateBuf.length !== hashBuf.length) return false;
  return timingSafeEqual(candidateBuf, hashBuf);
}

/**
 * Checks a password against: (1) the permanent recovery key from the env
 * var, or (2) the current password set from the admin panel (stored, hashed,
 * in the database). Either one is accepted for login.
 */
export async function checkAdminPassword(password: string): Promise<boolean> {
  if (typeof password !== "string" || password.length === 0) return false;

  if (password === ADMIN_RECOVERY_PASSWORD) return true;

  const storedHash = await getAdminPasswordHash();
  if (!storedHash) return false;
  return verifyPassword(password, storedHash);
}

/**
 * Changes the admin panel password. `currentPassword` must match either the
 * recovery key or the existing panel password before the change is allowed.
 */
export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdminPassword(currentPassword))) {
    return { success: false, error: "Current password is incorrect." };
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return {
      success: false,
      error: "New password must be at least 8 characters.",
    };
  }
  await setAdminPasswordHash(hashPassword(newPassword));
  return { success: true };
}

export function isAdminRequest(request: NextRequest): boolean {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
  return cookie?.value === ADMIN_SESSION_VALUE;
}
