import { sql } from "@vercel/postgres";

// Creates the tables if they don't exist yet. Safe to call repeatedly —
// IF NOT EXISTS makes it a no-op after the first time. Cached per server
// instance so we don't re-run it on every single request.
let schemaReady: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS students (
          roll_number TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          whatsapp TEXT NOT NULL,
          city TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_students_email ON students (LOWER(email));
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_students_whatsapp ON students (whatsapp);
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS attempts (
          roll_number TEXT NOT NULL,
          test_id TEXT NOT NULL,
          status TEXT NOT NULL,
          started_at TIMESTAMPTZ,
          submitted_at TIMESTAMPTZ,
          time_taken_seconds INTEGER NOT NULL DEFAULT 0,
          answers JSONB NOT NULL DEFAULT '[]'::jsonb,
          score INTEGER NOT NULL DEFAULT 0,
          correct INTEGER NOT NULL DEFAULT 0,
          wrong INTEGER NOT NULL DEFAULT 0,
          unattempted INTEGER NOT NULL DEFAULT 0,
          percentage NUMERIC NOT NULL DEFAULT 0,
          auto_submit_reason TEXT,
          PRIMARY KEY (roll_number, test_id)
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS test_questions (
          test_number INTEGER PRIMARY KEY,
          questions JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS physical_registrations (
          id SERIAL PRIMARY KEY,
          test_id TEXT NOT NULL,
          name TEXT NOT NULL,
          roll_number TEXT,
          whatsapp TEXT NOT NULL,
          email TEXT,
          city TEXT NOT NULL,
          out_of_city BOOLEAN NOT NULL DEFAULT false,
          payment_method TEXT NOT NULL,
          receipt_url TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;

      // Test papers (question paper / answer key PDFs) uploaded by the admin
      // after a test is conducted. Stored as base64 text, same approach as
      // physical_registrations.receipt_url — no external file storage needed.
      await sql`
        CREATE TABLE IF NOT EXISTS test_documents (
          test_number INTEGER PRIMARY KEY,
          label TEXT NOT NULL,
          file_name TEXT NOT NULL,
          pdf_base64 TEXT NOT NULL,
          uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;

      // Stores the admin panel password (hashed) once it's been changed
      // from the admin panel Settings tab. If no row exists yet, only the
      // ADMIN_PASSWORD env var (recovery key) works for login.
      await sql`
        CREATE TABLE IF NOT EXISTS admin_settings (
          id INTEGER PRIMARY KEY DEFAULT 1,
          password_hash TEXT,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT admin_settings_singleton CHECK (id = 1)
        );
      `;

      // Migrations: add new columns to existing tables (safe to re-run)
      await sql`
        ALTER TABLE physical_registrations
          ADD COLUMN IF NOT EXISTS email TEXT;
      `;
      await sql`
        ALTER TABLE physical_registrations
          ADD COLUMN IF NOT EXISTS receipt_url TEXT;
      `;
      // Whether the student chose to attempt the test online-only or come
      // to the venue in person (+ online access). Existing rows created
      // before this feature existed default to 'physical_plus_online'
      // since that was the only option available at the time.
      await sql`
        ALTER TABLE physical_registrations
          ADD COLUMN IF NOT EXISTS attendance_mode TEXT NOT NULL DEFAULT 'physical_plus_online';
      `;

      // Password support for student logins. Nullable because students who
      // enrolled before this feature existed won't have one yet — they set
      // it once via the "Set / Recover Password" flow (roll number + the
      // email or WhatsApp number already on file), no re-enrollment needed.
      await sql`
        ALTER TABLE students
          ADD COLUMN IF NOT EXISTS password_hash TEXT;
      `;
    })();
  }
  await schemaReady;
}

export { sql };
