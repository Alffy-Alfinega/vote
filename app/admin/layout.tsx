"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const FOREST = "#0d2818";
const GOLD   = "#e8b84b";

const NAV = [
  {
    label: "Dashboard", href: "/admin",
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
  },
  {
    label: "Elections", href: "/admin/elections",
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  },
  {
    label: "Students", href: "/admin/students",
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  },
  {
    label: "Settings", href: "/admin/settings",
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  },
];

const SIDEBAR_W = 260;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-ash-50)" }}>

      {/* ── Mobile overlay ───────────────────────────────────────────── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 30,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside style={{
        position: "fixed",
        top: 0, left: 0,
        width: SIDEBAR_W,
        height: "100%",
        zIndex: 40,
        background: FOREST,
        display: "flex",
        flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        // On lg+ always visible
        ...(typeof window !== "undefined" && window.innerWidth >= 1024
          ? { transform: "translateX(0)" }
          : {}),
      }}
        className="lg-sidebar"
      >
        {/* Logo row */}
        <div style={{
          padding: "1.25rem 1.25rem",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: GOLD,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="18" height="18" fill={FOREST} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <p style={{ color: "white", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem", lineHeight: 1 }}>VoteSecure</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", marginTop: 3 }}>Admin</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.4)", padding: 4,
              display: "flex", alignItems: "center",
            }}
            className="lg:hidden"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.75rem 0.875rem",
                  borderRadius: "0.75rem",
                  textDecoration: "none",
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  color: active ? "white" : "rgba(255,255,255,0.5)",
                  transition: "all 0.15s",
                }}
              >
                {item.icon}
                {item.label}
                {active && (
                  <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: GOLD, flexShrink: 0 }} />
                )}
              </Link>
            );
          })}

          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <Link
              href="/vote"
              target="_blank"
              onClick={() => setOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.75rem 0.875rem",
                borderRadius: "0.75rem",
                textDecoration: "none",
                fontSize: "0.9375rem",
                fontWeight: 500,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Voting Booth ↗
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.75rem 0.875rem", borderRadius: "0.75rem",
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.35)", fontSize: "0.9375rem", fontWeight: 500,
              transition: "all 0.15s",
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sign out
          </button>
          <p style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.75rem", padding: "0.25rem 0.875rem", marginTop: 4 }}>
            © {new Date().getFullYear()} VoteSecure
          </p>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}
        className="lg:ml-[260px]">

        {/* Mobile top bar */}
        <header
          className="lg:hidden"
          style={{
            position: "sticky", top: 0, zIndex: 20,
            background: FOREST,
            color: "white",
            padding: "0.75rem 1rem",
            display: "flex", alignItems: "center", gap: "0.875rem",
            boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
          }}
        >
          <button
            onClick={() => setOpen(true)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "white", padding: 4,
              display: "flex", alignItems: "center",
            }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 24, height: 24, borderRadius: 5, background: GOLD, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" fill={FOREST} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem" }}>VoteSecure</span>
          </div>

          <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem" }}>
            {NAV.find((n) => isActive(n.href))?.label ?? "Admin"}
          </span>
        </header>

        <main style={{ flex: 1 }}>{children}</main>
      </div>

      {/* Force sidebar visible on lg+ via CSS */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </div>
  );
}
