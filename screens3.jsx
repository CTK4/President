/* ============================================================
   SCREENS 3 — Timeline, Election Night, Game Over / Legacy
   ============================================================ */
(function(){
const { useState, useEffect, useRef } = React;
const U = window.UI;
const { PButton, Meter, Stat, Card, Eyebrow, Halftone, Seal, Delta, approvalColor } = U;
const D = window.GAME_DATA;
const ENG = window.ENGINE;
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ---------------- TIMELINE ---------------- */
function Timeline({ game, go }){
  const items = [...game.timeline].reverse();
  return (
    <div className="screen timelinescreen">
      <div className="tl-head">
        <Eyebrow>The Record · {game.timeline.length} decisions</Eyebrow>
        <h2 className="tl-title">Presidential Timeline</h2>
      </div>
      {items.length === 0 ? (
        <p className="tl-empty">History hasn't started yet. Make your first decision.</p>
      ) : (
        <div className="tl-track">
          {items.map((t,i) => (
            <div key={i} className="tl-item">
              <div className="tl-spine">
                <div className={"tl-dot tone-"+t.verdict.tone}></div>
                {i<items.length-1 && <div className="tl-line"></div>}
              </div>
              <Card className="tl-card">
                <div className="tl-month">{MONTHS[t.month%12]} · Yr {Math.floor(t.month/12)+1}</div>
                <div className="tl-event">{t.eventTitle}</div>
                <div className={"verdict-tag small tone-"+t.verdict.tone}>{t.verdict.tag} · {t.approvalDelta>0?"+":""}{t.approvalDelta}%</div>
                <p className="tl-policy">"{t.policy.slice(0,160)}{t.policy.length>160?"…":""}"</p>
                <div className="tl-headline">{t.headlines.center}</div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- ELECTION NIGHT ---------------- */
function Election({ game, go, actions }){
  const mode = game.pendingElection; // "midterm" | "presidential"
  const [phase, setPhase] = useState("intro");
  const [count, setCount] = useState({ a:0, b:0 });
  const result = useRef(null);

  if (!result.current){
    result.current = mode === "presidential" ? ENG.electoralResult(game) : ENG.midtermResult(game);
  }
  const R = result.current;

  // count-up animation
  useEffect(() => {
    if (phase !== "counting") return;
    const targA = mode === "presidential" ? R.playerEV : R.house;
    const targB = mode === "presidential" ? R.oppEV : (435 - R.house);
    let step = 0;
    const id = setInterval(() => {
      step++;
      const t = Math.min(1, step/40);
      const e = 1 - Math.pow(1-t, 3);
      setCount({ a: Math.round(targA*e), b: Math.round(targB*e) });
      if (t >= 1){ clearInterval(id); setTimeout(()=>setPhase("done"), 500); }
    }, 35);
    return () => clearInterval(id);
  }, [phase]);

  const won = mode === "presidential" ? R.playerEV >= 270 : R.houseControl === "player";

  return (
    <div className="screen electionscreen">
      <Halftone opacity={0.07} color="#fff" />
      <div className="elec-inner">
        <div className="elec-banner">{mode === "presidential" ? "ELECTION NIGHT" : "THE MIDTERMS"}</div>
        <div className="elec-sub">{mode === "presidential" ? "Year 4 · The nation decides on a second term" : "Year 2 · Voters render their verdict on Congress"}</div>

        {phase === "intro" && (
          <div className="elec-intro">
            <Seal size={90} party={D.PARTIES[game.party]} />
            <p className="elec-introtext">
              {mode==="presidential"
                ? "Forty-six months of decisions come down to tonight. The polls are closing."
                : "Every seat in the House and a third of the Senate are on the ballot. Your record is on trial."}
            </p>
            <PButton variant="cream" size="lg" onClick={()=>setPhase("counting")}>Watch the Returns →</PButton>
          </div>
        )}

        {phase !== "intro" && (
          <div className="elec-board">
            {mode === "presidential" ? (
              <>
                <div className="tally">
                  <div className="tally-side you">
                    <div className="tally-name">YOU</div>
                    <div className="tally-num">{count.a}</div>
                  </div>
                  <div className="tally-vs">270<span>to win</span></div>
                  <div className="tally-side opp">
                    <div className="tally-name">OPPOSITION</div>
                    <div className="tally-num">{count.b}</div>
                  </div>
                </div>
                <div className="ev-bar huge">
                  <div className="ev-you" style={{ width:(count.a/538*100)+"%" }}></div>
                  <div className="ev-opp" style={{ width:(count.b/538*100)+"%" }}></div>
                  <div className="ev-270"></div>
                </div>
              </>
            ) : (
              <>
                <div className="tally">
                  <div className="tally-side you">
                    <div className="tally-name">YOUR PARTY</div>
                    <div className="tally-num">{count.a}</div>
                    <div className="tally-cap">House seats</div>
                  </div>
                  <div className="tally-vs">218<span>for control</span></div>
                  <div className="tally-side opp">
                    <div className="tally-name">OPPOSITION</div>
                    <div className="tally-num">{count.b}</div>
                    <div className="tally-cap">House seats</div>
                  </div>
                </div>
                <div className="midterm-senate">Senate projection: <b>{R.senate}</b> of 100 — {R.senateControl==="player"?"you hold it":"opposition flips it"}</div>
              </>
            )}

            {phase === "done" && (
              <div className={"elec-call "+(won?"win":"lose")}>
                <div className="call-tag">{won ? "PROJECTED WINNER" : (mode==="presidential"?"PROJECTED DEFEAT":"CONGRESS LOST")}</div>
                <div className="call-line">
                  {mode === "presidential"
                    ? (won ? "America grants you a second term. The work continues." : "The country chose another direction. Your presidency ends here.")
                    : (won ? "Your party holds the House. A governing majority survives." : "The opposition seizes Congress. Governing just got harder.")}
                </div>
                <PButton variant={won?"cream":"ink"} size="lg" onClick={()=>actions.resolveElection(R, won)}>
                  {mode === "presidential" ? "See Your Legacy →" : "Back to Governing →"}
                </PButton>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- GAME OVER / LEGACY ---------------- */
function GameOver({ game, onNew }){
  const s = game.status || { title:"Term Concluded", line:"Your time in office has ended." };
  const avgApproval = game.approval;
  const decisions = game.timeline.length;
  const best = [...game.timeline].sort((a,b)=>b.approvalDelta-a.approvalDelta)[0];
  const worst = [...game.timeline].sort((a,b)=>a.approvalDelta-b.approvalDelta)[0];

  // Legacy rank
  const score = avgApproval*0.5 + game.stability*0.2 + (game.econ.gdp-game.econ.unemp-game.econ.infl+10)*1.5
    + (game.electionWon?20:0) + (game.status && game.status.type ? -25 : 0);
  let rank, rankLine;
  if (game.status && game.status.type){ rank="DISGRACED"; rankLine="Your name became a cautionary tale."; }
  else if (score >= 78){ rank="TRANSFORMATIONAL"; rankLine="Historians will teach your presidency for a century."; }
  else if (score >= 62){ rank="CONSEQUENTIAL"; rankLine="A solid, respected tenure that left a mark."; }
  else if (score >= 46){ rank="MIDDLING"; rankLine="You governed. The republic endured. Few will remember."; }
  else { rank="FORGETTABLE"; rankLine="A presidency that history filed away and forgot."; }

  return (
    <div className="screen gameover">
      <Halftone opacity={0.08} size={6} />
      <div className="go-inner">
        <Eyebrow color="#c63f2a">Legacy Assessment</Eyebrow>
        <h1 className="go-title">{s.title}</h1>
        <p className="go-line">{s.line}</p>

        <div className="go-rank">
          <div className="go-rank-label">FINAL VERDICT OF HISTORY</div>
          <div className="go-rank-tag">{rank}</div>
          <div className="go-rank-line">{rankLine}</div>
        </div>

        <div className="go-stats">
          <Stat label="Months Served" value={game.month} suffix={"/48"} />
          <Stat label="Final Approval" value={avgApproval.toFixed(0)} suffix="%" />
          <Stat label="Decisions Made" value={decisions} />
          <Stat label="Final GDP" value={game.econ.gdp.toFixed(1)} suffix="%" />
          <Stat label="Unemployment" value={game.econ.unemp.toFixed(1)} suffix="%" />
          <Stat label="Stability" value={game.stability.toFixed(0)} suffix="%" />
        </div>

        {best && (
          <div className="go-moments">
            <div className="go-moment">
              <div className="gm-label good">Your Finest Hour</div>
              <div className="gm-event">{best.eventTitle}</div>
              <div className="gm-head">{best.headlines.center}</div>
            </div>
            {worst && worst!==best && (
              <div className="go-moment">
                <div className="gm-label bad">Your Lowest Point</div>
                <div className="gm-event">{worst.eventTitle}</div>
                <div className="gm-head">{worst.headlines.center}</div>
              </div>
            )}
          </div>
        )}

        <PButton variant="red" size="lg" onClick={onNew}>Begin a New Career</PButton>
      </div>
    </div>
  );
}

window.SCREENS3 = { Timeline, Election, GameOver };
})();
