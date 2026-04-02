import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminByUsername } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = await verifyAdminToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const { current_password, new_password } = await req.json();
    if (!current_password || !new_password)
      return NextResponse.json({ error: "Both fields are required" }, { status: 400 });
    if (new_password.length < 6)
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });

    const admin = await getAdminByUsername(payload.username);
    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    const valid = await bcrypt.compare(current_password, admin.password_hash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });

    const new_hash = await bcrypt.hash(new_password, 10);
    const sql = neon(process.env.DATABASE_URL!);
    await sql`UPDATE admins SET password_hash = ${new_hash} WHERE username = ${payload.username}`;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
