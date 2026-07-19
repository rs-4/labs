import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, View } from "@/tw";
import { CardExpand, ExpandCard } from "./CardExpand";

const CARDS: ExpandCard[] = [
  {
    id: "focus",
    label: "Featured",
    title: "Deep Focus",
    subtitle: "The apps that kill your notifications for you.",
    body: "The trick behind this transition: the card you tap is measured in window coordinates, then a clone is mounted in an overlay and spring-animated from that exact rect to fullscreen. The list zooms out behind it. Drag down to send it back to its slot: same spring, reversed, and the clone lands pixel-perfect where it came from.",
    colors: ["#3b2f2a", "#8a5a3b"],
  },
  {
    id: "night",
    label: "Collection",
    title: "Night Shift",
    subtitle: "Six apps that work while you sleep.",
    body: "Nothing here is a screen or a navigator. It is one shared element: the card face component is rendered twice, once in the list and once in the overlay, and only the rect interpolates. Corner radius, header height and body opacity all derive from a single progress value, so the motion can never desync.",
    colors: ["#1a1d24", "#4a5568"],
  },
  {
    id: "morning",
    label: "How to",
    title: "Slow Mornings",
    subtitle: "A calmer start, one habit at a time.",
    body: "The dismiss is the App Store one: the pan shrinks the sheet with a growing corner radius, and past a distance or velocity threshold it releases into the close spring. Under the threshold it snaps back to fullscreen. The background list follows the same progress the whole way.",
    colors: ["#7a4a2b", "#d9a066"],
  },
];

export default function CardExpandDemo() {
  const insets = useSafeAreaInsets();

  return (
    <View className="will-change-variable flex-1 bg-neutral-50 dark:bg-neutral-950">
      <View className="px-6" style={{ paddingTop: insets.top + 24 }}>
        <Text className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
          / Card Expand
        </Text>
        <Text className="mt-1 mb-4 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Today
        </Text>
      </View>
      <CardExpand cards={CARDS} />
    </View>
  );
}
