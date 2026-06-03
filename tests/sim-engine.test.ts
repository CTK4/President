import { describe, expect, it } from "vitest";

import {
  advanceTurn,
  appointJustice,
  computeLegacy,
  createNewGame,
  normalizeGameState,
  resolveAgendaAction,
  resolveBillAction,
  resolveCovertOperation,
  resolveElection,
  resolveMilitaryAction,
  resolveResponse,
} from "@/sim/engine";
import { events } from "@/sim/data";

describe("president simulator engine", () => {
  it("creates a deterministic full-spec game state from the same seed", () => {
    const first = createNewGame({
      seed: "fixed-seed",
      scenarioId: "modern",
      presidentName: "Morgan Reyes",
      partyId: "democrat",
      background: "Governor",
    });
    const second = createNewGame({
      seed: "fixed-seed",
      scenarioId: "modern",
      presidentName: "Morgan Reyes",
      partyId: "democrat",
      background: "Governor",
    });

    expect(first.schedule).toEqual(second.schedule);
    expect(first.currentEvent.title).toBe(second.currentEvent.title);
    expect(first.supremeCourt.justices).toHaveLength(9);
    expect(first.cabinet.length).toBeGreaterThan(8);
    expect(first.foreignRelations.length).toBeGreaterThan(4);
    expect(first.schemaVersion).toBe(2);
    expect(first.currentTurnType).toBe("major_event");
    expect(first.agendaResources.whiteHouseBandwidth).toBeGreaterThan(0);
    expect(first.agendaProjects).toEqual([]);
    expect(first.nationalSecurity.threatMatrix.length).toBe(first.foreignRelations.length);
  });

  it("resolves a response across approval, institutions, media, economy, and timeline", () => {
    const game = createNewGame({
      seed: "turn-seed",
      scenarioId: "challenge-crash",
      presidentName: "Alex Taylor",
      partyId: "republican",
      background: "Business Leader",
    });

    const resolution = resolveResponse(game, {
      kind: "suggested",
      optionId: game.currentEvent.responseOptions[1].id,
    });

    expect(resolution.game.timeline).toHaveLength(1);
    expect(resolution.game.media.headlines.center.length).toBeGreaterThan(10);
    expect(resolution.game.pendingBills.length + resolution.game.pendingCases.length).toBeGreaterThan(0);
    expect(resolution.effects.approvalDelta).not.toBe(0);
  });

  it("generates distinct persona reactions for the same resolved response", () => {
    const game = createNewGame({
      seed: "reaction-seed",
      scenarioId: "modern",
      presidentName: "Alex Taylor",
      partyId: "democrat",
      background: "Governor",
    });
    const aiEvent = events.find((event) => event.id === "ai-regulation");
    expect(aiEvent).toBeDefined();
    game.currentEvent = aiEvent!;

    const resolution = resolveResponse(game, {
      kind: "suggested",
      optionId: game.currentEvent.responseOptions[2].id,
    });
    const reactionBodies = resolution.reactions.map((reaction) => reaction.replace(/^[^ ]+ [^ ]+ says /, ""));

    expect(new Set(reactionBodies).size).toBeGreaterThan(1);
  });

  it("keeps Supreme Court vacancies out of the monthly event schedule", () => {
    const game = createNewGame({
      seed: "vacancy-schedule-seed",
      scenarioId: "modern",
      presidentName: "Alex Taylor",
      partyId: "democrat",
      background: "Governor",
    });

    expect(game.schedule).not.toContain("court-vacancy");
  });

  it("fills a Supreme Court vacancy through appointment instead of event response", () => {
    const game = createNewGame({
      seed: "legacy-vacancy-seed",
      scenarioId: "modern",
      presidentName: "Alex Taylor",
      partyId: "democrat",
      background: "Governor",
    });
    const vacancyEvent = events.find((event) => event.id === "court-vacancy");
    expect(vacancyEvent).toBeDefined();
    game.currentEvent = vacancyEvent!;

    const appointed = appointJustice(game, "legacy-vacancy", "consensus");

    expect(appointed.currentEvent.id).not.toBe("court-vacancy");
    expect(appointed.pendingCourtVacancies).toEqual([]);
    expect(appointed.supremeCourt.justices).toHaveLength(9);
    expect(appointed.timeline.at(-1)?.title).toBe("Supreme Court Appointment");
  });

  it("routes extrajudicial lethal-force policies into a constitutional crisis", () => {
    const game = createNewGame({
      seed: "illegal-order-seed",
      scenarioId: "modern",
      presidentName: "Alex Taylor",
      partyId: "republican",
      background: "Governor",
    });

    const resolution = resolveResponse(game, {
      kind: "custom",
      text: "Implement shoot-on-sight at the U.S.-Mexico border.",
    });

    expect(resolution.effects.approvalDelta).toBeLessThanOrEqual(-18);
    expect(resolution.effects.congressDelta).toBeLessThan(0);
    expect(resolution.effects.courtRiskDelta).toBeGreaterThanOrEqual(10);
    expect(resolution.game.pendingBills).toHaveLength(0);
    expect(resolution.game.pendingCases).toHaveLength(1);
    expect(resolution.game.activeCrises.some((crisis) => crisis.type === "constitutional crisis")).toBe(true);
    expect(resolution.game.scandals.some((scandal) => scandal.type === "unlawful order allegation")).toBe(true);
    expect(resolution.game.timeline.at(-1)?.title).toBe("Constitutional Crisis");
  });

  it("advances through elections and legacy endings deterministically", () => {
    let game = createNewGame({
      seed: "election-seed",
      scenarioId: "sixties",
      presidentName: "Jordan Lee",
      partyId: "independent",
      background: "Senator",
    });

    for (let i = 0; i < 22; i += 1) {
      game = advanceTurn(game).game;
    }

    const midterm = resolveElection(game, "midterm");
    expect(midterm.houseSeats).toBeGreaterThan(100);
    expect(
      midterm.game.congress.house.seats.democrat +
        midterm.game.congress.house.seats.republican +
        midterm.game.congress.house.seats.independent,
    ).toBe(435);

    const legacy = computeLegacy(midterm.game);
    expect(legacy.categories).toContainEqual(expect.objectContaining({ name: "Institutional Stability" }));
  });

  it("updates bills through desk actions without randomness", () => {
    const game = createNewGame({
      seed: "bill-seed",
      scenarioId: "modern",
      presidentName: "Casey Nguyen",
      partyId: "democrat",
      background: "Vice President",
    });
    const resolved = resolveResponse(game, {
      kind: "suggested",
      optionId: game.currentEvent.responseOptions[0].id,
    }).game;
    const bill = resolved.pendingBills[0];

    const after = resolveBillAction(resolved, bill.id, "sign");
    expect(after.pendingBills.find((item) => item.id === bill.id)?.status).toBe("signed");
  });

  it("advances through mixed turn types including agenda months", () => {
    let game = createNewGame({
      seed: "agenda-turn-seed",
      scenarioId: "modern",
      presidentName: "Alex Taylor",
      partyId: "democrat",
      background: "Governor",
    });
    const turnTypes = new Set<string>();

    for (let i = 0; i < 18; i += 1) {
      game = advanceTurn(game).game;
      turnTypes.add(game.currentTurnType);
    }

    expect(turnTypes.has("agenda_month")).toBe(true);
    expect([...turnTypes].some((type) => type !== "agenda_month")).toBe(true);
    if (game.currentTurnType === "agenda_month") {
      expect(game.currentEvent.description).toBe("No major crisis this month. The administration has room to advance its own agenda.");
    }
  });

  it("resolves agenda actions into resources, projects, and vehicle-aware consequences", () => {
    const game = createNewGame({
      seed: "agenda-action-seed",
      scenarioId: "modern",
      presidentName: "Alex Taylor",
      partyId: "democrat",
      background: "Governor",
    });

    const legislation = resolveAgendaAction(game, {
      category: "legislation",
      vehicle: "legislation",
      objective: "Pass a targeted child care affordability bill.",
    }).game;

    expect(legislation.agendaProjects).toHaveLength(1);
    expect(legislation.agendaResources.congressionalCapital).toBeLessThan(game.agendaResources.congressionalCapital);
    expect(legislation.pendingBills.length).toBeGreaterThan(0);
    expect(legislation.lastActionResult?.actionVehicle).toBe("legislation");

    const executive = resolveAgendaAction(legislation, {
      category: "executive_action",
      vehicle: "executive_order",
      objective: "Direct agencies to prioritize faster benefit processing.",
    }).game;

    expect(executive.lastActionResult?.legalBasis).toContain("Executive discretion");
    expect(executive.pendingCases.length).toBeGreaterThanOrEqual(legislation.pendingCases.length);
  });

  it("resolves covert operations as abstract risk-based strategic actions", () => {
    const game = createNewGame({
      seed: "covert-seed",
      scenarioId: "modern",
      presidentName: "Alex Taylor",
      partyId: "democrat",
      background: "Governor",
    });

    const resolution = resolveCovertOperation(game, {
      operationType: "cyber_disruption",
      targetActorId: game.foreignRelations[0].id,
      objective: "Disrupt hostile strategic capacity without public escalation.",
      authorizationLevel: "nsc_review",
      durationMonths: 2,
    });
    const operation = resolution.game.nationalSecurity.covertOperations[0];

    expect(operation.operationType).toBe("cyber_disruption");
    expect(operation.objective).toContain("strategic");
    expect(operation.advisorReview.map((review) => review.advisor)).toContain("Attorney General");
    expect(operation.outcome).toBeDefined();
    expect(operation.futureConsequences.length).toBeGreaterThan(0);
    expect(JSON.stringify(operation)).not.toMatch(/coordinates|explosive recipe|entry route|weapon assembly/i);
    expect(resolution.game.lastActionResult?.actionVehicle).toBe("covert_operation");
    expect(resolution.game.timeline.at(-1)?.title).toBe("Covert Operation");
  });

  it("resolves military actions with assessment, deployments, and War Powers clock", () => {
    const game = createNewGame({
      seed: "military-seed",
      scenarioId: "modern",
      presidentName: "Alex Taylor",
      partyId: "republican",
      background: "Governor",
    });

    const resolution = resolveMilitaryAction(game, {
      actionType: "deploy_carrier_group",
      targetActorId: game.foreignRelations[0].id,
      objective: "Deter regional escalation and reassure allies.",
      legalBasis: "Article II national security authority with contested War Powers posture",
      congressionalAuthorization: "none",
    });
    const action = resolution.game.nationalSecurity.activeDeployments[0];

    expect(action.legalBasis).toContain("Article II");
    expect(action.congressionalAuthorization).toBe("none");
    expect(action.alliedSupport).toBeGreaterThanOrEqual(0);
    expect(action.escalationRisk).toBeGreaterThan(0);
    expect(action.warPowersClock).toBe(3);
    expect(resolution.game.nationalSecurity.warPowersClock).toBe(3);
    expect(action.advisorReview.map((review) => review.advisor)).toContain("Chairman of the Joint Chiefs");
    expect(resolution.game.lastActionResult?.futureRisks).toContain("congressional_hearings");
  });

  it("decrements War Powers clock and creates backlash when it expires", () => {
    let game = createNewGame({
      seed: "war-powers-seed",
      scenarioId: "modern",
      presidentName: "Alex Taylor",
      partyId: "republican",
      background: "Governor",
    });
    game = resolveMilitaryAction(game, {
      actionType: "counterterror_campaign",
      targetActorId: game.foreignRelations[0].id,
      objective: "Sustain pressure on an abstract terrorist threat.",
      legalBasis: "Article II authority without clear congressional authorization",
      congressionalAuthorization: "none",
    }).game;

    game = advanceTurn(game).game;
    game = advanceTurn(game).game;
    game = advanceTurn(game).game;

    expect(game.scandals.some((scandal) => scandal.type === "war powers confrontation")).toBe(true);
    expect(game.nationalSecurity.warPowersClock).toBeNull();
  });

  it("normalizes v1 saves with agenda and national security defaults", () => {
    const game = createNewGame({
      seed: "migration-seed",
      scenarioId: "modern",
      presidentName: "Alex Taylor",
      partyId: "democrat",
      background: "Governor",
    });
    const legacy = structuredClone(game) as any;
    legacy.schemaVersion = 1;
    delete legacy.currentTurnType;
    delete legacy.agendaResources;
    delete legacy.agendaProjects;
    delete legacy.nationalSecurity;

    const migrated = normalizeGameState(legacy);

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.currentTurnType).toBe("major_event");
    expect(migrated.agendaResources.politicalCapital).toBeGreaterThan(0);
    expect(migrated.agendaProjects).toEqual([]);
    expect(migrated.nationalSecurity.threatMatrix).toHaveLength(migrated.foreignRelations.length);
  });
});
