import { View } from "react-native";

import { AppText, Card, Meter, Row, Stat, colors } from "@/components/ui";
import type { Bill, CabinetMember, CourtCase, GameState } from "@/sim/types";

export function ApprovalPanel({ game }: { game: GameState }) {
  return (
    <Card tone={game.approval.overall >= 50 ? "blue" : "red"}>
      <AppText variant="label">National Approval</AppText>
      <Row>
        <Stat label="Overall" value={`${Math.round(game.approval.overall)}%`} color={game.approval.overall >= 50 ? colors.blue : colors.red} />
        <Stat label="Party" value={`${Math.round(game.approval.party)}%`} />
        <Stat label="Trust" value={`${Math.round(game.approval.trust)}%`} />
      </Row>
      <Meter label="Independent approval" value={game.approval.independent} color={colors.green} />
    </Card>
  );
}

export function CurrentEventPanel({ game }: { game: GameState }) {
  return (
    <Card tone="red">
      <AppText variant="label">{game.currentDate}</AppText>
      <AppText variant="subtitle">{game.currentEvent.title}</AppText>
      <AppText color={colors.muted}>{game.currentEvent.description}</AppText>
      <Row>
        <Stat label="Severity" value={game.currentEvent.severity} color={colors.red} />
        <Stat label="Urgency" value={game.currentEvent.urgency} color={colors.gold} />
      </Row>
    </Card>
  );
}

export function CongressPanel({ game }: { game: GameState }) {
  return (
    <Card>
      <AppText variant="label">Congress</AppText>
      <Row>
        <Stat label="House Dem" value={game.congress.house.seats.democrat} color={colors.blue} />
        <Stat label="House GOP" value={game.congress.house.seats.republican} color={colors.red} />
        <Stat label="Senate Dem" value={game.congress.senate.seats.democrat} color={colors.blue} />
        <Stat label="Senate GOP" value={game.congress.senate.seats.republican} color={colors.red} />
      </Row>
      <Meter label="Cooperation" value={game.congress.cooperation} color={colors.green} />
    </Card>
  );
}

export function CourtPanel({ game }: { game: GameState }) {
  const conservative = game.supremeCourt.justices.filter((justice) => justice.ideology > 8).length;
  const liberal = game.supremeCourt.justices.filter((justice) => justice.ideology < -8).length;
  const moderate = game.supremeCourt.justices.length - conservative - liberal;

  return (
    <Card>
      <AppText variant="label">Supreme Court</AppText>
      <Row>
        <Stat label="Conservative" value={conservative} color={colors.red} />
        <Stat label="Liberal" value={liberal} color={colors.blue} />
        <Stat label="Moderate" value={moderate} color={colors.muted} />
        <Stat label="Cases" value={game.pendingCases.filter((item) => item.status === "pending").length} />
      </Row>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {game.supremeCourt.justices.map((justice) => {
          const ideologyColor = justice.ideology > 8 ? colors.red : justice.ideology < -8 ? colors.blue : colors.muted;
          const backgroundColor = justice.ideology > 8 ? "#f3d9d5" : justice.ideology < -8 ? "#dce9f9" : "#ebe4d8";

          return (
            <View key={justice.id} style={{ width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor }}>
              <AppText variant="label" color={ideologyColor}>
                {justice.chief ? "C" : Math.round(Math.abs(justice.ideology))}
              </AppText>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export function EconomyPanel({ game }: { game: GameState }) {
  return (
    <Card>
      <AppText variant="label">Economy</AppText>
      <Row>
        <Stat label="GDP" value={`${game.economy.gdpGrowth.toFixed(1)}%`} color={game.economy.gdpGrowth >= 2 ? colors.green : colors.red} />
        <Stat label="Unemp." value={`${game.economy.unemployment.toFixed(1)}%`} />
        <Stat label="Inflation" value={`${game.economy.inflation.toFixed(1)}%`} color={game.economy.inflation <= 3 ? colors.green : colors.red} />
        <Stat label="Debt" value={`${Math.round(game.economy.nationalDebt)}%`} />
      </Row>
    </Card>
  );
}

export function CabinetList({ cabinet }: { cabinet: CabinetMember[] }) {
  return (
    <View style={{ gap: 10 }}>
      {cabinet.map((member) => (
        <Card key={member.id}>
          <AppText variant="subtitle">{member.office}</AppText>
          <AppText color={colors.muted}>{member.name}</AppText>
          <Meter label="Competence" value={member.competence} color={colors.blue} />
          <Meter label="Loyalty" value={member.loyalty} color={colors.green} />
        </Card>
      ))}
    </View>
  );
}

export function BillList({ bills }: { bills: Bill[] }) {
  if (!bills.length) {
    return (
      <Card>
        <AppText color={colors.muted}>No bills are on the desk yet.</AppText>
      </Card>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      {bills.map((bill) => (
        <Card key={bill.id}>
          <AppText variant="subtitle">{bill.title}</AppText>
          <AppText color={colors.muted}>{bill.issueArea} - {bill.status}</AppText>
          <Meter label="House support" value={bill.houseSupport} color={colors.blue} />
          <Meter label="Senate support" value={bill.senateSupport} color={colors.red} />
        </Card>
      ))}
    </View>
  );
}

export function CaseList({ cases }: { cases: CourtCase[] }) {
  if (!cases.length) {
    return (
      <Card>
        <AppText color={colors.muted}>No court challenges are pending.</AppText>
      </Card>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      {cases.map((courtCase) => (
        <Card key={courtCase.id}>
          <AppText variant="subtitle">{courtCase.title}</AppText>
          <AppText color={colors.muted}>{courtCase.constitutionalIssue} - {courtCase.status}</AppText>
          <Meter label="Government win chance" value={courtCase.governmentWinChance} color={colors.green} />
        </Card>
      ))}
    </View>
  );
}

export function AgendaResourcesPanel({ game }: { game: GameState }) {
  return (
    <Card>
      <AppText variant="label">Agenda Resources</AppText>
      <Meter label="White House bandwidth" value={game.agendaResources.whiteHouseBandwidth} color={colors.blue} />
      <Meter label="Congressional capital" value={game.agendaResources.congressionalCapital} color={colors.green} />
      <Meter label="Media attention" value={game.agendaResources.mediaAttention} color={colors.gold} />
      <Meter label="Agency capacity" value={game.agendaResources.agencyCapacity} color={colors.blue} />
      <Meter label="Political capital" value={game.agendaResources.politicalCapital} color={colors.red} />
    </Card>
  );
}

export function AgendaProjectList({ game }: { game: GameState }) {
  if (!game.agendaProjects.length) {
    return (
      <Card>
        <AppText color={colors.muted}>No multi-month agenda projects are active yet.</AppText>
      </Card>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      {game.agendaProjects.map((project) => (
        <Card key={project.id} tone={project.status === "blocked" ? "red" : project.status === "completed" ? "green" : "default"}>
          <AppText variant="subtitle">{project.title}</AppText>
          <AppText color={colors.muted}>{project.vehicle.replace(/_/g, " ")} - {project.status}</AppText>
          <Meter label="Progress" value={project.progress} color={project.status === "blocked" ? colors.red : colors.green} />
          {project.blockers.length ? <AppText color={colors.muted}>Blockers: {project.blockers.join(", ")}</AppText> : null}
        </Card>
      ))}
    </View>
  );
}

export function NationalSecurityDashboard({ game }: { game: GameState }) {
  const pending = game.nationalSecurity.pendingNscDecisions.length || game.nationalSecurity.covertOperations.filter((item) => item.status === "active").length;
  return (
    <>
      <Card tone="red">
        <AppText variant="subtitle">National Security</AppText>
        <Row>
          <Stat label="Deployments" value={game.nationalSecurity.activeDeployments.length} color={game.nationalSecurity.activeDeployments.length ? colors.red : colors.green} />
          <Stat label="Covert ops" value={game.nationalSecurity.covertOperations.length} />
          <Stat label="War Powers" value={game.nationalSecurity.warPowersClock ?? "None"} color={game.nationalSecurity.warPowersClock ? colors.red : colors.green} />
        </Row>
      </Card>
      <Card>
        <AppText variant="label">Readiness and Support</AppText>
        <Meter label="Military readiness" value={game.nationalSecurity.militaryReadiness} color={colors.green} />
        <Meter label="Allied support" value={game.nationalSecurity.alliedSupport} color={colors.blue} />
        <Meter label="Intelligence confidence" value={game.nationalSecurity.intelligenceConfidence} color={colors.gold} />
        <Row>
          <Stat label="Casualties" value={game.nationalSecurity.casualties} color={game.nationalSecurity.casualties ? colors.red : colors.green} />
          <Stat label="Pending NSC" value={pending} />
        </Row>
      </Card>
      <Card>
        <AppText variant="label">Threat Matrix</AppText>
        {game.nationalSecurity.threatMatrix.slice(0, 4).map((entry) => {
          const actor = game.foreignRelations.find((item) => item.id === entry.actorId);
          return (
            <View key={entry.actorId} style={{ gap: 4 }}>
              <AppText variant="subtitle">{actor?.name ?? entry.actorId}</AppText>
              <Meter label="Threat" value={entry.threatLevel} color={colors.red} />
              <Meter label="Intel confidence" value={entry.intelligenceConfidence} color={colors.blue} />
            </View>
          );
        })}
      </Card>
    </>
  );
}

export function StrategicActionLists({ game }: { game: GameState }) {
  return (
    <>
      <AppText variant="subtitle">Active Deployments</AppText>
      {game.nationalSecurity.activeDeployments.length ? (
        <View style={{ gap: 10 }}>
          {game.nationalSecurity.activeDeployments.map((action) => (
            <Card key={action.id}>
              <AppText variant="subtitle">{action.actionType.replace(/_/g, " ")}</AppText>
              <AppText color={colors.muted}>{action.objective} - {action.status}</AppText>
              <Row>
                <Stat label="Success" value={`${Math.round(action.successChance)}%`} />
                <Stat label="Escalation" value={`${Math.round(action.escalationRisk)}%`} color={colors.red} />
                <Stat label="War Powers" value={action.warPowersClock ?? "Clear"} />
              </Row>
            </Card>
          ))}
        </View>
      ) : (
        <Card><AppText color={colors.muted}>No active deployments.</AppText></Card>
      )}
      <AppText variant="subtitle">Covert Operations</AppText>
      {game.nationalSecurity.covertOperations.length ? (
        <View style={{ gap: 10 }}>
          {game.nationalSecurity.covertOperations.map((operation) => (
            <Card key={operation.id}>
              <AppText variant="subtitle">{operation.operationType.replace(/_/g, " ")}</AppText>
              <AppText color={colors.muted}>{operation.objective} - {operation.status}</AppText>
              <Row>
                <Stat label="Success" value={`${Math.round(operation.successChance)}%`} />
                <Stat label="Exposure" value={`${Math.round(operation.exposureRisk)}%`} color={colors.red} />
                <Stat label="Outcome" value={operation.outcome?.replace(/_/g, " ") ?? "Pending"} />
              </Row>
            </Card>
          ))}
        </View>
      ) : (
        <Card><AppText color={colors.muted}>No covert operations recorded.</AppText></Card>
      )}
    </>
  );
}
