export const dynamic = "force-dynamic";
import Link from "next/link";
import { getElections } from "@/lib/db";
import DeleteElectionButton from "./DeleteElectionButton";

function Badge({ status }: { status: string }) {
  const map: Record<string,string> = { draft:"badge-draft", active:"badge-active", closed:"badge-closed" };
  const dot: Record<string,string> = { draft:"#c2c9b9", active:"#10b981", closed:"#ef4444" };
  return (
    <span className={map[status]??"badge-draft"}>
      <span style={{ width:6,height:6,borderRadius:"50%",background:dot[status]??"#c2c9b9",display:"inline-block" }}/>
      {status}
    </span>
  );
}

export default async function ElectionsPage() {
  const elections = await getElections() as any[];
  return (
    <div style={{ padding:"1rem", maxWidth:"72rem", margin:"0 auto" }} className="sm:p-6 lg:p-8">
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        <div>
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(1.5rem,4vw,2rem)", fontWeight:700, color:"var(--color-forest-800)" }}>Elections</h1>
          <p style={{ color:"var(--color-ash-300)", fontSize:".875rem", marginTop:".25rem" }}>{elections.length} election{elections.length!==1?"s":""}</p>
        </div>
        <Link href="/admin/elections/new" className="btn-primary">+ New Election</Link>
      </div>

      {elections.length === 0 ? (
        <div className="card" style={{ padding:"5rem 1rem", textAlign:"center" }}>
          <p style={{ fontSize:"3rem", marginBottom:"1rem" }}>🗳️</p>
          <p style={{ fontFamily:"var(--font-display)", fontSize:"1.25rem", fontWeight:600 }}>No elections yet</p>
          <Link href="/admin/elections/new" className="btn-primary" style={{ marginTop:"1.5rem" }}>Create Election</Link>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {elections.map((e: any) => (
            <div key={e.id} className="card" style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"1.25rem", flexWrap:"wrap" }}>
              <div style={{ width:4, alignSelf:"stretch", borderRadius:4, flexShrink:0,
                background: e.status==="active"?"#10b981":e.status==="closed"?"#ef4444":"var(--color-ash-200)" }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:".75rem", flexWrap:"wrap", marginBottom:".375rem" }}>
                  <h2 style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:"1.125rem" }}>{e.title}</h2>
                  <Badge status={e.status} />
                </div>
                {e.description && <p style={{ color:"var(--color-ash-300)", fontSize:".8125rem", marginBottom:".5rem" }}>{e.description}</p>}
                <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
                  <span style={{ fontSize:".75rem", color:"var(--color-ash-300)" }}>📋 {e.position_count} position{e.position_count!==1?"s":""}</span>
                  <span style={{ fontSize:".75rem", color:"var(--color-ash-300)" }}>👤 {e.candidate_count} candidate{e.candidate_count!==1?"s":""}</span>
                  <span style={{ fontSize:".75rem", color:"var(--color-ash-300)" }}>
                    📅 {new Date(e.start_date).toLocaleDateString("en-UG",{day:"numeric",month:"short",year:"numeric"})} → {new Date(e.end_date).toLocaleDateString("en-UG",{day:"numeric",month:"short",year:"numeric"})}
                  </span>
                </div>
              </div>
              <div style={{ display:"flex", gap:".5rem", flexShrink:0, flexWrap:"wrap" }}>
                <Link href={`/admin/elections/${e.id}`} className="btn-ghost" style={{ border:"1px solid var(--color-ash-200)", fontSize:".875rem" }}>
                  Manage →
                </Link>
                <DeleteElectionButton id={e.id} title={e.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
