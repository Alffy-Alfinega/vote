"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

const MAROON = "#9b4f3a";
const CREAM  = "#f9f5c8";

const NAV = [
  { label:"Dashboard",  href:"/admin",
    icon:<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
  { label:"Elections",  href:"/admin/elections",
    icon:<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg> },
  { label:"Students",   href:"/admin/students",
    icon:<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> },
  { label:"Settings",   href:"/admin/settings",
    icon:<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
];
const SIDEBAR_W = 260;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;
  const isActive = (href: string) => href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  async function logout() {
    await fetch("/api/auth/logout", { method:"POST" });
    router.push("/admin/login");
  }

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--color-ash-50)" }}>

      {open && <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, zIndex:30, background:"rgba(0,0,0,.5)", backdropFilter:"blur(2px)" }}/>}

      {/* Sidebar */}
      <aside className="lg-sidebar" style={{
        position:"fixed", top:0, left:0, width:SIDEBAR_W, height:"100%", zIndex:40,
        background:MAROON, display:"flex", flexDirection:"column",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition:"transform .25s ease",
        boxShadow:"4px 0 24px rgba(0,0,0,.2)",
      }}>
        {/* Logo */}
        <div style={{ padding:"1.25rem 1rem", borderBottom:"1px solid rgba(249,245,200,.15)", display:"flex", alignItems:"center", gap:".875rem" }}>
          <Image src="/logo.jpg" alt="Makindye Sec. School" width={44} height={44}
            style={{ borderRadius:"50%", objectFit:"cover", border:"2px solid rgba(249,245,200,.3)", flexShrink:0 }}/>
          <div style={{ minWidth:0 }}>
            <p style={{ color:CREAM, fontFamily:"var(--font-display)", fontWeight:700, fontSize:".875rem", lineHeight:1.2 }}>Makindye Sec.</p>
            <p style={{ color:"rgba(249,245,200,.5)", fontSize:".7rem", marginTop:2 }}>E-Voting System</p>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden" style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"rgba(249,245,200,.4)", padding:4, display:"flex" }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"1rem .75rem", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" }}>
          {NAV.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} style={{
                display:"flex", alignItems:"center", gap:".75rem",
                padding:".75rem .875rem", borderRadius:".75rem",
                textDecoration:"none", fontSize:".9375rem", fontWeight:500,
                background: active ? "rgba(249,245,200,.15)" : "transparent",
                color: active ? CREAM : "rgba(249,245,200,.5)",
                transition:"all .15s",
                borderLeft: active ? `3px solid ${CREAM}` : "3px solid transparent",
              }}>
                {item.icon}
                {item.label}
              </Link>
            );
          })}
          <div style={{ marginTop:"1rem", paddingTop:"1rem", borderTop:"1px solid rgba(249,245,200,.1)" }}>
            <Link href="/vote" target="_blank" onClick={() => setOpen(false)} style={{
              display:"flex", alignItems:"center", gap:".75rem",
              padding:".75rem .875rem", borderRadius:".75rem",
              textDecoration:"none", fontSize:".9375rem", fontWeight:500,
              color:"rgba(249,245,200,.5)", transition:"all .15s",
            }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Voting Booth ↗
            </Link>
          </div>
        </nav>

        <div style={{ padding:".75rem", borderTop:"1px solid rgba(249,245,200,.1)" }}>
          <button onClick={logout} style={{
            width:"100%", display:"flex", alignItems:"center", gap:".75rem",
            padding:".75rem .875rem", borderRadius:".75rem",
            background:"none", border:"none", cursor:"pointer",
            color:"rgba(249,245,200,.35)", fontSize:".9375rem", fontWeight:500,
          }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Sign out
          </button>
          <p style={{ color:"rgba(249,245,200,.15)", fontSize:".7rem", padding:".25rem .875rem", marginTop:4 }}>Makindye Sec. School © {new Date().getFullYear()}</p>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:ml-[260px]" style={{ flex:1, display:"flex", flexDirection:"column", minHeight:"100vh" }}>
        {/* Mobile top bar */}
        <header className="lg:hidden" style={{
          position:"sticky", top:0, zIndex:20, background:MAROON, color:CREAM,
          padding:".75rem 1rem", display:"flex", alignItems:"center", gap:".875rem",
          boxShadow:"0 2px 12px rgba(0,0,0,.25)",
        }}>
          <button onClick={() => setOpen(true)} style={{ background:"none", border:"none", cursor:"pointer", color:CREAM, padding:4, display:"flex" }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <Image src="/logo.jpg" alt="Makindye" width={30} height={30} style={{ borderRadius:"50%", objectFit:"cover" }}/>
          <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:".9375rem" }}>Makindye Sec.</span>
          <span style={{ marginLeft:"auto", color:"rgba(249,245,200,.55)", fontSize:".8125rem" }}>
            {NAV.find(n => isActive(n.href))?.label ?? "Admin"}
          </span>
        </header>
        <main style={{ flex:1 }}>{children}</main>
      </div>

      <style>{`@media(min-width:1024px){.lg-sidebar{transform:translateX(0)!important}}`}</style>
    </div>
  );
}
