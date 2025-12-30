import React from "react";
import { SharedValue } from "react-native-reanimated";
import { ScrollViewProps } from "react-native";

export interface ParallaxScrollViewProps extends ScrollViewProps {
  children?: React.ReactNode;
}

export interface ParallaxScrollViewContextType {
  scrollOffset: SharedValue<number>;
}

export interface ParallaxItemProps {
  className?: string;
  children?: React.ReactNode;
}
