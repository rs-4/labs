# Motion Fossil

A gesture becomes a live 3D path, then crystallizes into a metallic sculpture on release.

## How it works

1. Gesture Handler samples the finger path and maps screen position plus velocity into three dimensional points.
2. Three.js updates a continuous ribbon buffer while the finger moves, then shifts its material from emissive clay to reflective metal.
3. Releasing the gesture commits the fossil with a medium haptic. Further drags rotate the preserved object.

## Usage

```tsx
<MotionFossil accent="#D8663C" />
```

## Tuning

- Change the `5` pixel sampling distance to alter trace density.
- Change the ribbon width in `MotionFossilScene.tsx` to alter physical weight.
- Change the gesture velocity multiplier to make depth more or less dramatic.

This experiment uses `react-native-webgpu` and requires a custom development build. It does not run in Expo Go.
