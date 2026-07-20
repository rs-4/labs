# pull-search

The iOS 26 search pattern: pull the list down, a liquid glass search pill grows
from the bottom of the screen, the keyboard opens by itself and the pill stays
docked right above it. Drag the keyboard down to dismiss everything.

## How it works

- **Overscroll as progress.** The scroll view's negative `contentOffset.y` maps
  to a 0..1 pull value. The pill's opacity, scale and translateY derive from it,
  so the gesture drives the reveal directly, no spring involved.
- **Two-stage reveal.** During the pull the pill is a compact centered loupe
  bubble. Crossing the threshold expands it to the full-width field (animated
  width + centered left), the loupe cross-fades into the input row.
- **Haptic arming.** Crossing the threshold fires one light haptic. Releasing
  past it focuses the hidden `TextInput`, which brings the keyboard up.
- **Keyboard docking.** `useAnimatedKeyboard` from Reanimated streams the
  keyboard height every frame, the pill's translateY subtracts it, so the pill
  rides the keyboard animation pixel-perfect, including the interactive drag
  dismiss (`keyboardDismissMode="interactive"`).
- **Glass.** Real Liquid Glass via `expo-glass-effect` on iOS 26
  (`isLiquidGlassAvailable`), `expo-blur` chrome material as the fallback.
  Two device-only traps: animating `opacity` on the pill kills UIGlassEffect
  entirely (it renders fine in the simulator, flat on a real iPhone), so the
  pill hides by sliding below the screen edge instead. And `overflow: hidden`
  on the container rasterizes the glass to a plain blur, the radius lives on
  the `GlassView` itself.
- **Typing stays native.** The `TextInput` is uncontrolled (`defaultValue`), the
  query is lifted through `onChangeText` only, so fast typing never drops a
  character while the list re-renders.

## Usage

```tsx
const [query, setQuery] = useState("");

<PullSearch placeholder="Search apps" query={query} onQueryChange={setQuery}>
  <YourFilteredList query={query} />
</PullSearch>
```

## Tuning

- `PULL_THRESHOLD` (90) — pull distance to arm the search
- `OPEN_EASING` — calm bezier (0.32, 0.72, 0, 1), no overshoot on purpose
- Pill metrics in `styles.pill` (height 52, radius 26, margins 16)
