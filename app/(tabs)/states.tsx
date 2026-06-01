import { View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { AppText, Card, Row, Screen, Stat, colors } from "@/components/ui";
import { useGameSnapshot } from "@/state/game-store";

export default function States() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;
  const playerEv = game.states.filter((state) => state.approval >= 50).reduce((sum, state) => sum + state.electoralVotes, 0);
  const battlegrounds = [...game.states].sort((a, b) => Math.abs(a.approval - 50) - Math.abs(b.approval - 50)).slice(0, 8);
  return (
    <Screen>
      <Card tone="blue">
        <AppText variant="subtitle">Election Forecast</AppText>
        <Row>
          <Stat label="Projected EV" value={playerEv} color={playerEv >= 270 ? colors.blue : colors.red} />
          <Stat label="States above 50" value={game.states.filter((state) => state.approval >= 50).length} />
        </Row>
      </Card>
      <AppText variant="subtitle">Battlegrounds</AppText>
      <View style={{ gap: 10 }}>
        {battlegrounds.map((state) => (
          <Card key={state.abbreviation}>
            <Row>
              <Stat label={state.name} value={`${Math.round(state.approval)}%`} color={state.approval >= 50 ? colors.blue : colors.red} />
              <Stat label="EV" value={state.electoralVotes} />
              <Stat label="Lean" value={state.partisanLean} />
            </Row>
            <AppText color={colors.muted}>{state.demographicProfile.join(", ")} - governor: {state.governorParty}</AppText>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
