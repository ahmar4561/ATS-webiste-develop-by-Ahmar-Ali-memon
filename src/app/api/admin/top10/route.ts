import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getMeritList } from "@/lib/storage";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testId = request.nextUrl.searchParams.get("testId") ?? undefined;
  const merit = await getMeritList(testId);
  const top10 = merit.filter((e) => e.rank <= 10);

  return NextResponse.json({ top10 });
}
