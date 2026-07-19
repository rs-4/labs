import {
  ArrowRight01Icon,
  GithubIcon,
  Globe02Icon,
  NewTwitterIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { Linking, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { View as RNView } from "react-native";
import { DotGrid } from "@/components/DotGrid";
import { InkToggle, InkToggleHandle } from "@/components/ink-toggle/InkToggle";
import { LAB_ENTRIES } from "@/lab";
import { Pressable, ScrollView, Text, View } from "@/tw";

type Props = {
  onOpen: (slug: string) => void;
};

export default function LabHome({ onOpen }: Props) {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === "dark";
  const inkRef = React.useRef<InkToggleHandle>(null);
  const themeBtnRef = React.useRef<RNView>(null);

  const pourTheme = () => {
    themeBtnRef.current?.measureInWindow((x, y, w, h) => {
      inkRef.current?.pour(x + w / 2, y + h + 30);
    });
  };

  return (
    <View className="will-change-variable flex-1 bg-neutral-50 dark:bg-neutral-950">
      <DotGrid color={isDark ? "#262626" : "#d4d4d4"} opacity={0.45} />
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
          / rslab
        </Text>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            My work
          </Text>
          <Pressable onPress={pourTheme} hitSlop={12} className="active:opacity-60">
            <RNView
              ref={themeBtnRef}
              collapsable={false}
              style={{
                width: 36,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SymbolView
                name={isDark ? "sun.max.fill" : "moon.fill"}
                size={22}
                tintColor={isDark ? "#fafafa" : "#0a0a0a"}
              />
            </RNView>
          </Pressable>
        </View>
        <Text className="mt-2 max-w-[34ch] text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
          React Native experiments, open sourced.
        </Text>

        <View className="mt-8 gap-4">
          {LAB_ENTRIES.map((entry, index) => (
            <Pressable
              key={entry.slug}
              onPress={() => onOpen(entry.slug)}
              className="border border-neutral-200 bg-white p-5 shadow-sm active:scale-[0.98] active:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:active:bg-neutral-800"
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-mono text-[11px] text-neutral-300 tabular-nums dark:text-neutral-600">
                  {String(index + 1).padStart(2, "0")}
                </Text>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  color={isDark ? "#525252" : "#a3a3a3"}
                />
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
                    className="rounded-full border border-neutral-300 bg-neutral-100 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {tech}
                  </Text>
                ))}
              </View>
            </Pressable>
          ))}
        </View>

        <View className="mt-10 flex-row flex-wrap items-center justify-center gap-2">
          {[
            {
              icon: GithubIcon,
              label: "rs-4/labs",
              url: "https://github.com/rs-4/labs",
            },
            {
              icon: Globe02Icon,
              label: "rselmi.com",
              url: "https://rselmi.com",
            },
            {
              icon: NewTwitterIcon,
              label: "@rsStats_",
              url: "https://x.com/rsStats_",
            },
          ].map((link) => (
            <Pressable
              key={link.label}
              onPress={() => Linking.openURL(link.url)}
              className="flex-row items-center gap-1.5 px-2 py-2 active:opacity-50"
            >
              <HugeiconsIcon
                icon={link.icon}
                size={13}
                color={isDark ? "#737373" : "#a3a3a3"}
              />
              <Text className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
                {link.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <InkToggle ref={inkRef} hideIcon />
    </View>
  );
}
