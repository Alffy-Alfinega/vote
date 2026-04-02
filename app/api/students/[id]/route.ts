import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { deleteStudent, updateStudent } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, class_name, pin } = await req.json();

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    let pin_hash: string | undefined;
    if (pin) {
      if (String(pin).length < 4) return NextResponse.json({ error: "PIN must be at least 4 characters" }, { status: 400 });
      pin_hash = await bcrypt.hash(String(pin), 10);
    }

    const student = await updateStudent(Number(id), { name, class_name: class_name ?? "", pin_hash });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    return NextResponse.json(student);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteStudent(Number(id));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
