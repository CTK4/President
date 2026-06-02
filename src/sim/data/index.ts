import type {
  CabinetMember,
  Economy,
  ForeignActor,
  InstitutionalOfficial,
  Party,
  PartyId,
  Persona,
  Scenario,
  ScenarioEvent,
  Stakeholder,
  StateApproval,
  VicePresident,
} from "@/sim/types";

export const parties: Record<PartyId, Party> = {
  democrat: {
    id: "democrat",
    name: "Democratic Party",
    shortName: "DEM",
    color: "#2867b2",
    ideology: -45,
    coalition: ["progressives", "labor", "urban voters", "civil rights groups", "young voters"],
  },
  republican: {
    id: "republican",
    name: "Republican Party",
    shortName: "GOP",
    color: "#c33a2b",
    ideology: 45,
    coalition: ["conservatives", "business", "rural voters", "religious voters", "security hawks"],
  },
  independent: {
    id: "independent",
    name: "Independent",
    shortName: "IND",
    color: "#6f6a60",
    ideology: 0,
    coalition: ["moderates", "anti-corruption voters", "cross-partisan reformers"],
  },
};

export const defaultEconomy: Economy = {
  gdpGrowth: 2.1,
  unemployment: 4.6,
  inflation: 3.1,
  interestRates: 4.5,
  deficit: 5.8,
  nationalDebt: 98,
  consumerConfidence: 52,
  stockMarket: 54,
  wageGrowth: 2.6,
  housingAffordability: 44,
  gasPrices: 3.55,
  poverty: 11.5,
};

export const scenarios: Scenario[] = [
  {
    id: "modern",
    title: "Modern Era",
    category: "2013-2025",
    startDate: "January 2025",
    description: "Polarization, inflation anxiety, social media politics, immigration fights, and a tense world order.",
    startingApproval: 48,
    congressControl: "split",
    courtLean: 32,
    economy: defaultEconomy,
    eventIds: ["inflation", "border", "ukraine-crisis", "tech-antitrust", "shutdown", "housing", "ai-regulation"],
    tags: ["modern", "polarization", "institutions"],
  },
  {
    id: "two-thousands",
    title: "The 2000s",
    category: "2001-2013",
    startDate: "January 2009",
    description: "War fatigue, bailouts, recession, terrorism fears, healthcare reform, and backlash politics.",
    startingApproval: 57,
    congressControl: "democrat",
    courtLean: 18,
    economy: { ...defaultEconomy, gdpGrowth: -2.4, unemployment: 7.8, inflation: 1.7, consumerConfidence: 32, stockMarket: 29 },
    eventIds: ["financial-crisis", "auto-bailout", "healthcare", "afghanistan", "debt-ceiling", "terror-alert", "bank-run"],
    tags: ["recession", "war", "reform"],
  },
  {
    id: "nineties",
    title: "The Nineties",
    category: "1993-2001",
    startDate: "January 1993",
    description: "Post-Cold War optimism, crime concern, deficit politics, trade fights, and scandal pressure.",
    startingApproval: 51,
    congressControl: "democrat",
    courtLean: 4,
    economy: { ...defaultEconomy, gdpGrowth: 2.8, unemployment: 6.9, inflation: 3.0, nationalDebt: 64 },
    eventIds: ["budget-fight", "trade-war", "crime-bill", "healthcare", "welfare", "government-shutdown", "personal-scandal"],
    tags: ["trade", "deficit", "scandal"],
  },
  {
    id: "sixties",
    title: "The Sixties",
    category: "1961-1969",
    startDate: "January 1965",
    description: "Civil rights, Cold War tension, Vietnam escalation, the space race, and a landslide mandate.",
    startingApproval: 61,
    congressControl: "democrat",
    courtLean: -24,
    economy: { ...defaultEconomy, gdpGrowth: 5.1, unemployment: 4.0, inflation: 1.8, nationalDebt: 45 },
    eventIds: ["civil-rights", "vietnam", "space-race", "urban-unrest", "great-society", "cold-war", "antiwar-protests"],
    tags: ["civil-rights", "cold-war", "war"],
  },
  {
    id: "alternate",
    title: "Alternate Candidacies",
    category: "What if they won?",
    startDate: "January 2017",
    description: "A counterfactual administration enters office with a contested mandate and an unstable coalition.",
    startingApproval: 45,
    congressControl: "split",
    courtLean: 12,
    economy: defaultEconomy,
    eventIds: ["legitimacy", "trade-war", "party-revolt", "foreign-crisis", "media-firestorm", "shutdown"],
    tags: ["alternate-history", "legitimacy"],
  },
  {
    id: "challenge-crash",
    title: "Economic Crash",
    category: "Challenges",
    startDate: "March 2026",
    description: "Markets plunge, unemployment rises, Congress panics, and voters demand immediate relief.",
    startingApproval: 42,
    congressControl: "split",
    courtLean: 24,
    economy: { ...defaultEconomy, gdpGrowth: -4.8, unemployment: 8.5, inflation: 5.6, consumerConfidence: 24, stockMarket: 18 },
    eventIds: ["financial-crisis", "bank-run", "stimulus", "housing", "labor-strike", "debt-ceiling", "deficit-hawks"],
    tags: ["challenge", "economy", "crisis"],
  },
];

const event = (
  id: string,
  title: string,
  issueTags: string[],
  description: string,
  responseSeed: [string, string, string],
  severity = 55,
): ScenarioEvent => ({
  id,
  title,
  dateWindow: "This month",
  description,
  issueTags,
  severity,
  urgency: Math.min(95, severity + 12),
  affectedGroups: issueTags,
  affectedStates: [],
  allowCustomResponse: true,
  responseOptions: [
    {
      id: `${id}-institutional`,
      title: responseSeed[0],
      style: "institutional",
      text: `Use agencies, Congress, and expert review to address ${title.toLowerCase()} with a cautious federal response.`,
      tags: [...issueTags, "institutional", "bipartisan"],
      risk: 24,
      effects: [{ target: "approval", amount: 1 }, { target: "stability", amount: 3 }],
    },
    {
      id: `${id}-bold`,
      title: responseSeed[1],
      style: "bold",
      text: `Move aggressively on ${title.toLowerCase()} through executive action and a high-profile national campaign.`,
      tags: [...issueTags, "executive", "base"],
      risk: 58,
      effects: [{ target: "approval", amount: 3 }, { target: "courtRisk", amount: 5 }],
    },
    {
      id: `${id}-compromise`,
      title: responseSeed[2],
      style: "compromise",
      text: `Trade concessions with Congress and stakeholders to produce a narrower deal on ${title.toLowerCase()}.`,
      tags: [...issueTags, "compromise", "congress"],
      risk: 36,
      effects: [{ target: "approval", amount: 2 }, { target: "congress", amount: 4 }],
    },
  ],
});

export const events: ScenarioEvent[] = [
  event("inflation", "Inflation Spike", ["economy", "inflation", "cost-of-living"], "Prices continue rising across food, fuel, housing, and consumer goods.", ["Fiscal Restraint", "Cost-of-Living Relief", "Supply Push"], 70),
  event("border", "Border Surge", ["immigration", "security", "federalism"], "Border crossings surge as governors demand federal action and cities ask for help.", ["Interagency Plan", "Emergency Border Action", "Security and Reform Deal"], 62),
  event("court-vacancy", "Supreme Court Vacancy", ["court", "judiciary", "institutions"], "A justice retires, opening a generational fight over the Court.", ["Consensus Nominee", "Ideological Champion", "Historic First"], 66),
  event("ukraine-crisis", "Ally Under Invasion", ["foreign", "war", "alliances"], "A treaty partner requests urgent military, humanitarian, and diplomatic support.", ["Diplomatic Coalition", "Military Deterrence", "Strategic Restraint"], 76),
  event("tech-antitrust", "Tech Antitrust Case", ["technology", "regulation", "business"], "Regulators seek action against a dominant platform as industry warns about innovation.", ["Careful Lawsuit", "Break Up the Platform", "Privacy and Competition Deal"], 50),
  event("shutdown", "Government Shutdown Threat", ["congress", "budget", "institutions"], "Congress nears a funding deadline with no agreement in sight.", ["Keep Negotiating", "Draw a Hard Line", "Temporary Compromise"], 58),
  event("housing", "Housing Costs Out of Reach", ["housing", "economy", "states"], "Rent and mortgage costs dominate local news across swing suburbs.", ["Zoning Partnership", "Emergency Housing Aid", "Builder Tax Deal"], 57),
  event("ai-regulation", "AI Safety Panic", ["technology", "labor", "security"], "A high-profile AI failure triggers labor, privacy, and national security demands.", ["Safety Standards", "Regulatory Crackdown", "Innovation Compact"], 52),
  event("financial-crisis", "Financial Crisis", ["economy", "finance", "crisis"], "Markets plunge and credit freezes as households and firms fear a deeper collapse.", ["Stabilize Credit", "Massive Rescue", "Targeted Bailout"], 86),
  event("auto-bailout", "Auto Industry Collapse", ["jobs", "labor", "manufacturing"], "A major employer warns that bankruptcy could destroy supplier networks.", ["Managed Restructuring", "National Rescue", "Private-Sector Bridge"], 68),
  event("healthcare", "Healthcare Reform Fight", ["healthcare", "congress", "costs"], "Premiums rise while reform groups demand universal coverage and industry resists.", ["Incremental Reform", "Public Option Push", "Market Subsidy Deal"], 63),
  event("afghanistan", "Afghanistan Strategy Review", ["war", "foreign", "veterans"], "Commanders request more troops as public patience erodes.", ["Conditions-Based Plan", "Troop Surge", "Withdrawal Timeline"], 71),
  event("debt-ceiling", "Debt Ceiling Emergency", ["budget", "congress", "economy"], "Treasury warns that default risk is approaching within weeks.", ["Quiet Negotiation", "Constitutional Gambit", "Grand Bargain"], 74),
  event("terror-alert", "Terror Alert", ["security", "civil-liberties", "foreign"], "Intelligence agencies warn of a credible plot, but details remain uncertain.", ["Targeted Security", "National Crackdown", "Allied Intelligence Deal"], 69),
  event("bank-run", "Regional Bank Run", ["finance", "economy", "confidence"], "Depositors flee a regional bank and markets question the wider system.", ["Guarantee Deposits", "Emergency Backstop", "Private Merger"], 75),
  event("budget-fight", "Budget Fight", ["budget", "deficit", "congress"], "Deficit hawks and social program defenders collide over the administration's budget.", ["Fiscal Review", "Protect Programs", "Balanced Package"], 54),
  event("trade-war", "Trade War Escalates", ["trade", "jobs", "foreign"], "A major partner retaliates against American farm and auto exports.", ["WTO Case", "Retaliatory Tariffs", "Sector Exemptions"], 59),
  event("crime-bill", "Crime Bill Debate", ["crime", "justice", "states"], "Mayors demand federal help as activists warn against repeating punitive mistakes.", ["Community Safety Grants", "Tough Enforcement", "Reform Compact"], 56),
  event("welfare", "Welfare Reform Standoff", ["poverty", "work", "budget"], "Congress sends a welfare overhaul with work rules and deep controversy.", ["Pilot Programs", "Sign the Overhaul", "Renegotiate Protections"], 53),
  event("government-shutdown", "Government Shutdown", ["congress", "budget", "media"], "Federal services begin closing as both parties blame each other.", ["Reopen Talks", "Blame Congress", "Split-the-Difference Bill"], 61),
  event("personal-scandal", "Personal Scandal", ["scandal", "media", "trust"], "A personal controversy consumes the press and threatens legislative priorities.", ["Full Disclosure", "Fight Back", "Apologize and Refocus"], 67),
  event("civil-rights", "Voting Rights Fight", ["civil-rights", "court", "states"], "State restrictions and protests push voting rights to the center of national politics.", ["Legal Protection", "Sweeping Rights Act", "Bipartisan Standards"], 72),
  event("vietnam", "Vietnam Escalation", ["war", "foreign", "protests"], "Commanders request escalation while anti-war voices warn of a quagmire.", ["Limited Commitment", "Major Escalation", "Negotiated Pressure"], 78),
  event("space-race", "Space Race Funding", ["science", "technology", "prestige"], "Scientists request a major funding increase to beat a rival power in orbit.", ["Measured Funding", "Moonshot Mobilization", "Public-Private Program"], 48),
  event("urban-unrest", "Urban Unrest", ["civil-rights", "crime", "poverty"], "Several cities face unrest after a police incident and years of disinvestment.", ["Federal Mediation", "Order Restoration", "Jobs and Safety Plan"], 73),
  event("great-society", "Great Society Agenda", ["poverty", "healthcare", "education"], "Congress is ready for historic social investment, but inflation and backlash risks loom.", ["Targeted Programs", "Transformational Package", "Phased Compromise"], 64),
  event("cold-war", "Cold War Standoff", ["foreign", "security", "nuclear"], "A rival superpower tests resolve near an allied border.", ["Hotline Diplomacy", "Force Posture", "Backchannel Deal"], 82),
  event("antiwar-protests", "Antiwar Protests", ["war", "youth", "media"], "Mass protests accuse the administration of misleading the country.", ["Listening Tour", "Condemn Disruption", "Review Strategy"], 65),
  event("legitimacy", "Legitimacy Protests", ["institutions", "media", "civil-unrest"], "Opponents question the election outcome and fill city streets.", ["National Unity Address", "Base Counterattack", "Election Reform Commission"], 68),
  event("party-revolt", "Party Revolt", ["party", "congress", "leadership"], "Your own party threatens to abandon a central bill.", ["Private Whip Count", "Punish Defectors", "Policy Concessions"], 56),
  event("foreign-crisis", "Foreign Crisis", ["foreign", "security", "allies"], "An ally faces coercion and requests public American backing.", ["Alliance Summit", "Forward Deployment", "Regional Mediation"], 67),
  event("media-firestorm", "Media Firestorm", ["media", "trust", "scandal"], "A viral controversy overwhelms the news cycle and distracts from governing.", ["Release Records", "Attack the Narrative", "Reset the Agenda"], 52),
  event("stimulus", "Stimulus Demand", ["economy", "spending", "jobs"], "Economists warn that only fast fiscal support can prevent a deeper slump.", ["Targeted Relief", "Massive Stimulus", "Business-Labor Deal"], 79),
  event("labor-strike", "National Labor Strike", ["labor", "inflation", "supply-chain"], "A strike threatens supply chains while workers demand higher wages.", ["Mediation Board", "Back the Workers", "Cooling-Off Deal"], 62),
  event("deficit-hawks", "Deficit Hawks Revolt", ["budget", "markets", "congress"], "Markets and moderates begin warning that emergency spending has gone too far.", ["Debt Commission", "Reject Austerity", "Fiscal Guardrails"], 55),
];

export const personas: Omit<Persona, "approval" | "trust">[] = [
  { id: "progressive", name: "Progressive Activist", demographics: ["urban", "young"], ideology: -72, topIssues: ["climate", "civil-rights", "healthcare"], reactionStyle: "impatient", weight: 10 },
  { id: "liberal", name: "Mainstream Liberal", demographics: ["suburban", "college"], ideology: -42, topIssues: ["healthcare", "courts", "democracy"], reactionStyle: "coalitional", weight: 14 },
  { id: "moderate", name: "Suburban Moderate", demographics: ["suburban", "parent"], ideology: -4, topIssues: ["inflation", "schools", "stability"], reactionStyle: "practical", weight: 18 },
  { id: "union", name: "Union Worker", demographics: ["working-class", "midwest"], ideology: -18, topIssues: ["jobs", "wages", "trade"], reactionStyle: "material", weight: 12 },
  { id: "business", name: "Small Business Owner", demographics: ["suburban", "business"], ideology: 32, topIssues: ["taxes", "regulation", "inflation"], reactionStyle: "cost-focused", weight: 10 },
  { id: "conservative", name: "Movement Conservative", demographics: ["rural", "religious"], ideology: 68, topIssues: ["border", "courts", "spending"], reactionStyle: "ideological", weight: 14 },
  { id: "hawk", name: "Security Hawk", demographics: ["veteran", "older"], ideology: 42, topIssues: ["defense", "allies", "terrorism"], reactionStyle: "strength-focused", weight: 8 },
  { id: "youth", name: "Young Voter", demographics: ["student", "renter"], ideology: -55, topIssues: ["housing", "climate", "debt"], reactionStyle: "skeptical", weight: 8 },
  { id: "senior", name: "Senior Voter", demographics: ["retired"], ideology: 6, topIssues: ["medicare", "stability", "prices"], reactionStyle: "risk-averse", weight: 6 },
];

export const stakeholderTemplates: Omit<Stakeholder, "approval">[] = [
  { id: "labor", name: "Labor Federation", power: 72, issuePriorities: ["jobs", "wages", "labor"], ideology: -44, patience: 58, donationCapacity: 35, mobilizationCapacity: 80, mediaInfluence: 48 },
  { id: "business", name: "Business Roundtable", power: 78, issuePriorities: ["taxes", "trade", "regulation"], ideology: 38, patience: 52, donationCapacity: 88, mobilizationCapacity: 45, mediaInfluence: 62 },
  { id: "civil-rights", name: "Civil Rights Organizations", power: 62, issuePriorities: ["civil-rights", "justice", "voting"], ideology: -62, patience: 44, donationCapacity: 42, mobilizationCapacity: 76, mediaInfluence: 64 },
  { id: "environment", name: "Environmental Groups", power: 58, issuePriorities: ["climate", "energy", "science"], ideology: -68, patience: 40, donationCapacity: 46, mobilizationCapacity: 70, mediaInfluence: 61 },
  { id: "faith", name: "Religious Conservatives", power: 60, issuePriorities: ["courts", "education", "family"], ideology: 70, patience: 55, donationCapacity: 50, mobilizationCapacity: 73, mediaInfluence: 52 },
  { id: "defense", name: "Defense Establishment", power: 74, issuePriorities: ["war", "security", "allies"], ideology: 30, patience: 64, donationCapacity: 66, mobilizationCapacity: 38, mediaInfluence: 68 },
  { id: "tech", name: "Technology Sector", power: 66, issuePriorities: ["technology", "immigration", "regulation"], ideology: -12, patience: 51, donationCapacity: 84, mobilizationCapacity: 35, mediaInfluence: 70 },
  { id: "states", name: "State Governors", power: 69, issuePriorities: ["federalism", "disaster", "budget"], ideology: 0, patience: 62, donationCapacity: 36, mobilizationCapacity: 58, mediaInfluence: 55 },
  { id: "media", name: "Media Establishment", power: 64, issuePriorities: ["trust", "scandal", "transparency"], ideology: -8, patience: 47, donationCapacity: 20, mobilizationCapacity: 38, mediaInfluence: 92 },
];

const stateRows: Array<[string, string, number, number]> = [
  ["AL", "Alabama", 9, 52], ["AK", "Alaska", 3, 28], ["AZ", "Arizona", 11, 3], ["AR", "Arkansas", 6, 48], ["CA", "California", 54, -50],
  ["CO", "Colorado", 10, -12], ["CT", "Connecticut", 7, -32], ["DE", "Delaware", 3, -25], ["FL", "Florida", 30, 7], ["GA", "Georgia", 16, 2],
  ["HI", "Hawaii", 4, -55], ["ID", "Idaho", 4, 62], ["IL", "Illinois", 19, -34], ["IN", "Indiana", 11, 24], ["IA", "Iowa", 6, 12],
  ["KS", "Kansas", 6, 30], ["KY", "Kentucky", 8, 46], ["LA", "Louisiana", 8, 36], ["ME", "Maine", 4, -8], ["MD", "Maryland", 10, -45],
  ["MA", "Massachusetts", 11, -52], ["MI", "Michigan", 15, -2], ["MN", "Minnesota", 10, -10], ["MS", "Mississippi", 6, 38], ["MO", "Missouri", 10, 24],
  ["MT", "Montana", 4, 30], ["NE", "Nebraska", 5, 36], ["NV", "Nevada", 6, -2], ["NH", "New Hampshire", 4, -4], ["NJ", "New Jersey", 14, -26],
  ["NM", "New Mexico", 5, -16], ["NY", "New York", 28, -42], ["NC", "North Carolina", 16, 3], ["ND", "North Dakota", 3, 60], ["OH", "Ohio", 17, 14],
  ["OK", "Oklahoma", 7, 66], ["OR", "Oregon", 8, -31], ["PA", "Pennsylvania", 19, -1], ["RI", "Rhode Island", 4, -40], ["SC", "South Carolina", 9, 26],
  ["SD", "South Dakota", 3, 45], ["TN", "Tennessee", 11, 44], ["TX", "Texas", 40, 15], ["UT", "Utah", 6, 40], ["VT", "Vermont", 3, -55],
  ["VA", "Virginia", 13, -12], ["WA", "Washington", 12, -36], ["WV", "West Virginia", 4, 60], ["WI", "Wisconsin", 10, -1], ["WY", "Wyoming", 3, 75],
];

export function buildStates(partyId: PartyId, approval: number): StateApproval[] {
  const partyIdeology = parties[partyId].ideology;
  return stateRows.map(([abbreviation, name, electoralVotes, partisanLean]) => {
    const alignment = 1 - Math.abs(partisanLean - partyIdeology) / 140;
    const stateApproval = clamp(approval + (alignment - 0.45) * 20, 22, 76);
    return {
      abbreviation,
      name,
      electoralVotes,
      partisanLean,
      approval: round1(stateApproval),
      economySensitivity: round1(0.7 + Math.abs(partisanLean) / 170),
      socialIssueSensitivity: round1(0.55 + Math.abs(partisanLean) / 190),
      foreignPolicySensitivity: round1(0.45 + electoralVotes / 100),
      demographicProfile: partisanLean < -20 ? ["urban", "college"] : partisanLean > 25 ? ["rural", "religious"] : ["suburban", "swing"],
      turnout: 58,
      governorParty: partisanLean < -5 ? "democrat" : "republican",
      senateDelegation: partisanLean < -10 ? ["democrat", "democrat"] : partisanLean > 10 ? ["republican", "republican"] : ["democrat", "republican"],
    };
  });
}

export const vpOptions: VicePresident[] = [
  { id: "loyal-insider", name: "Evelyn Brooks", ageBand: "60s", gender: "Female", region: "Midwest", ideology: "Institutionalist", background: "Senator", biography: "A loyal Senate dealmaker with deep committee relationships.", competence: 74, loyalty: 88, ambition: 38, publicAppeal: 56, senateSkill: 90, scandalRisk: 16, approval: 48 },
  { id: "rising-star", name: "Marcus Hale", ageBand: "40s", gender: "Male", region: "South", ideology: "Coalition Builder", background: "Governor", biography: "A charismatic governor with national ambitions and strong campaign instincts.", competence: 68, loyalty: 62, ambition: 82, publicAppeal: 78, senateSkill: 48, scandalRisk: 24, approval: 52 },
  { id: "technocrat", name: "Priya Raman", ageBand: "50s", gender: "Female", region: "West Coast", ideology: "Technocrat", background: "Cabinet secretary", biography: "A policy specialist trusted by markets, agencies, and crisis managers.", competence: 90, loyalty: 70, ambition: 52, publicAppeal: 50, senateSkill: 54, scandalRisk: 12, approval: 46 },
  { id: "regional-balancer", name: "Thomas Redbird", ageBand: "50s", gender: "Male", region: "Mountain West", ideology: "Regional Moderate", background: "Governor", biography: "A regional balancer who helps with rural states and federalism fights.", competence: 70, loyalty: 76, ambition: 58, publicAppeal: 64, senateSkill: 58, scandalRisk: 18, approval: 49 },
  { id: "ideological-balancer", name: "Sofia Martinez", ageBand: "40s", gender: "Female", region: "Southwest", ideology: "Movement Voice", background: "Representative", biography: "An energetic factional favorite who can mobilize the base and unsettle moderates.", competence: 62, loyalty: 65, ambition: 76, publicAppeal: 72, senateSkill: 44, scandalRisk: 28, approval: 51 },
];

export const cabinetOffices = [
  "Chief of Staff",
  "Secretary of State",
  "Secretary of Defense",
  "Secretary of the Treasury",
  "Attorney General",
  "Homeland Security",
  "Health and Human Services",
  "Housing and Urban Development",
  "Energy",
  "Press Secretary",
  "Labor",
  "Education",
  "Transportation",
  "Agriculture",
  "EPA Administrator",
];

export const officialOffices = [
  "Federal Reserve Chair",
  "FBI Director",
  "Director of National Intelligence",
  "Chairman of the Joint Chiefs",
  "Surgeon General",
  "SEC Chair",
  "FTC Chair",
  "CDC Director",
];

export function buildCabinet(seedValue: number, partyId: PartyId): CabinetMember[] {
  return cabinetOffices.map((office, index) => ({
    id: `cabinet-${index}`,
    office,
    name: generatedName(seedValue + index),
    competence: 54 + ((seedValue + index * 7) % 38),
    loyalty: 48 + ((seedValue + index * 11) % 42),
    ideology: parties[partyId].ideology + ((index % 5) - 2) * 8,
    mediaSkill: 42 + ((seedValue + index * 13) % 45),
    scandalRisk: 8 + ((seedValue + index * 17) % 32),
    agencyControl: 45 + ((seedValue + index * 19) % 42),
    relationshipWithPresident: 50 + ((seedValue + index * 23) % 38),
    fatigue: 0,
  }));
}

export function buildOfficials(seedValue: number, partyId: PartyId): InstitutionalOfficial[] {
  return officialOffices.map((office, index) => ({
    id: `official-${index}`,
    office,
    name: generatedName(seedValue + index + 40),
    competence: 55 + ((seedValue + index * 5) % 38),
    loyalty: 32 + ((seedValue + index * 3) % 46),
    ideology: parties[partyId].ideology * 0.4 + ((index % 4) - 1.5) * 18,
    independence: 48 + ((seedValue + index * 7) % 45),
    monthsRemaining: index < 6 ? 12 + ((seedValue + index * 9) % 48) : undefined,
    removable: index !== 0,
    firingCost: 18 + ((seedValue + index * 6) % 42),
  }));
}

export const foreignActors: ForeignActor[] = [
  { id: "china", name: "China", relationship: 38, tension: 66, tradeImportance: 92, militaryRisk: 55, humanRightsPressure: 72 },
  { id: "russia", name: "Russia", relationship: 24, tension: 80, tradeImportance: 25, militaryRisk: 76, humanRightsPressure: 70 },
  { id: "eu", name: "European Union", relationship: 68, tension: 24, tradeImportance: 80, militaryRisk: 18, humanRightsPressure: 36 },
  { id: "nato", name: "NATO", relationship: 72, tension: 22, tradeImportance: 42, militaryRisk: 40, humanRightsPressure: 24 },
  { id: "middle-east", name: "Middle East", relationship: 46, tension: 62, tradeImportance: 54, militaryRisk: 68, humanRightsPressure: 64 },
  { id: "mexico", name: "Mexico", relationship: 58, tension: 38, tradeImportance: 70, militaryRisk: 16, humanRightsPressure: 44 },
  { id: "india", name: "India", relationship: 63, tension: 28, tradeImportance: 58, militaryRisk: 32, humanRightsPressure: 45 },
  { id: "japan", name: "Japan", relationship: 76, tension: 18, tradeImportance: 64, militaryRisk: 34, humanRightsPressure: 24 },
];

export function generatedName(n: number): string {
  const first = ["Avery", "Blake", "Casey", "Devon", "Ellis", "Finley", "Harper", "Jordan", "Kendall", "Logan", "Morgan", "Parker", "Quinn", "Reese", "Taylor"];
  const last = ["Adams", "Bennett", "Chen", "Diaz", "Edwards", "Foster", "Garcia", "Hayes", "Irving", "Johnson", "Kim", "Lewis", "Morgan", "Nguyen", "Patel"];
  return `${first[n % first.length]} ${last[(n * 3) % last.length]}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
