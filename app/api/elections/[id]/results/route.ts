import { NextRequest, NextResponse } from "next/server";
import { getElectionById, getElectionResults } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const election = await getElectionById(Number(params.id));
    if (!election) {
      return NextResponse.json({ error: "Election not found" }, { status: 404 });
    }
    const results = await getElectionResults(Number(params.id));
    return NextResponse.json({ election, ...results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
