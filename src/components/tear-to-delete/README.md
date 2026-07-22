# tear-to-delete

Delete something by tearing it like a receipt. Drag your finger along the
perforation, the paper rips with a jagged edge that follows your gesture, the
stub sags as it comes loose, and when the tear reaches the other side both
halves fly apart. Release early and the paper heals shut.

## How it works

- **The paper is drawn twice.** The whole receipt (zigzag edges, items,
  barcode, all Skia) is rendered in two `Group`s clipped by complementary
  paths. Intact, the two clips share a straight edge and join seamlessly.
- **The tear is a path, not a mask trick.** A deterministic array of jagged
  offsets is precomputed. As `tearX` advances, both clip paths swap the
  straight perforation for the jagged edge point by point, so the rip follows
  the finger exactly.
- **The stub sags on a moving hinge.** The bottom group rotates around
  `(tearX, tearY)`, the last attached point, so the torn part droops more the
  further you tear. On completion both groups animate out with opposite
  rotations.
- **Haptics are the perforation.** One `selectionAsync` every 26 px of tearing
  reads as the little dots giving way, one medium impact when the tear
  completes. Releasing early springs the tear shut.

## Usage

```tsx
<TearToDelete
  title="RSLAB MART"
  items={[{ label: "OLD REGRETS", price: "9.99" }]}
  total="9.99"
  onTorn={() => removeItem()}
/>
```

## Tuning

- `JAG_STEP` (9) — tear edge resolution, lower is rougher
- `TICK_EVERY` (26) — px of tear per haptic tick
- Sag angle and fall choreography in `bottomTransform` / `topTransform`
- The grab band only covers the perforation, the navigator back swipe stays
  free everywhere else
