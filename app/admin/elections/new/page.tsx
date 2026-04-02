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
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!form.title||!form.start_date||!form.end_date) { setError("Fill in all required fields."); return; }
    if (new Date(form.end_date)<=new Date(form.start_date)) { setError("End date must be after start date."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/elections",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error??"Failed");
      router.push(`/admin/elections/${data.id}`);
    } catch(err: any){ setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-ash-300 mb-5 sm:mb-6">
        <Link href="/admin/elections" className="hover:text-forest-800 transition-colors">Elections</Link>
        <span>/</span>
        <span className="text-forest-800">New</span>
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-bold text-forest-800 mb-1">Create Election</h1>
      <p className="text-ash-300 text-sm mb-6 sm:mb-8">Set up a new election. Add positions and candidates after saving.</p>

      <div className="card p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-forest-800 mb-1.5">Election Title <span className="text-red-500">*</span></label>
            <input className="input" placeholder="e.g. Student Guild Elections 2025" value={form.title} onChange={set("title")} required/>
          </div>
          <div>
            <label className="block text-sm font-medium text-forest-800 mb-1.5">Description</label>
            <textarea className="textarea" rows={3} placeholder="Brief description…" value={form.description} onChange={set("description")}/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-forest-800 mb-1.5">Start Date & Time <span className="text-red-500">*</span></label>
              <input type="datetime-local" className="input" value={form.start_date} onChange={set("start_date")} required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-forest-800 mb-1.5">End Date & Time <span className="text-red-500">*</span></label>
              <input type="datetime-local" className="input" value={form.end_date} onChange={set("end_date")} required/>
            </div>
          </div>
          <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl px-4 py-3">
            <p className="text-xs text-forest-700"><strong>Next:</strong> After creating, you'll add positions (e.g. Head Prefect) and candidates.</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="text-sm text-red-600">{error}</p></div>}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
              {loading?(<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Creating…</>):"Create Election →"}
            </button>
            <Link href="/admin/elections" className="btn-ghost w-full sm:w-auto">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
