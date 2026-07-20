import React, { useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, View } from "@/tw";
import { PullSearch } from "./PullSearch";

type Item = { name: string; category: string; tone: string };

const ITEMS: Item[] = [
  { name: "Arc", category: "Browser", tone: "#7a4a2b" },
  { name: "Bear", category: "Notes", tone: "#3b2f2a" },
  { name: "Callsheet", category: "Movies", tone: "#1a1d24" },
  { name: "Craft", category: "Docs", tone: "#4a5568" },
  { name: "Darkroom", category: "Photo", tone: "#8a5a3b" },
  { name: "Fantastical", category: "Calendar", tone: "#7a2d2d" },
  { name: "Flighty", category: "Travel", tone: "#2d4a7a" },
  { name: "Halide", category: "Camera", tone: "#3d3d44" },
  { name: "Ivory", category: "Social", tone: "#5a3b8a" },
  { name: "Linear", category: "Work", tone: "#2b2f3a" },
  { name: "Overcast", category: "Podcasts", tone: "#d9a066" },
  { name: "Pixelmator", category: "Photo", tone: "#7a4a2b" },
  { name: "Raycast", category: "Tools", tone: "#8a3b3b" },
  { name: "Reeder", category: "RSS", tone: "#3b5a48" },
  { name: "Sofa", category: "Downtime", tone: "#4a3b5a" },
  { name: "Structured", category: "Planner", tone: "#2d5a5a" },
  { name: "Things", category: "Tasks", tone: "#2b3a5a" },
  { name: "Zenly", category: "Maps", tone: "#5a4a2b" },
];

export default function PullSearchDemo() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ITEMS;
    return ITEMS.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <PullSearch placeholder="Search apps" query={query} onQueryChange={setQuery}>
        <View className="px-6 pb-32" style={{ paddingTop: insets.top + 24 }}>
          <Text className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
            / Pull Search
          </Text>
          <Text className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Library
          </Text>
          <Text className="mt-2 mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
            pull down to search
          </Text>

          {items.map((item) => (
            <View
              key={item.name}
              className="flex-row items-center gap-3 border-b border-neutral-200/70 py-3 dark:border-neutral-800/70"
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-[10px]"
                style={{ backgroundColor: item.tone }}
              >
                <Text className="text-base font-semibold text-white/90">
                  {item.name[0]}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-medium text-neutral-900 dark:text-neutral-50">
                  {item.name}
                </Text>
                <Text className="text-[12px] text-neutral-400 dark:text-neutral-500">
                  {item.category}
                </Text>
              </View>
            </View>
          ))}

          {items.length === 0 && (
            <Text className="pt-10 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
              no results
            </Text>
          )}
        </View>
      </PullSearch>
    </View>
  );
}
