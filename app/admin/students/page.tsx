"use client";

import { useEffect, useRef, useState } from "react";

type Student = { id: number; student_id: string; name: string; class_name: string; created_at: string };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch]   = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ student_id: "", name: "", class_name: "", pin: "" });
  const [saving, setSaving] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; errors: number; results: any[] } | null>(null);
  const [importing, setImporting] = useState(false);

  const load = async () => {
    const res = await fetch("/api/students");
    setStudents(await res.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/students", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setForm({ student_id: "", name: "", class_name: "", pin: "" });
      setShowForm(false);
      setSuccess(`${data.name} added.`);
      load(); setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Remove ${name}?`)) return;
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    load();
  }

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true); setImportResult(null); setError("");
    try {
      const text = await file.text();
      const res = await fetch("/api/students/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImportResult(data); load();
    } catch (err: any) { setError(err.message); }
    finally { setImporting(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  function downloadTemplate() {
    const csv = "student_id,name,class_name,pin\nS2024001,Aisha Nakato,S.4 East,1234\nS2024002,Brian Okello,S.3 West,5678";
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: "students_template.csv",
    });
    a.click();
  }

  const filtered = students.filter((s) =>
    [s.name, s.student_id, s.class_name].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest-800">Students</h1>
          <p className="text-ash-300 mt-1 text-sm">{students.length} registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowImport(!showImport); setShowForm(false); }} className="btn-ghost border border-ash-200">
            ↑ Import CSV
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowImport(false); }} className="btn-primary">
            + Add Student
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-emerald-700">✓ {success}</p>
        </div>
      )}

      {showImport && (
        <div className="card p-6 mb-6 border-gold-500/30 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-forest-800">Bulk Import via CSV</h2>
            <button onClick={downloadTemplate} className="btn-ghost text-xs border border-ash-200">↓ Download Template</button>
          </div>
          <div className="bg-ash-50 rounded-xl p-3 mb-3 font-mono text-xs text-ash-300 space-y-0.5">
            <p>student_id,name,class_name,pin</p>
            <p>S2024001,Aisha Nakato,S.4 East,1234</p>
          </div>
          <p className="text-xs text-ash-300 mb-4">PINs are hashed automatically. Existing students are updated by student_id.</p>
          <label className={`flex items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${
            importing ? "border-ash-200 bg-ash-50" : "border-ash-200 hover:border-gold-500/50 hover:bg-gold-500/5"}`}>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileImport} disabled={importing} />
            {importing ? (
              <><svg className="w-5 h-5 animate-spin text-gold-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg><span className="text-sm text-ash-300">Importing…</span></>
            ) : (
              <><svg className="w-5 h-5 text-ash-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg><span className="text-sm text-ash-300">Click to upload CSV</span></>
            )}
          </label>
          {importResult && (
            <div className="mt-3 space-y-2">
              <p className="text-sm">
                <span className="text-emerald-600 font-medium">✓ {importResult.ok} imported</span>
                {importResult.errors > 0 && <span className="text-red-500 font-medium ml-3">✗ {importResult.errors} errors</span>}
              </p>
              {importResult.errors > 0 && (
                <div className="bg-red-50 rounded-xl p-3 max-h-32 overflow-y-auto">
                  {importResult.results.filter((r) => r.status === "error").map((r, i) => (
                    <p key={i} className="text-xs text-red-600">{r.student_id}: {r.message}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="card p-6 mb-6 border-gold-500/30 border">
          <h2 className="font-display font-semibold text-forest-800 mb-4">New Student</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-forest-800 mb-1.5">Student ID *</label>
                <input className="input" placeholder="e.g. S2024001" value={form.student_id} onChange={setF("student_id")} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-forest-800 mb-1.5">Full Name *</label>
                <input className="input" placeholder="e.g. Aisha Nakato" value={form.name} onChange={setF("name")} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-forest-800 mb-1.5">Class</label>
                <input className="input" placeholder="e.g. S.4 East" value={form.class_name} onChange={setF("class_name")} />
              </div>
              <div>
                <label className="block text-xs font-medium text-forest-800 mb-1.5">PIN *</label>
                <input type="password" className="input" placeholder="4–8 digit PIN" maxLength={8} value={form.pin} onChange={setF("pin")} required />
              </div>
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="text-sm text-red-600">{error}</p></div>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Add Student"}</button>
              <button type="button" onClick={() => { setShowForm(false); setError(""); }} className="btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4 relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ash-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input className="input pl-10" placeholder="Search by name, ID, or class…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center"><svg className="w-6 h-6 animate-spin text-gold-500 mx-auto" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">🎓</p>
            <p className="font-medium text-forest-800">{search ? "No results" : "No students yet"}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-ash-50 border-b border-ash-100">
              <tr>{["Student","ID","Class","Registered",""].map((h) => <th key={h} className="table-cell table-head text-left">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-forest-800/10 flex items-center justify-center font-display font-bold text-forest-800 text-xs">{s.name.charAt(0)}</div>
                      <span className="font-medium text-forest-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="table-cell font-mono text-xs text-ash-300">{s.student_id}</td>
                  <td className="table-cell text-ash-300">{s.class_name || "—"}</td>
                  <td className="table-cell text-xs text-ash-300">{new Date(s.created_at).toLocaleDateString("en-UG",{day:"numeric",month:"short",year:"numeric"})}</td>
                  <td className="table-cell"><button onClick={() => handleDelete(s.id, s.name)} className="btn-danger text-xs">Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
