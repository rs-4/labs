import "./src/global.css";

import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { LAB_ENTRIES } from "@/lab";
import LabHome from "@/screens/LabHome";
import { Pressable, Text, View } from "@/tw";

function Root() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const entry = LAB_ENTRIES.find((e) => e.slug === activeSlug);

  if (!entry) {
    return <LabHome onOpen={setActiveSlug} />;
  }

  const { Demo } = entry;

  return (
    <View className="flex-1">
      <Demo />
      <Pressable
        onPress={() => setActiveSlug(null)}
        className="absolute left-5 flex-row items-center gap-1.5 rounded-full border border-neutral-300 bg-white/90 px-4 py-2 dark:border-neutral-700 dark:bg-neutral-900/90"
        style={{ bottom: insets.bottom + 16 }}
      >
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">←</Text>
        <Text className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          lab
        </Text>
      </Pressable>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Root />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
