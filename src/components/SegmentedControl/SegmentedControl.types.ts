import React from "react";
import { Theme } from "@/src/components/ThemeProvider/ThemeProvider.types";

export type SegmentContext<T = string> = {
  onLayoutPress: (layout: {
    x: number;
    width: number;
    haptic?: boolean;
  }) => void;
  value: T;
  renderLabel?: (item: T, isActive: boolean, color: any) => React.ReactNode;
  changeRenderLabelLayout: boolean;
  onChange: (label: T) => void;
};

export type SegmentedControlProps<T> = {
  children: React.ReactNode;
  value: T;
  onChange: (item: T) => void;
  renderLabel?: (label: T, isActive: boolean, color: any) => React.ReactNode;
  changeRenderLabelLayout?: boolean;
};

export type SegmentedItemProps = {
  label: string;
};

export type SegmentThemeProviderProps = {
  children: React.ReactNode;
  theme: Partial<
    Pick<
      Theme,
      "segmentActiveFont" | "segmentBackground" | "segmentInactiveFont"
    >
  >;
};
