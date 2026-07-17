import React from "react";
import { Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DotGrid } from "@/components/DotGrid";
import { LAB_ENTRIES } from "@/lab";
import { Pressable, ScrollView, Text, View } from "@/tw";

type Props = {
  onOpen: (slug: string) => void;
};

export default function LabHome({ onOpen }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-neutral-50">
      <DotGrid />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: insets.top + 48,
          paddingBottom: insets.bottom + 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">
          / Lab
        </Text>
        <Text className="mt-2 text-4xl font-bold tracking-tight text-neutral-900">
          My work
        </Text>
        <Text className="mt-2 max-w-[34ch] text-base leading-relaxed text-neutral-500">
          React Native experiments, open sourced.
        </Text>

        <View className="mt-8 gap-4">
          {LAB_ENTRIES.map((entry, index) => (
            <Pressable
              key={entry.slug}
              onPress={() => onOpen(entry.slug)}
              className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm active:scale-[0.98] active:bg-neutral-100"
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-mono text-[11px] text-neutral-300 tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </Text>
                <Text className="text-xl text-neutral-300">›</Text>
              </View>
              <Text className="mt-3 text-xl font-semibold text-neutral-900">
                {entry.title}
              </Text>
              <Text className="mt-1 text-sm leading-relaxed text-neutral-500">
                {entry.description}
              </Text>
              <View className="mt-4 flex-row flex-wrap gap-2">
                {entry.stack.map((tech) => (
                  <Text
                    key={tech}
                    className="rounded-full bg-neutral-100 px-3 py-1 font-mono text-[10px] text-neutral-500"
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
            <Text className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 underline">
              github.com/rs-4/labs
            </Text>
          </Pressable>
          <Text className="font-mono text-[10px] text-neutral-300">·</Text>
          <Pressable
            onPress={() => Linking.openURL("https://rselmi.com")}
            className="px-2 py-2 active:opacity-50"
          >
            <Text className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 underline">
              rselmi.com
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
