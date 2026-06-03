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
  ActionResultDetails,
  AdvisorReview,
  AgendaActionCategory,
  AgendaActionInput,
  AgendaProject,
  AgendaResources,
  Bill,
  BillAction,
  CongressionalAuthorization,
  CovertOperation,
  CovertOperationInput,
  CovertOutcome,
  CovertOperationType,
  CourtNominationStrategy,
  CourtCase,
  Economy,
  ElectionResult,
  ElectionType,
  FutureConsequence,
  GameSettings,
  GameState,
  Justice,
  MilitaryAction,
  MilitaryActionInput,
  MilitaryOutcome,
  MilitaryActionType,
  NationalSecurityState,
  NewGameConfig,
  ParsedPolicy,
  PartyId,
  PolicyVehicle,
  PlayerResponse,
  ResponseOption,
  Scenario,
  ScenarioEvent,
  SupremeCourtVacancy,
  TurnResolution,
  TurnResolutionSummary,
  TurnType,
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

const agendaMonthEvent: ScenarioEvent = {
  id: "agenda-month",
  title: "Agenda Month",
  dateWindow: "This month",
  description: "No major crisis this month. The administration has room to advance its own agenda.",
  issueTags: ["agenda", "governance"],
  severity: 18,
  urgency: 24,
  affectedGroups: ["administration"],
  affectedStates: [],
  responseOptions: [],
  allowCustomResponse: false,
};

const covertOperationBaseRisk: Record<CovertOperationType, { success: number; exposure: number; blowback: number; legal: number; diplomatic: number; civilian: number }> = {
  intelligence_collection: { success: 68, exposure: 24, blowback: 18, legal: 22, diplomatic: 24, civilian: 5 },
  cyber_disruption: { success: 56, exposure: 42, blowback: 40, legal: 38, diplomatic: 45, civilian: 8 },
  counterterror_disruption: { success: 58, exposure: 34, blowback: 38, legal: 32, diplomatic: 35, civilian: 24 },
  hostage_recovery_support: { success: 52, exposure: 38, blowback: 34, legal: 28, diplomatic: 30, civilian: 18 },
  support_friendly_opposition: { success: 46, exposure: 48, blowback: 52, legal: 45, diplomatic: 55, civilian: 22 },
  sabotage_hostile_capability: { success: 48, exposure: 52, blowback: 58, legal: 50, diplomatic: 60, civilian: 28 },
  asset_exfiltration: { success: 54, exposure: 44, blowback: 42, legal: 36, diplomatic: 42, civilian: 14 },
  regime_destabilization: { success: 34, exposure: 64, blowback: 76, legal: 70, diplomatic: 78, civilian: 46 },
};

const militaryActionBaseRisk: Record<MilitaryActionType, { success: number; escalation: number; casualty: number; civilian: number; publicSupport: number; readiness: number }> = {
  show_of_force: { success: 68, escalation: 22, casualty: 4, civilian: 2, publicSupport: 56, readiness: 4 },
  deploy_carrier_group: { success: 62, escalation: 32, casualty: 6, civilian: 3, publicSupport: 52, readiness: 8 },
  airstrike: { success: 56, escalation: 50, casualty: 16, civilian: 34, publicSupport: 44, readiness: 10 },
  limited_missile_strike: { success: 54, escalation: 46, casualty: 10, civilian: 28, publicSupport: 46, readiness: 9 },
  special_operations_raid: { success: 50, escalation: 42, casualty: 38, civilian: 26, publicSupport: 48, readiness: 12 },
  no_fly_zone: { success: 46, escalation: 64, casualty: 34, civilian: 30, publicSupport: 42, readiness: 16 },
  peacekeeping_deployment: { success: 54, escalation: 34, casualty: 28, civilian: 18, publicSupport: 50, readiness: 14 },
  humanitarian_intervention: { success: 48, escalation: 48, casualty: 32, civilian: 24, publicSupport: 46, readiness: 16 },
  evacuation_operation: { success: 62, escalation: 30, casualty: 24, civilian: 12, publicSupport: 62, readiness: 10 },
  counterterror_campaign: { success: 44, escalation: 56, casualty: 46, civilian: 38, publicSupport: 42, readiness: 20 },
  troop_surge: { success: 42, escalation: 68, casualty: 60, civilian: 42, publicSupport: 35, readiness: 28 },
  full_invasion: { success: 32, escalation: 86, casualty: 82, civilian: 72, publicSupport: 28, readiness: 44 },
  withdrawal: { success: 58, escalation: 26, casualty: 20, civilian: 18, publicSupport: 54, readiness: -12 },
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

export function defaultAgendaResources(approval = 50, seedValue = 0): AgendaResources {
  return {
    whiteHouseBandwidth: clamp(58 + (seedValue % 7) + (approval - 50) / 8, 0, 100),
    congressionalCapital: clamp(50 + (seedValue % 11) + (approval - 50) / 5, 0, 100),
    mediaAttention: clamp(54 + (seedValue % 9), 0, 100),
    agencyCapacity: clamp(56 + (seedValue % 13), 0, 100),
    politicalCapital: clamp(52 + (approval - 50) / 2, 0, 100),
  };
}

export function buildNationalSecurity(
  relations: GameState["foreignRelations"],
  activeDeployments: MilitaryAction[] = [],
  covertOperations: CovertOperation[] = [],
  seedValue = 0,
): NationalSecurityState {
  const threatMatrix = relations.map((actor, index) => ({
    actorId: actor.id,
    threatLevel: round1(clamp(actor.tension * 0.6 + actor.militaryRisk * 0.4, 0, 100)),
    intelligenceConfidence: round1(clamp(52 + ((seedValue + index * 7) % 26), 0, 100)),
  }));
  return {
    activeDeployments,
    covertOperations,
    warPowersClock: activeDeployments.find((action) => action.warPowersClock !== undefined)?.warPowersClock ?? null,
    militaryReadiness: clamp(72 - activeDeployments.length * 6, 0, 100),
    casualties: 0,
    alliedSupport: round1(clamp(average(relations.map((actor) => actor.relationship), 50), 0, 100)),
    threatMatrix,
    intelligenceConfidence: round1(average(threatMatrix.map((item) => item.intelligenceConfidence), 60)),
    pendingNscDecisions: [],
  };
}

export function normalizeGameState(game: GameState): GameState {
  const next = structuredClone(game) as GameState;
  next.schemaVersion = 2;
  next.currentTurnType = next.currentTurnType ?? "major_event";
  next.agendaResources = next.agendaResources ?? defaultAgendaResources(next.approval?.overall ?? 50, hashSeed(next.seed ?? next.id ?? "game"));
  next.agendaProjects = next.agendaProjects ?? [];
  next.nationalSecurity = next.nationalSecurity ?? buildNationalSecurity(next.foreignRelations ?? [], [], [], hashSeed(next.seed ?? next.id ?? "security"));
  next.nationalSecurity.activeDeployments = next.nationalSecurity.activeDeployments ?? [];
  next.nationalSecurity.covertOperations = next.nationalSecurity.covertOperations ?? [];
  next.nationalSecurity.threatMatrix = next.nationalSecurity.threatMatrix?.length
    ? next.nationalSecurity.threatMatrix
    : buildNationalSecurity(next.foreignRelations ?? [], next.nationalSecurity.activeDeployments, next.nationalSecurity.covertOperations, hashSeed(next.seed ?? next.id ?? "security")).threatMatrix;
  next.nationalSecurity.pendingNscDecisions = next.nationalSecurity.pendingNscDecisions ?? [];
  next.nationalSecurity.warPowersClock = next.nationalSecurity.warPowersClock && next.nationalSecurity.warPowersClock > 0
    ? next.nationalSecurity.warPowersClock
    : next.nationalSecurity.activeDeployments.find((action) => action.warPowersClock !== undefined && action.warPowersClock > 0)?.warPowersClock ?? null;
  next.pendingCourtVacancies = next.pendingCourtVacancies ?? [];
  return next;
}

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
  const adjustedForeignRelations = foreignActors.map((actor, index) => ({
    ...actor,
    relationship: clamp(actor.relationship + ((seedValue + index) % 9) - 4, 0, 100),
  }));

  const state: GameState = {
    schemaVersion: 2,
    id: `game-${seedValue}`,
    scenarioId: scenario.id,
    currentMonth: 0,
    currentDate: scenario.startDate,
    currentTurnType: "major_event",
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
    foreignRelations: adjustedForeignRelations,
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
    agendaResources: defaultAgendaResources(approval, seedValue),
    agendaProjects: [],
    nationalSecurity: buildNationalSecurity(adjustedForeignRelations, [], [], seedValue),
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

  return recomputeGame(normalizeGameState(state));
}

export function resolveResponse(game: GameState, response: PlayerResponse): TurnResolution {
  game = normalizeGameState(game);
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
  const next: GameState = normalizeGameState(game);
  normalizeCourtVacancyState(next);
  monthlyDrift(next);
  advanceStrategicActions(next);
  next.currentMonth += next.settings.pacing === "weekly" ? 0.25 : 1;
  const monthIndex = Math.floor(next.currentMonth);
  if (monthIndex >= 48) {
    next.status = game.vicePresident.loyalty > 50 && game.vicePresident.approval > 35 ? "vp_succession" : "completed";
    next.legacy = computeLegacy(next);
    return { game: recomputeGame(next), effects: neutralEffects(), reactions: ["The term concludes and historians begin scoring the record."] };
  }
  const turnType = chooseTurnType(next, monthIndex);
  next.currentTurnType = turnType;
  if (monthIndex === 22) next.status = "midterm";
  if (monthIndex === 46) next.status = "reelection";
  next.currentDate = dateLabel(monthIndex);
  next.currentEvent = turnType === "agenda_month" ? agendaMonthEvent : eventById(next.schedule[monthIndex % next.schedule.length]);
  maybeOpenCourtVacancy(next, monthIndex);
  const courtResolved = resolveCourtMonth(next);
  const cabinetResolved = resolveCabinetEffects(courtResolved);
  return { game: recomputeGame(cabinetResolved), effects: neutralEffects(), reactions: [`A new ${turnType.replace(/_/g, " ")} begins.`] };
}

export function resolveAgendaAction(game: GameState, input: AgendaActionInput): TurnResolution {
  const next = normalizeGameState(game);
  const before = next.approval.overall;
  const cost = agendaCost(input.category, input.vehicle);
  consumeAgendaResources(next, cost);
  const project = upsertAgendaProject(next, input, cost);
  const parsedPolicy = parseAgendaPolicy(input);
  const implementation = agendaImplementationScore(next, input.vehicle, project.blockers.length);
  const approvalDelta = round1(clamp((implementation - 54) / 12 + vehicleApprovalModifier(input.vehicle), -6, 7));
  const congressDelta = round1(clamp((input.vehicle === "legislation" ? 5 : -1) + next.congress.cooperation / 40 - parsedPolicy.legalityRisk / 24, -6, 7));
  const courtRiskDelta = round1(input.vehicle === "executive_order" || input.vehicle === "agency_rulemaking" ? clamp(parsedPolicy.legalityRisk / 18, 0, 8) : 0);
  const cabinetDelta = round1(clamp(implementation / 25 - 2, -3, 5));
  const mediaToneDelta = round1(clamp(input.category === "communications" ? 4 : approvalDelta / 2, -6, 6));
  const effects: TurnResolutionSummary = {
    parsedPolicy,
    approvalDelta,
    congressDelta,
    courtRiskDelta,
    cabinetDelta,
    economyDelta: agendaEconomyDelta(next.economy, input.category, input.vehicle),
    stakeholderDeltas: agendaStakeholderDeltas(next, input.category, approvalDelta),
    personaDeltas: Object.fromEntries(next.personas.map((persona) => [persona.id, clamp(approvalDelta * 0.7 + (persona.topIssues.some((issue) => parsedPolicy.tags.includes(issue)) ? 2 : 0), -7, 7)])),
    mediaToneDelta,
  };
  applyEffects(next, effects);
  if (input.vehicle === "legislation" || input.category === "legislation") {
    next.pendingBills.push(makeBill(next, agendaIssue(input.category), effects));
  }
  if (next.settings.checksAndBalances && courtRiskDelta > 2) {
    next.pendingCases.push(makeCourtCase(next, input.objective, effects));
  }

  const timelineId = `agenda-${Math.floor(next.currentMonth)}-${next.timeline.length}`;
  next.timeline.push({
    id: timelineId,
    month: next.currentMonth,
    dateLabel: next.currentDate,
    title: `${titleCase(input.category.replace(/_/g, " "))} Agenda`,
    decisionText: `${titleCase(input.vehicle.replace(/_/g, " "))}: ${input.objective}`,
    effectsSummary: [...summarizeEffects(effects), `Project progress ${Math.round(project.progress)}%`],
    approvalBefore: before,
    approvalAfter: next.approval.overall,
    tags: parsedPolicy.tags,
  });
  next.lastResolution = effects;
  next.lastActionResult = buildActionResult({
    vehicle: input.vehicle,
    objective: input.objective,
    legalBasis: legalBasisForVehicle(input.vehicle),
    successFailure: implementation >= 62 ? "strong progress" : implementation >= 46 ? "partial progress" : "blocked",
    visibility: input.vehicle === "public_campaign" || input.category === "communications" ? "high" : "medium",
    congressReaction: congressDelta >= 2 ? "Congress sees a workable path." : congressDelta <= -2 ? "Congress warns the White House is bypassing lawmakers." : "Congress reserves judgment.",
    alliedReaction: input.category === "foreign_policy" || input.category === "national_security" ? "Allies watch for follow-through." : "Allies are not central to this agenda move.",
    adversaryReaction: input.category === "national_security" ? "Adversaries test whether the policy is backed by resources." : "Adversaries have limited immediate reaction.",
    institutionalRisk: courtRiskDelta > 4 ? "elevated legal and implementation risk" : "manageable institutional risk",
    futureRisks: project.blockers.length ? ["oversight_investigations"] : [],
    timelineEntryId: timelineId,
  });
  next.media = buildMedia(next.currentEvent, parsedPolicy, mediaToneDelta);
  return { game: recomputeGame(next), effects, reactions: [`Agenda project "${project.title}" is now ${project.status} at ${Math.round(project.progress)}% progress.`] };
}

export function resolveCovertOperation(game: GameState, input: CovertOperationInput): TurnResolution {
  const next = normalizeGameState(game);
  const before = next.approval.overall;
  const target = next.foreignRelations.find((actor) => actor.id === input.targetActorId) ?? next.foreignRelations[0];
  const base = covertOperationBaseRisk[input.operationType];
  const authorizationModifier = input.authorizationLevel === "presidential_finding" ? -8 : input.authorizationLevel === "nsc_review" ? -4 : input.authorizationLevel === "agency_discretion" ? 8 : 0;
  const operation: CovertOperation = {
    id: `covert-${Math.floor(next.currentMonth)}-${next.nationalSecurity.covertOperations.length}`,
    operationType: input.operationType,
    targetActorId: target.id,
    objective: input.objective,
    authorizationLevel: input.authorizationLevel,
    successChance: round1(clamp(base.success + next.nationalSecurity.intelligenceConfidence / 10 - target.tension / 10, 5, 95)),
    exposureRisk: round1(clamp(base.exposure + authorizationModifier + target.tension / 8, 0, 100)),
    blowbackRisk: round1(clamp(base.blowback + target.militaryRisk / 8, 0, 100)),
    legalRisk: round1(clamp(base.legal + authorizationModifier, 0, 100)),
    diplomaticRisk: round1(clamp(base.diplomatic + Math.max(0, target.relationship - 45) / 5, 0, 100)),
    civilianHarmRisk: round1(clamp(base.civilian, 0, 100)),
    durationMonths: clamp(Math.round(input.durationMonths || 1), 1, 12),
    status: "completed",
    startedMonth: Math.floor(next.currentMonth),
    advisorReview: buildCovertAdvisorReview(base, input.authorizationLevel),
    futureConsequences: [],
  };
  const outcome = covertOutcome(next, operation);
  operation.outcome = outcome;
  operation.futureConsequences = consequencesForCovert(operation);
  next.nationalSecurity.covertOperations.push(operation);
  applyCovertOutcome(next, operation, target.id);
  const effects = strategicEffects(next, {
    tags: ["covert_operation", "national_security", target.id],
    tone: operation.exposureRisk > 55 ? "cautious" : "technocratic",
    ideologyScore: 0,
    assertiveness: 48,
    legalityRisk: operation.legalRisk,
    fiscalCost: 18,
    implementationComplexity: 60,
  }, outcome.includes("success") ? 1 : -2, -operation.legalRisk / 20, operation.exposureRisk > 55 ? -5 : -1);
  applyEffects(next, effects);
  const timelineId = `covert-result-${Math.floor(next.currentMonth)}-${next.timeline.length}`;
  next.timeline.push({
    id: timelineId,
    month: next.currentMonth,
    dateLabel: next.currentDate,
    title: "Covert Operation",
    decisionText: `${titleCase(operation.operationType.replace(/_/g, " "))}: ${operation.objective}`,
    effectsSummary: [`Outcome: ${outcome.replace(/_/g, " ")}`, `Exposure risk ${Math.round(operation.exposureRisk)}%`, `Blowback risk ${Math.round(operation.blowbackRisk)}%`],
    approvalBefore: before,
    approvalAfter: next.approval.overall,
    tags: ["covert_operation", "national_security", target.id],
  });
  next.lastResolution = effects;
  next.lastActionResult = buildActionResult({
    vehicle: "covert_operation",
    objective: operation.objective,
    legalBasis: `Authorization: ${operation.authorizationLevel.replace(/_/g, " ")}`,
    successFailure: outcome.replace(/_/g, " "),
    visibility: operation.exposureRisk > 65 || outcome.includes("exposure") ? "high" : operation.exposureRisk > 38 ? "medium" : "low",
    congressReaction: operation.futureConsequences.includes("congressional_hearings") ? "Congressional leaders demand briefings and hearings." : "Congressional leadership expects classified notification.",
    alliedReaction: operation.diplomaticRisk > 55 ? "Allies worry about diplomatic spillover." : "Allied reaction is contained.",
    adversaryReaction: operation.blowbackRisk > 55 ? "The target actor prepares retaliation options." : "The target actor signals suspicion but lacks public proof.",
    institutionalRisk: operation.legalRisk > 55 ? "high legal and oversight risk" : "contained oversight risk",
    futureRisks: operation.futureConsequences,
    timelineEntryId: timelineId,
  });
  return { game: recomputeGame(next), effects, reactions: operation.advisorReview.map((review) => `${review.advisor}: ${review.note}`) };
}

export function resolveMilitaryAction(game: GameState, input: MilitaryActionInput): TurnResolution {
  const next = normalizeGameState(game);
  const before = next.approval.overall;
  const target = next.foreignRelations.find((actor) => actor.id === input.targetActorId) ?? next.foreignRelations[0];
  const base = militaryActionBaseRisk[input.actionType];
  const authorizationRisk = input.congressionalAuthorization === "clear" ? -14 : input.congressionalAuthorization === "ambiguous" ? 10 : input.congressionalAuthorization === "opposed" ? 28 : 22;
  const action: MilitaryAction = {
    id: `military-${Math.floor(next.currentMonth)}-${next.nationalSecurity.activeDeployments.length}`,
    actionType: input.actionType,
    targetActorId: target.id,
    objective: input.objective,
    legalBasis: input.legalBasis,
    congressionalAuthorization: input.congressionalAuthorization,
    alliedSupport: round1(clamp(target.relationship + next.nationalSecurity.alliedSupport / 4, 0, 100)),
    escalationRisk: round1(clamp(base.escalation + target.tension / 5, 0, 100)),
    casualtyRisk: round1(clamp(base.casualty, 0, 100)),
    civilianHarmRisk: round1(clamp(base.civilian, 0, 100)),
    successChance: round1(clamp(base.success + next.nationalSecurity.militaryReadiness / 12 + target.relationship / 20 - target.militaryRisk / 8, 5, 95)),
    publicSupport: round1(clamp(base.publicSupport + next.approval.strength / 12 - authorizationRisk / 5, 0, 100)),
    warPowersRisk: round1(clamp(authorizationRisk + base.escalation / 4, 0, 100)),
    warPowersClock: input.congressionalAuthorization === "clear" ? undefined : 3,
    status: input.actionType === "withdrawal" ? "completed" : "active",
    startedMonth: Math.floor(next.currentMonth),
    advisorReview: [],
    futureConsequences: [],
  };
  action.advisorReview = buildMilitaryAdvisorReview(action);
  const outcome = militaryOutcome(next, action);
  action.outcome = outcome;
  action.futureConsequences = consequencesForMilitary(action);
  next.nationalSecurity.activeDeployments.push(action);
  next.nationalSecurity.militaryReadiness = clamp(next.nationalSecurity.militaryReadiness - Math.max(0, base.readiness), 0, 100);
  next.nationalSecurity.warPowersClock = action.warPowersClock ?? next.nationalSecurity.warPowersClock;
  if (outcome === "casualties_sustained" || outcome === "quagmire") {
    next.nationalSecurity.casualties += Math.max(1, Math.round(action.casualtyRisk / 8));
  }
  applyMilitaryOutcome(next, action, target.id);
  const effects = strategicEffects(next, {
    tags: ["military_action", "national_security", target.id],
    tone: action.publicSupport > 52 ? "moderate" : "cautious",
    ideologyScore: 12,
    assertiveness: 72,
    legalityRisk: action.warPowersRisk,
    fiscalCost: Math.max(25, base.readiness * 2),
    implementationComplexity: 68,
  }, outcome === "deterrence_success" || outcome === "target_destroyed" ? 2 : -4, -action.warPowersRisk / 16, action.publicSupport > 50 ? 1 : -4);
  applyEffects(next, effects);
  const timelineId = `military-result-${Math.floor(next.currentMonth)}-${next.timeline.length}`;
  next.timeline.push({
    id: timelineId,
    month: next.currentMonth,
    dateLabel: next.currentDate,
    title: "Military Action",
    decisionText: `${titleCase(action.actionType.replace(/_/g, " "))}: ${action.objective}`,
    effectsSummary: [`Outcome: ${outcome.replace(/_/g, " ")}`, `Escalation risk ${Math.round(action.escalationRisk)}%`, `War Powers risk ${Math.round(action.warPowersRisk)}%`],
    approvalBefore: before,
    approvalAfter: next.approval.overall,
    tags: ["military_action", "national_security", target.id],
  });
  next.lastResolution = effects;
  next.lastActionResult = buildActionResult({
    vehicle: "military_action",
    objective: action.objective,
    legalBasis: action.legalBasis,
    successFailure: outcome.replace(/_/g, " "),
    visibility: "high",
    congressReaction: action.congressionalAuthorization === "clear" ? "Congress broadly accepts the authorization basis." : "Congress warns that War Powers deadlines are now running.",
    alliedReaction: action.alliedSupport >= 55 ? "Allies provide political support." : "Allies are divided and urge restraint.",
    adversaryReaction: action.escalationRisk > 55 ? "The adversary threatens retaliation." : "The adversary reassesses its posture.",
    institutionalRisk: action.warPowersRisk > 55 ? "high War Powers and escalation risk" : "manageable institutional risk",
    futureRisks: action.futureConsequences,
    timelineEntryId: timelineId,
  });
  return { game: recomputeGame(next), effects, reactions: action.advisorReview.map((review) => `${review.advisor}: ${review.note}`) };
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

function chooseTurnType(game: GameState, monthIndex: number): TurnType {
  if (monthIndex === 22 || monthIndex === 46) return "election_month";
  const roll = hashSeed(`${game.seed}-turn-type-${monthIndex}`) % 100;
  if (game.activeCrises.length && roll < 56) return "crisis_followup";
  if (game.pendingBills.some((bill) => bill.status === "introduced" || bill.status === "on_desk") && roll < 45) return "legislative_deadline";
  const foreignPressure = average(game.foreignRelations.map((actor) => actor.tension + actor.militaryRisk), 0);
  if (foreignPressure > 105 && roll < 42) return "foreign_policy_window";
  if (roll < 36) return "major_event";
  if (roll < 52) return "minor_event";
  return "agenda_month";
}

function agendaCost(category: AgendaActionCategory, vehicle: PolicyVehicle): Partial<AgendaResources> {
  const base: Partial<AgendaResources> = {
    whiteHouseBandwidth: 8,
    politicalCapital: 6,
  };
  if (category === "legislation" || vehicle === "legislation") base.congressionalCapital = 14;
  if (vehicle === "executive_order" || vehicle === "agency_rulemaking") base.agencyCapacity = 12;
  if (vehicle === "public_campaign" || category === "communications") base.mediaAttention = 14;
  if (category === "national_security" || vehicle === "military_action" || vehicle === "covert_operation") {
    base.whiteHouseBandwidth = 12;
    base.agencyCapacity = 12;
    base.politicalCapital = 8;
  }
  if (category === "campaign_party_building") {
    base.mediaAttention = 8;
    base.politicalCapital = 12;
  }
  return base;
}

function consumeAgendaResources(game: GameState, cost: Partial<AgendaResources>) {
  for (const [key, value] of Object.entries(cost) as Array<[keyof AgendaResources, number]>) {
    game.agendaResources[key] = round1(clamp(game.agendaResources[key] - value, 0, 100));
  }
}

function recoverAgendaResources(game: GameState) {
  game.agendaResources.whiteHouseBandwidth = round1(clamp(game.agendaResources.whiteHouseBandwidth + 5, 0, 100));
  game.agendaResources.congressionalCapital = round1(clamp(game.agendaResources.congressionalCapital + (game.congress.cooperation - 45) / 12 + 4, 0, 100));
  game.agendaResources.mediaAttention = round1(clamp(game.agendaResources.mediaAttention + 6, 0, 100));
  game.agendaResources.agencyCapacity = round1(clamp(game.agendaResources.agencyCapacity + 4, 0, 100));
  game.agendaResources.politicalCapital = round1(clamp(game.agendaResources.politicalCapital + (game.approval.overall - 48) / 14 + 4, 0, 100));
}

function upsertAgendaProject(game: GameState, input: AgendaActionInput, cost: Partial<AgendaResources>): AgendaProject {
  const existing = game.agendaProjects.find((project) => project.status === "active" && project.category === input.category && project.vehicle === input.vehicle);
  const blockers = agendaBlockers(game, input.vehicle);
  if (existing) {
    existing.objective = input.objective;
    existing.blockers = blockers;
    existing.progress = round1(clamp(existing.progress + agendaProgress(game, input.vehicle, blockers.length), 0, 100));
    existing.status = existing.progress >= 100 ? "completed" : blockers.length ? "blocked" : "active";
    return existing;
  }
  const project: AgendaProject = {
    id: `agenda-project-${Math.floor(game.currentMonth)}-${game.agendaProjects.length}`,
    title: `${titleCase(input.category.replace(/_/g, " "))} Initiative`,
    category: input.category,
    vehicle: input.vehicle,
    objective: input.objective,
    progress: round1(agendaProgress(game, input.vehicle, blockers.length)),
    monthlyCost: cost,
    blockers,
    status: blockers.length ? "blocked" : "active",
    startedMonth: Math.floor(game.currentMonth),
    expectedDurationMonths: input.vehicle === "legislation" ? 5 : input.vehicle === "agency_rulemaking" ? 6 : 3,
  };
  game.agendaProjects.push(project);
  return project;
}

function agendaBlockers(game: GameState, vehicle: PolicyVehicle): string[] {
  const blockers: string[] = [];
  if (vehicle === "legislation" && game.congress.cooperation < 42) blockers.push("low congressional cooperation");
  if ((vehicle === "executive_order" || vehicle === "agency_rulemaking") && game.agendaResources.agencyCapacity < 25) blockers.push("limited agency capacity");
  if (game.agendaResources.whiteHouseBandwidth < 20) blockers.push("White House bandwidth shortage");
  if (game.scandals.some((scandal) => scandal.stage !== "resolved") && game.agendaResources.mediaAttention < 28) blockers.push("media attention consumed by scandal");
  return blockers;
}

function agendaProgress(game: GameState, vehicle: PolicyVehicle, blockerCount: number): number {
  const vehicleBase = vehicle === "legislation" ? 18 : vehicle === "agency_rulemaking" ? 16 : vehicle === "executive_order" ? 28 : vehicle === "public_campaign" ? 22 : 20;
  const resourceScore = average(Object.values(game.agendaResources), 50) / 6;
  return clamp(vehicleBase + resourceScore - blockerCount * 10, 5, 45);
}

function parseAgendaPolicy(input: AgendaActionInput): ParsedPolicy {
  const categoryScore: Record<AgendaActionCategory, number> = {
    domestic_policy: -10,
    economic_policy: 6,
    legislation: 0,
    executive_action: 8,
    judicial_legal_strategy: 18,
    foreign_policy: 4,
    national_security: 28,
    communications: 0,
    cabinet_personnel: 0,
    campaign_party_building: 0,
  };
  const vehicleRisk: Record<PolicyVehicle, number> = {
    legislation: 14,
    executive_order: 42,
    agency_rulemaking: 32,
    budget_request: 18,
    public_campaign: 10,
    diplomatic_action: 16,
    military_action: 62,
    covert_operation: 58,
    judicial_nomination: 24,
    personnel_action: 12,
  };
  return {
    tags: [input.category, input.vehicle, agendaIssue(input.category)],
    tone: input.vehicle === "public_campaign" ? "moderate" : "technocratic",
    ideologyScore: categoryScore[input.category],
    assertiveness: input.vehicle === "executive_order" || input.vehicle === "military_action" ? 70 : 42,
    legalityRisk: vehicleRisk[input.vehicle],
    fiscalCost: input.vehicle === "budget_request" || input.vehicle === "legislation" ? 48 : 24,
    implementationComplexity: input.vehicle === "agency_rulemaking" ? 62 : input.vehicle === "legislation" ? 58 : 38,
  };
}

function agendaImplementationScore(game: GameState, vehicle: PolicyVehicle, blockerCount: number): number {
  const resourceScore = average(Object.values(game.agendaResources), 50);
  const vehicleFit = vehicle === "legislation" ? game.congress.cooperation : vehicle === "agency_rulemaking" ? game.agendaResources.agencyCapacity : game.agendaResources.whiteHouseBandwidth;
  return clamp((resourceScore + vehicleFit) / 2 - blockerCount * 12, 0, 100);
}

function vehicleApprovalModifier(vehicle: PolicyVehicle): number {
  if (vehicle === "public_campaign") return 1.5;
  if (vehicle === "executive_order") return 0.5;
  if (vehicle === "legislation") return 1;
  if (vehicle === "covert_operation" || vehicle === "military_action") return -1;
  return 0;
}

function agendaEconomyDelta(economy: Economy, category: AgendaActionCategory, vehicle: PolicyVehicle): Partial<Economy> {
  if (category !== "economic_policy" && vehicle !== "budget_request") return {};
  return {
    gdpGrowth: clamp(economy.gdpGrowth + 0.12, -8, 9),
    consumerConfidence: clamp(economy.consumerConfidence + 1.5, 0, 100),
    deficit: clamp(economy.deficit + (vehicle === "budget_request" ? 0.2 : 0.05), 0, 25),
  };
}

function agendaStakeholderDeltas(game: GameState, category: AgendaActionCategory, approvalDelta: number): Record<string, number> {
  const issue = agendaIssue(category);
  return Object.fromEntries(game.stakeholders.map((stakeholder) => [stakeholder.id, round1(clamp((stakeholder.issuePriorities.includes(issue) ? 3 : 0) + approvalDelta * 0.4, -6, 6))]));
}

function agendaIssue(category: AgendaActionCategory): string {
  if (category === "economic_policy") return "economy";
  if (category === "judicial_legal_strategy") return "court";
  if (category === "foreign_policy") return "foreign";
  if (category === "national_security") return "security";
  if (category === "campaign_party_building") return "party";
  if (category === "cabinet_personnel") return "personnel";
  if (category === "communications") return "media";
  return "domestic";
}

function legalBasisForVehicle(vehicle: PolicyVehicle): string {
  if (vehicle === "legislation") return "New legislation through Congress";
  if (vehicle === "executive_order") return "Executive discretion subject to statutory limits";
  if (vehicle === "agency_rulemaking") return "Delegated agency authority";
  if (vehicle === "budget_request") return "Presidential budget proposal to Congress";
  if (vehicle === "diplomatic_action") return "Article II foreign affairs authority";
  if (vehicle === "judicial_nomination") return "Appointment power with Senate confirmation";
  if (vehicle === "personnel_action") return "Executive personnel authority";
  return "Political and administrative authority";
}

function buildCovertAdvisorReview(base: { legal: number; diplomatic: number; blowback: number; civilian: number }, authorizationLevel: string): AdvisorReview[] {
  return [
    { advisor: "CIA Director / DNI", stance: base.blowback > 55 ? "cautious" : "supportive", note: "The operation remains an abstract strategic option with uncertain intelligence confidence." },
    { advisor: "Attorney General", stance: base.legal > 55 ? "opposed" : "cautious", note: authorizationLevel === "presidential_finding" ? "A formal finding improves legal posture but does not remove oversight risk." : "Legal exposure rises without a stronger authorization record." },
    { advisor: "Secretary of State", stance: base.diplomatic > 55 ? "opposed" : "cautious", note: "Diplomatic fallout depends on exposure and allied tolerance." },
    { advisor: "Secretary of Defense", stance: base.blowback > 60 ? "cautious" : "supportive", note: "Defense planners warn about retaliation and force-protection implications." },
    { advisor: "Vice President", stance: "cautious", note: "The political upside is limited unless the result stays contained." },
    { advisor: "Congressional leadership", stance: base.legal > 50 ? "opposed" : "cautious", note: "Leadership expects notification and may investigate leaks or exposure." },
  ];
}

function buildMilitaryAdvisorReview(action: MilitaryAction): AdvisorReview[] {
  return [
    { advisor: "Secretary of Defense", stance: action.successChance > 55 ? "supportive" : "cautious", note: "Military feasibility depends on readiness, scope, and exit conditions." },
    { advisor: "Secretary of State", stance: action.alliedSupport < 45 ? "opposed" : "cautious", note: "Allied support is the main diplomatic constraint." },
    { advisor: "Chairman of the Joint Chiefs", stance: action.escalationRisk > 60 ? "opposed" : "cautious", note: "Escalation and casualty risks require clear objectives." },
    { advisor: "CIA Director / DNI", stance: "cautious", note: "Intelligence confidence should shape expectations about success." },
    { advisor: "Attorney General", stance: action.congressionalAuthorization === "clear" ? "supportive" : "cautious", note: "War Powers exposure rises without clear congressional authorization." },
    { advisor: "Vice President", stance: action.publicSupport > 50 ? "supportive" : "cautious", note: "Public support may fade if casualties or duration rise." },
    { advisor: "Congressional leadership", stance: action.congressionalAuthorization === "clear" ? "supportive" : "opposed", note: "Leadership will judge the action through authorization and oversight." },
  ];
}

function covertOutcome(game: GameState, operation: CovertOperation): CovertOutcome {
  const roll = hashSeed(`${game.seed}-${operation.id}-${operation.operationType}`) % 100;
  const succeeds = roll < operation.successChance;
  if (operation.civilianHarmRisk > 40 && roll > 82) return "civilian_harm_scandal";
  if (operation.blowbackRisk > 60 && roll > 74) return "blowback";
  if (operation.exposureRisk > 62 && roll > 68) return succeeds ? "success_with_exposure" : "failure_with_exposure";
  if (operation.legalRisk > 56 && roll > 58) return "congressional_leak";
  if (succeeds && roll < operation.successChance * 0.62) return "clean_success";
  if (succeeds) return "partial_success";
  return "failure_no_exposure";
}

function militaryOutcome(game: GameState, action: MilitaryAction): MilitaryOutcome {
  const roll = hashSeed(`${game.seed}-${action.id}-${action.actionType}`) % 100;
  if (action.actionType === "withdrawal" && roll < 65) return "negotiated_settlement";
  if (action.escalationRisk > 70 && roll > 74) return "regional_escalation";
  if (action.casualtyRisk > 55 && roll > 66) return "casualties_sustained";
  if (action.civilianHarmRisk > 55 && roll > 58) return "civilian_harm";
  if ((action.actionType === "troop_surge" || action.actionType === "full_invasion") && roll > action.successChance) return "quagmire";
  if (roll < action.successChance * 0.45) return action.actionType === "show_of_force" || action.actionType === "deploy_carrier_group" ? "deterrence_success" : "target_destroyed";
  if (roll < action.successChance) return "limited_success";
  if (action.escalationRisk > 52 && roll > 78) return "retaliation";
  return "mission_failure";
}

function consequencesForCovert(operation: CovertOperation): FutureConsequence[] {
  const consequences: FutureConsequence[] = [];
  if (operation.exposureRisk > 45 || operation.outcome?.includes("exposure")) consequences.push("leaks");
  if (operation.legalRisk > 45 || operation.outcome === "congressional_leak") consequences.push("oversight_investigations", "congressional_hearings");
  if (operation.diplomaticRisk > 52) consequences.push("diplomatic_fallout");
  if (operation.blowbackRisk > 54 || operation.outcome === "blowback") consequences.push("retaliation");
  if (operation.outcome === "civilian_harm_scandal") consequences.push("scandal_seeds");
  return [...new Set(consequences)];
}

function consequencesForMilitary(action: MilitaryAction): FutureConsequence[] {
  const consequences: FutureConsequence[] = [];
  if (action.congressionalAuthorization !== "clear") consequences.push("congressional_hearings");
  if (action.escalationRisk > 50) consequences.push("retaliation");
  if (action.alliedSupport < 45) consequences.push("diplomatic_fallout");
  if (action.casualtyRisk > 40 || action.outcome === "casualties_sustained") consequences.push("war_fatigue");
  if (action.civilianHarmRisk > 42 || action.outcome === "civilian_harm") consequences.push("scandal_seeds");
  if (action.warPowersRisk > 58) consequences.push("oversight_investigations");
  return [...new Set(consequences)];
}

function applyCovertOutcome(game: GameState, operation: CovertOperation, targetActorId: string) {
  game.foreignRelations = game.foreignRelations.map((actor) => actor.id === targetActorId ? { ...actor, tension: clamp(actor.tension + operation.blowbackRisk / 25, 0, 100), relationship: clamp(actor.relationship - operation.diplomaticRisk / 30, 0, 100) } : actor);
  if (operation.futureConsequences.includes("scandal_seeds")) {
    game.scandals.push({ id: `covert-scandal-${game.currentMonth}-${game.scandals.length}`, type: "covert operation exposure", stage: "rumor", truthLevel: operation.exposureRisk, evidenceStrength: 35, mediaIntensity: operation.exposureRisk, oppositionAggression: operation.legalRisk, partyDefense: game.approval.party, publicFatigue: 8, legalExposure: operation.legalRisk });
  }
}

function applyMilitaryOutcome(game: GameState, action: MilitaryAction, targetActorId: string) {
  game.foreignRelations = game.foreignRelations.map((actor) => actor.id === targetActorId ? { ...actor, tension: clamp(actor.tension + action.escalationRisk / 18, 0, 100), relationship: clamp(actor.relationship - action.escalationRisk / 35, 0, 100) } : actor);
  if (action.futureConsequences.includes("scandal_seeds")) {
    game.scandals.push({ id: `military-scandal-${game.currentMonth}-${game.scandals.length}`, type: "civilian harm allegation", stage: "media_story", truthLevel: action.civilianHarmRisk, evidenceStrength: 40, mediaIntensity: 64, oppositionAggression: action.warPowersRisk, partyDefense: game.approval.party, publicFatigue: 10, legalExposure: action.warPowersRisk });
  }
}

function strategicEffects(game: GameState, parsedPolicy: ParsedPolicy, approvalDelta: number, congressDelta: number, mediaToneDelta: number): TurnResolutionSummary {
  return {
    parsedPolicy,
    approvalDelta: round1(approvalDelta),
    congressDelta: round1(congressDelta),
    courtRiskDelta: round1(parsedPolicy.legalityRisk / 18),
    cabinetDelta: round1(clamp((100 - parsedPolicy.implementationComplexity) / 30 - 2, -5, 3)),
    economyDelta: {},
    stakeholderDeltas: Object.fromEntries(game.stakeholders.map((stakeholder) => [stakeholder.id, stakeholder.id === "defense" ? clamp(approvalDelta + 2, -6, 6) : clamp(approvalDelta / 2, -5, 5)])),
    personaDeltas: Object.fromEntries(game.personas.map((persona) => [persona.id, persona.topIssues.includes("allies") || persona.topIssues.includes("terrorism") ? clamp(approvalDelta + 1, -6, 6) : clamp(approvalDelta / 2, -5, 5)])),
    mediaToneDelta: round1(mediaToneDelta),
  };
}

function buildActionResult(input: {
  vehicle: PolicyVehicle;
  objective: string;
  legalBasis: string;
  successFailure: string;
  visibility: ActionResultDetails["publicVisibility"];
  congressReaction: string;
  alliedReaction: string;
  adversaryReaction: string;
  institutionalRisk: string;
  futureRisks: FutureConsequence[];
  timelineEntryId: string;
}): ActionResultDetails {
  return {
    actionVehicle: input.vehicle,
    objective: input.objective,
    legalBasis: input.legalBasis,
    successFailure: input.successFailure,
    publicVisibility: input.visibility,
    congressReaction: input.congressReaction,
    alliedReaction: input.alliedReaction,
    adversaryReaction: input.adversaryReaction,
    institutionalRisk: input.institutionalRisk,
    futureRisks: input.futureRisks,
    timelineEntryId: input.timelineEntryId,
  };
}

function advanceStrategicActions(game: GameState) {
  recoverAgendaResources(game);
  game.agendaProjects = game.agendaProjects.map((project) => {
    if (project.status === "completed" || project.status === "cancelled") return project;
    const blockers = agendaBlockers(game, project.vehicle);
    const progress = round1(clamp(project.progress + agendaProgress(game, project.vehicle, blockers.length) / 2, 0, 100));
    return { ...project, blockers, progress, status: progress >= 100 ? "completed" : blockers.length ? "blocked" : "active" };
  });
  game.nationalSecurity.covertOperations = game.nationalSecurity.covertOperations.map((operation) => operation.status !== "active" ? operation : { ...operation, durationMonths: operation.durationMonths - 1, status: operation.durationMonths <= 1 ? "completed" : "active" });
  game.nationalSecurity.activeDeployments = game.nationalSecurity.activeDeployments.map((action) => {
    if (action.status !== "active") return action;
    const warPowersClock = action.warPowersClock === undefined ? undefined : Math.max(0, action.warPowersClock - 1);
    return { ...action, warPowersClock };
  });
  const expiring = game.nationalSecurity.activeDeployments.find((action) => action.warPowersClock === 0 && !game.scandals.some((scandal) => scandal.id === `war-powers-${action.id}`));
  if (expiring) {
    game.scandals.push({ id: `war-powers-${expiring.id}`, type: "war powers confrontation", stage: "hearings", truthLevel: 70, evidenceStrength: 65, mediaIntensity: 62, oppositionAggression: 74, partyDefense: game.approval.party, publicFatigue: 18, legalExposure: expiring.warPowersRisk });
    game.congress.cooperation = clamp(game.congress.cooperation - 8, 0, 100);
    game.approval.trust = clamp(game.approval.trust - 4, 0, 100);
  }
  game.nationalSecurity.warPowersClock = game.nationalSecurity.activeDeployments.find((action) => action.warPowersClock !== undefined && action.warPowersClock > 0)?.warPowersClock ?? null;
}

function recomputeGame(game: GameState): GameState {
  game = normalizeGameState(game);
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
