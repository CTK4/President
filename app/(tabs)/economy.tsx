import { EconomyPanel } from "@/components/game-panels";
import { EmptyState } from "@/components/empty-state";
import { AppText, Card, Row, Screen, Stat } from "@/components/ui";
import { useGameSnapshot } from "@/state/game-store";

export default function Economy() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;
  return (
    <Screen>
      <EconomyPanel game={game} />
      <Card>
        <AppText variant="subtitle">Economic Indicators</AppText>
        <Row>
          <Stat label="Rates" value={`${game.economy.interestRates.toFixed(1)}%`} />
          <Stat label="Deficit" value={`${game.economy.deficit.toFixed(1)}%`} />
          <Stat label="Confidence" value={Math.round(game.economy.consumerConfidence)} />
          <Stat label="Market" value={Math.round(game.economy.stockMarket)} />
          <Stat label="Wages" value={`${game.economy.wageGrowth.toFixed(1)}%`} />
          <Stat label="Housing" value={Math.round(game.economy.housingAffordability)} />
          <Stat label="Gas" value={`$${game.economy.gasPrices.toFixed(2)}`} />
          <Stat label="Poverty" value={`${game.economy.poverty.toFixed(1)}%`} />
        </Row>
      </Card>
      <Card>
        <AppText variant="subtitle">Lagged Effects</AppText>
        <AppText>Immediate decision effects move approval and confidence first. Monthly drift then pulls inflation, unemployment, and GDP toward fundamentals while crises and signed bills continue to shape legacy categories.</AppText>
      </Card>
    </Screen>
  );
}
