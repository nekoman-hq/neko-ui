import React, { useMemo, useRef } from "react";
import { Text, View } from "react-native";
import {
  ProgressBarDashProps,
  ProgressBarProps,
  ProgressBarThemeProviderProps,
} from "./ProgressBar.types";
import Animated, {
  createAnimatedComponent,
  DerivedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import MaskedView from "@react-native-masked-view/masked-view";
import { cssInterop } from "nativewind";
import clsx from "clsx";
import { ThemeProvider } from "../ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
const AnimatedGradient = createAnimatedComponent(LinearGradient);

export const ProgressBar = ({
  value = 0,
  maxValue,
  dashes = 1,
  dashGap = 10,
  className,
  backgroundClassName,
  colors,
}: ProgressBarProps) => {
  const maxWidth = useSharedValue(0);

  const progressBarStyle = useAnimatedStyle(() => {
    const percent = Math.min(maxValue ? value / maxValue : value / 100, 1);
    const progressWidth = withTiming(percent * maxWidth.value);
    return {
      width: progressWidth,
    };
  });

  const dashWidth = useDerivedValue(() => {
    return (maxWidth.value - (dashes - 1) * dashGap) / dashes;
  }, [dashes, dashGap]);

  const dashArray = useMemo(() => {
    return Array.from({ length: dashes }).map((_, index) => index);
  }, []);

  const gradientStyle = useAnimatedStyle(() => ({
    width: maxWidth.value,
    height: "100%",
  }));

  return (
    <View
      className={"w-full rounded-md h-4 items-start"}
      onLayout={(event) => {
        maxWidth.value = event.nativeEvent.layout.width;
      }}
    >
      <Animated.View
        style={[progressBarStyle, { gap: dashGap }]}
        className={clsx(
          "h-full rounded-md flex flex-row overflow-hidden z-20",
          className,
        )}
      >
        <MaskedView
          className={"items-start flex flex-row overflow-hidden"}
          maskElement={
            <View
              style={[{ gap: dashGap }]}
              className={"h-full w-full  rounded-md flex flex-row "}
            >
              {dashArray.map((v) => (
                <Dash
                  width={dashWidth}
                  key={`Dash-${v}`}
                  className={"!bg-progress-active"}
                />
              ))}
            </View>
          }
        >
          {colors ? (
            <AnimatedGradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              colors={colors}
              style={gradientStyle}
            />
          ) : (
            <View className={"w-screen h-full bg-progress-active"} />
          )}
        </MaskedView>
      </Animated.View>

      <View
        className={"h-full w-full flex-row absolute z-10"}
        style={{ gap: dashGap }}
      >
        {dashArray.map((v) => (
          <Dash
            width={dashWidth}
            key={`Dash-${v}`}
            className={clsx("!bg-progress-inactive", backgroundClassName)}
          />
        ))}
      </View>
    </View>
  );
};

const Dash = ({ width, className }: ProgressBarDashProps) => {
  const style = useAnimatedStyle(() => ({
    width: width.value,
  }));

  return (
    <Animated.View
      className={clsx("h-full rounded-md", className)}
      style={style}
    />
  );
};

export const ProgressBarThemeProvider = ({
  theme,
  children,
  className,
}: ProgressBarThemeProviderProps) => {
  return (
    <ThemeProvider className={clsx("w-full", className)} theme={theme}>
      {children}
    </ThemeProvider>
  );
};
