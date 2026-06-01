/* ============================================================
   APP — state, routing, persistence, office header
   ============================================================ */
(function(){
const { useState, useEffect } = React;
const U = window.UI;
const D = window.GAME_DATA;
const ENG = window.ENGINE;
const { Splash, Create, Dashboard, Briefing } = window.SCREENS1;
const { PolicyForm, Results, StateMap, Stakeholders } = window.SCREENS2;
const { Timeline, Election, GameOver } = window.SCREENS3;
const { Seal } = U;
const SAVE_KEY = "president_sim_save_v1";
const EVENTS = D.EVENTS, PARTIES = D.PARTIES;

const IN_OFFICE = ["dashboard","briefing","policy","results","map","stakeholders","timeline"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ---------- new-game construction ---------- */
function newGame({ name, party, bg }){
  const P = PARTIES[party];
  const lean = P.lean;
  const personaApproval = {};
  D.PERSONAS.forEach(p => {
    const base = 50 + (p.ideology/100) * lean * 16;
    personaApproval[p.id] = D.clampN(Math.round(base), 24, 76);
  });
  const stakeSupport = {};
  D.STAKEHOLDERS.forEach(st => {
    const base = 50 + (st.lean/100) * lean * 14;
    stakeSupport[st.id] = D.clampN(Math.round(base), 28, 72);
  });
  let partySupport = 58, stability = 55;
  const econ = { gdp:2.4, infl:3.2, unemp:4.6, debt:98 };

  // background modifiers
  if (bg==="gov"){ partySupport+=8; stability+=6; }
  if (bg==="sen"){ stability+=9; partySupport+=3; }
  if (bg==="gen"){ stakeSupport.defense=D.clampN(stakeSupport.defense+16,0,100); stability+=5; }
  if (bg==="ceo"){ stakeSupport.biz=D.clampN(stakeSupport.biz+16,0,100); econ.gdp+=0.4; partySupport+=2; }
  if (bg==="act"){ personaApproval.youth=D.clampN(personaApproval.youth+9,0,100); personaApproval.urban=D.clampN(personaApproval.urban+9,0,100); stakeSupport.biz=D.clampN(stakeSupport.biz-12,0,100); }

  const seed = (Date.now() & 0x7fffffff) >>> 0;
  const schedule = ENG.buildSchedule(seed);
  const states = D.buildStates(lean);

  const g = {
    name, party, bg, seed, schedule,
    month: 0,
    currentEventId: schedule[0],
    approval: 50, partySupport: D.clampN(partySupport,0,100), stability: D.clampN(stability,0,100),
    econ, personaApproval, stakeSupport, states,
    congress: { houseControl:"player", senateControl:"player", house:223, senate:51 },
    timeline: [],
    lastEval: null, status: null, forcedOut:false,
    pendingElection: null, electionWon:false, electionResult:null,
  };
  g.approval = D.clampN(Math.round(ENG.recomputeApproval(g)),0,100);
  normalize(g);
  return g;
}

function normalize(g){
  g.currentEvent = EVENTS.find(e => e.id === g.currentEventId) || EVENTS[0];
  return g;
}

/* ---------- persistence ---------- */
function loadSave(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const g = JSON.parse(raw);
    normalize(g);
    return g;
  } catch(e){ return null; }
}
function persist(g){
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(g)); } catch(e){}
}

/* ---------- header ---------- */
function OfficeHeader({ game, screen, go }){
  const yr = Math.floor(game.month/12)+1;
  const pct = (game.month/48)*100;
  const tabs = [["dashboard","Office"],["map","Map"],["stakeholders","Voters"],["timeline","Record"]];
  return (
    <header className="office-header">
      <div className="oh-left">
        <Seal size={40} party={PARTIES[game.party]} />
        <div className="oh-id">
          <div className="oh-name">{game.name}</div>
          <div className="oh-party" style={{ color:PARTIES[game.party].color }}>{PARTIES[game.party].name}</div>
        </div>
      </div>
      <div className="oh-center">
        <div className="oh-month">{MONTHS[game.month%12]} · Year {yr}</div>
        <div className="oh-progress"><div className="oh-progress-fill" style={{ width:pct+"%" }}></div></div>
        <div className="oh-mocount">Month {game.month+1} / 48</div>
      </div>
      <nav className="oh-nav">
        {tabs.map(([id,label]) => (
          <button key={id} className={"oh-tab"+(screen===id?" active":"")} onClick={()=>go(id)}>{label}</button>
        ))}
      </nav>
    </header>
  );
}

/* ---------- root ---------- */
function App(){
  const [game, setGame] = useState(() => loadSave());
  const [screen, setScreen] = useState(() => (loadSave() ? "splash" : "splash"));

  function commit(g){ normalize(g); persist(g); setGame({...g}); }
  function go(s){ setScreen(s); }

  const actions = {
    submitPolicy(text){
      const g = game;
      const evf = ENG.scorePolicy(text, g);
      evf.headlines = ENG.headlines(evf, g);
      ENG.applyEvaluation(g, evf);
      g.lastEval = evf;
      g.timeline.push({
        month: g.month, eventTitle: g.currentEvent.title, policy: text,
        verdict: evf.verdict, approvalDelta: evf.approvalDelta, headlines: evf.headlines,
      });
      commit(g);
      go("results");
    },
    advanceMonth(){
      const g = game;
      ENG.monthlyDrift(g);
      g.approval = D.clampN(Math.round(ENG.recomputeApproval(g)),0,100);
      // forced-out checks
      const st = ENG.checkStatus(g);
      if (st){ g.status = st; g.forcedOut = true; commit(g); go("gameover"); return; }
      const nm = g.month + 1;
      g.month = nm;
      if (nm === 22){ g.pendingElection = "midterm"; commit(g); go("election"); return; }
      if (nm === 46){ g.pendingElection = "presidential"; commit(g); go("election"); return; }
      if (nm >= 48){ g.status = { title:"Your Term Is Complete", line:"Forty-eight months. You served them all." }; commit(g); go("gameover"); return; }
      g.currentEventId = g.schedule[nm];
      g.lastEval = null;
      commit(g);
      go("dashboard");
    },
    resolveElection(R, won){
      const g = game;
      if (g.pendingElection === "midterm"){
        g.congress = { houseControl:R.houseControl, senateControl:R.senateControl, house:R.house, senate:R.senate };
        g.pendingElection = null;
        g.currentEventId = g.schedule[g.month];
        commit(g);
        go("dashboard");
      } else {
        g.electionWon = won;
        g.electionResult = R;
        g.status = won
          ? { title:"Re-elected to a Second Term", line:"The people have spoken. You earned four more years and a place in the history books." }
          : { title:"Defeated at the Ballot Box", line:"After one term, the country chose someone new. You leave office with your record intact, if not your job." };
        commit(g);
        go("gameover");
      }
    },
  };

  function startNew(){ go("create"); }
  function begin(opts){ const g = newGame(opts); persist(g); setGame(g); go("dashboard"); }
  function freshCareer(){ localStorage.removeItem(SAVE_KEY); setGame(null); go("create"); }

  // routing
  let body;
  if (screen === "splash") body = <Splash go={go} hasSave={!!game} onNew={()=> game ? startNew() : startNew()} />;
  else if (screen === "create") body = <Create onBegin={begin} go={go} />;
  else if (!game) body = <Splash go={go} hasSave={false} onNew={startNew} />;
  else if (screen === "dashboard") body = <Dashboard game={game} go={go} actions={actions} />;
  else if (screen === "briefing") body = <Briefing game={game} go={go} />;
  else if (screen === "policy") body = <PolicyForm game={game} go={go} actions={actions} />;
  else if (screen === "results") body = <Results game={game} go={go} actions={actions} />;
  else if (screen === "map") body = <StateMap game={game} go={go} />;
  else if (screen === "stakeholders") body = <Stakeholders game={game} go={go} />;
  else if (screen === "timeline") body = <Timeline game={game} go={go} />;
  else if (screen === "election") body = <Election game={game} go={go} actions={actions} />;
  else if (screen === "gameover") body = <GameOver game={game} onNew={freshCareer} />;
  else body = <Dashboard game={game} go={go} actions={actions} />;

  const showHeader = game && IN_OFFICE.includes(screen);

  return (
    <div className="app-root">
      {showHeader && <OfficeHeader game={game} screen={screen} go={go} />}
      <main className={"app-main"+(showHeader?" with-header":"")}>{body}</main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
})();
