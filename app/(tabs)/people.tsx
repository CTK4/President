import { View } from "react-native";

import { CabinetList } from "@/components/game-panels";
import { EmptyState } from "@/components/empty-state";
import { AppText, Card, Meter, Row, Screen, Stat, colors } from "@/components/ui";
import { useGameSnapshot } from "@/state/game-store";

export default function People() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;
  return (
    <Screen>
      <Card tone="blue">
        <AppText variant="subtitle">Vice President {game.vicePresident.name}</AppText>
        <AppText color={colors.muted}>{game.vicePresident.biography}</AppText>
        <Row>
          <Stat label="Portfolio" value={game.vicePresident.portfolio ?? "None"} />
          <Stat label="Approval" value={`${game.vicePresident.approval}%`} />
        </Row>
        <Meter label="Loyalty" value={game.vicePresident.loyalty} color={colors.green} />
        <Meter label="Ambition" value={game.vicePresident.ambition} color={colors.gold} />
      </Card>
      <AppText variant="subtitle">Cabinet</AppText>
      <CabinetList cabinet={game.cabinet} />
      <AppText variant="subtitle">Institutional Officials</AppText>
      <View style={{ gap: 10 }}>
        {game.institutionalOfficials.map((official) => (
          <Card key={official.id}>
            <AppText variant="subtitle">{official.office}</AppText>
            <AppText color={colors.muted}>{official.name}</AppText>
            <Meter label="Competence" value={official.competence} color={colors.blue} />
            <Meter label="Independence" value={official.independence} color={colors.red} />
          </Card>
        ))}
      </View>
    </Screen>
  );
}
