import { NextRequest, NextResponse } from "next/server";
import { getElectionById, updateElectionStatus, deleteElection } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const election = await getElectionById(Number(id));
    if (!election) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(election);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    if (!["draft","active","closed"].includes(status))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    const election = await updateElectionStatus(Number(id), status);
    return NextResponse.json(election);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteElection(Number(id));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
