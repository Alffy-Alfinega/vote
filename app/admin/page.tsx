export const dynamic = "force-dynamic";
import Link from "next/link";
import { getDashboardStats, getElections } from "@/lib/db";

function StatusBadge({ status }: { status: string }) {
  const cls = { draft: "badge-draft", active: "badge-active", closed: "badge-closed" } as Record<string,string>;
  const dot = { draft: "bg-ash-300", active: "bg-emerald-500", closed: "bg-red-400" } as Record<string,string>;
  return (
    <span className={cls[status] ?? "badge-draft"}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] ?? "bg-ash-300"}`} />
      {status}
    </span>
  );
}

export default async function AdminDashboard() {
  const [stats, electionsRaw] = await Promise.all([getDashboardStats(), getElections()]);
  const elections = electionsRaw as any[];

  const statCards = [
    { label: "Elections",  value: stats.elections,   icon: "🗳️", href: "/admin/elections" },
    { label: "Students",   value: stats.students,    icon: "🎓", href: "/admin/students"  },
    { label: "Candidates", value: stats.candidates,  icon: "👤", href: "/admin/elections" },
    { label: "Votes Cast", value: stats.votes,       icon: "✅", href: "/admin/elections" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 lg:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-forest-800">Dashboard</h1>
        <p className="text-ash-300 mt-1 text-sm">Welcome back — here's your election overview.</p>
      </div>

      {/* Stat cards — 2 cols on mobile, 4 on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        {statCards.map((s) => (
          <Link href={s.href} key={s.label} className="card p-4 sm:p-5 hover:shadow-md transition-shadow group">
            <div className="text-xl sm:text-2xl mb-2 sm:mb-3">{s.icon}</div>
            <p className="text-2xl sm:text-3xl font-display font-bold text-forest-800 group-hover:text-forest-600 transition-colors">
              {s.value.toLocaleString()}
            </p>
            <p className="text-xs text-ash-300 mt-0.5">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Setup reminder if no elections */}
      {elections.length === 0 && (
        <div className="card p-4 sm:p-5 mb-6 border-gold-500/30 border bg-gold-500/5">
          <p className="text-sm font-medium text-forest-800 mb-1">🚀 Getting started</p>
          <p className="text-xs text-ash-300 mb-3">
            Make sure your database is set up. If you see errors, visit{" "}
            <code className="bg-ash-100 px-1.5 py-0.5 rounded text-forest-700">/api/setup</code>{" "}
            once to initialise all tables.
          </p>
          <Link href="/admin/elections/new" className="btn-primary text-sm px-4 py-2.5 inline-flex" style={{minHeight:'auto'}}>
            Create your first election →
          </Link>
        </div>
      )}

      {/* Recent elections */}
      <div className="card overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-ash-100 flex items-center justify-between gap-3">
          <h2 className="font-display font-semibold text-forest-800 text-base sm:text-lg">Recent Elections</h2>
          <Link href="/admin/elections/new" className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2" style={{minHeight:'auto'}}>
            + New
          </Link>
        </div>

        {elections.length === 0 ? (
          <div className="py-12 sm:py-16 text-center px-4">
            <p className="text-4xl mb-3">🗳️</p>
            <p className="text-forest-800 font-medium">No elections yet</p>
            <p className="text-ash-300 text-sm mt-1">Create your first election to get started.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-ash-100">
              {elections.map((e: any) => (
                <Link href={`/admin/elections/${e.id}`} key={e.id} className="block p-4 hover:bg-ash-50 active:bg-ash-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-forest-800 text-sm leading-snug">{e.title}</p>
                    <StatusBadge status={e.status} />
                  </div>
                  <div className="flex gap-3 text-xs text-ash-300">
                    <span>📋 {e.position_count} pos</span>
                    <span>👤 {e.candidate_count} cand</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-ash-50 border-b border-ash-100">
                  <tr>
                    {["Election","Positions","Candidates","Dates","Status",""].map((h) => (
                      <th key={h} className="table-cell table-head text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {elections.map((e: any) => (
                    <tr key={e.id} className="table-row">
                      <td className="table-cell">
                        <p className="font-medium text-forest-800">{e.title}</p>
                        {e.description && <p className="text-xs text-ash-300 mt-0.5 line-clamp-1">{e.description}</p>}
                      </td>
                      <td className="table-cell text-ash-300">{e.position_count}</td>
                      <td className="table-cell text-ash-300">{e.candidate_count}</td>
                      <td className="table-cell text-xs text-ash-300">
                        <p>{new Date(e.start_date).toLocaleDateString("en-UG",{day:"numeric",month:"short",year:"numeric"})}</p>
                        <p>→ {new Date(e.end_date).toLocaleDateString("en-UG",{day:"numeric",month:"short",year:"numeric"})}</p>
                      </td>
                      <td className="table-cell"><StatusBadge status={e.status} /></td>
                      <td className="table-cell">
                        <Link href={`/admin/elections/${e.id}`} className="text-gold-600 text-xs font-medium hover:text-gold-500">Manage →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
