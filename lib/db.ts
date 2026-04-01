import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const sql = neon(process.env.DATABASE_URL);

// ── Elections ─────────────────────────────────────────────────────────────────

export async function getElections() {
  return sql`
    SELECT
      e.*,
      COUNT(DISTINCT p.id)::int  AS position_count,
      COUNT(DISTINCT c.id)::int  AS candidate_count
    FROM elections e
    LEFT JOIN positions  p ON p.election_id = e.id
    LEFT JOIN candidates c ON c.position_id = p.id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `;
}

export async function getElectionById(id: number) {
  const rows = await sql`SELECT * FROM elections WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function createElection(data: {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
}) {
  const rows = await sql`
    INSERT INTO elections (title, description, start_date, end_date, status)
    VALUES (${data.title}, ${data.description}, ${data.start_date}, ${data.end_date}, 'draft')
    RETURNING *
  `;
  return rows[0];
}

export async function updateElectionStatus(id: number, status: string) {
  const rows = await sql`
    UPDATE elections SET status = ${status} WHERE id = ${id} RETURNING *
  `;
  return rows[0];
}

export async function deleteElection(id: number) {
  await sql`DELETE FROM elections WHERE id = ${id}`;
}

// ── Positions ─────────────────────────────────────────────────────────────────

export async function getPositionsByElection(electionId: number) {
  return sql`
    SELECT
      p.*,
      COUNT(c.id)::int AS candidate_count
    FROM positions p
    LEFT JOIN candidates c ON c.position_id = p.id
    WHERE p.election_id = ${electionId}
    GROUP BY p.id
    ORDER BY p.id
  `;
}

export async function createPosition(data: {
  election_id: number;
  title: string;
  max_votes: number;
}) {
  const rows = await sql`
    INSERT INTO positions (election_id, title, max_votes)
    VALUES (${data.election_id}, ${data.title}, ${data.max_votes})
    RETURNING *
  `;
  return rows[0];
}

export async function deletePosition(id: number) {
  await sql`DELETE FROM positions WHERE id = ${id}`;
}

// ── Candidates ────────────────────────────────────────────────────────────────

export async function getCandidatesByPosition(positionId: number) {
  return sql`
    SELECT * FROM candidates WHERE position_id = ${positionId} ORDER BY name
  `;
}

export async function getCandidatesByElection(electionId: number) {
  return sql`
    SELECT c.*, p.title AS position_title
    FROM candidates c
    JOIN positions p ON p.id = c.position_id
    WHERE p.election_id = ${electionId}
    ORDER BY p.id, c.name
  `;
}

export async function createCandidate(data: {
  position_id: number;
  name: string;
  class_name: string;
  bio: string;
}) {
  const rows = await sql`
    INSERT INTO candidates (position_id, name, class_name, bio)
    VALUES (${data.position_id}, ${data.name}, ${data.class_name}, ${data.bio})
    RETURNING *
  `;
  return rows[0];
}

export async function deleteCandidate(id: number) {
  await sql`DELETE FROM candidates WHERE id = ${id}`;
}

// ── Students ──────────────────────────────────────────────────────────────────

export async function getStudents() {
  return sql`SELECT id, student_id, name, class_name, created_at FROM students ORDER BY name`;
}

export async function getStudentCount() {
  const rows = await sql`SELECT COUNT(*)::int AS count FROM students`;
  return rows[0].count as number;
}

export async function createStudent(data: {
  student_id: string;
  name: string;
  class_name: string;
  pin_hash: string;
}) {
  const rows = await sql`
    INSERT INTO students (student_id, name, class_name, pin_hash)
    VALUES (${data.student_id}, ${data.name}, ${data.class_name}, ${data.pin_hash})
    RETURNING id, student_id, name, class_name, created_at
  `;
  return rows[0];
}

export async function deleteStudent(id: number) {
  await sql`DELETE FROM students WHERE id = ${id}`;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [elections, students, candidates, votes] = await Promise.all([
    sql`SELECT COUNT(*)::int AS count FROM elections`,
    sql`SELECT COUNT(*)::int AS count FROM students`,
    sql`SELECT COUNT(*)::int AS count FROM candidates`,
    sql`SELECT COUNT(*)::int AS count FROM voter_records`,
  ]);
  return {
    elections: elections[0].count as number,
    students:  students[0].count  as number,
    candidates: candidates[0].count as number,
    votes:     votes[0].count     as number,
  };
}
