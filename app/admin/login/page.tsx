"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error??"Login failed");
      router.push("/admin"); router.refresh();
    } catch(err: any){ setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-forest-900 flex items-center justify-center p-4"
      style={{backgroundImage:"radial-gradient(ellipse at 70% 20%, #1a4529 0%, #050f08 60%)"}}>
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{backgroundImage:"radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize:"32px 32px"}}/>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-7 sm:mb-8">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gold-500 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-gold-500/20">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-forest-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">VoteSecure</h1>
          <p className="text-white/40 text-sm mt-1">Admin Panel</p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/40">
          <h2 className="font-display font-semibold text-forest-800 text-lg mb-5">Sign in</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-forest-800 mb-1.5">Username</label>
              <input className="input" placeholder="admin" value={form.username}
                onChange={e=>setForm(p=>({...p,username:e.target.value}))} autoComplete="username" required/>
            </div>
            <div>
              <label className="block text-xs font-medium text-forest-800 mb-1.5">Password</label>
              <input type="password" className="input" placeholder="••••••••" value={form.password}
                onChange={e=>setForm(p=>({...p,password:e.target.value}))} autoComplete="current-password" required/>
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="text-sm text-red-600">{error}</p></div>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading?(<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Signing in…</>):"Sign in →"}
            </button>
          </form>
          <p className="text-xs text-ash-300 mt-5 text-center">Default: <span className="font-mono">admin</span> / <span className="font-mono">admin123</span></p>
        </div>
      </div>
    </div>
  );
}
