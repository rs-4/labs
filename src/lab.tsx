import type { ComponentType } from "react";
import InkToggleDemo from "./components/ink-toggle/Demo";
import PullRefreshIslandDemo from "./components/pull-refresh-island/Demo";

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
];
