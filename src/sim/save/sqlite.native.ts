import * as SQLite from "expo-sqlite";

import type { GameState } from "@/sim/types";
import { normalizeGameState } from "@/sim/engine";

const DB_NAME = "president-simulator.db";
const SAVE_KEY = "active-game";

async function getDb() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync("CREATE TABLE IF NOT EXISTS saves (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL, updatedAt TEXT NOT NULL);");
  return db;
}

export async function saveGame(game: GameState): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO saves (key, value, updatedAt) VALUES (?, ?, ?)",
    SAVE_KEY,
    JSON.stringify(game),
    new Date().toISOString(),
  );
}

export async function loadGame(): Promise<GameState | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM saves WHERE key = ?", SAVE_KEY);
  if (!row?.value) return null;
  const parsed = JSON.parse(row.value) as GameState;
  if (parsed.schemaVersion !== 1 && parsed.schemaVersion !== 2) return null;
  return normalizeGameState(parsed);
}

export async function clearSave(): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM saves WHERE key = ?", SAVE_KEY);
}
