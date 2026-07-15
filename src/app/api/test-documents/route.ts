import { NextResponse } from "next/server";
import { getTestDocumentsMeta } from "@/lib/storage";

// Public — every logged-in student's dashboard reads this to know which
// tests have a downloadable paper, regardless of whether they attempted it.
export async function GET() {
  const documents = await getTestDocumentsMeta();
  return NextResponse.json({ documents });
}
