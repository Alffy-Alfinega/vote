import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getStudentByStudentId, hasStudentVoted } from "@/lib/db";

/**
 * POST /api/vote/check
 * Validates credentials and returns whether the student has already voted.
 * Used by the booth login to block double voting before showing the ballot.
 */
export async function POST(req: NextRequest) {
  try {
    const { student_id, pin, election_id } = await req.json();

    if (!student_id || !pin || !election_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Verify student exists and PIN is correct
    const student = await getStudentByStudentId(student_id);
    if (!student) {
      return NextResponse.json({ error: "Student ID not found." }, { status: 401 });
    }

    const validPin = await bcrypt.compare(String(pin), student.pin_hash);
    if (!validPin) {
      return NextResponse.json({ error: "Incorrect PIN. Please try again." }, { status: 401 });
    }

    // 2. Check if they have already voted
    const alreadyVoted = await hasStudentVoted(Number(election_id), student.id);
    if (alreadyVoted) {
      return NextResponse.json(
        { error: "You have already voted in this election. Each student may only vote once." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, name: student.name });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
