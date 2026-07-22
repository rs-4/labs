import {
  Canvas,
  DashPathEffect,
  Group,
  Line,
  Path,
  Rect,
  Skia,
  Text as SkText,
  matchFont,
  vec,
} from "@shopify/react-native-skia";
import { createAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo } from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  Easing,
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export type ReceiptItem = { label: string; price: string };

export type TearToDeleteProps = {
  width?: number;
  title?: string;
  items?: ReceiptItem[];
  total?: string;
  onTorn?: () => void;
};

const TOOTH = 10; // zigzag edge tooth width
const JAG_STEP = 9; // jagged tear resolution
const TICK_EVERY = 26; // px of tear per haptic tick

const fontTitle = matchFont({
  fontFamily: "Menlo",
  fontSize: 16,
  fontWeight: "bold",
});
const fontBody = matchFont({ fontFamily: "Menlo", fontSize: 13 });
const fontBold = matchFont({
  fontFamily: "Menlo",
  fontSize: 14,
  fontWeight: "bold",
});
const fontHint = matchFont({ fontFamily: "Menlo", fontSize: 10 });

const RIP_SOURCES = [
  require("./sounds/rip1.wav"),
  require("./sounds/rip2.wav"),
  require("./sounds/rip3.wav"),
  require("./sounds/rip4.wav"),
];
const RIP_FINAL = require("./sounds/rip-final.wav");

export function TearToDelete({
  width = 320,
  title = "RSLAB MART",
  items = [
    { label: "OLD REGRETS", price: "9.99" },
    { label: "DOOM SCROLL 2H", price: "0.00" },
    { label: "UNUSED SUBS x4", price: "12.99" },
  ],
  total = "22.98",
  onTorn,
}: TearToDeleteProps) {
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  // layout
  const padX = 22;
  const headerH = 64;
  const rowH = 26;
  const itemsTop = headerH + 18;
  const totalY = itemsTop + items.length * rowH + 22;
  const tearY = totalY + 30;
  const stubH = 74; // barcode stub below the perforation
  const height = tearY + stubH;

  // deterministic jagged offsets along the tear line
  const jags = useMemo(() => {
    const n = Math.ceil(width / JAG_STEP) + 1;
    return Array.from({ length: n }, (_, i) => {
      const r = Math.abs(Math.sin(i * 12.9898 + 4.1) * 43758.5453) % 1;
      return (r - 0.5) * 9;
    });
  }, [width]);

  const tearX = useSharedValue(0); // torn length from the starting edge
  const tearDir = useSharedValue(0); // 0 = tearing from the left, 1 = from the right
  const fall = useSharedValue(0);
  const done = useSharedValue(0);
  const lastTick = useSharedValue(-1);

  // one player per sample so rapid ticks can overlap
  const players = useMemo(
    () => RIP_SOURCES.map((src) => createAudioPlayer(src)),
    []
  );
  const finalPlayer = useMemo(() => createAudioPlayer(RIP_FINAL), []);
  React.useEffect(() => {
    return () => {
      players.forEach((p) => p.release());
      finalPlayer.release();
    };
  }, [players, finalPlayer]);

  const tick = useCallback(() => {
    Haptics.selectionAsync();
    // really irregular: random sample, random pitch, sometimes a double rip
    const p = players[Math.floor(Math.random() * players.length)];
    p.setPlaybackRate(0.75 + Math.random() * 0.6);
    p.seekTo(0);
    p.play();
    if (Math.random() < 0.25) {
      const p2 = players[Math.floor(Math.random() * players.length)];
      setTimeout(() => {
        p2.setPlaybackRate(0.8 + Math.random() * 0.5);
        p2.seekTo(0);
        p2.play();
      }, 30 + Math.random() * 50);
    }
  }, [players]);
  const rip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    finalPlayer.setPlaybackRate(0.9 + Math.random() * 0.2);
    finalPlayer.seekTo(0);
    finalPlayer.play();
  }, [finalPlayer]);
  const finished = useCallback(() => {
    onTorn?.();
  }, [onTorn]);

  const complete = useCallback(() => {
    "worklet";
    done.value = 1;
    runOnJS(rip)();
    fall.value = withTiming(
      1,
      { duration: 520, easing: Easing.in(Easing.quad) },
      (ok) => {
        if (ok) runOnJS(finished)();
      }
    );
  }, [done, fall, rip, finished]);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-28, 28])
    .onStart((e) => {
      if (done.value === 1 || tearX.value > 0) return;
      // tear from whichever edge you start closest to
      tearDir.value = e.x < width / 2 ? 0 : 1;
    })
    .onChange((e) => {
      if (done.value === 1) return;
      const fromEdge = tearDir.value === 0 ? e.x : width - e.x;
      tearX.value = Math.min(Math.max(fromEdge, 0), width);
      const step = Math.floor(tearX.value / TICK_EVERY);
      if (step !== lastTick.value) {
        lastTick.value = step;
        runOnJS(tick)();
      }
      if (tearX.value >= width * 0.97) complete();
    })
    .onEnd(() => {
      if (done.value === 1) return;
      // released early: the paper heals, calm curve, no bounce
      lastTick.value = -1;
      tearX.value = withTiming(0, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });
    });

  // zigzag helper for top and bottom paper edges
  const zigzag = (path: ReturnType<typeof Skia.Path.Make>, y: number, dir: 1 | -1) => {
    const teeth = Math.ceil(width / TOOTH);
    for (let i = 0; i <= teeth; i++) {
      const x = dir === 1 ? i * TOOTH : width - i * TOOTH;
      const yy = i % 2 === 0 ? y : y + (dir === 1 ? -5 : 5);
      path.lineTo(Math.min(Math.max(x, 0), width), yy);
    }
  };

  // top piece: full paper above the tear, jagged where already torn
  const topClip = useDerivedValue(() => {
    const p = Skia.Path.Make();
    p.moveTo(0, -20);
    p.lineTo(width, -20);
    p.lineTo(width, tearY);
    for (let x = width; x >= 0; x -= JAG_STEP) {
      const torn =
        tearDir.value === 0 ? x <= tearX.value : x >= width - tearX.value;
      const j = torn ? jags[Math.floor(x / JAG_STEP)] : 0;
      p.lineTo(x, tearY + j);
    }
    p.close();
    return p;
  });

  // bottom piece: complement, same jag so the edges match
  const bottomClip = useDerivedValue(() => {
    const p = Skia.Path.Make();
    p.moveTo(0, height + 20);
    p.lineTo(width, height + 20);
    p.lineTo(width, tearY);
    for (let x = width; x >= 0; x -= JAG_STEP) {
      const torn =
        tearDir.value === 0 ? x <= tearX.value : x >= width - tearX.value;
      const j = torn ? jags[Math.floor(x / JAG_STEP)] : 0;
      p.lineTo(x, tearY + j);
    }
    p.close();
    return p;
  });

  // the torn part of the stub sags around the moving hinge, then falls
  const hinge = useDerivedValue(() =>
    vec(tearDir.value === 0 ? tearX.value : width - tearX.value, tearY)
  );
  const bottomTransform = useDerivedValue(() => {
    const sign = tearDir.value === 0 ? -1 : 1;
    const sag = (tearX.value / width) * 0.12 * sign;
    return [
      { rotate: sag + fall.value * 0.45 * sign },
      { translateY: fall.value * 560 },
      { translateX: fall.value * 40 * sign },
    ];
  });
  const topTransform = useDerivedValue(() => [
    { translateY: fall.value * -420 },
    { rotate: fall.value * 0.22 },
  ]);
  const fadeOut = useDerivedValue(() => 1 - fall.value * fall.value);

  // paper outline with zigzag edges
  const paper = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(0, 6);
    zigzag(p, 6, 1);
    p.lineTo(width, height - 6);
    zigzag(p, height - 6, -1);
    p.close();
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  const paperColor = dark ? "#F4F1E8" : "#FFFDF6";
  const inkColor = "#2B2B28";
  const fadedInk = "#8A8578";

  const drawing = (
    <>
      <Path path={paper} color={paperColor} />
      <SkText
        x={width / 2 - fontTitle.measureText(title).width / 2}
        y={38}
        text={title}
        font={fontTitle}
        color={inkColor}
      />
      <Line
        p1={vec(padX, headerH)}
        p2={vec(width - padX, headerH)}
        color={fadedInk}
        strokeWidth={1}
      >
        <DashPathEffect intervals={[4, 4]} />
      </Line>
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          <SkText
            x={padX}
            y={itemsTop + i * rowH + 14}
            text={it.label}
            font={fontBody}
            color={inkColor}
          />
          <SkText
            x={width - padX - fontBody.measureText(it.price).width}
            y={itemsTop + i * rowH + 14}
            text={it.price}
            font={fontBody}
            color={inkColor}
          />
        </React.Fragment>
      ))}
      <SkText x={padX} y={totalY} text="TOTAL" font={fontBold} color={inkColor} />
      <SkText
        x={width - padX - fontBold.measureText(total).width}
        y={totalY}
        text={total}
        font={fontBold}
        color={inkColor}
      />
      {/* perforation */}
      <Line
        p1={vec(0, tearY)}
        p2={vec(width, tearY)}
        color={fadedInk}
        strokeWidth={1.4}
      >
        <DashPathEffect intervals={[6, 5]} />
      </Line>
      <SkText
        x={width / 2 - fontHint.measureText("TEAR HERE").width / 2}
        y={tearY - 7}
        text="TEAR HERE"
        font={fontHint}
        color={fadedInk}
      />
      {/* barcode stub */}
      {Array.from({ length: 34 }, (_, i) => {
        const r = Math.abs(Math.sin(i * 7.7 + 2) * 43758.5453) % 1;
        const w = r > 0.66 ? 4 : r > 0.33 ? 2.5 : 1.5;
        return (
          <Rect
            key={i}
            x={padX + 8 + i * ((width - padX * 2 - 16) / 34)}
            y={tearY + 18}
            width={w}
            height={36}
            color={inkColor}
          />
        );
      })}
    </>
  );

  return (
    <View style={{ width, height }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group clip={topClip} transform={topTransform} opacity={fadeOut}>
          {drawing}
        </Group>
        <Group
          clip={bottomClip}
          origin={hinge}
          transform={bottomTransform}
          opacity={fadeOut}
        >
          {drawing}
        </Group>
      </Canvas>
      {/* grab band along the perforation only, so the back swipe stays free elsewhere */}
      <GestureDetector gesture={pan}>
        <View
          style={{
            position: "absolute",
            left: 0,
            width,
            top: tearY - 34,
            height: 68,
          }}
        />
      </GestureDetector>
    </View>
  );
}
