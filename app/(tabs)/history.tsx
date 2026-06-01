import { View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { AppText, Card, Row, Screen, Stat, colors } from "@/components/ui";
import { computeLegacy } from "@/sim/engine";
import { useGameSnapshot } from "@/state/game-store";

export default function History() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;
  const legacy = computeLegacy(game);
  return (
    <Screen>
      <Card tone="blue">
        <AppText variant="subtitle">{legacy.title}</AppText>
        <Row>
          <Stat label="Legacy" value={legacy.total} color={colors.blue} />
          <Stat label="Decisions" value={game.timeline.length} />
          <Stat label="Ending" value={legacy.ending} />
        </Row>
      </Card>
      <AppText variant="subtitle">Report Card</AppText>
      <View style={{ gap: 10 }}>
        {legacy.categories.map((category) => (
          <Card key={category.name}>
            <Row>
              <Stat label={category.name} value={category.score} color={category.score >= 60 ? colors.green : colors.red} />
            </Row>
          </Card>
        ))}
      </View>
      <AppText variant="subtitle">Timeline</AppText>
      <View style={{ gap: 10 }}>
        {[...game.timeline].reverse().map((entry) => (
          <Card key={entry.id}>
            <AppText variant="label">{entry.dateLabel}</AppText>
            <AppText variant="subtitle">{entry.title}</AppText>
            <AppText color={colors.muted}>{entry.decisionText}</AppText>
            {entry.effectsSummary.map((effect) => (
              <AppText key={effect}>{effect}</AppText>
            ))}
          </Card>
        ))}
      </View>
    </Screen>
  );
}
