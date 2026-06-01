import { router } from "expo-router";
import * as React from "react";

import { AppText, Button, Card, Field, OptionGrid, Screen, colors } from "@/components/ui";
import { scenarios } from "@/sim/data";
import type { PartyId } from "@/sim/types";

const parties: Array<{ id: PartyId; title: string; description: string }> = [
  { id: "democrat", title: "Democrat", description: "Public investment, social rights, labor, climate, and courts." },
  { id: "republican", title: "Republican", description: "Taxes, security, business, courts, borders, and traditional coalitions." },
  { id: "independent", title: "Independent", description: "Cross-partisan reform with weaker party machinery." },
];

const backgrounds = ["Governor", "Senator", "Vice President", "Business Leader", "Military / Intelligence", "Community Organizer", "Academic"];
const mandates = ["Landslide Victory", "Comfortable Win", "Razor-Thin Margin", "Electoral College Only"];

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
        <OptionGrid selected={background} onSelect={setBackground} options={backgrounds.map((item) => ({ id: item, title: item }))} />
        <AppText variant="label">Mandate</AppText>
        <OptionGrid selected={mandateStrength} onSelect={setMandateStrength} options={mandates.map((item) => ({ id: item, title: item }))} />
      </Card>
      <Card>
        <Field label="Communication Style" value={communicationStyle} onChangeText={setCommunicationStyle} />
        <Field label="Ideology" value={ideology} onChangeText={setIdeology} />
        <AppText color={colors.muted}>
          Defaults are used for gender, age, religion, education, wealth, military service, scandal history, and home region. These are stored in the typed president model and can be expanded into dedicated controls.
        </AppText>
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
