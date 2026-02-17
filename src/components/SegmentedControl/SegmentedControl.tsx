import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import type {
  SegmentContext,
  SegmentedControlProps,
  SegmentedItemProps,
  SegmentThemeProviderProps,
} from "@/src/components/SegmentedControl/SegmentedControl.types";
import Animated, {
  Easing,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import clsx from "clsx";

import { ThemeProvider } from "@/src/components/ThemeProvider";

const duration = 700;
const config = {
  duration,
  easing: Easing.bezier(0.71, 0.11, 0.15, 1),
  reduceMotion: ReduceMotion.System,
};
const configWidth = {
  duration: duration / 2,
  easing: Easing.bezier(1, 0.05, 0.47, 0.76),
  reduceMotion: ReduceMotion.System,
};

const defaultValues: SegmentContext = {
  onChange(label: string): void {},
  value: "",
  changeRenderLabelLayout: false,
  onLayoutPress(layout: {
    x: number;
    width: number;
    haptic?: boolean;
  }): void {},
};

const SegmentContext = createContext<SegmentContext<any>>(defaultValues);

const useSegment = () => useContext(SegmentContext);

export function SegmentedControl<T>({
  value,
  children,
  onChange,
  renderLabel,
  changeRenderLabelLayout = false,
}: SegmentedControlProps<T>) {
  const translateX = useSharedValue(0);
  const width = useSharedValue(0);
  const height = useSharedValue(100);
  const containerWidth = useSharedValue(0);

  const timerRef = useRef<NodeJS.Timeout | number | null>(null);

  const initialRef = useRef(true);

  const onLayoutPress = useCallback(
    ({
      x,
      width: newWidth,
      haptic = true,
    }: {
      x: number;
      width: number;
      haptic?: boolean;
    }) => {
      if (initialRef.current) {
        // Beim ersten Mal: Werte sofort setzen (ohne Animation)
        translateX.value = x;
        width.value = newWidth;
        height.value = 100;
        containerWidth.value = newWidth;
        initialRef.current = false;

        // Falls du beim initialen Set kein Haptics willst, rufe mit haptic=false auf
        if (haptic) {
          // kleiner, optionaler Haptics-Call ohne Delay
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
            () => {},
          );
        }

        return;
      }

      translateX.value = withTiming(x, config);
      width.value = withSequence(
        withTiming(20, configWidth),
        withTiming(newWidth, configWidth),
      );
      height.value = withSequence(
        withTiming(0, configWidth),
        withTiming(100, configWidth),
      );
      containerWidth.value = withTiming(newWidth, { duration });

      timerRef.current = setTimeout(() => {
        if (haptic) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
            () => {},
          );
        }
      }, duration * 0.8);
    },
    [],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    width: containerWidth.value,
    left: translateX.value,
  }));

  const innerAnimatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    height: `${height.value}%`,
  }));

  useEffect(() => {
    return () => {
      timerRef.current && clearTimeout(timerRef.current);
    };
  }, []);

  const values = useMemo<SegmentContext<T>>(
    () => ({
      onLayoutPress,
      value,
      changeRenderLabelLayout: changeRenderLabelLayout,
      renderLabel,
      onChange,
    }),
    [onLayoutPress, renderLabel, changeRenderLabelLayout, onChange, value],
  );

  return (
    <SegmentContext.Provider value={values}>
      <View className={"w-full gap-[10px] relative"}>
        <ScrollView
          keyboardShouldPersistTaps={"always"}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          horizontal={true}
          className={"min-w-full z-10 overflow-visible"}
          contentContainerClassName={
            "justify-between min-w-full gap-[20px] overflow-visible"
          }
        >
          {children}

          <Animated.View
            className={"h-full absolute -z-10 items-center justify-center"}
            style={[animatedStyle]}
          >
            <Animated.View
              className={clsx(
                "bg-segment-background h-full rounded-[8px] min-h-[16px] shadow shadow-segment-background",
              )}
              style={[
                {
                  shadowRadius: 5,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                },
                innerAnimatedStyle,
              ]}
            />
          </Animated.View>
        </ScrollView>
      </View>
    </SegmentContext.Provider>
  );
}

export function Segment({ label }: SegmentedItemProps) {
  const {
    onChange,
    value,
    onLayoutPress,
    changeRenderLabelLayout,
    renderLabel,
  } = useSegment();

  const isActive = useMemo(() => value === label, [value, label]);

  const [layout, setLayout] = useState<
    { x: number; width: number } | undefined
  >();
  const [activeColor, setActiveColor] = useState(isActive);

  useEffect(() => {
    let timeout: NodeJS.Timeout | number;
    if (isActive) {
      timeout = setTimeout(() => setActiveColor(true), 500); // Delay in ms
    } else {
      timeout = setTimeout(() => setActiveColor(false), 200);
    }
    return () => clearTimeout(timeout);
  }, [isActive]);

  const onLayoutFunction = (e: LayoutChangeEvent) => {
    if (layout && !changeRenderLabelLayout) return;

    const { x, width: w } = e.nativeEvent.layout;

    if (isActive) {
      onLayoutPress({ x, width: w, haptic: false });
    }

    setLayout({ x, width: w });
  };

  useEffect(() => {
    if (isActive && layout) onLayoutPress(layout);
  }, [isActive]);

  const Content = () => (
    <Pressable
      hitSlop={20}
      onLayout={changeRenderLabelLayout ? undefined : onLayoutFunction}
      onPress={() => {
        if (layout) {
          onChange(label);
        }
      }}
      className={"py-[5px] px-[10px]"}
    >
      <Text
        className={clsx(
          "text-base font-medium",
          activeColor ? "text-segment-active" : "text-segment-inactive",
        )}
      >
        {renderLabel ? renderLabel(label, activeColor) : label}
      </Text>
    </Pressable>
  );

  return changeRenderLabelLayout ? (
    <Animated.View onLayout={onLayoutFunction} layout={LinearTransition}>
      {Content()}
    </Animated.View>
  ) : (
    Content()
  );
}

export const SegmentThemeProvider = ({
  children,
  theme,
}: SegmentThemeProviderProps) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
