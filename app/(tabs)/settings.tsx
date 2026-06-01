import { router } from "expo-router";

import { EmptyState } from "@/components/empty-state";
import { AppText, Button, Card, Row, Screen, Stat, colors } from "@/components/ui";
import { resetGame, useGameSnapshot } from "@/state/game-store";

export default function Settings() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;
  async function reset() {
    await resetGame();
    router.replace("/");
  }
  return (
    <Screen>
      <Card>
        <AppText variant="subtitle">Save and Settings</AppText>
        <AppText color={colors.muted}>The active game is stored locally with SQLite and schema version {game.schemaVersion}.</AppText>
        <Row>
          <Stat label="Economic sim" value={game.settings.economicSimulation ? "On" : "Off"} />
          <Stat label="Checks" value={game.settings.checksAndBalances ? "On" : "Off"} />
          <Stat label="Persona" value={game.settings.personaMode} />
          <Stat label="Pacing" value={game.settings.pacing} />
        </Row>
      </Card>
      <Card tone="red">
        <AppText variant="subtitle">Reset Presidency</AppText>
        <AppText color={colors.muted}>This clears the local SQLite save for the current career.</AppText>
        <Button label="Clear Save" tone="red" onPress={() => void reset()} />
      </Card>
    </Screen>
  );
}
