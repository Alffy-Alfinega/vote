import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin routes (but not /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    const payload = await verifyAdminToken(token);
    if (!payload) {
      const res = NextResponse.redirect(new URL("/admin/login", req.url));
      res.cookies.delete("admin_token");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
