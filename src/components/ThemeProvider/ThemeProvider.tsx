import React, { createContext, useEffect, useState } from "react";
import type { ThemeProviderProps, Theme } from "./ThemeProvider.types";

import { vars, useColorScheme } from "nativewind";
import { View } from "react-native";
import { convertToRGB } from "@/src/components/ThemeProvider/ThemeProvider.service";

const THEME_KEY_MAP: Record<string, string> = {
  // Basics
  background: "--background",
  foreground: "--foreground",
  border: "--border",

  // Widget / Card
  card: "--card",
  cardForeground: "--card-foreground",

  // Colors
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  success: "--success",
  successForeground: "--success-foreground",
  chart1: "--chart1",

  //SegmentControl
  segmentBackground: "--segment-background",
  segmentActiveFont: "--segment-active",
  segmentInactiveFont: "--segment-inactive",

  //Rich Text
  richEditorTitle: "--rich-editor-title",

  //Checkbox
  checkboxActive: "--checkbox-active",
  checkboxInactive: "--checkbox-inactive",
  checkboxIcon: "--checkbox-icon"
};

export const ThemeProvider = ({
  children,
  className,
  theme: propTheme = {},
}: ThemeProviderProps) => {
  const themeVars: Record<string, string> = {};

  Object.keys(propTheme).forEach((key) => {
    const tailwindKey = THEME_KEY_MAP[key];
    if (!tailwindKey) return;

    const color = propTheme[key as keyof typeof propTheme];
    if (!color) return;

    if (typeof color === "string") {
      const rgb = convertToRGB(color);
      if (!rgb) return;
      themeVars[tailwindKey] = rgb;
      return;
    }

    const rgb1 = convertToRGB(color.primary);
    const rgb2 = convertToRGB(color.secondary);
    if (rgb1) {
      themeVars[tailwindKey + "-primary"] = rgb1;
    }
    if (rgb2) {
      themeVars[tailwindKey + "-secondary"] = rgb2;
    }
  });

  return (
    <View className={className} style={themeVars ? vars(themeVars) : undefined}>
      {children}
    </View>
  );
};
