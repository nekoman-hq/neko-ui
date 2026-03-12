import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { Text, View } from "react-native";
import type { WheelPickerV2Props } from "./WheelPickerV2.types";
import {
  FlashList,
  type FlashListRef,
  type ListRenderItemInfo,
} from "@shopify/flash-list";
import Animated, {
  AnimatedRef,
  createAnimatedComponent,
  SharedValue,
  useAnimatedRef,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  scrollTo,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import * as Haptics from "expo-haptics";

const AnimatedFlashList = createAnimatedComponent(FlashList<number>);
const AnimatedView = Animated.View;

const DATA = Array.from({ length: 1000 }, (_, i) => i);
const ITEM_HEIGHT = 45;

const TAP_MAX_DURATION_MS = 220;
const TAP_MAX_MOVE_PX = 8;
const TAP_EXTEND_Y = 20;

const ITEM_CONTAINER_STYLE = {
  height: ITEM_HEIGHT,
  alignItems: "center" as const,
  justifyContent: "center" as const,
};

const ITEM_TEXT_STYLE = {
  fontSize: 18,
  fontWeight: "600" as const,
  color: "#fff",
};

const HIDDEN_STYLE = {
  opacity: 0,
} as const;

interface PickerContextType {
  ref: AnimatedRef<FlashListRef<number>>;
  scrollY: SharedValue<number>;
  scrollIndex: SharedValue<number>;
  selectedIndex: SharedValue<number>;
  value?: SharedValue<number>;
  initialIndex: number;
  visibleItemCount: number;
  paddingItemNumber: number;
  radius: number;
  projectedHeight: number;
  visibleRange: number;
  opacityRange: number;
}

const PickerContext = createContext<PickerContextType | null>(null);

const usePickerContext = () => {
  const v = useContext(PickerContext);
  if (!v) throw new Error("PickerContext missing");
  return v;
};

const clamp = (value: number, min: number, max: number) => {
  "worklet";
  return Math.min(Math.max(value, min), max);
};

const getClampedIndexForValue = (value: number) => {
  "worklet";
  return clamp(Math.round(value), 0, DATA.length - 1);
};

const getItemValueForIndex = (index: number) => {
  "worklet";
  return DATA[clamp(index, 0, DATA.length - 1)] ?? DATA[0];
};

const triggerSelectionHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch();
};

const syncValueForIndex = (
  value: SharedValue<number> | undefined,
  index: number,
) => {
  "worklet";
  if (!value) {
    return;
  }

  const nextValue = getItemValueForIndex(index);

  if (value.value !== nextValue) {
    value.value = nextValue;
    scheduleOnRN(triggerSelectionHaptic);
  }
};

const commitOffset = (
  offsetY: number,
  scrollY: SharedValue<number>,
  scrollIndex: SharedValue<number>,
  selectedIndex: SharedValue<number>,
  value: SharedValue<number> | undefined,
) => {
  "worklet";
  const nextIndex = getClampedIndexForValue(offsetY / ITEM_HEIGHT);
  const snappedOffsetY = nextIndex * ITEM_HEIGHT;

  scrollY.value = snappedOffsetY;
  scrollIndex.value = nextIndex;
  selectedIndex.value = nextIndex;
  syncValueForIndex(value, nextIndex);
};

const scrollToIndex = (
  ref: AnimatedRef<FlashListRef<number>>,
  index: number,
  scrollY: SharedValue<number>,
  scrollIndex: SharedValue<number>,
  selectedIndex: SharedValue<number>,
  value: SharedValue<number> | undefined,
  animated: boolean,
) => {
  "worklet";
  const nextIndex = clamp(index, 0, DATA.length - 1);
  const nextOffsetY = nextIndex * ITEM_HEIGHT;

  if (!animated) {
    selectedIndex.value = nextIndex;
    syncValueForIndex(value, nextIndex);
    scrollY.value = nextOffsetY;
    scrollIndex.value = nextIndex;
  }

  scrollTo(ref, 0, nextOffsetY, animated);
};

const useWheelItemStyle = (index: number) => {
  const { scrollIndex, radius, visibleRange, opacityRange } =
    usePickerContext();

  return useAnimatedStyle(() => {
    const relativeIndex = index - scrollIndex.value;

    if (Math.abs(relativeIndex) > visibleRange) {
      return HIDDEN_STYLE;
    }

    const distance = relativeIndex * ITEM_HEIGHT;
    const theta = clamp(distance / radius, -Math.PI / 2, Math.PI / 2);

    const translateY = Number((radius * Math.sin(theta) - distance).toFixed(2));

    return {
      opacity: 1,
      transform: [
        { perspective: 1000 },
        { translateY },
        { rotateX: `${(-theta * 180) / Math.PI}deg` },
      ],
    };
  }, [index, radius, visibleRange, opacityRange]);
};

type WheelItemProps = ListRenderItemInfo<number>;

const WheelLabel = memo(({ value }: { value: number }) => {
  return <Text style={ITEM_TEXT_STYLE}>{value}</Text>;
});

const WheelItem = memo(({ item, index }: WheelItemProps) => {
  const animatedStyle = useWheelItemStyle(index);

  return (
    <AnimatedView style={[ITEM_CONTAINER_STYLE, animatedStyle]}>
      <WheelLabel value={item} />
    </AnimatedView>
  );
});

const List = () => {
  const {
    ref,
    scrollY,
    scrollIndex,
    selectedIndex,
    value: controlledValue,
    projectedHeight,
    initialIndex,
  } = usePickerContext();
  const didCorrectInitialOffsetRef = useRef(false);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      scrollY.value = y;
      scrollIndex.value = y / ITEM_HEIGHT;
    },
    onMomentumEnd: (event) => {
      commitOffset(
        event.contentOffset.y,
        scrollY,
        scrollIndex,
        selectedIndex,
        controlledValue,
      );
    },
  });

  useAnimatedReaction(
    () => scrollY.value,
    (offsetY, previousOffsetY) => {
      const nextIndex = getClampedIndexForValue(offsetY / ITEM_HEIGHT);
      const snappedOffsetY = nextIndex * ITEM_HEIGHT;
      const delta =
        previousOffsetY === null || previousOffsetY === undefined
          ? 0
          : Math.abs(offsetY - previousOffsetY);
      const isSettled = Math.abs(offsetY - snappedOffsetY) < 0.5 && delta < 0.5;
      const isAlreadySynced =
        selectedIndex.value === nextIndex &&
        controlledValue?.value === getItemValueForIndex(nextIndex);

      if (!isSettled || isAlreadySynced) {
        return;
      }

      commitOffset(
        offsetY,
        scrollY,
        scrollIndex,
        selectedIndex,
        controlledValue,
      );
    },
    [controlledValue, scrollIndex, scrollY, selectedIndex],
  );

  const renderItem = useCallback(
    (info: ListRenderItemInfo<number>) => <WheelItem {...info} />,
    [],
  );

  const contentContainerStyle = useMemo(
    () => ({
      paddingVertical: (projectedHeight - ITEM_HEIGHT) / 2,
    }),
    [projectedHeight],
  );

  const handleCommitLayoutEffect = useCallback(() => {
    if (didCorrectInitialOffsetRef.current) {
      return;
    }

    didCorrectInitialOffsetRef.current = true;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollY.value = initialIndex * ITEM_HEIGHT;
        scrollIndex.value = initialIndex;
        selectedIndex.value = initialIndex;
        ref.current?.scrollToOffset({
          offset: initialIndex * ITEM_HEIGHT,
          animated: false,
          skipFirstItemOffset: true,
        });
      });
    });
  }, [initialIndex, ref, scrollIndex, scrollY, selectedIndex]);

  return (
    <AnimatedFlashList
      ref={ref}
      data={DATA}
      renderItem={renderItem}
      keyExtractor={(item) => String(item)}
      maintainVisibleContentPosition={{ disabled: true }}
      onCommitLayoutEffect={handleCommitLayoutEffect}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate={0.9938}
      contentContainerStyle={contentContainerStyle}
      drawDistance={ITEM_HEIGHT * 4}
      maxItemsInRecyclePool={8}
    />
  );
};

const getDeltaIndexFromOffset = (
  offsetFromCenter: number,
  projectedHeight: number,
) => {
  const abs = Math.abs(offsetFromCenter);
  const direction = offsetFromCenter < 0 ? -1 : 1;

  const centerDeadZone = ITEM_HEIGHT * 0.32;

  const bZoneOuterBoundary = ITEM_HEIGHT * 1.55;

  const virtualOuterBoundary = projectedHeight / 2 + ITEM_HEIGHT * 0.75;

  if (abs <= centerDeadZone) {
    return 0;
  }

  if (abs <= bZoneOuterBoundary) {
    return 1 * direction;
  }

  if (abs <= virtualOuterBoundary) {
    return 2 * direction;
  }

  return 2 * direction;
};
const PickerViewport = ({ children }: { children: React.ReactNode }) => {
  const {
    ref,
    scrollIndex,
    scrollY,
    selectedIndex,
    value: controlledValue,
    projectedHeight,
  } = usePickerContext();

  const touchContainerRef = useRef<View | null>(null);
  const touchContainerTopRef = useRef(0);

  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const movedTooFarRef = useRef(false);
  const isMultiTouchRef = useRef(false);

  const extendedHeight = projectedHeight + TAP_EXTEND_Y * 2;

  const measureContainer = useCallback(() => {
    touchContainerRef.current?.measureInWindow((_x, y) => {
      touchContainerTopRef.current = y;
    });
  }, []);

  const resetTouchState = useCallback(() => {
    movedTooFarRef.current = false;
    isMultiTouchRef.current = false;
    touchStartTimeRef.current = 0;
    touchStartXRef.current = 0;
    touchStartYRef.current = 0;
  }, []);

  const handleLayout = useCallback(() => {
    requestAnimationFrame(measureContainer);
  }, [measureContainer]);

  const handleTouchStart = useCallback(
    (event: any) => {
      measureContainer();

      const { nativeEvent } = event;

      isMultiTouchRef.current = (nativeEvent.touches?.length ?? 1) > 1;
      movedTooFarRef.current = false;
      touchStartTimeRef.current = Date.now();
      touchStartXRef.current = nativeEvent.pageX;
      touchStartYRef.current = nativeEvent.pageY;
    },
    [measureContainer],
  );

  const handleTouchMove = useCallback((event: any) => {
    if (isMultiTouchRef.current) {
      return;
    }

    const { nativeEvent } = event;

    if ((nativeEvent.touches?.length ?? 1) > 1) {
      isMultiTouchRef.current = true;
      return;
    }

    const dx = nativeEvent.pageX - touchStartXRef.current;
    const dy = nativeEvent.pageY - touchStartYRef.current;

    if (Math.abs(dx) > TAP_MAX_MOVE_PX || Math.abs(dy) > TAP_MAX_MOVE_PX) {
      movedTooFarRef.current = true;
    }
  }, []);

  const handleTouchCancel = useCallback(() => {
    resetTouchState();
  }, [resetTouchState]);

  const handleTouchEnd = useCallback(
    (event: any) => {
      const duration = Date.now() - touchStartTimeRef.current;

      if (
        isMultiTouchRef.current ||
        movedTooFarRef.current ||
        duration > TAP_MAX_DURATION_MS
      ) {
        resetTouchState();
        return;
      }

      const pageY = event.nativeEvent.pageY;

      // Y relativ zur vergrößerten Touch-Fläche
      const localExtendedY = pageY - touchContainerTopRef.current;

      // In das Koordinatensystem der sichtbaren Picker-Fläche zurückschieben
      const localY = localExtendedY - TAP_EXTEND_Y;

      const centerY = projectedHeight / 2;
      const offsetFromCenter = localY - centerY;

      const deltaIndex = getDeltaIndexFromOffset(
        offsetFromCenter,
        projectedHeight,
      );

      if (deltaIndex === 0) {
        resetTouchState();
        return;
      }

      const currentIndex = Math.round(scrollIndex.value);
      const targetIndex = Math.max(
        0,
        Math.min(DATA.length - 1, currentIndex + deltaIndex),
      );

      scheduleOnUI(() => {
        "worklet";
        scrollToIndex(
          ref,
          targetIndex,
          scrollY,
          scrollIndex,
          selectedIndex,
          controlledValue,
          true,
        );
      });

      resetTouchState();
    },
    [
      controlledValue,
      projectedHeight,
      ref,
      resetTouchState,
      scrollIndex,
      scrollY,
      selectedIndex,
    ],
  );

  return (
    <View
      ref={touchContainerRef}
      style={{
        width: 100,
        height: extendedHeight,
        marginVertical: 100 - TAP_EXTEND_Y,
      }}
      onLayout={handleLayout}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <View
        style={{
          marginTop: TAP_EXTEND_Y,
          width: 100,
          height: projectedHeight,
          overflow: "hidden",
        }}
      >
        <MaskedView
          style={{ flex: 1 }}
          maskElement={
            <LinearGradient
              style={{ flex: 1 }}
              colors={[
                "rgba(0,0,0,0)",
                "rgba(0,0,0,0.2)",
                "rgba(0,0,0,0.7)",
                "rgba(0,0,0,1)",
                "rgba(0,0,0,0.7)",
                "rgba(0,0,0,0.2)",
                "rgba(0,0,0,0)",
              ]}
              locations={[0, 0.08, 0.26, 0.5, 0.74, 0.92, 1]}
            />
          }
        >
          {children}
        </MaskedView>
      </View>
    </View>
  );
};
const PickerProvider = ({
  children,
  value: controlledValue,
}: {
  children: React.ReactNode;
  value?: SharedValue<number>;
}) => {
  const initialIndex = useRef(
    getClampedIndexForValue(controlledValue?.value ?? DATA[0]),
  ).current;

  const ref = useAnimatedRef<FlashListRef<number>>();

  const visibleItemCount = 5;
  const paddingItemNumber = Math.floor(visibleItemCount / 2);
  const angle = 160;
  const angleRad = (angle * Math.PI) / 180;

  const arcLength = visibleItemCount * ITEM_HEIGHT;
  const radius = arcLength / angleRad;
  const projectedHeight = 2 * radius * Math.sin(angleRad / 2);

  const visibleRange = paddingItemNumber + 2;
  const opacityRange = paddingItemNumber + 1;

  const scrollY = useSharedValue(
    initialIndex * ITEM_HEIGHT - (projectedHeight - ITEM_HEIGHT) / 2,
  );
  const scrollIndex = useSharedValue(initialIndex);
  const selectedIndex = useSharedValue(initialIndex);

  useAnimatedReaction(
    () => controlledValue?.value,
    (nextValue) => {
      if (nextValue === undefined) {
        return;
      }

      const nextIndex = getClampedIndexForValue(nextValue);
      const normalizedValue = getItemValueForIndex(nextIndex);
      const shouldScroll = nextIndex !== selectedIndex.value;
      const shouldNormalize = nextValue !== normalizedValue;

      if (!shouldScroll && !shouldNormalize) {
        return;
      }

      scrollToIndex(
        ref,
        nextIndex,
        scrollY,
        scrollIndex,
        selectedIndex,
        controlledValue,
        true,
      );
    },
    [controlledValue, ref, scrollIndex, scrollY, selectedIndex],
  );

  const contextValue = useMemo<PickerContextType>(
    () => ({
      ref,
      scrollY,
      scrollIndex,
      selectedIndex,
      value: controlledValue,
      initialIndex,
      visibleItemCount,
      paddingItemNumber,
      radius,
      projectedHeight,
      visibleRange,
      opacityRange,
    }),
    [
      ref,
      scrollY,
      scrollIndex,
      selectedIndex,
      controlledValue,
      initialIndex,
      visibleItemCount,
      paddingItemNumber,
      radius,
      projectedHeight,
      visibleRange,
      opacityRange,
    ],
  );

  return (
    <PickerContext.Provider value={contextValue}>
      <PickerViewport>{children}</PickerViewport>
    </PickerContext.Provider>
  );
};

export const WheelPickerV2 = ({ value }: WheelPickerV2Props) => {
  return (
    <PickerProvider value={value}>
      <List />
    </PickerProvider>
  );
};
