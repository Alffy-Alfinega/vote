"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

const MAROON = "#9b4f3a";
const CREAM  = "#f9f5c8";

type Candidate = { id:number; name:string; class_name:string; vote_count:number; photo_url:string };
type Position  = { id:number; title:string; candidates:Candidate[] };
type Election  = { id:number; title:string; status:string };
type Results   = { election:Election; total_voted:number; total_students:number; positions:Position[] };

function LiveClock() {
  const [t, setT] = useState(""); const [d, setD] = useState("");
  useEffect(() => {
    const tick = () => { setT(new Date().toLocaleTimeString("en-UG",{hour:"2-digit",minute:"2-digit",second:"2-digit"})); setD(new Date().toLocaleDateString("en-UG",{weekday:"short",day:"numeric",month:"short",year:"numeric"})); };
    tick(); const i = setInterval(tick,1000); return () => clearInterval(i);
  },[]);
  return <div style={{ textAlign:"center" }}>
    <p style={{ fontFamily:"monospace", fontSize:"clamp(.875rem,2vw,1.125rem)", color:CREAM, letterSpacing:".05em" }}>{t}</p>
    <p style={{ fontSize:"clamp(.6rem,1vw,.75rem)", color:"rgba(249,245,200,.4)", marginTop:2 }}>{d}</p>
  </div>;
}

// Ranked list row — sorted by votes descending
function RankedRow({ candidate, rank, total, maxVotes }: { candidate:Candidate; rank:number; total:number; maxVotes:number }) {
  const pct = total === 0 ? 0 : Math.round((candidate.vote_count / total) * 100);
  const barW = maxVotes === 0 ? 0 : (candidate.vote_count / maxVotes) * 100;
  const isFirst = rank === 1;

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:"clamp(.75rem,2vw,1.25rem)",
      padding:"clamp(.875rem,2vw,1.25rem) clamp(1rem,2.5vw,1.5rem)",
      borderRadius:"clamp(.75rem,1.5vw,1rem)",
      background: isFirst ? "rgba(249,245,200,.1)" : "rgba(255,255,255,.04)",
      border: `1px solid ${isFirst ? "rgba(249,245,200,.4)" : "rgba(255,255,255,.08)"}`,
      transition:"all .5s",
      position:"relative", overflow:"hidden",
    }}>
      {/* bar fill background */}
      <div style={{ position:"absolute", inset:0, background: isFirst ? "rgba(249,245,200,.05)" : "rgba(255,255,255,.02)",
        width:`${barW}%`, transition:"width 1s ease", borderRadius:"inherit" }}/>

      {/* Rank badge / photo */}
      <div style={{ width:"clamp(40px,7vw,60px)", height:"clamp(40px,7vw,60px)", borderRadius:"50%", flexShrink:0,
        position:"relative", border:`2px solid ${isFirst ? CREAM : "rgba(255,255,255,.15)"}`, overflow:"hidden" }}>
        {candidate.photo_url
          ? <img src={candidate.photo_url} alt={candidate.name} style={{ width:"100%",height:"100%",objectFit:"cover" }}
              onError={e => { (e.currentTarget as HTMLElement).style.display="none"; (e.currentTarget.nextSibling as HTMLElement).style.display="flex"; }}/>
          : null}
        <div style={{ width:"100%",height:"100%",display: candidate.photo_url ? "none" : "flex",alignItems:"center",justifyContent:"center",
          fontFamily:"var(--font-display)",fontWeight:700,
          fontSize:"clamp(.875rem,2vw,1.25rem)",
          background: isFirst ? CREAM : "rgba(255,255,255,.1)",
          color: isFirst ? MAROON : "rgba(255,255,255,.5)" }}>
          {candidate.name.charAt(0)}
        </div>
      </div>

      {/* Rank number */}
      <div style={{ width:"clamp(24px,4vw,36px)", textAlign:"center", flexShrink:0 }}>
        {isFirst
          ? <span style={{ fontSize:"clamp(1.25rem,3vw,2rem)" }}>🥇</span>
          : rank === 2 ? <span style={{ fontSize:"clamp(1.1rem,2.5vw,1.75rem)" }}>🥈</span>
          : rank === 3 ? <span style={{ fontSize:"clamp(1rem,2.2vw,1.5rem)" }}>🥉</span>
          : <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"clamp(.875rem,2vw,1.25rem)", color:"rgba(255,255,255,.3)" }}>#{rank}</span>}
      </div>

      {/* Name + class */}
      <div style={{ flex:1, minWidth:0, position:"relative" }}>
        <p style={{ fontFamily:"var(--font-display)", fontWeight:700,
          fontSize:"clamp(.9375rem,2.5vw,1.5rem)", color: isFirst ? CREAM : "white",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {candidate.name}
        </p>
        {candidate.class_name && (
          <p style={{ fontSize:"clamp(.7rem,1.2vw,.875rem)", color:"rgba(255,255,255,.4)", marginTop:2 }}>{candidate.class_name}</p>
        )}
      </div>

      {/* Vote count + pct */}
      <div style={{ textAlign:"right", flexShrink:0, position:"relative" }}>
        <p style={{ fontFamily:"var(--font-display)", fontWeight:700,
          fontSize:"clamp(1.5rem,5vw,3.5rem)", lineHeight:1,
          color: isFirst ? CREAM : "rgba(255,255,255,.8)" }}>
          {candidate.vote_count}
        </p>
        <p style={{ fontSize:"clamp(.65rem,1.2vw,.8125rem)", color:"rgba(255,255,255,.4)", marginTop:2 }}>
          {pct}% of votes
        </p>
      </div>
    </div>
  );
}

export default function LiveResultsPage() {
  const { id } = useParams<{ id:string }>();
  const [data, setData]               = useState<Results|null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date|null>(null);
  const [pulse, setPulse]             = useState(false);
  const [currentPos, setCurrentPos]   = useState(0);
  const carouselRef = useRef<ReturnType<typeof setInterval>|null>(null);
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

  useEffect(() => { fetchResults(); const i = setInterval(fetchResults, REFRESH); return () => clearInterval(i); }, [fetchResults]);

  useEffect(() => {
    if (!data || data.positions.length <= 1) return;
    if (carouselRef.current) clearInterval(carouselRef.current);
    carouselRef.current = setInterval(() => setCurrentPos(p => (p+1) % data.positions.length), 10000);
    return () => { if (carouselRef.current) clearInterval(carouselRef.current); };
  }, [data?.positions.length]);

  if (!data) return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(135deg, #1e0e08 0%, ${MAROON} 50%, #6b3020 100%)` }}>
      <div style={{ textAlign:"center" }}>
        <svg style={{ width:48,height:48,margin:"0 auto 1rem" }} className="animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke={CREAM} strokeWidth="4"/>
          <path className="opacity-75" fill={CREAM} d="M4 12a8 8 0 018-8v8z"/></svg>
        <p style={{ fontFamily:"var(--font-display)", color:"rgba(249,245,200,.5)", fontSize:"1.125rem" }}>Loading results…</p>
      </div>
    </div>
  );

  const { election, total_voted, total_students, positions } = data;
  const turnout = total_students === 0 ? 0 : Math.round((total_voted/total_students)*100);
  const pos = positions[currentPos] ?? positions[0];
  // Sort candidates by votes descending on each render
  const sorted = pos ? [...pos.candidates].sort((a,b) => b.vote_count - a.vote_count) : [];
  const totalForPos = sorted.reduce((s,c) => s+c.vote_count, 0);

  return (
    <div style={{ minHeight:"100dvh", color:"white", display:"flex", flexDirection:"column",
      background:`linear-gradient(160deg, #1e0e08 0%, ${MAROON} 45%, #6b3020 100%)`,
      position:"relative", overflow:"hidden" }}>

      {/* subtle dot grid */}
      <div style={{ position:"absolute", inset:0, opacity:.04, pointerEvents:"none",
        backgroundImage:"radial-gradient(circle at 1px 1px, #f9f5c8 1px, transparent 0)", backgroundSize:"32px 32px" }}/>

      {/* ── HEADER ── */}
      <header style={{ padding:"clamp(.875rem,2vw,1.25rem) clamp(1rem,3vw,2.5rem)",
        borderBottom:`1px solid rgba(249,245,200,.12)`,
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap" }}>

        <div style={{ display:"flex", alignItems:"center", gap:"clamp(.75rem,2vw,1.25rem)" }}>
          <div style={{ width:"clamp(40px,6vw,56px)", height:"clamp(40px,6vw,56px)", borderRadius:"50%",
            border:`2px solid rgba(249,245,200,.4)`, overflow:"hidden", flexShrink:0 }}>
            <Image src="/logo.jpg" alt="Makindye" width={56} height={56} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
          </div>
          <div>
            <h1 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"clamp(.9375rem,2.5vw,1.5rem)", lineHeight:1.1, color:CREAM }}>
              {election.title}
            </h1>
            <p style={{ fontSize:"clamp(.6rem,1vw,.8125rem)", color:"rgba(249,245,200,.45)", marginTop:3 }}>
              Makindye Secondary School — Live Results
            </p>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:"clamp(.75rem,2vw,2rem)", flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:".5rem" }}>
            {election.status === "active"
              ? <><span style={{ width:10,height:10,borderRadius:"50%",background:"#10b981",animation:"pulse 2s infinite",display:"inline-block" }}/><span style={{ color:"#10b981",fontSize:"clamp(.7rem,1.2vw,.875rem)",fontWeight:600,textTransform:"uppercase",letterSpacing:".08em" }}>LIVE</span></>
              : <><span style={{ width:10,height:10,borderRadius:"50%",background:"#ef4444",display:"inline-block" }}/><span style={{ color:"#ef4444",fontSize:"clamp(.7rem,1.2vw,.875rem)",fontWeight:600,textTransform:"uppercase",letterSpacing:".08em" }}>CLOSED</span></>}
          </div>
          <LiveClock/>
          {lastUpdated && (
            <div style={{ textAlign:"right", opacity: pulse ? 1 : .3, transition:"opacity .4s" }}>
              <p style={{ fontSize:"clamp(.6rem,1vw,.75rem)", color:"rgba(249,245,200,.5)" }}>Updated</p>
              <p style={{ fontFamily:"monospace", fontSize:"clamp(.6rem,1vw,.75rem)", color:"rgba(249,245,200,.4)" }}>{lastUpdated.toLocaleTimeString("en-UG")}</p>
            </div>
          )}
        </div>
      </header>

      {/* ── STATS BAR ── */}
      <div style={{ padding:"clamp(.75rem,1.5vw,1rem) clamp(1rem,3vw,2.5rem)",
        borderBottom:`1px solid rgba(249,245,200,.1)`,
        display:"flex", alignItems:"center", gap:"clamp(.75rem,3vw,3rem)", flexWrap:"wrap" }}>
        {[
          { label:"Votes Cast",   value:total_voted.toLocaleString() },
          { label:"Eligible",     value:total_students.toLocaleString() },
          { label:"Turnout",      value:`${turnout}%` },
          { label:"Positions",    value:String(positions.length) },
        ].map((s,i) => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap: i>0 ? "clamp(.75rem,3vw,3rem)" : 0 }}>
            {i > 0 && <div style={{ width:1,height:32,background:"rgba(249,245,200,.12)",marginRight:"clamp(.75rem,3vw,3rem)" }}/>}
            <div>
              <p style={{ fontSize:"clamp(.6rem,.9vw,.7rem)", color:"rgba(249,245,200,.4)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:2 }}>{s.label}</p>
              <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"clamp(1.125rem,3vw,1.875rem)", lineHeight:1, color: s.label==="Turnout" ? CREAM : "white" }}>{s.value}</p>
            </div>
          </div>
        ))}

        {/* position dots */}
        {positions.length > 1 && (
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:".5rem" }}>
            {positions.map((_,i) => (
              <button key={i} onClick={() => setCurrentPos(i)}
                style={{ border:"none", cursor:"pointer", borderRadius:9999, padding:0,
                  width: i===currentPos ? 24 : 8, height:8, transition:"all .3s",
                  background: i===currentPos ? CREAM : "rgba(249,245,200,.25)" }}/>
            ))}
          </div>
        )}
      </div>

      {/* ── RANKED LIST ── */}
      <div style={{ flex:1, padding:"clamp(1rem,2.5vw,1.75rem) clamp(1rem,3vw,2.5rem)" }}>
        {!pos ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%" }}>
            <p style={{ fontFamily:"var(--font-display)", color:"rgba(249,245,200,.25)", fontSize:"clamp(1rem,2.5vw,1.75rem)" }}>No candidates yet</p>
          </div>
        ) : (
          <>
            {/* Position header */}
            <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"clamp(.875rem,2vw,1.5rem)" }}>
              <div style={{ flex:1, height:1, background:"rgba(249,245,200,.12)" }}/>
              <h2 style={{ fontFamily:"var(--font-display)", fontWeight:700,
                fontSize:"clamp(1.125rem,3.5vw,2.25rem)", color:CREAM, textAlign:"center",
                padding:"0 1rem" }}>
                {pos.title}
              </h2>
              <div style={{ flex:1, height:1, background:"rgba(249,245,200,.12)" }}/>
            </div>

            {/* Candidates — sorted list, re-ranks on every update */}
            <div style={{ display:"flex", flexDirection:"column", gap:"clamp(.5rem,1.2vw,.875rem)",
              maxWidth:"56rem", margin:"0 auto" }}>
              {sorted.map((c, i) => (
                <RankedRow key={c.id} candidate={c} rank={i+1}
                  total={totalForPos} maxVotes={sorted[0]?.vote_count ?? 0}/>
              ))}
            </div>

            {totalForPos === 0 && (
              <p style={{ textAlign:"center", color:"rgba(249,245,200,.3)", fontSize:".9375rem", marginTop:"2rem" }}>
                No votes cast yet — results will appear as voting progresses.
              </p>
            )}
          </>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ padding:"clamp(.5rem,1vw,.875rem) clamp(1rem,3vw,2.5rem)",
        borderTop:`1px solid rgba(249,245,200,.08)`,
        display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:".5rem" }}>
        <p style={{ color:"rgba(249,245,200,.2)", fontSize:"clamp(.6rem,.9vw,.75rem)" }}>Makindye Secondary School — E-Voting System</p>
        <p style={{ color:"rgba(249,245,200,.2)", fontSize:"clamp(.6rem,.9vw,.75rem)" }}>Auto-refreshes every {REFRESH/1000}s · We Strive For Development</p>
      </footer>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.animate-spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.opacity-25{opacity:.25}.opacity-75{opacity:.75}`}</style>
    </div>
  );
}
