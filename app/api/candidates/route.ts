import { NextRequest, NextResponse } from "next/server";
import { getCandidatesByElection, getCandidatesByPosition, createCandidate } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const electionId = req.nextUrl.searchParams.get("election_id");
    const positionId = req.nextUrl.searchParams.get("position_id");
    if (electionId) return NextResponse.json(await getCandidatesByElection(Number(electionId)));
    if (positionId) return NextResponse.json(await getCandidatesByPosition(Number(positionId)));
    return NextResponse.json({ error: "election_id or position_id required" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { position_id, name, class_name = "", bio = "", photo_url = "" } = await req.json();
    if (!position_id || !name) return NextResponse.json({ error: "position_id and name are required" }, { status: 400 });
    const candidate = await createCandidate({
      position_id: Number(position_id), name, class_name, bio, photo_url,
    });
    return NextResponse.json(candidate, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
