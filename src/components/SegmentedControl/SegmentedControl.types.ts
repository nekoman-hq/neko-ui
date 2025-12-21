import React from "react";
import { Theme } from "@/src/components/ThemeProvider/ThemeProvider.types";

export type SegmentContext = {
  onLayoutPress: (layout: {
    x: number;
    width: number;
    haptic?: boolean;
  }) => void;
  value: string;
  renderLabel?: (
    item: string,
    isActive: boolean,
    color: any,
  ) => React.ReactNode;
  changeRenderLabelLayout: boolean;
  onChange: (label: string) => void;
};

export type SegmentedControlProps = {
  children: React.ReactNode;
  value: string;
  onChange: (item: string) => void;
  renderLabel?: (
    label: string,
    isActive: boolean,
    color: any,
  ) => React.ReactNode;
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
