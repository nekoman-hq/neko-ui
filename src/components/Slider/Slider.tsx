import React, { useCallback, useState } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  useDerivedValue,
  useAnimatedReaction,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import * as Haptics from "expo-haptics";
import { SliderProps } from "./Slider.types";

const { width: screenWidth } = Dimensions.get("window");

const DEFAULT_SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

export const Slider: React.FC<SliderProps> = ({
  snapPoints,
  initialValue = 0,
  onValueChange,
  onSnapToPoint,
  width = screenWidth - 40,
  trackHeight = 4,
  thumbSize = 20,
  activeTrackColor = "#007AFF",
  inactiveTrackColor = "#E5E5EA",
  thumbColor = "#FFFFFF",
  thumbShadowColor = "#000000",
  snapThreshold = 0.1,
  springConfig = DEFAULT_SPRING_CONFIG,
  hapticTriggerThreshold = 0.02,
  labels = [], // Default to empty array
  activeStepIndicatorColor = activeTrackColor,
  inactiveStepIndicatorColor = inactiveTrackColor,
  onActiveChange = (v) => {},
}) => {
  // Shared values
  const translateX = useSharedValue(initialValue * width);
  const isActive = useSharedValue(false);
  const startX = useSharedValue(0);

  const lastSnapIndex = useSharedValue(-1);

  const lastPosition = useSharedValue(initialValue);
  const [labelText, setLabelText] = useState(labels[0]);

  const currentLabelIndex = useDerivedValue(() => {
    const labelStep = width / (labels.length - 1 || 1);
    return Math.floor((translateX.value + labelStep / 2) / labelStep);
  });

  useAnimatedReaction(
    () => currentLabelIndex.value,
    (newIndex, oldIndex) => {
      if (newIndex !== oldIndex && labels[newIndex]) {
        scheduleOnRN(setLabelText, labels[newIndex]);
      }
    },
    [labels],
  );

  const callOnValueChange = useCallback(
    (value: number) => {
      if (onValueChange) {
        onValueChange(value);
      }
    },
    [onValueChange],
  );

  // Helper function to call onSnapToPoint
  const callOnSnapToPoint = useCallback(
    (index: number, value: number) => {
      if (onSnapToPoint) {
        onSnapToPoint(index, value);
      }
    },
    [onSnapToPoint],
  );

  // Helper function to find nearest snap point
  const findNearestSnapPoint = (
    value: number,
  ): { index: number; snapValue: number } => {
    "worklet";

    let nearestIndex = 0;
    let minDistance = Math.abs(value - snapPoints[0]);

    for (let i = 1; i < snapPoints.length; i++) {
      const distance = Math.abs(value - snapPoints[i]);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    return {
      index: nearestIndex,
      snapValue: snapPoints[nearestIndex],
    };
  };

  // Helper function to trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Helper function to check if user crossed over a snap point
  const checkSnapPointCrossing = (
    currentValue: number,
    previousValue: number,
  ) => {
    "worklet";

    for (let i = 0; i < snapPoints.length; i++) {
      const snapPoint = snapPoints[i];

      const crossedFromLeft =
        previousValue < snapPoint && currentValue >= snapPoint;
      const crossedFromRight =
        previousValue > snapPoint && currentValue <= snapPoint;

      if (crossedFromLeft || crossedFromRight) {
        const distanceToSnapPoint = Math.abs(currentValue - snapPoint);

        if (distanceToSnapPoint <= hapticTriggerThreshold) {
          scheduleOnRN(triggerHaptic);

          // Nur hier callOnSnapToPoint triggern
          scheduleOnRN(callOnSnapToPoint, i, snapPoint);

          lastSnapIndex.value = i;
        }
      }
    }
  };

  const renderLabels = () => {
    const labelStep = (1 / (labels.length - 1 || 1)) * width;

    const animatedLabelStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value - thumbSize / 2 - 4 },
        { translateY: -thumbSize - 20 },
      ],
      backgroundColor: "#123",
      position: "absolute",
      width: thumbSize,
      overflow: "visible",
      opacity: isActive.value
        ? interpolate(
            translateX.value % labelStep,
            [0, labelStep / 2, labelStep],
            [1, 0, 1],
          )
        : withTiming(0),
    }));

    return (
      <Animated.View style={[{ alignItems: "center" }, animatedLabelStyle]}>
        <View
          style={{
            position: "absolute",
            width: width,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <Text className={"color-foreground text-base"}>{labelText}</Text>
        </View>
      </Animated.View>
    );
  };

  // Pan gesture using modern Gesture API
  const panGesture = Gesture.Pan()
    .hitSlop({ top: 150, bottom: 150, left: 150, right: 150 })
    .onStart(() => {
      startX.value = translateX.value;
      isActive.value = true;
      scheduleOnRN(onActiveChange, true);

      lastPosition.value = translateX.value / width;
    })
    .onUpdate((event) => {
      const newTranslateX = startX.value + event.translationX;

      // Clamp between 0 and width
      translateX.value = Math.max(0, Math.min(width, newTranslateX));

      // Call onValueChange
      const normalizedValue = translateX.value / width;

      // Callback bei jedem Positionsupdate
      scheduleOnRN(callOnValueChange, normalizedValue);

      // Check for snap point crossing
      checkSnapPointCrossing(normalizedValue, lastPosition.value);
      lastPosition.value = normalizedValue;
    })
    .onEnd(() => {
      isActive.value = false;
      scheduleOnRN(onActiveChange, false);

      const currentValue = translateX.value / width;
      const { index, snapValue } = findNearestSnapPoint(currentValue);

      const distanceToSnap = Math.abs(currentValue - snapValue);

      if (distanceToSnap <= snapThreshold || snapPoints.length <= 5) {
        scheduleOnRN(callOnSnapToPoint, index, snapValue);
        scheduleOnRN(callOnValueChange, snapValue);

        translateX.value = withSpring(snapValue * width, springConfig);
      }
    });

  // Animated styles for thumb
  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const scale = isActive.value ? 1.2 : 1;
    const elevation = isActive.value ? 8 : 4;

    return {
      transform: [
        { translateX: translateX.value - thumbSize / 2 },
        { scale: withSpring(scale, { damping: 12, stiffness: 200 }) },
      ],
      elevation: withSpring(elevation, { damping: 12, stiffness: 200 }),
      shadowOpacity: withSpring(isActive.value ? 0.3 : 0.15, {
        damping: 12,
        stiffness: 200,
      }),
    };
  });

  // Animated styles for active track
  const activeTrackAnimatedStyle = useAnimatedStyle(() => {
    const trackWidth = Math.max(0, translateX.value);

    return {
      width: trackWidth,
    };
  });

  // Animated styles for snap point indicators
  const snapPointIndicators = snapPoints.map((point, index) => {
    const position = point * width;

    const indicatorStyle = useAnimatedStyle(() => {
      const isBeforeThumb = translateX.value >= position;
      return {
        backgroundColor: isBeforeThumb
          ? activeStepIndicatorColor
          : inactiveStepIndicatorColor,
      };
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.snapIndicator,
          {
            left: position - 1,
          },
          indicatorStyle,
        ]}
      />
    );
  });

  return (
    <View style={[styles.container, { width }]}>
      {/* Track Background */}
      <View
        style={[
          styles.track,
          {
            height: trackHeight,
            backgroundColor: inactiveTrackColor,
          },
        ]}
      />

      {/* Active Track */}
      <Animated.View
        style={[
          styles.activeTrack,
          {
            height: trackHeight,
            backgroundColor: activeTrackColor,
          },
          activeTrackAnimatedStyle,
        ]}
      />

      {/* Snap Point Indicators */}
      {snapPointIndicators}

      {renderLabels()}

      {/* Thumb */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize + 30,
              height: thumbSize + 30,
              justifyContent: "center",
            },
            thumbAnimatedStyle,
          ]}
        >
          <View
            style={[
              styles.thumb,
              {
                width: thumbSize,
                height: thumbSize,
                backgroundColor: thumbColor,
                shadowColor: thumbShadowColor,
              },
            ]}
          ></View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: "center",
    position: "relative",
  },
  track: {
    borderRadius: 2,
    position: "absolute",
    left: 0,
    right: 0,
  },
  activeTrack: {
    borderRadius: 2,
    position: "absolute",
    left: 0,
  },
  thumb: {
    borderRadius: 10,
    position: "absolute",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 4,
    elevation: 4,
  },
  snapIndicator: {
    position: "absolute",
    width: 2,
    height: 8,
    borderRadius: 1,
    top: "50%",
    marginTop: -4,
  },
});

// Usage Example:
/*
import { DefaultSlider } from './DefaultSlider';

const ExampleUsage = () => {
  const [sliderValue, setSliderValue] = useState(0);

  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
      <Slider
        snapPoints={[0, 0.2, 0.4, 0.6, 0.8, 1]}
        initialValue={0.4}
        onValueChange={(value) => {
          setSliderValue(value);
          console.log('Value changed:', value);
        }}
        onSnapToPoint={(index, value) => {
          console.log('Snapped to point:', index, 'with value:', value);
        }}
        activeTrackColor="#FF6B6B"
        thumbColor="#FFFFFF"
        hapticTriggerThreshold={0.02}
        springConfig={{
          damping: 20,
          stiffness: 200,
          mass: 1,
        }}
      />
    </View>
  );
};
*/
