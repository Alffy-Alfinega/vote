"use client";
import { useState } from "react";
import Image from "next/image";

const MAROON = "#9b4f3a";
const CREAM  = "#f9f5c8";

type Election  = { id:number; title:string; description:string };
type Candidate = { id:number; name:string; class_name:string; bio:string; photo_url:string };
type Position  = { id:number; title:string; max_votes:number; candidates:Candidate[] };
type Step = "login"|"ballot"|"done";

export default function VotePage() {
  const [step, setStep]         = useState<Step>("login");
  const [login, setLogin]       = useState({ student_id:"", pin:"" });
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [election, setElection] = useState<Election|null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [electionId, setElectionId] = useState<number|null>(null);
  const [selections, setSelections] = useState<Record<number,number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr]   = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoginLoading(true); setLoginErr("");
    try {
      const eRes  = await fetch("/api/elections/active");
      const eData = await eRes.json();
      if (!eRes.ok) throw new Error(eData.error);
      if (!eData.length) throw new Error("No active elections at this time.");
      const active = eData[0];
      const checkRes = await fetch("/api/vote/check", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ student_id:login.student_id, pin:login.pin, election_id:active.id }),
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.error);
      await loadBallot(active.id);
    } catch (err: unknown) { setLoginErr(err instanceof Error ? err.message : "Error"); }
    finally { setLoginLoading(false); }
  }

  async function loadBallot(eid: number) {
    const [eR, pR] = await Promise.all([fetch(`/api/elections/${eid}`), fetch(`/api/positions?election_id=${eid}`)]);
    const elec  = await eR.json();
    const pData = await pR.json();
    const posWithCands: Position[] = await Promise.all(
      pData.map(async (p: any) => {
        const cR = await fetch(`/api/candidates?position_id=${p.id}`);
        return { ...p, candidates: await cR.json() };
      })
    );
    setElection(elec); setPositions(posWithCands); setElectionId(eid); setStep("ballot");
  }

  async function handleSubmit() {
    setSubmitting(true); setSubmitErr("");
    try {
      const res = await fetch("/api/vote", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ student_id:login.student_id, pin:login.pin, election_id:electionId,
          selections:Object.entries(selections).map(([pos,cand]) => ({ position_id:Number(pos), candidate_id:Number(cand) })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("done");
    } catch (err: unknown) { setSubmitErr(err instanceof Error ? err.message : "Error"); }
    finally { setSubmitting(false); }
  }

  const allAnswered = positions.length > 0 && positions.every(p => selections[p.id] !== undefined);

  /* ── DONE ── */
  if (step === "done") return (
    <div style={{ minHeight:"100svh", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem",
      background:`linear-gradient(160deg, ${MAROON} 0%, #6b3020 100%)` }}>
      <div className="card" style={{ padding:"2.5rem 2rem", maxWidth:400, width:"100%", textAlign:"center" }}>
        <div style={{ width:72,height:72,borderRadius:"50%",background:"#ecfdf5",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.25rem" }}>
          <svg style={{ width:36,height:36,color:"#10b981" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 style={{ fontFamily:"var(--font-display)", fontSize:"1.75rem", fontWeight:700, color:MAROON, marginBottom:".5rem" }}>Vote Recorded!</h1>
        <p style={{ color:"#666", fontSize:".9375rem", lineHeight:1.6, marginBottom:"1.5rem" }}>
          Your ballot has been recorded securely. Thank you for participating in the Makindye Secondary School elections.
        </p>
        <div style={{ background:CREAM, borderRadius:".75rem", padding:"1rem", marginBottom:"1.5rem" }}>
          <p style={{ fontSize:".8125rem", color:"#888" }}>Your vote is anonymous and cannot be traced back to you.</p>
        </div>
        <button onClick={() => { setStep("login"); setLogin({ student_id:"", pin:"" }); setSelections({}); setElection(null); setPositions([]); }}
          style={{ width:"100%", padding:"1rem", borderRadius:"1rem", border:"none", cursor:"pointer",
            fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1rem", background:MAROON, color:CREAM,
            boxShadow:"0 4px 16px rgba(113,16,16,.25)" }}>
          Thank you — Next Voter →
        </button>
      </div>
    </div>
  );

  /* ── LOGIN ── */
  if (step === "login") return (
    <div style={{ minHeight:"100svh", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem",
      background:`linear-gradient(160deg, ${MAROON} 0%, #6b3020 60%, #1e0e08 100%)` }}>
      <div style={{ position:"absolute", inset:0, opacity:.06, pointerEvents:"none",
        backgroundImage:"radial-gradient(circle at 1px 1px, #f9f5c8 1px, transparent 0)", backgroundSize:"28px 28px" }}/>
      <div style={{ position:"relative", width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:80,height:80,borderRadius:"50%",margin:"0 auto 1rem",border:`3px solid rgba(249,245,200,.35)`,overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,.3)" }}>
            <Image src="/logo.jpg" alt="Makindye Sec." width={80} height={80} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
          </div>
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:"1.375rem", fontWeight:700, color:CREAM }}>Cast Your Vote</h1>
          <p style={{ color:"rgba(249,245,200,.5)", fontSize:".8125rem", marginTop:".375rem" }}>Enter your student credentials to begin</p>
        </div>
        <div className="card" style={{ padding:"1.75rem" }}>
          <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            <div>
              <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".5rem" }}>Student ID</label>
              <input className="input" placeholder="e.g. S2024001" value={login.student_id}
                onChange={e => setLogin(p => ({...p, student_id:e.target.value}))} autoCapitalize="none" required/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".5rem" }}>PIN</label>
              <input type="password" className="input" placeholder="Your secret PIN" value={login.pin}
                onChange={e => setLogin(p => ({...p, pin:e.target.value}))} inputMode="numeric" required/>
            </div>
            {loginErr && (
              <div style={{ borderRadius:".75rem", padding:".875rem 1rem",
                background: loginErr.includes("already voted") ? "#fef3c7" : "#fef2f2",
                border: `1px solid ${loginErr.includes("already voted") ? "#fcd34d" : "#fecaca"}` }}>
                {loginErr.includes("already voted") && <p style={{ fontSize:"1.25rem", marginBottom:".25rem" }}>🔒</p>}
                <p style={{ fontSize:".875rem", color: loginErr.includes("already voted") ? "#92400e" : "#991b1b", fontWeight: loginErr.includes("already voted") ? 500 : 400 }}>{loginErr}</p>
              </div>
            )}
            <button type="submit" className="btn-primary" style={{ width:"100%" }} disabled={loginLoading}>
              {loginLoading ? "Loading ballot…" : "Continue →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  /* ── BALLOT ── */
  return (
    <div style={{ minHeight:"100svh", background:"var(--color-ash-50)" }}>
      <div style={{ position:"sticky", top:0, zIndex:10, background:MAROON, color:CREAM, padding:".875rem 1rem", boxShadow:"0 2px 12px rgba(0,0,0,.2)" }}>
        <div style={{ maxWidth:640, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", gap:".75rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:".75rem", minWidth:0 }}>
            <Image src="/logo.jpg" alt="" width={32} height={32} style={{ borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>
            <div style={{ minWidth:0 }}>
              <h1 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:".9375rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{election?.title}</h1>
              <p style={{ fontSize:".75rem", color:"rgba(249,245,200,.55)", marginTop:1 }}>ID: {login.student_id}</p>
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <p style={{ fontSize:".75rem", color:"rgba(249,245,200,.55)" }}>{Object.keys(selections).length}/{positions.length}</p>
            <div style={{ marginTop:3, width:64, height:4, background:"rgba(249,245,200,.15)", borderRadius:9999, overflow:"hidden" }}>
              <div style={{ height:"100%", background:CREAM, borderRadius:9999, transition:"width .4s ease", width:`${positions.length ? (Object.keys(selections).length/positions.length)*100 : 0}%` }}/>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:640, margin:"0 auto", padding:"1.25rem 1rem 7rem" }}>
        {positions.map((pos, idx) => (
          <div key={pos.id} className="card" style={{ marginBottom:"1rem", overflow:"hidden" }}>
            <div style={{ padding:"1rem", borderBottom:"1px solid var(--color-ash-100)", display:"flex", alignItems:"center", gap:".75rem" }}>
              <span style={{ width:28,height:28,borderRadius:"50%",background:MAROON,color:CREAM,fontSize:".8125rem",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{idx+1}</span>
              <div style={{ flex:1 }}>
                <h2 style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:"1rem" }}>{pos.title}</h2>
                <p style={{ fontSize:".75rem", color:"var(--color-ash-300)" }}>Choose one candidate</p>
              </div>
              {selections[pos.id] && (
                <svg style={{ width:20,height:20,color:"#10b981",flexShrink:0 }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              )}
            </div>
            <div style={{ padding:".75rem", display:"flex", flexDirection:"column", gap:".5rem" }}>
              {pos.candidates.map(c => {
                const sel = selections[pos.id] === c.id;
                return (
                  <button key={c.id} onClick={() => setSelections(p => ({...p, [pos.id]:c.id}))}
                    style={{ width:"100%", textAlign:"left", padding:"1rem", borderRadius:".75rem",
                      border:`2px solid ${sel ? MAROON : "var(--color-ash-200)"}`,
                      background: sel ? `rgba(113,16,16,.06)` : "white",
                      cursor:"pointer", transition:"all .15s", display:"flex", alignItems:"center", gap:".875rem" }}>
                    <div style={{ width:44,height:44,borderRadius:"50%",flexShrink:0,overflow:"hidden",
                      border:`2px solid ${sel ? MAROON : "var(--color-ash-200)"}` }}>
                      {c.photo_url && <img src={c.photo_url} alt={c.name} style={{ width:"100%",height:"100%",objectFit:"cover" }}
                        onError={e => { (e.currentTarget as HTMLElement).style.display="none"; }}/>}
                      <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",
                        fontFamily:"var(--font-display)",fontWeight:700,fontSize:"1.125rem",
                        background: sel ? `rgba(113,16,16,.1)` : CREAM, color:MAROON }}>
                        {c.name.charAt(0)}
                      </div>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:600, fontSize:".9375rem", color: sel ? MAROON : "#1e0e08" }}>{c.name}</p>
                      {c.class_name && <p style={{ fontSize:".8125rem", color:"var(--color-ash-300)" }}>{c.class_name}</p>}
                    </div>
                    <div style={{ width:20,height:20,borderRadius:"50%",border:`2px solid ${sel ? MAROON : "var(--color-ash-200)"}`,
                      background: sel ? MAROON : "transparent",
                      display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      {sel && <svg style={{ width:11,height:11,fill:CREAM }} viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {submitErr && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:".75rem", padding:".875rem 1rem", marginBottom:"1rem" }}><p style={{ fontSize:".875rem", color:"#991b1b" }}>{submitErr}</p></div>}
      </div>

      <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:"1rem", background:"white", borderTop:"1px solid var(--color-ash-200)", boxShadow:"0 -4px 24px rgba(0,0,0,.08)" }}>
        <div style={{ maxWidth:640, margin:"0 auto" }}>
          <button onClick={handleSubmit} disabled={!allAnswered||submitting}
            style={{ width:"100%", padding:"1rem", borderRadius:"1rem", border:"none",
              cursor: allAnswered ? "pointer" : "not-allowed",
              fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.0625rem",
              background: allAnswered ? MAROON : "var(--color-ash-200)",
              color: allAnswered ? CREAM : "var(--color-ash-300)",
              transition:"all .2s", boxShadow: allAnswered ? "0 4px 16px rgba(113,16,16,.25)" : "none" }}>
            {submitting ? "Submitting…" : allAnswered ? "Submit My Ballot →" : `Answer all ${positions.length} positions to continue`}
          </button>
        </div>
      </div>
    </div>
  );
}
