"use client";
import { useState } from "react";

type Candidate = { id:number; name:string; class_name:string; bio:string };
type Position = { id:number; title:string; max_votes:number; candidates:Candidate[] };
type Election = { id:number; title:string; description:string; end_date:string };

export default function VotePage() {
  const [step, setStep] = useState<"login"|"ballot"|"done">("login");
  const [loginForm, setLoginForm] = useState({ student_id:"", pin:"" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [election, setElection] = useState<Election|null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedElection, setSelectedElection] = useState<number|null>(null);
  const [selections, setSelections] = useState<Record<number,number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoginLoading(true); setLoginError("");
    try {
      const res = await fetch("/api/elections/active");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.length===0) throw new Error("No active elections right now.");
      await loadBallot(data[0].id);
    } catch(err: any){ setLoginError(err.message); }
    finally { setLoginLoading(false); }
  }

  async function loadBallot(electionId: number) {
    const [elecRes, posRes] = await Promise.all([
      fetch(`/api/elections/${electionId}`), fetch(`/api/positions?election_id=${electionId}`)
    ]);
    const elec = await elecRes.json();
    const posData = await posRes.json();
    const posWithCandidates: Position[] = await Promise.all(
      posData.map(async (p: any) => {
        const candRes = await fetch(`/api/candidates?position_id=${p.id}`);
        return { ...p, candidates: await candRes.json() };
      })
    );
    setElection(elec); setPositions(posWithCandidates); setSelectedElection(electionId); setStep("ballot");
  }

  async function handleSubmit() {
    setSubmitting(true); setSubmitError("");
    try {
      const res = await fetch("/api/vote",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          student_id: loginForm.student_id, pin: loginForm.pin,
          election_id: selectedElection,
          selections: Object.entries(selections).map(([pos,cand])=>({ position_id:Number(pos), candidate_id:Number(cand) }))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("done");
    } catch(err: any){ setSubmitError(err.message); }
    finally { setSubmitting(false); }
  }

  const allAnswered = positions.every(p => selections[p.id]!==undefined);

  // ── DONE ──────────────────────────────────────────────────────────────────
  if (step==="done") return (
    <div className="min-h-screen bg-forest-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-forest-800 mb-2">Vote Cast!</h1>
        <p className="text-ash-300 text-sm">Your ballot has been recorded securely. Thank you for participating.</p>
        <div className="mt-5 bg-ash-50 rounded-xl p-4">
          <p className="text-xs text-ash-300">Your choices are anonymous and cannot be traced back to you.</p>
        </div>
      </div>
    </div>
  );

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  if (step==="login") return (
    <div className="min-h-screen bg-forest-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage:"radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize:"32px 32px" }}/>
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gold-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold-500/20">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-forest-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Cast Your Vote</h1>
          <p className="text-white/40 text-sm mt-1">Enter your credentials to begin</p>
        </div>
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/40">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-forest-800 mb-1.5">Student ID</label>
              <input className="input" placeholder="e.g. S2024001" value={loginForm.student_id}
                onChange={e=>setLoginForm(p=>({...p,student_id:e.target.value}))} required/>
            </div>
            <div>
              <label className="block text-xs font-medium text-forest-800 mb-1.5">PIN</label>
              <input type="password" className="input" placeholder="Your secret PIN" value={loginForm.pin}
                onChange={e=>setLoginForm(p=>({...p,pin:e.target.value}))} required/>
            </div>
            {loginError && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="text-sm text-red-600">{loginError}</p></div>}
            <button type="submit" disabled={loginLoading} className="btn-primary w-full py-3">
              {loginLoading?"Loading ballot…":"Continue →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  // ── BALLOT ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-ash-50">
      {/* Sticky header */}
      <div className="bg-forest-800 text-white px-4 sm:px-6 py-3 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display font-bold text-sm sm:text-base lg:text-lg truncate">{election?.title}</h1>
            <p className="text-white/50 text-xs">ID: {loginForm.student_id}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xs text-white/50">{Object.keys(selections).length}/{positions.length}</p>
            <p className="text-xs text-white/30 hidden sm:block">answered</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-4 sm:space-y-6">
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-ash-200 rounded-full overflow-hidden">
          <div className="h-full bg-gold-500 rounded-full transition-all duration-500"
            style={{ width:`${positions.length?(Object.keys(selections).length/positions.length)*100:0}%` }}/>
        </div>

        {positions.map((position, idx)=>(
          <div key={position.id} className="card overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-ash-100 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-forest-800 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{idx+1}</span>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-semibold text-forest-800 text-sm sm:text-base truncate">{position.title}</h2>
                <p className="text-xs text-ash-300">Choose one candidate</p>
              </div>
              {selections[position.id] && (
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              )}
            </div>
            <div className="p-2.5 sm:p-3 space-y-2">
              {position.candidates.map(c=>{
                const selected = selections[position.id]===c.id;
                return (
                  <button key={c.id} onClick={()=>setSelections(p=>({...p,[position.id]:c.id}))}
                    className={`w-full text-left px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-xl border-2 transition-all duration-150 ${
                      selected?"border-gold-500 bg-gold-500/5":"border-ash-200 hover:border-ash-300 bg-white"
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0 ${
                        selected?"bg-gold-500 text-forest-900":"bg-ash-100 text-forest-800"}`}>
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-forest-800 truncate">{c.name}</p>
                        {c.class_name&&<p className="text-xs text-ash-300">{c.class_name}</p>}
                        {c.bio&&<p className="text-xs text-ash-300 line-clamp-1 mt-0.5 hidden sm:block">{c.bio}</p>}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        selected?"border-gold-500 bg-gold-500":"border-ash-200"}`}>
                        {selected&&<svg className="w-3 h-3 text-forest-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {submitError&&<div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="text-sm text-red-600">{submitError}</p></div>}

        <button onClick={handleSubmit} disabled={!allAnswered||submitting}
          className={`w-full py-4 rounded-2xl font-display font-semibold text-base sm:text-lg transition-all duration-200 ${
            allAnswered?"bg-forest-800 text-white hover:bg-forest-700 shadow-lg active:scale-[0.99]":"bg-ash-200 text-ash-300 cursor-not-allowed"
          }`}>
          {submitting?"Submitting…":allAnswered?"Submit My Ballot →":`Answer all ${positions.length} positions to continue`}
        </button>
        <p className="text-center text-xs text-ash-300 pb-6">Your vote is anonymous. Once submitted it cannot be changed.</p>
      </div>
    </div>
  );
}
