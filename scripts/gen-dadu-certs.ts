import { buildCertificateSvg, CertificateData } from "../src/lib/certificate";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const TEST_TITLE = "ATS Mega Test — District Dadu";
const TEST_DATE = "2026-07-26";
const TOTAL_MARKS = 180;

// Top 10 *positions* from the Dadu Mega Physical Test merit list, using
// DENSE ranking (matches getMeritList()'s algorithm): tied scores share
// the same rank, next distinct score continues at the very next number.
const TOP10: { rank: number; name: string; score: number }[] = [
  { rank: 1,  name: "Ahmed Ali", score: 169 },
  { rank: 2,  name: "Ayaz Ali", score: 165 },
  { rank: 2,  name: "Muhammad Ismail", score: 165 },
  { rank: 3,  name: "Muhammad Ali", score: 164 },
  { rank: 3,  name: "Muzamil Ali", score: 164 },
  { rank: 4,  name: "Aftab Ali", score: 163 },
  { rank: 5,  name: "Yasir Ali", score: 162 },
  { rank: 5,  name: "Yasir Jamali", score: 162 },
  { rank: 6,  name: "Areej", score: 161 },
  { rank: 6,  name: "Aisha", score: 161 },
  { rank: 6,  name: "Ajwa Jamali", score: 161 },
  { rank: 6,  name: "Shoaib Ali", score: 161 },
  { rank: 7,  name: "Rehan Ali", score: 159 },
  { rank: 8,  name: "Faiza Lashari", score: 155 },
  { rank: 9,  name: "Sajid Ali", score: 152 },
  { rank: 10, name: "Abdul Hanan", score: 149 },
  { rank: 10, name: "Mahnoor", score: 149 },
];

async function main() {
  const outDir = path.join(__dirname, "..", "certs-output");
  fs.mkdirSync(outDir, { recursive: true });

  const logoPath = path.join(__dirname, "..", "public", "ats-logo-chip.png");
  const logoBase64 = fs.readFileSync(logoPath).toString("base64");
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  for (const entry of TOP10) {
    const data: CertificateData = {
      studentName: entry.name,
      rollNumber: "",
      testTitle: TEST_TITLE,
      rank: entry.rank,
      score: entry.score,
      percentage: (entry.score / TOTAL_MARKS) * 100,
      testDate: TEST_DATE,
    };

    const svg = buildCertificateSvg(data, logoDataUri);
    const safeName = entry.name.replace(/[^a-zA-Z0-9]+/g, "-");
    const fileBase = `${String(entry.rank).padStart(2, "0")}-${safeName}`;

    fs.writeFileSync(path.join(outDir, `${fileBase}.svg`), svg);

    await sharp(Buffer.from(svg), { density: 220 })
      .png()
      .toFile(path.join(outDir, `${fileBase}.png`));

    console.log(`Generated: ${fileBase}.png`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
