import { NextRequest, NextResponse } from "next/server";
import { createStudent, findDuplicateStudent } from "@/lib/storage";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WHATSAPP_REGEX = /^03[0-9]{9}$/;

function isFakeNumber(digits: string): boolean {
  // all digits identical (e.g. 03333333333)
  if (/^(\d)\1+$/.test(digits)) return true;
  // strictly ascending or descending digits (e.g. 01234567891)
  let ascending = true;
  let descending = true;
  for (let i = 1; i < digits.length; i++) {
    const diff = digits.charCodeAt(i) - digits.charCodeAt(i - 1);
    if (diff !== 1) ascending = false;
    if (diff !== -1) descending = false;
  }
  return ascending || descending;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, whatsapp, city } = body;

    const errors: Record<string, string> = {};

    if (!name?.trim()) {
      errors.name = "Full name is required.";
    }

    if (!email?.trim()) {
      errors.email = "Email address is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    const whatsappDigits = (whatsapp ?? "").replace(/[^0-9]/g, "");
    if (!whatsapp?.trim()) {
      errors.whatsapp = "WhatsApp number is required.";
    } else if (!WHATSAPP_REGEX.test(whatsappDigits) || isFakeNumber(whatsappDigits)) {
      errors.whatsapp =
        "Enter a valid WhatsApp number (e.g. 03001234567).";
    }

    if (!city?.trim()) {
      errors.city = "City is required.";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Please fix the errors below.", fieldErrors: errors },
        { status: 400 }
      );
    }

    // Block re-enrollment by the same person under the same or slightly
    // different details. Matches on email, WhatsApp number, or name+city,
    // any one of which is enough to flag it as a duplicate. The existing
    // roll number is returned so the student can recover it instead of
    // trying to sign up again.
    const duplicate = await findDuplicateStudent({
      name: name.trim(),
      email: email.trim(),
      whatsapp: whatsappDigits,
      city: city.trim(),
    });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "You're already enrolled. Use your existing Roll Number to log in — re-enrollment is not allowed.",
          duplicate: true,
          existingRollNumber: duplicate.rollNumber,
        },
        { status: 409 }
      );
    }

    const student = await createStudent({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: whatsappDigits,
      city: city.trim(),
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Enrollment failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
