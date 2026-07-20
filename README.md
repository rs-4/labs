# lab

React Native micro-interaction experiments. One folder per animation, each
with its own README, all runnable from a single Expo app with a Lab home
screen.

Live pages: [rselmi.com/lab](https://rselmi.com/lab)

## Animations

| # | Animation | Folder | Description |
| - | --------- | ------ | ----------- |
| 01 | Pull Refresh Island | [`src/components/pull-refresh-island`](src/components/pull-refresh-island) | Gooey pull-to-refresh where a water drop is pulled out of the Dynamic Island. |
| 02 | Ink Toggle | [`src/components/ink-toggle`](src/components/ink-toggle) | A dark mode switch that pours the theme: a drop of ink falls and floods the screen. |
| 03 | Card Expand | [`src/components/card-expand`](src/components/card-expand) | The App Store transition: tap a card, it becomes the screen, drag down to send it back. |
| 04 | Pull Search | [`src/components/pull-search`](src/components/pull-search) | The iOS 26 search: pull the list down, a liquid glass pill grows from the bottom, keyboard opens by itself. |

## Run

```bash
npm install
npm run ios
```

The app opens on the Lab screen. Tap an entry to run its demo, use the
floating "lab" pill to come back.

## Stack

Expo SDK 57, Reanimated 4, Gesture Handler, Skia, NativeWind v5
(Tailwind v4). Most of the liquid effects are metaballs: black shapes on a
Skia canvas with a blur, then a color matrix that sharpens the alpha back
into a hard edge.

## Structure

```
src/
  components/
    <slug>/
      <Component>.tsx   # the reusable component
      Demo.tsx          # the demo screen used by the app
      README.md         # what it is, how it works, tuning knobs
  screens/LabHome.tsx   # the entry list
  lab.tsx               # registry: add your entry here
  tw/                   # NativeWind-wrapped RN primitives
```

## Adding an animation

1. Create `src/components/<slug>/` with the component, a `Demo.tsx` and a `README.md`.
2. Register it in `src/lab.tsx`.
