import { Canvas, Points, vec } from "@shopify/react-native-skia";
import React, { useMemo } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";

type Props = {
  spacing?: number;
  size?: number;
  color?: string;
  opacity?: number;
};

export function DotGrid({
  spacing = 24,
  size = 2.5,
  color = "#d4d4d4",
  opacity = 1,
}: Props) {
  const { width, height } = useWindowDimensions();

  const points = useMemo(() => {
    const pts = [];
    for (let x = spacing / 2; x < width; x += spacing) {
      for (let y = spacing / 2; y < height; y += spacing) {
        pts.push(vec(x, y));
      }
    }
    return pts;
  }, [width, height, spacing]);

  return (
    <Canvas pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Points
        points={points}
        mode="points"
        strokeWidth={size}
        strokeCap="round"
        color={color}
      />
    </Canvas>
  );
}
