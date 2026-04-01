import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createStudent, getStudents } from "@/lib/db";

export async function GET() {
  try {
    const students = await getStudents();
    return NextResponse.json(students);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student_id, name, class_name = "", pin } = body;

    if (!student_id || !name || !pin) {
      return NextResponse.json(
        { error: "student_id, name, and pin are required" },
        { status: 400 }
      );
    }
    if (String(pin).length < 4) {
      return NextResponse.json({ error: "PIN must be at least 4 characters" }, { status: 400 });
    }

    const pin_hash = await bcrypt.hash(String(pin), 10);

    const student = await createStudent({ student_id, name, class_name, pin_hash });
    return NextResponse.json(student, { status: 201 });
  } catch (err: any) {
    // Unique constraint violation (duplicate student_id)
    if (err.message?.includes("unique") || err.message?.includes("duplicate")) {
      return NextResponse.json({ error: "Student ID already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
