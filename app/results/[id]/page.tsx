"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

type Candidate = { id:number; name:string; class_name:string; vote_count:number };
type Position = { id:number; title:string; candidates:Candidate[] };
type Election = { id:number; title:string; description:string; status:string; end_date:string };
type Results = { election:Election; total_voted:number; total_students:number; positions:Position[] };

const REFRESH_MS = 10000;

function LiveClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  useEffect(()=>{
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-UG",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
      setDate(now.toLocaleDateString("en-UG",{weekday:"short",day:"numeric",month:"short",year:"numeric"}));
    };
    tick(); const t = setInterval(tick,1000); return ()=>clearInterval(t);
  },[]);
  return (
    <div className="text-right">
      <p className="font-mono text-sm sm:text-base lg:text-xl text-white/80 tabular-nums leading-none">{time}</p>
      <p className="text-white/30 text-xs mt-0.5 hidden sm:block">{date}</p>
    </div>
  );
}

function TurnoutRing({ pct }: { pct: number }) {
  const r = 28; const circ = 2*Math.PI*r;
  const dash = (pct/100)*circ;
  return (
    <svg width="72" height="72" className="flex-shrink-0 hidden sm:block">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6"/>
      <circle cx="36" cy="36" r={r} fill="none" stroke="#e8b84b" strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ/4}
        strokeLinecap="round" style={{transition:"stroke-dasharray 1s ease"}}/>
      <text x="36" y="36" textAnchor="middle" dominantBaseline="middle"
        fill="#e8b84b" fontSize="13" fontWeight="700" fontFamily="Georgia,serif">{pct}%</text>
    </svg>
  );
}

export default function LiveResultsPage() {
  const { id } = useParams<{ id:string }>();
  const [data, setData] = useState<Results|null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date|null>(null);
  const [pulse, setPulse] = useState(false);
  const [currentPos, setCurrentPos] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout|null>(null);

  const fetchResults = useCallback(async()=>{
    try {
      const res = await fetch(`/api/elections/${id}/results`);
      if (!res.ok) return;
      setData(await res.json());
      setLastUpdated(new Date()); setPulse(true); setTimeout(()=>setPulse(false),600);
    } catch {}
  },[id]);

  useEffect(()=>{
    fetchResults();
    const iv = setInterval(fetchResults, REFRESH_MS);
    return ()=>clearInterval(iv);
  },[fetchResults]);

  // Auto-rotate positions
  useEffect(()=>{
    if (!data||data.positions.length<=1) return;
    intervalRef.current = setInterval(()=>setCurrentPos(p=>(p+1)%data.positions.length), 8000);
    return ()=>{ if(intervalRef.current) clearInterval(intervalRef.current); };
  },[data]);

  const goTo = (i: number) => {
    if(intervalRef.current) clearInterval(intervalRef.current);
    setCurrentPos(i);
    intervalRef.current = setInterval(()=>setCurrentPos(p=>(p+1)%(data?.positions.length??1)),8000);
  };

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:"linear-gradient(135deg,#050f08 0%,#0d2818 60%,#0a1f10 100%)"}}>
      <div className="text-center">
        <svg className="w-8 h-8 animate-spin text-gold-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-white/40 font-display text-lg">Loading results…</p>
      </div>
    </div>
  );

  const { election, total_voted, total_students, positions } = data;
  const turnout = total_students===0?0:Math.round((total_voted/total_students)*100);
  const pos = positions[currentPos];

  return (
    <div className="min-h-screen text-white flex flex-col overflow-hidden"
      style={{background:"linear-gradient(135deg,#050f08 0%,#0d2818 40%,#0a1f10 100%)"}}>

      {/* Grain overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")"}}/>

      {/* Glow accents */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full pointer-events-none opacity-10"
        style={{background:"radial-gradient(circle,#e8b84b 0%,transparent 70%)",transform:"translate(30%,-30%)"}}/>
      <div className="absolute bottom-0 left-0 w-[25vw] h-[25vw] rounded-full pointer-events-none opacity-5"
        style={{background:"radial-gradient(circle,#e8b84b 0%,transparent 70%)",transform:"translate(-30%,30%)"}}/>

      <div className="relative flex flex-col flex-1">

        {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
        <header className="px-4 sm:px-8 lg:px-12 pt-4 sm:pt-6 lg:pt-8 pb-3 sm:pb-5 flex items-center justify-between gap-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gold-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-forest-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-sm sm:text-xl lg:text-2xl leading-tight truncate">{election.title}</h1>
              <p className="text-white/40 text-xs hidden sm:block">Live Election Results</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
            {/* Status pill */}
            <div className="flex items-center gap-1.5">
              {election.status==="active"
                ? <><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/><span className="text-emerald-400 text-xs sm:text-sm font-medium">LIVE</span></>
                : <><span className="w-2 h-2 rounded-full bg-red-400"/><span className="text-red-400 text-xs sm:text-sm font-medium">CLOSED</span></>
              }
            </div>
            <LiveClock/>
          </div>
        </header>

        {/* ── STATS BAR ───────────────────────────────────────────────────── */}
        <div className="px-4 sm:px-8 lg:px-12 py-3 sm:py-4 border-b border-white/10 flex-shrink-0">
          {/* Mobile: compact stats row */}
          <div className="flex items-center justify-between gap-4 sm:hidden">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest">Votes</p>
              <p className="font-display font-bold text-2xl">{total_voted}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest">Turnout</p>
              <p className="font-display font-bold text-2xl text-gold-400">{turnout}%</p>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest">Eligible</p>
              <p className="font-display font-bold text-2xl">{total_students}</p>
            </div>
            {positions.length > 1 && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest">Positions</p>
                <p className="font-display font-bold text-2xl">{positions.length}</p>
              </div>
            )}
          </div>

          {/* Tablet/Desktop: full stats with turnout ring */}
          <div className="hidden sm:flex items-center gap-6 lg:gap-12">
            <div className="flex items-center gap-4">
              <TurnoutRing pct={turnout}/>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-0.5">Voter Turnout</p>
                <p className="font-display font-bold text-2xl lg:text-3xl text-gold-400">{turnout}%</p>
                <p className="text-white/40 text-xs">{total_voted} of {total_students}</p>
              </div>
            </div>
            <div className="w-px h-12 bg-white/10"/>
            <StatItem label="Votes Cast" value={total_voted.toLocaleString()}/>
            <div className="w-px h-12 bg-white/10"/>
            <StatItem label="Eligible Voters" value={total_students.toLocaleString()}/>
            <div className="w-px h-12 bg-white/10"/>
            <StatItem label="Positions" value={positions.length.toString()}/>

            {/* Last updated */}
            <div className={`ml-auto text-right transition-opacity duration-300 ${pulse?"opacity-100":"opacity-30"}`}>
              <p className="text-xs text-white/50">Updated</p>
              <p className="text-xs text-white/40 font-mono">{lastUpdated?.toLocaleTimeString("en-UG")}</p>
            </div>
          </div>
        </div>

        {/* ── POSITION TABS (tablet+) ──────────────────────────────────────── */}
        {positions.length > 1 && (
          <div className="hidden sm:flex items-center gap-2 px-4 sm:px-8 lg:px-12 py-3 border-b border-white/10 overflow-x-auto flex-shrink-0">
            {positions.map((p,i)=>(
              <button key={p.id} onClick={()=>goTo(i)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  i===currentPos?"bg-gold-500 text-forest-900":"bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                }`}>
                {p.title}
              </button>
            ))}
          </div>
        )}

        {/* Mobile position dots */}
        {positions.length > 1 && (
          <div className="sm:hidden flex items-center justify-center gap-2 py-3 border-b border-white/10 flex-shrink-0">
            {positions.map((_,i)=>(
              <button key={i} onClick={()=>goTo(i)}
                className={`rounded-full transition-all duration-300 ${i===currentPos?"w-5 h-2 bg-gold-500":"w-2 h-2 bg-white/20"}`}/>
            ))}
          </div>
        )}

        {/* ── MAIN RESULTS ─────────────────────────────────────────────────── */}
        <div className="flex-1 px-4 sm:px-8 lg:px-12 py-4 sm:py-6 lg:py-8 overflow-y-auto">
          {positions.length===0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/30 font-display text-xl">No results yet</p>
            </div>
          ) : (
            <div key={pos.id}>
              {/* Position title */}
              <div className="flex items-center gap-3 mb-5 sm:mb-8">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-white/30 font-display text-base lg:text-lg">Position</span>
                  <span className="w-7 h-7 lg:w-8 lg:h-8 rounded-full border border-white/20 flex items-center justify-center text-white/50 text-xs lg:text-sm">
                    {currentPos+1}
                  </span>
                </div>
                <div className="hidden sm:block flex-1 h-px bg-white/10"/>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white">{pos.title}</h2>
                <div className="flex-1 h-px bg-white/10"/>
              </div>

              {/* Candidates grid — responsive columns */}
              {pos.candidates.length===0 ? (
                <p className="text-white/30 text-center py-12">No candidates registered</p>
              ) : (()=>{
                const maxVotes = Math.max(...pos.candidates.map(c=>c.vote_count),1);
                const totalForPos = pos.candidates.reduce((s,c)=>s+c.vote_count,0);

                // Column count: mobile=1, sm=2, lg=3, xl=4 (max)
                const cols = Math.min(pos.candidates.length, 4);

                return (
                  <div className={`grid gap-3 sm:gap-4 lg:gap-5
                    ${cols>=4?"grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4":
                      cols===3?"grid-cols-1 sm:grid-cols-3":
                      cols===2?"grid-cols-1 sm:grid-cols-2":
                      "grid-cols-1 max-w-md mx-auto w-full"}`}>
                    {pos.candidates.map((c,rank)=>{
                      const isLeader = c.vote_count===maxVotes && c.vote_count>0;
                      const pct = totalForPos===0?0:Math.round((c.vote_count/totalForPos)*100);
                      const barW = maxVotes===0?0:Math.round((c.vote_count/maxVotes)*100);

                      return (
                        <div key={c.id} className={`rounded-2xl p-4 sm:p-5 lg:p-6 border transition-all duration-500 ${
                          isLeader?"border-gold-500/50 bg-gold-500/5 shadow-lg shadow-gold-500/10":"border-white/10 bg-white/5"
                        }`}>
                          {/* Top row */}
                          <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-display font-bold text-base sm:text-lg ${
                              isLeader?"bg-gold-500 text-forest-900":"bg-white/10 text-white/50"
                            }`}>
                              {isLeader?"★":rank+1}
                            </div>
                            {isLeader && (
                              <span className="text-xs font-medium text-gold-400 bg-gold-500/10 border border-gold-500/30 rounded-full px-2.5 py-0.5">Leading</span>
                            )}
                          </div>

                          {/* Name */}
                          <h3 className="font-display font-bold text-lg sm:text-xl lg:text-2xl xl:text-3xl text-white mb-0.5 leading-tight">{c.name}</h3>
                          {c.class_name && <p className="text-white/40 text-xs sm:text-sm mb-3 sm:mb-4">{c.class_name}</p>}

                          {/* Vote count */}
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className={`font-display font-bold text-3xl sm:text-4xl lg:text-5xl tabular-nums ${isLeader?"text-gold-400":"text-white"}`}>
                              {c.vote_count}
                            </span>
                            <span className="text-white/40 text-xs sm:text-sm">vote{c.vote_count!==1?"s":""}</span>
                          </div>

                          {/* Bar */}
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex-1 h-2 sm:h-3 rounded-full bg-white/10 overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-1000 ease-out ${isLeader?"bg-gold-500":"bg-white/30"}`}
                                style={{width:`${barW}%`}}/>
                            </div>
                            <span className={`text-xs sm:text-sm font-bold w-10 text-right tabular-nums flex-shrink-0 ${isLeader?"text-gold-400":"text-white/60"}`}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <footer className="px-4 sm:px-8 lg:px-12 py-3 border-t border-white/10 flex items-center justify-between flex-shrink-0">
          <p className="text-white/20 text-xs font-display hidden sm:block">VoteSecure — Uganda Secondary School E-Voting</p>
          <p className="text-white/20 text-xs">Auto-refreshes every {REFRESH_MS/1000}s</p>
        </footer>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label:string; value:string }) {
  return (
    <div>
      <p className="text-white/40 text-xs uppercase tracking-widest mb-0.5 lg:mb-1">{label}</p>
      <p className="font-display font-bold text-xl lg:text-3xl text-white">{value}</p>
    </div>
  );
}
