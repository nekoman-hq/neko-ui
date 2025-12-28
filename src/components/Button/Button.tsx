import React, {
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ButtonProps } from "./Button.types";
import * as Haptics from "expo-haptics";
import clsx from "clsx";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  createAnimatedComponent,
} from "react-native-reanimated";
import { Pressable, Text, TextProps } from "react-native";

const AnimatedPressable = createAnimatedComponent(Pressable);

export const Button = ({
  onPress,
  onPressIn,
  onLongPress,
  onHold,
  haptics = true,
  disabled,
  disableTime,
  children,
  className,
  ...props
}: ButtonProps) => {
  const scale = useSharedValue(1);

  const [timerDisabled, setTimerDisabled] = useState(false);
  const timerRef = useRef<number | null>(null);

  const startAnimation = (value: number) => {
    scale.value = withTiming(value, { duration: 150 });
  };

  const finishAnimation = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  const intervalId = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      timerRef.current && clearTimeout(timerRef.current);
      intervalId.current && clearInterval(intervalId.current);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={animatedStyle}
      className={clsx(
        "bg-primary p-2 px-4 flex rounded-xl",
        disabled && "bg-primary/70",
        className,
      )}
      onPress={(e) => {
        if (onPress) {
          onPress(e);
          if (disableTime) {
            setTimerDisabled(true);
            timerRef.current = setTimeout(() => {
              setTimerDisabled(false);
            }, disableTime);
          }
        }
      }}
      onPressIn={(event) => {
        onPressIn && onPressIn(event);
        startAnimation(0.95);
      }}
      disabled={disabled || timerDisabled}
      onLongPress={(event) => {
        onLongPress && onLongPress(event);
        if (intervalId.current === null) {
          intervalId.current = setInterval(() => {
            onHold && onHold();
          }, 100);
        }
      }}
      onPressOut={() => {
        if (haptics) {
          Haptics.selectionAsync().then();
        }
        if (intervalId.current !== null) {
          clearInterval(intervalId.current);
          intervalId.current = null;
        }
        finishAnimation();
      }}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
};

export const ButtonText = ({ children, className, ...props }: TextProps) => {
  return (
    <Text
      className={clsx("text-primary-foreground text-lg font-medium", className)}
    >
      {children}
    </Text>
  );
};
