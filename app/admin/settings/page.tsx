"use client";
import { useState } from "react";

export default function SettingsPage() {
  const [form, setForm]       = useState({ current_password:"", new_password:"", confirm_password:"" });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSuccess("");
    if (form.new_password !== form.confirm_password) { setError("New passwords do not match."); return; }
    if (form.new_password.length < 6) { setError("New password must be at least 6 characters."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ current_password:form.current_password, new_password:form.new_password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm({ current_password:"", new_password:"", confirm_password:"" });
      setSuccess("Password changed successfully.");
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ padding:"1rem", maxWidth:"42rem", margin:"0 auto" }} className="sm:p-6 lg:p-8">
      <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(1.5rem,4vw,2rem)", fontWeight:700, color:"var(--color-forest-800)", marginBottom:".25rem" }}>Settings</h1>
      <p style={{ color:"var(--color-ash-300)", fontSize:".875rem", marginBottom:"2rem" }}>Manage your admin account.</p>

      <div className="card" style={{ padding:"1.5rem" }}>
        <h2 style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:"1.125rem", marginBottom:"1.25rem" }}>Change Password</h2>
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div>
            <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".5rem" }}>Current Password</label>
            <input type="password" className="input" placeholder="••••••••" value={form.current_password}
              onChange={e => setForm(p => ({...p, current_password:e.target.value}))} required/>
          </div>
          <div>
            <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".5rem" }}>New Password</label>
            <input type="password" className="input" placeholder="Min 6 characters" value={form.new_password}
              onChange={e => setForm(p => ({...p, new_password:e.target.value}))} required/>
          </div>
          <div>
            <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".5rem" }}>Confirm New Password</label>
            <input type="password" className="input" placeholder="Repeat new password" value={form.confirm_password}
              onChange={e => setForm(p => ({...p, confirm_password:e.target.value}))} required/>
          </div>
          {error   && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:".75rem", padding:".75rem 1rem" }}><p style={{ fontSize:".875rem", color:"#dc2626" }}>{error}</p></div>}
          {success && <div style={{ background:"#ecfdf5", border:"1px solid #6ee7b7", borderRadius:".75rem", padding:".75rem 1rem" }}><p style={{ fontSize:".875rem", color:"#065f46" }}>✓ {success}</p></div>}
          <button type="submit" className="btn-primary" disabled={saving} style={{ alignSelf:"flex-start" }}>
            {saving ? "Saving…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
