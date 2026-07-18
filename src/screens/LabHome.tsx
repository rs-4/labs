import React from "react";
import { Linking, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DotGrid } from "@/components/DotGrid";
import { LAB_ENTRIES } from "@/lab";
import { Pressable, ScrollView, Text, View } from "@/tw";

type Props = {
  onOpen: (slug: string) => void;
};

export default function LabHome({ onOpen }: Props) {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === "dark";

  return (
    <View className="will-change-variable flex-1 bg-neutral-50 dark:bg-neutral-950">
      <DotGrid color={isDark ? "#262626" : "#d4d4d4"} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: insets.top + 48,
          paddingBottom: insets.bottom + 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
          / Lab
        </Text>
        <Text className="mt-2 text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          My work
        </Text>
        <Text className="mt-2 max-w-[34ch] text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
          React Native experiments, open sourced.
        </Text>

        <View className="mt-8 gap-4">
          {LAB_ENTRIES.map((entry, index) => (
            <Pressable
              key={entry.slug}
              onPress={() => onOpen(entry.slug)}
              className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm active:scale-[0.98] active:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:active:bg-neutral-800"
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-mono text-[11px] text-neutral-300 tabular-nums dark:text-neutral-600">
                  {String(index + 1).padStart(2, "0")}
                </Text>
                <Text className="text-xl text-neutral-300 dark:text-neutral-600">›</Text>
              </View>
              <Text className="mt-3 text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                {entry.title}
              </Text>
              <Text className="mt-1 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                {entry.description}
              </Text>
              <View className="mt-4 flex-row flex-wrap gap-2">
                {entry.stack.map((tech) => (
                  <Text
                    key={tech}
                    className="rounded-full bg-neutral-100 px-3 py-1 font-mono text-[10px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                  >
                    {tech}
                  </Text>
                ))}
              </View>
            </Pressable>
          ))}
        </View>

        <View className="mt-10 flex-row items-center justify-center gap-3">
          <Pressable
            onPress={() => Linking.openURL("https://github.com/rs-4/labs")}
            className="px-2 py-2 active:opacity-50"
          >
            <Text className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 underline dark:text-neutral-500">
              github.com/rs-4/labs
            </Text>
          </Pressable>
          <Text className="font-mono text-[10px] text-neutral-300 dark:text-neutral-600">·</Text>
          <Pressable
            onPress={() => Linking.openURL("https://rselmi.com")}
            className="px-2 py-2 active:opacity-50"
          >
            <Text className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 underline dark:text-neutral-500">
              rselmi.com
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
