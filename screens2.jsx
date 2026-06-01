/* ============================================================
   SCREENS 2 — Policy Form, Reaction Results, State Map, Stakeholders
   ============================================================ */
(function(){
const { useState, useMemo } = React;
const U = window.UI;
const { PButton, Meter, Stat, Card, Eyebrow, Halftone, Avatar, Delta, approvalColor, supportColor } = U;
const D = window.GAME_DATA;
const ENG = window.ENGINE;

/* ---------------- POLICY RESPONSE FORM ---------------- */
const ANGLES = [
  "Propose new spending", "Cut taxes", "Tighten regulation", "Deregulate",
  "Call for bipartisan compromise", "Take executive action", "Launch a task force",
  "Strengthen the border", "Invest in healthcare", "Back the unions", "Boost defense", "Go green",
];

function PolicyForm({ game, go, actions }){
  const ev = game.currentEvent;
  const [text, setText] = useState("");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const ok = words >= 3;

  function addAngle(a){
    setText(t => (t.trim() ? t.trim() + " " : "") + a.toLowerCase() + ". ");
  }

  return (
    <div className="screen policy">
      <Halftone opacity={0.05} />
      <div className="policy-wrap">
        <div className="policy-context">
          <Eyebrow color="#c63f2a">Responding to</Eyebrow>
          <h2 className="policy-event">{ev.title}</h2>
          <p className="policy-promptline">{ev.prompt}</p>
        </div>

        <div className="policy-editor">
          <div className="editor-frame">
            <div className="editor-tab">DRAFT POLICY STATEMENT</div>
            <textarea className="editor-area" value={text} autoFocus
              placeholder="Address the nation in your own words. Name what you'll do, who pays, and why. Specifics move opinion — vague platitudes get punished."
              onChange={e=>setText(e.target.value)} />
            <div className="editor-foot">
              <span className={"wc"+(words>90?" warn":"")}>{words} words {words>90?"· running long":""}</span>
              <span className="editor-hint">Tip: name programs, funding, and tradeoffs.</span>
            </div>
          </div>

          <div className="angles">
            <div className="angles-label">Quick angles</div>
            <div className="angles-row">
              {ANGLES.map(a => <button key={a} className="angle-chip" onClick={()=>addAngle(a)}>{a}</button>)}
            </div>
          </div>
        </div>

        <div className="policy-actions">
          <PButton variant="ghost" onClick={()=>go("briefing")}>Back to Brief</PButton>
          <PButton variant="red" size="lg" disabled={!ok} onClick={()=>actions.submitPolicy(text)}>
            Deliver the Address →
          </PButton>
        </div>
      </div>
    </div>
  );
}

/* ---------------- REACTION RESULTS ---------------- */
function Results({ game, go, actions }){
  const r = game.lastEval;
  if (!r) return <div className="screen"><p style={{padding:40}}>No results.</p></div>;
  const personas = D.PERSONAS;
  const stakes = D.STAKEHOLDERS;
  const papers = r.headlines;

  return (
    <div className="screen results">
      <Halftone opacity={0.05} />
      <div className="results-scroll">
        {/* Verdict banner */}
        <div className={"verdict-banner tone-"+r.verdict.tone}>
          <Halftone opacity={0.1} color="#fff" />
          <div className="verdict-inner">
            <div className="verdict-big">{r.verdict.tag}</div>
            <p className="verdict-line">{r.verdict.line}</p>
            <div className="verdict-stats">
              <div className="vstat"><span className="vstat-label">Approval</span><Delta v={r.approvalDelta} suffix="%" /></div>
              <div className="vstat"><span className="vstat-label">Party</span><Delta v={r.partyDelta} /></div>
              <div className="vstat"><span className="vstat-label">Stability</span><Delta v={r.stabilityDelta} /></div>
            </div>
          </div>
        </div>

        {/* Headlines */}
        <Eyebrow>Tomorrow's Front Pages</Eyebrow>
        <div className="papers">
          <div className="paper paper-left">
            <div className="paper-name">THE PROGRESSIVE</div>
            <div className="paper-head">{papers.left}</div>
          </div>
          <div className="paper paper-center">
            <div className="paper-name">THE NATIONAL RECORD</div>
            <div className="paper-head">{papers.center}</div>
          </div>
          <div className="paper paper-right">
            <div className="paper-name">THE STANDARD</div>
            <div className="paper-head">{papers.right}</div>
          </div>
        </div>

        <div className="results-cols">
          {/* Voter reactions */}
          <Card className="results-voters">
            <Eyebrow>How Voters Took It</Eyebrow>
            <div className="react-grid">
              {personas.map((p,i) => {
                const pr = r.personaResults[i];
                return (
                  <div key={p.id} className="react-row">
                    <Avatar initials={p.initials} ideology={p.ideology} size={32} />
                    <div className="react-name">{p.name}{pr.crossed && <span className="redline">crossed a red line</span>}</div>
                    <Delta v={pr.delta} />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Stakeholder reactions */}
          <Card className="results-stakes">
            <Eyebrow>Stakeholder Movement</Eyebrow>
            <div className="react-grid">
              {stakes.map((st,i) => {
                const sr = r.stakeResults[i];
                if (sr.delta === 0) return null;
                return (
                  <div key={st.id} className="react-row">
                    <div className={"lean-dot "+(st.lean>15?"r":st.lean<-15?"b":"n")}></div>
                    <div className="react-name">{st.name}</div>
                    <Delta v={sr.delta} />
                  </div>
                );
              })}
              {r.stakeResults.every(s=>s.delta===0) && <div className="react-empty">No major group moved.</div>}
            </div>
          </Card>
        </div>

        {/* Economy impact */}
        {(r.econDelta.gdp||r.econDelta.infl||r.econDelta.debt||r.econDelta.unemp) ? (
          <Card className="results-econ">
            <Eyebrow>Economic Ripples</Eyebrow>
            <div className="econ-deltas">
              <div className="ed"><span>GDP</span><Delta v={r.econDelta.gdp} suffix="%" /></div>
              <div className="ed"><span>Inflation</span><Delta v={r.econDelta.infl} suffix="%" /></div>
              <div className="ed"><span>Unemployment</span><Delta v={r.econDelta.unemp} suffix="%" /></div>
              <div className="ed"><span>Debt/GDP</span><Delta v={r.econDelta.debt} suffix="%" /></div>
            </div>
          </Card>
        ) : null}

        <div className="results-actions">
          <PButton variant="ink" onClick={()=>go("map")}>See the Map</PButton>
          <PButton variant="red" size="lg" onClick={()=>actions.advanceMonth()}>Advance to Next Month →</PButton>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STATE MAP ---------------- */
function StateMap({ game, go }){
  const [sel, setSel] = useState(null);
  const proj = ENG.electoralResult(game);
  const withYou = game.states.filter(s=>s.approval>=50).length;
  const battle = [...game.states].sort((a,b)=>Math.abs(a.approval-50)-Math.abs(b.approval-50)).slice(0,5);
  const COLS = 11, ROWS = 8;

  return (
    <div className="screen mapscreen">
      <div className="map-head">
        <Eyebrow>Approval by State · 50 States</Eyebrow>
        <h2 className="map-title">The National Map</h2>
      </div>
      <div className="map-layout">
        <div className="tilegrid" style={{ gridTemplateColumns:`repeat(${COLS},1fr)`, gridTemplateRows:`repeat(${ROWS},1fr)` }}>
          {game.states.map(s => (
            <button key={s.abbr}
              className={"tile"+(sel===s.abbr?" tilesel":"")}
              style={{ gridColumn:s.col+1, gridRow:s.row+1, background:approvalColor(s.approval) }}
              onClick={()=>setSel(s.abbr)}
              title={`${s.name} · ${s.approval.toFixed(0)}% · ${s.ev} EV`}>
              <span className="tile-abbr">{s.abbr}</span>
              <span className="tile-ev">{s.ev}</span>
            </button>
          ))}
        </div>

        <div className="map-side">
          <Card className="map-proj">
            <Eyebrow>If the election were today</Eyebrow>
            <div className="ev-bar big">
              <div className="ev-you" style={{ width:(proj.playerEV/538*100)+"%" }}>{proj.playerEV}</div>
              <div className="ev-opp" style={{ width:(proj.oppEV/538*100)+"%" }}>{proj.oppEV}</div>
            </div>
            <div className="ev-legend"><span>◼ You</span><span>270 wins</span><span>Opp ◼</span></div>
            <div className="map-substat">
              <Stat label="States With You" value={withYou} suffix={"/50"} />
              <Stat label="Avg. Approval" value={(game.states.reduce((a,s)=>a+s.approval,0)/50).toFixed(0)} suffix="%" />
            </div>
          </Card>

          {sel ? (() => {
            const s = game.states.find(x=>x.abbr===sel);
            return (
              <Card className="map-detail">
                <div className="md-name">{s.name}</div>
                <div className="md-lean">{s.lean>15?"Leans Liberty":s.lean<-15?"Leans Commonwealth":"Battleground"} · {s.ev} electoral votes</div>
                <Meter label="Approval here" value={s.approval} colorFn={approvalColor} />
                <div className="md-foot">Economy weight {(s.economyWeight*100).toFixed(0)}% · Social {(s.socialWeight*100).toFixed(0)}%</div>
              </Card>
            );
          })() : (
            <Card className="map-battle">
              <Eyebrow>Closest Battlegrounds</Eyebrow>
              {battle.map(s => (
                <div key={s.abbr} className="battle-row" onClick={()=>setSel(s.abbr)}>
                  <span className="bg-abbr">{s.abbr}</span>
                  <span className="bg-name">{s.name}</span>
                  <span className="bg-ev">{s.ev} EV</span>
                  <span className="bg-val" style={{color:approvalColor(s.approval)}}>{s.approval.toFixed(0)}%</span>
                </div>
              ))}
            </Card>
          )}

          <div className="map-legendbar">
            <span>Against</span>
            <div className="legend-grad"></div>
            <span>With you</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STAKEHOLDERS / VOTERS ---------------- */
function Stakeholders({ game, go }){
  const personas = D.PERSONAS;
  const stakes = D.STAKEHOLDERS;
  return (
    <div className="screen stakescreen">
      <div className="stake-head">
        <Eyebrow>The Coalition Ledger</Eyebrow>
        <h2 className="stake-title">Voters &amp; Stakeholders</h2>
      </div>
      <div className="stake-section">
        <div className="section-bar">Voter Personas · {personas.length} blocs</div>
        <div className="persona-grid">
          {personas.map(p => {
            const v = game.personaApproval[p.id] ?? 50;
            return (
              <Card key={p.id} className="persona-card">
                <div className="pc-head">
                  <Avatar initials={p.initials} ideology={p.ideology} size={42} />
                  <div>
                    <div className="pc-name">{p.name}</div>
                    <div className="pc-ideo">{p.ideology>18?"Conservative":p.ideology<-18?"Progressive":"Centrist"} · {p.weight}% of voters</div>
                  </div>
                </div>
                <p className="pc-blurb">{p.blurb}</p>
                <Meter label="Approval" value={v} colorFn={approvalColor} />
              </Card>
            );
          })}
        </div>
      </div>

      <div className="stake-section">
        <div className="section-bar">Stakeholder Groups · {stakes.length} blocs</div>
        <div className="stake-grid">
          {stakes.map(st => {
            const v = game.stakeSupport[st.id] ?? 50;
            return (
              <Card key={st.id} className="stake-card">
                <div className="sc-head">
                  <div className={"lean-dot big "+(st.lean>15?"r":st.lean<-15?"b":"n")}></div>
                  <div className="sc-name">{st.name}</div>
                </div>
                <Meter label="Support" value={v} colorFn={supportColor} />
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.SCREENS2 = { PolicyForm, Results, StateMap, Stakeholders };
})();
