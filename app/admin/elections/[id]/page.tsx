"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Election = { id:number; title:string; description:string; start_date:string; end_date:string; status:string };
type Position  = { id:number; title:string; max_votes:number; candidate_count:number };
type Candidate = { id:number; position_id:number; name:string; class_name:string; bio:string; photo_url:string };

const STATUS_DOT: Record<string,string> = { draft:"#c2c9b9", active:"#10b981", closed:"#ef4444" };

function Badge({ status }: { status:string }) {
  const map: Record<string,string> = { draft:"badge-draft", active:"badge-active", closed:"badge-closed" };
  return (
    <span className={map[status]??"badge-draft"}>
      <span style={{ width:6,height:6,borderRadius:"50%",background:STATUS_DOT[status]??"#c2c9b9",display:"inline-block" }}/>
      {status}
    </span>
  );
}

export default function ElectionDetailPage() {
  const { id } = useParams<{ id:string }>();
  const [election, setElection]     = useState<Election|null>(null);
  const [positions, setPositions]   = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  const [showPos, setShowPos]   = useState(false);
  const [posForm, setPosForm]   = useState({ title:"", max_votes:"1" });
  const [posLoading, setPosLoading] = useState(false);

  const [showCand, setShowCand] = useState(false);
  const [candForm, setCandForm] = useState({ position_id:"", name:"", class_name:"", bio:"", photo_url:"" });
  const [candLoading, setCandLoading] = useState(false);

  const [statusLoading, setStatusLoading] = useState(false);

  const load = async () => {
    const [eR, pR, cR] = await Promise.all([
      fetch(`/api/elections/${id}`),
      fetch(`/api/positions?election_id=${id}`),
      fetch(`/api/candidates?election_id=${id}`),
    ]);
    setElection(await eR.json());
    setPositions(await pR.json());
    setCandidates(await cR.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  async function addPosition(e: React.FormEvent) {
    e.preventDefault(); setPosLoading(true); setError("");
    try {
      const res = await fetch("/api/positions", { method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ election_id:Number(id), title:posForm.title, max_votes:Number(posForm.max_votes) }) });
      if (!res.ok) throw new Error((await res.json()).error);
      setPosForm({ title:"", max_votes:"1" }); setShowPos(false); load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setPosLoading(false); }
  }

  async function addCandidate(e: React.FormEvent) {
    e.preventDefault(); setCandLoading(true); setError("");
    try {
      const res = await fetch("/api/candidates", { method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ ...candForm, position_id:Number(candForm.position_id) }) });
      if (!res.ok) throw new Error((await res.json()).error);
      setCandForm({ position_id:"", name:"", class_name:"", bio:"", photo_url:"" }); setShowCand(false); load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setCandLoading(false); }
  }

  async function delPos(posId: number) {
    if (!confirm("Delete this position and all its candidates?")) return;
    await fetch(`/api/positions/${posId}`, { method:"DELETE" }); load();
  }
  async function delCand(cId: number) {
    if (!confirm("Remove this candidate?")) return;
    await fetch(`/api/candidates/${cId}`, { method:"DELETE" }); load();
  }
  async function changeStatus(status: string) {
    setStatusLoading(true);
    await fetch(`/api/elections/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status }) });
    load(); setStatusLoading(false);
  }

  const grouped = positions.reduce<Record<number,Candidate[]>>((a,p) => {
    a[p.id] = candidates.filter(c => c.position_id === p.id); return a;
  }, {});

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"16rem" }}>
      <svg className="w-6 h-6 animate-spin" style={{ color:"var(--color-gold-500)" }} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  );
  if (!election) return <div style={{ padding:"2rem" }}><p style={{ color:"var(--color-ash-300)" }}>Election not found.</p></div>;

  return (
    <div style={{ padding:"1rem", maxWidth:"56rem", margin:"0 auto" }} className="sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div style={{ display:"flex", gap:".5rem", fontSize:".875rem", color:"var(--color-ash-300)", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        <Link href="/admin/elections" style={{ color:"inherit", textDecoration:"none" }}>Elections</Link>
        <span>/</span>
        <span style={{ color:"var(--color-forest-800)" }}>{election.title}</span>
      </div>

      {/* Election header card */}
      <div className="card" style={{ padding:"1.25rem sm:1.5rem", marginBottom:"1.5rem" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:".75rem", flexWrap:"wrap", marginBottom:".375rem" }}>
              <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(1.25rem,4vw,1.75rem)", fontWeight:700 }}>{election.title}</h1>
              <Badge status={election.status} />
            </div>
            {election.description && <p style={{ color:"var(--color-ash-300)", fontSize:".875rem", marginBottom:".5rem" }}>{election.description}</p>}
            <p style={{ fontSize:".75rem", color:"var(--color-ash-300)" }}>
              📅 {new Date(election.start_date).toLocaleString("en-UG")} → {new Date(election.end_date).toLocaleString("en-UG")}
            </p>
          </div>
          <div style={{ display:"flex", gap:".5rem", flexWrap:"wrap", flexShrink:0 }}>
            {election.status === "active" && (
              <Link href={`/results/${id}`} target="_blank" className="btn-ghost"
                style={{ border:"1px solid var(--color-ash-200)", fontSize:".8125rem" }}>
                📺 Live Screen
              </Link>
            )}
            {election.status === "draft" && (
              <button onClick={() => changeStatus("active")} disabled={statusLoading} className="btn-primary" style={{ fontSize:".875rem" }}>
                ▶ Activate
              </button>
            )}
            {election.status === "active" && (
              <button onClick={() => changeStatus("closed")} disabled={statusLoading} className="btn-ghost"
                style={{ border:"1px solid var(--color-ash-200)", fontSize:".875rem" }}>
                ⏹ Close
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:".75rem", padding:".75rem 1rem", marginBottom:"1rem" }}>
          <p style={{ fontSize:".875rem", color:"#dc2626" }}>{error}</p>
        </div>
      )}

      {/* Section header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem", flexWrap:"wrap", gap:".75rem" }}>
        <h2 style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:"1.125rem" }}>Positions & Candidates</h2>
        <div style={{ display:"flex", gap:".5rem" }}>
          <button onClick={() => { setShowCand(!showCand); setShowPos(false); }} className="btn-ghost"
            style={{ border:"1px solid var(--color-ash-200)", fontSize:".8125rem", padding:".5rem .875rem", minHeight:40 }}>
            + Candidate
          </button>
          <button onClick={() => { setShowPos(!showPos); setShowCand(false); }} className="btn-primary"
            style={{ fontSize:".8125rem", padding:".5rem .875rem", minHeight:40 }}>
            + Position
          </button>
        </div>
      </div>

      {/* Add position form */}
      {showPos && (
        <div className="card" style={{ padding:"1.25rem", marginBottom:"1rem", border:"1px solid color-mix(in srgb,var(--color-gold-500) 30%,transparent)" }}>
          <h3 style={{ fontWeight:500, marginBottom:".875rem", fontSize:".9375rem" }}>New Position</h3>
          <form onSubmit={addPosition} style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
            <input className="input" placeholder="Position title (e.g. Head Prefect)"
              value={posForm.title} onChange={e => setPosForm(p => ({...p, title:e.target.value}))} required />
            <div>
              <label style={{ display:"block", fontSize:".75rem", color:"var(--color-ash-300)", marginBottom:".375rem" }}>Max votes per student</label>
              <input type="number" min="1" max="10" className="input" value={posForm.max_votes}
                onChange={e => setPosForm(p => ({...p, max_votes:e.target.value}))} />
            </div>
            <div style={{ display:"flex", gap:".5rem" }}>
              <button type="submit" className="btn-primary" disabled={posLoading} style={{ fontSize:".875rem", padding:".625rem 1rem", minHeight:40 }}>
                {posLoading ? "Saving…" : "Add Position"}
              </button>
              <button type="button" onClick={() => setShowPos(false)} className="btn-ghost" style={{ fontSize:".875rem", padding:".625rem 1rem", minHeight:40 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Add candidate form */}
      {showCand && (
        <div className="card" style={{ padding:"1.25rem", marginBottom:"1rem", border:"1px solid color-mix(in srgb,var(--color-gold-500) 30%,transparent)" }}>
          <h3 style={{ fontWeight:500, marginBottom:".875rem", fontSize:".9375rem" }}>Add Candidate</h3>
          {positions.length === 0
            ? <p style={{ fontSize:".875rem", color:"var(--color-ash-300)" }}>Add a position first.</p>
            : (
              <form onSubmit={addCandidate} style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
                <select className="input" value={candForm.position_id}
                  onChange={e => setCandForm(p => ({...p, position_id:e.target.value}))} required>
                  <option value="">Select position…</option>
                  {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:".75rem" }}>
                  <input className="input" placeholder="Full name *" value={candForm.name}
                    onChange={e => setCandForm(p => ({...p, name:e.target.value}))} required />
                  <input className="input" placeholder="Class (e.g. S.4 West)" value={candForm.class_name}
                    onChange={e => setCandForm(p => ({...p, class_name:e.target.value}))} />
                </div>
                <textarea className="input textarea" rows={2} placeholder="Short bio (optional)"
                  value={candForm.bio} onChange={e => setCandForm(p => ({...p, bio:e.target.value}))} />
                <div>
                  <label style={{ display:"block", fontSize:".75rem", color:"var(--color-ash-300)", marginBottom:".375rem" }}>Photo URL (optional)</label>
                  <input className="input" placeholder="https://example.com/photo.jpg" value={candForm.photo_url}
                    onChange={e => setCandForm(p => ({...p, photo_url:e.target.value}))} />
                  {candForm.photo_url && (
                    <div style={{ marginTop:".5rem", display:"flex", alignItems:"center", gap:".75rem" }}>
                      <img src={candForm.photo_url} alt="preview" onError={e => (e.currentTarget.style.display="none")}
                        style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover", border:"2px solid var(--color-ash-200)" }}/>
                      <span style={{ fontSize:".75rem", color:"var(--color-ash-300)" }}>Preview</span>
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", gap:".5rem" }}>
                  <button type="submit" className="btn-primary" disabled={candLoading} style={{ fontSize:".875rem", padding:".625rem 1rem", minHeight:40 }}>
                    {candLoading ? "Saving…" : "Add Candidate"}
                  </button>
                  <button type="button" onClick={() => setShowCand(false)} className="btn-ghost" style={{ fontSize:".875rem", padding:".625rem 1rem", minHeight:40 }}>Cancel</button>
                </div>
              </form>
            )}
        </div>
      )}

      {/* Positions list */}
      {positions.length === 0 ? (
        <div className="card" style={{ padding:"3rem 1rem", textAlign:"center" }}>
          <p style={{ fontSize:"2.5rem", marginBottom:".75rem" }}>📋</p>
          <p style={{ fontWeight:500 }}>No positions yet</p>
          <p style={{ color:"var(--color-ash-300)", fontSize:".875rem", marginTop:".375rem" }}>Add positions like "Head Prefect" or "Sports Captain".</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {positions.map(pos => (
            <div key={pos.id} className="card" style={{ overflow:"hidden" }}>
              <div style={{ padding:"1rem", background:"rgba(13,40,24,.03)", borderBottom:"1px solid var(--color-ash-100)",
                display:"flex", alignItems:"center", justifyContent:"space-between", gap:".75rem", flexWrap:"wrap" }}>
                <div>
                  <h3 style={{ fontFamily:"var(--font-display)", fontWeight:600 }}>{pos.title}</h3>
                  <p style={{ fontSize:".75rem", color:"var(--color-ash-300)", marginTop:".125rem" }}>
                    Max {pos.max_votes} vote{pos.max_votes!==1?"s":""} · {pos.candidate_count} candidate{pos.candidate_count!==1?"s":""}
                  </p>
                </div>
                <button onClick={() => delPos(pos.id)} className="btn-danger" style={{ fontSize:".8125rem", minHeight:36 }}>Delete</button>
              </div>
              {(grouped[pos.id]??[]).length === 0
                ? <p style={{ padding:"1rem", fontSize:".875rem", color:"var(--color-ash-300)", fontStyle:"italic" }}>No candidates yet.</p>
                : (
                  <ul style={{ listStyle:"none", margin:0, padding:0 }}>
                    {(grouped[pos.id]??[]).map(c => (
                      <li key={c.id} style={{ padding:"1rem", borderBottom:"1px solid var(--color-ash-100)", display:"flex", alignItems:"center", gap:".875rem" }}>
                        <div style={{ width:36,height:36,borderRadius:"50%",flexShrink:0,overflow:"hidden",
                          border:"2px solid var(--color-ash-100)" }}>
                          {c.photo_url
                            ? <img src={c.photo_url} alt={c.name} style={{ width:"100%",height:"100%",objectFit:"cover" }}
                                onError={e => { e.currentTarget.style.display="none"; (e.currentTarget.nextSibling as HTMLElement).style.display="flex"; }}/>
                            : null}
                          <div style={{ width:"100%",height:"100%",background:"rgba(13,40,24,.08)",display:c.photo_url?"none":"flex",
                            alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontWeight:700,fontSize:".9375rem" }}>
                            {c.name.charAt(0)}
                          </div>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontWeight:500, fontSize:".9375rem" }}>{c.name}</p>
                          {c.class_name && <p style={{ fontSize:".75rem", color:"var(--color-ash-300)" }}>{c.class_name}</p>}
                          {c.bio && <p style={{ fontSize:".75rem", color:"var(--color-ash-300)", marginTop:".125rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.bio}</p>}
                        </div>
                        <button onClick={() => delCand(c.id)} className="btn-danger" style={{ fontSize:".75rem", flexShrink:0, minHeight:36 }}>Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
