import { describe, expect, it } from "vitest";

import {
  advanceTurn,
  computeLegacy,
  createNewGame,
  resolveBillAction,
  resolveElection,
  resolveResponse,
} from "@/sim/engine";

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
