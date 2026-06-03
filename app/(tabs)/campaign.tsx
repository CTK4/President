import * as React from "react";

import { EventsSection, HistorySection, MediaSection, PeopleSection, SectionScreen } from "@/screens/presidency-sections";

export default function Campaign() {
  const [section, setSection] = React.useState<"events" | "people" | "media" | "history">("events");

  return (
    <SectionScreen tabId="campaign" selected={section} onSelect={setSection}>
      {section === "events" ? <EventsSection /> : null}
      {section === "people" ? <PeopleSection /> : null}
      {section === "media" ? <MediaSection /> : null}
      {section === "history" ? <HistorySection /> : null}
    </SectionScreen>
  );
}
