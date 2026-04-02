"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteElectionButton({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${title}"? This will remove all positions, candidates and votes. This cannot be undone.`)) return;
    setLoading(true);
    await fetch(`/api/elections/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="btn-danger"
      style={{ border:"1px solid #fecaca", fontSize:".875rem", minHeight:40, padding:".5rem .875rem" }}>
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
