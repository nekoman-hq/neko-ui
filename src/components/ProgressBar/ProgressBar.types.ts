import React from "react";
import { DerivedValue, SharedValue } from "react-native-reanimated";
import { Theme } from "../ThemeProvider/ThemeProvider.types";
import { ColorValue } from "react-native";

export interface ProgressBarProps {
  /**
   * If no maxValue is set, it will be between 0-100
   * If maxValue is set, maxValue will refer as 100%
   */
  value: number;
  maxValue?: number;
  dashes?: number;
  dashGap?: number;

  className?: string;
  backgroundClassName?: string;
  colors?:
    | readonly [ColorValue, ColorValue, ...ColorValue[]]
    | SharedValue<readonly [ColorValue, ColorValue, ...ColorValue[]]>;
}

export interface ProgressBarDashProps {
  width: DerivedValue<number>;
  className?: string;
}

export interface ProgressBarThemeProviderProps {
  theme: Partial<Pick<Theme, "progressActive" | "progressInactive">>;
  children?: React.ReactNode;
  className?: string;
}
