import * as React from "react";

import {
  advanceTurn as engineAdvanceTurn,
  appointJustice as engineAppointJustice,
  createNewGame,
  resolveBillAction as engineResolveBillAction,
  resolveElection as engineResolveElection,
  resolveResponse as engineResolveResponse,
} from "@/sim/engine";
import { clearSave, loadGame, saveGame } from "@/sim/save/sqlite";
import type { BillAction, CourtNominationStrategy, ElectionType, GameState, NewGameConfig, PlayerResponse, TurnResolution } from "@/sim/types";

type Snapshot = {
  game: GameState | null;
  loading: boolean;
  lastResolution: TurnResolution | null;
};

let snapshot: Snapshot = {
  game: null,
  loading: true,
  lastResolution: null,
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function setSnapshot(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next };
  emit();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return snapshot;
}

export function useGameSnapshot() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export async function hydrateGame() {
  const game = await loadGame();
  setSnapshot({ game, loading: false, lastResolution: null });
}

export async function startGame(config: NewGameConfig) {
  const game = createNewGame(config);
  await saveGame(game);
  setSnapshot({ game, loading: false, lastResolution: null });
}

export async function submitResponse(response: PlayerResponse) {
  if (!snapshot.game) return null;
  const resolution = engineResolveResponse(snapshot.game, response);
  await saveGame(resolution.game);
  setSnapshot({ game: resolution.game, lastResolution: resolution });
  return resolution;
}

export async function advanceTurn() {
  if (!snapshot.game) return null;
  const resolution = engineAdvanceTurn(snapshot.game);
  await saveGame(resolution.game);
  setSnapshot({ game: resolution.game, lastResolution: resolution });
  return resolution;
}

export async function resolveBillAction(billId: string, action: BillAction) {
  if (!snapshot.game) return;
  const game = engineResolveBillAction(snapshot.game, billId, action);
  await saveGame(game);
  setSnapshot({ game });
}

export async function resolveElection(type: ElectionType) {
  if (!snapshot.game) return null;
  const result = engineResolveElection(snapshot.game, type);
  await saveGame(result.game);
  setSnapshot({ game: result.game });
  return result;
}

export async function appointJustice(vacancyId: string, strategy: CourtNominationStrategy) {
  if (!snapshot.game) return;
  const game = engineAppointJustice(snapshot.game, vacancyId, strategy);
  await saveGame(game);
  setSnapshot({ game });
}

export async function resetGame() {
  await clearSave();
  setSnapshot({ game: null, lastResolution: null, loading: false });
}
