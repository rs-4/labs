import {
  Blur,
  Canvas,
  Circle,
  ColorMatrix,
  Group,
  Paint,
  Path,
  RoundedRect,
  Skia,
} from "@shopify/react-native-skia";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo } from "react";
import { Platform, StyleSheet, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "@/tw";

const ISLAND_WIDTH = 126;
const ISLAND_HEIGHT = 37;
const DROP_RADIUS = 22;
const SPINNER_RADIUS = 9;
const SPRING = { damping: 14, stiffness: 160, mass: 0.8 };

// Sharpens the blurred alpha back into a hard edge — the metaball trick
const GOO_MATRIX = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 40, -18,
];

type Props = {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  className?: string;
  contentContainerClassName?: string;
  children: React.ReactNode;
};

export function PullRefreshIsland({
  onRefresh,
  threshold = 100,
  className,
  contentContainerClassName,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Island devices report a 59pt (iPhone 14 Pro–16) or 62pt (16 Pro) top inset
  const hasIsland = Platform.OS === "ios" && insets.top >= 59;

  const cx = width / 2;
  // Island sits 48pt above the bottom of the top inset on every island device
  const islandTop = insets.top - 48;
  const islandCenterY = islandTop + ISLAND_HEIGHT / 2;
  const holdY = insets.top + 52;
  const canvasHeight = holdY + DROP_RADIUS + 60;

  const pull = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const refreshing = useSharedValue(0);
  const spin = useSharedValue(0);

  const finish = useCallback(() => {
    refreshing.value = 0;
    pull.value = withSpring(0, SPRING);
    cancelAnimation(spin);
    // the drop gets absorbed back into the island
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [pull, refreshing, spin]);

  const start = useCallback(async () => {
    // the drop just detached from the island
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    spin.value = 0;
    spin.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 900, easing: Easing.linear }),
      -1
    );
    try {
      await onRefresh();
    } finally {
      finish();
    }
  }, [onRefresh, finish, spin]);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const native = Gesture.Native();
  const pan = Gesture.Pan()
    .simultaneousWithExternalGesture(native)
    // vertical only: let the navigator's horizontal back swipe win
    .activeOffsetY([-10, 10])
    .failOffsetX([-15, 15])
    .onChange((e) => {
      if (refreshing.value === 1) return;
      if (pull.value > 0 || (scrollY.value <= 0 && e.changeY > 0)) {
        const resistance = pull.value > threshold ? 0.3 : 0.55;
        pull.value = Math.max(0, pull.value + e.changeY * resistance);
      }
    })
    .onEnd(() => {
      if (refreshing.value === 1) return;
      if (pull.value >= threshold) {
        refreshing.value = 1;
        pull.value = withSpring(threshold, SPRING);
        runOnJS(start)();
      } else {
        pull.value = withSpring(0, SPRING);
      }
    });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pull.value }],
  }));

  // --- Goo geometry ---
  // Source shape: the island itself, or a bump hidden above the screen edge
  const sourceX = hasIsland ? cx - ISLAND_WIDTH / 2 : cx - 70;
  const sourceY = hasIsland ? islandTop : -40;
  const sourceWidth = hasIsland ? ISLAND_WIDTH : 140;
  const sourceBaseHeight = hasIsland ? ISLAND_HEIGHT : 34;

  // 0 -> 1 when the refresh starts, back to 0 when it ends
  const refreshP = useDerivedValue(() =>
    withTiming(refreshing.value, { duration: 250 })
  );

  const sourceHeight = useDerivedValue(() => {
    const stretch = interpolate(
      pull.value,
      [0, threshold],
      [0, hasIsland ? 10 : 20],
      Extrapolation.CLAMP
    );
    // the island relaxes back to its normal shape once the refresh starts
    return sourceBaseHeight + stretch * (1 - refreshP.value);
  });

  const dropStartY = hasIsland ? islandCenterY : -12;

  const dropCy = useDerivedValue(() =>
    interpolate(
      pull.value,
      [0, threshold, threshold * 3],
      [dropStartY, holdY, holdY + 40],
      Extrapolation.CLAMP
    )
  );

  const dropR = useDerivedValue(() =>
    interpolate(
      pull.value,
      [0, threshold * 0.35, threshold],
      [4, 12, DROP_RADIUS],
      Extrapolation.CLAMP
    )
  );

  // --- Progress ring: fills 0 -> 100% with the pull, drawn inside the drop ---
  const progressPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc(
      {
        x: -SPINNER_RADIUS,
        y: -SPINNER_RADIUS,
        width: SPINNER_RADIUS * 2,
        height: SPINNER_RADIUS * 2,
      },
      -90,
      359.9
    );
    return path;
  }, []);

  const progressEnd = useDerivedValue(() =>
    interpolate(pull.value, [0, threshold], [0, 1], Extrapolation.CLAMP)
  );

  const progressOpacity = useDerivedValue(
    () =>
      interpolate(
        pull.value,
        [threshold * 0.4, threshold * 0.75],
        [0, 1],
        Extrapolation.CLAMP
      ) *
      (1 - refreshP.value)
  );

  const progressTransform = useDerivedValue(() => [
    { translateX: cx },
    { translateY: dropCy.value },
  ]);

  // --- Spinner: takes over from the progress ring while refreshing ---
  const spinnerPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc(
      {
        x: -SPINNER_RADIUS,
        y: -SPINNER_RADIUS,
        width: SPINNER_RADIUS * 2,
        height: SPINNER_RADIUS * 2,
      },
      0,
      270
    );
    return path;
  }, []);

  const spinnerTransform = useDerivedValue(() => [
    { translateX: cx },
    { translateY: dropCy.value },
    { rotate: spin.value },
  ]);

  return (
    <View className={className ?? "flex-1 bg-neutral-100"}>
      <GestureDetector gesture={pan}>
        <GestureDetector gesture={native}>
          <Animated.ScrollView
            onScroll={onScroll}
            scrollEventThrottle={16}
            bounces={false}
            overScrollMode="never"
            showsVerticalScrollIndicator={false}
            style={contentStyle}
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 32,
            }}
          >
            <View className={contentContainerClassName ?? "flex-1"}>
              {children}
            </View>
          </Animated.ScrollView>
        </GestureDetector>
      </GestureDetector>

      <Canvas
        pointerEvents="none"
        style={[styles.canvas, { height: canvasHeight }]}
      >
        <Group
          layer={
            <Paint>
              <Blur blur={6} />
              <ColorMatrix matrix={GOO_MATRIX} />
            </Paint>
          }
        >
          <RoundedRect
            x={sourceX}
            y={sourceY}
            width={sourceWidth}
            height={sourceHeight}
            r={sourceBaseHeight / 2}
            color="black"
          />
          <Circle cx={cx} cy={dropCy} r={dropR} color="black" />
        </Group>

        <Group transform={progressTransform} opacity={progressOpacity}>
          <Path
            path={progressPath}
            start={0}
            end={progressEnd}
            style="stroke"
            strokeWidth={2.5}
            strokeCap="round"
            color="white"
          />
        </Group>

        <Group transform={spinnerTransform} opacity={refreshP}>
          <Path
            path={spinnerPath}
            style="stroke"
            strokeWidth={2.5}
            strokeCap="round"
            color="white"
          />
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});
