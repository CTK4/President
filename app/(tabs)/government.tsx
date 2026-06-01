import * as React from "react";

import { CongressSection, CourtSection, PolicySection, SectionScreen, StatesSection } from "@/screens/presidency-sections";

export default function Government() {
  const [section, setSection] = React.useState<"congress" | "court" | "states" | "policy">("congress");

  return (
    <SectionScreen tabId="government" selected={section} onSelect={setSection}>
      {section === "congress" ? <CongressSection /> : null}
      {section === "court" ? <CourtSection /> : null}
      {section === "states" ? <StatesSection /> : null}
      {section === "policy" ? <PolicySection /> : null}
    </SectionScreen>
  );
}
