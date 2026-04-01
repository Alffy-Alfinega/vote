import { NextRequest, NextResponse } from "next/server";
import { getElectionById, updateElectionStatus, deleteElection } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const election = await getElectionById(Number(params.id));
    if (!election) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(election);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    const allowed = ["draft", "active", "closed"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const election = await updateElectionStatus(Number(params.id), status);
    return NextResponse.json(election);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteElection(Number(params.id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
