import { NextRequest, NextResponse } from "next/server";
import { getElectionById, getElectionResults } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const election = await getElectionById(Number((await params).id));
    if (!election) {
      return NextResponse.json({ error: "Election not found" }, { status: 404 });
    }
    const results = await getElectionResults(Number((await params).id));
    return NextResponse.json({ election, ...results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
