import { NextRequest, NextResponse } from "next/server";
import { getCandidatesByElection, getCandidatesByPosition } from "@/lib/db";
import { neon } from "@neondatabase/serverless";

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
    if (!position_id || !name) return NextResponse.json({ error: "position_id and name required" }, { status: 400 });
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      INSERT INTO candidates (position_id, name, class_name, bio, photo_url)
      VALUES (${Number(position_id)}, ${name}, ${class_name}, ${bio}, ${photo_url})
      RETURNING *`;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
