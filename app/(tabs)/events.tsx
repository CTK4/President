import * as Haptics from "expo-haptics";
import * as React from "react";
import { View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { AppText, Button, Card, Field, Row, Screen, Stat, colors } from "@/components/ui";
import { advanceTurn, submitResponse, useGameSnapshot } from "@/state/game-store";

export default function Events() {
  const { game, lastResolution } = useGameSnapshot();
  const [custom, setCustom] = React.useState("");
  if (!game) return <EmptyState />;
  const hasActed = game.timeline[game.timeline.length - 1]?.month === game.currentMonth;

  async function choose(optionId: string) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await submitResponse({ kind: "suggested", optionId });
  }

  async function submitCustom() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await submitResponse({ kind: "custom", text: custom });
    setCustom("");
  }

  return (
    <Screen>
      <Card tone="red">
        <AppText variant="label">{game.currentDate}</AppText>
        <AppText variant="title">{game.currentEvent.title}</AppText>
        <AppText color={colors.muted}>{game.currentEvent.description}</AppText>
        <Row>
          <Stat label="Severity" value={game.currentEvent.severity} color={colors.red} />
          <Stat label="Urgency" value={game.currentEvent.urgency} color={colors.gold} />
        </Row>
      </Card>
      {!hasActed ? (
        <>
          <View style={{ gap: 10 }}>
            {game.currentEvent.responseOptions.map((option) => (
              <Card key={option.id}>
                <AppText variant="subtitle">{option.title}</AppText>
                <AppText color={colors.muted}>{option.text}</AppText>
                <Button label="Choose Response" tone={option.style === "bold" ? "red" : option.style === "institutional" ? "blue" : "ink"} onPress={() => void choose(option.id)} />
              </Card>
            ))}
          </View>
          <Card>
            <Field label="Custom response" value={custom} onChangeText={setCustom} multiline placeholder="Write a policy response with concrete action, tradeoffs, and implementation method." />
            <Button label="Deliver Custom Response" tone="red" disabled={custom.trim().length < 8} onPress={() => void submitCustom()} />
          </Card>
        </>
      ) : (
        <Card tone="green">
          <AppText variant="subtitle">Response Resolved</AppText>
          {lastResolution ? (
            <>
              <Row>
                <Stat label="Approval" value={`${lastResolution.effects.approvalDelta >= 0 ? "+" : ""}${lastResolution.effects.approvalDelta}`} />
                <Stat label="Congress" value={`${lastResolution.effects.congressDelta >= 0 ? "+" : ""}${lastResolution.effects.congressDelta}`} />
                <Stat label="Court Risk" value={`${lastResolution.effects.courtRiskDelta >= 0 ? "+" : ""}${lastResolution.effects.courtRiskDelta}`} />
              </Row>
              {lastResolution.reactions.map((reaction) => (
                <AppText key={reaction} color={colors.muted}>{reaction}</AppText>
              ))}
            </>
          ) : (
            <AppText color={colors.muted}>Decision recorded in the timeline.</AppText>
          )}
          <Button label="Advance to Next Month" tone="blue" onPress={() => void advanceTurn()} />
        </Card>
      )}
    </Screen>
  );
}
