import { Ionicons } from "@expo/vector-icons";
import { Link, Tabs } from "expo-router";
import { Pressable } from "react-native";

import { colors } from "@/components/ui";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.line,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Ionicons name="speedometer-outline" color={color} size={size} />,
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable accessibilityLabel="Open settings" accessibilityRole="button" style={{ paddingHorizontal: 16, minHeight: 44, justifyContent: "center" }}>
                <Ionicons name="settings-outline" color={colors.ink} size={22} />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="government"
        options={{
          title: "Government",
          tabBarIcon: ({ color, size }) => <Ionicons name="business-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="world"
        options={{
          title: "World",
          tabBarIcon: ({ color, size }) => <Ionicons name="globe-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="campaign"
        options={{
          title: "Campaign",
          tabBarIcon: ({ color, size }) => <Ionicons name="megaphone-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
