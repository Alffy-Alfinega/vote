import Link from "next/link";
import { getElections } from "@/lib/db";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string,string> = { draft:"badge-draft", active:"badge-active", closed:"badge-closed" };
  const dot: Record<string,string> = { draft:"bg-ash-300", active:"bg-emerald-500", closed:"bg-red-400" };
  return (
    <span className={map[status]??"badge-draft"}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status]??"bg-ash-300"}`}/>
      {status}
    </span>
  );
}

export default async function ElectionsPage() {
  const elections = await getElections();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-forest-800">Elections</h1>
          <p className="text-ash-300 mt-1 text-sm">Manage all school elections.</p>
        </div>
        <Link href="/admin/elections/new" className="btn-primary flex-shrink-0">
          <span className="hidden sm:inline">+ New Election</span>
          <span className="sm:hidden">+ New</span>
        </Link>
      </div>

      {elections.length === 0 ? (
        <div className="card py-20 text-center px-4">
          <p className="text-5xl mb-4">🗳️</p>
          <p className="font-display text-xl font-semibold text-forest-800">No elections yet</p>
          <p className="text-ash-300 text-sm mt-2">Create your first election to get started.</p>
          <Link href="/admin/elections/new" className="btn-primary mt-6 inline-flex">Create Election</Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {elections.map((e: any) => (
            <div key={e.id} className="card p-4 sm:p-5 lg:p-6 flex items-stretch gap-4 hover:shadow-md transition-shadow">
              {/* Status strip */}
              <div className={`w-1 rounded-full flex-shrink-0 ${e.status==="active"?"bg-emerald-500":e.status==="closed"?"bg-red-400":"bg-ash-200"}`}/>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="font-display font-semibold text-forest-800 text-base sm:text-lg leading-tight">{e.title}</h2>
                  <StatusBadge status={e.status}/>
                </div>
                {e.description && <p className="text-ash-300 text-sm line-clamp-1 mb-2">{e.description}</p>}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-xs text-ash-300">📋 {e.position_count} position{e.position_count!==1?"s":""}</span>
                  <span className="text-xs text-ash-300">👤 {e.candidate_count} candidate{e.candidate_count!==1?"s":""}</span>
                  <span className="text-xs text-ash-300">
                    📅 {new Date(e.start_date).toLocaleDateString("en-UG",{day:"numeric",month:"short"})} → {new Date(e.end_date).toLocaleDateString("en-UG",{day:"numeric",month:"short",year:"numeric"})}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                <Link href={`/results/${e.id}`} target="_blank"
                  className="text-xs text-ash-300 hover:text-gold-600 transition-colors font-medium hidden sm:inline">
                  Live ↗
                </Link>
                <Link href={`/admin/elections/${e.id}`} className="btn-ghost text-xs px-3 py-2 border border-ash-200">
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
