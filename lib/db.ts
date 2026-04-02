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

export async function getActiveElections() {
  return sql`SELECT * FROM elections WHERE status = 'active' ORDER BY start_date`;
}

export async function createElection(data: {
  title: string; description: string; start_date: string; end_date: string;
}) {
  const rows = await sql`
    INSERT INTO elections (title, description, start_date, end_date, status)
    VALUES (${data.title}, ${data.description}, ${data.start_date}, ${data.end_date}, 'draft')
    RETURNING *
  `;
  return rows[0];
}

export async function updateElectionStatus(id: number, status: string) {
  const rows = await sql`UPDATE elections SET status = ${status} WHERE id = ${id} RETURNING *`;
  return rows[0];
}

export async function deleteElection(id: number) {
  await sql`DELETE FROM elections WHERE id = ${id}`;
}

// ── Positions ─────────────────────────────────────────────────────────────────

export async function getPositionsByElection(electionId: number) {
  return sql`
    SELECT p.*, COUNT(c.id)::int AS candidate_count
    FROM positions p
    LEFT JOIN candidates c ON c.position_id = p.id
    WHERE p.election_id = ${electionId}
    GROUP BY p.id
    ORDER BY p.id
  `;
}

export async function createPosition(data: { election_id: number; title: string; max_votes: number }) {
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
  return sql`SELECT * FROM candidates WHERE position_id = ${positionId} ORDER BY name`;
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

export async function createCandidate(data: { position_id: number; name: string; class_name: string; bio: string }) {
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

export async function getStudentByStudentId(studentId: string) {
  const rows = await sql`SELECT * FROM students WHERE student_id = ${studentId}`;
  return rows[0] ?? null;
}

export async function createStudent(data: { student_id: string; name: string; class_name: string; pin_hash: string }) {
  const rows = await sql`
    INSERT INTO students (student_id, name, class_name, pin_hash)
    VALUES (${data.student_id}, ${data.name}, ${data.class_name}, ${data.pin_hash})
    RETURNING id, student_id, name, class_name, created_at
  `;
  return rows[0];
}

export async function upsertStudent(data: { student_id: string; name: string; class_name: string; pin_hash: string }) {
  const rows = await sql`
    INSERT INTO students (student_id, name, class_name, pin_hash)
    VALUES (${data.student_id}, ${data.name}, ${data.class_name}, ${data.pin_hash})
    ON CONFLICT (student_id) DO UPDATE
      SET name = EXCLUDED.name, class_name = EXCLUDED.class_name, pin_hash = EXCLUDED.pin_hash
    RETURNING id, student_id, name, class_name, created_at
  `;
  return rows[0];
}

export async function deleteStudent(id: number) {
  await sql`DELETE FROM students WHERE id = ${id}`;
}

// ── Voting ────────────────────────────────────────────────────────────────────

export async function hasStudentVoted(electionId: number, studentId: number) {
  const rows = await sql`
    SELECT 1 FROM voter_records WHERE election_id = ${electionId} AND student_id = ${studentId}
  `;
  return rows.length > 0;
}

export async function castVotes(
  electionId: number,
  studentId: number,
  selections: { position_id: number; candidate_id: number }[]
) {
  await sql`INSERT INTO voter_records (election_id, student_id) VALUES (${electionId}, ${studentId})`;
  for (const sel of selections) {
    await sql`INSERT INTO votes (election_id, position_id, candidate_id) VALUES (${electionId}, ${sel.position_id}, ${sel.candidate_id})`;
  }
}

// ── Results ───────────────────────────────────────────────────────────────────

export async function getElectionResults(electionId: number) {
  const [voterRow] = await sql`SELECT COUNT(*)::int AS total_voted FROM voter_records WHERE election_id = ${electionId}`;
  const [studentRow] = await sql`SELECT COUNT(*)::int AS total_students FROM students`;

  const rows = await sql`
    SELECT
      p.id AS position_id, p.title AS position_title, p.max_votes,
      c.id AS candidate_id, c.name AS candidate_name, c.class_name, c.bio,
      COUNT(v.id)::int AS vote_count
    FROM positions p
    JOIN candidates c ON c.position_id = p.id
    LEFT JOIN votes v ON v.candidate_id = c.id AND v.election_id = ${electionId}
    WHERE p.election_id = ${electionId}
    GROUP BY p.id, p.title, p.max_votes, c.id, c.name, c.class_name, c.bio
    ORDER BY p.id, vote_count DESC, c.name
  `;

  const positions: Record<number, any> = {};
  for (const row of rows) {
    if (!positions[row.position_id]) {
      positions[row.position_id] = { id: row.position_id, title: row.position_title, max_votes: row.max_votes, candidates: [] };
    }
    positions[row.position_id].candidates.push({
      id: row.candidate_id, name: row.candidate_name,
      class_name: row.class_name, bio: row.bio, vote_count: row.vote_count,
    });
  }

  return {
    total_voted: voterRow.total_voted as number,
    total_students: studentRow.total_students as number,
    positions: Object.values(positions),
  };
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

// ── Admin auth ────────────────────────────────────────────────────────────────

export async function getAdminByUsername(username: string) {
  const rows = await sql`SELECT * FROM admins WHERE username = ${username}`;
  return rows[0] ?? null;
}
