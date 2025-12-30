import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import * as Haptics from "expo-haptics";
import React from "react";
import { SwipeableProps } from "./Swipeable.types";
import { cssInterop } from "nativewind";

cssInterop(ReanimatedSwipeable, {
  className: {
    target: "containerStyle",
  },
});

export const Swipeable = ({ onSubmit, children, icon }: SwipeableProps) => {
  // SharedValues statt useState
  const haptic = useSharedValue(true);
  const submitFlag = useSharedValue(false);

  const opacity = useSharedValue(0.5);

  const setSubmitFlag = (value: boolean) => {
    submitFlag.value = value;
  };

  const renderRightActions = (
    _: SharedValue<number>,
    dragAnimatedValue: SharedValue<number>,
    __: SwipeableMethods,
  ) => {
    const animatedStyle = useAnimatedStyle(() => {
      // dragAnimatedValue ist typischerweise 0 .. -X beim nach links swipen
      const width = interpolate(
        dragAnimatedValue.value,
        [-100, 0],
        [100, 0],
        "clamp",
      );

      const opacityValue = interpolate(
        dragAnimatedValue.value,
        [-100, 0],
        [1, 0],
        "clamp",
      );
      opacity.value = opacityValue;

      // Worklet: manipuliere SharedValues direkt
      if (width >= 90) {
        if (haptic.value) {
          // Haptics muss auf JS-Thread ausgeführt werden
          scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Medium);
          haptic.value = false;
          scheduleOnRN(setSubmitFlag, true);
        }
      } else if (width < 80) {
        haptic.value = true;

        scheduleOnRN(setSubmitFlag, false);
      }

      return {
        width: Math.max(1, width),
        opacity: opacity.value,
        transform: [{ scale: opacityValue }],
      };
    }, [dragAnimatedValue]);

    return (
      <Animated.View
        style={[
          animatedStyle,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        {icon}
      </Animated.View>
    );
  };

  return (
    <ReanimatedSwipeable
      onSwipeableWillOpen={() => {
        if (submitFlag.value) {
          onSubmit(); // Delete ausführen
        }
      }}
      //@ts-ignore
      className={"max-w-[100%]"}
      friction={1.5}
      renderRightActions={renderRightActions}
      rightThreshold={20}
    >
      {children}
    </ReanimatedSwipeable>
  );
};
