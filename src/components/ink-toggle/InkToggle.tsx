import {
  Blur,
  Canvas,
  Circle,
  ColorMatrix,
  Group,
  Image as SkiaImage,
  Paint,
  useImage,
} from "@shopify/react-native-skia";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import React, { useEffect, useRef, useState } from "react";
import {
  Appearance,
  StyleProp,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View as RNView,
  ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { captureScreen } from "react-native-view-shot";
import { Pressable } from "@/tw";

const HEAD_R = 14;
const TAIL_R = 7;

// Sharpens the blurred alpha back into a hard edge — the metaball trick
const GOO_MATRIX = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 40, -18,
];

function splashHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

type InkToggleProps = {
  // where the icon sits inside the screen, e.g. an absolute position.
  // Defaults to centered. The drip always starts under the icon.
  iconStyle?: StyleProp<ViewStyle>;
};

// The trick: on tap we screenshot the current theme, flip the color scheme
// underneath it, then the liquid shapes ERASE the screenshot. The drop and
// the rising wave are literally windows into the new theme, so the wave
// front reveals the other color. No overlay to fade at the end: when the
// flood covers the screen the screenshot is fully erased.
export function InkToggle({ iconStyle }: InkToggleProps) {
  const { width, height } = useWindowDimensions();
  const isDark = useColorScheme() === "dark";
  const [animating, setAnimating] = useState(false);
  // the status bar keeps the OLD theme's style while the wave runs, and
  // flips only when the overlay is gone (the bar is system UI: it is not
  // in the screenshot, so it must not change before the wave covers it)
  const [frozenDark, setFrozenDark] = useState<boolean | null>(null);
  const [shotUri, setShotUri] = useState<string | null>(null);
  const pendingRef = useRef<boolean | null>(null);
  const iconRef = useRef<RNView>(null);
  const shot = useImage(shotUri);

  // icon position in window coords, measured on layout
  const originX = useSharedValue(width / 2);
  const originY = useSharedValue(height * 0.4);

  const sourceR = useSharedValue(0);
  const dropY = useSharedValue(0);
  const dropR = useSharedValue(0);
  // distance between the drop head and its trailing tail: the teardrop shape
  const stretch = useSharedValue(0);
  const poolR = useSharedValue(0);
  const iconScale = useSharedValue(1);

  const floorY = height - 8;
  const poolCy = height + 60;
  // reaches every corner no matter where the wave starts from
  const coverR = Math.hypot(width, height) + 120;

  // the drip forms clearly below the glyph, never touching it
  const measure = () => {
    iconRef.current?.measureInWindow((x, y, w, h) => {
      originX.value = x + w / 2;
      originY.value = y + h / 2 + 52;
    });
  };

  // only unmounts the overlay: the shared values are reset right before
  // the next run. Resetting them here would draw one frame of fully
  // opaque screenshot before React commits the unmount, a visible glitch.
  const cleanup = () => {
    setShotUri(null);
    setFrozenDark(null);
    setAnimating(false);
  };

  const runDrip = () => {
    sourceR.value = 0;
    dropR.value = 0;
    stretch.value = 0;
    poolR.value = 0;

    // swell and hang under the icon, tear off into a stretched teardrop
    sourceR.value = withSequence(
      withTiming(11, { duration: 220, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) })
    );
    dropR.value = withTiming(HEAD_R, {
      duration: 280,
      easing: Easing.out(Easing.quad),
    });
    // the tail lags behind the head while falling, then snaps back at impact
    stretch.value = withDelay(
      280,
      withSequence(
        withTiming(36, { duration: 200, easing: Easing.out(Easing.quad) }),
        withTiming(28, { duration: 120 }),
        withTiming(2, { duration: 60 })
      )
    );

    dropY.value = originY.value;
    dropY.value = withSequence(
      withTiming(originY.value + 16, {
        duration: 280,
        easing: Easing.out(Easing.quad),
      }),
      // free fall, accelerating
      withTiming(
        floorY,
        { duration: 380, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) {
            runOnJS(splashHaptic)();
            // the impact IS the trigger: the drop melts into the wave
            // that surges right where it landed. The wave starts tangent
            // to the bottom edge (r = 60) so it emerges from zero height,
            // with a soft start then a strong liquid surge.
            dropR.value = withTiming(0, { duration: 90 });
            poolR.value = 60;
            poolR.value = withTiming(
              coverR,
              { duration: 650, easing: Easing.bezier(0.33, 0, 0.15, 1) },
              (done) => {
                if (done) runOnJS(cleanup)();
              }
            );
          }
        }
      )
    );
  };

  // wait for the screenshot to be decoded and drawn, then flip the scheme
  // under it and start the drip
  useEffect(() => {
    if (!shot || pendingRef.current === null) return;
    const next = pendingRef.current;
    pendingRef.current = null;
    const t = setTimeout(() => {
      Appearance.setColorScheme(next ? "dark" : "light");
      runDrip();
    }, 48);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shot]);

  const press = async () => {
    if (animating) return;
    setAnimating(true);
    setFrozenDark(isDark);
    iconScale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1, { damping: 12, stiffness: 260 })
    );
    try {
      const uri = await captureScreen({ format: "jpg", quality: 0.9 });
      pendingRef.current = !isDark;
      setShotUri(uri.startsWith("file://") ? uri : `file://${uri}`);
    } catch {
      // no screenshot, flip without the liquid reveal
      Appearance.setColorScheme(isDark ? "light" : "dark");
      setFrozenDark(null);
      setAnimating(false);
    }
  };

  const tailY = useDerivedValue(() => dropY.value - stretch.value);
  const tailR = useDerivedValue(() =>
    Math.min(TAIL_R, 2 + stretch.value * 0.25)
  );

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Fills its parent (mount it at the root of the screen): the icon sits
  // centered by default (or wherever iconStyle puts it), the canvas
  // overlays the content only while animating.
  return (
    <RNView style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <StatusBar style={(frozenDark ?? isDark) ? "light" : "dark"} />
      <RNView style={iconStyle ?? styles.center} pointerEvents="box-none">
        <Pressable onPress={press} hitSlop={16}>
          <Animated.View
            ref={iconRef}
            onLayout={measure}
            style={[styles.icon, iconAnimStyle]}
          >
            <SymbolView
              name={isDark ? "sun.max.fill" : "moon.fill"}
              size={30}
              tintColor={isDark ? "#fafafa" : "#0a0a0a"}
            />
          </Animated.View>
        </Pressable>
      </RNView>

      {/* the Canvas stays mounted so react-native-css never sees siblings
          change and never remounts the subtree mid-animation */}
      <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
        {shot && (
          <>
            <SkiaImage
              image={shot}
              x={0}
              y={0}
              width={width}
              height={height}
              fit="cover"
            />
            {/* goo shapes punch through the screenshot: dstOut erases it */}
            <Group
              layer={
                <Paint blendMode="dstOut">
                  <Blur blur={8} />
                  <ColorMatrix matrix={GOO_MATRIX} />
                </Paint>
              }
            >
              <Circle cx={originX} cy={originY} r={sourceR} color="black" />
              <Circle cx={originX} cy={dropY} r={dropR} color="black" />
              <Circle cx={originX} cy={tailY} r={tailR} color="black" />
              <Circle cx={originX} cy={poolCy} r={poolR} color="black" />
            </Group>
          </>
        )}
      </Canvas>
    </RNView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
});
