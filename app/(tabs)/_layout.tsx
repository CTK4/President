import { Tabs } from "expo-router";

import { colors } from "@/components/ui";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="events" options={{ title: "Events" }} />
      <Tabs.Screen name="people" options={{ title: "People" }} />
      <Tabs.Screen name="congress" options={{ title: "Congress" }} />
      <Tabs.Screen name="court" options={{ title: "Court" }} />
      <Tabs.Screen name="states" options={{ title: "States" }} />
      <Tabs.Screen name="economy" options={{ title: "Economy" }} />
      <Tabs.Screen name="foreign" options={{ title: "Foreign" }} />
      <Tabs.Screen name="media" options={{ title: "Media" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
