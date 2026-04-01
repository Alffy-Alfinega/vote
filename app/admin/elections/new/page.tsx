"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewElectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((p) => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.title || !form.start_date || !form.end_date) {
      setError("Please fill in all required fields.");
      return;
    }
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      setError("End date must be after start date.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/elections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create election");
      router.push(`/admin/elections/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-ash-300 mb-6">
        <Link href="/admin/elections" className="hover:text-forest-800 transition-colors">
          Elections
        </Link>
        <span>/</span>
        <span className="text-forest-800">New Election</span>
      </div>

      <h1 className="font-display text-3xl font-bold text-forest-800 mb-1">Create Election</h1>
      <p className="text-ash-300 text-sm mb-8">
        Set up a new election. You can add positions and candidates after saving.
      </p>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-forest-800 mb-1.5">
              Election Title <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              placeholder="e.g. Student Guild Elections 2025"
              value={form.title}
              onChange={set("title")}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-forest-800 mb-1.5">
              Description
            </label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Brief description of this election…"
              value={form.description}
              onChange={set("description")}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-forest-800 mb-1.5">
                Start Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="input"
                value={form.start_date}
                onChange={set("start_date")}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest-800 mb-1.5">
                End Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="input"
                value={form.end_date}
                onChange={set("end_date")}
                required
              />
            </div>
          </div>

          {/* Info box */}
          <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl px-4 py-3">
            <p className="text-xs text-forest-700">
              <strong>Next step:</strong> After creating the election, you&apos;ll be taken to the
              election page where you can add positions (e.g. Head Prefect, Sports Captain)
              and candidates for each position.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating…
                </>
              ) : (
                "Create Election →"
              )}
            </button>
            <Link href="/admin/elections" className="btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
