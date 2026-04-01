import Link from "next/link";
import { getElections } from "@/lib/db";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "badge-draft", active: "badge-active", closed: "badge-closed",
  };
  const dot: Record<string, string> = {
    draft: "bg-ash-300", active: "bg-emerald-500", closed: "bg-red-400",
  };
  return (
    <span className={map[status] ?? "badge-draft"}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] ?? "bg-ash-300"}`} />
      {status}
    </span>
  );
}

export default async function ElectionsPage() {
  const elections = await getElections();

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest-800">Elections</h1>
          <p className="text-ash-300 mt-1 text-sm">Manage all school elections.</p>
        </div>
        <Link href="/admin/elections/new" className="btn-primary">
          + New Election
        </Link>
      </div>

      {elections.length === 0 ? (
        <div className="card py-20 text-center">
          <p className="text-5xl mb-4">🗳️</p>
          <p className="font-display text-xl font-semibold text-forest-800">No elections yet</p>
          <p className="text-ash-300 text-sm mt-2">Create your first election to get started.</p>
          <Link href="/admin/elections/new" className="btn-primary mt-6 inline-flex">
            Create Election
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {elections.map((e: any) => (
            <div key={e.id} className="card p-6 flex items-center gap-6 hover:shadow-md transition-shadow">
              {/* Status indicator */}
              <div
                className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                  e.status === "active" ? "bg-emerald-500" :
                  e.status === "closed" ? "bg-red-400" : "bg-ash-200"
                }`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="font-display font-semibold text-forest-800 text-lg">{e.title}</h2>
                  <StatusBadge status={e.status} />
                </div>
                {e.description && (
                  <p className="text-ash-300 text-sm line-clamp-1">{e.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-ash-300">
                    📋 {e.position_count} position{e.position_count !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-ash-300">
                    👤 {e.candidate_count} candidate{e.candidate_count !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-ash-300">
                    📅 {new Date(e.start_date).toLocaleDateString("en-UG", { day: "numeric", month: "short" })}
                    {" → "}
                    {new Date(e.end_date).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              <Link href={`/admin/elections/${e.id}`} className="btn-ghost flex-shrink-0">
                Manage →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
