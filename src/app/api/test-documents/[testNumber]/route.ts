import { NextRequest, NextResponse } from "next/server";
import { getTestDocument } from "@/lib/storage";

// Public — students download this straight from their dashboard.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testNumber: string }> }
) {
  const { testNumber: testNumberParam } = await params;
  const testNumber = Number(testNumberParam);
  if (!testNumber) {
    return NextResponse.json({ error: "Invalid test number" }, { status: 400 });
  }

  const doc = await getTestDocument(testNumber);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = Buffer.from(doc.pdfBase64, "base64");
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.fileName}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
