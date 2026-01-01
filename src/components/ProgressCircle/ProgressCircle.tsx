import React, { useEffect, useMemo } from "react";
import {
  Canvas,
  Group,
  LinearGradient,
  Path,
  Shadow,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { View } from "react-native";
import { ProgressCircleProps } from "./ProgressCircle.types";

function ProgressCircle({
  size: propSize = 100,
  strokeWidth = 15,
  progress: propProgress,
  color1,
  color2,
  children,
  duration = 300,
}: ProgressCircleProps) {
  const shadowRadius = 10;
  let size = propSize - shadowRadius * 4;
  const radius = size / 2 - strokeWidth / 2;
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(
      size / 2 - shadowRadius * 2,
      size / 2 + shadowRadius * 2,
      radius,
    );
    return p;
  }, [size, radius]);

  const origin = { x: size / 2, y: size / 2 };
  const transform = [{ rotate: -Math.PI / 2 }];

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(propProgress / 100, { duration: duration });
  }, [propProgress]);

  return (
    <View
      style={{
        width: size + shadowRadius * 4,
        height: size + shadowRadius * 4,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Canvas
        style={{
          width: size + shadowRadius * 4,
          height: size + shadowRadius * 4,
          overflow: "visible",
        }}
      >
        <Group origin={origin} transform={transform}>
          {/* Hintergrundkreis */}
          <Path
            path={path}
            style="stroke"
            strokeWidth={strokeWidth}
            color="#eee"
            end={1}
            opacity={0.15}
          >
            <LinearGradient
              start={vec(size, size / 2)}
              end={vec(0, size / 2)}
              colors={[color1, color2]}
            />
          </Path>
          {/* Fortschrittskreis */}
          <Path
            path={path}
            style="stroke"
            strokeWidth={strokeWidth}
            strokeCap="round"
            color={"red"}
            start={0}
            end={progress}
          >
            <LinearGradient
              start={vec(size, size / 2)}
              end={vec(0, size / 2)}
              colors={[color1, color2]}
            />

            <Shadow dx={0} dy={0} blur={shadowRadius} color={color1} />
          </Path>
        </Group>
      </Canvas>
      <View
        style={{
          width: size - strokeWidth * 2,
          height: size - strokeWidth * 2,
          position: "absolute",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "100%",
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

export { ProgressCircle };
