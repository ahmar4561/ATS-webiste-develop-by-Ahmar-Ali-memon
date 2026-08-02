import { PLATFORM } from "@/lib/constants";

export interface CertificateData {
  studentName: string;
  rollNumber: string;
  testTitle: string;
  rank: number;
  score: number;
  percentage: number;
  /** The test's actual scheduled date, e.g. "2026-07-05". Shown as the
   *  certificate's Issue Date so it always matches the real test day
   *  instead of a fixed placeholder. */
  testDate: string;
}

/** Formats an ISO "YYYY-MM-DD" date as "5 July 2026" for the certificate. */
function formatIssueDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const CERT_WIDTH = 1500;
export const CERT_HEIGHT = 1061;

function rankLabel(rank: number): string {
  if (rank === 1) return "1st Place";
  if (rank === 2) return "2nd Place";
  if (rank === 3) return "3rd Place";
  return `${rank}th Place`;
}

const esc = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Laurel branch made of leaf ellipses along a stem, used both as the
 * vertical badge wreath and the horizontal bottom-of-certificate sprig.
 */
function laurelBranch(
  pts: { x: number; y: number; a: number; s: number }[]
): string {
  const stemD = `M0,0 ${pts.map((p) => `L${p.x},${p.y}`).join(" ")}`;
  const leaves = pts
    .map(
      (p) =>
        `<ellipse cx="${p.x}" cy="${p.y}" rx="${13 * p.s}" ry="${6 * p.s}" fill="#C9962C" transform="rotate(${p.a} ${p.x} ${p.y})"/>`
    )
    .join("");
  return `<path d="${stemD}" stroke="#C9962C" stroke-width="2" fill="none"/>${leaves}`;
}

const LAUREL_VERT_PTS = [
  { x: 8, y: -4, a: 100, s: 1.0 },
  { x: 2, y: -26, a: 92, s: 0.95 },
  { x: -4, y: -48, a: 82, s: 0.9 },
  { x: -7, y: -70, a: 70, s: 0.82 },
  { x: -6, y: -92, a: 58, s: 0.74 },
  { x: -1, y: -112, a: 44, s: 0.65 },
  { x: 8, y: -128, a: 28, s: 0.55 },
];

const LAUREL_HORIZ_PTS = [
  { x: -10, y: -2, a: -8, s: 1.0 },
  { x: -30, y: -7, a: -16, s: 0.9 },
  { x: -50, y: -14, a: -25, s: 0.8 },
  { x: -68, y: -23, a: -34, s: 0.7 },
  { x: -83, y: -34, a: -42, s: 0.6 },
  { x: -95, y: -47, a: -50, s: 0.5 },
];

function laurelBranchVert(): string {
  return laurelBranch(LAUREL_VERT_PTS);
}

function laurelBranchHoriz(): string {
  return laurelBranch(LAUREL_HORIZ_PTS);
}

/** Diagonal corner-ribbon stripe pattern (gold/navy bars). */
function cornerStripes(n: number): string {
  return Array.from({ length: n })
    .map(
      (_, i) =>
        `<rect x="${i * 22 - 110}" y="-50" width="11" height="400" fill="${
          i % 2 === 0 ? "#D4AF37" : "#0F1D40"
        }" transform="rotate(45 ${i * 22 - 110 + 5} 150)"/>`
    )
    .join("");
}

/** Jagged 24-point seal/medal outline points. */
function sealPoints(cx: number, cy: number): string {
  return Array.from({ length: 24 })
    .map((_, i) => {
      const a = (i / 24) * Math.PI * 2;
      const r = i % 2 === 0 ? 95 : 84;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    })
    .join(" ");
}

/**
 * A 5-point star polygon (drawn as actual SVG shapes, not a text glyph),
 * so it never depends on a particular system font having a star character.
 */
function star(cx: number, cy: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.42;
    points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return `<polygon points="${points.join(" ")}"/>`;
}

/**
 * Builds the certificate as a single, self-contained SVG string (no HTML,
 * no foreignObject). This renders identically and reliably across every
 * browser when drawn into an <img>/<canvas>, which is what actually lets
 * the "Download Certificate" PNG export work. The ATS logo is embedded as
 * a base64 data URI (passed in) so the canvas export is never blocked by
 * a cross-origin/tainted-canvas restriction.
 *
 * Shared by the student-facing certificate modal AND the admin panel's
 * bulk Top 10 download -- both must produce byte-identical certificates.
 */
export function buildCertificateSvg(
  { studentName, testTitle, rank, score, percentage, testDate }: CertificateData,
  logoDataUri: string | null
): string {
  const certId = `ATS-MT1-2026-${String(rank).padStart(4, "0")}`;
  const rLabel = rankLabel(rank);
  const pct = percentage.toFixed(1);

  const logoImg = logoDataUri
    ? `<image href="${logoDataUri}" x="${750 - 70}" y="42" width="140" height="101" preserveAspectRatio="xMidYMid meet"/>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CERT_WIDTH}" height="${CERT_HEIGHT}" viewBox="0 0 ${CERT_WIDTH} ${CERT_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="60%" stop-color="#FBF8F1"/>
      <stop offset="100%" stop-color="#F6F1E6"/>
    </linearGradient>
    <clipPath id="cltl"><polygon points="0,0 220,0 0,220"/></clipPath>
    <clipPath id="clbr"><polygon points="${CERT_WIDTH},${CERT_HEIGHT} ${CERT_WIDTH - 220},${CERT_HEIGHT} ${CERT_WIDTH},${CERT_HEIGHT - 220}"/></clipPath>
  </defs>

  <rect width="${CERT_WIDTH}" height="${CERT_HEIGHT}" fill="url(#bg)"/>

  <!-- Corner ribbons -->
  <g clip-path="url(#cltl)"><rect width="220" height="220" fill="#0F1D40"/>${cornerStripes(14)}</g>
  <g clip-path="url(#clbr)"><rect width="${CERT_WIDTH}" height="${CERT_HEIGHT}" fill="#0F1D40"/>
    <g transform="translate(${CERT_WIDTH - 220},${CERT_HEIGHT - 220})">${cornerStripes(14)}</g>
  </g>

  <!-- Borders -->
  <rect x="26" y="26" width="${CERT_WIDTH - 52}" height="${CERT_HEIGHT - 52}" fill="none" stroke="#C9962C" stroke-width="2.5"/>
  <rect x="38" y="38" width="${CERT_WIDTH - 76}" height="${CERT_HEIGHT - 76}" fill="none" stroke="#14245A" stroke-width="1.2"/>

  <!-- Corner brackets -->
  <g stroke="#C9962C" stroke-width="2" fill="none">
    <path d="M32 60 V32 H60"/><circle cx="32" cy="32" r="4" fill="#C9962C" stroke="none"/>
    <path d="M${CERT_WIDTH - 32} 60 V32 H${CERT_WIDTH - 60}"/><circle cx="${CERT_WIDTH - 32}" cy="32" r="4" fill="#C9962C" stroke="none"/>
    <path d="M32 ${CERT_HEIGHT - 60} V${CERT_HEIGHT - 32} H60"/><circle cx="32" cy="${CERT_HEIGHT - 32}" r="4" fill="#C9962C" stroke="none"/>
    <path d="M${CERT_WIDTH - 32} ${CERT_HEIGHT - 60} V${CERT_HEIGHT - 32} H${CERT_WIDTH - 60}"/><circle cx="${CERT_WIDTH - 32}" cy="${CERT_HEIGHT - 32}" r="4" fill="#C9962C" stroke="none"/>
  </g>

  <!-- Certificate ID + stars top right -->
  <text x="${CERT_WIDTH - 96}" y="78" text-anchor="end" font-family="Arial,sans-serif" font-size="16" font-weight="600" fill="#14245A">Certificate ID: ${certId}</text>
  <g fill="#C9962C">${star(CERT_WIDTH - 130, 100, 7)}${star(CERT_WIDTH - 112, 100, 7)}${star(CERT_WIDTH - 94, 100, 7)}</g>

  <!-- Logo + brand -->
  ${logoImg}
  <text x="750" y="178" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="27" font-weight="bold" fill="#14245A" letter-spacing="1">ALES TESTING SERVICE</text>
  <text x="750" y="202" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="600" fill="#2F8F63" letter-spacing="0.5">${esc(PLATFORM.tagline)}</text>

  <!-- Dashed divider -->
  <line x1="580" y1="233" x2="710" y2="233" stroke="#C9962C" stroke-width="1" stroke-dasharray="4 4"/>
  <rect x="745" y="229" width="8" height="8" fill="#C9962C" transform="rotate(45 749 233)"/>
  <line x1="790" y1="233" x2="920" y2="233" stroke="#C9962C" stroke-width="1" stroke-dasharray="4 4"/>

  <!-- Headings -->
  <text x="750" y="270" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-weight="bold" font-size="30" letter-spacing="7" fill="#B8860B">CERTIFICATE OF ACHIEVEMENT</text>
  <text x="750" y="330" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-weight="bold" font-size="54" fill="#0F1D40">${esc(PLATFORM.fullName)}</text>
  <g font-family="Arial,sans-serif" font-size="18" letter-spacing="2.5" font-weight="600" fill="#5B6B85">
    <rect x="478" y="375" width="6" height="6" fill="#C9962C" transform="rotate(45 481 378)"/>
    <text x="750" y="388" text-anchor="middle">${esc(PLATFORM.series).toUpperCase()}</text>
    <rect x="1016" y="375" width="6" height="6" fill="#C9962C" transform="rotate(45 1019 378)"/>
  </g>

  <!-- Laurel badge with rank -->
  <g transform="translate(665,418)">
    <g transform="translate(38,150)">${laurelBranchVert()}</g>
    <g transform="translate(132,150) scale(-1,1)">${laurelBranchVert()}</g>
    <circle cx="85" cy="78" r="42" fill="#FFFCF3" stroke="#C9962C" stroke-width="2.5"/>
    <text x="85" y="91" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="34" font-weight="bold" fill="#C9962C">#${rank}</text>
  </g>

  <!-- Presented to -->
  <text x="750" y="613" text-anchor="middle" font-family="Arial,sans-serif" font-size="21" fill="#334155">This certificate is proudly presented to</text>
  <text x="750" y="672" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-weight="bold" font-size="64" fill="#0B6B3A">${esc(studentName)}</text>

  <!-- Underline with diamond -->
  <line x1="490" y1="712" x2="1010" y2="712" stroke="#C9962C" stroke-width="1"/>
  <rect x="746" y="708" width="8" height="8" fill="#C9962C" transform="rotate(45 750 712)"/>

  <!-- Rank & score -->
  <text x="750" y="754" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="#334155">for securing</text>
  <text x="750" y="794" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-weight="bold" font-size="34" fill="#0F1D40">${rLabel} &#8212; All-Pakistan Merit List</text>
  <text x="750" y="842" text-anchor="middle" font-family="Arial,sans-serif" font-size="19" fill="#334155">in ${esc(testTitle)}, scoring <tspan fill="#0B6B3A" font-weight="bold">${score} marks (${pct}%)</tspan></text>

  <!-- Left feature icons -->
  <g transform="translate(88,455)" font-family="Arial,sans-serif">
    <circle cx="25" cy="25" r="25" fill="none" stroke="#1F8A56" stroke-width="2"/>
    <g transform="translate(13,13)" stroke="#1F8A56" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <path d="m9 14 2 2 4-4"/>
    </g>
    <text x="66" y="20" font-size="14.5" font-weight="bold" fill="#14245A">COMPREHENSIVE</text>
    <text x="66" y="36" font-size="14.5" font-weight="bold" fill="#14245A">TEST ANALYSIS</text>
    <text x="66" y="54" font-size="12.5" fill="#7B889C">Detailed performance</text>
    <text x="66" y="68" font-size="12.5" fill="#7B889C">insights</text>

    <line x1="0" y1="94" x2="240" y2="94" stroke="#D8DEE8" stroke-width="1"/>

    <circle cx="25" cy="139" r="25" fill="none" stroke="#14245A" stroke-width="2"/>
    <g transform="translate(13,127)" stroke="#14245A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </g>
    <text x="66" y="134" font-size="14.5" font-weight="bold" fill="#14245A">PERFORMANCE</text>
    <text x="66" y="150" font-size="14.5" font-weight="bold" fill="#14245A">IMPROVEMENT</text>
    <text x="66" y="168" font-size="12.5" fill="#7B889C">Identify weaknesses,</text>
    <text x="66" y="182" font-size="12.5" fill="#7B889C">maximize strengths</text>

    <line x1="0" y1="208" x2="240" y2="208" stroke="#D8DEE8" stroke-width="1"/>

    <circle cx="25" cy="253" r="25" fill="none" stroke="#1F8A56" stroke-width="2"/>
    <g transform="translate(13,241)" stroke="#1F8A56" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
    </g>
    <text x="66" y="248" font-size="14.5" font-weight="bold" fill="#14245A">EXCELLENCE</text>
    <text x="66" y="264" font-size="14.5" font-weight="bold" fill="#14245A">RECOGNIZED</text>
    <text x="66" y="282" font-size="12.5" fill="#7B889C">Rewarding dedication</text>
    <text x="66" y="296" font-size="12.5" fill="#7B889C">and hard work</text>
  </g>

  <!-- Right seal badge -->
  <g transform="translate(1195,392)">
    <polygon points="${sealPoints(95, 95)}" fill="#C9962C"/>
    <circle cx="95" cy="95" r="78" fill="#0F1A3A" stroke="#C9962C" stroke-width="2"/>
    <g fill="#C9962C">
      <polygon points="95,38 98,46 107,46 100,51 102,60 95,55 88,60 90,51 83,46 92,46"/>
      <polygon points="65,48 67,54 73,54 68,58 70,64 65,60 60,64 62,58 57,54 63,54"/>
      <polygon points="125,48 127,54 133,54 128,58 130,64 125,60 120,64 122,58 117,54 123,54"/>
    </g>
    <text x="95" y="86" text-anchor="middle" font-family="Arial,sans-serif" font-size="13.5" font-weight="bold" fill="#FFFFFF" letter-spacing="0.5">COMMITTED TO</text>
    <text x="95" y="105" text-anchor="middle" font-family="Arial,sans-serif" font-size="13.5" font-weight="bold" fill="#FFFFFF" letter-spacing="0.5">EXCELLENCE IN</text>
    <text x="95" y="124" text-anchor="middle" font-family="Arial,sans-serif" font-size="13.5" font-weight="bold" fill="#FFFFFF" letter-spacing="0.5">MDCAT PREP.</text>
    <path d="M30 150 L20 225 L45 208 L60 230 L72 165 Z" fill="#C9962C"/>
    <path d="M160 150 L170 225 L145 208 L130 230 L118 165 Z" fill="#C9962C"/>
  </g>

  <!-- Signature -->
  <g transform="translate(1142,700)" text-anchor="middle">
    <text x="115" y="34" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="34" fill="#14245A">${esc(PLATFORM.founder.name)}</text>
    <line x1="0" y1="44" x2="230" y2="44" stroke="#94A3B8" stroke-width="1"/>
    <text x="115" y="68" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="#14245A">${esc(PLATFORM.founder.name)}</text>
    <text x="115" y="86" font-family="Arial,sans-serif" font-size="14" fill="#7B889C">${esc(PLATFORM.founder.title)}, ATS</text>
  </g>

  <!-- Date -->
  <g transform="translate(88,${CERT_HEIGHT - 108})">
    <g stroke="#14245A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </g>
    <text x="50" y="18" font-family="Arial,sans-serif" font-size="18" font-weight="600" fill="#14245A">${esc(formatIssueDate(testDate))}</text>
    <line x1="50" y1="26" x2="220" y2="26" stroke="#94A3B8" stroke-width="1"/>
    <text x="50" y="44" font-family="Arial,sans-serif" font-size="13.5" fill="#7B889C">Issue Date</text>
  </g>

  <!-- Bottom laurel -->
  <g transform="translate(750,${CERT_HEIGHT - 78 - 40})">
    <g transform="translate(-15,62)">${laurelBranchHoriz()}</g>
    <g transform="translate(35,62) scale(-1,1)">${laurelBranchHoriz()}</g>
    <g fill="#C9962C">
      <polygon points="10,8 13,16 22,16 15,21 17,30 10,25 3,30 5,21 -2,16 7,16"/>
      <polygon points="-25,18 -23,24 -17,24 -22,28 -20,34 -25,30 -30,34 -28,28 -33,24 -27,24"/>
      <polygon points="45,18 47,24 53,24 48,28 50,34 45,30 40,34 42,28 37,24 43,24"/>
    </g>
  </g>

  <!-- Footer bar -->
  <rect x="${750 - 270}" y="${CERT_HEIGHT - 58}" width="540" height="34" rx="4" fill="#14245A" stroke="#C9962C" stroke-width="1"/>
  <text x="750" y="${CERT_HEIGHT - 36}" text-anchor="middle" font-family="Arial,sans-serif" font-size="14.5" letter-spacing="0.3" fill="#FFFFFF">${esc(PLATFORM.fullName)} &#8226; ${esc(PLATFORM.tagline)}</text>
</svg>`;
}

/** Fetches a same-origin image and converts it to a base64 data URI. */
export async function toDataUri(path: string): Promise<string | null> {
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
 * Renders a certificate to a PNG data URL by drawing the SVG into an
 * offscreen canvas. Used by both the student certificate modal and the
 * admin bulk-download feature.
 */
export function renderCertificatePng(
  data: CertificateData,
  logoDataUri: string | null,
  scale = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const svg = buildCertificateSvg(data, logoDataUri);
    const canvas = document.createElement("canvas");
    canvas.width = CERT_WIDTH * scale;
    canvas.height = CERT_HEIGHT * scale;
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
      reject(new Error("Certificate render timed out"));
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
      reject(new Error("Certificate image failed to load"));
    };

    img.src = url;
  });
}
