"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push("/admin"); router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #050f08 0%, #0d2818 50%, #0a1f10 100%)" }}>

      {/* dot-grid bg */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage:"radial-gradient(circle at 1px 1px,white 1px,transparent 0)", backgroundSize:"28px 28px" }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
            style={{ background:"var(--color-gold-500)" }}>
            <svg className="w-8 h-8" fill="#0d2818" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <h1 style={{ fontFamily:"var(--font-display)", color:"white", fontSize:"1.75rem", fontWeight:700, lineHeight:1 }}>
            VoteSecure
          </h1>
          <p style={{ color:"rgba(255,255,255,.4)", fontSize:".875rem", marginTop:".375rem" }}>Admin Panel</p>
        </div>

        {/* Card */}
        <div className="card p-6 sm:p-8 shadow-2xl">
          <h2 style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:"1.25rem", marginBottom:"1.5rem" }}>
            Sign in
          </h2>
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            <div>
              <label style={{ display:"block", fontSize:".75rem", fontWeight:500, marginBottom:".375rem" }}>Username</label>
              <input className="input" placeholder="admin" value={form.username}
                onChange={e => setForm(p => ({...p, username: e.target.value}))}
                autoComplete="username" autoCapitalize="none" required />
            </div>
            <div>
              <label style={{ display:"block", fontSize:".75rem", fontWeight:500, marginBottom:".375rem" }}>Password</label>
              <input type="password" className="input" placeholder="••••••••" value={form.password}
                onChange={e => setForm(p => ({...p, password: e.target.value}))}
                autoComplete="current-password" required />
            </div>

            {error && (
              <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:".75rem", padding:".75rem 1rem" }}>
                <p style={{ fontSize:".875rem", color:"#dc2626" }}>{error}</p>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width:"100%", marginTop:".25rem" }} disabled={loading}>
              {loading
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Signing in…</>
                : "Sign in →"}
            </button>
          </form>

          <p style={{ fontSize:".75rem", color:"var(--color-ash-300)", marginTop:"1.25rem", textAlign:"center", lineHeight:1.6 }}>
            Default: <code style={{ fontFamily:"monospace", background:"var(--color-ash-100)", padding:".125rem .375rem", borderRadius:".25rem" }}>admin</code>
            {" / "}
            <code style={{ fontFamily:"monospace", background:"var(--color-ash-100)", padding:".125rem .375rem", borderRadius:".25rem" }}>admin123</code>
            <br/>
            <span style={{ color:"var(--color-ash-200)" }}>If login fails, visit <code style={{ fontFamily:"monospace" }}>/api/setup</code> first</span>
          </p>
        </div>
      </div>
    </div>
  );
}
