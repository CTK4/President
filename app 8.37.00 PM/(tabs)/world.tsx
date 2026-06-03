import * as React from "react";

import { EconomySection, ForeignSection, SecuritySection, SectionScreen, TradeSection } from "@/screens/presidency-sections";

export default function World() {
  const [section, setSection] = React.useState<"economy" | "foreign" | "trade" | "security">("economy");

  return (
    <SectionScreen tabId="world" selected={section} onSelect={setSection}>
      {section === "economy" ? <EconomySection /> : null}
      {section === "foreign" ? <ForeignSection /> : null}
      {section === "trade" ? <TradeSection /> : null}
      {section === "security" ? <SecuritySection /> : null}
    </SectionScreen>
  );
}
