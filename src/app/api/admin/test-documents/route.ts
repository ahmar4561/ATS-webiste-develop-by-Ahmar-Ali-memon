import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  getTestDocumentsMeta,
  saveTestDocument,
  deleteTestDocument,
} from "@/lib/storage";

// Vercel serverless functions cap the request body around 4.5 MB. Base64
// adds ~33% overhead on top of the raw PDF size, so we cap the *original*
// file at 3 MB (~4 MB once base64-encoded), leaving headroom for JSON.
const MAX_PDF_RAW_BYTES = 3 * 1024 * 1024; // 3 MB original file size

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const documents = await getTestDocumentsMeta();
  return NextResponse.json({ documents });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const testNumber = Number(body.testNumber);
    const label = (body.label ?? "").trim();
    const fileName = (body.fileName ?? "").trim();
    const pdfBase64 = body.pdfBase64 as string;

    if (!testNumber) {
      return NextResponse.json({ error: "testNumber required" }, { status: 400 });
    }
    if (!label) {
      return NextResponse.json({ error: "label required" }, { status: 400 });
    }
    if (!fileName || !fileName.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "A PDF file is required" }, { status: 400 });
    }
    if (!pdfBase64 || typeof pdfBase64 !== "string") {
      return NextResponse.json({ error: "pdfBase64 required" }, { status: 400 });
    }

    // Rough size check: base64 is ~4/3 the size of the original bytes.
    const approxRawBytes = (pdfBase64.length * 3) / 4;
    if (approxRawBytes > MAX_PDF_RAW_BYTES) {
      return NextResponse.json(
        { error: "PDF is too large (max 3 MB). Try compressing it first." },
        { status: 400 }
      );
    }

    await saveTestDocument({ testNumber, label, fileName, pdfBase64 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("test-documents upload error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testNumber = Number(request.nextUrl.searchParams.get("testNumber"));
  if (!testNumber) {
    return NextResponse.json({ error: "testNumber required" }, { status: 400 });
  }

  const deleted = await deleteTestDocument(testNumber);
  return NextResponse.json({ success: deleted });
}
