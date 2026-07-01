import { NextRequest, NextResponse } from "next/server";
import { getMeritList } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const testId = request.nextUrl.searchParams.get("testId") ?? undefined;
  const merit = await getMeritList(testId);
  return NextResponse.json({ merit });
}
