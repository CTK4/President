import * as React from "react";

import { AlertsBriefingsSection, ApprovalSection, CurrentIssueSection, DashboardOverviewSection, SectionScreen } from "@/screens/presidency-sections";

export default function Dashboard() {
  const [section, setSection] = React.useState<"overview" | "approval" | "issue" | "alerts">("overview");

  return (
    <SectionScreen tabId="dashboard" selected={section} onSelect={setSection}>
      {section === "overview" ? <DashboardOverviewSection /> : null}
      {section === "approval" ? <ApprovalSection /> : null}
      {section === "issue" ? <CurrentIssueSection /> : null}
      {section === "alerts" ? <AlertsBriefingsSection /> : null}
    </SectionScreen>
  );
}
