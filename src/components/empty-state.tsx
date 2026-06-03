import { Link } from "expo-router";

import { AppText, Button, Card, Screen } from "@/components/ui";

export function EmptyState() {
  return (
    <Screen>
      <Card>
        <AppText variant="subtitle">No active presidency</AppText>
        <Link href="/setup" asChild>
          <Button label="Start Setup" onPress={() => {}} tone="red" />
        </Link>
      </Card>
    </Screen>
  );
}
