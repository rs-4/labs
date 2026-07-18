import React, { useCallback, useState } from "react";
import { Text, View } from "@/tw";
import { PullRefreshIsland } from "./PullRefreshIsland";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function PullRefreshIslandDemo() {
  const [generation, setGeneration] = useState(0);

  const handleRefresh = useCallback(async () => {
    await wait(1800);
    setGeneration((g) => g + 1);
  }, []);

  return (
    <View className="will-change-variable flex-1 bg-neutral-50 dark:bg-neutral-900">
      <PullRefreshIsland
        className="flex-1"
        contentContainerClassName="flex-1 items-center justify-center gap-1"
        onRefresh={handleRefresh}
      >
        <Text className="text-sm text-neutral-400 dark:text-neutral-500">pull to refresh</Text>
        <Text className="text-xs text-neutral-300 dark:text-neutral-600">refresh #{generation}</Text>
      </PullRefreshIsland>
    </View>
  );
}
