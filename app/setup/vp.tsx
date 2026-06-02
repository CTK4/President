import { router, useLocalSearchParams } from "expo-router";
import * as React from "react";

import { AppText, Button, Card, Meter, OptionGrid, Screen, colors } from "@/components/ui";
import { vpOptions } from "@/sim/data";
import type { PartyId } from "@/sim/types";
import { startGame } from "@/state/game-store";

const portfolios = [
  {
    id: "Congressional relations",
    title: "Congressional relations",
    description: "Effect: boosts bill negotiation, committee relationships, and Senate deal-making when your agenda needs votes.",
  },
  {
    id: "Economic recovery",
    title: "Economic recovery",
    description: "Effect: improves jobs, inflation, business confidence, and budget messaging during weak economic turns.",
  },
  {
    id: "Foreign policy",
    title: "Foreign policy",
    description: "Effect: strengthens alliance management, crisis diplomacy, tradeoffs with rivals, and global credibility.",
  },
  {
    id: "Healthcare",
    title: "Healthcare",
    description: "Effect: helps healthcare bills, public-health trust, hospital groups, seniors, and cost-of-living approval.",
  },
  {
    id: "Border security",
    title: "Border security",
    description: "Effect: improves border crisis response, security-hawk approval, and immigration negotiations with Congress.",
  },
  {
    id: "Technology / AI",
    title: "Technology / AI",
    description: "Effect: improves tech-sector trust, innovation policy, AI regulation, cybersecurity, and future-economy events.",
  },
  {
    id: "Pandemic response",
    title: "Pandemic response",
    description: "Effect: boosts emergency coordination, public-health credibility, supply chains, and science communication.",
  },
  {
    id: "Labor relations",
    title: "Labor relations",
    description: "Effect: improves union approval, strike mediation, wage policy, working-class turnout, and industrial disputes.",
  },
];

export default function VicePresidentSetup() {
  const params = useLocalSearchParams<{
    name: string;
    scenarioId: string;
    partyId: PartyId;
    background: string;
    mandateStrength: string;
    communicationStyle: string;
    ideology: string;
  }>();
  const [vicePresidentId, setVicePresidentId] = React.useState(vpOptions[0].id);
  const [portfolio, setPortfolio] = React.useState(portfolios[0].id);
  const selected = vpOptions.find((vp) => vp.id === vicePresidentId) ?? vpOptions[0];

  async function begin() {
    await startGame({
      scenarioId: params.scenarioId,
      presidentName: params.name,
      partyId: params.partyId,
      background: params.background,
      mandateStrength: params.mandateStrength,
      communicationStyle: params.communicationStyle,
      ideology: params.ideology,
      vicePresidentId,
      vicePresidentPortfolio: portfolio,
    });
    router.replace("/(tabs)/dashboard");
  }

  return (
    <Screen>
      <Card>
        <AppText variant="label">Choose a running mate</AppText>
        <OptionGrid
          selected={vicePresidentId}
          onSelect={setVicePresidentId}
          options={vpOptions.map((vp) => ({ id: vp.id, title: vp.name, description: `${vp.ideology} - ${vp.region} - ${vp.biography}` }))}
        />
      </Card>
      <Card tone="blue">
        <AppText variant="subtitle">{selected.name}</AppText>
        <AppText color={colors.muted}>{selected.background} - {selected.region}</AppText>
        <Meter label="Competence" value={selected.competence} color={colors.blue} />
        <Meter label="Loyalty" value={selected.loyalty} color={colors.green} />
        <Meter label="Senate skill" value={selected.senateSkill} color={colors.red} />
      </Card>
      <Card>
        <AppText variant="label">Portfolio</AppText>
        <OptionGrid selected={portfolio} onSelect={setPortfolio} options={portfolios} />
      </Card>
      <Button label="Take the Oath" tone="red" onPress={() => void begin()} />
    </Screen>
  );
}
