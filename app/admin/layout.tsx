"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const NAV = [
  {
    label: "Dashboard", href: "/admin",
    icon: (<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>),
  },
  {
    label: "Elections", href: "/admin/elections",
    icon: (<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>),
  },
  {
    label: "Students", href: "/admin/students",
    icon: (<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>),
  },
];

const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-forest-900" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
      </svg>
    </div>
    <div>
      <p className="text-white font-display font-bold text-sm leading-none">VoteSecure</p>
      <p className="text-white/40 text-xs mt-0.5">Admin Panel</p>
    </div>
  </div>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [open, setOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  if (pathname === "/admin/login") return <>{children}</>;

  const NavLinks = () => (
    <>
      {NAV.map((item) => (
        <Link key={item.href} href={item.href}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
            isActive(item.href) ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
          {isActive(item.href) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-500 flex-shrink-0" />}
        </Link>
      ))}
      <div className="pt-3 mt-3 border-t border-white/10">
        <Link href="/vote" target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Voting Booth ↗</span>
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* ── Mobile overlay ─────────────────────────────────────────────────── */}
      {open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
          <Logo />
          {/* Close button (mobile only) */}
          <button onClick={() => setOpen(false)} className="md:hidden text-white/40 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLinks />
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 border-t border-white/10 pt-3">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/30 hover:text-white/60 hover:bg-white/5 transition-all">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign out</span>
          </button>
          <p className="text-white/15 text-xs px-3 mt-2 hidden md:block">© {new Date().getFullYear()} VoteSecure</p>
        </div>
      </aside>

      {/* ── Page wrapper ───────────────────────────────────────────────────── */}
      <div className="main-content flex-1">
        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <button onClick={() => setOpen(true)} className="text-white p-1 -ml-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Logo />
        </div>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
