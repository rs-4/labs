import {
  ArrowLeft01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import React, {
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MotionFossilScene = React.lazy(() => import("./MotionFossilScene"));
const HAS_LIQUID_GLASS = isLiquidGlassAvailable();

export type FossilPoint = {
  x: number;
  y: number;
  z: number;
};

export type FossilController = {
  points: FossilPoint[];
  revision: number;
  phase: "drawing" | "solid";
  crystallize: number;
  crystallizeTarget: number;
  rotationX: number;
  rotationY: number;
  rotationTargetX: number;
  rotationTargetY: number;
  zoom: number;
  zoomTarget: number;
  velocity: number;
  viewportWidth: number;
  viewportHeight: number;
};

type MotionFossilProps = {
  accent?: string;
  onBack: () => void;
};

function createPresetFossil(): FossilPoint[] {
  return Array.from({ length: 96 }, (_, index) => {
    const t = (index / 95) * Math.PI * 2;
    const envelope = 0.82 + Math.sin(t * 2.5) * 0.2;
    return {
      x: Math.sin(t * 1.5) * 2.15 * envelope,
      y: Math.cos(t) * 3.05,
      z: Math.sin(t * 2.7) * 1.05 + Math.cos(t * 0.7) * 0.3,
    };
  });
}

async function freezeHaptic() {
  if (process.env.EXPO_OS === "ios") {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } else if (process.env.EXPO_OS === "android") {
    await Haptics.performAndroidHapticsAsync(
      Haptics.AndroidHaptics.Gesture_End
    );
  }
}

async function resetHaptic() {
  if (process.env.EXPO_OS === "ios") {
    await Haptics.selectionAsync();
  } else if (process.env.EXPO_OS === "android") {
    await Haptics.performAndroidHapticsAsync(
      Haptics.AndroidHaptics.Segment_Tick
    );
  }
}

export function MotionFossil({
  accent = "#F26A3D",
  onBack,
}: MotionFossilProps) {
  const insets = useSafeAreaInsets();
  const [, setPhase] = useState<"drawing" | "solid">("solid");
  const controller = useRef<FossilController>({
    points: createPresetFossil(),
    revision: 1,
    phase: "solid",
    crystallize: 1,
    crystallizeTarget: 1,
    rotationX: -0.12,
    rotationY: 0.32,
    rotationTargetX: -0.12,
    rotationTargetY: 0.32,
    zoom: 1,
    zoomTarget: 1,
    velocity: 0,
    viewportWidth: 1,
    viewportHeight: 1,
  });
  const interaction = useRef<"draw" | "rotate">("rotate");
  const rotationStart = useRef({ x: 0, y: 0 });
  const zoomStart = useRef(1);
  const lastScreenPoint = useRef({ x: -100, y: -100 });

  const appendPoint = useCallback(
    (screenX: number, screenY: number, speed: number) => {
      const state = controller.current;
      if (state.points.length >= 180) return;

      const distance = Math.hypot(
        screenX - lastScreenPoint.current.x,
        screenY - lastScreenPoint.current.y
      );
      if (distance < 4 && state.points.length > 0) return;

      lastScreenPoint.current = { x: screenX, y: screenY };
      const normalizedX = screenX / Math.max(state.viewportWidth, 1) - 0.5;
      const normalizedY = 0.5 - screenY / Math.max(state.viewportHeight, 1);
      const index = state.points.length;

      state.points.push({
        x: normalizedX * 5.4,
        y: normalizedY * 9.4,
        z:
          Math.sin(index * 0.38) * 0.72 +
          Math.cos((normalizedX - normalizedY) * 5.5) * 0.32 +
          Math.min(speed / 2000, 1) * 0.72,
      });
      state.velocity = Math.min(speed / 1800, 1);
      state.revision += 1;
    },
    []
  );

  const beginNewTrace = useCallback(() => {
    const state = controller.current;
    state.points = [];
    state.revision += 1;
    state.phase = "drawing";
    state.crystallize = 0;
    state.crystallizeTarget = 0;
    state.rotationTargetX = 0;
    state.rotationTargetY = 0;
    state.zoomTarget = 1;
    lastScreenPoint.current = { x: -100, y: -100 };
    setPhase("drawing");
    void resetHaptic();
  }, []);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    controller.current.viewportWidth = event.nativeEvent.layout.width;
    controller.current.viewportHeight = event.nativeEvent.layout.height;
  }, []);

  const gestures = useMemo(() => {
    const pan = Gesture.Pan()
      .runOnJS(true)
      .minDistance(0)
      .maxPointers(1)
      .onBegin((event) => {
        const state = controller.current;
        interaction.current = state.phase === "solid" ? "rotate" : "draw";
        rotationStart.current = {
          x: state.rotationTargetX,
          y: state.rotationTargetY,
        };
        if (interaction.current === "draw") {
          appendPoint(event.x, event.y, 0);
        }
      })
      .onUpdate((event) => {
        const state = controller.current;
        if (interaction.current === "rotate") {
          state.rotationTargetY =
            rotationStart.current.y + event.translationX * 0.008;
          state.rotationTargetX = Math.max(
            -1.2,
            Math.min(1.2, rotationStart.current.x + event.translationY * 0.006)
          );
          state.velocity = Math.min(
            Math.hypot(event.velocityX, event.velocityY) / 2200,
            1
          );
          return;
        }

        appendPoint(
          event.x,
          event.y,
          Math.hypot(event.velocityX, event.velocityY)
        );
      })
      .onEnd(() => {
        const state = controller.current;
        state.velocity = 0;
        if (interaction.current !== "draw" || state.points.length < 6) return;

        state.phase = "solid";
        state.crystallizeTarget = 1;
        setPhase("solid");
        void freezeHaptic();
      });

    const pinch = Gesture.Pinch()
      .runOnJS(true)
      .onBegin(() => {
        zoomStart.current = controller.current.zoomTarget;
      })
      .onUpdate((event) => {
        controller.current.zoomTarget = Math.max(
          0.62,
          Math.min(2.25, zoomStart.current * event.scale)
        );
      });

    return Gesture.Simultaneous(pan, pinch);
  }, [appendPoint]);

  return (
    <GestureDetector gesture={gestures}>
      <View
        accessible
        accessibilityLabel="Full screen interactive three dimensional motion trace"
        accessibilityHint="Draw with one finger, rotate after release, and pinch with two fingers to zoom"
        onLayout={onLayout}
        style={styles.container}
      >
        <Suspense
          fallback={
            <View style={styles.loader}>
              <ActivityIndicator color={accent} />
            </View>
          }
        >
          <MotionFossilScene controller={controller} accent={accent} />
        </Suspense>

        <View
          pointerEvents="none"
          style={[styles.brandLockup, { top: insets.top + 18 }]}
        >
          <View style={styles.brandRow}>
            <Text selectable style={styles.brandName}>/ RSLAB</Text>
            <Text selectable style={styles.brandIndex}>EXPERIMENT 08</Text>
          </View>
          <Text selectable style={styles.sceneTitle}>Motion Fossil</Text>
          <Text selectable style={styles.sceneCaption}>
            GESTURE PRESERVED IN THREE DIMENSIONS
          </Text>
        </View>

        <View style={[styles.backButton, { bottom: insets.bottom + 24 }]}>
          {HAS_LIQUID_GLASS ? (
            <GlassView
              glassEffectStyle="regular"
              isInteractive
              style={[StyleSheet.absoluteFill, styles.smallGlass]}
            />
          ) : (
            <BlurView
              intensity={72}
              tint="systemChromeMaterialDark"
              style={[StyleSheet.absoluteFill, styles.smallGlass]}
            />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to experiments"
            hitSlop={8}
            onPress={onBack}
            style={({ pressed }) => [
              styles.backPressable,
              pressed && styles.addPressed,
            ]}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View
          style={[styles.addButton, { bottom: insets.bottom + 18 }]}
        >
          {HAS_LIQUID_GLASS ? (
            <GlassView
              glassEffectStyle="regular"
              isInteractive
              style={[StyleSheet.absoluteFill, styles.glass]}
            />
          ) : (
            <BlurView
              intensity={72}
              tint="systemChromeMaterialDark"
              style={[StyleSheet.absoluteFill, styles.glass]}
            />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create a new motion trace"
            hitSlop={8}
            onPress={beginNewTrace}
            style={({ pressed }) => [
              styles.addPressable,
              pressed && styles.addPressed,
            ]}
          >
            <HugeiconsIcon icon={PlusSignIcon} size={27} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
  brandLockup: {
    position: "absolute",
    left: 20,
    right: 20,
    gap: 6,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandName: {
    fontFamily: "Courier",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.8,
    color: "rgba(255,255,255,0.72)",
  },
  brandIndex: {
    fontFamily: "Courier",
    fontSize: 8,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.36)",
    fontVariant: ["tabular-nums"],
  },
  sceneTitle: {
    fontSize: 39,
    fontWeight: "700",
    letterSpacing: -1.6,
    lineHeight: 42,
    color: "#FFFFFF",
  },
  sceneCaption: {
    fontFamily: "Courier",
    fontSize: 8,
    letterSpacing: 1.15,
    color: "rgba(255,255,255,0.4)",
  },
  backButton: {
    position: "absolute",
    left: 18,
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  smallGlass: {
    borderRadius: 25,
    overflow: "hidden",
  },
  backPressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
  },
  addButton: {
    position: "absolute",
    right: 18,
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  glass: {
    borderRadius: 31,
    overflow: "hidden",
  },
  addPressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 31,
  },
  addPressed: {
    transform: [{ scale: 0.9 }],
    opacity: 0.72,
  },
});
