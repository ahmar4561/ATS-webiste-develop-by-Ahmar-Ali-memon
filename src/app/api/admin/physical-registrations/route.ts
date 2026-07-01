import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  getPhysicalRegistrations,
  updatePhysicalRegistrationStatus,
  updatePhysicalRegistrationFields,
  deletePhysicalRegistration,
  getPhysicalRegistrationById,
} from "@/lib/storage";

async function sendEmail(to: string, subject: string, html: string) {
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

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testId = request.nextUrl.searchParams.get("testId") ?? undefined;
  const registrations = await getPhysicalRegistrations(testId);
  return NextResponse.json({ registrations });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Editing details (name, roll number, WhatsApp, email, city) — e.g. to
    // fix a spelling mistake. Handled separately from status changes so
    // editing never accidentally triggers a status-change email.
    if (fields) {
      const updated = await updatePhysicalRegistrationFields(id, {
        name: typeof fields.name === "string" ? fields.name.trim() : undefined,
        rollNumber:
          typeof fields.rollNumber === "string" ? fields.rollNumber.trim() || null : undefined,
        whatsapp:
          typeof fields.whatsapp === "string"
            ? fields.whatsapp.replace(/[^0-9]/g, "")
            : undefined,
        email: typeof fields.email === "string" ? fields.email.trim() || null : undefined,
        city: typeof fields.city === "string" ? fields.city.trim() : undefined,
      });
      if (!updated) {
        return NextResponse.json({ error: "Registration not found" }, { status: 404 });
      }
      return NextResponse.json({ registration: updated });
    }

    if (!["pending", "confirmed", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Fetch registration before updating (to get email, name, etc.)
    const reg = await getPhysicalRegistrationById(id);
    if (!reg) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const wasAlreadyConfirmed = reg.status === "confirmed";

    const updated = await updatePhysicalRegistrationStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Send confirmation email only the FIRST time a registration becomes confirmed
    // (prevents duplicate emails if the same registration is confirmed more than once)
    if (status === "confirmed" && !wasAlreadyConfirmed && reg.email) {
      await sendEmail(
        reg.email,
        "ATS Mega Physical Test — Registration CONFIRMED ✅",
        `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;">
          <div style="background:#0f172a;border-radius:12px;padding:24px 28px;margin-bottom:24px;text-align:center;">
            <h1 style="color:#f59e0b;font-size:20px;margin:0 0 4px;">ATS — Ale's Testing Service</h1>
            <p style="color:#94a3b8;font-size:13px;margin:0;">Mega Physical Mock Test 2026</p>
          </div>
          <div style="background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:16px 20px;margin-bottom:24px;text-align:center;">
            <p style="color:#15803d;font-size:18px;font-weight:700;margin:0;">🎉 Your Registration is CONFIRMED!</p>
          </div>
          <p style="color:#475569;">Dear <strong>${reg.name}</strong>,</p>
          <p style="color:#475569;">
            Congratulations! Your registration for the <strong>ATS Mega Physical Mock Test</strong> 
            has been <strong>confirmed</strong>. Your seat is secured for <strong>26 July 2026</strong>.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;font-weight:600;">Your Registration Details</p>
            <p style="margin:4px 0;color:#1e293b;"><strong>Name:</strong> ${reg.name}</p>
            ${reg.rollNumber ? `<p style="margin:4px 0;color:#1e293b;"><strong>Roll No.:</strong> ${reg.rollNumber}</p>` : ""}
            <p style="margin:4px 0;color:#1e293b;"><strong>WhatsApp:</strong> ${reg.whatsapp}</p>
            <p style="margin:4px 0;color:#1e293b;"><strong>City:</strong> ${reg.city}</p>
            <p style="margin:4px 0;color:#1e293b;"><strong>Test Date:</strong> Sunday, 26 July 2026</p>
            <p style="margin:4px 0;color:#1e293b;"><strong>Venue:</strong> <span style="color:#d97706;">To be announced on WhatsApp group</span></p>
            <p style="margin:4px 0;color:#1e293b;"><strong>Status:</strong> <span style="color:#16a34a;font-weight:700;">CONFIRMED ✅</span></p>
          </div>
          <p style="color:#475569;">
            Please <strong>join our WhatsApp group</strong> to receive the venue announcement 
            and any further instructions before the test day.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="https://chat.whatsapp.com/IsXPutl4YQKArWe92sXchL" 
               style="background:#25d366;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
              Join WhatsApp Group
            </a>
          </div>
          <p style="color:#475569;">Best of luck for your MDCAT preparation! 📚</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
          <p style="color:#94a3b8;font-size:12px;text-align:center;">
            ATS — Ale's Testing Service &bull; MDCAT Mock Series 2026
          </p>
        </div>
        `
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const deleted = await deletePhysicalRegistration(id);
    if (!deleted) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
