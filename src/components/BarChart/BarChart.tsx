import React, {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  FlatList,
  Pressable,
  GestureResponderEvent,
  Text,
  Alert,
} from "react-native";

import {
  Canvas,
  RoundedRect,
  LinearGradient,
  vec,
  Shadow,
  Group,
} from "@shopify/react-native-skia";
import { useSharedValue, withTiming } from "react-native-reanimated";
import clsx from "clsx";
import {
  BarChartContextProps,
  BarChartProps,
  BarProps,
  GradientLineProps,
} from "./BarChart.types";
import { keysIn } from "lodash";

const ITEM_WIDTH = 20;

const BarChartContext = createContext<BarChartContextProps | null>(null);

const useBarChartContext = () => {
  const values = useContext(BarChartContext);
  if (!values) {
    throw new Error("Must be within a <BarChart/>!");
  }
  return values;
};

export function BarChart<T>({
  colorTheme,
  duration = 300,
  maxHeight = 100,
  children,
  initialIndex,
}: BarChartProps<T>) {
  const [containerWidth, setContainerWidth] = useState<number>();

  const BarData = React.Children.toArray(children).filter(
    (child) => isValidElement(child) && child.type === Bar,
  );

  const maxValue = useMemo(() => {
    const values = BarData.filter(isValidElement).map(
      (child) => (child.props as BarProps).value || 0,
    );
    return Math.max(...values, 1);
  }, [BarData]);

  const calculateItemHeight = useCallback(
    (progress: number) => {
      if (maxValue <= 1) return ITEM_WIDTH;
      if (progress <= 1) return ITEM_WIDTH;
      return Math.max((maxHeight / maxValue) * progress, ITEM_WIDTH * 1.5);
    },
    [maxValue, maxHeight],
  );

  const length = useMemo(() => BarData.length, [BarData]);
  const itemGap = useMemo(() => {
    const l = Math.min(length, 6);
    if (l <= 1 || containerWidth === undefined) return 0;
    const totalItemWidth = l * ITEM_WIDTH;
    const availableSpaceForGaps = containerWidth - totalItemWidth;
    const numberOfGaps = l;
    return Math.max(0, availableSpaceForGaps / numberOfGaps);
  }, [containerWidth, length]);

  return (
    <BarChartContext.Provider
      value={{
        colorTheme,
        duration,
        calculateItemHeight,
      }}
    >
      <View
        onLayout={(e) => {
          const { width } = e.nativeEvent.layout;
          if (containerWidth !== width) {
            setContainerWidth(width);
          }
        }}
        style={{
          width: "100%",
          alignItems: "center",
          gap: 10,
        }}
      >
        <FlatList
          initialNumToRender={Math.min(length, 6)}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          initialScrollIndex={initialIndex}
          scrollEnabled={length > 5}
          horizontal
          style={{ width: "100%" }}
          contentContainerStyle={{
            gap: length > 5 ? itemGap : 0,
            justifyContent: length <= 4 ? "space-around" : "space-between",
            minWidth: "100%",
            alignItems: "flex-end",
          }}
          data={BarData}
          renderItem={({ item, index }) => <>{item}</>}
        />
      </View>
    </BarChartContext.Provider>
  );
}

export const GradientLine: React.FC<GradientLineProps> = ({
  width,
  height,
  color1,
  color2,
  glow = true,
  duration = 3000,
}) => {
  const radius = width / 2;
  const shadowRadius = radius * 1.5;
  const opacity = useSharedValue(glow ? 1 : 0.15);
  const rectHeight = useSharedValue(10);
  const positionY = useSharedValue(height);

  useEffect(() => {
    opacity.value = withTiming(glow ? 1 : 0.3, { duration });
  }, [glow]);
  useEffect(() => {
    rectHeight.value = withTiming(height, { duration });

    if (positionY.value < height) {
      positionY.value = height;
    }
    positionY.value = withTiming(shadowRadius, { duration });
  }, [height]);

  return (
    <View
      pointerEvents={"box-none"}
      style={{
        width: width + shadowRadius * 2,
        height: height + shadowRadius * 2,
        overflow: "visible",
        justifyContent: "flex-end",
      }}
    >
      <Canvas
        style={{
          width: width + shadowRadius * 2,
          height: height + shadowRadius * 2,
          overflow: "visible",
          alignItems: "flex-end",
          justifyContent: "flex-end",
        }}
      >
        <RoundedRect
          x={shadowRadius}
          y={positionY}
          width={width}
          height={rectHeight}
          r={radius}
          opacity={opacity}
        >
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height)}
            colors={[color1, color2]}
          />
          {glow && (
            <Shadow dx={0} dy={0} blur={shadowRadius * 0.5} color={color1} />
          )}
        </RoundedRect>
      </Canvas>
    </View>
  );
};

export function Bar({
  active = true,
  label = "",
  onPress,
  chartWidth = 20,
  value,
}: BarProps) {
  const {
    duration,
    colorTheme: { primaryColor, secondaryColor },
    calculateItemHeight,
  } = useBarChartContext();

  const itemHeight = useMemo(
    () => calculateItemHeight(value),
    [value, calculateItemHeight],
  );

  return (
    <Pressable
      onPress={(e) => {
        onPress && onPress(e);
      }}
      style={{
        gap: 0,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      <View pointerEvents={"none"}>
        <GradientLine
          glow={active}
          width={chartWidth}
          height={itemHeight}
          color1={primaryColor}
          color2={secondaryColor}
          duration={duration}
        />
      </View>

      {label.length > 0 && (
        <Text
          className={clsx(
            "text-lg",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
