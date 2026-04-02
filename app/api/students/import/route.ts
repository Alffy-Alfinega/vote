import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { upsertStudent } from "@/lib/db";

// Expected CSV format (with header):
// student_id,name,class_name,pin
// S2024001,Aisha Nakato,S.4 East,1234
// S2024002,Brian Okello,S.3 West,5678

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { csv } = body as { csv: string };

    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ error: "csv field is required" }, { status: 400 });
    }

    const lines = csv
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
    }

    // Skip header
    const dataLines = lines.slice(1);

    const results: { student_id: string; name: string; status: "ok" | "error"; message?: string }[] = [];

    for (const line of dataLines) {
      const parts = line.split(",").map((p) => p.trim());
      const [student_id, name, class_name, pin] = parts;

      if (!student_id || !name || !pin) {
        results.push({ student_id: student_id ?? "?", name: name ?? "?", status: "error", message: "Missing required fields" });
        continue;
      }

      if (String(pin).length < 4) {
        results.push({ student_id, name, status: "error", message: "PIN too short (min 4 chars)" });
        continue;
      }

      try {
        const pin_hash = await bcrypt.hash(String(pin), 10);
        await upsertStudent({ student_id, name, class_name: class_name ?? "", pin_hash });
        results.push({ student_id, name, status: "ok" });
      } catch (err: any) {
        results.push({ student_id, name, status: "error", message: err.message });
      }
    }

    const ok = results.filter((r) => r.status === "ok").length;
    const errors = results.filter((r) => r.status === "error").length;

    return NextResponse.json({ ok, errors, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
