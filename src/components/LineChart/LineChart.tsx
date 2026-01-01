import {
  Canvas,
  Skia,
  vec,
  Group,
  Path,
  Shadow,
  CornerPathEffect,
  LinearGradient,
} from "@shopify/react-native-skia";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
  Easing,
  ReduceMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { LineChartProps } from "./LineChart.types";
import clsx from "clsx";

export function LineChart({
  items,
  color1,
  color2,
  labelClassName,
  height = 120,
  radius = 20,
  padding = 20,
  duration = 1500,
}: LineChartProps) {
  const [containerWidth, setContainerWidth] = useState<number>();
  const path = Skia.Path.Make();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (containerWidth === undefined || items.length === 0) return;
    path.reset();

    const availableWidth = containerWidth - 2 * padding;

    const availableHeight = height - 2 * padding;

    const itemGap = availableWidth / (items.length - 1);

    const values = items.map((v) => v.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;

    const pathValues = items.map((v) => {
      const normalized = range > 0 ? (v.value - minValue) / range : 0.5;

      return padding + (1 - normalized) * availableHeight;
    });

    pathValues.forEach((y, i) => {
      const x = padding + itemGap * i;
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });

    progress.value = withTiming(1, {
      duration: duration,
      easing: Easing.bezier(0.68, -0.03, 0.27, 1.08),
      reduceMotion: ReduceMotion.System,
    });
  }, [containerWidth, items, path]);

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={{
        width: "100%",
      }}
    >
      {containerWidth !== undefined && (
        <Canvas style={{ width: "100%", height: height }}>
          <Group>
            <Path
              path={path}
              style="stroke"
              strokeWidth={4}
              strokeJoin="round"
              strokeCap="round"
              color={color1}
              start={0}
              end={progress}
            >
              <Shadow dx={0} dy={0} blur={8} color={color1} />
              <CornerPathEffect r={radius} />
            </Path>
          </Group>

          <Path
            path={path}
            style="stroke"
            strokeWidth={4}
            strokeJoin="round"
            strokeCap="round"
            start={0}
            end={progress}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(containerWidth, 0)}
              colors={[color1, color2]}
            />
            <CornerPathEffect r={radius} />
          </Path>
        </Canvas>
      )}

      <View
        style={{
          width: "100%",
          flexDirection: "row",
          gap: 5,
          justifyContent: "space-between",
        }}
      >
        {items.map((item, index) => {
          return (
            <View key={`${index}-Labelitem-${item.label}`}>
              {item.label && (
                <Text
                  numberOfLines={1}
                  className={clsx(
                    "color-foreground",
                    labelClassName,
                    item.className,
                  )}
                >
                  {item.label}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
