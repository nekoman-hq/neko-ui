import React from "react";

export interface ColorGroup {
  primary: string;
  secondary: string;
}

export interface Theme {
  // Basics
  background: string;
  foreground: string;
  border: string;

  // Card / Popover
  card: string;
  cardForeground: string;

  // Colors
  primary: string;
  primaryForeground: string;
  muted: string;
  mutedForeground: string;

  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;

  // Charts
  chart1: ColorGroup;

  //Segment Control
  segmentBackground: string;
  segmentActiveFont: string;
  segmentInactiveFont: string;

  //Rich Text
  richEditorTitle: string;

  //Checkbox
  checkboxIcon: string;
  checkboxActive: string;
  checkboxInactive: string;

  //ProgressBar
  progressActive: string;
  progressInactive: string;
}

export interface ThemeProviderProps {
  children?: React.ReactNode;
  className?: string;
  theme?: Partial<Theme>;
}
