import { NextRequest, NextResponse } from "next/server";
import {
  checkAdminPassword,
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_VALUE,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!(await checkAdminPassword(password))) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE_NAME, ADMIN_SESSION_VALUE, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
