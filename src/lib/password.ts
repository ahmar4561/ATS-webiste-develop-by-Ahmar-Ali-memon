import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Same approach as the admin panel's password storage (scrypt, built into
// Node — no extra dependency). Kept as its own module so both admin and
// student auth can share one implementation instead of two copies.

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64).toString("hex");
  const candidateBuf = Buffer.from(candidate, "hex");
  const hashBuf = Buffer.from(hash, "hex");
  if (candidateBuf.length !== hashBuf.length) return false;
  return timingSafeEqual(candidateBuf, hashBuf);
}

// Characters chosen to avoid visually-confusable pairs (0/O, 1/I/l) since
// this is shown to students as a temporary password they'll type back in.
const PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Generates a random 8-character temporary password — used when a student
 * first enrolls, and when an admin resets someone's password. The student
 * is always encouraged to change it to something memorable afterwards.
 */
export function generateRandomPassword(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += PASSWORD_CHARS[bytes[i] % PASSWORD_CHARS.length];
  }
  return out;
}
