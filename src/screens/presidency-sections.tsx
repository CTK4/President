import { Link, router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as React from "react";
import { View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { AgendaProjectList, AgendaResourcesPanel, ApprovalPanel, BillList, CabinetList, CaseList, CongressPanel, CourtPanel, CurrentEventPanel, EconomyPanel, NationalSecurityDashboard, StrategicActionLists } from "@/components/game-panels";
import { AppText, Button, Card, Field, Meter, OptionGrid, Row, Screen, SegmentedSubnav, Stat, colors } from "@/components/ui";
import { primaryTabs, type PrimaryTabId, type SectionId } from "@/navigation/tabs";
import { computeLegacy } from "@/sim/engine";
import { advanceTurn, appointJustice, resetGame, resolveBillAction, resolveElection, submitAgendaAction, submitCovertOperation, submitMilitaryAction, submitResponse, useGameSnapshot } from "@/state/game-store";
import type { AgendaActionCategory, AuthorizationLevel, CongressionalAuthorization, CourtNominationStrategy, CovertOperationType, MilitaryActionType, PolicyVehicle, SupremeCourtVacancy } from "@/sim/types";

type SectionScreenProps<T extends SectionId> = {
  tabId: PrimaryTabId;
  selected: T;
  onSelect: (id: T) => void;
  children: React.ReactNode;
};

const nominationOptions: Array<{ id: CourtNominationStrategy; title: string; description: string }> = [
  {
    id: "consensus",
    title: "Consensus nominee",
    description: "Effect: smaller ideological shift, improves Court legitimacy, and preserves congressional cooperation.",
  },
  {
    id: "ideological",
    title: "Ideological nominee",
    description: "Effect: larger party-aligned shift, energizes the base, but lowers legitimacy and cooperation.",
  },
  {
    id: "historic",
    title: "Historic first",
    description: "Effect: meaningful ideological shift with a public-trust upside and moderate institutional risk.",
  },
];

const agendaCategoryOptions: Array<{ id: AgendaActionCategory; title: string; description: string }> = [
  { id: "domestic_policy", title: "Domestic policy", description: "Advance a home-front policy project." },
  { id: "economic_policy", title: "Economic policy", description: "Use capacity on jobs, prices, taxes, or budgets." },
  { id: "legislation", title: "Legislation", description: "Spend congressional capital on a bill." },
  { id: "executive_action", title: "Executive action", description: "Move through presidential direction." },
  { id: "judicial_legal_strategy", title: "Judicial/legal strategy", description: "Shape litigation, nominations, or legal posture." },
  { id: "foreign_policy", title: "Foreign policy", description: "Use diplomatic room to shift relationships." },
  { id: "national_security", title: "National security", description: "Review military or covert strategic options." },
  { id: "communications", title: "Communications", description: "Focus the national narrative." },
  { id: "cabinet_personnel", title: "Cabinet/personnel", description: "Rebuild the team or agency leadership." },
  { id: "campaign_party_building", title: "Campaign/party building", description: "Strengthen party and election infrastructure." },
];

const vehicleOptions: Array<{ id: PolicyVehicle; title: string; description: string }> = [
  { id: "legislation", title: "Legislation", description: "Requires Congress but can create durable policy." },
  { id: "executive_order", title: "Executive order", description: "Fast presidential action with legal risk." },
  { id: "agency_rulemaking", title: "Agency rulemaking", description: "Slower but grounded in agency authority." },
  { id: "budget_request", title: "Budget request", description: "Frames spending priorities for Congress." },
  { id: "public_campaign", title: "Public campaign", description: "Uses media attention and political capital." },
  { id: "diplomatic_action", title: "Diplomatic action", description: "Works through foreign policy channels." },
  { id: "covert_operation", title: "Covert operation", description: "Abstract strategic operation with exposure risk." },
  { id: "military_action", title: "Military action", description: "Open use of force or deployment decision." },
  { id: "judicial_nomination", title: "Judicial nomination", description: "Moves through appointment authority." },
  { id: "personnel_action", title: "Personnel action", description: "Changes leadership or staffing posture." },
];

const covertOptions: Array<{ id: CovertOperationType; title: string; description: string }> = [
  { id: "intelligence_collection", title: "Intelligence collection", description: "Improve insight into a target actor." },
  { id: "cyber_disruption", title: "Cyber disruption", description: "Disrupt hostile capability at a strategic level." },
  { id: "counterterror_disruption", title: "Counterterror disruption", description: "Reduce an abstract threat network's capacity." },
  { id: "hostage_recovery_support", title: "Hostage recovery support", description: "Support a recovery effort without tactical detail." },
  { id: "support_friendly_opposition", title: "Support friendly opposition", description: "Back aligned political forces with high exposure risk." },
  { id: "sabotage_hostile_capability", title: "Sabotage hostile capability", description: "Impair a hostile capability abstractly." },
  { id: "asset_exfiltration", title: "Asset exfiltration", description: "Protect a sensitive intelligence source." },
  { id: "regime_destabilization", title: "Regime destabilization", description: "High-risk strategic pressure on a hostile regime." },
];

const militaryOptions: Array<{ id: MilitaryActionType; title: string; description: string }> = [
  { id: "show_of_force", title: "Show of force", description: "Signal resolve with limited direct risk." },
  { id: "deploy_carrier_group", title: "Deploy carrier group", description: "Forward presence with escalation risk." },
  { id: "airstrike", title: "Airstrike", description: "Limited strike with civilian harm risk." },
  { id: "limited_missile_strike", title: "Limited missile strike", description: "Standoff strike with legal and escalation risk." },
  { id: "special_operations_raid", title: "Special operations raid", description: "High-risk limited raid." },
  { id: "no_fly_zone", title: "No-fly zone", description: "Sustained enforcement with escalation risk." },
  { id: "peacekeeping_deployment", title: "Peacekeeping deployment", description: "Deploy to stabilize a fragile setting." },
  { id: "humanitarian_intervention", title: "Humanitarian intervention", description: "Use force to protect civilians." },
  { id: "evacuation_operation", title: "Evacuation operation", description: "Extract civilians or personnel from danger." },
  { id: "counterterror_campaign", title: "Counterterror campaign", description: "Sustained campaign with fatigue risk." },
  { id: "troop_surge", title: "Troop surge", description: "Large reinforcement with casualty risk." },
  { id: "full_invasion", title: "Full invasion", description: "Maximum risk and maximum institutional exposure." },
  { id: "withdrawal", title: "Withdrawal", description: "End or reduce an existing military commitment." },
];

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

  const status = game.status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <>
      <Card tone="blue">
        <AppText variant="title">{game.president.name}</AppText>
        <AppText color={colors.muted}>{game.president.party.toUpperCase()} - {game.president.background} - Month {Math.floor(game.currentMonth) + 1} / 48</AppText>
        <Row>
          <Stat label="Status" value={status} />
          <Stat label="VP" value={game.vicePresident.name} />
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
      <AgendaResourcesPanel game={game} />
      <AppText variant="subtitle">Agenda Projects</AppText>
      <AgendaProjectList game={game} />
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

  const indicators = [
    { label: "Interest rates", value: `${game.economy.interestRates.toFixed(1)}%` },
    { label: "Deficit", value: `${game.economy.deficit.toFixed(1)}%` },
    { label: "Consumer confidence", value: Math.round(game.economy.consumerConfidence) },
    { label: "Stock market", value: Math.round(game.economy.stockMarket) },
    { label: "Wage growth", value: `${game.economy.wageGrowth.toFixed(1)}%` },
    { label: "Housing affordability", value: Math.round(game.economy.housingAffordability) },
    { label: "Gas price", value: `$${game.economy.gasPrices.toFixed(2)}` },
    { label: "Poverty", value: `${game.economy.poverty.toFixed(1)}%` },
  ];

  return (
    <>
      <EconomyPanel game={game} />
      <Card>
        <AppText variant="subtitle">Economic Indicators</AppText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {indicators.map((indicator) => (
            <View
              key={indicator.label}
              style={{
                flexBasis: "47%",
                flexGrow: 1,
                minWidth: 150,
                borderColor: colors.line,
                borderWidth: 1,
                borderRadius: 8,
                borderCurve: "continuous",
                backgroundColor: "#faf7f1",
                padding: 10,
                gap: 2,
              }}
            >
              <AppText variant="label">{indicator.label}</AppText>
              <AppText variant="subtitle">{indicator.value}</AppText>
            </View>
          ))}
        </View>
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

  return (
    <>
      <NationalSecurityDashboard game={game} />
      <StrategicActionLists game={game} />
    </>
  );
}

export function EventsSection() {
  const { game, lastResolution } = useGameSnapshot();
  const [custom, setCustom] = React.useState("");
  const [agendaCategory, setAgendaCategory] = React.useState<AgendaActionCategory>("domestic_policy");
  const [vehicle, setVehicle] = React.useState<PolicyVehicle>("legislation");
  const [objective, setObjective] = React.useState("Advance a focused administration priority this month.");
  const [covertType, setCovertType] = React.useState<CovertOperationType>("intelligence_collection");
  const [militaryType, setMilitaryType] = React.useState<MilitaryActionType>("show_of_force");
  const [authorizationLevel, setAuthorizationLevel] = React.useState<AuthorizationLevel>("nsc_review");
  const [congressionalAuthorization, setCongressionalAuthorization] = React.useState<CongressionalAuthorization>("ambiguous");
  if (!game) return <EmptyState />;
  const courtVacancyMoved = game.currentEvent.id === "court-vacancy";
  const hasActed = game.timeline[game.timeline.length - 1]?.month === game.currentMonth;
  const targetActorId = game.foreignRelations[0]?.id ?? "unknown";

  async function choose(optionId: string) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await submitResponse({ kind: "suggested", optionId });
  }

  async function submitCustom() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await submitResponse({ kind: "custom", text: custom });
    setCustom("");
  }

  async function submitAgenda() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (vehicle === "covert_operation") {
      await submitCovertOperation({
        operationType: covertType,
        targetActorId,
        objective,
        authorizationLevel,
        durationMonths: 2,
      });
      return;
    }
    if (vehicle === "military_action") {
      await submitMilitaryAction({
        actionType: militaryType,
        targetActorId,
        objective,
        legalBasis: congressionalAuthorization === "clear" ? "Specific congressional authorization" : "Article II national security authority with contested War Powers posture",
        congressionalAuthorization,
      });
      return;
    }
    await submitAgendaAction({ category: agendaCategory, vehicle, objective });
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
      {courtVacancyMoved ? (
        <Card tone="blue">
          <AppText variant="subtitle">Vacancy moved to People</AppText>
          <AppText color={colors.muted}>Supreme Court vacancies are no longer monthly response events. Open the People tab to nominate and fill the seat.</AppText>
        </Card>
      ) : !hasActed && game.currentTurnType === "agenda_month" ? (
        <>
          <AgendaResourcesPanel game={game} />
          <Card tone="blue">
            <AppText variant="subtitle">Primary Agenda Action</AppText>
            <OptionGrid selected={agendaCategory} onSelect={setAgendaCategory} options={agendaCategoryOptions} />
          </Card>
          <Card>
            <AppText variant="subtitle">Policy Vehicle</AppText>
            <OptionGrid selected={vehicle} onSelect={setVehicle} options={vehicleOptions} />
          </Card>
          <Card>
            <Field label="Objective" value={objective} onChangeText={setObjective} multiline placeholder="State the strategic objective for this month." />
          </Card>
          {vehicle === "covert_operation" ? (
            <>
              <Card tone="red">
                <AppText variant="subtitle">Covert Operation Review</AppText>
                <AppText color={colors.muted}>Operations are modeled only as abstract strategic actions with risk, authorization, and outcome assessment.</AppText>
                <OptionGrid selected={covertType} onSelect={setCovertType} options={covertOptions} />
              </Card>
              <Card>
                <AppText variant="subtitle">Authorization Level</AppText>
                <OptionGrid
                  selected={authorizationLevel}
                  onSelect={setAuthorizationLevel}
                  options={[
                    { id: "nsc_review", title: "NSC review", description: "Balanced oversight and secrecy." },
                    { id: "presidential_finding", title: "Presidential finding", description: "Stronger formal authorization." },
                    { id: "cabinet_level", title: "Cabinet level", description: "Shared accountability across principals." },
                    { id: "agency_discretion", title: "Agency discretion", description: "Faster but riskier authorization record." },
                  ]}
                />
              </Card>
            </>
          ) : null}
          {vehicle === "military_action" ? (
            <>
              <Card tone="red">
                <AppText variant="subtitle">Military Action Review</AppText>
                <OptionGrid selected={militaryType} onSelect={setMilitaryType} options={militaryOptions} />
              </Card>
              <Card>
                <AppText variant="subtitle">Congressional Authorization</AppText>
                <OptionGrid
                  selected={congressionalAuthorization}
                  onSelect={setCongressionalAuthorization}
                  options={[
                    { id: "clear", title: "Clear", description: "Congress has clearly authorized the action." },
                    { id: "ambiguous", title: "Ambiguous", description: "Legal basis exists but War Powers risk remains." },
                    { id: "none", title: "None", description: "No clear congressional authorization." },
                    { id: "opposed", title: "Opposed", description: "Congressional leadership objects." },
                  ]}
                />
              </Card>
            </>
          ) : null}
          {(vehicle === "covert_operation" || vehicle === "military_action") ? (
            <Card>
              <AppText variant="subtitle">Advisor Review Required</AppText>
              <AppText color={colors.muted}>Secretary of Defense, Secretary of State, Chairman of the Joint Chiefs, CIA Director / DNI, Attorney General, Vice President, and congressional leadership will review the action before resolution.</AppText>
            </Card>
          ) : null}
          <Button label="Advance Agenda" tone="red" disabled={objective.trim().length < 8} onPress={() => void submitAgenda()} />
          <AppText variant="subtitle">Agenda Projects</AppText>
          <AgendaProjectList game={game} />
        </>
      ) : !hasActed ? (
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
              {game.lastActionResult ? (
                <View style={{ gap: 6 }}>
                  <AppText variant="label">Action Result</AppText>
                  <AppText>Vehicle: {game.lastActionResult.actionVehicle.replace(/_/g, " ")}</AppText>
                  <AppText>Objective: {game.lastActionResult.objective}</AppText>
                  <AppText>Legal basis: {game.lastActionResult.legalBasis}</AppText>
                  <AppText>Result: {game.lastActionResult.successFailure}</AppText>
                  <AppText>Visibility: {game.lastActionResult.publicVisibility}</AppText>
                  <AppText>Congress: {game.lastActionResult.congressReaction}</AppText>
                  <AppText>Allies: {game.lastActionResult.alliedReaction}</AppText>
                  <AppText>Adversary: {game.lastActionResult.adversaryReaction}</AppText>
                  <AppText>Institutional risk: {game.lastActionResult.institutionalRisk}</AppText>
                  <AppText>Future risks: {game.lastActionResult.futureRisks.length ? game.lastActionResult.futureRisks.map((risk) => risk.replace(/_/g, " ")).join(", ") : "None"}</AppText>
                  <AppText color={colors.muted}>Timeline entry: {game.lastActionResult.timelineEntryId}</AppText>
                </View>
              ) : null}
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
  const pendingCourtVacancies: SupremeCourtVacancy[] =
    game.pendingCourtVacancies?.length
      ? game.pendingCourtVacancies
      : game.currentEvent.id === "court-vacancy"
        ? [{
            id: `legacy-vacancy-${Math.floor(game.currentMonth)}`,
            previousJusticeName: "Retiring justice",
            previousIdeology: 0,
            openedMonth: Math.floor(game.currentMonth),
            reason: "retirement",
            chief: false,
          }]
        : [];

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
      <Card tone={pendingCourtVacancies.length ? "red" : "green"}>
        <AppText variant="subtitle">Judicial Vacancies</AppText>
        {pendingCourtVacancies.length ? (
          <View style={{ gap: 10 }}>
            {pendingCourtVacancies.map((vacancy) => (
              <View key={vacancy.id} style={{ gap: 8 }}>
                <AppText color={colors.muted}>
                  {vacancy.chief ? "Chief justice seat" : "Associate justice seat"} opened by {vacancy.reason} of {vacancy.previousJusticeName}.
                </AppText>
                <OptionGrid
                  selected={undefined}
                  onSelect={(strategy) => void appointJustice(vacancy.id, strategy)}
                  options={nominationOptions}
                />
              </View>
            ))}
          </View>
        ) : (
          <AppText color={colors.muted}>No current Supreme Court vacancies. New openings will appear here instead of the monthly event flow.</AppText>
        )}
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
