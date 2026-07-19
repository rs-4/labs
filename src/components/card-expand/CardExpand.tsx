import { Canvas, Fill, LinearGradient, vec } from "@shopify/react-native-skia";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  StyleSheet,
  View as RNView,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  SharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@/tw";

export type ExpandCard = {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  body: string;
  colors: [string, string];
};

type Rect = { x: number; y: number; width: number; height: number };

const CARD_HEIGHT = 360;
const CARD_RADIUS = 28;
// calm, Apple-like curve: fast start, soft landing, zero bounce
const EASE = Easing.bezier(0.32, 0.72, 0, 1);
const OPEN_TIMING = { duration: 440, easing: EASE };
const CLOSE_TIMING = { duration: 380, easing: EASE };

function CardFace({
  card,
  contentStyle,
}: {
  card: ExpandCard;
  contentStyle?: React.ComponentProps<typeof Animated.View>["style"];
}) {
  return (
    <RNView style={{ width: "100%", height: "100%" }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(420, 560)}
            colors={card.colors}
          />
        </Fill>
      </Canvas>
      <Animated.View style={[styles.faceContent, contentStyle]}>
        <Text className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/70">
          {card.label}
        </Text>
        <RNView style={{ flex: 1 }} />
        <Text className="text-3xl font-bold tracking-tight text-white">
          {card.title}
        </Text>
        <Text className="mt-1 text-[15px] leading-snug text-white/80">
          {card.subtitle}
        </Text>
      </Animated.View>
    </RNView>
  );
}

function ExpandedOverlay({
  card,
  origin,
  offset,
  listProgress,
  onClosed,
}: {
  card: ExpandCard;
  origin: Rect;
  // window position of the container, so fullscreen = negative offset
  offset: { x: number; y: number };
  // the list zoom follows the same progress, so open and close land in sync
  listProgress: SharedValue<number>;
  onClosed: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const o = {
    x: origin.x - offset.x,
    y: origin.y - offset.y,
    width: origin.width,
    height: origin.height,
  };
  const fullX = -offset.x;
  const fullY = -offset.y;
  // 0 = sitting in the list, 1 = fullscreen
  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(1, OPEN_TIMING);
    listProgress.value = withTiming(1, OPEN_TIMING);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // drag and rect resolve together, same curve, no bounce
    dragY.value = withTiming(0, CLOSE_TIMING);
    listProgress.value = withTiming(0, CLOSE_TIMING);
    progress.value = withTiming(0, CLOSE_TIMING, (done) => {
      if (done) runOnJS(onClosed)();
    });
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      dragY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (dragY.value > 140 || e.velocityY > 900) {
        runOnJS(close)();
      } else {
        dragY.value = withTiming(0, { duration: 220, easing: EASE });
      }
    });

  // the drag shrinks the sheet, App Store style
  const dragScale = useDerivedValue(() =>
    interpolate(dragY.value, [0, 400], [1, 0.86], Extrapolation.CLAMP)
  );

  const sheetStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      position: "absolute",
      left: interpolate(p, [0, 1], [o.x, fullX]),
      top: interpolate(p, [0, 1], [o.y, fullY]),
      width: interpolate(p, [0, 1], [o.width, width]),
      height: interpolate(p, [0, 1], [o.height, height]),
      // ends on the display corner radius, so fullscreen still reads
      // rounded like the phone itself
      borderRadius: interpolate(p, [0, 1], [CARD_RADIUS, 55]),
      overflow: "hidden",
      transform: [
        { translateY: dragY.value * 0.6 },
        { scale: dragScale.value },
      ],
    };
  });

  const faceStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [o.width, width]),
    height: interpolate(
      progress.value,
      [0, 1],
      [o.height, Math.min(height * 0.52, 460)]
    ),
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.55, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(progress.value, [0.55, 1], [24, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const closeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.7, 1], [0, 1], Extrapolation.CLAMP),
  }));

  // the label slides below the status bar as the card reaches the top
  const labelPadStyle = useAnimatedStyle(() => ({
    paddingTop: interpolate(
      progress.value,
      [0, 1],
      [22, insets.top + 14],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.sheet, sheetStyle]}>
        <Animated.View style={faceStyle}>
          <CardFace card={card} contentStyle={labelPadStyle} />
        </Animated.View>

        <Animated.View style={[styles.body, bodyStyle]}>
          <Text className="text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
            {card.body}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.close, closeStyle]}>
          <Pressable
            onPress={close}
            hitSlop={12}
            className="h-8 w-8 items-center justify-center rounded-full bg-black/25"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} color="#ffffff" />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

type CardExpandProps = {
  cards: ExpandCard[];
  topInset?: number;
};

export function CardExpand({ cards, topInset = 0 }: CardExpandProps) {
  const { width } = useWindowDimensions();
  const cardWidth = width - 40;
  const refs = useRef<Record<string, RNView | null>>({});
  const containerRef = useRef<RNView>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [open, setOpen] = useState<{ card: ExpandCard; rect: Rect } | null>(
    null
  );
  const openP = useSharedValue(0);

  const openCard = (card: ExpandCard) => {
    refs.current[card.id]?.measureInWindow((x, y, w, h) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setOpen({ card, rect: { x, y, width: w, height: h } });
    });
  };

  const closed = () => {
    setOpen(null);
  };



  // the list gently zooms out behind the expanding card
  const listStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - openP.value * 0.05 }],
    opacity: 1 - openP.value * 0.35,
  }));

  return (
    <RNView
      ref={containerRef}
      style={{ flex: 1 }}
      onLayout={() =>
        containerRef.current?.measureInWindow((x, y) => setOffset({ x, y }))
      }
    >
      <Animated.View style={[{ flex: 1 }, listStyle]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: topInset,
            paddingBottom: 48,
            gap: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {cards.map((card) => (
            <Pressable key={card.id} onPress={() => openCard(card)}>
              <RNView
                ref={(r) => {
                  refs.current[card.id] = r;
                }}
                style={[
                  styles.card,
                  {
                    width: cardWidth,
                    height: CARD_HEIGHT,
                    opacity: open?.card.id === card.id ? 0 : 1,
                  },
                ]}
              >
                <CardFace card={card} />
              </RNView>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {open && (
        <ExpandedOverlay
          card={open.card}
          origin={open.rect}
          offset={offset}
          listProgress={openP}
          onClosed={closed}
        />
      )}
    </RNView>
  );
}

const styles = StyleSheet.create({
  faceContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 22,
  },
  card: {
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  sheet: {
    backgroundColor: "#ffffff",
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  close: {
    position: "absolute",
    top: 58,
    right: 20,
  },
});
