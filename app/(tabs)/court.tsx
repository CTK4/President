import { View } from "react-native";

import { CaseList, CourtPanel } from "@/components/game-panels";
import { EmptyState } from "@/components/empty-state";
import { AppText, Card, Meter, Screen, colors } from "@/components/ui";
import { useGameSnapshot } from "@/state/game-store";

export default function Court() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;
  return (
    <Screen>
      <CourtPanel game={game} />
      <AppText variant="subtitle">Justices</AppText>
      <View style={{ gap: 10 }}>
        {game.supremeCourt.justices.map((justice) => (
          <Card key={justice.id}>
            <AppText variant="subtitle">{justice.name}{justice.chief ? " - Chief Justice" : ""}</AppText>
            <AppText color={colors.muted}>{justice.judicialPhilosophy.replace(/_/g, " ")} - age {justice.age}</AppText>
            <Meter label="Ideology intensity" value={Math.abs(justice.ideology)} color={justice.ideology > 0 ? colors.red : colors.blue} />
            <Meter label="Health" value={justice.health} color={colors.green} />
          </Card>
        ))}
      </View>
      <AppText variant="subtitle">Pending Cases</AppText>
      <CaseList cases={game.pendingCases} />
    </Screen>
  );
}
