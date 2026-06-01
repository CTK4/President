/* ============================================================
   President Career Sim — DATA
   Parties, personas, stakeholders, states, events, lexicon.
   Clean-room original content. No AI; deterministic.
   ============================================================ */

/* ---------- PARTIES ---------- */
// Two fictional parties. Lean: negative = progressive, positive = conservative.
const PARTIES = {
  liberty: {
    id: "liberty",
    name: "Liberty Party",
    short: "LIB",
    color: "#c63f2a",
    lean: +1,            // conservative-leaning
    blurb: "Markets, tradition, a smaller federal hand.",
    favorsTags: ["tax-cut", "deregulation", "defense", "border", "energy", "business"],
    opposesTags: ["spending", "regulation", "welfare"],
  },
  commons: {
    id: "commons",
    name: "Commonwealth Party",
    short: "CMW",
    color: "#2f6ea5",
    lean: -1,            // progressive-leaning
    blurb: "Public investment, social safety net, regulation.",
    favorsTags: ["spending", "healthcare", "climate", "labor", "education", "welfare"],
    opposesTags: ["tax-cut", "deregulation"],
  },
};

/* ---------- VOTER PERSONAS (8) ---------- weights sum ~100 ---------- */
const PERSONAS = [
  {
    id: "suburb", name: "Suburban Moderate", initials: "SM", weight: 16, ideology: 0,
    blurb: "Pragmatic, tax-conscious, allergic to extremes.",
    values: [
      { kw: ["bipartisan", "compromise", "middle"], w: 12 },
      { kw: ["education", "school"], w: 9 },
      { kw: ["tax cut", "tax relief"], w: 7 },
      { kw: ["safety", "crime", "police"], w: 6 },
    ],
    redLines: ["defund", "nationalize", "abolish", "radical"],
  },
  {
    id: "rural", name: "Rural Traditionalist", initials: "RT", weight: 13, ideology: 55,
    blurb: "Faith, firearms, farm country, and self-reliance.",
    values: [
      { kw: ["farm", "agriculture", "rural"], w: 11 },
      { kw: ["gun rights", "second amendment", "firearm"], w: 9 },
      { kw: ["faith", "family", "religious"], w: 8 },
      { kw: ["border", "secure"], w: 7 },
    ],
    redLines: ["gun ban", "confiscate", "abortion fund", "open border"],
  },
  {
    id: "urban", name: "Urban Progressive", initials: "UP", weight: 14, ideology: -55,
    blurb: "Climate, equity, transit, public investment.",
    values: [
      { kw: ["climate", "emissions", "green"], w: 11 },
      { kw: ["healthcare", "medicare", "public option"], w: 9 },
      { kw: ["equity", "justice", "rights"], w: 8 },
      { kw: ["transit", "housing", "renewable"], w: 7 },
    ],
    redLines: ["tax cut for the wealthy", "deregulate", "drill", "deport"],
  },
  {
    id: "union", name: "Working-Class Union", initials: "WU", weight: 13, ideology: -20,
    blurb: "Wages, jobs, factories, and a fair shake.",
    values: [
      { kw: ["jobs", "wages", "minimum wage"], w: 11 },
      { kw: ["union", "labor", "manufacturing"], w: 10 },
      { kw: ["healthcare", "pension"], w: 7 },
      { kw: ["infrastructure", "buy american", "tariff"], w: 6 },
    ],
    redLines: ["outsource", "cut pensions", "right to work"],
  },
  {
    id: "biz", name: "Small Business Owner", initials: "BO", weight: 10, ideology: 30,
    blurb: "Lower taxes, less paperwork, predictable rules.",
    values: [
      { kw: ["tax cut", "tax relief", "small business"], w: 11 },
      { kw: ["deregulat", "red tape", "cut regulation"], w: 9 },
      { kw: ["growth", "investment"], w: 6 },
    ],
    redLines: ["mandate", "new tax", "raise taxes", "minimum wage hike"],
  },
  {
    id: "youth", name: "Young Activist", initials: "YA", weight: 9, ideology: -65,
    blurb: "Bold, online, impatient for systemic change.",
    values: [
      { kw: ["climate", "green new", "emissions"], w: 11 },
      { kw: ["student debt", "tuition", "loan forgiveness"], w: 10 },
      { kw: ["justice", "rights", "equity"], w: 8 },
      { kw: ["housing", "renewable"], w: 6 },
    ],
    redLines: ["fossil", "deport", "cut social", "drill"],
  },
  {
    id: "senior", name: "Retiree / Senior", initials: "RS", weight: 15, ideology: 5,
    blurb: "Protect the benefits I paid into. Stay steady.",
    values: [
      { kw: ["social security", "medicare", "retirement"], w: 12 },
      { kw: ["prescription", "drug price", "healthcare"], w: 9 },
      { kw: ["stability", "steady", "responsible"], w: 6 },
    ],
    redLines: ["cut social security", "cut medicare", "raise retirement age", "privatize"],
  },
  {
    id: "faith", name: "Evangelical Conservative", initials: "EC", weight: 10, ideology: 60,
    blurb: "Faith and family at the center of public life.",
    values: [
      { kw: ["faith", "religious", "family"], w: 11 },
      { kw: ["pro-life", "life", "marriage"], w: 9 },
      { kw: ["school choice", "parents"], w: 7 },
      { kw: ["military", "defense"], w: 5 },
    ],
    redLines: ["abortion fund", "anti-religious", "ban prayer"],
  },
];

/* ---------- STAKEHOLDERS (12) ---------- */
const STAKEHOLDERS = [
  { id: "biz", name: "Business Council", lean: 45, interests: ["tax", "trade", "deregulat", "growth", "business"] },
  { id: "labor", name: "Labor Federation", lean: -45, interests: ["wages", "union", "jobs", "labor", "manufacturing"] },
  { id: "defense", name: "Defense Establishment", lean: 35, interests: ["military", "defense", "security", "ally", "weapon"] },
  { id: "green", name: "Environmental Coalition", lean: -50, interests: ["climate", "emissions", "renewable", "conservation", "green"] },
  { id: "health", name: "Healthcare Lobby", lean: 10, interests: ["healthcare", "medicare", "insurance", "drug", "hospital"] },
  { id: "farm", name: "Farm Bureau", lean: 30, interests: ["farm", "agriculture", "rural", "subsidy", "tariff"] },
  { id: "civil", name: "Civil Rights Alliance", lean: -55, interests: ["rights", "justice", "equity", "voting", "equality"] },
  { id: "faith", name: "Faith Coalition", lean: 50, interests: ["faith", "family", "life", "religious", "marriage"] },
  { id: "tech", name: "Tech Industry", lean: -10, interests: ["innovation", "privacy", "immigration", "research", "tech"] },
  { id: "police", name: "Law Enforcement Unions", lean: 40, interests: ["crime", "police", "security", "law", "border"] },
  { id: "teach", name: "Teachers Association", lean: -40, interests: ["education", "school", "teacher", "student", "tuition"] },
  { id: "senior", name: "Senior Advocacy League", lean: 0, interests: ["social security", "medicare", "retirement", "senior", "prescription"] },
];

/* ---------- STATES (50) ---------- tile-grid cartogram coords ---------- */
// [abbr, name, ev, lean(-blue..+red), col, row]
const STATE_TABLE = [
  ["AK","Alaska",3,25,0,0], ["ME","Maine",4,-10,10,0],
  ["VT","Vermont",3,-55,9,1], ["NH","New Hampshire",4,-5,10,1],
  ["WA","Washington",12,-35,0,2], ["ID","Idaho",4,60,1,2], ["MT","Montana",4,30,2,2], ["ND","North Dakota",3,60,3,2], ["MN","Minnesota",10,-10,4,2], ["IL","Illinois",19,-30,5,2], ["WI","Wisconsin",10,-1,6,2], ["MI","Michigan",15,-3,7,2], ["NY","New York",28,-40,8,2], ["RI","Rhode Island",4,-40,9,2], ["MA","Massachusetts",11,-50,10,2],
  ["OR","Oregon",8,-30,0,3], ["NV","Nevada",6,-3,1,3], ["WY","Wyoming",3,75,2,3], ["SD","South Dakota",3,45,3,3], ["IA","Iowa",6,12,4,3], ["IN","Indiana",11,25,5,3], ["OH","Ohio",17,15,6,3], ["PA","Pennsylvania",19,-2,7,3], ["NJ","New Jersey",14,-25,8,3], ["CT","Connecticut",7,-30,9,3],
  ["CA","California",54,-50,0,4], ["UT","Utah",6,40,1,4], ["CO","Colorado",10,-12,2,4], ["NE","Nebraska",5,35,3,4], ["MO","Missouri",10,25,4,4], ["KY","Kentucky",8,45,5,4], ["WV","West Virginia",4,60,6,4], ["VA","Virginia",13,-12,7,4], ["MD","Maryland",10,-45,8,4], ["DE","Delaware",3,-25,9,4],
  ["AZ","Arizona",11,3,0,5], ["NM","New Mexico",5,-15,1,5], ["KS","Kansas",6,30,2,5], ["AR","Arkansas",6,50,3,5], ["TN","Tennessee",11,45,4,5], ["NC","North Carolina",16,3,5,5], ["SC","South Carolina",9,25,6,5],
  ["OK","Oklahoma",7,65,2,6], ["LA","Louisiana",8,35,3,6], ["MS","Mississippi",6,35,4,6], ["AL","Alabama",9,55,5,6], ["GA","Georgia",16,2,6,6],
  ["HI","Hawaii",4,-55,0,7], ["TX","Texas",40,15,1,7], ["FL","Florida",30,5,7,7],
];

function buildStates(playerLean /* -1 commons, +1 liberty */) {
  return STATE_TABLE.map(([abbr, name, ev, lean, col, row]) => {
    // Starting approval: honeymoon ~ 54, tilted by alignment with player's party.
    const align = -(lean * playerLean) / 100; // +1 if state opposes lean... compute properly below
    // If player is conservative (+1) and state is red (+lean), they like the player.
    const affinity = (lean * playerLean) / 100; // -1..+1
    const approval = clampN(50 + affinity * 14, 30, 70);
    const economyWeight = round2(0.42 + Math.abs(lean) / 400); // swingier -> 0.42-0.6
    return {
      abbr, name, ev, lean, col, row,
      approval, economyWeight,
      socialWeight: round2(1 - economyWeight),
    };
  });
}

/* ---------- KEYWORD LEXICON ---------- */
// Each entry: kw match, tags it satisfies, economic effect, ideological lean.
// lean: negative = progressive, positive = conservative (scale ~ -3..+3)
const LEXICON = [
  // Taxes & spending
  { kw: "tax cut", tags: ["tax-cut", "economy", "business"], econ: { gdp:+0.4, infl:+0.1, debt:+0.5, unemp:-0.2 }, lean:+2 },
  { kw: "tax relief", tags: ["tax-cut", "economy"], econ: { gdp:+0.3, debt:+0.4, unemp:-0.1 }, lean:+2 },
  { kw: "raise taxes", tags: ["tax", "economy", "spending"], econ: { gdp:-0.2, debt:-0.5 }, lean:-2 },
  { kw: "wealth tax", tags: ["tax", "spending"], econ: { gdp:-0.2, debt:-0.5 }, lean:-3 },
  { kw: "spending", tags: ["spending", "economy"], econ: { gdp:+0.3, infl:+0.3, debt:+0.6, unemp:-0.3 }, lean:-1 },
  { kw: "stimulus", tags: ["spending", "economy"], econ: { gdp:+0.6, infl:+0.5, debt:+0.7, unemp:-0.5 }, lean:-2 },
  { kw: "austerity", tags: ["economy", "deficit"], econ: { gdp:-0.4, debt:-0.6, unemp:+0.4 }, lean:+2 },
  { kw: "balance the budget", tags: ["deficit", "economy"], econ: { debt:-0.7, gdp:-0.2 }, lean:+2 },
  { kw: "infrastructure", tags: ["spending", "jobs", "infrastructure"], econ: { gdp:+0.5, debt:+0.4, unemp:-0.4 }, lean:-1 },
  // Labor
  { kw: "minimum wage", tags: ["labor", "wages"], econ: { infl:+0.2, unemp:+0.2 }, lean:-2 },
  { kw: "union", tags: ["labor"], econ: { }, lean:-2 },
  { kw: "right to work", tags: ["labor", "deregulation"], econ: { }, lean:+2 },
  { kw: "jobs", tags: ["jobs", "economy"], econ: { unemp:-0.3, gdp:+0.2 }, lean:0 },
  { kw: "manufacturing", tags: ["jobs", "labor"], econ: { unemp:-0.3, gdp:+0.2 }, lean:0 },
  // Healthcare
  { kw: "healthcare", tags: ["healthcare", "spending"], econ: { debt:+0.3 }, lean:-1 },
  { kw: "medicare", tags: ["healthcare", "welfare"], econ: { debt:+0.3 }, lean:-1 },
  { kw: "public option", tags: ["healthcare", "spending"], econ: { debt:+0.4 }, lean:-2 },
  { kw: "drug price", tags: ["healthcare"], econ: { }, lean:-1 },
  { kw: "prescription", tags: ["healthcare"], econ: { }, lean:-1 },
  // Social safety net
  { kw: "social security", tags: ["welfare", "senior"], econ: { debt:+0.2 }, lean:-1 },
  { kw: "cut social security", tags: ["welfare", "deficit"], econ: { debt:-0.5 }, lean:+3 },
  { kw: "student debt", tags: ["education", "spending"], econ: { debt:+0.3 }, lean:-2 },
  { kw: "loan forgiveness", tags: ["education", "spending"], econ: { debt:+0.4 }, lean:-2 },
  { kw: "welfare", tags: ["welfare", "spending"], econ: { debt:+0.3 }, lean:-1 },
  // Climate / energy
  { kw: "climate", tags: ["climate", "regulation"], econ: { gdp:-0.1 }, lean:-2 },
  { kw: "emissions", tags: ["climate", "regulation"], econ: { gdp:-0.1 }, lean:-2 },
  { kw: "renewable", tags: ["climate", "energy"], econ: { gdp:+0.1, debt:+0.2 }, lean:-2 },
  { kw: "green new", tags: ["climate", "spending"], econ: { gdp:+0.1, debt:+0.6 }, lean:-3 },
  { kw: "drill", tags: ["energy", "deregulation"], econ: { gdp:+0.3, infl:-0.2 }, lean:+2 },
  { kw: "fossil", tags: ["energy"], econ: { gdp:+0.2 }, lean:+1 },
  { kw: "pipeline", tags: ["energy", "jobs"], econ: { gdp:+0.2, unemp:-0.1 }, lean:+1 },
  { kw: "nuclear", tags: ["energy"], econ: { gdp:+0.2, debt:+0.3 }, lean:+1 },
  // Regulation
  { kw: "deregulat", tags: ["deregulation", "business"], econ: { gdp:+0.3 }, lean:+2 },
  { kw: "regulation", tags: ["regulation"], econ: { gdp:-0.2 }, lean:-1 },
  { kw: "red tape", tags: ["deregulation", "business"], econ: { gdp:+0.2 }, lean:+2 },
  // Immigration / border
  { kw: "border", tags: ["border", "security"], econ: { }, lean:+2 },
  { kw: "wall", tags: ["border", "security"], econ: { debt:+0.2 }, lean:+2 },
  { kw: "deport", tags: ["border"], econ: { }, lean:+2 },
  { kw: "path to citizenship", tags: ["immigration"], econ: { gdp:+0.1 }, lean:-2 },
  { kw: "dreamers", tags: ["immigration"], econ: { }, lean:-2 },
  // Defense / foreign
  { kw: "military", tags: ["defense", "security"], econ: { debt:+0.3 }, lean:+1 },
  { kw: "defense", tags: ["defense", "security"], econ: { debt:+0.3 }, lean:+1 },
  { kw: "troops", tags: ["defense"], econ: { debt:+0.2 }, lean:+1 },
  { kw: "diplomacy", tags: ["foreign", "ally"], econ: { }, lean:-1 },
  { kw: "sanction", tags: ["foreign", "security"], econ: { gdp:-0.1 }, lean:+1 },
  { kw: "ally", tags: ["foreign"], econ: { }, lean:0 },
  { kw: "aid", tags: ["foreign", "spending"], econ: { debt:+0.2 }, lean:-1 },
  // Guns / crime / social
  { kw: "gun", tags: ["guns"], econ: { }, lean:0 },
  { kw: "second amendment", tags: ["guns"], econ: { }, lean:+2 },
  { kw: "background check", tags: ["guns"], econ: { }, lean:-1 },
  { kw: "police", tags: ["crime", "security"], econ: { }, lean:+1 },
  { kw: "crime", tags: ["crime", "security"], econ: { }, lean:+1 },
  { kw: "criminal justice reform", tags: ["justice", "crime"], econ: { }, lean:-2 },
  { kw: "faith", tags: ["faith", "social"], econ: { }, lean:+2 },
  { kw: "family", tags: ["faith", "social"], econ: { }, lean:+1 },
  { kw: "pro-life", tags: ["social", "faith"], econ: { }, lean:+3 },
  { kw: "abortion", tags: ["social"], econ: { }, lean:0 },
  { kw: "rights", tags: ["justice"], econ: { }, lean:-1 },
  { kw: "equity", tags: ["justice"], econ: { }, lean:-2 },
  { kw: "school choice", tags: ["education"], econ: { }, lean:+2 },
  { kw: "education", tags: ["education", "spending"], econ: { debt:+0.2 }, lean:-1 },
  { kw: "housing", tags: ["housing", "spending"], econ: { debt:+0.2 }, lean:-1 },
  { kw: "tariff", tags: ["trade", "jobs"], econ: { infl:+0.2, gdp:-0.1 }, lean:+1 },
  { kw: "trade deal", tags: ["trade"], econ: { gdp:+0.2 }, lean:0 },
  // Tone modifiers (no econ, signal stability)
  { kw: "bipartisan", tags: ["bipartisan"], econ: { }, lean:0, stability:+4 },
  { kw: "compromise", tags: ["bipartisan"], econ: { }, lean:0, stability:+3 },
  { kw: "task force", tags: ["process"], econ: { }, lean:0, stability:+1 },
  { kw: "investigate", tags: ["process"], econ: { }, lean:0, stability:+1 },
  { kw: "emergency", tags: ["process"], econ: { }, lean:0, stability:-1 },
  { kw: "executive order", tags: ["process"], econ: { }, lean:0, stability:-2 },
  { kw: "ban", tags: ["process"], econ: { }, lean:0, stability:-2 },
  { kw: "nationalize", tags: ["process"], econ: { gdp:-0.3 }, lean:-3, stability:-4 },
];

/* ---------- EVENTS (18) ---------- */
const EVENTS = [
  { id:"infl", title:"Inflation Climbs Again", tags:["economy","inflation","spending"],
    desc:"Consumer prices jumped 0.6% last month. Grocery and rent costs dominate the news. Voters want to know what you'll do.",
    prompt:"How do you respond to rising prices?" },
  { id:"foreign", title:"Allied Government Under Threat", tags:["foreign","defense","security"],
    desc:"A treaty ally's capital is encircled and its president is asking the United States for direct support within 72 hours.",
    prompt:"What is your response to the crisis?" },
  { id:"health", title:"Insurance Premiums Spike", tags:["healthcare","economy"],
    desc:"Major insurers announced double-digit premium hikes for next year. Hospitals warn of a coverage cliff for millions.",
    prompt:"How will you address healthcare costs?" },
  { id:"border", title:"Surge at the Southern Border", tags:["border","immigration","security"],
    desc:"Border crossings hit a monthly record. Governors are deploying state forces and demanding federal action.",
    prompt:"What is your border policy?" },
  { id:"storm", title:"Category 5 Hurricane Makes Landfall", tags:["disaster","climate","spending"],
    desc:"A historic storm has devastated three coastal states. Damage estimates exceed $90 billion and rescue is ongoing.",
    prompt:"How do you lead the federal response?" },
  { id:"tech", title:"Antitrust Case Against Big Tech", tags:["tech","regulation","business"],
    desc:"Regulators want to break up a dominant platform. The industry warns of innovation harm; critics cheer.",
    prompt:"Where do you stand on the breakup?" },
  { id:"strike", title:"National Rail Strike Looms", tags:["labor","wages","economy"],
    desc:"Rail unions will walk off the job in five days over wages and sick leave, threatening to freeze supply chains.",
    prompt:"How do you handle the labor dispute?" },
  { id:"shoot", title:"Mass Shooting Shakes the Nation", tags:["guns","crime","social"],
    desc:"A shooting at a shopping center has killed eleven. The country is grieving and demanding you act.",
    prompt:"What is your response on guns and safety?" },
  { id:"bank", title:"Regional Bank Teeters", tags:["economy","finance","business"],
    desc:"A mid-size bank faces a run after bad bets. Markets are jittery and depositors are nervous.",
    prompt:"How do you stabilize the financial system?" },
  { id:"energy", title:"Gas Prices Surge Past $5", tags:["energy","economy","climate"],
    desc:"A supply shock sent pump prices soaring. Drivers are furious and the opposition blames your energy policy.",
    prompt:"What is your energy response?" },
  { id:"court", title:"Supreme Court Vacancy", tags:["judiciary","social"],
    desc:"A justice has retired. You may shape the Court for a generation, and every faction is watching your pick.",
    prompt:"What kind of nominee will you put forward?" },
  { id:"trade", title:"Trade War Escalates", tags:["trade","economy","jobs"],
    desc:"A major partner slapped tariffs on American farm and auto exports. Retaliation is on the table.",
    prompt:"What is your trade strategy?" },
  { id:"drug", title:"Opioid Deaths Reach Record", tags:["health","crime","social"],
    desc:"Overdose deaths hit an all-time high. Communities are pleading for treatment, enforcement, or both.",
    prompt:"How do you confront the epidemic?" },
  { id:"edu", title:"Schools Funding Standoff", tags:["education","spending"],
    desc:"Districts face a budget cliff. Teachers threaten strikes while parents demand accountability.",
    prompt:"What is your plan for schools?" },
  { id:"cyber", title:"Cyberattack Hits the Power Grid", tags:["security","tech","infrastructure"],
    desc:"A hostile actor disrupted power to two million homes. Officials suspect a foreign government.",
    prompt:"How do you respond to the attack?" },
  { id:"house", title:"Housing Costs Out of Reach", tags:["housing","economy","spending"],
    desc:"Median rent rose 14% this year. Young families say homeownership is now impossible.",
    prompt:"What will you do about housing?" },
  { id:"climate", title:"Landmark Climate Report Released", tags:["climate","energy","regulation"],
    desc:"Federal scientists warn the country will miss its targets without sweeping action this decade.",
    prompt:"How do you respond to the report?" },
  { id:"jobs", title:"Factory Closures Hit the Heartland", tags:["jobs","labor","economy"],
    desc:"A major automaker is shuttering three plants, cutting 12,000 jobs in swing-state towns.",
    prompt:"How do you respond to the layoffs?" },
];

/* ---------- helpers ---------- */
function clampN(x, lo, hi){ return Math.max(lo, Math.min(hi, x)); }
function round2(x){ return Math.round(x*100)/100; }

window.GAME_DATA = { PARTIES, PERSONAS, STAKEHOLDERS, STATE_TABLE, LEXICON, EVENTS, buildStates, clampN, round2 };
