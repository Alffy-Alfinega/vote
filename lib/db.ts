import { neon } from "@neondatabase/serverless";

let _db: ReturnType<typeof neon> | null = null;

function db() {
  if (_db) return _db;
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local or Vercel project settings.");
  }
  _db = neon(process.env.DATABASE_URL);
  return _db;
}

// Helper that always returns a plain array
async function q(strings: TemplateStringsArray, ...values: unknown[]): Promise<any[]> {
  const sql = db();
  const result = await sql(strings, ...values);
  return Array.isArray(result) ? result : [];
}

// ── Elections ─────────────────────────────────────────────────────────────────

export async function getElections() {
  return q`
    SELECT e.*,
      COUNT(DISTINCT p.id)::int AS position_count,
      COUNT(DISTINCT c.id)::int AS candidate_count
    FROM elections e
    LEFT JOIN positions  p ON p.election_id = e.id
    LEFT JOIN candidates c ON c.position_id = p.id
    GROUP BY e.id ORDER BY e.created_at DESC`;
}

export async function getElectionById(id: number) {
  const rows = await q`SELECT * FROM elections WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function getActiveElections() {
  return q`SELECT * FROM elections WHERE status = 'active' ORDER BY start_date`;
}

export async function createElection(data: { title: string; description: string; start_date: string; end_date: string }) {
  const rows = await q`
    INSERT INTO elections (title, description, start_date, end_date, status)
    VALUES (${data.title}, ${data.description}, ${data.start_date}, ${data.end_date}, 'draft')
    RETURNING *`;
  return rows[0];
}

export async function updateElectionStatus(id: number, status: string) {
  const rows = await q`UPDATE elections SET status = ${status} WHERE id = ${id} RETURNING *`;
  return rows[0];
}

export async function deleteElection(id: number) {
  await q`DELETE FROM elections WHERE id = ${id}`;
}

// ── Positions ─────────────────────────────────────────────────────────────────

export async function getPositionsByElection(electionId: number) {
  return q`
    SELECT p.*, COUNT(c.id)::int AS candidate_count
    FROM positions p LEFT JOIN candidates c ON c.position_id = p.id
    WHERE p.election_id = ${electionId}
    GROUP BY p.id ORDER BY p.id`;
}

export async function createPosition(data: { election_id: number; title: string; max_votes: number }) {
  const rows = await q`
    INSERT INTO positions (election_id, title, max_votes)
    VALUES (${data.election_id}, ${data.title}, ${data.max_votes}) RETURNING *`;
  return rows[0];
}

export async function deletePosition(id: number) {
  await q`DELETE FROM positions WHERE id = ${id}`;
}

// ── Candidates ────────────────────────────────────────────────────────────────

export async function getCandidatesByPosition(positionId: number) {
  return q`SELECT * FROM candidates WHERE position_id = ${positionId} ORDER BY name`;
}

export async function getCandidatesByElection(electionId: number) {
  return q`
    SELECT c.*, p.title AS position_title FROM candidates c
    JOIN positions p ON p.id = c.position_id
    WHERE p.election_id = ${electionId} ORDER BY p.id, c.name`;
}

export async function createCandidate(data: { position_id: number; name: string; class_name: string; bio: string }) {
  const rows = await q`
    INSERT INTO candidates (position_id, name, class_name, bio)
    VALUES (${data.position_id}, ${data.name}, ${data.class_name}, ${data.bio}) RETURNING *`;
  return rows[0];
}

export async function deleteCandidate(id: number) {
  await q`DELETE FROM candidates WHERE id = ${id}`;
}

// ── Students ──────────────────────────────────────────────────────────────────

export async function getStudents() {
  return q`SELECT id, student_id, name, class_name, created_at FROM students ORDER BY name`;
}

export async function getStudentByStudentId(studentId: string) {
  const rows = await q`SELECT * FROM students WHERE student_id = ${studentId}`;
  return rows[0] ?? null;
}

export async function createStudent(data: { student_id: string; name: string; class_name: string; pin_hash: string }) {
  const rows = await q`
    INSERT INTO students (student_id, name, class_name, pin_hash)
    VALUES (${data.student_id}, ${data.name}, ${data.class_name}, ${data.pin_hash})
    RETURNING id, student_id, name, class_name, created_at`;
  return rows[0];
}

export async function upsertStudent(data: { student_id: string; name: string; class_name: string; pin_hash: string }) {
  const rows = await q`
    INSERT INTO students (student_id, name, class_name, pin_hash)
    VALUES (${data.student_id}, ${data.name}, ${data.class_name}, ${data.pin_hash})
    ON CONFLICT (student_id) DO UPDATE
      SET name = EXCLUDED.name, class_name = EXCLUDED.class_name, pin_hash = EXCLUDED.pin_hash
    RETURNING id, student_id, name, class_name, created_at`;
  return rows[0];
}

export async function deleteStudent(id: number) {
  await q`DELETE FROM students WHERE id = ${id}`;
}

// ── Voting ────────────────────────────────────────────────────────────────────

export async function hasStudentVoted(electionId: number, studentId: number) {
  const rows = await q`
    SELECT 1 FROM voter_records WHERE election_id = ${electionId} AND student_id = ${studentId}`;
  return rows.length > 0;
}

export async function castVotes(electionId: number, studentId: number, selections: { position_id: number; candidate_id: number }[]) {
  await q`INSERT INTO voter_records (election_id, student_id) VALUES (${electionId}, ${studentId})`;
  for (const sel of selections) {
    await q`INSERT INTO votes (election_id, position_id, candidate_id) VALUES (${electionId}, ${sel.position_id}, ${sel.candidate_id})`;
  }
}

// ── Results ───────────────────────────────────────────────────────────────────

export async function getElectionResults(electionId: number) {
  const voterRows   = await q`SELECT COUNT(*)::int AS total_voted FROM voter_records WHERE election_id = ${electionId}`;
  const studentRows = await q`SELECT COUNT(*)::int AS total_students FROM students`;
  const rows = await q`
    SELECT
      p.id AS position_id, p.title AS position_title, p.max_votes,
      c.id AS candidate_id, c.name AS candidate_name, c.class_name, c.bio,
      COUNT(v.id)::int AS vote_count
    FROM positions p
    JOIN candidates c ON c.position_id = p.id
    LEFT JOIN votes v ON v.candidate_id = c.id AND v.election_id = ${electionId}
    WHERE p.election_id = ${electionId}
    GROUP BY p.id, p.title, p.max_votes, c.id, c.name, c.class_name, c.bio
    ORDER BY p.id, vote_count DESC, c.name`;

  const positions: Record<number, { id: number; title: string; max_votes: number; candidates: any[] }> = {};
  for (const row of rows) {
    if (!positions[row.position_id]) {
      positions[row.position_id] = { id: row.position_id, title: row.position_title, max_votes: row.max_votes, candidates: [] };
    }
    positions[row.position_id].candidates.push({ id: row.candidate_id, name: row.candidate_name, class_name: row.class_name, bio: row.bio, vote_count: row.vote_count });
  }

  return {
    total_voted:    (voterRows[0]?.total_voted   ?? 0) as number,
    total_students: (studentRows[0]?.total_students ?? 0) as number,
    positions:      Object.values(positions),
  };
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [e, s, c, v] = await Promise.all([
    q`SELECT COUNT(*)::int AS count FROM elections`,
    q`SELECT COUNT(*)::int AS count FROM students`,
    q`SELECT COUNT(*)::int AS count FROM candidates`,
    q`SELECT COUNT(*)::int AS count FROM voter_records`,
  ]);
  return {
    elections:  (e[0]?.count ?? 0) as number,
    students:   (s[0]?.count ?? 0) as number,
    candidates: (c[0]?.count ?? 0) as number,
    votes:      (v[0]?.count ?? 0) as number,
  };
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function getAdminByUsername(username: string) {
  const rows = await q`SELECT * FROM admins WHERE username = ${username}`;
  return rows[0] ?? null;
}
