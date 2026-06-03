export type PrimaryTabId = "dashboard" | "government" | "world" | "campaign";

export type SectionId =
  | "overview"
  | "approval"
  | "issue"
  | "alerts"
  | "congress"
  | "court"
  | "states"
  | "policy"
  | "economy"
  | "foreign"
  | "trade"
  | "security"
  | "events"
  | "people"
  | "media"
  | "history";

export type PrimaryTabConfig = {
  id: PrimaryTabId;
  label: string;
  route: `/(tabs)/${PrimaryTabId}`;
  sections: Array<{
    id: SectionId;
    label: string;
  }>;
};

export const primaryTabs: PrimaryTabConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    route: "/(tabs)/dashboard",
    sections: [
      { id: "overview", label: "Overview" },
      { id: "approval", label: "Approval" },
      { id: "issue", label: "Current Issue" },
      { id: "alerts", label: "Briefings" },
    ],
  },
  {
    id: "government",
    label: "Government",
    route: "/(tabs)/government",
    sections: [
      { id: "congress", label: "Congress" },
      { id: "court", label: "Court" },
      { id: "states", label: "States" },
      { id: "policy", label: "Policy" },
    ],
  },
  {
    id: "world",
    label: "World",
    route: "/(tabs)/world",
    sections: [
      { id: "economy", label: "Economy" },
      { id: "foreign", label: "Foreign Affairs" },
      { id: "trade", label: "Trade" },
      { id: "security", label: "Security" },
    ],
  },
  {
    id: "campaign",
    label: "Campaign",
    route: "/(tabs)/campaign",
    sections: [
      { id: "events", label: "Events" },
      { id: "people", label: "People" },
      { id: "media", label: "Media" },
      { id: "history", label: "History" },
    ],
  },
];
