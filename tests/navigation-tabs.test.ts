import { describe, expect, it } from "vitest";

import { primaryTabs } from "@/navigation/tabs";

describe("primary tab navigation", () => {
  it("exposes exactly four bottom navigation tabs", () => {
    expect(primaryTabs.map((tab) => tab.label)).toEqual(["Dashboard", "Government", "World", "Campaign"]);
  });

  it("groups former bottom tabs into nested sections", () => {
    expect(primaryTabs.find((tab) => tab.id === "government")?.sections.map((section) => section.id)).toEqual(["congress", "court", "states", "policy"]);
    expect(primaryTabs.find((tab) => tab.id === "world")?.sections.map((section) => section.id)).toEqual(["economy", "foreign", "trade", "security"]);
    expect(primaryTabs.find((tab) => tab.id === "campaign")?.sections.map((section) => section.id)).toEqual(["events", "people", "media", "history"]);
  });

  it("keeps settings out of the bottom navigation model", () => {
    expect(primaryTabs.map((tab) => tab.label)).not.toContain("Settings");
  });
});
