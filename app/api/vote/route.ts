import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  getStudentByStudentId,
  getElectionById,
  hasStudentVoted,
  castVotes,
  getPositionsByElection,
} from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student_id, pin, election_id, selections } = body as {
      student_id: string;
      pin: string;
      election_id: number;
      selections: { position_id: number; candidate_id: number }[];
    };

    // 1. Validate student credentials
    const student = await getStudentByStudentId(student_id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 401 });
    }
    const validPin = await bcrypt.compare(String(pin), student.pin_hash);
    if (!validPin) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    // 2. Validate election
    const election = await getElectionById(election_id);
    if (!election) {
      return NextResponse.json({ error: "Election not found" }, { status: 404 });
    }
    if (election.status !== "active") {
      return NextResponse.json({ error: "This election is not currently active" }, { status: 400 });
    }

    // 3. Check if already voted
    const alreadyVoted = await hasStudentVoted(election_id, student.id);
    if (alreadyVoted) {
      return NextResponse.json({ error: "You have already voted in this election" }, { status: 409 });
    }

    // 4. Validate selections — one per position
    const positions = await getPositionsByElection(election_id);
    const positionIds = new Set(positions.map((p: any) => p.id));
    for (const sel of selections) {
      if (!positionIds.has(sel.position_id)) {
        return NextResponse.json({ error: `Invalid position: ${sel.position_id}` }, { status: 400 });
      }
    }

    // 5. Cast votes
    await castVotes(election_id, student.id, selections);

    return NextResponse.json({ success: true, message: "Your vote has been recorded." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
