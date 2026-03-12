import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import {
  FlatList,
  LayoutChangeEvent,
  ListRenderItemInfo,
  Text,
  View,
} from "react-native";
import type { WheelPickerV2Props } from "./WheelPickerV2.types";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import Animated, {
  createAnimatedComponent,
  SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  scrollTo,
  AnimatedRef,
} from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";

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
  ref: AnimatedRef<FlatList<number>>;
  scrollY: SharedValue<number>;
  scrollIndex: SharedValue<number>;
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

    const absRelative = Math.abs(relativeIndex);
    const opacity =
      absRelative >= opacityRange
        ? 0.25
        : 1 - (absRelative / opacityRange) * 0.75;

    return {
      opacity,
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
  const { ref, scrollY, scrollIndex, projectedHeight } = usePickerContext();

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      scrollY.value = y;
      scrollIndex.value = y / ITEM_HEIGHT;
    },
  });

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

  return (
    <Animated.FlatList
      ref={ref}
      windowSize={7}
      data={DATA}
      renderItem={(item) => renderItem(item)}
      keyExtractor={(item) => String(item)}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate={0.9938}
      contentContainerStyle={contentContainerStyle}
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

  const aZoneStart = bZoneOuterBoundary;

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
  const { ref, scrollIndex, projectedHeight } = usePickerContext();

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
      const targetY = targetIndex * ITEM_HEIGHT;

      scheduleOnUI(() => {
        "worklet";
        scrollTo(ref, 0, targetY, true);
      });

      resetTouchState();
    },
    [projectedHeight, ref, resetTouchState, scrollIndex],
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
        {children}
      </View>
    </View>
  );
};
const PickerProvider = ({ children }: { children: React.ReactNode }) => {
  const ref = useAnimatedRef<FlatList<number>>();
  const scrollY = useSharedValue(0);
  const scrollIndex = useSharedValue(0);

  const visibleItemCount = 5;
  const paddingItemNumber = Math.floor(visibleItemCount / 2);
  const angle = 160;
  const angleRad = (angle * Math.PI) / 180;

  const arcLength = visibleItemCount * ITEM_HEIGHT;
  const radius = arcLength / angleRad;
  const projectedHeight = 2 * radius * Math.sin(angleRad / 2);

  const visibleRange = paddingItemNumber + 2;
  const opacityRange = paddingItemNumber + 1;

  const value = useMemo<PickerContextType>(
    () => ({
      ref,
      scrollY,
      scrollIndex,
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
      visibleItemCount,
      paddingItemNumber,
      radius,
      projectedHeight,
      visibleRange,
      opacityRange,
    ],
  );

  return (
    <PickerContext.Provider value={value}>
      <PickerViewport>{children}</PickerViewport>
    </PickerContext.Provider>
  );
};

export const WheelPickerV2 = ({}: WheelPickerV2Props) => {
  return (
    <PickerProvider>
      <List />
    </PickerProvider>
  );
};
