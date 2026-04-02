"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewElectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title:"", description:"", start_date:"", end_date:"" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
    setForm(p => ({...p, [k]: e.target.value}));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (new Date(form.end_date) <= new Date(form.start_date)) { setError("End date must be after start date."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/elections", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.push(`/admin/elections/${data.id}`);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ padding:"1rem", maxWidth:"42rem", margin:"0 auto" }} className="sm:p-6 lg:p-8">
      <div style={{ display:"flex", gap:".5rem", alignItems:"center", fontSize:".875rem", color:"var(--color-ash-300)", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        <Link href="/admin/elections" style={{ color:"inherit", textDecoration:"none" }} className="hover-forest">Elections</Link>
        <span>/</span>
        <span style={{ color:"var(--color-forest-800)" }}>New Election</span>
      </div>

      <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(1.5rem,4vw,2rem)", fontWeight:700, marginBottom:".25rem" }}>
        Create Election
      </h1>
      <p style={{ color:"var(--color-ash-300)", fontSize:".875rem", marginBottom:"2rem" }}>
        Set up a new election. Add positions and candidates after saving.
      </p>

      <div className="card" style={{ padding:"1.5rem" }}>
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
          <div>
            <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".5rem" }}>Election Title *</label>
            <input className="input" placeholder="e.g. Student Guild Elections 2025"
              value={form.title} onChange={set("title")} required />
          </div>
          <div>
            <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".5rem" }}>Description</label>
            <textarea className="input textarea" rows={3} placeholder="Brief description…"
              value={form.description} onChange={set("description")} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:"1rem" }}>
            <div>
              <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".5rem" }}>Start Date & Time *</label>
              <input type="datetime-local" className="input" value={form.start_date} onChange={set("start_date")} required />
            </div>
            <div>
              <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".5rem" }}>End Date & Time *</label>
              <input type="datetime-local" className="input" value={form.end_date} onChange={set("end_date")} required />
            </div>
          </div>

          <div style={{ background:"color-mix(in srgb,var(--color-gold-500) 10%,transparent)", border:"1px solid color-mix(in srgb,var(--color-gold-500) 25%,transparent)", borderRadius:".75rem", padding:".875rem 1rem" }}>
            <p style={{ fontSize:".8125rem", color:"var(--color-forest-700)" }}>
              <strong>Next:</strong> After creating the election you'll add positions (e.g. Head Prefect) and candidates.
            </p>
          </div>

          {error && (
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:".75rem", padding:".75rem 1rem" }}>
              <p style={{ fontSize:".875rem", color:"#dc2626" }}>{error}</p>
            </div>
          )}

          <div style={{ display:"flex", gap:".75rem", flexWrap:"wrap", paddingTop:".25rem" }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating…" : "Create Election →"}
            </button>
            <Link href="/admin/elections" className="btn-ghost" style={{ border:"1px solid var(--color-ash-200)" }}>Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
