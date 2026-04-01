"use client";

import { useEffect, useState } from "react";

type Student = {
  id: number; student_id: string; name: string; class_name: string; created_at: string;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [search, setSearch]     = useState("");

  const [form, setForm] = useState({
    student_id: "", name: "", class_name: "", pin: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch("/api/students");
    setStudents(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add student");
      setForm({ student_id: "", name: "", class_name: "", pin: "" });
      setShowForm(false);
      setSuccess(`${data.name} added successfully.`);
      load();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Remove ${name} from the system?`)) return;
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase()) ||
      s.class_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest-800">Students</h1>
          <p className="text-ash-300 mt-1 text-sm">
            {students.length} registered student{students.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + Add Student
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-emerald-700">✓ {success}</p>
        </div>
      )}

      {/* Add student form */}
      {showForm && (
        <div className="card p-6 mb-6 border-gold-500/30 border">
          <h2 className="font-display font-semibold text-forest-800 mb-4">New Student</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-forest-800 mb-1.5">
                  Student ID <span className="text-red-500">*</span>
                </label>
                <input className="input" placeholder="e.g. S2024001" value={form.student_id} onChange={set("student_id")} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-forest-800 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input className="input" placeholder="e.g. Aisha Nakato" value={form.name} onChange={set("name")} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-forest-800 mb-1.5">Class</label>
                <input className="input" placeholder="e.g. S.4 East" value={form.class_name} onChange={set("class_name")} />
              </div>
              <div>
                <label className="block text-xs font-medium text-forest-800 mb-1.5">
                  PIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="password" className="input" placeholder="4-digit PIN" maxLength={8}
                  value={form.pin} onChange={set("pin")} required
                />
              </div>
            </div>

            <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl px-4 py-3">
              <p className="text-xs text-forest-700">
                The PIN is hashed before storage. Share it privately with the student — it cannot be recovered.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving…" : "Add Student"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(""); }} className="btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ash-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="input pl-10"
          placeholder="Search by name, ID, or class…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <svg className="w-6 h-6 animate-spin text-gold-500 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">🎓</p>
            <p className="font-medium text-forest-800">
              {search ? "No students match your search" : "No students yet"}
            </p>
            {!search && (
              <p className="text-ash-300 text-sm mt-1">Add students so they can log in and vote.</p>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-ash-50 border-b border-ash-100">
              <tr>
                {["Student", "ID", "Class", "Registered", ""].map((h) => (
                  <th key={h} className="table-cell table-head text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-forest-800/10 flex items-center justify-center font-display font-bold text-forest-800 text-xs flex-shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-medium text-forest-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="table-cell font-mono text-xs text-ash-300">{s.student_id}</td>
                  <td className="table-cell text-ash-300">{s.class_name || "—"}</td>
                  <td className="table-cell text-xs text-ash-300">
                    {new Date(s.created_at).toLocaleDateString("en-UG", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="table-cell">
                    <button onClick={() => handleDelete(s.id, s.name)} className="btn-danger text-xs">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
