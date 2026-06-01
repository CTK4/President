import type { GameState } from "@/sim/types";

const SAVE_KEY = "president-simulator-active-game";

export async function saveGame(game: GameState): Promise<void> {
  localStorage.setItem(SAVE_KEY, JSON.stringify(game));
}

export async function loadGame(): Promise<GameState | null> {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as GameState;
  if (parsed.schemaVersion !== 1) return null;
  return parsed;
}

export async function clearSave(): Promise<void> {
  localStorage.removeItem(SAVE_KEY);
}
