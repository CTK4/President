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
  return (
    <Card>
      <AppText variant="label">Supreme Court</AppText>
      <Row>
        <Stat label="Conservative" value={conservative} color={colors.red} />
        <Stat label="Liberal" value={liberal} color={colors.blue} />
        <Stat label="Cases" value={game.pendingCases.filter((item) => item.status === "pending").length} />
      </Row>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {game.supremeCourt.justices.map((justice) => (
          <View key={justice.id} style={{ width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: justice.ideology > 0 ? "#f3d9d5" : "#dce9f9" }}>
            <AppText variant="label" color={justice.ideology > 0 ? colors.red : colors.blue}>
              {justice.chief ? "C" : Math.round(Math.abs(justice.ideology))}
            </AppText>
          </View>
        ))}
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
