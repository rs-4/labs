import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PULL_THRESHOLD = 90;
const COMPACT = 46;
// calm surface curve, no overshoot
const OPEN_EASING = Easing.bezier(0.32, 0.72, 0, 1);
// real Liquid Glass on iOS 26, blur fallback everywhere else
const HAS_GLASS = isLiquidGlassAvailable();

export type PullSearchProps = {
  placeholder?: string;
  query: string;
  onQueryChange: (query: string) => void;
  children: React.ReactNode;
};

export function PullSearch({
  placeholder = "Search",
  query,
  onQueryChange,
  children,
}: PullSearchProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const { width: screenW } = useWindowDimensions();

  const inputRef = useRef<TextInput>(null);
  const [active, setActive] = useState(false);

  const pull = useSharedValue(0);
  const open = useSharedValue(0);
  const armed = useSharedValue(0);
  const expand = useSharedValue(0);
  const keyboard = useAnimatedKeyboard();

  const buzz = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const activate = useCallback(() => {
    setActive(true);
    // continuous handoff: start the open animation from the current pull progress
    open.value = Math.min(Math.max(pull.value, 0), 1);
    open.value = withTiming(1, { duration: 340, easing: OPEN_EASING });
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, pull]);

  const deactivate = useCallback(() => {
    setActive(false);
    inputRef.current?.clear();
    onQueryChange("");
    open.value = withTiming(0, { duration: 280, easing: OPEN_EASING });
  }, [open, onQueryChange]);

  // interactive keyboard dismiss does not blur the input, listen to the keyboard
  // itself. Only deactivate if the keyboard actually showed: with a hardware
  // keyboard (simulator) willHide fires without a willShow and would close
  // the search instantly.
  const activeRef = useRef(false);
  activeRef.current = active;
  const kbShownRef = useRef(false);
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardWillShow", () => {
      kbShownRef.current = true;
    });
    const hideSub = Keyboard.addListener("keyboardWillHide", () => {
      if (!activeRef.current || !kbShownRef.current) return;
      kbShownRef.current = false;
      inputRef.current?.blur();
      deactivate();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [deactivate]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      pull.value = y < 0 ? Math.min(-y / PULL_THRESHOLD, 1.25) : 0;
      if (pull.value >= 1 && armed.value === 0) {
        armed.value = 1;
        expand.value = withTiming(1, { duration: 300, easing: OPEN_EASING });
        runOnJS(buzz)();
      } else if (pull.value < 0.4 && armed.value === 1) {
        armed.value = 0;
        expand.value = withTiming(0, { duration: 240, easing: OPEN_EASING });
      }
    },
    onEndDrag: () => {
      if (pull.value >= 1 && open.value === 0) {
        runOnJS(activate)();
      }
    },
  });

  // pill: a compact loupe bubble during the pull, expands to the full input
  // past the threshold, docks above the keyboard when active.
  // IMPORTANT: never animate opacity here. UIGlassEffect stops rendering when
  // any parent has opacity 0, so the pill hides by sliding below the screen.
  const hideOffset = COMPACT + insets.bottom + 24;
  const pillStyle = useAnimatedStyle(() => {
    const show = Math.max(Math.min(pull.value, 1), open.value);
    const ex = Math.max(expand.value, open.value);
    const width = interpolate(ex, [0, 1], [COMPACT, screenW - 32]);
    const lift = Math.max(keyboard.height.value - insets.bottom - 12 + 8, 0);
    return {
      width,
      left: (screenW - width) / 2,
      transform: [
        { translateY: interpolate(show, [0, 1], [hideOffset, 0]) - lift },
        { scale: interpolate(show, [0, 1], [0.92, 1]) },
      ],
    };
  });

  const compactStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(expand.value, open.value),
  }));

  const rowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      Math.max(expand.value, open.value),
      [0.6, 1],
      [0, 1],
      "clamp"
    ),
  }));

  return (
    <>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Animated.ScrollView>

      <Animated.View
        style={[
          styles.pill,
          { bottom: insets.bottom + 12 },
          // clipping a UIGlassEffect view rasterizes it to a flat blur,
          // so the container only clips in the blur fallback case
          HAS_GLASS
            ? styles.noClip
            : dark
              ? styles.pillDark
              : styles.pillLight,
          pillStyle,
        ]}
        pointerEvents={active ? "auto" : "none"}
      >
        {HAS_GLASS ? (
          <GlassView
            glassEffectStyle="regular"
            isInteractive
            style={[StyleSheet.absoluteFill, styles.glass]}
          />
        ) : (
          <BlurView
            intensity={70}
            tint={
              dark ? "systemChromeMaterialDark" : "systemChromeMaterialLight"
            }
            style={StyleSheet.absoluteFill}
          />
        )}
        {/* compact stage: a lone loupe, centered */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.center, compactStyle]}
        >
          <SymbolView
            name="magnifyingglass"
            size={18}
            tintColor={dark ? "#9ca3af" : "#6b7280"}
          />
        </Animated.View>

        {/* expanded stage: the full search field */}
        <Animated.View style={[styles.row, rowStyle]}>
          <SymbolView
            name="magnifyingglass"
            size={17}
            tintColor={dark ? "#9ca3af" : "#6b7280"}
          />
          <TextInput
            ref={inputRef}
            defaultValue={query}
            onChangeText={onQueryChange}
            placeholder={placeholder}
            placeholderTextColor={dark ? "#71717a" : "#9ca3af"}
            style={[styles.input, { color: dark ? "#fafafa" : "#171717" }]}
            returnKeyType="search"
            autoCorrect={false}
            onSubmitEditing={() => inputRef.current?.blur()}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => {
                inputRef.current?.clear();
                onQueryChange("");
              }}
              hitSlop={8}
            >
              <SymbolView
                name="xmark.circle.fill"
                size={17}
                tintColor={dark ? "#52525b" : "#c4c4c8"}
              />
            </Pressable>
          )}
        </Animated.View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    height: COMPACT,
    borderRadius: COMPACT / 2,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    shadowOpacity: 0.16,
    shadowColor: "#000",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
  },
  glass: {
    borderRadius: COMPACT / 2,
  },
  noClip: {
    overflow: "visible",
  },
  pillLight: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.65)",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  pillDark: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(20,20,23,0.35)",
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
});
