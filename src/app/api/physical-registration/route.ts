import { NextRequest, NextResponse } from "next/server";
import {
  createPhysicalRegistration,
  findDuplicatePhysicalRegistration,
  getStudentByRoll,
  isValidRollNumberFormat,
} from "@/lib/storage";
import { getTestById } from "@/lib/constants";
import { verifyReceiptImage } from "@/lib/receipt-verification";

const WHATSAPP_REGEX = /^03[0-9]{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]*$/;
const CITY_REGEX = /^[A-Za-z][A-Za-z\s.'-]*$/;
const VALID_METHODS = ["bank", "easypaisa"];
const VALID_ATTENDANCE_MODES = ["online", "physical_plus_online"];
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024; // 5 MB

async function sendEmail(to: string, subject: string, html: string) {
  // Uses Resend API — set RESEND_API_KEY in your Vercel environment variables
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set — email not sent.");
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "ATS Registrations <onboarding@resend.dev>",
        reply_to: "alestestingservice@gmail.com",
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend email failed:", res.status, errText);
    }
  } catch (err) {
    console.error("Resend email error:", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      testId,
      name,
      rollNumber,
      whatsapp,
      email,
      city,
      outOfCity,
      attendanceMode,
      paymentMethod,
      receiptBase64,
      receiptMime,
    } = body;

    const errors: Record<string, string> = {};

    const test = getTestById(testId);
    if (!test || test.mode !== "physical") {
      return NextResponse.json({ error: "Invalid test" }, { status: 400 });
    }

    const trimmedName = (name ?? "").trim();
    if (!trimmedName) {
      errors.name = "Full name is required.";
    } else if (trimmedName.length < 3) {
      errors.name = "Full name is too short.";
    } else if (!NAME_REGEX.test(trimmedName)) {
      errors.name = "Name can only contain letters (no numbers).";
    }

    const trimmedRollNumber = (rollNumber ?? "").trim();
    if (!trimmedRollNumber) {
      errors.rollNumber = "Roll Number is required. Please enroll first to get your ATS Roll Number.";
    } else if (!isValidRollNumberFormat(trimmedRollNumber)) {
      errors.rollNumber =
        "Enter a valid ATS Roll Number in the format ATS-2026-XXXXX (the one you received after enrolling).";
    }

    const whatsappDigits = (whatsapp ?? "").replace(/[^0-9]/g, "");
    if (!whatsapp?.trim()) {
      errors.whatsapp = "WhatsApp number is required.";
    } else if (!WHATSAPP_REGEX.test(whatsappDigits)) {
      errors.whatsapp = "Enter a valid WhatsApp number (e.g. 03001234567).";
    }

    if (email?.trim() && !EMAIL_REGEX.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    const trimmedCity = (city ?? "").trim();
    if (!trimmedCity) {
      errors.city = "City is required.";
    } else if (!CITY_REGEX.test(trimmedCity)) {
      errors.city = "City can only contain letters (no numbers).";
    }

    if (!VALID_ATTENDANCE_MODES.includes(attendanceMode)) {
      errors.attendanceMode = "Please select how you want to take the test.";
    }

    if (!VALID_METHODS.includes(paymentMethod)) {
      errors.paymentMethod = "Please select a payment method.";
    }

    if (!receiptBase64) {
      errors.receipt = "Payment receipt is required. Please upload a screenshot.";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Please fix the errors below.", fieldErrors: errors },
        { status: 400 }
      );
    }

    // The roll number must belong to a student who has actually enrolled.
    // This blocks people from typing in a random/made-up roll number and
    // registering for the physical test without ever enrolling first.
    const enrolledStudent = await getStudentByRoll(trimmedRollNumber);
    if (!enrolledStudent) {
      return NextResponse.json(
        {
          error:
            "This Roll Number was not found. Please enroll first, then use the exact ATS Roll Number you received (format: ATS-2026-XXXXX) to register.",
          fieldErrors: {
            rollNumber: "Roll Number not found. Please enroll first and use your correct ATS Roll Number.",
          },
        },
        { status: 400 }
      );
    }

    // Block re-registration by the same person for the same physical test.
    // Name and city are NOT checked here — many different students can
    // share the same name and city, so only a matching roll number, email,
    // or WhatsApp number counts as "already registered".
    const duplicate = await findDuplicatePhysicalRegistration(testId, {
      name: name.trim(),
      email: (email ?? "").trim(),
      whatsapp: whatsappDigits,
      city: city.trim(),
      rollNumber: trimmedRollNumber,
    });

    if (duplicate) {
      const emailMatched =
        !!email?.trim() && duplicate.email?.toLowerCase() === email.trim().toLowerCase();
      const whatsappMatched = duplicate.whatsapp === whatsappDigits;

      let matchedOn = "roll number";
      if (emailMatched && whatsappMatched) matchedOn = "email address and mobile number";
      else if (emailMatched) matchedOn = "email address";
      else if (whatsappMatched) matchedOn = "mobile number";

      return NextResponse.json(
        {
          error: `You're already registered for this test with this ${matchedOn}. Duplicate registrations aren't allowed — contact us on WhatsApp if you need to update your details.`,
          duplicate: true,
        },
        { status: 409 }
      );
    }

    // Validate receipt size
    const receiptBytes = Buffer.from(receiptBase64, "base64").length;
    if (receiptBytes > MAX_RECEIPT_BYTES) {
      return NextResponse.json(
        { error: "Receipt image is too large. Please upload an image under 5 MB.", fieldErrors: { receipt: "File too large (max 5 MB)." } },
        { status: 400 }
      );
    }

    // Store receipt as a data URI (base64 embedded — works without external storage)
    const mime = receiptMime || "image/jpeg";

    // Verify the uploaded image actually looks like a payment receipt
    // (not a random/unrelated photo). isReceipt === false means the check
    // ran and confidently rejected it; isReceipt === null means the check
    // was skipped or failed, in which case we still accept the
    // registration and let the admin review the receipt manually.
    const verification = await verifyReceiptImage(receiptBase64, mime);
    if (verification.isReceipt === false) {
      return NextResponse.json(
        {
          error: "The uploaded image doesn't look like a payment receipt. Please upload a screenshot of your actual bank transfer / Easypaisa / JazzCash receipt.",
          fieldErrors: { receipt: verification.reason || "This doesn't look like a payment receipt." },
        },
        { status: 400 }
      );
    }

    const receiptUrl = `data:${mime};base64,${receiptBase64}`;

    const registration = await createPhysicalRegistration({
      testId,
      name: name.trim(),
      rollNumber: trimmedRollNumber,
      whatsapp: whatsappDigits,
      email: email?.trim() || null,
      city: city.trim(),
      outOfCity: Boolean(outOfCity),
      attendanceMode,
      paymentMethod,
      receiptUrl,
    });

    // Send "registration received" email if email was provided
    if (email?.trim()) {
      const methodLabels: Record<string, string> = {
        bank: "UBL Bank Transfer",
        easypaisa: "Easypaisa",
        jazzcash: "JazzCash",
      };
      await sendEmail(
        email.trim(),
        "ATS Mega Physical Test — Registration Received",
        `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;">
          <div style="background:#0f172a;border-radius:12px;padding:24px 28px;margin-bottom:24px;text-align:center;">
            <h1 style="color:#f59e0b;font-size:20px;margin:0 0 4px;">ATS — Ale's Testing Service</h1>
            <p style="color:#94a3b8;font-size:13px;margin:0;">Mega Physical Mock Test 2026</p>
          </div>
          <h2 style="color:#1e293b;font-size:18px;">Registration Received ✅</h2>
          <p style="color:#475569;">Dear <strong>${name.trim()}</strong>,</p>
          <p style="color:#475569;">
            Thank you for registering for the <strong>ATS Mega Physical Mock Test</strong> 
            scheduled for <strong>26 July 2026</strong>. We have received your registration 
            and payment receipt.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;font-weight:600;">Registration Details</p>
            <p style="margin:4px 0;color:#1e293b;"><strong>Name:</strong> ${name.trim()}</p>
            <p style="margin:4px 0;color:#1e293b;"><strong>Roll No.:</strong> ${trimmedRollNumber}</p>
            <p style="margin:4px 0;color:#1e293b;"><strong>WhatsApp:</strong> ${whatsappDigits}</p>
            <p style="margin:4px 0;color:#1e293b;"><strong>City:</strong> ${city.trim()}</p>
            <p style="margin:4px 0;color:#1e293b;"><strong>Mode:</strong> ${attendanceMode === "online" ? "Online Only (Rs. 400)" : "Physical + Online (Rs. 800)"}</p>
            <p style="margin:4px 0;color:#1e293b;"><strong>Payment Method:</strong> ${methodLabels[paymentMethod] || paymentMethod}</p>
            <p style="margin:4px 0;color:#1e293b;"><strong>Status:</strong> <span style="color:#d97706;font-weight:600;">Pending Review</span></p>
          </div>
          <p style="color:#475569;">
            Our team will review your receipt and send you a <strong>confirmation email</strong> 
            once your seat is confirmed. This usually takes <strong>within 24 hours</strong>.
          </p>
          <p style="color:#475569;">
            If you have any questions, reach out on our 
            <a href="https://chat.whatsapp.com/IsXPutl4YQKArWe92sXchL" style="color:#059669;">WhatsApp Group</a>.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
          <p style="color:#94a3b8;font-size:12px;text-align:center;">
            ATS — Ale's Testing Service &bull; MDCAT Mock Series 2026
          </p>
        </div>
        `
      );
    }

    return NextResponse.json({ registration }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
