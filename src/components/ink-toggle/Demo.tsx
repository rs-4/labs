import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, View } from "@/tw";
import { InkToggle } from "./InkToggle";

export default function InkToggleDemo() {
  const insets = useSafeAreaInsets();

  return (
    <View className="will-change-variable flex-1 bg-neutral-50 dark:bg-neutral-950">
      <View
        className="flex-1 px-6"
        style={{ paddingTop: insets.top + 48 }}
      >
        <Text className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
          / Ink Toggle
        </Text>
        <Text className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Dark mode, poured.
        </Text>
        <Text className="mt-2 max-w-[34ch] text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
          Tap the moon and the night drips out of it, floods the screen,
          and the theme follows. Tap the sun to pour the day back.
        </Text>

        <View className="mt-8 gap-3">
          {[1, 2].map((i) => (
            <View
              key={i}
              className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <View className="h-3 w-24 rounded-full bg-neutral-200 dark:bg-neutral-700" />
              <View className="mt-3 h-2.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800" />
              <View className="mt-2 h-2.5 w-2/3 rounded-full bg-neutral-100 dark:bg-neutral-800" />
            </View>
          ))}
        </View>
      </View>

      <InkToggle
        iconStyle={{
          position: "absolute",
          top: insets.top + 40,
          right: 20,
        }}
      />
    </View>
  );
}
