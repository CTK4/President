import { Link } from "expo-router";

import { ApprovalPanel, CongressPanel, CourtPanel, CurrentEventPanel, EconomyPanel } from "@/components/game-panels";
import { EmptyState } from "@/components/empty-state";
import { AppText, Button, Card, Row, Screen, Stat, colors } from "@/components/ui";
import { resolveElection, useGameSnapshot } from "@/state/game-store";

export default function Dashboard() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;

  return (
    <Screen>
      <Card tone="blue">
        <AppText variant="title">{game.president.name}</AppText>
        <AppText color={colors.muted}>{game.president.party.toUpperCase()} - {game.president.background} - Month {Math.floor(game.currentMonth) + 1} / 48</AppText>
        <Row>
          <Stat label="Status" value={game.status} />
          <Stat label="VP" value={game.vicePresident.name.split(" ")[0]} />
        </Row>
      </Card>
      {(game.status === "midterm" || game.status === "reelection") ? (
        <Card tone="red">
          <AppText variant="subtitle">{game.status === "midterm" ? "Midterm Election" : "Reelection Night"}</AppText>
          <AppText color={colors.muted}>Resolve the election to continue the presidency timeline.</AppText>
          <Button label="Resolve Election" tone="red" onPress={() => void resolveElection(game.status === "midterm" ? "midterm" : "presidential")} />
        </Card>
      ) : null}
      <CurrentEventPanel game={game} />
      <ApprovalPanel game={game} />
      <EconomyPanel game={game} />
      <CongressPanel game={game} />
      <CourtPanel game={game} />
      <Card>
        <AppText variant="label">Next action</AppText>
        <Link href="/(tabs)/events" asChild>
          <Button label="Enter Situation Room" tone="red" onPress={() => {}} />
        </Link>
      </Card>
    </Screen>
  );
}
