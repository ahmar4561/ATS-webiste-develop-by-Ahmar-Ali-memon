import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getPhysicalRegistrationReceipt } from "@/lib/storage";

// Fetches the base64 receipt for exactly one registration. Kept separate
// from the list endpoint so the admin panel doesn't pull every registration's
// receipt image (up to 5 MB each) on every load — that was blowing through
// Neon's free-tier network transfer quota in a day or two.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const receiptUrl = await getPhysicalRegistrationReceipt(id);
  if (!receiptUrl) {
    return NextResponse.json({ error: "No receipt found" }, { status: 404 });
  }

  return NextResponse.json({ receiptUrl });
}
