import React from "react";
import { RichEditor } from "react-native-pell-rich-editor";
import { TextProps } from "react-native";
import { Theme } from "@/src/components/ThemeProvider/ThemeProvider.types";
import { SharedValue } from "react-native-reanimated";

export interface RichTextEditorProps {
  children?: React.ReactNode;
  richTextRef: React.RefObject<RichEditor | null>;
  theme?: Partial<Pick<Theme, "richEditorTitle">>;
  className?: string;
}

export interface RichTextEditorContext {
  richTextRef: React.RefObject<RichEditor | null>;
  keyboardHeight: number;
  focusShared: SharedValue<boolean>;
}

export interface RichTextToolbarProps {
  alwaysVisible?: boolean;
  iconTint?: string;
  selectedIconTint?: string;
}

export interface RichTextTitleProps extends TextProps {
  children: string;
}
