import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: false, error: "DATABASE_URL is not set" }, { status: 500 });
    }
    const sql = neon(process.env.DATABASE_URL);

    // ── Create tables ──────────────────────────────────────────────────────────
    await sql`CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY, username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT NOW())`;

    await sql`CREATE TABLE IF NOT EXISTS elections (
      id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT,
      start_date TIMESTAMP NOT NULL, end_date TIMESTAMP NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'draft', created_at TIMESTAMP NOT NULL DEFAULT NOW())`;

    await sql`CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY,
      election_id INTEGER NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL, max_votes INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT NOW())`;

    await sql`CREATE TABLE IF NOT EXISTS candidates (
      id SERIAL PRIMARY KEY,
      position_id INTEGER NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL, class_name VARCHAR(50),
      bio TEXT, photo_url TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW())`;

    await sql`CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY, student_id VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL, class_name VARCHAR(50),
      pin_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT NOW())`;

    await sql`CREATE TABLE IF NOT EXISTS voter_records (
      id SERIAL PRIMARY KEY,
      election_id INTEGER NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
      student_id  INTEGER NOT NULL REFERENCES students(id)  ON DELETE CASCADE,
      voted_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (election_id, student_id))`;

    await sql`CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      election_id  INTEGER NOT NULL REFERENCES elections(id)  ON DELETE CASCADE,
      position_id  INTEGER NOT NULL REFERENCES positions(id)  ON DELETE CASCADE,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW())`;

    // ── Migrate existing tables — add missing ON DELETE CASCADE constraints ────
    // voter_records.election_id
    await sql`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'voter_records_election_id_fkey'
        ) THEN
          ALTER TABLE voter_records DROP CONSTRAINT voter_records_election_id_fkey;
          ALTER TABLE voter_records ADD CONSTRAINT voter_records_election_id_fkey
            FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE;
        END IF;
      END $$`;

    // voter_records.student_id
    await sql`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'voter_records_student_id_fkey'
        ) THEN
          ALTER TABLE voter_records DROP CONSTRAINT voter_records_student_id_fkey;
          ALTER TABLE voter_records ADD CONSTRAINT voter_records_student_id_fkey
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
        END IF;
      END $$`;

    // votes.election_id
    await sql`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'votes_election_id_fkey'
        ) THEN
          ALTER TABLE votes DROP CONSTRAINT votes_election_id_fkey;
          ALTER TABLE votes ADD CONSTRAINT votes_election_id_fkey
            FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE;
        END IF;
      END $$`;

    // votes.position_id
    await sql`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'votes_position_id_fkey'
        ) THEN
          ALTER TABLE votes DROP CONSTRAINT votes_position_id_fkey;
          ALTER TABLE votes ADD CONSTRAINT votes_position_id_fkey
            FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE;
        END IF;
      END $$`;

    // votes.candidate_id
    await sql`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'votes_candidate_id_fkey'
        ) THEN
          ALTER TABLE votes DROP CONSTRAINT votes_candidate_id_fkey;
          ALTER TABLE votes ADD CONSTRAINT votes_candidate_id_fkey
            FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
        END IF;
      END $$`;

    // ── Ensure photo_url column exists on candidates ───────────────────────────
    await sql`
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS photo_url TEXT`;

    // ── Seed default admin (hash generated at runtime) ────────────────────────
    const password_hash = await bcrypt.hash("admin123", 10);
    await sql`INSERT INTO admins (username, password_hash)
      VALUES ('admin', ${password_hash})
      ON CONFLICT (username) DO UPDATE SET password_hash = ${password_hash}`;

    return NextResponse.json({
      success: true,
      message: "Database ready + migrated. Login: admin / admin123",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
