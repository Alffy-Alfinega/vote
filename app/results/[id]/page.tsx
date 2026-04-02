"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

type Candidate = { id:number; name:string; class_name:string; vote_count:number };
type Position  = { id:number; title:string; candidates:Candidate[] };
type Election  = { id:number; title:string; description:string; status:string };
type Results   = { election:Election; total_voted:number; total_students:number; positions:Position[] };

function LiveClock() {
  const [t, setT] = useState("");
  const [d, setD] = useState("");
  useEffect(() => {
    const tick = () => {
      setT(new Date().toLocaleTimeString("en-UG",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
      setD(new Date().toLocaleDateString("en-UG",{weekday:"short",day:"numeric",month:"short",year:"numeric"}));
    };
    tick(); const i = setInterval(tick,1000); return () => clearInterval(i);
  },[]);
  return (
    <div style={{ textAlign:"center" }}>
      <p style={{ fontFamily:"monospace", fontSize:"clamp(.875rem,2vw,1.25rem)", color:"rgba(255,255,255,.8)", letterSpacing:".05em" }}>{t}</p>
      <p style={{ fontSize:"clamp(.625rem,1.2vw,.8125rem)", color:"rgba(255,255,255,.3)", marginTop:2 }}>{d}</p>
    </div>
  );
}

function TurnoutRing({ pct }: { pct:number }) {
  const r = 28, circ = 2*Math.PI*r;
  return (
    <svg width="80" height="80" style={{ transform:"rotate(-90deg)" }}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="6"/>
      <circle cx="40" cy="40" r={r} fill="none" stroke="#e8b84b" strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
        strokeLinecap="round" style={{ transition:"stroke-dashoffset 1s ease" }}/>
      <text x="40" y="40" dominantBaseline="central" textAnchor="middle"
        style={{ transform:"rotate(90deg)", transformOrigin:"40px 40px",
          fill:"#e8b84b", fontSize:13, fontWeight:700, fontFamily:"monospace" }}>
        {pct}%
      </text>
    </svg>
  );
}

export default function LiveResultsPage() {
  const { id } = useParams<{ id:string }>();
  const [data, setData]           = useState<Results|null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date|null>(null);
  const [pulse, setPulse]         = useState(false);
  const [currentPos, setCurrentPos] = useState(0);
  const carouselRef = useRef<NodeJS.Timeout|null>(null);
  const REFRESH = 10000;

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch(`/api/elections/${id}/results`);
      if (!res.ok) return;
      setData(await res.json());
      setLastUpdated(new Date());
      setPulse(true); setTimeout(() => setPulse(false), 800);
    } catch {}
  }, [id]);

  useEffect(() => {
    fetchResults();
    const i = setInterval(fetchResults, REFRESH);
    return () => clearInterval(i);
  }, [fetchResults]);

  // auto-carousel
  useEffect(() => {
    if (!data || data.positions.length <= 1) return;
    if (carouselRef.current) clearInterval(carouselRef.current);
    carouselRef.current = setInterval(() => setCurrentPos(p => (p+1) % data.positions.length), 8000);
    return () => { if (carouselRef.current) clearInterval(carouselRef.current); };
  }, [data?.positions.length]);

  if (!data) return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"linear-gradient(135deg,#050f08 0%,#0d2818 40%,#0a1f10 100%)" }}>
      <div style={{ textAlign:"center" }}>
        <svg style={{ width:48,height:48,color:"#e8b84b",margin:"0 auto 1rem" }} className="animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p style={{ fontFamily:"var(--font-display)", color:"rgba(255,255,255,.4)", fontSize:"1.125rem" }}>Loading results…</p>
      </div>
    </div>
  );

  const { election, total_voted, total_students, positions } = data;
  const turnout = total_students === 0 ? 0 : Math.round((total_voted/total_students)*100);
  const pos     = positions[currentPos] ?? positions[0];

  const BG = "linear-gradient(135deg,#050f08 0%,#0d2818 40%,#0a1f10 100%)";

  return (
    <div style={{ minHeight:"100dvh", background:BG, color:"white", display:"flex", flexDirection:"column",
      position:"relative", overflow:"hidden", userSelect:"none" }}>

      {/* decorative glow */}
      <div style={{ position:"absolute", top:0, right:0, width:"40%", height:"40%", borderRadius:"50%", opacity:.12,
        background:"radial-gradient(circle,#e8b84b 0%,transparent 70%)", transform:"translate(25%,-25%)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", bottom:0, left:0, width:"25%", height:"25%", borderRadius:"50%", opacity:.06,
        background:"radial-gradient(circle,#e8b84b 0%,transparent 70%)", transform:"translate(-30%,30%)", pointerEvents:"none" }}/>

      {/* ── HEADER ── */}
      <header style={{ padding:"clamp(.875rem,2vw,1.5rem) clamp(1rem,3vw,3rem)",
        borderBottom:"1px solid rgba(255,255,255,.1)",
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap" }}>

        <div style={{ display:"flex", alignItems:"center", gap:"clamp(.75rem,2vw,1.25rem)", minWidth:0, flex:1 }}>
          <div style={{ width:"clamp(36px,5vw,48px)", height:"clamp(36px,5vw,48px)", borderRadius:"clamp(.5rem,1.5vw,.875rem)",
            background:"#e8b84b", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg style={{ width:"55%", height:"55%", fill:"#0d2818" }} viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <div style={{ minWidth:0 }}>
            <h1 style={{ fontFamily:"var(--font-display)", fontWeight:700,
              fontSize:"clamp(1rem,3vw,1.75rem)", lineHeight:1.1,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {election.title}
            </h1>
            <p style={{ fontSize:"clamp(.65rem,1.2vw,.875rem)", color:"rgba(255,255,255,.4)", marginTop:2 }}>
              Live Election Results
            </p>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:"clamp(.75rem,2vw,2rem)", flexWrap:"wrap", flexShrink:0 }}>
          {/* status */}
          <div style={{ display:"flex", alignItems:"center", gap:".5rem" }}>
            {election.status === "active"
              ? <><span style={{ width:10,height:10,borderRadius:"50%",background:"#10b981",animation:"pulse 2s infinite",display:"inline-block" }}/>
                  <span style={{ color:"#10b981", fontSize:"clamp(.7rem,1.2vw,.875rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:".08em" }}>LIVE</span></>
              : <><span style={{ width:10,height:10,borderRadius:"50%",background:"#ef4444",display:"inline-block" }}/>
                  <span style={{ color:"#ef4444", fontSize:"clamp(.7rem,1.2vw,.875rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:".08em" }}>CLOSED</span></>
            }
          </div>
          <LiveClock/>
          {lastUpdated && (
            <div style={{ textAlign:"right", opacity: pulse ? 1 : .35, transition:"opacity .4s" }}>
              <p style={{ fontSize:"clamp(.6rem,1vw,.75rem)", color:"rgba(255,255,255,.5)" }}>Updated</p>
              <p style={{ fontFamily:"monospace", fontSize:"clamp(.6rem,1vw,.75rem)", color:"rgba(255,255,255,.4)" }}>
                {lastUpdated.toLocaleTimeString("en-UG")}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* ── STATS BAR ── */}
      <div style={{ padding:"clamp(.75rem,1.5vw,1.25rem) clamp(1rem,3vw,3rem)",
        borderBottom:"1px solid rgba(255,255,255,.1)",
        display:"flex", alignItems:"center", gap:"clamp(.75rem,3vw,3rem)", flexWrap:"wrap" }}>

        {[
          { label:"Votes Cast",      value:total_voted.toLocaleString() },
          { label:"Eligible Voters", value:total_students.toLocaleString() },
          { label:"Positions",       value:String(positions.length) },
        ].map((s, i) => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap: i>0?"clamp(.75rem,3vw,3rem)":0 }}>
            {i > 0 && <div style={{ width:1,height:36,background:"rgba(255,255,255,.1)",marginRight:"clamp(.75rem,3vw,3rem)" }}/>}
            <div>
              <p style={{ fontSize:"clamp(.6rem,1vw,.75rem)", color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:2 }}>{s.label}</p>
              <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"clamp(1.25rem,3.5vw,2.25rem)", lineHeight:1 }}>{s.value}</p>
            </div>
          </div>
        ))}

        {/* Turnout ring */}
        <div style={{ display:"flex", alignItems:"center", gap:".75rem", marginLeft:"auto" }}>
          <TurnoutRing pct={turnout}/>
          <div>
            <p style={{ fontSize:"clamp(.6rem,1vw,.75rem)", color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:".08em" }}>Turnout</p>
            <p style={{ fontSize:"clamp(.7rem,1.2vw,.875rem)", color:"rgba(255,255,255,.5)", marginTop:2 }}>{total_voted} of {total_students}</p>
          </div>
        </div>

        {/* position dots */}
        {positions.length > 1 && (
          <div style={{ display:"flex", alignItems:"center", gap:".5rem" }}>
            {positions.map((_,i) => (
              <button key={i} onClick={() => setCurrentPos(i)}
                style={{ border:"none", cursor:"pointer", borderRadius:9999, transition:"all .3s", padding:0,
                  width: i===currentPos ? 24 : 8, height:8,
                  background: i===currentPos ? "#e8b84b" : "rgba(255,255,255,.2)" }}/>
            ))}
          </div>
        )}
      </div>

      {/* ── MAIN RESULTS ── */}
      <div style={{ flex:1, padding:"clamp(1rem,2.5vw,2rem) clamp(1rem,3vw,3rem)" }}>
        {positions.length === 0 ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%" }}>
            <p style={{ fontFamily:"var(--font-display)", color:"rgba(255,255,255,.2)", fontSize:"clamp(1.25rem,3vw,2rem)" }}>No results yet</p>
          </div>
        ) : !pos ? null : (() => {
          const maxVotes = Math.max(...pos.candidates.map(c => c.vote_count), 1);
          const totalForPos = pos.candidates.reduce((s,c) => s+c.vote_count, 0);
          const cols = Math.min(pos.candidates.length, pos.candidates.length <= 2 ? 2 : pos.candidates.length <= 4 ? 2 : 3);

          return (
            <div>
              {/* position title */}
              <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"clamp(1rem,2.5vw,2rem)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:".75rem", flexShrink:0 }}>
                  <span style={{ color:"rgba(255,255,255,.3)", fontFamily:"var(--font-display)", fontSize:"clamp(.875rem,1.8vw,1.125rem)" }}>
                    Position {currentPos+1}/{positions.length}
                  </span>
                </div>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,.1)" }}/>
                <h2 style={{ fontFamily:"var(--font-display)", fontWeight:700,
                  fontSize:"clamp(1.25rem,4vw,2.5rem)", flexShrink:0, textAlign:"right" }}>
                  {pos.title}
                </h2>
              </div>

              {/* candidate cards — responsive grid */}
              <div style={{ display:"grid",
                gridTemplateColumns:`repeat(${cols},1fr)`,
                gap:"clamp(.75rem,2vw,1.5rem)" }}>
                {pos.candidates.map((c, rank) => {
                  const isLeader = c.vote_count === maxVotes && c.vote_count > 0;
                  const pct = totalForPos===0 ? 0 : Math.round((c.vote_count/totalForPos)*100);
                  const circ = 2*Math.PI*20;

                  return (
                    <div key={c.id} style={{ borderRadius:"clamp(.875rem,2vw,1.5rem)",
                      padding:"clamp(1rem,2.5vw,2rem)",
                      border:`1px solid ${isLeader ? "rgba(232,184,75,.5)" : "rgba(255,255,255,.1)"}`,
                      background: isLeader ? "rgba(232,184,75,.06)" : "rgba(255,255,255,.04)",
                      boxShadow: isLeader ? "0 0 40px rgba(232,184,75,.08)" : "none",
                      transition:"all .5s", position:"relative", overflow:"hidden" }}>

                      {/* leading glow bar */}
                      {isLeader && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"#e8b84b", borderRadius:"9999px 9999px 0 0" }}/>}

                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"clamp(.75rem,2vw,1.25rem)" }}>
                        {/* rank badge */}
                        <div style={{ width:"clamp(36px,6vw,52px)", height:"clamp(36px,6vw,52px)", borderRadius:"50%",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          background: isLeader ? "#e8b84b" : "rgba(255,255,255,.1)",
                          color: isLeader ? "#0d2818" : "rgba(255,255,255,.5)",
                          fontFamily:"var(--font-display)", fontWeight:700,
                          fontSize:"clamp(.875rem,2vw,1.375rem)", flexShrink:0 }}>
                          {isLeader ? "★" : rank+1}
                        </div>
                        {isLeader && (
                          <span style={{ fontSize:"clamp(.6rem,1vw,.75rem)", fontWeight:600,
                            color:"#e8b84b", background:"rgba(232,184,75,.12)",
                            border:"1px solid rgba(232,184,75,.3)", borderRadius:9999,
                            padding:".25rem .75rem" }}>
                            Leading
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontFamily:"var(--font-display)", fontWeight:700,
                        fontSize:"clamp(1rem,3vw,1.875rem)", lineHeight:1.15, marginBottom:".375rem" }}>
                        {c.name}
                      </h3>
                      {c.class_name && (
                        <p style={{ color:"rgba(255,255,255,.4)", fontSize:"clamp(.7rem,1.3vw,.875rem)", marginBottom:"clamp(.75rem,2vw,1.25rem)" }}>
                          {c.class_name}
                        </p>
                      )}

                      {/* vote count + donut */}
                      <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"clamp(.75rem,1.5vw,1rem)" }}>
                        <div>
                          <span style={{ fontFamily:"var(--font-display)", fontWeight:700,
                            fontSize:"clamp(2rem,7vw,4.5rem)",
                            color: isLeader ? "#e8b84b" : "white", lineHeight:1 }}>
                            {c.vote_count}
                          </span>
                          <span style={{ color:"rgba(255,255,255,.4)", fontSize:"clamp(.7rem,1.2vw,.875rem)", marginLeft:".375rem" }}>
                            vote{c.vote_count!==1?"s":""}
                          </span>
                        </div>
                        {/* mini donut */}
                        <svg width="52" height="52" style={{ transform:"rotate(-90deg)", flexShrink:0, marginLeft:"auto" }}>
                          <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5"/>
                          <circle cx="26" cy="26" r="20" fill="none"
                            stroke={isLeader ? "#e8b84b" : "rgba(255,255,255,.3)"} strokeWidth="5"
                            strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
                            strokeLinecap="round" style={{ transition:"stroke-dashoffset 1s ease" }}/>
                          <text x="26" y="26" dominantBaseline="central" textAnchor="middle"
                            style={{ transform:"rotate(90deg)", transformOrigin:"26px 26px",
                              fill: isLeader?"#e8b84b":"rgba(255,255,255,.6)",
                              fontSize:10, fontWeight:700, fontFamily:"monospace" }}>
                            {pct}%
                          </text>
                        </svg>
                      </div>

                      {/* bar */}
                      <div style={{ height:6, borderRadius:9999, background:"rgba(255,255,255,.1)", overflow:"hidden" }}>
                        <div style={{ height:"100%", borderRadius:9999, transition:"width 1s ease",
                          background: isLeader ? "#e8b84b" : "rgba(255,255,255,.3)",
                          width:`${maxVotes===0 ? 0 : (c.vote_count/maxVotes)*100}%` }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ padding:"clamp(.5rem,1vw,.875rem) clamp(1rem,3vw,3rem)",
        borderTop:"1px solid rgba(255,255,255,.08)",
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:".5rem" }}>
        <p style={{ color:"rgba(255,255,255,.2)", fontSize:"clamp(.6rem,.9vw,.75rem)" }}>
          VoteSecure — Uganda Secondary School E-Voting
        </p>
        <p style={{ color:"rgba(255,255,255,.2)", fontSize:"clamp(.6rem,.9vw,.75rem)" }}>
          Auto-refreshes every {REFRESH/1000}s
        </p>
      </footer>

      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1; }
          50%      { opacity:.4; }
        }
        @keyframes spin {
          to { transform:rotate(360deg); }
        }
        .animate-spin { animation:spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
