import { describe, expect, it } from "vitest";

import {
  advanceTurn,
  appointJustice,
  computeLegacy,
  createNewGame,
  resolveBillAction,
  resolveElection,
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
});
