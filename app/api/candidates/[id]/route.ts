import { NextRequest, NextResponse } from "next/server";
import { deleteCandidate } from "@/lib/db";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteCandidate(Number(params.id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
