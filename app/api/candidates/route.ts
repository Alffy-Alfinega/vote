import { NextRequest, NextResponse } from "next/server";
import { createCandidate, getCandidatesByElection, getCandidatesByPosition } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const electionId = req.nextUrl.searchParams.get("election_id");
    const positionId = req.nextUrl.searchParams.get("position_id");

    if (electionId) {
      const candidates = await getCandidatesByElection(Number(electionId));
      return NextResponse.json(candidates);
    }
    if (positionId) {
      const candidates = await getCandidatesByPosition(Number(positionId));
      return NextResponse.json(candidates);
    }

    return NextResponse.json({ error: "election_id or position_id is required" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { position_id, name, class_name = "", bio = "" } = body;

    if (!position_id || !name) {
      return NextResponse.json({ error: "position_id and name are required" }, { status: 400 });
    }

    const candidate = await createCandidate({
      position_id: Number(position_id),
      name,
      class_name,
      bio,
    });
    return NextResponse.json(candidate, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
