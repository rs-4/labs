# Card Expand

The App Store card transition: tap a card in the list and it becomes the
screen. Drag down and it goes back to its slot, pixel perfect. One shared
element, one progress value, zero bounce.

## How it works

- **Measure the card.** On tap, `measureInWindow` gives the card's rect
  in window coordinates. That rect is the entire shared element contract:
  the clone starts there and must land back there.
- **Mount a clone, interpolate the rect.** An overlay renders the same
  card face and a single progress value interpolates its rect from the
  slot to fullscreen. The corner radius travels from the card radius (28)
  to the display radius (55), so fullscreen still hugs the phone corners.
- **One progress drives everything.** A calm Apple-style curve,
  `Easing.bezier(0.32, 0.72, 0, 1)`, no spring. The body fade, the label
  safe-area offset and the background list zoom all read the same value,
  so nothing can desync and the close lands exactly on the origin card.
- **Drag to dismiss.** A pan shrinks the sheet while held. Past 140pt or
  a 900pt/s flick it releases into the close animation, reversed on the
  same curve. Under the threshold it settles back to fullscreen.
- **Coordinate space.** The overlay lives inside the component's
  container, so the origin rect is translated by the container's window
  offset and fullscreen is `-offset`, letting the sheet cover the whole
  screen even when the component is mounted below a header.
- **Fluid card face.** The face fills its animated wrapper (gradient via
  Skia `Fill`, content absolutely positioned), so the title stays pinned
  to the bottom during the whole transition instead of being clipped.

## Usage

```tsx
import { CardExpand, ExpandCard } from "./CardExpand";

const CARDS: ExpandCard[] = [
  {
    id: "focus",
    label: "Featured",
    title: "Deep Focus",
    subtitle: "One line under the title.",
    body: "The long text revealed once the card is fullscreen.",
    colors: ["#3b2f2a", "#8a5a3b"],
  },
];

<CardExpand cards={CARDS} />;
```

## Tuning

- `OPEN_TIMING` (440ms) and `CLOSE_TIMING` (380ms), same bezier.
- `CARD_RADIUS` (28) and the display radius (55) in `sheetStyle`.
- Dismiss thresholds in the pan: 140pt distance or 900pt/s velocity.
- The list zoom (`scale 0.95`, `opacity 0.65`) in `listStyle`.
