import React, { useState } from "react";
import { GestureResponderEvent } from "react-native";

export type BarChartProps<T> = {
  colorTheme: { primaryColor: string; secondaryColor: string };

  duration?: number;
  maxHeight?: number;

  initialIndex?: number;

  children: React.ReactNode;
};

export interface BarChartContextProps {
  colorTheme: { primaryColor: string; secondaryColor: string };
  duration: number;
  calculateItemHeight: (progress: number) => number;
}

export interface GradientLineProps {
  width: number;
  height: number;
  color1: string;
  color2: string;
  opacity?: number;
  glow?: boolean;
  duration?: number;
}

export interface BarProps {
  active?: boolean;
  label?: string;
  onPress?(event: GestureResponderEvent): void;
  chartWidth?: number;
  value: number;
}
