import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { deleteStudent } from "@/lib/db";
import { neon } from "@neondatabase/serverless";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, class_name, pin } = body;
    const sql = neon(process.env.DATABASE_URL!);

    if (pin) {
      if (String(pin).length < 4) return NextResponse.json({ error: "PIN too short" }, { status: 400 });
      const pin_hash = await bcrypt.hash(String(pin), 10);
      const rows = await sql`UPDATE students SET name=${name}, class_name=${class_name}, pin_hash=${pin_hash} WHERE id=${Number(id)} RETURNING id, student_id, name, class_name, created_at`;
      return NextResponse.json(rows[0]);
    } else {
      const rows = await sql`UPDATE students SET name=${name}, class_name=${class_name} WHERE id=${Number(id)} RETURNING id, student_id, name, class_name, created_at`;
      return NextResponse.json(rows[0]);
    }
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
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
