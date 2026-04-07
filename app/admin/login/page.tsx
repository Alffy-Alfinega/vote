"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const MAROON = "#5F0D0F";
const CREAM  = "#fdfcde";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ username:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push("/admin"); router.refresh();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Login failed"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight:"100svh", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem",
      background:`linear-gradient(160deg, ${MAROON} 0%, #3d0709 60%, #1a0304 100%)` }}>
      <div style={{ position:"absolute", inset:0, opacity:.06, pointerEvents:"none",
        backgroundImage:"radial-gradient(circle at 1px 1px, #fdfcde 1px, transparent 0)", backgroundSize:"28px 28px" }}/>
      <div style={{ position:"relative", width:"100%", maxWidth:400 }}>
        {/* Emblem + school name */}
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:90, height:90, borderRadius:"50%", margin:"0 auto 1rem",
            border:`3px solid rgba(249,245,200,.4)`, overflow:"hidden",
            boxShadow:"0 8px 32px rgba(0,0,0,.3)" }}>
            <Image src="/logo.jpg" alt="Makindye Sec. School" width={90} height={90} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          </div>
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:"1.5rem", fontWeight:700, color:CREAM, lineHeight:1.2 }}>
            Makindye Secondary School
          </h1>
          <p style={{ color:"rgba(249,245,200,.5)", fontSize:".8125rem", marginTop:".375rem", letterSpacing:".05em", textTransform:"uppercase" }}>
            E-Voting — Admin Panel
          </p>
        </div>

        <div className="card" style={{ padding:"1.75rem", background:"#fdfcde" }}>
          <h2 style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:"1.125rem", marginBottom:"1.25rem", color:MAROON }}>Sign in</h2>
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            <div>
              <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".5rem" }}>Username</label>
              <input className="input" placeholder="admin" value={form.username}
                onChange={e => setForm(p => ({...p, username:e.target.value}))} autoComplete="username" autoCapitalize="none" required/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".5rem" }}>Password</label>
              <input type="password" className="input" placeholder="••••••••" value={form.password}
                onChange={e => setForm(p => ({...p, password:e.target.value}))} autoComplete="current-password" required/>
            </div>
            {error && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:".75rem", padding:".75rem 1rem" }}>
              <p style={{ fontSize:".875rem", color:"#991b1b" }}>{error}</p></div>}
            <button type="submit" className="btn-primary" style={{ width:"100%", marginTop:".25rem" }} disabled={loading}>
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>
        </div>

        <p style={{ textAlign:"center", color:"rgba(249,245,200,.3)", fontSize:".75rem", marginTop:"1.25rem" }}>
          We Strive For Development
        </p>
      </div>
    </div>
  );
}
