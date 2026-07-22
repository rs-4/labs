import React, { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, View } from "@/tw";
import { TearToDelete } from "./TearToDelete";

export default function TearToDeleteDemo() {
  const insets = useSafeAreaInsets();
  const [gen, setGen] = useState(0);

  return (
    <View className="flex-1 bg-neutral-100 dark:bg-neutral-950">
      <View className="px-6" style={{ paddingTop: insets.top + 24 }}>
        <Text className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
          / Tear to Delete
        </Text>
        <Text className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Receipts
        </Text>
        <Text className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
          drag along the dots to shred
        </Text>
      </View>

      <View className="flex-1 items-center justify-center pb-16">
        <View key={gen}>
          <TearToDelete onTorn={() => setGen((g) => g + 1)} />
        </View>
      </View>

      <View
        className="absolute inset-x-0 items-center"
        style={{ bottom: insets.bottom + 18 }}
      >
        <Text className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
          {gen === 0 ? "nothing shredded yet" : `${gen} shredded`}
        </Text>
      </View>
    </View>
  );
}
