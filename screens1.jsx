/* ============================================================
   SCREENS 1 — Splash, Character Creation, Dashboard, Briefing
   ============================================================ */
(function(){
const { useState } = React;
const U = window.UI;
const { PButton, Meter, Stat, Seal, Card, Eyebrow, Halftone, Avatar, Delta, approvalColor } = U;
const D = window.GAME_DATA;
const PARTIES = D.PARTIES;

const BACKGROUNDS = [
  { id:"gov", name:"State Governor", desc:"Ran a state. Party machine trusts you.", mods:"+ Party, + Stability" },
  { id:"sen", name:"U.S. Senator", desc:"A creature of the Capitol. You know the votes.", mods:"+ Stability, + Congress" },
  { id:"gen", name:"Retired General", desc:"Four stars. The brass salutes you.", mods:"+ Defense, + Stability" },
  { id:"ceo", name:"Business Leader", desc:"Built an empire. Markets like you.", mods:"+ Business, + Growth" },
  { id:"act", name:"Movement Organizer", desc:"Came up through the streets, not the cloakroom.", mods:"+ Base energy, − Business" },
];

/* ---------------- SPLASH ---------------- */
function Splash({ go, hasSave, onNew }){
  return (
    <div className="screen splash">
      <Halftone opacity={0.08} size={6} />
      <div className="splash-stripes" aria-hidden="true"></div>
      <div className="splash-inner">
        <Eyebrow color="#c63f2a">A Career in Public Service</Eyebrow>
        <h1 className="splash-title">THE<br/>PRESIDENT</h1>
        <div className="splash-rule"></div>
        <p className="splash-sub">Forty-eight months. One desk. A nation of two hundred million opinions.
          Type your policy. Live with the consequences.</p>
        <div className="splash-actions">
          <PButton variant="red" size="lg" onClick={onNew}>Start a New Career</PButton>
          {hasSave && <PButton variant="ink" size="lg" onClick={()=>go("dashboard")}>Continue in Office</PButton>}
        </div>
        <div className="splash-foot">EST. 2026 · OFFICE OF THE EXECUTIVE · NO POLLS ARE EVER FINAL</div>
      </div>
    </div>
  );
}

/* ---------------- CHARACTER CREATION ---------------- */
function Create({ onBegin, go }){
  const [name, setName] = useState("");
  const [party, setParty] = useState(null);
  const [bg, setBg] = useState(null);
  const ready = name.trim().length > 1 && party && bg;
  return (
    <div className="screen create">
      <Halftone opacity={0.05} />
      <div className="create-scroll">
      <div className="create-head">
        <Eyebrow>Declaration of Candidacy · Form 1</Eyebrow>
        <h2 className="create-title">Build Your Candidate</h2>
      </div>

      <div className="field">
        <label className="field-label">Name on the Ballot</label>
        <input className="field-input" value={name} maxLength={28}
          placeholder="e.g. Morgan A. Reyes" onChange={e=>setName(e.target.value)} />
      </div>

      <div className="field">
        <label className="field-label">Choose Your Party</label>
        <div className="party-grid">
          {Object.values(PARTIES).map(p => (
            <button key={p.id} className={"party-card"+(party===p.id?" sel":"")}
              style={{ "--pc": p.color }} onClick={()=>setParty(p.id)}>
              <div className="party-mark" style={{ background:p.color }}>{p.short}</div>
              <div className="party-name">{p.name}</div>
              <div className="party-blurb">{p.blurb}</div>
              {party===p.id && <div className="party-check">✓ SELECTED</div>}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label">Where You Came From</label>
        <div className="bg-grid">
          {BACKGROUNDS.map(b => (
            <button key={b.id} className={"bg-card"+(bg===b.id?" sel":"")} onClick={()=>setBg(b.id)}>
              <div className="bg-name">{b.name}</div>
              <div className="bg-desc">{b.desc}</div>
              <div className="bg-mods">{b.mods}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="create-actions">
        <PButton variant="ghost" onClick={()=>go("splash")}>Back</PButton>
        <PButton variant="red" size="lg" disabled={!ready}
          onClick={()=>onBegin({ name:name.trim(), party, bg })}>
          Take the Oath of Office
        </PButton>
      </div>
      </div>
    </div>
  );
}

/* ---------------- DASHBOARD ---------------- */
function Dashboard({ game, go, actions }){
  const ev = window.ENGINE;
  const proj = ev.electoralResult(game);
  const odds = ev.billOdds(game);
  const e = game.econ;
  const yr = Math.floor(game.month/12)+1;
  const moInYr = (game.month%12)+1;
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const lastTurn = game.timeline[game.timeline.length-1];

  // top movers among personas
  const movers = D.PERSONAS.map(p => ({ name:p.name, initials:p.initials, ideology:p.ideology,
    v: game.personaApproval[p.id] ?? 50 })).sort((a,b)=>b.v-a.v);

  return (
    <div className="screen dash">
      <div className="dash-grid">
        {/* Briefing CTA */}
        <Card className="dash-brief" tone="red">
          <Halftone opacity={0.08} color="#fff" />
          <div className="brief-cta-inner">
            <div>
              <Eyebrow color="#f3d9c9">{MONTHS[game.month%12]} · Year {yr} · Month {game.month+1} of 48</Eyebrow>
              <h3 className="brief-cta-title">{game.currentEvent.title}</h3>
              <p className="brief-cta-desc">{game.currentEvent.desc}</p>
            </div>
            <PButton variant="cream" size="lg" onClick={()=>go("briefing")}>Enter the Situation Room →</PButton>
          </div>
        </Card>

        {/* Approval big */}
        <Card className="dash-approval">
          <Eyebrow>National Approval</Eyebrow>
          <div className="approval-big" style={{ color: approvalColor(game.approval) }}>
            {game.approval.toFixed(0)}<span className="pct">%</span>
          </div>
          <Meter label="Approval vs. 50% line" value={game.approval} colorFn={approvalColor} />
          <div className="approval-sub">
            <Stat label="Party Backing" value={game.partySupport.toFixed(0)} suffix="%" />
            <Stat label="Govt. Stability" value={game.stability.toFixed(0)} suffix="%" />
          </div>
        </Card>

        {/* Economy */}
        <Card className="dash-econ">
          <Eyebrow>The Economy</Eyebrow>
          <div className="econ-grid">
            <Stat label="GDP Growth" value={e.gdp.toFixed(1)} suffix="%" tone={e.gdp>=2?"good":"bad"} />
            <Stat label="Unemployment" value={e.unemp.toFixed(1)} suffix="%" tone={e.unemp<=5?"good":"bad"} />
            <Stat label="Inflation" value={e.infl.toFixed(1)} suffix="%" tone={e.infl<=3?"good":"bad"} />
            <Stat label="Debt / GDP" value={e.debt.toFixed(0)} suffix="%" tone={e.debt<=100?"good":"bad"} />
          </div>
        </Card>

        {/* Congress + projection */}
        <Card className="dash-congress">
          <Eyebrow>Congress &amp; The Map</Eyebrow>
          <div className="cong-row">
            <div className="cong-item">
              <div className="cong-label">House</div>
              <div className={"cong-ctrl "+game.congress.houseControl}>{game.congress.houseControl==="player"?"YOURS":"OPP."}</div>
            </div>
            <div className="cong-item">
              <div className="cong-label">Senate</div>
              <div className={"cong-ctrl "+game.congress.senateControl}>{game.congress.senateControl==="player"?"YOURS":"OPP."}</div>
            </div>
            <div className="cong-item">
              <div className="cong-label">Bill Odds</div>
              <div className="cong-ctrl big">{odds}%</div>
            </div>
          </div>
          <div className="ev-bar" title="Projected electoral votes if the election were held today">
            <div className="ev-you" style={{ width:(proj.playerEV/538*100)+"%" }}>{proj.playerEV}</div>
            <div className="ev-opp" style={{ width:(proj.oppEV/538*100)+"%" }}>{proj.oppEV}</div>
          </div>
          <div className="ev-legend"><span>◼ You</span><span>270 to win</span><span>Opposition ◼</span></div>
          <button className="dash-link" onClick={()=>go("map")}>Open full state map →</button>
        </Card>

        {/* Coalition snapshot */}
        <Card className="dash-coalition">
          <Eyebrow>Your Coalition</Eyebrow>
          <div className="coalition-list">
            {movers.slice(0,4).map(m => (
              <div key={m.initials} className="coal-row">
                <Avatar initials={m.initials} ideology={m.ideology} size={34} />
                <span className="coal-name">{m.name}</span>
                <span className="coal-val" style={{ color: approvalColor(m.v) }}>{m.v.toFixed(0)}</span>
              </div>
            ))}
          </div>
          <button className="dash-link" onClick={()=>go("stakeholders")}>All voters &amp; stakeholders →</button>
        </Card>

        {/* Last move */}
        <Card className="dash-last">
          <Eyebrow>Last Decision</Eyebrow>
          {lastTurn ? (
            <div>
              <div className={"verdict-tag tone-"+lastTurn.verdict.tone}>{lastTurn.verdict.tag}</div>
              <p className="last-policy">"{lastTurn.policy.slice(0,120)}{lastTurn.policy.length>120?"…":""}"</p>
              <div className="last-head">{lastTurn.headlines.center}</div>
              <button className="dash-link" onClick={()=>go("timeline")}>Full timeline →</button>
            </div>
          ) : <p className="last-empty">No decisions yet. The country is waiting.</p>}
        </Card>
      </div>
    </div>
  );
}

/* ---------------- MONTHLY BRIEFING ---------------- */
function Briefing({ game, go }){
  const ev = game.currentEvent;
  const yr = Math.floor(game.month/12)+1;
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return (
    <div className="screen briefing">
      <Halftone opacity={0.05} />
      <div className="brief-doc">
        <div className="brief-stamp">CLASSIFIED · EYES ONLY</div>
        <div className="brief-masthead">
          <Seal size={54} party={PARTIES[game.party]} />
          <div>
            <div className="brief-from">PRESIDENTIAL DAILY BRIEF</div>
            <div className="brief-date">{MONTHS[game.month%12]}, Year {yr} of your term</div>
          </div>
        </div>
        <div className="brief-rule"></div>
        <Eyebrow color="#c63f2a">Situation</Eyebrow>
        <h2 className="brief-title">{ev.title}</h2>
        <p className="brief-body">{ev.desc}</p>
        <div className="brief-tags">
          {ev.tags.map(t => <span key={t} className="brief-tag">#{t}</span>)}
        </div>
        <div className="brief-rule thin"></div>
        <p className="brief-prompt">{ev.prompt}</p>
        <div className="brief-actions">
          <PButton variant="ghost" onClick={()=>go("dashboard")}>Review Dashboard</PButton>
          <PButton variant="red" size="lg" onClick={()=>go("policy")}>Draft Your Response →</PButton>
        </div>
      </div>
    </div>
  );
}

window.SCREENS1 = { Splash, Create, Dashboard, Briefing, BACKGROUNDS };
})();
