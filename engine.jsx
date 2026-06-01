/* ============================================================
   President Career Sim — ENGINE
   Deterministic scoring + effect application. No randomness in
   scoring; a seeded RNG only sequences events.
   ============================================================ */
(function(){
const D = window.GAME_DATA;
const { LEXICON, PERSONAS, STAKEHOLDERS, PARTIES, EVENTS, clampN } = D;

/* ---------- seeded RNG (mulberry32) ---------- */
function rng(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---------- event scheduling ---------- */
// 48 months. Fixed crisis beats + shuffled deck for the rest.
function buildSchedule(seed){
  const r = rng(seed);
  const deck = [...EVENTS];
  // Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--){
    const j = Math.floor(r() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const sched = [];
  for (let m = 0; m < 48; m++){
    sched.push(deck[m % deck.length].id);
  }
  return sched;
}

/* ---------- policy scoring ---------- */
function matchLexicon(text){
  const t = (" " + text.toLowerCase() + " ").replace(/[^a-z0-9\s-]/g, " ");
  const hits = [];
  for (const e of LEXICON){
    if (t.includes(e.kw)) hits.push(e);
  }
  return hits;
}

function tagsFromHits(hits){
  const s = new Set();
  hits.forEach(h => h.tags.forEach(t => s.add(t)));
  return s;
}

function kwPresent(text, kwList){
  const t = text.toLowerCase();
  return kwList.some(k => t.includes(k));
}

// Returns a full evaluation object (no state mutation).
function scorePolicy(text, game){
  const event = EVENTS.find(e => e.id === game.currentEventId);
  const party = PARTIES[game.party];
  const hits = matchLexicon(text);
  const tagSet = tagsFromHits(hits);
  const words = text.trim().split(/\s+/).filter(Boolean);

  // Net economic lean of the policy (-3..+3 avg)
  let leanSum = 0, leanCount = 0, stabilitySig = 0;
  const econDelta = { gdp:0, infl:0, debt:0, unemp:0 };
  for (const h of hits){
    leanSum += h.lean; leanCount++;
    if (h.stability) stabilitySig += h.stability;
    if (h.econ){
      econDelta.gdp  += h.econ.gdp  || 0;
      econDelta.infl += h.econ.infl || 0;
      econDelta.debt += h.econ.debt || 0;
      econDelta.unemp+= h.econ.unemp|| 0;
    }
  }
  const policyLean = leanCount ? leanSum / leanCount : 0; // -3..+3

  // Relevance: did the policy address the event?
  let relevance = 0;
  event.tags.forEach(tag => { if (tagSet.has(tag)) relevance += 1; });
  const addressed = relevance > 0;

  // Substance & clarity heuristics
  const substance = clampN(words.length / 28, 0, 1);     // 0..1, peaks ~28 words
  const vague = words.length < 6 || hits.length === 0;
  const overlong = words.length > 90;

  // ---- per-persona reaction ----
  const personaResults = PERSONAS.map(p => {
    let s = 0;
    p.values.forEach(v => { if (kwPresent(text, v.kw)) s += v.w; });
    let crossed = false;
    p.redLines.forEach(rl => { if (text.toLowerCase().includes(rl)) { s -= 22; crossed = true; } });

    // Ideological alignment of the policy with this persona
    const ideoAlign = -Math.abs((policyLean * 18) - p.ideology) / 100; // closer => nearer 0
    s += (ideoAlign + 0.6) * 14; // shift so a good match adds, far match subtracts

    // Addressing the crisis at all earns goodwill
    if (addressed) s += 5 + relevance * 2;
    if (vague) s -= 8;
    s += substance * 4;

    const delta = clampN(Math.round(s * 0.45), -22, 22);
    return { id: p.id, name: p.name, initials: p.initials, weight: p.weight,
             before: p.approval !== undefined ? null : null, delta, crossed,
             ideology: p.ideology };
  });

  // ---- per-stakeholder reaction ----
  const stakeResults = STAKEHOLDERS.map(st => {
    let matched = 0;
    st.interests.forEach(iv => { if (text.toLowerCase().includes(iv)) matched++; });
    // Alignment between stakeholder lean and policy lean
    const align = (Math.sign(st.lean) === Math.sign(policyLean) && policyLean !== 0) ? 1
                : (policyLean === 0 ? 0 : -1);
    let s = matched * 6 + align * (Math.abs(st.lean)/100) * 10;
    const delta = clampN(Math.round(s), -16, 16);
    return { id: st.id, name: st.name, delta, matched, lean: st.lean };
  });

  // ---- national approval delta (weighted persona avg) ----
  let wsum = 0, acc = 0;
  personaResults.forEach(pr => { acc += pr.delta * pr.weight; wsum += pr.weight; });
  let approvalDelta = acc / wsum; // ~ -22..22

  // ---- party support delta ----
  // Reward alignment with the player's own party lean.
  const partyAlign = policyLean * party.lean; // + if matches party
  let partyDelta = clampN(partyAlign * 3 + (addressed ? 1 : -1), -10, 10);

  // ---- stability delta ----
  let stabilityDelta = stabilitySig;
  if (vague) stabilityDelta -= 4;
  if (overlong) stabilityDelta -= 2;
  if (addressed) stabilityDelta += 2;
  // Contradiction: policy contains both strong left & strong right signals
  const hasLeft = hits.some(h => h.lean <= -2), hasRight = hits.some(h => h.lean >= 2);
  if (hasLeft && hasRight) stabilityDelta -= 5;
  stabilityDelta = clampN(stabilityDelta, -10, 8);

  // ---- scale economy deltas (monthly) ----
  const econScaled = {
    gdp: round1(econDelta.gdp * 0.5),
    infl: round1(econDelta.infl * 0.5),
    debt: round1(econDelta.debt * 1.2),
    unemp: round1(econDelta.unemp * 0.4),
  };

  // ---- overall verdict label ----
  const verdict = labelFor(approvalDelta, addressed, vague);

  return {
    text, policyLean, hits: hits.map(h=>h.kw), tagSet:[...tagSet],
    addressed, relevance, vague, substance, words: words.length,
    personaResults, stakeResults,
    approvalDelta: round1(approvalDelta),
    partyDelta: round1(partyDelta),
    stabilityDelta: Math.round(stabilityDelta),
    econDelta: econScaled,
    verdict, event,
  };
}

function labelFor(d, addressed, vague){
  if (vague) return { tag:"EVASIVE", tone:"bad", line:"Voters saw a leader dodging the question." };
  if (d >= 9) return { tag:"TRIUMPH", tone:"great", line:"A defining moment. The country rallies behind you." };
  if (d >= 4) return { tag:"WELL RECEIVED", tone:"good", line:"A solid response that moved opinion your way." };
  if (d >= 0.5) return { tag:"MODEST GAIN", tone:"ok", line:"Cautiously received. You held the room." };
  if (d > -3) return { tag:"DIVISIVE", tone:"ok", line:"It split the country down the middle." };
  if (d > -8) return { tag:"BACKLASH", tone:"bad", line:"The response landed poorly across the board." };
  return { tag:"FIASCO", tone:"awful", line:"A serious misstep that will follow you for months." };
}

/* ---------- headlines (left / center / right) ---------- */
function headlines(evalResult, game){
  const ev = evalResult.event;
  const d = evalResult.approvalDelta;
  const lean = evalResult.policyLean;
  const goodC = d >= 4, badC = d <= -4;
  const L = (() => {
    if (lean <= -1) return goodC ? `Bold action wins praise on "${ev.title}"` : `Activists cheer direction but demand the President go further`;
    if (lean >= 1) return `Progressives slam the President's right turn on "${ev.title}"`;
    return badC ? `Half-measures on "${ev.title}" leave the base cold` : `President urged to show more ambition`;
  })();
  const C = (() => {
    if (goodC) return `President steadies the nation amid "${ev.title}"`;
    if (badC) return `President under fire after rocky "${ev.title}" response`;
    return `President responds to "${ev.title}" as country watches`;
  })();
  const R = (() => {
    if (lean >= 1) return goodC ? `Common-sense response to "${ev.title}" earns rare bipartisan nod` : `Opposition: President's plan won't fix "${ev.title}"`;
    if (lean <= -1) return `Editorial: President's big-government answer to "${ev.title}" will backfire`;
    return badC ? `Weak and wandering: the President fumbles "${ev.title}"` : `Opposition demands a tougher line`;
  })();
  return { left:L, center:C, right:R };
}

/* ---------- apply an evaluation to game state (returns new snapshot deltas) ---------- */
function applyEvaluation(game, ev){
  // Personas
  PERSONAS.forEach((p, i) => {
    const pr = ev.personaResults[i];
    game.personaApproval[p.id] = clampN(round1((game.personaApproval[p.id] ?? 50) + pr.delta), 0, 100);
  });
  // Stakeholders
  STAKEHOLDERS.forEach((st, i) => {
    const sr = ev.stakeResults[i];
    game.stakeSupport[st.id] = clampN(Math.round((game.stakeSupport[st.id] ?? 50) + sr.delta), 0, 100);
  });
  // National approval = weighted persona average (recomputed for truth)
  game.approval = clampN(round1(recomputeApproval(game)), 0, 100);
  // Party + stability
  game.partySupport = clampN(round1(game.partySupport + ev.partyDelta), 0, 100);
  game.stability = clampN(game.stability + ev.stabilityDelta, 0, 100);
  // Economy
  game.econ.gdp   = round1(clampN(game.econ.gdp + ev.econDelta.gdp, -6, 8));
  game.econ.infl  = round1(clampN(game.econ.infl + ev.econDelta.infl, 0, 14));
  game.econ.debt  = round1(clampN(game.econ.debt + ev.econDelta.debt, 60, 180));
  game.econ.unemp = round1(clampN(game.econ.unemp + ev.econDelta.unemp, 2.5, 14));

  // States: nationalEffect*0.5 + issueMatch - leanPenalty
  const lean = ev.policyLean;
  game.states.forEach(s => {
    const issueMatch = (Math.sign(s.lean) === Math.sign(lean) && lean !== 0)
      ? (Math.abs(s.lean)/100) * 4 : (lean !== 0 ? -(Math.abs(s.lean)/100) * 4 : 0);
    const econKick = (ev.econDelta.gdp - ev.econDelta.unemp*1.5 - ev.econDelta.infl) * s.economyWeight * 1.2;
    const delta = ev.approvalDelta * 0.4 + issueMatch + econKick;
    s.approval = clampN(round1(s.approval + delta), 4, 96);
  });
  return game;
}

function recomputeApproval(game){
  let acc = 0, w = 0;
  PERSONAS.forEach(p => { acc += (game.personaApproval[p.id] ?? 50) * p.weight; w += p.weight; });
  return acc / w;
}

/* ---------- monthly drift (between turns) ---------- */
function monthlyDrift(game){
  const e = game.econ;
  // Economy nudges approval; misery index pressure.
  const misery = e.infl + e.unemp;             // ~ 7-28
  const pressure = (misery - 11) * 0.25;        // >11 hurts
  const growthBoost = (e.gdp - 2) * 0.4;        // >2% helps
  const drift = growthBoost - pressure;
  game.states.forEach(s => {
    s.approval = clampN(round1(s.approval + drift * (0.6 + s.economyWeight)), 4, 96);
  });
  // Mild mean-reversion of stability toward 55
  game.stability = clampN(Math.round(game.stability + (55 - game.stability) * 0.06), 0, 100);
  // Natural economic drift toward normal
  e.infl = round1(e.infl + (2.5 - e.infl) * 0.05);
  e.unemp = round1(e.unemp + (4.5 - e.unemp) * 0.05);
  e.gdp = round1(e.gdp + (2.2 - e.gdp) * 0.05);
}

/* ---------- elections ---------- */
function electoralResult(game){
  let demEV = 0, gopEV = 0; // "player" vs "opposition"
  const econBonus = (game.econ.gdp - 2.2) * 1.5 - (game.econ.infl - 2.5) * 1.2 - (game.econ.unemp - 4.5) * 1.4;
  const states = game.states.map(s => {
    const margin = (s.approval - 50) + econBonus + 1.5 /* incumbency */;
    const win = margin > 0;
    if (win) demEV += s.ev; else gopEV += s.ev;
    return { abbr:s.abbr, ev:s.ev, win, margin: round1(margin) };
  });
  return { playerEV: demEV, oppEV: gopEV, states, econBonus: round1(econBonus) };
}

function midtermResult(game){
  // Seats swing with approval. Baseline: player party holds slim margins.
  const swing = Math.round((game.approval - 50) * 0.9 + (game.econ.gdp - 2.2) * 2 - (game.econ.infl - 2.5) * 1.5);
  const house = clampN(218 + swing, 150, 290);   // player party House seats (of 435)
  const senate = clampN(50 + Math.round(swing/9), 38, 64);
  return {
    swing, house, senate,
    houseControl: house >= 218 ? "player" : "opposition",
    senateControl: senate >= 50 ? "player" : "opposition",
  };
}

/* ---------- congress / bill odds (for dashboard flavor) ---------- */
function billOdds(game){
  const ctrl = (game.congress.houseControl === "player" ? 12 : -12)
             + (game.congress.senateControl === "player" ? 12 : -12);
  const chance = clampN(Math.round(
    game.approval * 0.35 + game.partySupport * 0.25 + game.stability * 0.12 + ctrl + 8
  ), 3, 97);
  return chance;
}

/* ---------- loss / forced-out checks ---------- */
function checkStatus(game){
  // Returns null or a game-over reason.
  if (game.stability <= 8 && game.approval < 35)
    return { type:"impeach", title:"Removed From Office",
      line:"With your administration in chaos and the public against you, Congress voted to remove you. The gavel falls." };
  if (game.approval <= 18)
    return { type:"resign", title:"Forced to Resign",
      line:"Approval has collapsed. Your own party asked for your resignation, and you no longer had the votes to govern." };
  if (game.partySupport <= 10)
    return { type:"party", title:"Abandoned by Your Party",
      line:"Your party broke with you entirely. Without them, the presidency became ungovernable." };
  return null;
}

/* ---------- utils ---------- */
function round1(x){ return Math.round(x*10)/10; }

window.ENGINE = {
  rng, buildSchedule, scorePolicy, applyEvaluation, recomputeApproval,
  monthlyDrift, electoralResult, midtermResult, billOdds, checkStatus, headlines, round1,
};
})();
