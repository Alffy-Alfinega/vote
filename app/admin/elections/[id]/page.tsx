"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Election = { id:number; title:string; description:string; start_date:string; end_date:string; status:string };
type Position = { id:number; title:string; max_votes:number; candidate_count:number };
type Candidate = { id:number; position_id:number; name:string; class_name:string; bio:string };

function StatusBadge({ status }: { status: string }) {
  const map: Record<string,string> = { draft:"badge-draft", active:"badge-active", closed:"badge-closed" };
  const dot: Record<string,string> = { draft:"bg-ash-300", active:"bg-emerald-500", closed:"bg-red-400" };
  return <span className={map[status]??"badge-draft"}><span className={`w-1.5 h-1.5 rounded-full ${dot[status]??"bg-ash-300"}`}/>{status}</span>;
}

export default function ElectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [election, setElection] = useState<Election|null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPosForm, setShowPosForm] = useState(false);
  const [posForm, setPosForm] = useState({ title:"", max_votes:"1" });
  const [posLoading, setPosLoading] = useState(false);
  const [showCandForm, setShowCandForm] = useState(false);
  const [candForm, setCandForm] = useState({ position_id:"", name:"", class_name:"", bio:"" });
  const [candLoading, setCandLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const [eRes,pRes,cRes] = await Promise.all([
      fetch(`/api/elections/${id}`), fetch(`/api/positions?election_id=${id}`), fetch(`/api/candidates?election_id=${id}`)
    ]);
    setElection(await eRes.json()); setPositions(await pRes.json()); setCandidates(await cRes.json()); setLoading(false);
  };
  useEffect(()=>{ load(); },[id]);

  async function addPosition(e: React.FormEvent) {
    e.preventDefault(); setPosLoading(true); setError("");
    try {
      const res = await fetch("/api/positions",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ election_id:Number(id), ...posForm, max_votes:Number(posForm.max_votes) }) });
      if (!res.ok) throw new Error((await res.json()).error);
      setPosForm({ title:"", max_votes:"1" }); setShowPosForm(false); load();
    } catch(err: any){ setError(err.message); }
    finally { setPosLoading(false); }
  }

  async function addCandidate(e: React.FormEvent) {
    e.preventDefault(); setCandLoading(true); setError("");
    try {
      const res = await fetch("/api/candidates",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...candForm, position_id:Number(candForm.position_id) }) });
      if (!res.ok) throw new Error((await res.json()).error);
      setCandForm({ position_id:"", name:"", class_name:"", bio:"" }); setShowCandForm(false); load();
    } catch(err: any){ setError(err.message); }
    finally { setCandLoading(false); }
  }

  async function deletePosition(posId: number) {
    if (!confirm("Delete this position and all its candidates?")) return;
    await fetch(`/api/positions/${posId}`,{ method:"DELETE" }); load();
  }

  async function deleteCandidate(cId: number) {
    if (!confirm("Remove this candidate?")) return;
    await fetch(`/api/candidates/${cId}`,{ method:"DELETE" }); load();
  }

  async function changeStatus(status: string) {
    setStatusLoading(true);
    await fetch(`/api/elections/${id}`,{ method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status }) });
    load(); setStatusLoading(false);
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <svg className="w-6 h-6 animate-spin text-gold-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
    </div>
  );
  if (!election) return <div className="p-8"><p className="text-ash-300">Election not found.</p></div>;

  const grouped = positions.reduce<Record<number,Candidate[]>>((acc,p) => {
    acc[p.id] = candidates.filter(c => c.position_id===p.id); return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-ash-300 mb-5">
        <Link href="/admin/elections" className="hover:text-forest-800 transition-colors">Elections</Link>
        <span>/</span>
        <span className="text-forest-800 truncate max-w-[180px] sm:max-w-none">{election.title}</span>
      </div>

      {/* Election header card */}
      <div className="card p-4 sm:p-6 mb-5 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-forest-800">{election.title}</h1>
              <StatusBadge status={election.status}/>
            </div>
            {election.description && <p className="text-ash-300 text-sm">{election.description}</p>}
            <p className="text-xs text-ash-300 mt-2">
              📅 {new Date(election.start_date).toLocaleString("en-UG")} → {new Date(election.end_date).toLocaleString("en-UG")}
            </p>
          </div>
          <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
            <Link href={`/results/${election.id}`} target="_blank"
              className="btn-ghost text-xs px-3 py-2 border border-ash-200 flex-1 sm:flex-initial">
              📺 Live Results ↗
            </Link>
            {election.status==="draft" && (
              <button onClick={()=>changeStatus("active")} disabled={statusLoading} className="btn-primary text-xs px-3 py-2 flex-1 sm:flex-initial">▶ Activate</button>
            )}
            {election.status==="active" && (
              <button onClick={()=>changeStatus("closed")} disabled={statusLoading} className="btn-ghost text-xs px-3 py-2 border border-ash-200 flex-1 sm:flex-initial">⏹ Close</button>
            )}
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4"><p className="text-sm text-red-600">{error}</p></div>}

      {/* Section header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <h2 className="font-display font-semibold text-forest-800 text-lg flex-1">Positions & Candidates</h2>
        <div className="flex gap-2">
          <button onClick={()=>{ setShowCandForm(!showCandForm); setShowPosForm(false); }} className="btn-ghost text-xs border border-ash-200 flex-1 sm:flex-initial">+ Candidate</button>
          <button onClick={()=>{ setShowPosForm(!showPosForm); setShowCandForm(false); }} className="btn-primary text-xs px-3 py-2 flex-1 sm:flex-initial">+ Position</button>
        </div>
      </div>

      {/* Add position form */}
      {showPosForm && (
        <div className="card p-4 sm:p-5 mb-4 border-gold-500/30 border">
          <h3 className="font-medium text-forest-800 mb-4 text-sm">New Position</h3>
          <form onSubmit={addPosition} className="space-y-3">
            <input className="input" placeholder="Position title (e.g. Head Prefect)" value={posForm.title}
              onChange={e=>setPosForm(p=>({...p,title:e.target.value}))} required/>
            <div>
              <label className="block text-xs text-ash-300 mb-1">Max votes per student</label>
              <input type="number" min="1" max="10" className="input" value={posForm.max_votes}
                onChange={e=>setPosForm(p=>({...p,max_votes:e.target.value}))}/>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={posLoading} className="btn-primary text-xs px-4 py-2 flex-1 sm:flex-initial">{posLoading?"Saving…":"Add Position"}</button>
              <button type="button" onClick={()=>setShowPosForm(false)} className="btn-ghost text-xs flex-1 sm:flex-initial">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Add candidate form */}
      {showCandForm && (
        <div className="card p-4 sm:p-5 mb-4 border-gold-500/30 border">
          <h3 className="font-medium text-forest-800 mb-4 text-sm">Add Candidate</h3>
          {positions.length===0 ? (
            <p className="text-sm text-ash-300">Add at least one position first.</p>
          ) : (
            <form onSubmit={addCandidate} className="space-y-3">
              <select className="input" value={candForm.position_id}
                onChange={e=>setCandForm(p=>({...p,position_id:e.target.value}))} required>
                <option value="">Select position…</option>
                {positions.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className="input" placeholder="Full name *" value={candForm.name}
                  onChange={e=>setCandForm(p=>({...p,name:e.target.value}))} required/>
                <input className="input" placeholder="Class (e.g. S.4 West)" value={candForm.class_name}
                  onChange={e=>setCandForm(p=>({...p,class_name:e.target.value}))}/>
              </div>
              <textarea className="textarea" rows={2} placeholder="Short bio (optional)" value={candForm.bio}
                onChange={e=>setCandForm(p=>({...p,bio:e.target.value}))}/>
              <div className="flex gap-2">
                <button type="submit" disabled={candLoading} className="btn-primary text-xs px-4 py-2 flex-1 sm:flex-initial">{candLoading?"Saving…":"Add Candidate"}</button>
                <button type="button" onClick={()=>setShowCandForm(false)} className="btn-ghost text-xs flex-1 sm:flex-initial">Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Positions list */}
      {positions.length===0 ? (
        <div className="card py-12 text-center px-4">
          <p className="text-3xl mb-2">📋</p>
          <p className="font-medium text-forest-800">No positions yet</p>
          <p className="text-ash-300 text-sm mt-1">Add positions like "Head Prefect" or "Sports Captain".</p>
        </div>
      ) : (
        <div className="space-y-4">
          {positions.map(pos=>(
            <div key={pos.id} className="card overflow-hidden">
              <div className="px-4 sm:px-5 py-4 bg-forest-800/[0.03] border-b border-ash-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-forest-800 truncate">{pos.title}</h3>
                  <p className="text-xs text-ash-300 mt-0.5">Max {pos.max_votes} vote{pos.max_votes!==1?"s":""} · {pos.candidate_count} candidate{pos.candidate_count!==1?"s":""}</p>
                </div>
                <button onClick={()=>deletePosition(pos.id)} className="btn-danger text-xs flex-shrink-0">Delete</button>
              </div>
              {(grouped[pos.id]??[]).length===0 ? (
                <div className="px-4 sm:px-5 py-4">
                  <p className="text-xs text-ash-300 italic">No candidates yet — use "+ Candidate" above.</p>
                </div>
              ) : (
                <ul className="divide-y divide-ash-100">
                  {(grouped[pos.id]??[]).map(c=>(
                    <li key={c.id} className="px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-ash-50 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-forest-800/10 flex items-center justify-center font-display font-bold text-forest-800 text-sm flex-shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-forest-800 text-sm truncate">{c.name}</p>
                        {c.class_name && <p className="text-xs text-ash-300">{c.class_name}</p>}
                        {c.bio && <p className="text-xs text-ash-300 line-clamp-1 mt-0.5">{c.bio}</p>}
                      </div>
                      <button onClick={()=>deleteCandidate(c.id)} className="btn-danger text-xs flex-shrink-0">Remove</button>
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
