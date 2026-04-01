import { NextRequest, NextResponse } from "next/server";
import { deleteStudent } from "@/lib/db";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteStudent(Number(params.id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
