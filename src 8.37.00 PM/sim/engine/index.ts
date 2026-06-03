import {
  buildCabinet,
  buildOfficials,
  buildStates,
  clamp,
  events,
  foreignActors,
  generatedName,
  parties,
  personas as personaTemplates,
  round1,
  scenarios,
  stakeholderTemplates,
  vpOptions,
} from "@/sim/data";
import type {
  Bill,
  BillAction,
  CourtNominationStrategy,
  CourtCase,
  Economy,
  ElectionResult,
  ElectionType,
  GameSettings,
  GameState,
  Justice,
  NewGameConfig,
  ParsedPolicy,
  PartyId,
  PlayerResponse,
  ResponseOption,
  Scenario,
  ScenarioEvent,
  SupremeCourtVacancy,
  TurnResolution,
  TurnResolutionSummary,
} from "@/sim/types";

const defaultSettings: GameSettings = {
  economicSimulation: true,
  checksAndBalances: true,
  personaMode: "realistic",
  socialEngineeringMode: true,
  eventGeneration: "classic",
  warMode: true,
  pacing: "monthly",
  aiFlavorText: false,
};

type PolicyClassification = {
  actionType: "normal" | "extrajudicial_lethal_force" | "authoritarian_overreach";
  issueTags: string[];
  legalityRisk: number;
  rightsViolationRisk: number;
  violenceLevel: number;
  authoritarianLevel: number;
  humanitarianRisk: number;
  courtRisk: number;
  impeachmentRisk: number;
  militaryRefusalRisk: number;
  internationalBacklash: number;
  crisisTrigger: boolean;
};

export function createNewGame(config: NewGameConfig): GameState {
  const scenario = scenarios.find((item) => item.id === config.scenarioId) ?? scenarios[0];
  const seed = config.seed ?? `${Date.now()}`;
  const seedValue = hashSeed(seed);
  const partyId = config.partyId;
  const approval = mandateApproval(config.mandateStrength, scenario.startingApproval);
  const schedule = buildSchedule(scenario, seedValue);
  const selectedVp = {
    ...(vpOptions.find((vp) => vp.id === config.vicePresidentId) ?? vpOptions[seedValue % vpOptions.length]),
    portfolio: config.vicePresidentPortfolio ?? "Congressional relations",
  };

  const state: GameState = {
    schemaVersion: 1,
    id: `game-${seedValue}`,
    scenarioId: scenario.id,
    currentMonth: 0,
    currentDate: scenario.startDate,
    president: {
      name: config.presidentName,
      party: partyId,
      gender: config.gender ?? "Custom",
      age: config.age ?? 54,
      ethnicity: config.ethnicity ?? "Custom",
      religion: config.religion ?? "Custom",
      maritalStatus: config.maritalStatus ?? "Married with children",
      education: config.education ?? "State University",
      wealth: config.wealth ?? "Middle class",
      background: config.background,
      militaryService: config.militaryService ?? "No service",
      scandalHistory: config.scandalHistory ?? "Clean record",
      homeRegion: config.homeRegion ?? "Midwest",
      communicationStyle: config.communicationStyle ?? "Polished / presidential",
      ideology: config.ideology ?? ideologyForParty(partyId),
      mandateStrength: config.mandateStrength ?? "Comfortable Win",
      traits: [config.background, config.communicationStyle ?? "Polished / presidential"],
    },
    vicePresident: selectedVp,
    congress: buildCongress(scenario, partyId),
    supremeCourt: buildCourt(scenario.courtLean, seedValue),
    cabinet: buildCabinet(seedValue, partyId),
    institutionalOfficials: buildOfficials(seedValue, partyId),
    economy: { ...scenario.economy },
    foreignRelations: foreignActors.map((actor, index) => ({
      ...actor,
      relationship: clamp(actor.relationship + ((seedValue + index) % 9) - 4, 0, 100),
    })),
    states: buildStates(partyId, approval),
    stakeholders: stakeholderTemplates.map((stakeholder) => ({
      ...stakeholder,
      approval: clamp(50 + alignment(stakeholder.ideology, parties[partyId].ideology) * 20, 18, 82),
    })),
    personas: personaTemplates.map((persona) => ({
      ...persona,
      approval: clamp(approval + alignment(persona.ideology, parties[partyId].ideology) * 18, 18, 84),
      trust: clamp(46 + alignment(persona.ideology, parties[partyId].ideology) * 12, 20, 80),
    })),
    media: {
      tone: 0,
      narrative: "A new administration begins with uncertainty and opportunity.",
      headlines: {
        left: "Activists wait to see whether the new White House will deliver.",
        center: "New president takes office facing a crowded agenda.",
        right: "Opposition prepares early tests for the administration.",
        social: "The first month starts with every faction posting expectations.",
      },
    },
    currentEvent: eventById(schedule[0]),
    schedule,
    pendingBills: [],
    pendingCases: [],
    pendingCourtVacancies: [],
    activeCrises: scenario.tags.includes("crisis")
      ? [{ id: "opening-crisis", type: "economic crash", severity: 78, duration: 4, publicFear: 72, institutionalConfidence: 40, federalResponseQuality: 45, stateCooperation: 48, mediaPressure: 70, deathTollOrDamage: 35, economicImpact: 68 }]
      : [],
    scandals: [],
    timeline: [],
    approval: {
      overall: approval,
      party: clamp(approval + 8, 0, 100),
      opposition: clamp(22 - parties[partyId].ideology / 12, 0, 100),
      independent: clamp(approval - 2, 0, 100),
      enthusiasm: 52,
      trust: 50,
      competence: backgroundCompetence(config.background),
      honesty: config.scandalHistory === "Clean record" || !config.scandalHistory ? 58 : 43,
      strength: 50,
      empathy: 50,
    },
    legacy: computeLegacyShell(approval, "Term in progress"),
    settings: { ...defaultSettings, ...config.settings },
    seed,
    status: "governing",
  };

  return recomputeGame(state);
}

export function resolveResponse(game: GameState, response: PlayerResponse): TurnResolution {
  const before = game.approval.overall;
  const option = response.kind === "suggested" ? game.currentEvent.responseOptions.find((item) => item.id === response.optionId) : undefined;
  const parsedPolicy = response.kind === "custom" ? parseCustomPolicy(response.text) : parseOption(option ?? game.currentEvent.responseOptions[0]);
  const text = response.kind === "custom" ? response.text : (option?.text ?? game.currentEvent.responseOptions[0].text);
  const classification = response.kind === "custom" ? classifyPolicy(text) : normalPolicyClassification(parsedPolicy.tags, parsedPolicy.legalityRisk);
  const cabinetQuality = average(game.cabinet.map((member) => member.competence - member.fatigue * 0.4));
  const vpBoost = game.vicePresident.portfolio && game.currentEvent.issueTags.some((tag) => game.vicePresident.portfolio?.toLowerCase().includes(tag)) ? 4 : 0;
  const issueFit = game.currentEvent.issueTags.filter((tag) => parsedPolicy.tags.includes(tag)).length;
  const ideologyFit = alignment(parsedPolicy.ideologyScore, parties[game.president.party].ideology);
  const responseQuality = issueFit * 4 + ideologyFit * 5 + cabinetQuality / 18 + vpBoost - parsedPolicy.implementationComplexity / 22;
  const approvalDelta = round1(clamp((responseQuality - game.currentEvent.severity / 18) * 0.85, -12, 12));
  const congressDelta = round1(clamp((100 - parsedPolicy.assertiveness) / 18 + game.vicePresident.senateSkill / 30 - parsedPolicy.legalityRisk / 25, -8, 8));
  const courtRiskDelta = round1(game.settings.checksAndBalances ? clamp(parsedPolicy.legalityRisk / 15 + parsedPolicy.assertiveness / 30 - 4, -5, 10) : 0);
  const cabinetDelta = round1(clamp(responseQuality / 12 - parsedPolicy.implementationComplexity / 35, -5, 5));
  const economyDelta = economyImpact(game.currentEvent.issueTags, parsedPolicy, game.economy);
  const stakeholderDeltas = Object.fromEntries(game.stakeholders.map((stakeholder) => [stakeholder.id, round1(clamp(issueScore(stakeholder.issuePriorities, parsedPolicy.tags) * 2 + alignment(stakeholder.ideology, parsedPolicy.ideologyScore) * 4, -10, 10))]));
  const personaDeltas = Object.fromEntries(game.personas.map((persona) => [persona.id, round1(clamp(issueScore(persona.topIssues, parsedPolicy.tags) * 2 + alignment(persona.ideology, parsedPolicy.ideologyScore) * 5 + approvalDelta * 0.25, -12, 12))]));
  const mediaToneDelta = round1(clamp(approvalDelta + (parsedPolicy.tone === "combative" ? -3 : 1) - game.currentEvent.severity / 30, -12, 12));

  let effects: TurnResolutionSummary = {
    parsedPolicy,
    approvalDelta,
    congressDelta,
    courtRiskDelta,
    cabinetDelta,
    economyDelta,
    stakeholderDeltas,
    personaDeltas,
    mediaToneDelta,
  };
  if (classification.crisisTrigger) {
    effects = constitutionalCrisisEffects(game, parsedPolicy, classification);
  }
  const next: GameState = structuredClone(game);
  applyEffects(next, effects);
  if (classification.crisisTrigger) {
    addConstitutionalCrisisConsequences(next, text, effects, classification);
  } else {
    addInstitutionalConsequences(next, text, effects);
  }
  next.timeline.push({
    id: `turn-${next.currentMonth}-${next.timeline.length}`,
    month: next.currentMonth,
    dateLabel: dateLabel(next.currentMonth),
    title: classification.crisisTrigger ? "Constitutional Crisis" : next.currentEvent.title,
    decisionText: text,
    effectsSummary: summarizeEffects(effects),
    approvalBefore: before,
    approvalAfter: next.approval.overall,
    tags: parsedPolicy.tags,
  });
  next.media = classification.crisisTrigger ? buildConstitutionalCrisisMedia(next.currentEvent, classification) : buildMedia(next.currentEvent, parsedPolicy, mediaToneDelta);
  next.lastResolution = effects;
  return {
    game: recomputeGame(next),
    effects,
    reactions: classification.crisisTrigger ? buildConstitutionalCrisisReactions(classification) : buildReactions(next, effects),
  };
}

export function advanceTurn(game: GameState): TurnResolution {
  const next: GameState = structuredClone(game);
  normalizeCourtVacancyState(next);
  monthlyDrift(next);
  next.currentMonth += next.settings.pacing === "weekly" ? 0.25 : 1;
  const monthIndex = Math.floor(next.currentMonth);
  if (monthIndex >= 48) {
    next.status = game.vicePresident.loyalty > 50 && game.vicePresident.approval > 35 ? "vp_succession" : "completed";
    next.legacy = computeLegacy(next);
    return { game: recomputeGame(next), effects: neutralEffects(), reactions: ["The term concludes and historians begin scoring the record."] };
  }
  if (monthIndex === 22) next.status = "midterm";
  if (monthIndex === 46) next.status = "reelection";
  next.currentDate = dateLabel(monthIndex);
  next.currentEvent = eventById(next.schedule[monthIndex % next.schedule.length]);
  maybeOpenCourtVacancy(next, monthIndex);
  const courtResolved = resolveCourtMonth(next);
  const cabinetResolved = resolveCabinetEffects(courtResolved);
  return { game: recomputeGame(cabinetResolved), effects: neutralEffects(), reactions: ["A new month begins."] };
}

export function appointJustice(game: GameState, vacancyId: string, strategy: CourtNominationStrategy): GameState {
  const next: GameState = structuredClone(game);
  const wasLegacyVacancyEvent = next.currentEvent.id === "court-vacancy";
  normalizeCourtVacancyState(next);
  const vacancy = next.pendingCourtVacancies?.find((item) => item.id === vacancyId) ?? (wasLegacyVacancyEvent ? next.pendingCourtVacancies?.[0] : undefined);
  if (!vacancy) return next;

  const partyLean = parties[next.president.party].ideology;
  const ideology =
    strategy === "consensus"
      ? partyLean * 0.25
      : strategy === "historic"
        ? partyLean * 0.55
        : partyLean;
  const nominee: Justice = {
    id: `justice-appointed-${Math.floor(next.currentMonth)}-${next.supremeCourt.justices.length}`,
    name: generatedName(hashSeed(`${next.seed}-${vacancy.id}-${strategy}`)),
    ideology: round1(clamp(ideology, -95, 95)),
    age: strategy === "historic" ? 49 : strategy === "ideological" ? 52 : 58,
    health: strategy === "consensus" ? 78 : 72,
    appointedBy: next.president.party,
    judicialPhilosophy: strategy === "consensus" ? "institutionalist" : strategy === "historic" ? "pragmatist" : next.president.party === "republican" ? "originalist" : "living_constitutionalist",
    legitimacyConcern: strategy === "ideological" ? 58 : strategy === "historic" ? 38 : 26,
    retirementChance: strategy === "consensus" ? 8 : 6,
    chief: vacancy.chief,
  };

  next.supremeCourt.justices.push(nominee);
  next.pendingCourtVacancies = next.pendingCourtVacancies?.filter((item) => item.id !== vacancy.id) ?? [];
  next.supremeCourt.legitimacy = clamp(next.supremeCourt.legitimacy + (strategy === "consensus" ? 4 : strategy === "historic" ? 1 : -5), 0, 100);
  next.congress.cooperation = clamp(next.congress.cooperation + (strategy === "consensus" ? 2 : strategy === "ideological" ? -3 : 0), 0, 100);
  next.timeline.push({
    id: `court-appointment-${Math.floor(next.currentMonth)}-${next.timeline.length}`,
    month: next.currentMonth,
    dateLabel: next.currentDate,
    title: "Supreme Court Appointment",
    decisionText: `${next.president.name} nominates ${nominee.name} using a ${strategy.replace("-", " ")} strategy.`,
    effectsSummary: [`Court legitimacy ${strategy === "consensus" ? "+4" : strategy === "historic" ? "+1" : "-5"}`],
    approvalBefore: next.approval.overall,
    approvalAfter: next.approval.overall,
    tags: ["court", "judiciary", "appointment"],
  });

  if (next.currentEvent.id === "court-vacancy") {
    next.currentEvent = eventById(next.schedule[Math.floor(next.currentMonth) % next.schedule.length]);
  }

  return recomputeGame(next);
}

export function resolveBillAction(game: GameState, billId: string, action: BillAction): GameState {
  const next: GameState = structuredClone(game);
  const bill = next.pendingBills.find((item) => item.id === billId);
  if (!bill) return next;
  if (action === "sign") {
    bill.status = "signed";
    next.approval.overall = clamp(next.approval.overall + bill.publicSupport / 25 - 2, 0, 100);
  } else if (action === "veto") {
    bill.status = "vetoed";
    next.approval.overall = clamp(next.approval.overall - bill.publicSupport / 30, 0, 100);
  } else if (action === "negotiate" || action === "pressure" || action === "support") {
    const boost = action === "pressure" ? 8 : action === "negotiate" ? 6 : 4;
    bill.houseSupport = clamp(bill.houseSupport + boost, 0, 100);
    bill.senateSupport = clamp(bill.senateSupport + boost + next.vicePresident.senateSkill / 20, 0, 100);
    if (bill.houseSupport > 52 && bill.senateSupport > (bill.requiresFilibusterOverride ? 60 : 50)) bill.status = "on_desk";
  } else {
    bill.status = action === "oppose" ? "failed" : "introduced";
  }
  return recomputeGame(next);
}

export function resolveCourtMonth(game: GameState): GameState {
  const next: GameState = structuredClone(game);
  next.pendingCases = next.pendingCases.map((courtCase) => {
    if (courtCase.status !== "pending" || courtCase.decisionMonth > Math.floor(next.currentMonth)) return courtCase;
    const courtLean = average(next.supremeCourt.justices.map((justice) => justice.ideology));
    const partyLean = parties[next.president.party].ideology;
    const governmentWin = courtCase.governmentWinChance + alignment(courtLean, partyLean) * 18 > 50;
    return { ...courtCase, status: governmentWin ? "upheld" : courtCase.governmentWinChance > 42 ? "narrowed" : "struck_down" };
  });
  return next;
}

export function resolveCabinetEffects(game: GameState): GameState {
  const next: GameState = structuredClone(game);
  next.cabinet = next.cabinet.map((member) => ({
    ...member,
    fatigue: clamp(member.fatigue + 1.2, 0, 100),
    loyalty: clamp(member.loyalty + (next.approval.overall - 50) / 60 - member.scandalRisk / 300, 0, 100),
  }));
  const leakRisk = average(next.cabinet.map((member) => 100 - member.loyalty + member.scandalRisk)) / 2;
  if (leakRisk > 72 && !next.scandals.some((scandal) => scandal.stage !== "resolved")) {
    next.scandals.push({
      id: `scandal-${next.currentMonth}`,
      type: "cabinet leak",
      stage: "media_story",
      truthLevel: 45,
      evidenceStrength: 38,
      mediaIntensity: 55,
      oppositionAggression: 58,
      partyDefense: next.approval.party,
      publicFatigue: 15,
      legalExposure: 22,
    });
  }
  return next;
}

export function resolveElection(game: GameState, electionType: ElectionType): ElectionResult {
  const next: GameState = structuredClone(game);
  const economyScore = next.economy.gdpGrowth * 2 - next.economy.unemployment - next.economy.inflation + next.economy.consumerConfidence / 12;
  const nationalScore = next.approval.overall + economyScore + next.approval.enthusiasm / 10 - scandalLoad(next) / 4;
  if (electionType === "midterm") {
    const swing = Math.round((nationalScore - 54) * 1.4);
    const playerSeats = clamp(218 + swing, 145, 290);
    const playerSenate = clamp(50 + Math.round(swing / 9), 36, 64);
    updateCongressSeats(next, playerSeats, playerSenate);
    next.status = "governing";
    return { type: "midterm", game: recomputeGame(next), winner: playerSeats >= 218 ? next.president.party : oppositionParty(next.president.party), playerWon: playerSeats >= 218, houseSeats: playerSeats, senateSeats: playerSenate };
  }

  const electoralVotes = { democrat: 0, republican: 0, independent: 0 };
  for (const state of next.states) {
    const margin = state.approval - 50 + economyScore * state.economySensitivity * 0.25;
    if (margin >= 0) electoralVotes[next.president.party] += state.electoralVotes;
    else electoralVotes[oppositionParty(next.president.party)] += state.electoralVotes;
  }
  const playerWon = electoralVotes[next.president.party] >= 270;
  next.status = playerWon ? "completed" : "defeated";
  next.legacy = computeLegacy(next);
  return { type: "presidential", game: recomputeGame(next), winner: playerWon ? next.president.party : oppositionParty(next.president.party), playerWon, electoralVotes, popularVote: { democrat: 50, republican: 49, independent: 1 }, houseSeats: next.congress.house.seats[next.president.party], senateSeats: next.congress.senate.seats[next.president.party] };
}

export function computeLegacy(game: GameState) {
  const categories = [
    { name: "Economic Stewardship", score: clamp(50 + game.economy.gdpGrowth * 5 - game.economy.unemployment * 2 - game.economy.inflation * 2 + game.economy.consumerConfidence / 4, 0, 100) },
    { name: "Foreign Policy", score: clamp(average(game.foreignRelations.map((actor) => actor.relationship - actor.tension * 0.35 + 35)), 0, 100) },
    { name: "Domestic Policy", score: clamp(average(game.stakeholders.map((stakeholder) => stakeholder.approval)), 0, 100) },
    { name: "Civil Rights", score: clamp((game.stakeholders.find((item) => item.id === "civil-rights")?.approval ?? 50) + game.approval.empathy / 5, 0, 100) },
    { name: "Institutional Stability", score: clamp((game.congress.cooperation + game.supremeCourt.legitimacy + game.approval.trust) / 3 - scandalLoad(game) / 3, 0, 100) },
    { name: "Party Leadership", score: game.approval.party },
    { name: "Crisis Management", score: clamp(100 - average(game.activeCrises.map((crisis) => crisis.severity - crisis.federalResponseQuality / 2), 30), 0, 100) },
    { name: "Judicial Legacy", score: clamp(50 + alignment(average(game.supremeCourt.justices.map((justice) => justice.ideology)), parties[game.president.party].ideology) * 35, 0, 100) },
    { name: "Legislative Productivity", score: clamp(35 + game.pendingBills.filter((bill) => bill.status === "signed").length * 12 + game.congress.cooperation / 3, 0, 100) },
    { name: "Public Trust", score: clamp((game.approval.trust + game.approval.honesty + game.approval.overall) / 3, 0, 100) },
    { name: "Historical Significance", score: clamp(35 + game.timeline.length * 1.2 + game.approval.enthusiasm / 2, 0, 100) },
  ].map((category) => ({ ...category, score: Math.round(category.score) }));
  const total = Math.round(average(categories.map((category) => category.score)));
  return {
    total,
    categories,
    title: total >= 78 ? "Transformational President" : total >= 62 ? "Consequential President" : total >= 48 ? "Caretaker President" : "Failed President",
    ending: game.status === "removed" ? "Removed from Office" : game.status === "resigned" ? "Resigned" : game.status === "defeated" ? "One-Term Casualty" : game.status === "vp_succession" ? "VP Succession" : "Term Complete",
  };
}

export function parseCustomPolicy(text: string): ParsedPolicy {
  const lower = text.toLowerCase();
  const lexicon: Array<[string, string, number, number, number, number]> = [
    ["tax", "taxes", 25, 5, 20, 30], ["spending", "spending", -25, 15, 45, 45], ["stimulus", "jobs", -35, 25, 70, 55],
    ["border", "immigration", 40, 35, 25, 45], ["court", "court", 15, 30, 15, 35], ["climate", "climate", -55, 30, 45, 55],
    ["war", "war", 35, 50, 55, 65], ["troops", "war", 45, 55, 60, 65], ["diplomacy", "foreign", -10, 20, 20, 38],
    ["health", "healthcare", -32, 20, 50, 50], ["union", "labor", -45, 30, 25, 45], ["business", "business", 35, 22, 15, 36],
    ["bipartisan", "congress", 0, 10, 10, 24], ["executive", "executive", 10, 65, 25, 58], ["emergency", "crisis", 5, 75, 45, 62],
    ["police", "crime", 35, 38, 20, 42], ["rights", "civil-rights", -40, 34, 25, 48], ["housing", "housing", -30, 24, 50, 52],
  ];
  const matches = lexicon.filter(([keyword]) => lower.includes(keyword));
  const tags = [...new Set(matches.map(([, tag]) => tag))];
  const ideologyScore = matches.length ? average(matches.map(([, , ideology]) => ideology)) : 0;
  const assertiveness = clamp(matches.length ? average(matches.map(([, , , assertive]) => assertive)) : 35, 0, 100);
  const fiscalCost = clamp(matches.length ? average(matches.map(([, , , , fiscal]) => fiscal)) : 25, 0, 100);
  const implementationComplexity = clamp(matches.length ? average(matches.map(([, , , , , complexity]) => complexity)) : 45, 0, 100);
  const legalityRisk = clamp((lower.includes("executive") ? 24 : 8) + (lower.includes("ban") ? 18 : 0) + assertiveness / 8, 0, 100);
  const tone = lower.includes("fight") || lower.includes("punish") ? "combative" : lower.includes("families") || lower.includes("communities") ? "empathetic" : lower.includes("data") || lower.includes("experts") ? "technocratic" : assertiveness < 30 ? "cautious" : "moderate";
  return { tags: tags.length ? tags : ["general"], tone, ideologyScore: round1(ideologyScore), assertiveness: round1(assertiveness), legalityRisk: round1(legalityRisk), fiscalCost: round1(fiscalCost), implementationComplexity: round1(implementationComplexity) };
}

function classifyPolicy(text: string): PolicyClassification {
  const lower = text.toLowerCase();
  const extremeForceTerms = [
    "shoot on sight",
    "shoot-on-sight",
    "shoot to kill",
    "kill on sight",
    "execute",
    "summary execution",
    "death squads",
    "open fire on civilians",
    "lethal force against migrants",
    "fire at migrants",
    "shoot border crossers",
    "shoot illegal immigrants",
    "machine gun",
    "mines at the border",
    "landmines",
    "electric fence lethal",
  ];
  const authoritarianTerms = [
    "suspend habeas",
    "mass detention",
    "indefinite detention",
    "deport without hearing",
    "ignore court order",
    "defy the courts",
    "military tribunal",
    "martial law",
    "round up",
    "purge",
    "nationalize media",
    "arrest opposition",
  ];

  if (extremeForceTerms.some((term) => lower.includes(term))) {
    return {
      actionType: "extrajudicial_lethal_force",
      issueTags: ["immigration", "border_security", "civil_rights", "use_of_force"],
      legalityRisk: 100,
      rightsViolationRisk: 100,
      violenceLevel: 100,
      authoritarianLevel: 95,
      humanitarianRisk: 100,
      courtRisk: 100,
      impeachmentRisk: 90,
      militaryRefusalRisk: 85,
      internationalBacklash: 95,
      crisisTrigger: true,
    };
  }

  if (authoritarianTerms.some((term) => lower.includes(term))) {
    return {
      actionType: "authoritarian_overreach",
      issueTags: ["civil_rights", "executive_power"],
      legalityRisk: 85,
      rightsViolationRisk: 80,
      violenceLevel: 35,
      authoritarianLevel: 90,
      humanitarianRisk: 60,
      courtRisk: 85,
      impeachmentRisk: 60,
      militaryRefusalRisk: 40,
      internationalBacklash: 65,
      crisisTrigger: true,
    };
  }

  return normalPolicyClassification(parseCustomPolicy(text).tags, parseCustomPolicy(text).legalityRisk);
}

function normalPolicyClassification(issueTags: string[], legalityRisk: number): PolicyClassification {
  return {
    actionType: "normal",
    issueTags,
    legalityRisk,
    rightsViolationRisk: 0,
    violenceLevel: 0,
    authoritarianLevel: 0,
    humanitarianRisk: 0,
    courtRisk: legalityRisk,
    impeachmentRisk: 0,
    militaryRefusalRisk: 0,
    internationalBacklash: 0,
    crisisTrigger: false,
  };
}

function constitutionalCrisisEffects(game: GameState, parsedPolicy: ParsedPolicy, classification: PolicyClassification): TurnResolutionSummary {
  const restrictionistBoost = classification.actionType === "extrajudicial_lethal_force" ? 3 : 0;
  return {
    parsedPolicy: {
      ...parsedPolicy,
      tags: [...new Set([...parsedPolicy.tags, ...classification.issueTags])],
      tone: "combative",
      legalityRisk: classification.legalityRisk,
      assertiveness: Math.max(parsedPolicy.assertiveness, classification.authoritarianLevel),
      implementationComplexity: 100,
    },
    approvalDelta: classification.actionType === "extrajudicial_lethal_force" ? -25 : -16,
    congressDelta: classification.actionType === "extrajudicial_lethal_force" ? -8 : -6,
    courtRiskDelta: 10,
    cabinetDelta: classification.actionType === "extrajudicial_lethal_force" ? -30 : -18,
    economyDelta: {
      ...game.economy,
      consumerConfidence: clamp(game.economy.consumerConfidence - classification.internationalBacklash / 12, 0, 100),
      stockMarket: clamp(game.economy.stockMarket - classification.internationalBacklash / 16, 0, 100),
    },
    stakeholderDeltas: {
      "civil-rights": -50,
      defense: -40,
      states: -25,
      media: -35,
      business: -15,
      faith: restrictionistBoost,
    },
    personaDeltas: Object.fromEntries(game.personas.map((persona) => {
      const hardlineBoost = persona.topIssues.includes("border") || persona.topIssues.includes("security") ? restrictionistBoost : 0;
      const backlash = persona.ideology < -20 ? -18 : persona.ideology < 20 ? -12 : -5;
      return [persona.id, clamp(backlash + hardlineBoost, -25, 5)];
    })),
    mediaToneDelta: -12,
  };
}

function parseOption(option: ResponseOption): ParsedPolicy {
  const ideologyScore = option.style === "bold" ? 35 : option.style === "institutional" ? 0 : -5;
  return {
    tags: option.tags,
    tone: option.style === "bold" ? "combative" : option.style === "institutional" ? "technocratic" : "moderate",
    ideologyScore,
    assertiveness: option.style === "bold" ? 76 : option.style === "institutional" ? 32 : 48,
    legalityRisk: option.risk * 0.55,
    fiscalCost: option.tags.includes("spending") || option.tags.includes("healthcare") ? 62 : 34,
    implementationComplexity: option.risk,
  };
}

function applyEffects(game: GameState, effects: TurnResolutionSummary) {
  game.approval.overall = clamp(round1(game.approval.overall + effects.approvalDelta), 0, 100);
  game.approval.party = clamp(round1(game.approval.party + effects.approvalDelta * 0.7 + alignment(effects.parsedPolicy.ideologyScore, parties[game.president.party].ideology) * 2), 0, 100);
  game.approval.independent = clamp(round1(game.approval.independent + effects.approvalDelta * 0.85 - Math.abs(effects.parsedPolicy.ideologyScore) / 60), 0, 100);
  game.approval.opposition = clamp(round1(game.approval.opposition - effects.approvalDelta * 0.3), 0, 100);
  game.approval.competence = clamp(round1(game.approval.competence + effects.cabinetDelta * 0.5), 0, 100);
  game.approval.strength = clamp(round1(game.approval.strength + effects.parsedPolicy.assertiveness / 35 - 1), 0, 100);
  game.approval.empathy = clamp(round1(game.approval.empathy + (effects.parsedPolicy.tone === "empathetic" ? 3 : 0) + effects.approvalDelta / 8), 0, 100);
  game.approval.trust = clamp(round1(game.approval.trust + effects.mediaToneDelta / 8 - scandalLoad(game) / 50), 0, 100);
  game.economy = { ...game.economy, ...Object.fromEntries(Object.entries(effects.economyDelta).map(([key, value]) => [key, round1(value as number)])) };
  game.congress.cooperation = clamp(round1(game.congress.cooperation + effects.congressDelta), 0, 100);
  game.supremeCourt.legitimacy = clamp(round1(game.supremeCourt.legitimacy - Math.max(0, effects.courtRiskDelta) * 0.5), 0, 100);
  game.stakeholders = game.stakeholders.map((stakeholder) => ({ ...stakeholder, approval: clamp(round1(stakeholder.approval + (effects.stakeholderDeltas[stakeholder.id] ?? 0)), 0, 100) }));
  game.personas = game.personas.map((persona) => ({ ...persona, approval: clamp(round1(persona.approval + (effects.personaDeltas[persona.id] ?? 0)), 0, 100), trust: clamp(round1(persona.trust + effects.mediaToneDelta / 8), 0, 100) }));
  game.cabinet = game.cabinet.map((member) => ({ ...member, loyalty: clamp(round1(member.loyalty + effects.cabinetDelta), 0, 100), fatigue: clamp(member.fatigue + effects.parsedPolicy.implementationComplexity / 35, 0, 100) }));
  game.states = game.states.map((state) => ({ ...state, approval: clamp(round1(state.approval + effects.approvalDelta * 0.6 + economyStateEffect(game.economy, state.economySensitivity)), 0, 100) }));
}

function addInstitutionalConsequences(game: GameState, text: string, effects: TurnResolutionSummary) {
  const issue = game.currentEvent.issueTags[0] ?? "governance";
  if (game.currentEvent.issueTags.includes("congress") || game.currentEvent.issueTags.includes("budget") || effects.parsedPolicy.tags.includes("congress")) {
    game.pendingBills.push(makeBill(game, issue, effects));
  } else if (effects.parsedPolicy.fiscalCost > 45 || effects.approvalDelta > 2) {
    game.pendingBills.push(makeBill(game, issue, effects));
  }
  if (game.settings.checksAndBalances && effects.courtRiskDelta > 2) {
    game.pendingCases.push(makeCourtCase(game, text, effects));
  }
  if (game.currentEvent.severity > 72) {
    const existing = game.activeCrises.find((crisis) => crisis.type === game.currentEvent.issueTags[0]);
    if (existing) {
      existing.federalResponseQuality = clamp(existing.federalResponseQuality + effects.cabinetDelta + effects.approvalDelta, 0, 100);
      existing.severity = clamp(existing.severity - Math.max(0, effects.approvalDelta), 0, 100);
    } else {
      game.activeCrises.push({ id: `crisis-${game.currentMonth}`, type: issue, severity: game.currentEvent.severity, duration: 3, publicFear: game.currentEvent.urgency, institutionalConfidence: game.approval.trust, federalResponseQuality: 50 + effects.cabinetDelta, stateCooperation: game.congress.cooperation, mediaPressure: 55 - effects.mediaToneDelta, deathTollOrDamage: game.currentEvent.severity / 2, economicImpact: effects.parsedPolicy.fiscalCost / 2 });
    }
  }
  if (effects.mediaToneDelta < -8 && effects.parsedPolicy.legalityRisk > 35) {
    game.scandals.push({ id: `scandal-${game.currentMonth}`, type: "abuse of power allegation", stage: "inquiry", truthLevel: effects.parsedPolicy.legalityRisk / 2, evidenceStrength: 35, mediaIntensity: 62, oppositionAggression: 70, partyDefense: game.approval.party, publicFatigue: 8, legalExposure: effects.parsedPolicy.legalityRisk });
  }
}

function addConstitutionalCrisisConsequences(game: GameState, text: string, effects: TurnResolutionSummary, classification: PolicyClassification) {
  game.pendingCases.push({
    id: `case-crisis-${game.currentMonth}-${game.pendingCases.length}`,
    title: classification.actionType === "extrajudicial_lethal_force" ? "Civil Rights Groups v. United States" : `Challenge to ${text.slice(0, 34)}${text.length > 34 ? "..." : ""}`,
    challengedPolicyId: `turn-${game.currentMonth}`,
    constitutionalIssue: classification.actionType === "extrajudicial_lethal_force" ? "Due process, excessive force, and statutory authority" : "Separation of powers and due process",
    lowerCourtStatus: "Emergency injunction filed",
    plaintiffType: "civil_rights_group",
    governmentWinChance: classification.actionType === "extrajudicial_lethal_force" ? 1 : 8,
    decisionMonth: Math.floor(game.currentMonth),
    stakes: [{ target: "approval", amount: effects.approvalDelta }],
    status: "pending",
  });

  game.activeCrises.push({
    id: `constitutional-crisis-${game.currentMonth}`,
    type: "constitutional crisis",
    severity: classification.actionType === "extrajudicial_lethal_force" ? 96 : 82,
    duration: 4,
    publicFear: classification.humanitarianRisk,
    institutionalConfidence: Math.max(5, game.approval.trust - classification.authoritarianLevel / 2),
    federalResponseQuality: 8,
    stateCooperation: Math.max(5, game.congress.cooperation - classification.authoritarianLevel / 3),
    mediaPressure: 95,
    deathTollOrDamage: classification.violenceLevel / 2,
    economicImpact: classification.internationalBacklash / 2,
  });

  game.scandals.push({
    id: `unlawful-order-${game.currentMonth}-${game.scandals.length}`,
    type: "unlawful order allegation",
    stage: "hearings",
    truthLevel: classification.legalityRisk,
    evidenceStrength: 90,
    mediaIntensity: 92,
    oppositionAggression: classification.impeachmentRisk,
    partyDefense: Math.max(5, game.approval.party - 20),
    publicFatigue: 4,
    legalExposure: classification.courtRisk,
  });

  game.supremeCourt.legitimacy = clamp(game.supremeCourt.legitimacy - classification.courtRisk / 8, 0, 100);
  game.congress.cooperation = clamp(game.congress.cooperation - classification.impeachmentRisk / 12, 0, 100);
}

function makeBill(game: GameState, issue: string, effects: TurnResolutionSummary): Bill {
  const publicSupport = clamp(50 + effects.approvalDelta * 3 + game.approval.independent / 10, 5, 95);
  return {
    id: `bill-${game.currentMonth}-${game.pendingBills.length}`,
    title: `${titleCase(issue)} Response Act`,
    issueArea: issue,
    sponsorParty: game.president.party,
    status: "introduced",
    houseSupport: clamp(publicSupport + game.congress.cooperation / 8, 0, 100),
    senateSupport: clamp(publicSupport + game.vicePresident.senateSkill / 10, 0, 100),
    publicSupport,
    stakeholderEffects: Object.entries(effects.stakeholderDeltas).map(([target, amount]) => ({ target, amount })),
    economyEffects: Object.entries(effects.economyDelta).map(([target, amount]) => ({ target, amount: amount as number })),
    requiresFilibusterOverride: Math.abs(effects.parsedPolicy.ideologyScore) > 40,
  };
}

function makeCourtCase(game: GameState, text: string, effects: TurnResolutionSummary): CourtCase {
  return {
    id: `case-${game.currentMonth}-${game.pendingCases.length}`,
    title: `Challenge to ${text.slice(0, 34)}${text.length > 34 ? "..." : ""}`,
    challengedPolicyId: `turn-${game.currentMonth}`,
    constitutionalIssue: effects.parsedPolicy.legalityRisk > 50 ? "Separation of powers" : "Federal authority",
    lowerCourtStatus: "Emergency injunction requested",
    plaintiffType: effects.parsedPolicy.ideologyScore < 0 ? "business_group" : "civil_rights_group",
    governmentWinChance: clamp(58 - effects.courtRiskDelta * 4 + game.approval.trust / 10, 5, 95),
    decisionMonth: Math.floor(game.currentMonth + 3),
    stakes: [{ target: "approval", amount: -Math.abs(effects.courtRiskDelta) }],
    status: "pending",
  };
}

function recomputeGame(game: GameState): GameState {
  game.approval.overall = round1(average(game.personas.map((persona) => persona.approval * persona.weight)) / average(game.personas.map((persona) => persona.weight)));
  if (game.approval.overall <= 18) game.status = "resigned";
  if (game.approval.overall < 30 && scandalLoad(game) > 85 && game.congress.cooperation < 28) game.status = "removed";
  game.legacy = computeLegacyShell(game.approval.overall, game.legacy.ending);
  return game;
}

function monthlyDrift(game: GameState) {
  const economyPressure = game.economy.gdpGrowth - game.economy.unemployment * 0.35 - game.economy.inflation * 0.35;
  game.personas = game.personas.map((persona) => ({ ...persona, approval: clamp(round1(persona.approval + economyPressure / 8 + (50 - persona.approval) * 0.025), 0, 100) }));
  game.economy.inflation = round1(game.economy.inflation + (2.4 - game.economy.inflation) * 0.04);
  game.economy.unemployment = round1(game.economy.unemployment + (4.6 - game.economy.unemployment) * 0.04);
  game.economy.gdpGrowth = round1(game.economy.gdpGrowth + (2.2 - game.economy.gdpGrowth) * 0.04);
  game.activeCrises = game.activeCrises.map((crisis) => ({ ...crisis, duration: crisis.duration - 1, severity: clamp(crisis.severity - crisis.federalResponseQuality / 30, 0, 100) })).filter((crisis) => crisis.duration > 0 && crisis.severity > 18);
}

function economyImpact(tags: string[], parsed: ParsedPolicy, economy: Economy): Partial<Economy> {
  return {
    ...economy,
    gdpGrowth: clamp(economy.gdpGrowth + (tags.includes("economy") || tags.includes("jobs") ? 0.4 : 0.05) + parsed.fiscalCost / 250 - parsed.implementationComplexity / 400, -8, 9),
    unemployment: clamp(economy.unemployment - (tags.includes("jobs") ? 0.3 : 0.05) + parsed.fiscalCost / 500, 2, 16),
    inflation: clamp(economy.inflation + parsed.fiscalCost / 180 - (tags.includes("inflation") && parsed.ideologyScore > 0 ? 0.25 : 0), 0, 16),
    deficit: clamp(economy.deficit + parsed.fiscalCost / 35 - (parsed.ideologyScore > 20 ? 0.4 : 0), 0, 25),
    nationalDebt: clamp(economy.nationalDebt + parsed.fiscalCost / 80, 40, 220),
    consumerConfidence: clamp(economy.consumerConfidence + parsed.assertiveness / 40 - parsed.legalityRisk / 45, 0, 100),
    stockMarket: clamp(economy.stockMarket + (parsed.ideologyScore > 15 ? 2 : -0.5) - parsed.legalityRisk / 60, 0, 100),
    wageGrowth: clamp(economy.wageGrowth + (tags.includes("labor") ? 0.3 : 0.05), -4, 10),
    housingAffordability: clamp(economy.housingAffordability + (tags.includes("housing") ? 2.5 : -0.1), 0, 100),
    gasPrices: clamp(economy.gasPrices + (tags.includes("energy") && parsed.ideologyScore > 0 ? -0.1 : 0.03), 1, 9),
    poverty: clamp(economy.poverty - (tags.includes("poverty") || tags.includes("healthcare") ? 0.2 : 0.02), 2, 30),
  };
}

function buildCongress(scenario: Scenario, partyId: PartyId) {
  const playerUnified = scenario.congressControl === partyId;
  const split = scenario.congressControl === "split";
  const playerHouse = playerUnified ? 232 : split ? 218 : 204;
  const playerSenate = playerUnified ? 53 : split ? 50 : 47;
  const other = oppositionParty(partyId);
  return {
    house: { seats: seats(partyId, other, playerHouse, 435), control: playerHouse >= 218 ? partyId : other, speakerRelationship: playerUnified ? 64 : 42 },
    senate: { seats: seats(partyId, other, playerSenate, 100), control: playerSenate >= 50 ? partyId : other, majorityLeaderRelationship: playerUnified ? 62 : 40, filibusterThreshold: 60 },
    committeeObstruction: playerUnified ? 28 : 58,
    cooperation: playerUnified ? 62 : split ? 48 : 36,
  };
}

function buildCourt(courtLean: number, seedValue: number) {
  const justices: Justice[] = Array.from({ length: 9 }, (_, index) => ({
    id: `justice-${index}`,
    name: generatedName(seedValue + index + 90),
    ideology: clamp(courtLean + (index - 4) * 14, -95, 95),
    age: 48 + ((seedValue + index * 4) % 35),
    health: 55 + ((seedValue + index * 6) % 42),
    appointedBy: courtLean + (index - 4) * 14 < 0 ? "democrat" : "republican",
    judicialPhilosophy: index % 5 === 0 ? "institutionalist" : index % 5 === 1 ? "originalist" : index % 5 === 2 ? "textualist" : index % 5 === 3 ? "living_constitutionalist" : "pragmatist",
    legitimacyConcern: 30 + ((seedValue + index * 8) % 45),
    retirementChance: 5 + ((seedValue + index * 2) % 18),
    chief: index === 4,
  }));
  return { justices, legitimacy: 58 };
}

function normalizeCourtVacancyState(game: GameState) {
  game.pendingCourtVacancies = game.pendingCourtVacancies ?? [];
  game.schedule = game.schedule.filter((id) => id !== "court-vacancy");
  if (game.currentEvent.id === "court-vacancy") {
    openCourtVacancy(game, Math.floor(game.currentMonth), "retirement");
    game.currentEvent = eventById(game.schedule[Math.floor(game.currentMonth) % game.schedule.length]);
  }
}

function maybeOpenCourtVacancy(game: GameState, monthIndex: number) {
  normalizeCourtVacancyState(game);
  if ((game.pendingCourtVacancies?.length ?? 0) || game.supremeCourt.justices.length <= 8) return;
  const candidate = [...game.supremeCourt.justices].sort((a, b) => b.retirementChance - a.retirementChance)[0];
  const roll = hashSeed(`${game.seed}-court-vacancy-${monthIndex}`) % 100;
  if (roll < candidate.retirementChance / 4) {
    openCourtVacancy(game, monthIndex, "retirement", candidate.id);
  }
}

function openCourtVacancy(game: GameState, monthIndex: number, reason: SupremeCourtVacancy["reason"], justiceId?: string) {
  game.pendingCourtVacancies = game.pendingCourtVacancies ?? [];
  if (game.pendingCourtVacancies.length || game.supremeCourt.justices.length <= 8) return;
  const selected =
    game.supremeCourt.justices.find((justice) => justice.id === justiceId) ??
    [...game.supremeCourt.justices].sort((a, b) => b.retirementChance - a.retirementChance)[0];

  game.supremeCourt.justices = game.supremeCourt.justices.filter((justice) => justice.id !== selected.id);
  game.pendingCourtVacancies.push({
    id: `vacancy-${monthIndex}-${selected.id}`,
    previousJusticeName: selected.name,
    previousIdeology: selected.ideology,
    openedMonth: monthIndex,
    reason,
    chief: Boolean(selected.chief),
  });
}

function buildSchedule(scenario: Scenario, seedValue: number): string[] {
  const ids = (scenario.eventIds.length ? [...scenario.eventIds] : events.map((item) => item.id)).filter((id) => id !== "court-vacancy");
  if (!ids.length) ids.push(...events.map((item) => item.id).filter((id) => id !== "court-vacancy"));
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const swap = (seedValue + index * 17) % ids.length;
    [ids[index], ids[swap]] = [ids[swap], ids[index]];
  }
  return Array.from({ length: 52 }, (_, index) => ids[index % ids.length]);
}

function eventById(id: string): ScenarioEvent {
  return events.find((item) => item.id === id) ?? events[0];
}

function neutralEffects(): TurnResolutionSummary {
  return { parsedPolicy: { tags: [], tone: "moderate", ideologyScore: 0, assertiveness: 0, legalityRisk: 0, fiscalCost: 0, implementationComplexity: 0 }, approvalDelta: 0, congressDelta: 0, courtRiskDelta: 0, cabinetDelta: 0, economyDelta: {}, stakeholderDeltas: {}, personaDeltas: {}, mediaToneDelta: 0 };
}

function buildMedia(event: ScenarioEvent, parsed: ParsedPolicy, toneDelta: number) {
  const positive = toneDelta >= 1;
  const negative = toneDelta <= -3;
  return {
    tone: toneDelta,
    narrative: positive ? "The White House looks organized and forceful." : negative ? "The response creates a sharper backlash than expected." : "The country splits over the administration's approach.",
    headlines: {
      left: parsed.ideologyScore < -10 ? `Progressives cautiously welcome action on ${event.title}` : `Activists warn White House is too cautious on ${event.title}`,
      center: positive ? `President steadies response to ${event.title}` : negative ? `President faces criticism after ${event.title}` : `President seeks middle path on ${event.title}`,
      right: parsed.ideologyScore > 10 ? `Conservatives praise tougher line on ${event.title}` : `Opposition attacks federal overreach in ${event.title}`,
      social: negative ? `${event.title} dominates feeds as critics pile on.` : `${event.title} sparks a wave of instant reactions.`,
    },
  };
}

function buildConstitutionalCrisisMedia(event: ScenarioEvent, classification: PolicyClassification) {
  const title = classification.actionType === "extrajudicial_lethal_force" ? "lethal-force order" : "executive order";
  return {
    tone: -12,
    narrative: `The ${title} triggers an immediate constitutional crisis instead of a normal policy fight.`,
    headlines: {
      left: `Civil-rights groups seek emergency injunction after ${event.title}`,
      center: `Courts and agencies resist unlawful ${title}`,
      right: `President's party splits as crisis escalates`,
      social: `Legal experts, allies, and protesters condemn the ${title}.`,
    },
  };
}

function buildReactions(game: GameState, effects: TurnResolutionSummary) {
  return game.personas.slice(0, 4).map((persona) => {
    const delta = effects.personaDeltas[persona.id] ?? 0;
    const issue = persona.topIssues.find((priority) => effects.parsedPolicy.tags.includes(priority)) ?? effects.parsedPolicy.tags[0] ?? "the issue";

    if (delta >= 2) {
      if (persona.reactionStyle === "impatient") return `${persona.name} sees progress on ${issue}, but wants faster follow-through.`;
      if (persona.reactionStyle === "coalitional") return `${persona.name} thinks the response can hold a broader coalition on ${issue}.`;
      if (persona.reactionStyle === "practical") return `${persona.name} wants proof the ${issue} plan will work at home.`;
      if (persona.reactionStyle === "material") return `${persona.name} credits the response for addressing pocketbook stakes around ${issue}.`;
      if (persona.reactionStyle === "cost-focused") return `${persona.name} welcomes the plan if it keeps costs and compliance predictable.`;
      if (persona.reactionStyle === "ideological") return `${persona.name} says the move finally draws a clearer line on ${issue}.`;
      if (persona.reactionStyle === "strength-focused") return `${persona.name} says the response projects resolve on ${issue}.`;
      return `${persona.name} cautiously approves, but wants steady implementation.`;
    }
    if (delta <= -2) {
      if (persona.reactionStyle === "impatient") return `${persona.name} says the response is too timid on ${issue}.`;
      if (persona.reactionStyle === "coalitional") return `${persona.name} worries the coalition is fraying over ${issue}.`;
      if (persona.reactionStyle === "practical") return `${persona.name} doubts the plan solves the daily pressure from ${issue}.`;
      if (persona.reactionStyle === "material") return `${persona.name} says workers still need concrete help on ${issue}.`;
      if (persona.reactionStyle === "cost-focused") return `${persona.name} warns the response could add costs without certainty.`;
      if (persona.reactionStyle === "ideological") return `${persona.name} says the administration is conceding too much on ${issue}.`;
      if (persona.reactionStyle === "strength-focused") return `${persona.name} says the response lacks enough force on ${issue}.`;
      return `${persona.name} is not convinced the response meets the moment.`;
    }
    if (persona.reactionStyle === "practical") return `${persona.name} is waiting for measurable results before judging the response.`;
    if (persona.reactionStyle === "risk-averse") return `${persona.name} is watching for stability and unintended consequences.`;
    return `${persona.name} is reserving judgment while the policy rolls out.`;
  });
}

function buildConstitutionalCrisisReactions(classification: PolicyClassification) {
  const lethal = classification.actionType === "extrajudicial_lethal_force";
  return [
    `Courts: Emergency injunction filed within hours. Government win chance is ${lethal ? "near zero" : "very low"}.`,
    `Congress: Opposition leadership announces emergency hearings and impeachment pressure rises sharply.`,
    `Cabinet: Legal and security officials object that the order is unlawful, with high refusal and resignation risk.`,
    `Public: A hardline faction applauds the show of force, but independents, moderates, and civil-liberties voters recoil.`,
    `International: Allies and human-rights organizations condemn the policy as a severe rule-of-law breach.`,
  ];
}

function summarizeEffects(effects: TurnResolutionSummary): string[] {
  return [
    `Approval ${effects.approvalDelta >= 0 ? "+" : ""}${effects.approvalDelta}`,
    `Congress ${effects.congressDelta >= 0 ? "+" : ""}${effects.congressDelta}`,
    `Court risk ${effects.courtRiskDelta >= 0 ? "+" : ""}${effects.courtRiskDelta}`,
    `Cabinet ${effects.cabinetDelta >= 0 ? "+" : ""}${effects.cabinetDelta}`,
  ];
}

function updateCongressSeats(game: GameState, playerHouse: number, playerSenate: number) {
  const other = oppositionParty(game.president.party);
  game.congress.house.seats = seats(game.president.party, other, playerHouse, 435);
  game.congress.senate.seats = seats(game.president.party, other, playerSenate, 100);
  game.congress.house.control = playerHouse >= 218 ? game.president.party : other;
  game.congress.senate.control = playerSenate >= 50 ? game.president.party : other;
  game.congress.cooperation = clamp(game.congress.cooperation + (playerHouse >= 218 ? 5 : -8), 0, 100);
}

function seats(player: PartyId, other: PartyId, playerSeats: number, total: number) {
  return {
    democrat: player === "democrat" ? playerSeats : other === "democrat" ? total - playerSeats : 0,
    republican: player === "republican" ? playerSeats : other === "republican" ? total - playerSeats : 0,
    independent: player === "independent" ? playerSeats : other === "independent" ? total - playerSeats : 0,
  };
}

function hashSeed(seed: string): number {
  return seed.split("").reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) >>> 0, 2166136261);
}

function mandateApproval(mandate: string | undefined, scenarioApproval: number): number {
  if (mandate === "Landslide Victory") return clamp(scenarioApproval + 6, 0, 100);
  if (mandate === "Razor-Thin Margin") return clamp(scenarioApproval - 5, 0, 100);
  if (mandate === "Electoral College Only") return clamp(scenarioApproval - 8, 0, 100);
  return scenarioApproval;
}

function ideologyForParty(partyId: PartyId): string {
  if (partyId === "democrat") return "Liberal Mainstream";
  if (partyId === "republican") return "Conservative Mainstream";
  return "Centrist Reformer";
}

function backgroundCompetence(background: string): number {
  if (background.includes("Governor") || background.includes("Vice President")) return 62;
  if (background.includes("Senator")) return 58;
  if (background.includes("Business")) return 54;
  return 50;
}

function issueScore(priorities: string[], tags: string[]): number {
  return priorities.filter((priority) => tags.includes(priority)).length;
}

function alignment(a: number, b: number): number {
  return clamp(1 - Math.abs(a - b) / 120, -1, 1);
}

function average(values: number[], fallback = 0): number {
  if (!values.length) return fallback;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function economyStateEffect(economy: Economy, sensitivity: number): number {
  return ((economy.gdpGrowth - 2.2) - (economy.inflation - 2.5) * 0.35 - (economy.unemployment - 4.6) * 0.45) * sensitivity * 0.15;
}

function scandalLoad(game: GameState): number {
  return game.scandals.filter((scandal) => scandal.stage !== "resolved").reduce((sum, scandal) => sum + scandal.mediaIntensity + scandal.legalExposure, 0) / 2;
}

function oppositionParty(partyId: PartyId): PartyId {
  if (partyId === "republican") return "democrat";
  return "republican";
}

function computeLegacyShell(approval: number, ending: string) {
  return {
    total: Math.round(approval),
    title: "Term in progress",
    ending,
    categories: [
      { name: "Economic Stewardship", score: Math.round(approval) },
      { name: "Institutional Stability", score: Math.round(approval) },
    ],
  };
}

function dateLabel(month: number): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[month % 12]} Year ${Math.floor(month / 12) + 1}`;
}

function titleCase(value: string): string {
  return value.replace(/(^|\s|-)\S/g, (letter) => letter.toUpperCase()).replace(/-/g, " ");
}
