import type { ComponentType } from "react";
import CardExpandDemo from "./components/card-expand/Demo";
import InkToggleDemo from "./components/ink-toggle/Demo";
import PullRefreshIslandDemo from "./components/pull-refresh-island/Demo";
import PullSearchDemo from "./components/pull-search/Demo";

export type LabEntry = {
  slug: string;
  title: string;
  description: string;
  stack: string[];
  Demo: ComponentType;
};

export const LAB_ENTRIES: LabEntry[] = [
  {
    slug: "pull-refresh-island",
    title: "Pull Refresh Island",
    description:
      "A gooey pull-to-refresh where a water drop is pulled out of the Dynamic Island.",
    stack: ["Reanimated", "Skia", "Gesture Handler"],
    Demo: PullRefreshIslandDemo,
  },
  {
    slug: "ink-toggle",
    title: "Ink Toggle",
    description:
      "A dark mode switch that pours the theme: a drop of ink falls and floods the screen.",
    stack: ["Reanimated", "Skia", "NativeWind"],
    Demo: InkToggleDemo,
  },
  {
    slug: "card-expand",
    title: "Card Expand",
    description:
      "The App Store transition: tap a card, it becomes the screen, drag down to send it back to its slot.",
    stack: ["Reanimated", "Gesture Handler"],
    Demo: CardExpandDemo,
  },
  {
    slug: "pull-search",
    title: "Pull Search",
    description:
      "The iOS 26 search: pull the list down, a liquid glass pill grows from the bottom and the keyboard opens by itself.",
    stack: ["Reanimated", "Blur", "Haptics"],
    Demo: PullSearchDemo,
  },
];
