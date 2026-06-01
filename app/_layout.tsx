import { Stack } from "expo-router";
import * as React from "react";

import { hydrateGame } from "@/state/game-store";

export default function RootLayout() {
  React.useEffect(() => {
    void hydrateGame();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerBackButtonDisplayMode: "minimal",
        headerTransparent: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "President Simulator" }} />
      <Stack.Screen name="setup/index" options={{ title: "New Presidency" }} />
      <Stack.Screen name="setup/vp" options={{ title: "Vice President" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
