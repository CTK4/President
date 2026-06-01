import { View } from "react-native";

import { BillList, CongressPanel } from "@/components/game-panels";
import { EmptyState } from "@/components/empty-state";
import { AppText, Button, Card, Screen, colors } from "@/components/ui";
import { resolveBillAction, useGameSnapshot } from "@/state/game-store";

export default function Congress() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;
  return (
    <Screen>
      <CongressPanel game={game} />
      <AppText variant="subtitle">Bills on Desk</AppText>
      <View style={{ gap: 10 }}>
        {game.pendingBills.map((bill) => (
          <Card key={bill.id}>
            <AppText variant="subtitle">{bill.title}</AppText>
            <AppText color={colors.muted}>{bill.status} - public support {Math.round(bill.publicSupport)}%</AppText>
            <Button label="Negotiate" tone="blue" onPress={() => void resolveBillAction(bill.id, "negotiate")} />
            <Button label="Sign" tone="red" onPress={() => void resolveBillAction(bill.id, "sign")} disabled={bill.status === "signed"} />
          </Card>
        ))}
      </View>
      <BillList bills={game.pendingBills} />
    </Screen>
  );
}
