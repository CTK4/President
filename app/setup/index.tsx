import { router } from "expo-router";
import * as React from "react";

import { AppText, Button, Card, Field, OptionGrid, Screen } from "@/components/ui";
import { scenarios } from "@/sim/data";
import type { PartyId } from "@/sim/types";

const parties: Array<{ id: PartyId; title: string; description: string }> = [
  { id: "democrat", title: "Democrat", description: "Public investment, social rights, labor, climate, and courts." },
  { id: "republican", title: "Republican", description: "Taxes, security, business, courts, borders, and traditional coalitions." },
  { id: "independent", title: "Independent", description: "Cross-partisan reform with weaker party machinery." },
];

const backgrounds = [
  {
    id: "Governor",
    title: "Governor",
    description: "Pros: executive experience, disaster response, state coalitions. Cons: weaker foreign policy and Washington relationships.",
  },
  {
    id: "Senator",
    title: "Senator",
    description: "Pros: legislative instincts, committee networks, media reps. Cons: less executive experience and slower crisis command.",
  },
  {
    id: "Vice President",
    title: "Vice President",
    description: "Pros: White House experience, foreign exposure, continuity. Cons: inherits the prior administration's baggage.",
  },
  {
    id: "Business Leader",
    title: "Business Leader",
    description: "Pros: markets, jobs messaging, management brand. Cons: weaker public-sector skill and higher conflict-of-interest scrutiny.",
  },
  {
    id: "Military / Intelligence",
    title: "Military / Intelligence",
    description: "Pros: security credibility, command discipline, crisis poise. Cons: civil-liberties concerns and thinner domestic coalition roots.",
  },
  {
    id: "Community Organizer",
    title: "Community Organizer",
    description: "Pros: grassroots energy, movement trust, turnout. Cons: establishment skepticism and lower institutional leverage.",
  },
  {
    id: "Academic",
    title: "Academic",
    description: "Pros: policy depth, research fluency, long-range thinking. Cons: elite branding and less practical deal-making experience.",
  },
];
const mandates = ["Landslide Victory", "Comfortable Win", "Razor-Thin Margin", "Electoral College Only"];
const communicationStyles = [
  {
    id: "Polished / presidential",
    title: "Polished / presidential",
    description: "Pros: reassures moderates, markets, and allies. Cons: can feel scripted when voters want urgency.",
  },
  {
    id: "Plainspoken populist",
    title: "Plainspoken populist",
    description: "Pros: direct, memorable, strong with angry or ignored voters. Cons: spooks institutions and can create media blowback.",
  },
  {
    id: "Technocratic explainer",
    title: "Technocratic explainer",
    description: "Pros: strong for complex crises, budgets, and public-health tradeoffs. Cons: risks sounding cold or overly academic.",
  },
  {
    id: "Empathetic unifier",
    title: "Empathetic unifier",
    description: "Pros: lowers temperature and builds trust after shocks. Cons: can look soft during hardball negotiations.",
  },
  {
    id: "Combative fighter",
    title: "Combative fighter",
    description: "Pros: rallies the base and dominates news cycles. Cons: raises polarization and makes compromise harder.",
  },
];
const ideologies = [
  {
    id: "Progressive Reform",
    title: "Progressive Reform",
    description: "Pros: energizes activists on climate, labor, healthcare, and rights. Cons: higher fiscal, court, and moderate-voter risk.",
  },
  {
    id: "Liberal Mainstream",
    title: "Liberal Mainstream",
    description: "Pros: broad Democratic coalition fit and institutional comfort. Cons: frustrates left flank when change feels incremental.",
  },
  {
    id: "Centrist Reformer",
    title: "Centrist Reformer",
    description: "Pros: strongest with swing voters and bipartisan deals. Cons: weaker base enthusiasm and muddier governing mandate.",
  },
  {
    id: "Conservative Mainstream",
    title: "Conservative Mainstream",
    description: "Pros: stable fit for taxes, courts, security, and business groups. Cons: resistance from labor, climate, and civil-rights blocs.",
  },
  {
    id: "National Populist",
    title: "National Populist",
    description: "Pros: intense support on borders, trade, and anti-establishment fights. Cons: alliance tension, market risk, and high polarization.",
  },
];

export default function Setup() {
  const [name, setName] = React.useState("Morgan Reyes");
  const [scenarioId, setScenarioId] = React.useState(scenarios[0].id);
  const [partyId, setPartyId] = React.useState<PartyId>("democrat");
  const [background, setBackground] = React.useState("Governor");
  const [mandateStrength, setMandateStrength] = React.useState("Comfortable Win");
  const [communicationStyle, setCommunicationStyle] = React.useState("Polished / presidential");
  const [ideology, setIdeology] = React.useState("Liberal Mainstream");

  const ready = name.trim().length > 1;

  return (
    <Screen>
      <Card>
        <AppText variant="label">Scenario</AppText>
        <OptionGrid
          selected={scenarioId}
          onSelect={setScenarioId}
          options={scenarios.map((scenario) => ({ id: scenario.id, title: scenario.title, description: `${scenario.category} - ${scenario.description}` }))}
        />
      </Card>
      <Card>
        <Field label="Name" value={name} onChangeText={setName} placeholder="President name" />
        <AppText variant="label">Party</AppText>
        <OptionGrid selected={partyId} onSelect={setPartyId} options={parties} />
      </Card>
      <Card>
        <AppText variant="label">Background</AppText>
        <OptionGrid selected={background} onSelect={setBackground} options={backgrounds} />
        <AppText variant="label">Mandate</AppText>
        <OptionGrid selected={mandateStrength} onSelect={setMandateStrength} options={mandates.map((item) => ({ id: item, title: item }))} />
      </Card>
      <Card>
        <AppText variant="label">Communication Style</AppText>
        <OptionGrid selected={communicationStyle} onSelect={setCommunicationStyle} options={communicationStyles} />
        <AppText variant="label">Ideology</AppText>
        <OptionGrid selected={ideology} onSelect={setIdeology} options={ideologies} />
      </Card>
      <Button
        label="Choose Vice President"
        tone="red"
        disabled={!ready}
        onPress={() =>
          router.push({
            pathname: "/setup/vp",
            params: { name: name.trim(), scenarioId, partyId, background, mandateStrength, communicationStyle, ideology },
          })
        }
      />
    </Screen>
  );
}
