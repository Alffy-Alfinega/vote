import { NextRequest, NextResponse } from "next/server";
import { createPosition, getPositionsByElection } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const electionId = req.nextUrl.searchParams.get("election_id");
    if (!electionId) {
      return NextResponse.json({ error: "election_id is required" }, { status: 400 });
    }
    const positions = await getPositionsByElection(Number(electionId));
    return NextResponse.json(positions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { election_id, title, max_votes = 1 } = body;

    if (!election_id || !title) {
      return NextResponse.json({ error: "election_id and title are required" }, { status: 400 });
    }

    const position = await createPosition({ election_id: Number(election_id), title, max_votes: Number(max_votes) });
    return NextResponse.json(position, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
