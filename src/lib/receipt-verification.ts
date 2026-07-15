/**
 * Verifies that an uploaded "payment receipt" image actually looks like a
 * payment receipt/transaction screenshot (bank transfer, Easypaisa,
 * JazzCash, etc.) before a physical-test registration is accepted. Without
 * this, students could upload any random photo and the registration would
 * still go through.
 *
 * Uses Google's Gemini API (free tier, no credit card required) with a
 * vision-capable model. Set GEMINI_API_KEY in your environment variables
 * (Vercel project settings) for this to work — get a free key from
 * https://aistudio.google.com/apikey. If the key isn't set, verification is
 * skipped (fails open) so a missing/misconfigured key doesn't block every
 * registration -- the admin should still manually review receipts in that
 * case.
 */

const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const GEMINI_MODEL = "gemini-2.0-flash";

export interface ReceiptVerificationResult {
  /** true = looks like a real payment receipt, false = doesn't, null = check was skipped */
  isReceipt: boolean | null;
  reason: string;
}

export async function verifyReceiptImage(
  base64: string,
  mime: string
): Promise<ReceiptVerificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set — skipping receipt verification.");
    return { isReceipt: null, reason: "Verification skipped (not configured)." };
  }

  const mediaType = SUPPORTED_MIME_TYPES.has(mime) ? mime : "image/jpeg";

  const prompt =
    "This image was uploaded as proof of payment for a test registration " +
    "fee, claimed to be a screenshot of a bank transfer, Easypaisa, or " +
    "JazzCash transaction receipt. Look at the image and decide whether it " +
    "genuinely is a payment/transaction receipt or confirmation screen " +
    "(showing things like an amount, a transaction/reference ID, an " +
    "account name or number, a date/time, or a 'payment successful' style " +
    "confirmation) — as opposed to an unrelated photo, a blank/random " +
    "image, a screenshot of something else, or any other image that is " +
    "not a payment receipt. Respond with ONLY a JSON object, no other " +
    'text, no markdown fences, in exactly this shape: {"isReceipt": true ' +
    'or false, "reason": "short explanation"}.';

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mediaType,
                    data: base64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 200,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Receipt verification API call failed:", res.status, errText);
      return { isReceipt: null, reason: "Verification service error." };
    }

    const data = await res.json();
    const raw = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
    const cleaned = raw.replace(/^```json\s*|```$/g, "").trim();

    const parsed = JSON.parse(cleaned) as { isReceipt: boolean; reason: string };
    return { isReceipt: Boolean(parsed.isReceipt), reason: parsed.reason ?? "" };
  } catch (err) {
    console.error("Receipt verification error:", err);
    // Fail open: don't block a legitimate registration just because the
    // verification call itself broke (network blip, bad JSON, etc.) — the
    // admin still reviews every receipt manually before confirming a seat.
    return { isReceipt: null, reason: "Verification could not be completed." };
  }
}
