import type {
  RichTextEditorContext,
  RichTextEditorProps,
  RichTextTitleProps,
  RichTextToolbarProps,
} from "./RichTextEditor.types";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  RichToolbar,
  actions,
  RichEditor,
} from "react-native-pell-rich-editor";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import clsx from "clsx";
import { useKeyboard } from "@/src/hooks/Keyboard.hook";
import { ThemeProvider } from "../ThemeProvider/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RichTextContext = createContext<RichTextEditorContext | null>(null);

const useRichTextEditor = () => {
  const values = useContext(RichTextContext);
  if (!values) throw new Error("Component must be within a <RichTextEditor />");

  return values;
};

export const RichTextEditor = ({
  children,
  richTextRef,
  theme = {},
  className,
}: RichTextEditorProps) => {
  const { keyboardHeight } = useKeyboard();

  const focusShared = useSharedValue(false);
  const keyboardHeightShared = useSharedValue(0);

  // keep the shared keyboard height updated when the hook value changes
  useEffect(() => {
    // you can animate keyboard height changes if you'd like
    keyboardHeightShared.value = keyboardHeight;
  }, [keyboardHeight, keyboardHeightShared]);

  const animatedKeyboardBottomStyle = useAnimatedStyle(() => {
    // only use shared values here (no refs). animate to the target value.
    const target = focusShared.value ? keyboardHeightShared.value : 0;
    return {
      paddingBottom: withTiming(target, { duration: 200 }),
    };
  });

  const values = useMemo<RichTextEditorContext>(
    () => ({
      richTextRef,
      keyboardHeight,
      focusShared,
    }),
    [richTextRef, keyboardHeight],
  );

  return (
    <RichTextContext.Provider value={values}>
      <ThemeProvider className={className} theme={theme}>
        <Pressable onPress={() => richTextRef.current?.dismissKeyboard()}>
          <Animated.View
            className={"flex h-screen gap-2"}
            style={[{ width: "100%" }, animatedKeyboardBottomStyle]}
          >
            {children}
          </Animated.View>
        </Pressable>
      </ThemeProvider>
    </RichTextContext.Provider>
  );
};

export const RichTextTitle = ({
  children,
  className,
  ...props
}: RichTextTitleProps) => {
  return (
    <Text
      className={clsx("text-rich-editor-title font-medium text-lg", className)}
      {...props}
    >
      {children}
    </Text>
  );
};

export const RichEditorInput = ({
  placeholder = "",
  initialContentHTML,
  onChange,
  onFocus,
  color,
  placeholderColor,
}: {
  placeholder?: string;
  initialContentHTML?: string;
  onChange?(text: string): void;
  onFocus?(): void;
  color?: string;
  placeholderColor?: string;
}) => {
  const { richTextRef, focusShared } = useRichTextEditor();

  // shared values for anything used inside worklets
  const editorOpacity = useSharedValue(0);

  const richEditorStyle = useAnimatedStyle(() => ({
    opacity: editorOpacity.value,
  }));

  return (
    <Animated.View
      layout={LinearTransition}
      className={"border-card"}
      style={[
        {
          gap: 20,
          borderWidth: 1,
          borderRadius: 15,
          padding: 5,
        },
        richEditorStyle,
      ]}
    >
      <RichEditor
        onFocus={() => {
          // update shared value instead of mutating a ref captured by a worklet
          focusShared.value = true;
          // forward to consumer if provided
          onFocus?.();
        }}
        onBlur={() => {
          focusShared.value = false;
        }}
        scrollEnabled={false}
        containerStyle={{
          paddingVertical: 0,
          paddingHorizontal: 0,
        }}
        editorStyle={{
          color,
          placeholderColor,
          backgroundColor: "transparent",
          contentCSSText: `
              
              ul, ol {
                margin-top: 0;
                margin-bottom: 0;
              }
              ul li {
                margin-top: 4px;
                margin-bottom: 4px;
                padding-left: 0rem;
              }
            `,
        }}
        placeholder={placeholder}
        editorInitializedCallback={() => {
          editorOpacity.value = withTiming(1, { duration: 500 });
        }}
        initialContentHTML={initialContentHTML}
        ref={richTextRef}
        onChange={onChange}
      />
    </Animated.View>
  );
};

export const RichEditorToolbar = ({
  alwaysVisible = false,
  iconTint,
  selectedIconTint,
}: RichTextToolbarProps) => {
  const { richTextRef, keyboardHeight } = useRichTextEditor();
  const contentHeight = useSharedValue(0);
  const { bottom } = useSafeAreaInsets();

  const animatedRichTextEditorStyle = useAnimatedStyle(() => ({
    bottom: withTiming(keyboardHeight + contentHeight.value + bottom + 30),
    display: keyboardHeight > 0 ? "flex" : "none",
  }));

  return (
    <Animated.View
      onLayout={(v) => {
        if (contentHeight.value !== 0) return;
        contentHeight.value = v.nativeEvent.layout.height;
      }}
      className={"absolute bottom-0 self-center"}
      style={[alwaysVisible ? {} : animatedRichTextEditorStyle]}
    >
      <RichToolbar
        editor={richTextRef}
        actions={[
          actions.keyboard,
          actions.setBold,
          actions.insertOrderedList,
          actions.insertBulletsList,
        ]}
        style={{ backgroundColor: "transparent" }}
        iconTint={iconTint}
        selectedIconTint={selectedIconTint}
        startBullets={() =>
          richTextRef.current?.sendAction("", "insertBulletsList")
        }
      />
    </Animated.View>
  );
};
