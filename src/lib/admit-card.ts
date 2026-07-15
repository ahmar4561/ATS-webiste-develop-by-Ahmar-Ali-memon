import { PLATFORM } from "@/lib/constants";

export interface AdmitCardData {
  studentName: string;
  rollNumber: string;
  whatsapp: string;
  email: string | null;
  city: string;
  testTitle: string;
  testDateLabel: string; // already formatted, e.g. "Sunday, 26 July 2026"
  registrationId: number;
  venue?: string; // optional, shown if confirmed venue text is available
}

export const ADMIT_CARD_WIDTH = 1050;
export const ADMIT_CARD_HEIGHT = 650;

const esc = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** First letters of the first two words of a name, for the avatar circle. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Decorative barcode-like strip of random-ish bars, seeded from an id so it's stable. */
function barcodeBars(seed: number, count: number): string {
  let bars = "";
  let x = 0;
  for (let i = 0; i < count; i++) {
    // simple deterministic pseudo-random width based on seed + index
    const v = Math.abs(Math.sin(seed * 12.9898 + i * 78.233)) * 43758.5453;
    const frac = v - Math.floor(v);
    const w = 2 + frac * 5;
    if (i % 2 === 0) {
      bars += `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="46" fill="#0F1D40"/>`;
    }
    x += w;
  }
  return bars;
}

/**
 * Builds a printable Admit Card / Test Pass as a single self-contained SVG
 * string, in the same style/pipeline as buildCertificateSvg: rendered into
 * an offscreen canvas and exported as PNG for reliable, dependency-free
 * "Download ID Card" support in every browser.
 */
export function buildAdmitCardSvg(
  {
    studentName,
    rollNumber,
    whatsapp,
    email,
    city,
    testTitle,
    testDateLabel,
    registrationId,
    venue,
  }: AdmitCardData,
  logoDataUri: string | null
): string {
  const W = ADMIT_CARD_WIDTH;
  const H = ADMIT_CARD_HEIGHT;
  const cardId = `ATS-ADM-${String(registrationId).padStart(5, "0")}`;
  const inits = initials(studentName);

  const logoImg = logoDataUri
    ? `<image href="${logoDataUri}" x="26" y="18" width="52" height="38" preserveAspectRatio="xMidYMid meet"/>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="hdr" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0F1D40"/>
      <stop offset="100%" stop-color="#14245A"/>
    </linearGradient>
  </defs>

  <!-- Card background -->
  <rect x="0" y="0" width="${W}" height="${H}" rx="22" fill="#FFFFFF"/>
  <rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="18" fill="none" stroke="#E2E8F0" stroke-width="2"/>

  <!-- Header bar -->
  <path d="M0,0 H${W} V96 Q${W / 2},128 0,96 Z" fill="url(#hdr)"/>
  ${logoImg}
  <text x="${logoDataUri ? 96 : 34}" y="42" font-family="Georgia,'Times New Roman',serif" font-size="21" font-weight="bold" fill="#FFFFFF" letter-spacing="0.5">${esc(PLATFORM.fullName)}</text>
  <text x="${logoDataUri ? 96 : 34}" y="64" font-family="Arial,sans-serif" font-size="12.5" fill="#C9962C" letter-spacing="0.5">${esc(PLATFORM.series)}</text>
  <text x="${W - 34}" y="42" text-anchor="end" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="#C9962C" letter-spacing="2">ADMIT CARD</text>
  <text x="${W - 34}" y="64" text-anchor="end" font-family="Arial,sans-serif" font-size="12" fill="#94A3B8">ID: ${cardId}</text>

  <!-- Status ribbon -->
  <g transform="translate(${W - 168},108)">
    <rect x="0" y="0" width="140" height="26" rx="13" fill="#DCFCE7" stroke="#86EFAC"/>
    <text x="70" y="18" text-anchor="middle" font-family="Arial,sans-serif" font-size="12.5" font-weight="700" fill="#15803D">CONFIRMED ✓</text>
  </g>

  <!-- Avatar -->
  <g transform="translate(70,${96 + 30})">
    <circle cx="60" cy="70" r="62" fill="#F8FAFC" stroke="#C9962C" stroke-width="3"/>
    <text x="60" y="86" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="46" font-weight="bold" fill="#14245A">${esc(inits)}</text>
  </g>

  <!-- Fields -->
  <g transform="translate(215,150)" font-family="Arial,sans-serif">
    <text x="0" y="0" font-size="12" font-weight="700" letter-spacing="1" fill="#94A3B8">FULL NAME</text>
    <text x="0" y="26" font-size="24" font-weight="700" fill="#0F1D40">${esc(studentName)}</text>

    <text x="0" y="66" font-size="12" font-weight="700" letter-spacing="1" fill="#94A3B8">ROLL NUMBER</text>
    <text x="0" y="90" font-size="19" font-weight="700" fill="#0F1D40">${esc(rollNumber)}</text>

    <text x="330" y="66" font-size="12" font-weight="700" letter-spacing="1" fill="#94A3B8">CITY</text>
    <text x="330" y="90" font-size="19" font-weight="700" fill="#0F1D40">${esc(city)}</text>

    <text x="0" y="130" font-size="12" font-weight="700" letter-spacing="1" fill="#94A3B8">WHATSAPP NUMBER</text>
    <text x="0" y="154" font-size="19" font-weight="700" fill="#0F1D40">${esc(whatsapp)}</text>

    <text x="330" y="130" font-size="12" font-weight="700" letter-spacing="1" fill="#94A3B8">EMAIL</text>
    <text x="330" y="154" font-size="16" font-weight="600" fill="#0F1D40">${esc(email || "—")}</text>
  </g>

  <!-- Divider -->
  <line x1="70" y1="336" x2="${W - 70}" y2="336" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="6 6"/>

  <!-- Test details -->
  <g transform="translate(70,370)" font-family="Arial,sans-serif">
    <text x="0" y="0" font-size="12" font-weight="700" letter-spacing="1" fill="#94A3B8">TEST</text>
    <text x="0" y="26" font-size="21" font-weight="700" fill="#0B6B3A">${esc(testTitle)}</text>

    <text x="0" y="66" font-size="12" font-weight="700" letter-spacing="1" fill="#94A3B8">TEST DATE</text>
    <text x="0" y="90" font-size="18" font-weight="700" fill="#0F1D40">${esc(testDateLabel)}</text>

    <text x="480" y="66" font-size="12" font-weight="700" letter-spacing="1" fill="#94A3B8">VENUE</text>
    <text x="480" y="90" font-size="16" font-weight="600" fill="#0F1D40">${esc(venue && venue.trim() ? venue : "Announced on WhatsApp group")}</text>
  </g>

  <!-- Instructions box -->
  <g transform="translate(70,486)">
    <rect x="0" y="0" width="${W - 140}" height="72" rx="10" fill="#FFFBEB" stroke="#FDE68A"/>
    <text x="18" y="24" font-family="Arial,sans-serif" font-size="12.5" font-weight="700" fill="#92400E">INSTRUCTIONS</text>
    <text x="18" y="44" font-family="Arial,sans-serif" font-size="12.5" fill="#78350F">Bring a printed hard copy of this Admit Card to the test venue — entry will be given only with this card.</text>
    <text x="18" y="62" font-family="Arial,sans-serif" font-size="12.5" fill="#78350F">Arrive at least 30 minutes before the reporting time. No entry without this card.</text>
  </g>

  <!-- Barcode footer -->
  <g transform="translate(70,${H - 60})">
    ${barcodeBars(registrationId || 1, 90)}
  </g>
  <text x="${W - 70}" y="${H - 18}" text-anchor="end" font-family="Arial,sans-serif" font-size="11" fill="#94A3B8">${esc(PLATFORM.fullName)} &#8226; ${esc(PLATFORM.tagline)}</text>
</svg>`;
}

/** Fetches a same-origin image and converts it to a base64 data URI. */
export async function toDataUriLocal(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Renders the admit card to a PNG data URL by drawing the SVG into an
 * offscreen canvas, mirroring renderCertificatePng so downloads work
 * reliably across browsers.
 */
export function renderAdmitCardPng(
  data: AdmitCardData,
  logoDataUri: string | null,
  scale = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const svg = buildAdmitCardSvg(data, logoDataUri);
    const canvas = document.createElement("canvas");
    canvas.width = ADMIT_CARD_WIDTH * scale;
    canvas.height = ADMIT_CARD_HEIGHT * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas not supported"));
      return;
    }

    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error("Admit card render timed out"));
    }, 12000);

    img.onload = () => {
      clearTimeout(timeout);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      reject(new Error("Admit card image failed to load"));
    };

    img.src = url;
  });
}
