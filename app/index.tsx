import { Link } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { AppText, Button, Card, Screen, colors } from "@/components/ui";
import { resetGame, useGameSnapshot } from "@/state/game-store";

export default function Home() {
  const { game, loading } = useGameSnapshot();

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card tone="blue">
        <AppText variant="title">President Simulator</AppText>
        <AppText color={colors.muted}>
          A deterministic fantasy presidency career game about governing through elections, crises, Congress, courts, media, and legacy.
        </AppText>
      </Card>
      {game ? (
        <Card>
          <AppText variant="subtitle">Continue as {game.president.name}</AppText>
          <AppText color={colors.muted}>{game.currentDate} - {Math.round(game.approval.overall)}% approval</AppText>
          <View style={{ gap: 10 }}>
            <Link href="/(tabs)/dashboard" asChild>
              <Button label="Continue in Office" onPress={() => {}} tone="blue" />
            </Link>
            <Button label="Clear Save" onPress={() => void resetGame()} tone="ghost" />
          </View>
        </Card>
      ) : (
        <Link href="/setup" asChild>
          <Button label="Start a New Presidency" onPress={() => {}} tone="red" />
        </Link>
      )}
    </Screen>
  );
}
