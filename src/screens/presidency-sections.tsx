import { Link, router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as React from "react";
import { View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { ApprovalPanel, BillList, CabinetList, CaseList, CongressPanel, CourtPanel, CurrentEventPanel, EconomyPanel } from "@/components/game-panels";
import { AppText, Button, Card, Field, Meter, Row, Screen, SegmentedSubnav, Stat, colors } from "@/components/ui";
import { primaryTabs, type PrimaryTabId, type SectionId } from "@/navigation/tabs";
import { computeLegacy } from "@/sim/engine";
import { advanceTurn, resetGame, resolveBillAction, resolveElection, submitResponse, useGameSnapshot } from "@/state/game-store";

type SectionScreenProps<T extends SectionId> = {
  tabId: PrimaryTabId;
  selected: T;
  onSelect: (id: T) => void;
  children: React.ReactNode;
};

export function SectionScreen<T extends SectionId>({ tabId, selected, onSelect, children }: SectionScreenProps<T>) {
  const tab = primaryTabs.find((item) => item.id === tabId);

  return (
    <Screen>
      {tab ? <SegmentedSubnav options={tab.sections as Array<{ id: T; label: string }>} selected={selected} onSelect={onSelect} /> : null}
      {children}
    </Screen>
  );
}

export function DashboardOverviewSection() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;

  return (
    <>
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
        <Link href="/(tabs)/campaign" asChild>
          <Button label="Enter Situation Room" tone="red" onPress={() => {}} />
        </Link>
      </Card>
    </>
  );
}

export function ApprovalSection() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;

  return (
    <>
      <ApprovalPanel game={game} />
      <AppText variant="subtitle">Public Coalitions</AppText>
      <View style={{ gap: 10 }}>
        {game.personas.map((persona) => (
          <Card key={persona.id}>
            <AppText variant="subtitle">{persona.name}</AppText>
            <AppText color={colors.muted}>{persona.demographics.join(", ")} - {persona.reactionStyle}</AppText>
            <Meter label="Approval" value={persona.approval} color={persona.approval >= 50 ? colors.blue : colors.red} />
            <Meter label="Trust" value={persona.trust} color={colors.green} />
          </Card>
        ))}
      </View>
    </>
  );
}

export function CurrentIssueSection() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;

  return <CurrentEventPanel game={game} />;
}

export function AlertsBriefingsSection() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;

  return (
    <>
      <Card tone={game.activeCrises.length || game.scandals.length ? "red" : "green"}>
        <AppText variant="subtitle">Alerts and Briefings</AppText>
        <Row>
          <Stat label="Crises" value={game.activeCrises.length} color={game.activeCrises.length ? colors.red : colors.green} />
          <Stat label="Scandals" value={game.scandals.length} color={game.scandals.length ? colors.red : colors.green} />
          <Stat label="Bills" value={game.pendingBills.length} />
          <Stat label="Cases" value={game.pendingCases.length} />
        </Row>
      </Card>
      <BillList bills={game.pendingBills} />
      <CaseList cases={game.pendingCases} />
    </>
  );
}

export function CongressSection() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;

  return (
    <>
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
    </>
  );
}

export function CourtSection() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;

  return (
    <>
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
    </>
  );
}

export function StatesSection() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;
  const playerEv = game.states.filter((state) => state.approval >= 50).reduce((sum, state) => sum + state.electoralVotes, 0);
  const battlegrounds = [...game.states].sort((a, b) => Math.abs(a.approval - 50) - Math.abs(b.approval - 50)).slice(0, 8);

  return (
    <>
      <Card tone="blue">
        <AppText variant="subtitle">Election Forecast</AppText>
        <Row>
          <Stat label="Projected EV" value={playerEv} color={playerEv >= 270 ? colors.blue : colors.red} />
          <Stat label="States above 50" value={game.states.filter((state) => state.approval >= 50).length} />
        </Row>
      </Card>
      <AppText variant="subtitle">Battlegrounds</AppText>
      <View style={{ gap: 10 }}>
        {battlegrounds.map((state) => (
          <Card key={state.abbreviation}>
            <Row>
              <Stat label={state.name} value={`${Math.round(state.approval)}%`} color={state.approval >= 50 ? colors.blue : colors.red} />
              <Stat label="EV" value={state.electoralVotes} />
              <Stat label="Lean" value={state.partisanLean} />
            </Row>
            <AppText color={colors.muted}>{state.demographicProfile.join(", ")} - governor: {state.governorParty}</AppText>
          </Card>
        ))}
      </View>
    </>
  );
}

export function PolicySection() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;

  return (
    <>
      <Card>
        <AppText variant="subtitle">Legislation and Policy</AppText>
        <Row>
          <Stat label="Signed" value={game.pendingBills.filter((bill) => bill.status === "signed").length} color={colors.green} />
          <Stat label="On desk" value={game.pendingBills.filter((bill) => bill.status === "on_desk").length} />
          <Stat label="Pending" value={game.pendingBills.filter((bill) => bill.status === "introduced").length} />
        </Row>
      </Card>
      <BillList bills={game.pendingBills} />
    </>
  );
}

export function EconomySection() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;

  return (
    <>
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
    </>
  );
}

export function ForeignSection() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;

  return (
    <>
      <Card tone="red">
        <AppText variant="subtitle">Crises and Deployments</AppText>
        <Row>
          <Stat label="Active crises" value={game.activeCrises.length} color={colors.red} />
          <Stat label="War mode" value={game.settings.warMode ? "On" : "Off"} />
        </Row>
      </Card>
      <View style={{ gap: 10 }}>
        {game.foreignRelations.map((actor) => (
          <Card key={actor.id}>
            <AppText variant="subtitle">{actor.name}</AppText>
            <Meter label="Relationship" value={actor.relationship} color={colors.blue} />
            <Meter label="Tension" value={actor.tension} color={colors.red} />
            <Meter label="Military risk" value={actor.militaryRisk} color={colors.gold} />
          </Card>
        ))}
      </View>
    </>
  );
}

export function TradeSection() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;
  const tradePartners = game.foreignRelations.filter((actor) => actor.tradeImportance >= 45);

  return (
    <>
      <Card>
        <AppText variant="subtitle">Trade Exposure</AppText>
        <AppText color={colors.muted}>Major partner relationships with high trade dependence.</AppText>
      </Card>
      <View style={{ gap: 10 }}>
        {tradePartners.map((actor) => (
          <Card key={actor.id}>
            <AppText variant="subtitle">{actor.name}</AppText>
            <Meter label="Trade importance" value={actor.tradeImportance} color={colors.gold} />
            <Meter label="Relationship" value={actor.relationship} color={colors.blue} />
            <Meter label="Tension" value={actor.tension} color={colors.red} />
          </Card>
        ))}
      </View>
    </>
  );
}

export function SecuritySection() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;
  const securityActors = [...game.foreignRelations].sort((a, b) => b.militaryRisk - a.militaryRisk).slice(0, 4);

  return (
    <>
      <Card tone="red">
        <AppText variant="subtitle">Security Posture</AppText>
        <Row>
          <Stat label="War mode" value={game.settings.warMode ? "On" : "Off"} />
          <Stat label="Active crises" value={game.activeCrises.length} color={colors.red} />
        </Row>
      </Card>
      <View style={{ gap: 10 }}>
        {securityActors.map((actor) => (
          <Card key={actor.id}>
            <AppText variant="subtitle">{actor.name}</AppText>
            <Meter label="Military risk" value={actor.militaryRisk} color={colors.red} />
            <Meter label="Tension" value={actor.tension} color={colors.gold} />
          </Card>
        ))}
      </View>
    </>
  );
}

export function EventsSection() {
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
    <>
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
    </>
  );
}

export function PeopleSection() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;

  return (
    <>
      <Card tone="blue">
        <AppText variant="subtitle">Vice President {game.vicePresident.name}</AppText>
        <AppText color={colors.muted}>{game.vicePresident.biography}</AppText>
        <Row>
          <Stat label="Portfolio" value={game.vicePresident.portfolio ?? "None"} />
          <Stat label="Approval" value={`${game.vicePresident.approval}%`} />
        </Row>
        <Meter label="Loyalty" value={game.vicePresident.loyalty} color={colors.green} />
        <Meter label="Ambition" value={game.vicePresident.ambition} color={colors.gold} />
      </Card>
      <AppText variant="subtitle">Cabinet</AppText>
      <CabinetList cabinet={game.cabinet} />
      <AppText variant="subtitle">Institutional Officials</AppText>
      <View style={{ gap: 10 }}>
        {game.institutionalOfficials.map((official) => (
          <Card key={official.id}>
            <AppText variant="subtitle">{official.office}</AppText>
            <AppText color={colors.muted}>{official.name}</AppText>
            <Meter label="Competence" value={official.competence} color={colors.blue} />
            <Meter label="Independence" value={official.independence} color={colors.red} />
          </Card>
        ))}
      </View>
    </>
  );
}

export function MediaSection() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;

  return (
    <>
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
    </>
  );
}

export function HistorySection() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;
  const legacy = computeLegacy(game);

  return (
    <>
      <Card tone="blue">
        <AppText variant="subtitle">{legacy.title}</AppText>
        <Row>
          <Stat label="Legacy" value={legacy.total} color={colors.blue} />
          <Stat label="Decisions" value={game.timeline.length} />
          <Stat label="Ending" value={legacy.ending} />
        </Row>
      </Card>
      <AppText variant="subtitle">Report Card</AppText>
      <View style={{ gap: 10 }}>
        {legacy.categories.map((category) => (
          <Card key={category.name}>
            <Row>
              <Stat label={category.name} value={category.score} color={category.score >= 60 ? colors.green : colors.red} />
            </Row>
          </Card>
        ))}
      </View>
      <AppText variant="subtitle">Timeline</AppText>
      <View style={{ gap: 10 }}>
        {[...game.timeline].reverse().map((entry) => (
          <Card key={entry.id}>
            <AppText variant="label">{entry.dateLabel}</AppText>
            <AppText variant="subtitle">{entry.title}</AppText>
            <AppText color={colors.muted}>{entry.decisionText}</AppText>
            {entry.effectsSummary.map((effect) => (
              <AppText key={effect}>{effect}</AppText>
            ))}
          </Card>
        ))}
      </View>
    </>
  );
}

export function SettingsSection() {
  const { game } = useGameSnapshot();
  if (!game) return <EmptyState />;

  async function reset() {
    await resetGame();
    router.replace("/");
  }

  return (
    <Screen>
      <Card>
        <AppText variant="subtitle">Save and Settings</AppText>
        <AppText color={colors.muted}>The active game is stored locally with SQLite and schema version {game.schemaVersion}.</AppText>
        <Row>
          <Stat label="Economic sim" value={game.settings.economicSimulation ? "On" : "Off"} />
          <Stat label="Checks" value={game.settings.checksAndBalances ? "On" : "Off"} />
          <Stat label="Persona" value={game.settings.personaMode} />
          <Stat label="Pacing" value={game.settings.pacing} />
        </Row>
      </Card>
      <Card tone="red">
        <AppText variant="subtitle">Reset Presidency</AppText>
        <AppText color={colors.muted}>This clears the local SQLite save for the current career.</AppText>
        <Button label="Clear Save" tone="red" onPress={() => void reset()} />
      </Card>
    </Screen>
  );
}
