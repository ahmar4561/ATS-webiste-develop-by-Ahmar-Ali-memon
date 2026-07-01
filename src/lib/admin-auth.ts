import { NextRequest } from "next/server";

// Set ADMIN_PASSWORD in your hosting provider's Environment Variables.
// If not set, this fallback is used (change it before going live).
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ATS-Admin@2026";

export const ADMIN_COOKIE_NAME = "ats_admin_session";

// Value stored in the cookie when logged in. Kept separate from the
// password itself so the password is never sitting in the browser.
export const ADMIN_SESSION_VALUE = "granted";

export function checkAdminPassword(password: string): boolean {
  return typeof password === "string" && password === ADMIN_PASSWORD;
}

export function isAdminRequest(request: NextRequest): boolean {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
  return cookie?.value === ADMIN_SESSION_VALUE;
}
