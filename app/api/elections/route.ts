import { NextRequest, NextResponse } from "next/server";
import { createElection, getElections } from "@/lib/db";

export async function GET() {
  try {
    const elections = await getElections();
    return NextResponse.json(elections);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, start_date, end_date } = body;

    if (!title || !start_date || !end_date) {
      return NextResponse.json({ error: "title, start_date and end_date are required" }, { status: 400 });
    }
    if (new Date(end_date) <= new Date(start_date)) {
      return NextResponse.json({ error: "end_date must be after start_date" }, { status: 400 });
    }

    const election = await createElection({ title, description: description || "", start_date, end_date });
    return NextResponse.json(election, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
