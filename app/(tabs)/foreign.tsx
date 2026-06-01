import { View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { AppText, Card, Meter, Row, Screen, Stat, colors } from "@/components/ui";
import { useGameSnapshot } from "@/state/game-store";

export default function Foreign() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;
  return (
    <Screen>
      <Card tone="red">
        <AppText variant="subtitle">Crises and Deployments</AppText>
        <Row>
          <Stat label="Active crises" value={game.activeCrises.length} color={colors.red} />
          <Stat label="War mode" value={game.settings.warMode ? "On" : "Off"} />
        </Row>
      </Card>
      <View style={{ gap: 10 }}>
        {game.foreignRelations.map((actor) => (
          <Card key={actor.id}>
            <AppText variant="subtitle">{actor.name}</AppText>
            <Meter label="Relationship" value={actor.relationship} color={colors.blue} />
            <Meter label="Tension" value={actor.tension} color={colors.red} />
            <Meter label="Military risk" value={actor.militaryRisk} color={colors.gold} />
          </Card>
        ))}
      </View>
    </Screen>
  );
}
