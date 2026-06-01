import { View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { AppText, Card, Meter, Screen, colors } from "@/components/ui";
import { useGameSnapshot } from "@/state/game-store";

export default function Media() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;
  return (
    <Screen>
      <Card>
        <AppText variant="subtitle">Narrative</AppText>
        <AppText color={colors.muted}>{game.media.narrative}</AppText>
        <Meter label="Tone" value={Math.max(0, game.media.tone + 50)} color={game.media.tone >= 0 ? colors.blue : colors.red} />
      </Card>
      <View style={{ gap: 10 }}>
        <Card>
          <AppText variant="label">Left</AppText>
          <AppText>{game.media.headlines.left}</AppText>
        </Card>
        <Card>
          <AppText variant="label">Center</AppText>
          <AppText>{game.media.headlines.center}</AppText>
        </Card>
        <Card>
          <AppText variant="label">Right</AppText>
          <AppText>{game.media.headlines.right}</AppText>
        </Card>
        <Card>
          <AppText variant="label">Social</AppText>
          <AppText>{game.media.headlines.social}</AppText>
        </Card>
      </View>
    </Screen>
  );
}
