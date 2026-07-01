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

      // Migrations: add new columns to existing tables (safe to re-run)
      await sql`
        ALTER TABLE physical_registrations
          ADD COLUMN IF NOT EXISTS email TEXT;
      `;
      await sql`
        ALTER TABLE physical_registrations
          ADD COLUMN IF NOT EXISTS receipt_url TEXT;
      `;
    })();
  }
  await schemaReady;
}

export { sql };
