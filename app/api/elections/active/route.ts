import { NextResponse } from "next/server";
import { getActiveElections } from "@/lib/db";

export async function GET() {
  try {
    const elections = await getActiveElections();
    return NextResponse.json(elections);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
