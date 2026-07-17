# Ink Toggle

A dark mode toggle where the night literally falls. Tap the moon: a drop
of night spills out of the glyph, tears off as a real teardrop,
free-falls and hits the bottom of the screen. The impact IS the trigger:
the drop melts into a wave that surges from where it landed and floods
everything. The wave is not paint: it is a window into the other theme,
so the wave front reveals the new color scheme as it climbs. Tap the sun
and the day pours back the same way.

## How it works

- **Screenshot reveal.** On tap the component screenshots the current
  screen (`react-native-view-shot`), draws it full-screen on a Skia
  canvas, then flips `Appearance.setColorScheme` underneath it. The
  liquid shapes are drawn in a layer with `blendMode="dstOut"`, so they
  ERASE the screenshot: the drop and the wave are holes showing the new
  theme. When the flood covers the screen the screenshot is fully erased
  and the overlay unmounts, nothing to fade.
- **Metaball teardrop.** The falling drop is two circles (head + trailing
  tail) in a `Blur` + alpha-sharpening `ColorMatrix` layer. The tail lags
  behind during the fall and snaps back at impact, so the drop reads as a
  stretched teardrop, not a ball.
- **The wave.** A huge circle anchored below the bottom edge, centered on
  the impact point. It starts tangent to the screen (zero visible height)
  and grows with a soft-start bezier, so it emerges out of the edge and
  surges, while the goo merges the shrinking drop into it.
- **Position agnostic.** The icon measures itself with
  `measureInWindow` and the drip starts at the bottom edge of the glyph,
  slightly overlapping it, so the night visibly spills out of the moon.
  The drip and the wave originate from wherever you place the icon (pass
  `iconStyle` to position it).
- **NativeWind theming.** The demo uses `dark:` variants; flipping the
  scheme re-renders the content under the overlay. The themed root View
  needs the `will-change-variable` className, and the Canvas stays
  mounted at all times: otherwise react-native-css remounts the subtree
  mid-animation and kills the overlay.

## Usage

Mount it at the root of a screen (it fills its parent, the canvas
overlays the content while animating):

```tsx
import { InkToggle } from "./InkToggle";

<View className="will-change-variable flex-1 bg-neutral-50 dark:bg-neutral-950">
  {/* your content with dark: variants */}
  <InkToggle iconStyle={{ position: "absolute", top: 64, right: 20 }} />
</View>
```

Requires `"userInterfaceStyle": "automatic"` in `app.json`.

## Tuning

- Drip timings — swell 220ms, hang 280ms, fall 380ms with
  `Easing.in(cubic)`, wave 650ms with `Easing.bezier(0.33, 0, 0.15, 1)`.
- `HEAD_R` / `TAIL_R` and the `stretch` keyframes — the teardrop shape.
- `Blur blur={8}` and `GOO_MATRIX` — stickiness of the liquid.
