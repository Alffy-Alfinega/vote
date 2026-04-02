import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminByUsername } from "@/lib/db";
import { signAdminToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const admin = await getAdminByUsername(username);
    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signAdminToken({ username: admin.username });

    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
