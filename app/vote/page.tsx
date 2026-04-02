"use client";
import { useState } from "react";

type Election  = { id:number; title:string; description:string };
type Candidate = { id:number; name:string; class_name:string; bio:string };
type Position  = { id:number; title:string; max_votes:number; candidates:Candidate[] };
type Step = "login"|"ballot"|"done";

export default function VotePage() {
  const [step, setStep]       = useState<Step>("login");
  const [login, setLogin]     = useState({ student_id:"", pin:"" });
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [election, setElection]   = useState<Election|null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [electionId, setElectionId] = useState<number|null>(null);
  const [selections, setSelections] = useState<Record<number,number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr]   = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoginLoading(true); setLoginErr("");
    try {
      // 1. Get active election
      const eRes  = await fetch("/api/elections/active");
      const eData = await eRes.json();
      if (!eRes.ok) throw new Error(eData.error);
      if (!eData.length) throw new Error("No active elections right now.");
      const activeElection = eData[0];

      // 2. Validate credentials AND check for double voting before showing ballot
      const checkRes = await fetch("/api/vote/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: login.student_id,
          pin: login.pin,
          election_id: activeElection.id,
        }),
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.error);

      // 3. Credentials valid and not yet voted — load ballot
      await loadBallot(activeElection.id);
    } catch (err: unknown) { setLoginErr(err instanceof Error ? err.message : "Error"); }
    finally { setLoginLoading(false); }
  }

  async function loadBallot(eid: number) {
    const [eR, pR] = await Promise.all([fetch(`/api/elections/${eid}`), fetch(`/api/positions?election_id=${eid}`)]);
    const elec = await eR.json();
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
        body:JSON.stringify({
          student_id: login.student_id,
          pin: login.pin,
          election_id: electionId,
          selections: Object.entries(selections).map(([pos,cand]) => ({ position_id:Number(pos), candidate_id:Number(cand) })),
        }),
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
      background:"linear-gradient(135deg,#050f08 0%,#0d2818 100%)" }}>
      <div className="card" style={{ padding:"3rem 2rem", maxWidth:400, width:"100%", textAlign:"center" }}>
        <div style={{ width:80,height:80,borderRadius:"50%",background:"#ecfdf5",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.5rem" }}>
          <svg style={{ width:40,height:40,color:"#10b981" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 style={{ fontFamily:"var(--font-display)", fontSize:"2rem", fontWeight:700, color:"var(--color-forest-800)", marginBottom:".5rem" }}>
          Vote Cast!
        </h1>
        <p style={{ color:"var(--color-ash-300)", fontSize:".9375rem", lineHeight:1.6 }}>
          Your ballot has been recorded securely. Thank you for participating.
        </p>
        <div style={{ marginTop:"1.5rem", background:"var(--color-ash-50)", borderRadius:".75rem", padding:"1rem" }}>
          <p style={{ fontSize:".8125rem", color:"var(--color-ash-300)" }}>Your choices are anonymous and cannot be traced back to you.</p>
        </div>
        <button
          onClick={() => {
            setStep("login");
            setLogin({ student_id:"", pin:"" });
            setSelections({});
            setElection(null);
            setPositions([]);
          }}
          style={{
            marginTop:"1.5rem", width:"100%",
            padding:".875rem", borderRadius:"1rem",
            background:"var(--color-forest-800)", color:"white",
            border:"none", cursor:"pointer",
            fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.0625rem",
            boxShadow:"0 4px 16px rgba(13,40,24,.2)",
            transition:"opacity .15s",
          }}
        >
          Thank you — Next Voter →
        </button>
      </div>
    </div>
  );

  /* ── LOGIN ── */
  if (step === "login") return (
    <div style={{ minHeight:"100svh", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem",
      background:"linear-gradient(135deg,#050f08 0%,#0d2818 100%)" }}>
      <div style={{ position:"absolute", inset:0, opacity:.05, pointerEvents:"none",
        backgroundImage:"radial-gradient(circle at 1px 1px,white 1px,transparent 0)", backgroundSize:"28px 28px" }}/>
      <div style={{ position:"relative", width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:64,height:64,borderRadius:"1rem",background:"var(--color-gold-500)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1rem",boxShadow:"0 8px 24px rgba(232,184,75,.3)" }}>
            <svg style={{ width:32,height:32,fill:"#0d2818" }} viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:"1.75rem", fontWeight:700, color:"white" }}>Cast Your Vote</h1>
          <p style={{ color:"rgba(255,255,255,.45)", fontSize:".875rem", marginTop:".375rem" }}>Enter your student credentials to begin</p>
        </div>
        <div className="card" style={{ padding:"1.75rem" }}>
          <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            <div>
              <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".5rem" }}>Student ID</label>
              <input className="input" placeholder="e.g. S2024001" value={login.student_id}
                onChange={e => setLogin(p => ({...p, student_id:e.target.value}))}
                autoComplete="username" autoCapitalize="none" required />
            </div>
            <div>
              <label style={{ display:"block", fontSize:".8125rem", fontWeight:500, marginBottom:".5rem" }}>PIN</label>
              <input type="password" className="input" placeholder="Your secret PIN" value={login.pin}
                onChange={e => setLogin(p => ({...p, pin:e.target.value}))}
                autoComplete="current-password" inputMode="numeric" required />
            </div>
            {loginErr && (
              <div style={{
                borderRadius:".75rem", padding:".875rem 1rem",
                background: loginErr.includes("already voted") ? "#fef3c7" : "#fef2f2",
                border: `1px solid ${loginErr.includes("already voted") ? "#fcd34d" : "#fecaca"}`,
              }}>
                {loginErr.includes("already voted") && (
                  <p style={{ fontSize:"1.25rem", marginBottom:".375rem" }}>🔒</p>
                )}
                <p style={{
                  fontSize:".875rem",
                  color: loginErr.includes("already voted") ? "#92400e" : "#dc2626",
                  fontWeight: loginErr.includes("already voted") ? 500 : 400,
                }}>
                  {loginErr}
                </p>
              </div>
            )}
            <button type="submit" className="btn-primary" style={{ width:"100%", marginTop:".25rem" }} disabled={loginLoading}>
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
      {/* sticky header */}
      <div style={{ position:"sticky", top:0, zIndex:10, background:"var(--color-forest-800)", color:"white",
        padding:".875rem 1rem", boxShadow:"0 2px 12px rgba(0,0,0,.2)" }}>
        <div style={{ maxWidth:640, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", gap:".75rem" }}>
          <div style={{ minWidth:0 }}>
            <h1 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {election?.title}
            </h1>
            <p style={{ fontSize:".75rem", color:"rgba(255,255,255,.5)", marginTop:".125rem" }}>ID: {login.student_id}</p>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <p style={{ fontSize:".75rem", color:"rgba(255,255,255,.5)" }}>{Object.keys(selections).length}/{positions.length} answered</p>
            {/* progress pill */}
            <div style={{ marginTop:".375rem", width:80, height:4, background:"rgba(255,255,255,.15)", borderRadius:9999, overflow:"hidden" }}>
              <div style={{ height:"100%", background:"var(--color-gold-500)", borderRadius:9999, transition:"width .4s ease",
                width:`${positions.length ? (Object.keys(selections).length/positions.length)*100 : 0}%` }}/>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:640, margin:"0 auto", padding:"1.25rem 1rem 6rem" }}>
        {positions.map((pos, idx) => (
          <div key={pos.id} className="card" style={{ marginBottom:"1rem", overflow:"hidden" }}>
            <div style={{ padding:"1rem", background:"rgba(13,40,24,.03)", borderBottom:"1px solid var(--color-ash-100)",
              display:"flex", alignItems:"center", gap:".75rem" }}>
              <span style={{ width:28,height:28,borderRadius:"50%",background:"var(--color-forest-800)",color:"white",
                fontSize:".8125rem",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                {idx+1}
              </span>
              <div style={{ flex:1 }}>
                <h2 style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:"1rem" }}>{pos.title}</h2>
                <p style={{ fontSize:".75rem", color:"var(--color-ash-300)" }}>Choose one</p>
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
                      border:`2px solid ${sel ? "var(--color-gold-500)" : "var(--color-ash-200)"}`,
                      background: sel ? "color-mix(in srgb,var(--color-gold-500) 6%,white)" : "white",
                      cursor:"pointer", transition:"all .15s", display:"flex", alignItems:"center", gap:".875rem" }}>
                    <div style={{ width:40,height:40,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",
                      fontFamily:"var(--font-display)",fontWeight:700,fontSize:"1rem",
                      background: sel ? "var(--color-gold-500)" : "var(--color-ash-100)",
                      color: sel ? "var(--color-forest-900)" : "var(--color-forest-800)" }}>
                      {c.name.charAt(0)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:500, fontSize:".9375rem" }}>{c.name}</p>
                      {c.class_name && <p style={{ fontSize:".8125rem", color:"var(--color-ash-300)" }}>{c.class_name}</p>}
                    </div>
                    <div style={{ width:20,height:20,borderRadius:"50%",border:`2px solid ${sel ? "var(--color-gold-500)" : "var(--color-ash-200)"}`,
                      background: sel ? "var(--color-gold-500)" : "transparent",
                      display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      {sel && <svg style={{ width:12,height:12,fill:"var(--color-forest-900)" }} viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {submitErr && (
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:".75rem", padding:".875rem 1rem", marginBottom:"1rem" }}>
            <p style={{ fontSize:".875rem", color:"#dc2626" }}>{submitErr}</p>
          </div>
        )}

        {/* fixed bottom submit on mobile */}
        <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:"1rem", background:"white",
          borderTop:"1px solid var(--color-ash-200)", boxShadow:"0 -4px 24px rgba(0,0,0,.08)" }}>
          <div style={{ maxWidth:640, margin:"0 auto" }}>
            <button onClick={handleSubmit} disabled={!allAnswered||submitting}
              style={{ width:"100%", padding:"1rem", borderRadius:"1rem", border:"none", cursor: allAnswered?"pointer":"not-allowed",
                fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.0625rem",
                background: allAnswered ? "var(--color-forest-800)" : "var(--color-ash-200)",
                color: allAnswered ? "white" : "var(--color-ash-300)",
                transition:"all .2s", boxShadow: allAnswered ? "0 4px 16px rgba(13,40,24,.25)" : "none" }}>
              {submitting ? "Submitting…" : allAnswered ? "Submit My Ballot →" : `Answer all ${positions.length} positions to continue`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
