"use client";
import { useEffect, useRef, useState } from "react";

type Student = { id:number; student_id:string; name:string; class_name:string; created_at:string };

export default function StudentsPage() {
  const [students, setStudents]   = useState<Student[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch]   = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ student_id:"", name:"", class_name:"", pin:"" });
  const [saving, setSaving] = useState(false);
  const [importResult, setImportResult] = useState<{ok:number;errors:number;results:any[]}|null>(null);
  const [importing, setImporting] = useState(false);

  const load = async () => { const r = await fetch("/api/students"); setStudents(await r.json()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({...p, [k]:e.target.value}));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/students", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setForm({ student_id:"", name:"", class_name:"", pin:"" }); setShowForm(false);
      setSuccess(`${data.name} added.`); load(); setTimeout(() => setSuccess(""), 4000);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Remove ${name}?`)) return;
    await fetch(`/api/students/${id}`, { method:"DELETE" }); load();
  }

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true); setImportResult(null); setError("");
    try {
      const text = await file.text();
      const res = await fetch("/api/students/import", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ csv:text }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImportResult(data); load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setImporting(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  function downloadTemplate() {
    const csv = "student_id,name,class_name,pin\nS2024001,Aisha Nakato,S.4 East,1234\nS2024002,Brian Okello,S.3 West,5678";
    Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv],{type:"text/csv"})), download:"students_template.csv"
    }).click();
  }

  const filtered = students.filter(s =>
    [s.name, s.student_id, s.class_name].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding:"1rem", maxWidth:"72rem", margin:"0 auto" }} className="sm:p-6 lg:p-8">

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        <div>
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(1.5rem,4vw,2rem)", fontWeight:700, color:"var(--color-forest-800)" }}>Students</h1>
          <p style={{ color:"var(--color-ash-300)", fontSize:".875rem", marginTop:".25rem" }}>{students.length} registered</p>
        </div>
        <div style={{ display:"flex", gap:".5rem", flexWrap:"wrap" }}>
          <button onClick={() => { setShowImport(!showImport); setShowForm(false); }} className="btn-ghost"
            style={{ border:"1px solid var(--color-ash-200)", fontSize:".875rem" }}>
            ↑ Import CSV
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowImport(false); }} className="btn-primary" style={{ fontSize:".875rem" }}>
            + Add Student
          </button>
        </div>
      </div>

      {success && <div style={{ background:"#ecfdf5", border:"1px solid #6ee7b7", borderRadius:".75rem", padding:".75rem 1rem", marginBottom:"1rem" }}>
        <p style={{ fontSize:".875rem", color:"#065f46" }}>✓ {success}</p></div>}

      {/* CSV Import */}
      {showImport && (
        <div className="card" style={{ padding:"1.25rem", marginBottom:"1.25rem", border:"1px solid color-mix(in srgb,var(--color-gold-500) 30%,transparent)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem", flexWrap:"wrap", gap:".5rem" }}>
            <h2 style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:"1rem" }}>Bulk Import via CSV</h2>
            <button onClick={downloadTemplate} className="btn-ghost" style={{ border:"1px solid var(--color-ash-200)", fontSize:".8125rem", padding:".5rem .875rem", minHeight:40 }}>
              ↓ Template
            </button>
          </div>
          <div style={{ background:"var(--color-ash-50)", borderRadius:".75rem", padding:".875rem", marginBottom:".875rem", fontFamily:"monospace", fontSize:".8125rem", color:"var(--color-ash-300)", lineHeight:1.7 }}>
            student_id,name,class_name,pin<br/>S2024001,Aisha Nakato,S.4 East,1234
          </div>
          <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:".75rem",
            border:"2px dashed var(--color-ash-200)", borderRadius:".875rem", padding:"2rem 1rem",
            cursor: importing ? "not-allowed" : "pointer", transition:"all .15s" }}>
            <input ref={fileRef} type="file" accept=".csv" style={{ display:"none" }} onChange={handleFileImport} disabled={importing}/>
            {importing
              ? <><svg style={{ width:20,height:20,color:"var(--color-gold-500)" }} className="animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg><span style={{ fontSize:".9rem", color:"var(--color-ash-300)" }}>Importing…</span></>
              : <><svg style={{ width:20,height:20,color:"var(--color-ash-300)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg><span style={{ fontSize:".9rem", color:"var(--color-ash-300)" }}>Click to upload CSV</span></>
            }
          </label>
          {importResult && (
            <div style={{ marginTop:".875rem" }}>
              <p style={{ fontSize:".875rem" }}>
                <span style={{ color:"#059669", fontWeight:500 }}>✓ {importResult.ok} imported</span>
                {importResult.errors > 0 && <span style={{ color:"#dc2626", fontWeight:500, marginLeft:"1rem" }}>✗ {importResult.errors} errors</span>}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add student form */}
      {showForm && (
        <div className="card" style={{ padding:"1.25rem", marginBottom:"1.25rem", border:"1px solid color-mix(in srgb,var(--color-gold-500) 30%,transparent)" }}>
          <h2 style={{ fontFamily:"var(--font-display)", fontWeight:600, marginBottom:"1rem" }}>New Student</h2>
          <form onSubmit={handleAdd} style={{ display:"flex", flexDirection:"column", gap:".875rem" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:".875rem" }}>
              <div>
                <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".375rem" }}>Student ID *</label>
                <input className="input" placeholder="e.g. S2024001" value={form.student_id} onChange={setF("student_id")} required/>
              </div>
              <div>
                <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".375rem" }}>Full Name *</label>
                <input className="input" placeholder="e.g. Aisha Nakato" value={form.name} onChange={setF("name")} required/>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:".875rem" }}>
              <div>
                <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".375rem" }}>Class</label>
                <input className="input" placeholder="e.g. S.4 East" value={form.class_name} onChange={setF("class_name")}/>
              </div>
              <div>
                <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".375rem" }}>PIN *</label>
                <input type="password" className="input" placeholder="4–8 digit PIN" maxLength={8} value={form.pin} onChange={setF("pin")} inputMode="numeric" required/>
              </div>
            </div>
            {error && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:".75rem", padding:".75rem 1rem" }}>
              <p style={{ fontSize:".875rem", color:"#dc2626" }}>{error}</p></div>}
            <div style={{ display:"flex", gap:".5rem" }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ fontSize:".875rem" }}>{saving ? "Saving…" : "Add Student"}</button>
              <button type="button" onClick={() => { setShowForm(false); setError(""); }} className="btn-ghost" style={{ border:"1px solid var(--color-ash-200)", fontSize:".875rem" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div style={{ position:"relative", marginBottom:"1rem" }}>
        <svg style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", width:16, height:16, color:"var(--color-ash-300)" }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input className="input" style={{ paddingLeft:"2.75rem" }} placeholder="Search by name, ID, or class…"
          value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      {/* Table / List */}
      <div className="card" style={{ overflow:"hidden" }}>
        {loading ? (
          <div style={{ padding:"4rem", display:"flex", justifyContent:"center" }}>
            <svg style={{ width:24,height:24,color:"var(--color-gold-500)" }} className="animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:"4rem 1rem", textAlign:"center" }}>
            <p style={{ fontSize:"2.5rem", marginBottom:".75rem" }}>🎓</p>
            <p style={{ fontWeight:500 }}>{search ? "No results" : "No students yet"}</p>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="sm:hidden" style={{ display:"flex", flexDirection:"column" }}>
              {filtered.map(s => (
                <div key={s.id} style={{ padding:"1rem", borderBottom:"1px solid var(--color-ash-100)", display:"flex", alignItems:"center", gap:".875rem" }}>
                  <div style={{ width:40,height:40,borderRadius:"50%",background:"rgba(13,40,24,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontWeight:700,flexShrink:0 }}>
                    {s.name.charAt(0)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:500, fontSize:".9375rem" }}>{s.name}</p>
                    <p style={{ fontSize:".8125rem", color:"var(--color-ash-300)" }}>{s.student_id}{s.class_name ? ` · ${s.class_name}` : ""}</p>
                  </div>
                  <button onClick={() => handleDelete(s.id, s.name)} className="btn-danger" style={{ fontSize:".8125rem", minHeight:36, padding:".5rem .75rem" }}>Remove</button>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead style={{ background:"var(--color-ash-50)", borderBottom:"1px solid var(--color-ash-100)" }}>
                  <tr>{["Student","ID","Class","Registered",""].map(h => <th key={h} className="table-cell table-head" style={{ textAlign:"left" }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="table-row">
                      <td className="table-cell">
                        <div style={{ display:"flex", alignItems:"center", gap:".75rem" }}>
                          <div style={{ width:32,height:32,borderRadius:"50%",background:"rgba(13,40,24,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontWeight:700,fontSize:".8125rem",flexShrink:0 }}>{s.name.charAt(0)}</div>
                          <span style={{ fontWeight:500 }}>{s.name}</span>
                        </div>
                      </td>
                      <td className="table-cell" style={{ fontFamily:"monospace", fontSize:".8125rem", color:"var(--color-ash-300)" }}>{s.student_id}</td>
                      <td className="table-cell" style={{ color:"var(--color-ash-300)" }}>{s.class_name||"—"}</td>
                      <td className="table-cell" style={{ fontSize:".8125rem", color:"var(--color-ash-300)" }}>
                        {new Date(s.created_at).toLocaleDateString("en-UG",{day:"numeric",month:"short",year:"numeric"})}
                      </td>
                      <td className="table-cell"><button onClick={() => handleDelete(s.id,s.name)} className="btn-danger" style={{ fontSize:".8125rem" }}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      <style>{`.animate-spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
